function CommSession(callbacks) {

    function Client(callbacks) {

        function createUUID(len) {
            var uuid = "";
            for (var j = 0; j < len; j++)
                uuid += Math.floor(Math.random() * 16).toString(16).toUpperCase();
            return uuid;
        }

        var myId = createUUID(32);

        var subList = {};

        var client = RealtimeMessaging.createClient();
        client.setConnectionMetadata(myId);
        client.setClusterUrl('https://ortc-developers.realtime.co/server/ssl/2.1/');

        client.onException = function (ortc, exception) {
            callbacks.onError(exception);
        };

        client.onSubscribed = function (ortc, channel) {
            var entry = subList[channel];
            if (entry) {
                var callback = entry.onSub;
                if (callback)
                    callback();
            }
        };

        client.onConnected = function (ortc) {
            callbacks.onConnected();
            client.subscribe("ortcClientDisconnected", true, function (ortc, channel, message) {
                if (callbacks.onSomeoneDisconnected) {
                    var msg = JSON.parse(message);
                    callbacks.onSomeoneDisconnected(msg.cm);
                }
            });
            client.subscribe("ortcClientUnsubscribed", true, function (ortc, channel, message) {
                if (callbacks.onSomeoneUnsubscribed) {
                    var msg = JSON.parse(message);
                    callbacks.onSomeoneUnsubscribed(msg.cm, msg.ch);
                }
            });
        }

        this.disconnect = function () {
            client.disconnect();
        }

        this.isConnected = function () {
            return client.getIsConnected();
        }

        this.getId = function () {
            return myId;
        }

        this.sub = function (channel, onMsg, onSub) {
            if (channel in subList) {
                if (client.isSubscribed(channel) && onSub)
                    onSub();
            }
            else {
                client.subscribe(channel, true, function (ortc, channel, message) {
                    var msg;
                    try {
                        msg = JSON.parse(message);
                        if (!msg)
                            throw new Error("Void message");
                        else if (!"from" in msg)
                            throw new Error("Undefined sender");
                        else if (!"type" in msg)
                            throw new Error("Undefined type");
                        else {
                            var typeOk = false;
                            for (var key in Msg)
                                if (msg.type == Msg[key]) {
                                    typeOk = true;
                                    break;
                                }
                            if (!typeOk)
                                throw new Error("Unknown type");
                        }
                    } catch (ex) {
                        callbacks.onBadMessage(message, channel, ex);
                        return;
                    }
                    var onMsg = subList[channel].onMsg;
                    if (onMsg && msg.from != myId)
                        onMsg(msg);
                });
            }
            var entry = {
                onMsg: onMsg,
                onSub: onSub,
            }
            subList[channel] = entry;
        }

        this.unsub = function (channel) {
            client.unsubscribe(channel);
            delete subList[channel];
        }

        this.send = function (channel, type, extra) {
            var msg = extra || {};
            msg.type = type;
            msg.from = myId;
            client.send(channel, JSON.stringify(msg));
        }

        client.connect("M50gK1", "token");

    }

    var Msg = {
        IMFREE: 1,
        REQUEST: 2,
        PLAY: 3,
        BYE: 4
    }

    function unexpected(channel, msg) {
        if (callbacks) callbacks.onWarn("Unexpected message " + quote(JSON.stringify(msg)) + " at channel " + quote(channel));
    }

    var clientCallbacks = {
        onBadMessage: function (message, channel, exception) {
            if (callbacks) callbacks.onWarn("Bad message " + quote(message) + " received at channel " + quote(channel) + ": " + exception);
        },
        onError: function (error) {
            if (callbacks) callbacks.onError("Client error: " + quote(error));
        },
        onConnected: function () {
            if (callbacks) callbacks.onInfo("Connected to server");
            client.sub(client.getId());
            if (setup)
                setup.scout.start();
        },
    }

    var client = new Client(clientCallbacks);

    if (callbacks) callbacks.onInfo("Created client with ID: " + quote(client.getId()));

    var setup;

    this.init = function (language) {
        if (callbacks) callbacks.onInfo("Initialized with language " + quote(language.name));
        setup = {
            startingChars: language.startingChars,
            scout: new Scout(language.room),
        };
        if (client.isConnected())
            setup.scout.start();
    }

    function Scout(room) {

        var cache = new function () {
            var list = [];
            var timeoutSec = 8;

            function remove(id) {
                for (var i = 0; i < list.length; i++) {
                    var e = list[i];
                    if (e.id == id) {
                        clearTimeout(e.timer);
                        list.splice(i, 1);
                    }
                }
            }

            function getTimeoutFunc(id) {
                return function () {
                    remove(id)
                };
            }

            this.push = function (id) {
                remove(id);
                var e = {
                    id: id,
                    timer: setTimeout(getTimeoutFunc(id), timeoutSec * 1000),
                };
                list.push(e);
                if (cache.onFree)
                    cache.onFree();
            };

            this.pop = function () {
                var e = list.pop();
                if (e) {
                    clearTimeout(e.timer);
                    return e.id;
                }
                else return null;
            };

            this.clear = function () {
                for (var i = 0; i < list.length; i++)
                    clearTimeout(list[i].timer);
                list = [];
            };

            this.onFree;
        };
        var started = false;
        var listening = false;

        function publish() {
            client.send(room, Msg.IMFREE);
        }

        function stop() {
            if (started) {
                if (callbacks) callbacks.onInfo("Stopped scouting");
                started = false;
                publishTimer.cancel();
                cache.onFree = null;
                client.sub(client.getId());
            }
        }

        var publishTimer = new CommTimer(publish, 5000, true);

        this.start = function () {
            if (!listening) {
                if (callbacks) callbacks.onSearching();
                client.sub(room, function (msg) {
                    if (msg.type == Msg.IMFREE)
                        cache.push(msg.from);
                    else unexpected(room, msg);
                });
                listening = true;
            }
            var id = cache.pop();
            if (id) {
                if (callbacks) callbacks.onInfo("Found cached candidate");
                stop();
                court(id);
            }
            else {
                if (callbacks) callbacks.onInfo("Started scouting");
                started = true;
                client.sub(client.getId(), function (msg) {
                    if (msg.type == Msg.REQUEST) {
                        if (callbacks) callbacks.onInfo("Request received while scouting");
                        stop();
                        var startingCharInd = Math.floor(Math.random() * setup.startingChars.length);
                        var startingChar = setup.startingChars[startingCharInd];
                        var options = {
                            id: msg.from,
                            char: startingChar,
                            len: 1,
                            myTurn: false,
                            channel: client.getId(),
                        };
                        binding = new Binding(options);
                    }
                });
                cache.onFree = function () {
                    if (callbacks) callbacks.onInfo("Found new just published candidate");
                    stop();
                    court(cache.pop());
                };
                publish();
                publishTimer.start();
            }
        }

        this.stop = stop;

        this.isStarted = function () {
            return started;
        }

    }

    function court(id) {
        if (callbacks) callbacks.onInfo("Courting " + quote(id));
        var giveUpTimer = new CommTimer(giveUp, 5000, false);
        function giveUp() {
            if (callbacks) callbacks.onInfo("Stopping courting");
            client.unsub(id);
            giveUpTimer.cancel();
        };
        client.sub(id, function (msg) {
            if (msg.type == Msg.PLAY) {
                if (msg.from == id && msg.to == client.getId()) {
                    giveUpTimer.cancel();
                    var options = {
                        id: id,
                        char: "",
                        len: 0,
                        myTurn: true,
                        channel: id,
                    };
                    binding = new Binding(options);
                }
                else if (msg.from == binding.id || msg.to == binding.id)
                    giveUp();
                else unexpected();
            }
            else if (msg.type == Msg.BYE && (msg.from == id || msg.to == id))
                giveUp();
            else if (msg.type != Msg.REQUEST)
                unexpected();
        }, function () {
            if (callbacks) callbacks.onInfo("Sending bind request");
            client.send(id, Msg.REQUEST);
            giveUpTimer.start();
        });

    }

    function Binding(binding) {

        client.sub(binding.channel, process);
        if (callbacks) callbacks.onInfo("Binding to " + quote(binding.id));
        clientCallbacks.onSomeoneDisconnected = function (id) {
            if (id == binding.id) {
                if (callbacks) callbacks.onInfo("Friend disconnected");
                leave();
            }
        };
        clientCallbacks.onSomeoneUnsubscribed = function (id, channel) {
            if (id == binding.id && channel == binding.channel) {
                if (callbacks) callbacks.onInfo("Friend unsubscribed from bound channel");
                leave();
            }
        };
        notifyType();
        tell(false);

        var repeatTimer = new CommTimer(function () {
            if (callbacks) callbacks.onInfo("Asking for repeat after inactivity");
            tell(true);
            giveUpTimer.start();
        }, 5000, false);

        var giveUpTimer = new CommTimer(function () {
            if (callbacks) callbacks.onInfo("Leaving after inactivity");
            leave();
        }, 5000, false);

        function leave() {
            if (callbacks) callbacks.onInfo("Leaving binding");
            client.send(binding.channel, Msg.BYE);
            if (binding.guest)
                client.unsub(binding.channel);
            repeatTimer.cancel();
            giveUpTimer.cancel();
            clientCallbacks.onSomeoneDisconnected = null;
            clientCallbacks.onSomeoneUnsubscribed = null;
            binding = null;
            if (callbacks) callbacks.onLeave();
        }

        function tell(repeat) {
            var data = {
                len: binding.len,
                char: binding.char,
                repeat: repeat,
                to: binding.id,
            };
            client.send(binding.channel, Msg.PLAY, data);
        }

        function process(msg) {
            var send = false;
            if (msg.type == Msg.PLAY) {
                if (msg.from == binding.id && msg.to == client.getId()) {
                    repeatTimer.start();
                    giveUpTimer.cancel();
                    if (msg.len > binding.len) {
                        binding.len = msg.len;
                        binding.char = msg.char;
                        binding.myTurn = true;
                        notifyType();
                    }
                    if (msg.repeat || msg.len < binding.len)
                        send = true;
                }
                else unexpected();
            }
            else if (msg.type == Msg.BYE && msg.from == binding.id)
                leave();
            else if (msg.type == Msg.REQUEST)
                send = true;
            else
                unexpected();
            if (send)
                tell(false);
        }

        function notifyType() {
            var info = {
                myTurn: binding.myTurn,
                len: binding.len,
                char: binding.char,
            };
            if (callbacks) callbacks.onType(info);
        }

        this.push = function (char) {
            if (!binding.myTurn)
                throw new Error("Not my turn");
            binding.len++;
            binding.char = char;
            binding.myTurn = false;
            tell(false);
        }

    }

    var binding;

    this.push = function (char) {
        if (callbacks) callbacks.onInfo("Pushing character " + quote(char));
        binding.push(char);
    };

    this.close = function () {
        if (callbacks) callbacks.onInfo("Disconnecting");
        callbacks = null;
        client.disconnect();
    };

}
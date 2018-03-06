function CommConsoleCoordinator() {

    var Languages = {
        0: { name: "italian", room: "r_it", startingChars: "ABCDEFGHIMNOPQRSTUVZ", abb: "it" },
        1: { name: "english", room: "r_en", startingChars: "ABCDEFGHIMNOPQRSTUVZ", abb: "en" },
        2: { name: "french", room: "r_fr", startingChars: "ABCDEFGHIMNOPQRSTUVZ", abb: "fr" },
        3: { name: "spanish", room: "r_sp", startingChars: "ABCDEFGHIMNOPQRSTUVZ", abb: "sp" },
        4: { name: "deutsche", room: "r_de", startingChars: "ABCDEFGHIMNOPQRSTUVZ", abb: "de" },
    }

    var validNonANChars = ".,;:?!' ";
    var validANChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    var validChars = validNonANChars + validANChars;

    var cons = new CommConsole();

    var onKey;

    var language;

    var lastCharInput;

    var text;
    var textLen;

    var bound = false;

    var sessionCallbacks = {
        onInfo: function (msg) {
            console.log("Session onInfo: " + msg);
        },
        onWarn: function (msg) {
            console.warn("Session onWarning: " + msg);
        },
        onError: function (msg) {
            console.error("Session onError: " + msg);
            unbind();
            setError(msg);
            notifier.notify();
            notifier.Sounds.NOTIF_BAD();
        },
        onType: function (info) {
            console.debug("Session onType");
            if (!bound) {
                bound = true;
                footer.setNewFriendButton(true);
            }
            setBound(info.myTurn, info.len, info.char);
            notifier.notify();
            notifier.Sounds.NOTIF_MSG();
        },
        onLeave: function () {
            console.debug("Session onLeave");
            unbind();
            setLeft();
            notifier.notify();
            notifier.Sounds.NOTIF_BAD();
        },
        onSearching: function () {
            console.debug("Session onSearching");
            setSearching();
            notifier.notify();
            notifier.Sounds.NOTIF();
        },
    };

    var session;

    function newSession() {
        if (session)
            session.close();
        session = new CommSession(sessionCallbacks);
        text = "";
        textLen = 0;
        lastCharInput = null;
    }

    function setConnecting() {
        cons.setConnecting();
        onKey = null;
    }

    setLanguageSelector = function () {
        function selectLanguage(lang) {
            language = lang;
            setConnecting();
            footer.setLanguageButton(language.abb);
            session.init(language);
            notifier.Sounds.KEY_SPECIAL();
        };
        cons.setLanguageSelector(Languages, selectLanguage);
        onKey = function (res) {
            var lang = Languages[res.raw];
            if (lang)
                selectLanguage(lang);
            else
                notifier.Sounds.KEY_BAD();
        };
    }

    setSearching = function () {
        cons.setSearching();
        onKey = null;
    }

    setBound = function (myTurn, len, char) {
        if (len > textLen)
            text += char;
        if (myTurn) {
            footer.setKeyboard(true);
            function send() {
                footer.setKeyboard(false);
                textLen++;
                text += lastCharInput;
                cons.setNotMyTurn(text);
                onKey = null;
                session.push(lastCharInput);
                lastCharInput = null;
                notifier.Sounds.KEY_SPECIAL();
            };
            cons.setMyTurn(text, lastCharInput, false, send);
            onKey = function (res) {
                if (res.enter && lastCharInput)
                    send();
                else if (res.validChar) {
                    lastCharInput = res.validChar;
                    cons.setMyTurn(text, lastCharInput, false, send);
                    notifier.Sounds.KEY_VALID();
                }
                else {
                    cons.setMyTurn(text, lastCharInput, true, send);
                    notifier.Sounds.KEY_BAD();
                }
            };
        }
        else {
            cons.setNotMyTurn(text);
            onKey = null;
        }
    }

    setLeft = function () {
        function retry() {
            newFriend();
            notifier.Sounds.KEY_SPECIAL();
        };
        cons.setLeft(text, retry);
        onKey = function (res) {
            if (res.enter)
                retry();
            else
                notifier.Sounds.KEY_BAD();
        };
    }

    setError = function (msg) {
        function retry() {
            notifier.Sounds.KEY_SPECIAL();
            if (language) newFriend();
            else newLanguage();
        };
        cons.setError(msg, retry);
        onKey = function (res) {
            if (res.enter)
                retry();
            else
                notifier.Sounds.KEY_BAD();
        };
    }

    function newLanguage() {
        console.log("New language requested");
        footer.setLanguageButton(null);
        footer.setNewFriendButton(false);
        language = null;
        footer.setKeyboard(false);
        newSession();
        setLanguageSelector();
        notifier.notify();
    }

    function unbind() {
        bound = false;
        footer.setNewFriendButton(false);
        footer.setKeyboard(false);
        if (session)
            session.close();
        session = null;
    }

    function newFriend() {
        console.log("New friend requested");
        unbind();
        setConnecting();
        newSession();
        session.init(language);
        notifier.notify();
    }

    this.keyPressed = function (char, enter) {
        if (onKey) {
            var result = {
                enter: enter,
                validChar: validChars.indexOf(char) >= 0 ? char : null,
                raw: char,
            };
            onKey(result);
        }
        else
            notifier.Sounds.KEY_BAD();
    }

    this.shortcutDetected = function (code) {
        if (code == 78) {
            console.log("New friend shortcut detected");
            if (bound) {
                notifier.Sounds.KEY_SPECIAL();
                newFriend();
            }
            else
                notifier.Sounds.KEY_BAD();
        }
        else if (code == 76) {
            console.log("New language shortcut detected");
            if (language) {
                notifier.Sounds.KEY_SPECIAL();
                newLanguage();
            }
            else
                notifier.Sounds.KEY_BAD();
        }
    }

    this.layout = function () {
        cons.layout();
    }

    this.close = function () {
        cons.clear();
        onKey = null;
        if (session)
            session.close();
        session = null;
    }

    this.newLanguage = newLanguage;
    this.newFriend = newFriend;

}
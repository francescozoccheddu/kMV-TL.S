function CommConsole() {

    function updateScroll() {
        var docHeight = $(document).height();
        var scrolldiv = $("#scrolldiv");
        scrolldiv.height(docHeight - footer.getHeight());
        footer.setAggressive(scrolldiv[0].scrollHeight > scrolldiv.height());
    };

    function Stream(type) {
        var table = $("#" + type);
        var head = $("#" + type + "_head");
        var content = $("#" + type + "_content");

        this.hide = function () {
            content.empty();
            head.empty();
            table.hide();
            updateScroll();
        };

        this.show = function (icon) {
            content.empty();
            table.show();
            head.html(icon);
            updateScroll();
        };

        this.Entry = function (text) {

            var entry = $("<entry></entry>");
            var timer;
            var frame;

            content.append(entry);

            function setText(text) {
                if (timer)
                    clearInterval(timer);
                timer = null;
                frame = 0;
                if (text instanceof Array) {
                    function func() {
                        if (entry.parent()) {
                            entry.html(text[frame]);
                            frame = (frame + 1) % text.length;
                        }
                        else {
                            clearInterval(timer);
                            timer = null;
                        }
                        updateScroll();
                    };
                    func();
                    timer = setInterval(func, 250);
                }
                else entry.html(text);
                updateScroll();
                return this;
            };

            this.setText = setText;

            this.addText = function (ch) {
                this.setText(entry.html() + ch);
            };

            this.setOnClick = function (listener, tooltip) {
                entry.click(listener);
                if (listener)
                    entry.attr("class", type + "_clickable");
                else{
                    entry.attr("class", null);
                    entry.attr("title", null);
                }
                if (tooltip)
                    entry.attr("title", tooltip);
                return this;
            };

            setText(text);

        }
    }

    var sErr = new Stream("err");
    var sMsg = new Stream("msg");
    var sInfo = new Stream("info");

    updateScroll();

    this.layout = updateScroll;

    this.setLanguageSelector = function (langs, onSelect) {
        sErr.hide();
        sMsg.hide();
        sInfo.show(CommIcon.LANGUAGE);
        new sInfo.Entry("Choose your language:<br><br>");

        function getListener(lang) {
            return function () {
                onSelect(lang);
            };
        };

        for (var key in langs) {
            var lang = langs[key];
            new sInfo.Entry("&nbsp;&nbsp;&nbsp;[" + key + "]: " + lang.name + "<br>").setOnClick(getListener(lang), "Select " + lang.name + " language");
        }
    }

    this.setConnecting = function () {
        sErr.hide();
        sMsg.hide();
        sInfo.show(CommIcon.SERVER);
        new sInfo.Entry("Connecting to server");
        new sInfo.Entry(["", ".", "..", "..."]);
    }

    this.setSearching = function () {
        sErr.hide();
        sMsg.hide();
        sInfo.show(CommIcon.SEARCHING);
        new sInfo.Entry("Looking for a friend");
        new sInfo.Entry(["", ".", "..", "..."]);
    }

    this.setError = function (msg, onRetry) {
        sInfo.hide();
        sMsg.hide();
        sErr.show(CommIcon.ERROR);
        new sErr.Entry("Error: " + quote(msg) + "<br>");
        new sErr.Entry("Press ENTER to retry.").setOnClick(onRetry, "Try again");
    }

    this.setLeft = function (msg, onNewFriend) {
        sInfo.hide();
        sMsg.show(CommIcon.NONE);
        new sMsg.Entry(msg);
        sErr.show(CommIcon.LEFT);
        new sErr.Entry("Friend's gone. ");
        new sErr.Entry("Press ENTER to start looking for a better one.").setOnClick(onNewFriend, "Try to find another friend");
    }

    this.setMyTurn = function (msg, lastInput, badInput, onSend) {
        sErr.hide();
        sMsg.show(CommIcon.YOURTURN);
        new sMsg.Entry(msg);
        sInfo.show(CommIcon.NONE);
        var charAttr = badInput ? "valid " : "";
        if (lastInput) {
            new sMsg.Entry([lastInput == " " ? "_" : lastInput, " "]);
            new sInfo.Entry("Type in another " + charAttr + "character or ");
            new sInfo.Entry("press ENTER to confirm.").setOnClick(onSend, "Confirm the character you entered");
        }
        else {
            new sMsg.Entry(["&#9646;", "&#9647;"]);
            new sInfo.Entry("It's your turn. Type in a " + charAttr + "character.");
        }
    }

    this.setNotMyTurn = function (msg) {
        sErr.hide();
        sMsg.show(CommIcon.NOTURTURN);
        new sMsg.Entry(msg);
        sInfo.show(CommIcon.NONE);
        new sInfo.Entry("Waiting for friend's turn");
        new sInfo.Entry(["", ".", "..", "..."]);
    }

    this.clear = function () {
        sMsg.hide();
        sErr.hide();
        sInfo.hide();
    }

}






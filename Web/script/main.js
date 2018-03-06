
var notifier;
var coord;
var footer;

$(function () {

    var isChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
    var doAlert = false;
    if (!isChrome && doAlert)
        alert("Currently Chrome is the only supported browser");

    footer = new CommFooter();

    notifier = new CommNotifier();

    coord = new CommConsoleCoordinator();


    $(document).keypress(function (e) {
        var code = e.which;
        var char = String.fromCharCode(code);
        coord.keyPressed(char, code == 13);
    });

    $(document).keydown(function (e) {
        if (e.shiftKey && e.altKey) {
            var code = e.which;
            coord.shortcutDetected(code);
        }
    });

    $(document).on("contextmenu", function (e) {
        e.preventDefault();
        return false;
    });

    $(window).on("beforeunload", coord.close);

    $(window).focus(notifier.windowFocused);

    $(window).blur(notifier.windowBlurred);

    $(window).resize(coord.layout);
    $(document).resize(coord.layout);

    coord.newLanguage();

});

function quote(str) {
    if (typeof str != "string")
        str = JSON.stringify(str);
    return "'" + str + "'";
};

function CommTimer(callback, timeout, repeat) {
    var timer;
    var set = repeat ? setInterval : setTimeout;
    var canc = repeat ? clearInterval : clearTimeout;

    this.start = function () {
        if (timer)
            this.cancel();
        timer = set(callback, timeout);
    }

    this.ensureStarted = function () {
        if (!timer)
            this.start();
    }

    this.cancel = function () {
        if (timer)
            canc(timer);
        timer = null;
    }

    this.isStarted = function () {
        return timer ? true : false;
    }
}

var CommIcon = {
    NONE: "",
    DICE: "&#xe915;",
    KEYBOARD: "&#xe955;",
    SERVER: "&#xe964;",
    YOURTURN: "&#xe96f;",
    NOTURTURN: "&#xe970;",
    SEARCHING: "&#xe986;",
    ERROR: "&#xe999;",
    WEB: "&#xe9c9;",
    LANGUAGE: "&#xe9ca;",
    LEFT: "&#xea14;",
    LOGO: "&#x0297;",
};
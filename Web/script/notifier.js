function CommNotifier() {

    var changeFavicon = true;

    var SoundKeys = {
        KEY_VALID: "key_valid",
        KEY_SPECIAL: "key_special",
        KEY_BAD: "key_bad",
        NOTIF: "notif",
        NOTIF_MSG: "notif_msg",
        NOTIF_BAD: "notif_bad",
    };

    function generatePlayFunc(snd) {
        return function () {
            snd.stop();
            snd.play();
        };
    };

    this.Sounds = {};

    for (var key in SoundKeys) {
        var file = "sound/" + SoundKeys[key];
        var sound = new Howl({
            src: [ file + ".sn", file + ".ogg", file + ".wav"],
            autoplay: false,
            loop: false,
            volume: 0.8,
            format: ["mp3", "ogg", "wav"],
        });
        this.Sounds[key] = generatePlayFunc(sound);
    }

    var Icons = {
        FOCUSED: { file: "default", char: "&#xea34;" },
        BLURRED: { file: "blurred", char: "&#xea35;" },
        BLURRED_NOTIF: { file: "blurred_notif", char: "&#xea36;" },
    }

    function setIcon(icon) {
        footer.setLogo(icon.char);
        if (changeFavicon)
            $("#favicon").attr("href", "icon/" + icon.file + ".ico");
    }

    var hasFocus = false;
    var title = "kMVT:L!S";
    var toggleState;

    function toggle() {
        if (toggleState) {
            document.title = title + " (new message)";
            setIcon(Icons.BLURRED_NOTIF);
        }
        else {
            document.title = title;
            setIcon(Icons.BLURRED);
        }
        toggleState = !toggleState;
    }

    var toggleTimer = new CommTimer(toggle, 1000, true);

    this.windowFocused = function () {
        if (hasFocus != true) {
            hasFocus = true;
            toggleTimer.cancel();
            setIcon(Icons.FOCUSED);
            $(document.body).attr("class", null);
            document.title = title;
        }
    }

    this.windowBlurred = function () {
        if (hasFocus != false) {
            hasFocus = false;
            setIcon(Icons.BLURRED);            
            $(document.body).attr("class", "blurred");
        }
    }

    this.notify = function () {
        if (hasFocus == false && !toggleTimer.isStarted()) {
            toggleState = true;
            toggle();
            toggleTimer.start();
        }
    }

    this.windowFocused();

}
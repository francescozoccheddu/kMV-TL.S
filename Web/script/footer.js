
function CommFooter(onKey) {

    var footer = $("#footer");

    var keyboard = new function () {

        var keyboard = $("#foot_keyboard");
        var showKeyboardButton = $("#foot_showkeyboard");

        var keyboardElement = showKeyboardButton;

        $("#foot_keyboard_vk_hide").click(function () {
            keyboard.hide();
            showKeyboardButton.show();
            keyboardElement = showKeyboardButton;
            coord.layout();
            notifier.Sounds.KEY_SPECIAL();
        });

        showKeyboardButton.click(function () {
            showKeyboardButton.hide();
            keyboard.show();
            keyboardElement = keyboard;
            coord.layout();
            notifier.Sounds.KEY_SPECIAL();
        });

        $("#foot_keyboard_vk_shift").click(function () {
            $(".key").each(function () {
                var me = $(this);
                var alt = me.attr("shift");
                if (alt) {
                    me.attr("shift", me.html());
                    me.html(alt);
                }
            });
            notifier.Sounds.KEY_SPECIAL();
        });

        $("*[vkey]").each(function () {
            $(this).click(function () {
                var ch = $(this).text();
                coord.keyPressed(ch, false);
            });
        });

        $("[vkspace]").click(function () {
            coord.keyPressed(" ", false);
        });

        this.set = function (needed) {
            if (needed)
                keyboardElement.show();
            else
                keyboardElement.hide();
        }
    }

    this.setKeyboard = keyboard.set;

    var newFriendButton = $("#foot_newfriend");

    newFriendButton.click(function () {
        coord.newFriend();
        notifier.Sounds.KEY_SPECIAL();
    });

    this.setNewFriendButton = function (enabled) {
        if (enabled)
            newFriendButton.show();
        else
            newFriendButton.hide();
    }

    var languageButton = $("#foot_language");
    var languageText = $("#foot_language_text");

    languageButton.click(function () {
        coord.newLanguage();
        notifier.Sounds.KEY_SPECIAL();        
    });

    this.setLanguageButton = function (text) {
        if (text) {
            languageText.html(text);
            languageButton.show();
        }
        else
            languageButton.hide();
    }

    $("#foot_contactme").click(function () {
        var win = window.open("mailto:francesco.zoccheddu@programmer.net", "Contact me");
        if (win)
            win.focus();
        else
            console.error("Popups not allowed");
        notifier.Sounds.KEY_SPECIAL();                    
    });

    var logo = $("#foot_logo");

    this.setLogo = function (text) {
        logo.html(text);
    }

    this.setAggressive = function (aggressive) {
        footer.attr("class", aggressive ? "aggressive" : null);
    }

    this.getHeight = function () {
        return footer.outerHeight();
    }

}


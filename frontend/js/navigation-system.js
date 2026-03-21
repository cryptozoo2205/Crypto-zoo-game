window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.navigation = {
    bind() {
        const navButtons = document.querySelectorAll("[data-nav]");

        navButtons.forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const screenName = button.getAttribute("data-nav");
                this.show(screenName);
            };
        });

        return true;
    },

    show(screenName) {
        const screens = document.querySelectorAll('main section[id^="screen-"]');
        const navButtons = document.querySelectorAll("[data-nav]");

        screens.forEach((screen) => {
            screen.classList.add("hidden");
            screen.classList.remove("active-screen");
        });

        navButtons.forEach((button) => {
            button.classList.remove("active-nav");
        });

        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.remove("hidden");
            targetScreen.classList.add("active-screen");
        }

        const activeButton = document.querySelector(`[data-nav="${screenName}"]`);
        if (activeButton) {
            activeButton.classList.add("active-nav");
        }

        if (CryptoZoo.gameplay) {
            CryptoZoo.gameplay.activeScreen = screenName;
        }

        sessionStorage.setItem("cryptozoo_last_screen", screenName);

        if (screenName === "ranking") {
            CryptoZoo.uiRanking?.renderRanking?.();
        }

        if (screenName === "missions") {
            CryptoZoo.ui?.renderExpeditions?.();
        }

        if (screenName === "shop") {
            CryptoZoo.boostSystem?.bindShopButton?.();
        }

        CryptoZoo.ui?.render?.();
        return true;
    }
};
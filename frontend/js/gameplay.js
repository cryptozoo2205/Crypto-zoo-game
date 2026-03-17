window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",

    init() {
        this.bindNavigation();
        this.bindTap();
        this.showScreen("game");
    },

    bindNavigation() {
        const navButtons = document.querySelectorAll("[data-nav]");

        navButtons.forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const screenName = button.getAttribute("data-nav");
                this.showScreen(screenName);
            };
        });
    },

    showScreen(screenName) {
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

        this.activeScreen = screenName;
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = () => {
            const clickValue =
                Number(CryptoZoo.state?.coinsPerClick) ||
                Number(CryptoZoo.config?.clickValue) ||
                1;

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + clickValue;

            if (CryptoZoo.ui && CryptoZoo.ui.render) {
                CryptoZoo.ui.render();
            }

            if (CryptoZoo.api && CryptoZoo.api.savePlayer) {
                CryptoZoo.api.savePlayer();
            }
        };
    }
};
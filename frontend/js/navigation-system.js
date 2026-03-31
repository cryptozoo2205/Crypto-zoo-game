window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.navigation = {
    bind() {
        const navButtons = document.querySelectorAll("[data-nav]");

        navButtons.forEach((button) => {
            if (button.dataset.bound === "1") return;

            button.dataset.bound = "1";
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
        const targetName = String(screenName || "game");
        const screens = document.querySelectorAll('main section[id^="screen-"]');
        const navButtons = document.querySelectorAll("[data-nav]");

        screens.forEach((screen) => {
            screen.classList.add("hidden");
            screen.classList.remove("active-screen");
        });

        navButtons.forEach((button) => {
            button.classList.remove("active-nav");
        });

        const targetScreen = document.getElementById(`screen-${targetName}`);
        if (targetScreen) {
            targetScreen.classList.remove("hidden");
            targetScreen.classList.add("active-screen");
        }

        const activeButton = document.querySelector(`[data-nav="${targetName}"]`);
        if (activeButton) {
            activeButton.classList.add("active-nav");
        }

        if (CryptoZoo.gameplay) {
            CryptoZoo.gameplay.activeScreen = targetName;
        }

        sessionStorage.setItem("cryptozoo_last_screen", targetName);

        CryptoZoo.ui?.renderTopHiddenStats?.();

        if (targetName === "game") {
            CryptoZoo.ui?.renderHome?.();
        } else if (targetName === "zoo") {
            CryptoZoo.ui?.renderZooList?.();
        } else if (targetName === "shop") {
            CryptoZoo.ui?.renderShopItems?.();
            CryptoZoo.gameplay?.bindBoostShopButton?.();
            CryptoZoo.ui?.renderBoostStatus?.();
        } else if (targetName === "missions") {
            CryptoZoo.ui?.renderExpeditions?.();
        } else if (targetName === "ranking") {
            CryptoZoo.uiRanking?.renderRanking?.(false);
        }

        return true;
    }
};
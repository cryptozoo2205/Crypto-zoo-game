window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        console.log("INIT START");

        try {
            if (window.Telegram && window.Telegram.WebApp) {
                try {
                    window.Telegram.WebApp.ready();
                    window.Telegram.WebApp.expand();
                } catch (e) {
                    console.error("Telegram ready/expand error:", e);
                }
            }

            if (CryptoZoo.telegram && typeof CryptoZoo.telegram.setupPlayerIdentity === "function") {
                CryptoZoo.telegram.setupPlayerIdentity();
            }

            if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.normalizeAnimals === "function") {
                CryptoZoo.gameplay.normalizeAnimals();
            }

            if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.loadPlayerState === "function") {
                await CryptoZoo.gameplay.loadPlayerState();
            }

            if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.recalculateCoreStats === "function") {
                CryptoZoo.gameplay.recalculateCoreStats();
            }

            if (CryptoZoo.ui && typeof CryptoZoo.ui.render === "function") {
                CryptoZoo.ui.render();
            }

            if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.bindNavigation === "function") {
                CryptoZoo.gameplay.bindNavigation();
            }

            if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.bindActions === "function") {
                CryptoZoo.gameplay.bindActions();
            }

            if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.startPassiveIncome === "function") {
                CryptoZoo.gameplay.startPassiveIncome();
            }

            if (CryptoZoo.ui && typeof CryptoZoo.ui.showScreen === "function") {
                CryptoZoo.ui.showScreen("game");
            }

            console.log("INIT OK");
        } catch (error) {
            console.error("INIT FATAL ERROR:", error);
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
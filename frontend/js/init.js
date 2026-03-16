window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        try {
            if (CryptoZoo.telegram && CryptoZoo.telegram.init) {
                CryptoZoo.telegram.init();
            }

            if (CryptoZoo.telegram && CryptoZoo.telegram.setupPlayerIdentity) {
                CryptoZoo.telegram.setupPlayerIdentity();
            }

            if (CryptoZoo.gameplay && CryptoZoo.gameplay.normalizeAnimals) {
                CryptoZoo.gameplay.normalizeAnimals();
            }

            if (CryptoZoo.gameplay && CryptoZoo.gameplay.loadPlayerState) {
                await CryptoZoo.gameplay.loadPlayerState();
            }

            if (CryptoZoo.gameplay && CryptoZoo.gameplay.recalculateCoreStats) {
                CryptoZoo.gameplay.recalculateCoreStats();
            }

            if (CryptoZoo.ui && CryptoZoo.ui.render) {
                CryptoZoo.ui.render();
            }

            if (CryptoZoo.gameplay && CryptoZoo.gameplay.bindNavigation) {
                CryptoZoo.gameplay.bindNavigation();
            }

            if (CryptoZoo.gameplay && CryptoZoo.gameplay.bindActions) {
                CryptoZoo.gameplay.bindActions();
            }

            if (CryptoZoo.gameplay && CryptoZoo.gameplay.startPassiveIncome) {
                CryptoZoo.gameplay.startPassiveIncome();
            }

            if (CryptoZoo.ui && CryptoZoo.ui.showScreen) {
                const savedScreen = localStorage.getItem("cryptoZooActiveScreen") || "game";
                CryptoZoo.ui.showScreen(savedScreen);
            }

            setTimeout(function () {
                const loader = document.getElementById("loading-screen");

                if (loader) {
                    loader.style.display = "none";
                }
            }, 800);
        } catch (error) {
            console.error("INIT ERROR:", error);
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
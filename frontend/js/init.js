window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        try {
            CryptoZoo.dom.cacheElements();

            if (CryptoZoo.ui && CryptoZoo.ui.showLoading) {
                CryptoZoo.ui.showLoading();
            }

            CryptoZoo.telegram.setupPlayerIdentity();
            CryptoZoo.gameplay.normalizeAnimals();
            CryptoZoo.gameplay.updateZooIncome();
            CryptoZoo.ui.render();

            CryptoZoo.gameplay.bindNavigation();
            CryptoZoo.gameplay.bindActions();

            await CryptoZoo.gameplay.loadPlayerState();
            await CryptoZoo.gameplay.loadRanking();

            CryptoZoo.ui.showScreen("game");
            CryptoZoo.gameplay.startPassiveIncome();
        } catch (error) {
            console.error("Błąd startu gry:", error);
        } finally {
            const loadingScreen = document.getElementById("loading-screen");

            setTimeout(function () {
                if (loadingScreen) {
                    loadingScreen.classList.add("hide-loading");
                }
            }, 1500);

            setTimeout(function () {
                if (loadingScreen) {
                    loadingScreen.style.display = "none";
                }
            }, 2300);
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
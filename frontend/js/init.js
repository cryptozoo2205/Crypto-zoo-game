window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        try {
            if (CryptoZoo.dom && CryptoZoo.dom.cacheElements) {
                CryptoZoo.dom.cacheElements();
            }

            if (CryptoZoo.telegram && CryptoZoo.telegram.setupPlayerIdentity) {
                CryptoZoo.telegram.setupPlayerIdentity();
            }

            CryptoZoo.gameplay.normalizeAnimals();

            await CryptoZoo.gameplay.loadPlayerState();

            CryptoZoo.gameplay.updateZooIncome();
            CryptoZoo.ui.render();

            CryptoZoo.gameplay.bindNavigation();
            CryptoZoo.gameplay.bindActions();
            CryptoZoo.gameplay.startPassiveIncome();

            CryptoZoo.ui.showScreen("game");
        } catch (error) {
            console.error("Błąd startu gry:", error);
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
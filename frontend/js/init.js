window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        try {
            CryptoZoo.dom.cacheElements();
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
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
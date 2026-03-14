
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        CryptoZoo.dom.cacheElements();
        CryptoZoo.ui.showLoading();

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
        CryptoZoo.ui.hideLoading();
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
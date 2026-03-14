window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.init = {
    async start() {
        try {
            if (CryptoZoo.dom && CryptoZoo.dom.cacheElements) {
                CryptoZoo.dom.cacheElements();
            }
        } catch (error) {
            console.error("Błąd cacheElements:", error);
        }

        try {
            if (CryptoZoo.telegram && CryptoZoo.telegram.setupPlayerIdentity) {
                CryptoZoo.telegram.setupPlayerIdentity();
            }
        } catch (error) {
            console.error("Błąd telegram setup:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.normalizeAnimals) {
                CryptoZoo.gameplay.normalizeAnimals();
            }
        } catch (error) {
            console.error("Błąd normalizeAnimals:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.loadPlayerState) {
                await CryptoZoo.gameplay.loadPlayerState();
            }
        } catch (error) {
            console.error("Błąd loadPlayerState:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.recalculateCoreStats) {
                CryptoZoo.gameplay.recalculateCoreStats();
            }
        } catch (error) {
            console.error("Błąd recalculateCoreStats:", error);
        }

        try {
            if (CryptoZoo.ui && CryptoZoo.ui.render) {
                CryptoZoo.ui.render();
            }
        } catch (error) {
            console.error("Błąd render:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.bindNavigation) {
                CryptoZoo.gameplay.bindNavigation();
            }
        } catch (error) {
            console.error("Błąd bindNavigation:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.bindActions) {
                CryptoZoo.gameplay.bindActions();
            }
        } catch (error) {
            console.error("Błąd bindActions:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.startPassiveIncome) {
                CryptoZoo.gameplay.startPassiveIncome();
            }
        } catch (error) {
            console.error("Błąd startPassiveIncome:", error);
        }

        try {
            if (CryptoZoo.ui && CryptoZoo.ui.showScreen) {
                CryptoZoo.ui.showScreen("game");
            }
        } catch (error) {
            console.error("Błąd showScreen:", error);
        }

        try {
            if (CryptoZoo.gameplay && CryptoZoo.gameplay.loadRanking) {
                await CryptoZoo.gameplay.loadRanking();
            }
        } catch (error) {
            console.error("Błąd loadRanking:", error);
        }

        console.log("Crypto Zoo init OK");
    }
};

document.addEventListener("DOMContentLoaded", function () {
    CryptoZoo.init.start();
});
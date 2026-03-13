window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {
    els: {},

    cacheElements() {
        this.els = {
            coinsCount: document.getElementById("coins-count"),
            level: document.getElementById("level"),
            coinsPerClick: document.getElementById("coins-per-click"),
            upgradeCost: document.getElementById("upgrade-cost"),
            zooIncome: document.getElementById("zoo-income"),
            animalsTotal: document.getElementById("animals-total"),

            monkeyCount: document.getElementById("monkey-count"),
            pandaCount: document.getElementById("panda-count"),
            lionCount: document.getElementById("lion-count"),

            monkeyLevel: document.getElementById("monkey-level"),
            pandaLevel: document.getElementById("panda-level"),
            lionLevel: document.getElementById("lion-level"),

            collectionFound: document.getElementById("collection-found"),
            collectionTotal: document.getElementById("collection-total"),
            commonFound: document.getElementById("common-found"),
            rareFound: document.getElementById("rare-found"),
            epicFound: document.getElementById("epic-found"),

            collectionMonkeyCard: document.getElementById("collection-monkey"),
            collectionPandaCard: document.getElementById("collection-panda"),
            collectionLionCard: document.getElementById("collection-lion"),

            collectionMonkeyStatus: document.getElementById("collection-monkey-status"),
            collectionPandaStatus: document.getElementById("collection-panda-status"),
            collectionLionStatus: document.getElementById("collection-lion-status"),

            tapBtn: document.getElementById("tap-btn"),
            buyUpgradeBtn: document.getElementById("buy-upgrade-btn"),
            buyMonkeyBtn: document.getElementById("buy-monkey-btn"),
            buyPandaBtn: document.getElementById("buy-panda-btn"),
            buyLionBtn: document.getElementById("buy-lion-btn"),
            upgradeMonkeyBtn: document.getElementById("upgrade-monkey-btn"),
            upgradePandaBtn: document.getElementById("upgrade-panda-btn"),
            upgradeLionBtn: document.getElementById("upgrade-lion-btn"),

            navButtons: document.querySelectorAll(".nav-btn"),
            screens: document.querySelectorAll(".screen"),
            rankingList: document.getElementById("ranking-list"),
            coinAnimationContainer: document.getElementById("coin-animation-container"),
            toast: document.getElementById("toast")
        };
    },

    showToast(message) {
        const toast = this.els.toast;
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(function () {
            toast.style.display = "none";
        }, 2200);
    },

    showScreen(screenId) {
        this.els.screens.forEach(function (screen) {
            screen.classList.remove("active-screen");
        });

        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add("active-screen");
        }
    },

    animateCoinsBurst() {
        const container = this.els.coinAnimationContainer;
        if (!container) return;

        for (let i = 0; i < 8; i++) {
            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.floor(Math.random() * 220) - 110) + "px";
            const moveY = (-70 - Math.floor(Math.random() * 140)) + "px";

            coin.style.left = "129px";
            coin.style.top = "85px";
            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            container.appendChild(coin);

            setTimeout(function () {
                coin.remove();
            }, 900);
        }
    },

    updateCollectionCard(card, statusEl, discovered) {
        if (!card || !statusEl) return;

        if (discovered) {
            card.classList.remove("locked");
            card.classList.add("discovered");
            statusEl.textContent = "Odkryte";
            statusEl.classList.remove("locked-status");
            statusEl.classList.add("discovered-status");
        } else {
            card.classList.remove("discovered");
            card.classList.add("locked");
            statusEl.textContent = "Nieodkryte";
            statusEl.classList.remove("discovered-status");
            statusEl.classList.add("locked-status");
        }
    },

    render() {
        const state = window.CryptoZoo.state;
        const zoo = window.CryptoZoo.zoo;
        const els = this.els;

        if (els.coinsCount) els.coinsCount.textContent = state.coins;
        if (els.level) els.level.textContent = state.level;
        if (els.coinsPerClick) els.coinsPerClick.textContent = state.coinsPerClick;
        if (els.upgradeCost) els.upgradeCost.textContent = state.upgradeCost;
        if (els.zooIncome) els.zooIncome.textContent = state.zooIncome;
        if (els.animalsTotal) els.animalsTotal.textContent = zoo.getAnimalsTotal();

        if (els.monkeyCount) els.monkeyCount.textContent = state.animals.monkey.count;
        if (els.pandaCount) els.pandaCount.textContent = state.animals.panda.count;
        if (els.lionCount) els.lionCount.textContent = state.animals.lion.count;

        if (els.monkeyLevel) els.monkeyLevel.textContent = state.animals.monkey.level;
        if (els.pandaLevel) els.pandaLevel.textContent = state.animals.panda.level;
        if (els.lionLevel) els.lionLevel.textContent = state.animals.lion.level;

        if (els.upgradeMonkeyBtn) {
            els.upgradeMonkeyBtn.textContent = `Lvl Up (${zoo.getAnimalUpgradeCost("monkey")})`;
        }
        if (els.upgradePandaBtn) {
            els.upgradePandaBtn.textContent = `Lvl Up (${zoo.getAnimalUpgradeCost("panda")})`;
        }
        if (els.upgradeLionBtn) {
            els.upgradeLionBtn.textContent = `Lvl Up (${zoo.getAnimalUpgradeCost("lion")})`;
        }

        const monkeyDiscovered = zoo.isDiscovered("monkey");
        const pandaDiscovered = zoo.isDiscovered("panda");
        const lionDiscovered = zoo.isDiscovered("lion");

        if (els.collectionFound) els.collectionFound.textContent = zoo.getCollectionFoundCount();
        if (els.collectionTotal) els.collectionTotal.textContent = 3;
        if (els.commonFound) els.commonFound.textContent = `${monkeyDiscovered ? 1 : 0}/1`;
        if (els.rareFound) els.rareFound.textContent = `${pandaDiscovered ? 1 : 0}/1`;
        if (els.epicFound) els.epicFound.textContent = `${lionDiscovered ? 1 : 0}/1`;

        this.updateCollectionCard(els.collectionMonkeyCard, els.collectionMonkeyStatus, monkeyDiscovered);
        this.updateCollectionCard(els.collectionPandaCard, els.collectionPandaStatus, pandaDiscovered);
        this.updateCollectionCard(els.collectionLionCard, els.collectionLionStatus, lionDiscovered);
    }
};
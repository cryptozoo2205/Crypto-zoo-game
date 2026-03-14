
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.dom = {
    cacheElements() {
        const state = CryptoZoo.state;

        state.els = {
            loadingScreen: document.getElementById("loading-screen"),

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
    }
};
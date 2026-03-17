window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.dom = {
    cacheElements() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.els = {
            app: document.getElementById("app"),
            game: document.getElementById("game"),

            coins: document.getElementById("coins"),
            gems: document.getElementById("gems"),
            rewardBalance: document.getElementById("rewardBalance"),
            level: document.getElementById("level"),
            coinsPerClick: document.getElementById("coinsPerClick"),
            zooIncome: document.getElementById("zooIncome"),

            tapButton: document.getElementById("tapButton"),

            zooList: document.getElementById("zooList"),
            shopList: document.getElementById("shopList"),
            boxesBuyList: document.getElementById("boxesBuyList"),
            boxesList: document.getElementById("boxesList"),
            missionsList: document.getElementById("missionsList"),
            rankingList: document.getElementById("rankingList"),

            wheel: document.getElementById("wheel"),
            wheelPointer: document.getElementById("wheelPointer"),
            spinWheelBtn: document.getElementById("spinWheelBtn"),
            wheelRewardText: document.getElementById("wheelRewardText"),

            memoryBoard: document.getElementById("memoryBoard"),
            startMemoryBtn: document.getElementById("startMemoryBtn"),
            memoryStatus: document.getElementById("memoryStatus"),

            navButtons: document.querySelectorAll("[data-nav]"),
            screens: document.querySelectorAll('main section[id^="screen-"]'),
            boxButtons: document.querySelectorAll("[data-box-type]"),

            toast: document.getElementById("toast")
        };

        return CryptoZoo.state.els;
    },

    get(id) {
        return document.getElementById(id);
    }
};
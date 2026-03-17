window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = async function () {
    console.log("Crypto Zoo start");

    try {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.config = CryptoZoo.config || {};

        if (CryptoZoo.dom && typeof CryptoZoo.dom.cacheElements === "function") {
            CryptoZoo.dom.cacheElements();
        }

        if (!CryptoZoo.state.boxes) {
            CryptoZoo.state.boxes = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
        }

        if (CryptoZoo.telegram && typeof CryptoZoo.telegram.init === "function") {
            CryptoZoo.telegram.init();
        }

        if (CryptoZoo.api && typeof CryptoZoo.api.loadPlayer === "function") {
            await CryptoZoo.api.loadPlayer();
        }

        if (CryptoZoo.dom && typeof CryptoZoo.dom.cacheElements === "function") {
            CryptoZoo.dom.cacheElements();
        }

        if (!CryptoZoo.state.boxes) {
            CryptoZoo.state.boxes = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
        }

        if (CryptoZoo.boxes && typeof CryptoZoo.boxes.init === "function") {
            CryptoZoo.boxes.init();
        }

        if (CryptoZoo.shop && typeof CryptoZoo.shop.init === "function") {
            CryptoZoo.shop.init();
        }

        if (CryptoZoo.minigames && typeof CryptoZoo.minigames.init === "function") {
            CryptoZoo.minigames.init();
        }

        if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.init === "function") {
            CryptoZoo.gameplay.init();
        }

        if (CryptoZoo.ui && typeof CryptoZoo.ui.render === "function") {
            CryptoZoo.ui.render();
        }
    } catch (error) {
        console.error("Init error:", error);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    if (typeof CryptoZoo.init === "function") {
        CryptoZoo.init();
    }
});
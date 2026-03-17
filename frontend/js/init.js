window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = async function () {
    console.log("Crypto Zoo start");

    const loadingPercent = document.getElementById("loadingPercent");
    const loadingBarFill = document.getElementById("loadingBarFill");
    const loadingScreen = document.getElementById("loading-screen");

    const setLoading = function (value) {
        const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

        if (loadingPercent) {
            loadingPercent.textContent = safeValue + "%";
        }

        if (loadingBarFill) {
            loadingBarFill.style.width = safeValue + "%";
        }
    };

    try {
        setLoading(10);

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.config = CryptoZoo.config || {};

        if (CryptoZoo.dom && typeof CryptoZoo.dom.cacheElements === "function") {
            CryptoZoo.dom.cacheElements();
        }

        setLoading(25);

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

        setLoading(40);

        if (CryptoZoo.api && typeof CryptoZoo.api.loadPlayer === "function") {
            await CryptoZoo.api.loadPlayer();
        }

        if (CryptoZoo.dom && typeof CryptoZoo.dom.cacheElements === "function") {
            CryptoZoo.dom.cacheElements();
        }

        setLoading(60);

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

        setLoading(85);

        if (CryptoZoo.ui && typeof CryptoZoo.ui.render === "function") {
            CryptoZoo.ui.render();
        }

        setLoading(100);

        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add("loading-hidden");
            }
        }, 350);
    } catch (error) {
        console.error("Init error:", error);

        if (loadingScreen) {
            loadingScreen.classList.add("loading-hidden");
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    if (typeof CryptoZoo.init === "function") {
        CryptoZoo.init();
    }
});
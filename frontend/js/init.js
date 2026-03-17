window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = async function () {
    console.log("Crypto Zoo start");

    try {
        if (CryptoZoo.telegram && CryptoZoo.telegram.init) {
            CryptoZoo.telegram.init();
        }

        if (CryptoZoo.api && CryptoZoo.api.loadPlayer) {
            await CryptoZoo.api.loadPlayer();
        }

        if (CryptoZoo.ui && CryptoZoo.ui.render) {
            CryptoZoo.ui.render();
        }

        if (CryptoZoo.boxes && CryptoZoo.boxes.init) {
            CryptoZoo.boxes.init();
        }

        if (CryptoZoo.gameplay && CryptoZoo.gameplay.init) {
            CryptoZoo.gameplay.init();
        }
    } catch (error) {
        console.error("Init error:", error);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    if (CryptoZoo.init) {
        CryptoZoo.init();
    }
});
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = async function () {
    console.log("🚀 Crypto Zoo start");

    const loadingPercent = document.getElementById("loadingPercent");
    const loadingBarFill = document.getElementById("loadingBarFill");
    const loadingScreen = document.getElementById("loading-screen");

    const loadingStartTime = Date.now();
    const minimumLoadingTime = 2200;

    const setLoading = function (value) {
        const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

        if (loadingPercent) {
            loadingPercent.textContent = safeValue + "%";
        }

        if (loadingBarFill) {
            loadingBarFill.style.width = safeValue + "%";
        }
    };

    const finishLoading = async function () {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(0, minimumLoadingTime - elapsed);

        if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        setLoading(100);

        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add("loading-hidden");
            }
        }, 250);
    };

    try {
        setLoading(8);

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.config = CryptoZoo.config || {};

        CryptoZoo.dom?.cacheElements?.();

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(20);

        if (!CryptoZoo.state.boxes) {
            CryptoZoo.state.boxes = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
        }

        CryptoZoo.telegram?.init?.();

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(35);

        if (CryptoZoo.api?.loadPlayer) {
            await CryptoZoo.api.loadPlayer();
        }

        CryptoZoo.dom?.cacheElements?.();

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(52);

        CryptoZoo.boxes?.init?.();
        CryptoZoo.shop?.init?.();
        CryptoZoo.minigames?.init?.();

        // 🔥 NAJWAŻNIEJSZE
        CryptoZoo.gameplay?.init?.();
        console.log("✅ gameplay init OK");

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(78);

        CryptoZoo.ui?.render?.();
        console.log("✅ ui render OK");

        // 🔥 FIX: STAŁY RENDER LOOP (usuwa problem "zamrożonej gry")
        if (!window.__cryptoZooRenderLoopStarted) {
            window.__cryptoZooRenderLoopStarted = true;

            setInterval(() => {
                CryptoZoo.ui?.render?.();
            }, 1000);
        }

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(92);

        await finishLoading();

    } catch (error) {
        console.error("❌ Init error:", error);
        await finishLoading();
    }
};

document.addEventListener("DOMContentLoaded", function () {
    if (typeof CryptoZoo.init === "function") {
        CryptoZoo.init();
    }
});
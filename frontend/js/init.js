console.log(
    window.CryptoZoo.TEST_MODE
        ? "🧪 TEST MODE"
        : "💾 NORMAL MODE"
);

window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = async function () {
    const loadingPercent = document.getElementById("loadingPercent");
    const loadingBarFill = document.getElementById("loadingBarFill");
    const loadingScreen = document.getElementById("loading-screen");

    const loadingStartTime = Date.now();
    const minimumLoadingTime = 2200;

    const setViewportVars = function () {
        const appHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        document.documentElement.style.setProperty("--app-height", `${appHeight}px`);
    };

    const setupResponsiveEnvironment = function () {
        setViewportVars();

        if (!window.__cryptoZooViewportBound) {
            window.__cryptoZooViewportBound = true;

            window.addEventListener("resize", setViewportVars);
            window.addEventListener("orientationchange", setViewportVars);

            if (window.visualViewport) {
                window.visualViewport.addEventListener("resize", setViewportVars);
            }
        }

        if (window.Telegram && window.Telegram.WebApp) {
            document.body.classList.add("telegram-webapp");

            try {
                window.Telegram.WebApp.ready();
            } catch (error) {
                console.warn("Telegram WebApp ready error:", error);
            }

            try {
                window.Telegram.WebApp.expand();
            } catch (error) {
                console.warn("Telegram WebApp expand error:", error);
            }
        }
    };

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
        setupResponsiveEnvironment();
        setLoading(8);

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.config = CryptoZoo.config || {};

        CryptoZoo.dom?.cacheElements?.();

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(20);

        CryptoZoo.telegram?.init?.();
        setViewportVars();

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(35);

        if (CryptoZoo.api?.loadPlayer) {
            await CryptoZoo.api.loadPlayer();
        }

        CryptoZoo.dom?.cacheElements?.();
        setViewportVars();

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(52);

        CryptoZoo.shop?.init?.();
        CryptoZoo.minigames?.init?.();

        CryptoZoo.gameplay?.init?.();
        console.log("✅ gameplay init OK");

        await new Promise((resolve) => setTimeout(resolve, 180));
        setLoading(78);

        CryptoZoo.ui?.render?.();
        console.log("✅ ui render OK");

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

window.enableTestMode = function () {
    localStorage.setItem("cryptozoo_test_mode", "1");
    location.reload();
};

window.disableTestMode = function () {
    localStorage.removeItem("cryptozoo_test_mode");
    location.reload();
};
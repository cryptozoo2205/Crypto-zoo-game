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

    const setupCommercePointerRouter = function () {
        if (window.__cryptoZooCommerceRouterBound) return;
        window.__cryptoZooCommerceRouterBound = true;

        let lastHandledAt = 0;
        let lastHandledKey = "";

        document.addEventListener(
            "pointerup",
            function (event) {
                const target = event.target;
                if (!target || typeof target.closest !== "function") return;

                const now = Date.now();

                const shopBuyBtn = target.closest("[id^='buy-shop-']");
                if (shopBuyBtn) {
                    const itemId = String(shopBuyBtn.id || "").replace("buy-shop-", "");
                    const dedupeKey = `shop:${itemId}`;

                    if (now - lastHandledAt < 350 && lastHandledKey === dedupeKey) {
                        return;
                    }

                    lastHandledAt = now;
                    lastHandledKey = dedupeKey;

                    if (itemId) {
                        CryptoZoo.gameplay?.buyShopItem?.(itemId);
                    }
                    return;
                }

                const buyBoxBtn = target.closest("[data-box-type]");
                if (buyBoxBtn) {
                    const type = buyBoxBtn.getAttribute("data-box-type") || "";
                    const dedupeKey = `buybox:${type}`;

                    if (now - lastHandledAt < 350 && lastHandledKey === dedupeKey) {
                        return;
                    }

                    lastHandledAt = now;
                    lastHandledKey = dedupeKey;

                    if (type) {
                        CryptoZoo.boxes?.buy?.(type);
                    }
                    return;
                }

                const openBoxBtn = target.closest("[id^='open-box-']");
                if (openBoxBtn) {
                    const type = String(openBoxBtn.id || "").replace("open-box-", "");
                    const dedupeKey = `openbox:${type}`;

                    if (now - lastHandledAt < 350 && lastHandledKey === dedupeKey) {
                        return;
                    }

                    lastHandledAt = now;
                    lastHandledKey = dedupeKey;

                    if (type) {
                        CryptoZoo.boxes?.open?.(type);
                    }
                }
            },
            true
        );
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
        setupCommercePointerRouter();
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

        CryptoZoo.boxes?.init?.();
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
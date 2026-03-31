window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,
    minLoadingVisibleMs: 1400,
    startTimestamp: 0,
    lifecycleBound: false,

    setLoadingProgress(percent) {
        const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

        const fill = document.getElementById("loadingBarFill");
        const text = document.getElementById("loadingPercent");

        if (fill) {
            fill.style.width = safePercent + "%";
        }

        if (text) {
            text.textContent = safePercent + "%";
        }
    },

    hideLoadingScreen() {
        const screen = document.getElementById("loading-screen");
        if (!screen) return;

        screen.classList.add("loading-hidden");
        screen.style.opacity = "0";
        screen.style.pointerEvents = "none";
        screen.style.visibility = "hidden";

        setTimeout(() => {
            screen.style.display = "none";
        }, 350);
    },

    async ensureMinimumLoadingTime() {
        const elapsed = Date.now() - this.startTimestamp;
        const waitMs = Math.max(0, this.minLoadingVisibleMs - elapsed);

        if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
    },

    async runSafe(fn) {
        try {
            if (typeof fn === "function") {
                return await fn();
            }
        } catch (error) {
            console.error(error);
        }

        return null;
    },

    markTelegramBody() {
        if (window.Telegram?.WebApp) {
            document.body.classList.add("telegram-webapp");
        }
    },

    forceReleaseBlockingLayers() {
        this.hideLoadingScreen();

        const hiddenModalIds = [
            "profileModal",
            "settingsModal",
            "dailyRewardModal"
        ];

        hiddenModalIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el && el.classList.contains("hidden")) {
                el.style.pointerEvents = "none";
                el.style.visibility = "hidden";
            }
        });
    },

    handleAppResume() {
        this.runSafe(async () => {
            this.markTelegramBody();
            CryptoZoo.telegram?.forceFullscreen?.();
            CryptoZoo.telegram?.applyViewportFix?.();
            CryptoZoo.telegram?.applyIdentityToUi?.();
            this.forceReleaseBlockingLayers();
            CryptoZoo.ui?.render?.();

            setTimeout(() => {
                CryptoZoo.telegram?.applyViewportFix?.();
                this.forceReleaseBlockingLayers();
            }, 120);

            setTimeout(() => {
                CryptoZoo.telegram?.applyViewportFix?.();
                this.forceReleaseBlockingLayers();
            }, 350);

            setTimeout(() => {
                CryptoZoo.telegram?.applyViewportFix?.();
                this.forceReleaseBlockingLayers();
            }, 800);
        });
    },

    bindLifecycleEvents() {
        if (this.lifecycleBound) return;
        this.lifecycleBound = true;

        const resume = () => {
            this.handleAppResume();
        };

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                resume();
            }
        });

        window.addEventListener("focus", resume, { passive: true });
        window.addEventListener("pageshow", resume, { passive: true });
        window.addEventListener("resize", resume, { passive: true });
        window.addEventListener("orientationchange", resume, { passive: true });
    },

    async start() {
        if (this.started) return;
        this.started = true;
        this.startTimestamp = Date.now();

        this.markTelegramBody();
        this.setLoadingProgress(4);

        await this.runSafe(async () => {
            CryptoZoo.lang?.init?.();
        });

        this.setLoadingProgress(10);

        await this.runSafe(async () => {
            CryptoZoo.uiSettings?.initSettings?.();
        });

        this.setLoadingProgress(18);

        await this.runSafe(async () => {
            CryptoZoo.audio?.init?.();
        });

        this.setLoadingProgress(28);

        await this.runSafe(async () => {
            CryptoZoo.telegram?.init?.();
        });

        this.setLoadingProgress(44);

        await this.runSafe(async () => {
            await CryptoZoo.api?.init?.();
        });

        this.setLoadingProgress(56);

        await this.runSafe(async () => {
            CryptoZoo.uiFaq?.close?.();
        });

        this.setLoadingProgress(68);

        await this.runSafe(async () => {
            CryptoZoo.gameplay?.init?.();
        });

        this.setLoadingProgress(75);

        await this.runSafe(async () => {
            CryptoZoo.depositBind?.init?.();
        });

        this.setLoadingProgress(82);

        await this.runSafe(async () => {
            CryptoZoo.depositVerifyUI?.init?.();
        });

        this.setLoadingProgress(88);

        await this.runSafe(async () => {
            CryptoZoo.minigames?.init?.();
        });

        this.setLoadingProgress(92);

        await this.runSafe(async () => {
            CryptoZoo.ui?.render?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.telegram?.forceFullscreen?.();
            CryptoZoo.telegram?.applyIdentityToUi?.();
            CryptoZoo.telegram?.applyViewportFix?.();

            CryptoZoo.ui?.bindHomeButtons?.();
            CryptoZoo.uiSettings?.bindSettingsModal?.();
            CryptoZoo.uiProfile?.bindProfileModal?.();

            this.bindLifecycleEvents();
        });

        this.setLoadingProgress(100);

        await this.ensureMinimumLoadingTime();

        setTimeout(() => {
            this.hideLoadingScreen();
            this.handleAppResume();
        }, 220);

        setTimeout(() => {
            this.handleAppResume();
        }, 600);

        setTimeout(() => {
            this.handleAppResume();
        }, 1200);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await CryptoZoo.init.start();
});
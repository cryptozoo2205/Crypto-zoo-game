window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,
    minLoadingVisibleMs: 180,
    startTimestamp: 0,
    lifecycleBound: false,
    resumeScheduled: false,
    loadingHidden: false,

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
        if (this.loadingHidden) return;
        this.loadingHidden = true;

        const screen = document.getElementById("loading-screen");
        if (!screen) return;

        screen.classList.add("loading-hidden");

        setTimeout(() => {
            try {
                screen.remove();
            } catch (error) {
                console.warn("loading-screen remove failed:", error);
            }
        }, 120);
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

    refreshLoadedUi() {
        this.runSafe(async () => {
            CryptoZoo.ui?.renderTopHiddenStats?.();
            CryptoZoo.ui?.renderHome?.();
            CryptoZoo.ui?.renderZooList?.();
            CryptoZoo.ui?.renderExpeditions?.();
            CryptoZoo.ui?.renderShopItems?.();
            CryptoZoo.ui?.renderCurrentScreen?.();
            CryptoZoo.ui?.renderOpenModalsOnly?.();
            CryptoZoo.expeditionRegionsUi?.render?.();
        });
    },

    scheduleResume() {
        if (this.resumeScheduled) return;
        this.resumeScheduled = true;

        setTimeout(() => {
            this.resumeScheduled = false;
            this.handleAppResume();
        }, 120);
    },

    handleAppResume() {
        this.runSafe(async () => {
            CryptoZoo.telegram?.forceFullscreen?.();
            CryptoZoo.telegram?.applyViewportFix?.();
            CryptoZoo.telegram?.applyIdentityToUi?.();
            CryptoZoo.gameplay?.requestRender?.(true);
            this.refreshLoadedUi();
        });
    },

    bindLifecycleEvents() {
        if (this.lifecycleBound) return;
        this.lifecycleBound = true;

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.scheduleResume();
            }
        });

        window.addEventListener("focus", () => {
            this.scheduleResume();
        }, { passive: true });

        window.addEventListener("pageshow", () => {
            this.scheduleResume();
        }, { passive: true });

        let resizeTimer = null;

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.scheduleResume();
            }, 180);
        }, { passive: true });

        window.addEventListener("orientationchange", () => {
            setTimeout(() => {
                this.scheduleResume();
            }, 220);
        }, { passive: true });
    },

    runDeferredTasks() {
        setTimeout(() => {
            this.runSafe(async () => {
                CryptoZoo.depositBind?.init?.();
            });
        }, 60);

        setTimeout(() => {
            this.runSafe(async () => {
                CryptoZoo.depositVerifyUI?.init?.();
            });
        }, 120);

        setTimeout(() => {
            this.runSafe(async () => {
                CryptoZoo.minigames?.init?.();
            });
        }, 180);

        setTimeout(() => {
            this.runSafe(async () => {
                CryptoZoo.uiFaq?.close?.();
            });
        }, 220);

        setTimeout(() => {
            this.runSafe(async () => {
                CryptoZoo.uiSettings?.bindSettingsModal?.();
                CryptoZoo.uiProfile?.bindProfileModal?.();
                CryptoZoo.ui?.bindHomeButtons?.();
                CryptoZoo.ads?.updateOfflineUi?.();
                this.refreshLoadedUi();
            });
        }, 260);

        setTimeout(() => {
            this.scheduleResume();
        }, 320);
    },

    async start() {
        if (this.started) return;
        this.started = true;
        this.startTimestamp = Date.now();

        this.setLoadingProgress(2);

        await this.runSafe(async () => {
            await CryptoZoo.htmlLoader?.init?.();
        });

        this.setLoadingProgress(5);

        await this.runSafe(async () => {
            CryptoZoo.lang?.init?.();
        });

        this.setLoadingProgress(14);

        await this.runSafe(async () => {
            CryptoZoo.uiSettings?.initSettings?.();
        });

        this.setLoadingProgress(24);

        await this.runSafe(async () => {
            CryptoZoo.audio?.init?.();
        });

        this.setLoadingProgress(34);

        await this.runSafe(async () => {
            CryptoZoo.telegram?.init?.();
        });

        this.setLoadingProgress(48);

        await this.runSafe(async () => {
            await CryptoZoo.api?.init?.();
            this.refreshLoadedUi();
        });

        this.setLoadingProgress(68);

        await this.runSafe(async () => {
            CryptoZoo.gameplay?.init?.();
            this.refreshLoadedUi();
        });

        this.setLoadingProgress(84);

        await this.runSafe(async () => {
            CryptoZoo.telegram?.forceFullscreen?.();
            CryptoZoo.telegram?.applyIdentityToUi?.();
            CryptoZoo.telegram?.applyViewportFix?.();
            this.bindLifecycleEvents();
        });

        this.setLoadingProgress(96);

        await this.runSafe(async () => {
            CryptoZoo.gameplay?.requestRender?.(true);
            CryptoZoo.ads?.updateOfflineUi?.();
            this.refreshLoadedUi();
        });

        this.setLoadingProgress(100);

        await this.ensureMinimumLoadingTime();
        this.hideLoadingScreen();

        this.runDeferredTasks();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.init.start();
});
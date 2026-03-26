window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,
    minLoadingVisibleMs: 1400,
    startTimestamp: 0,

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

        screen.style.opacity = "0";
        screen.style.pointerEvents = "none";

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

    async start() {
        if (this.started) return;
        this.started = true;
        this.startTimestamp = Date.now();

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

        this.setLoadingProgress(82);

        await this.runSafe(async () => {
            CryptoZoo.minigames?.init?.();
        });

        this.setLoadingProgress(92);

        await this.runSafe(async () => {
            CryptoZoo.ui?.render?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.telegram?.applyIdentityToUi?.();
            CryptoZoo.ui?.bindHomeButtons?.();
            CryptoZoo.uiSettings?.bindSettingsModal?.();
            CryptoZoo.uiProfile?.bindProfileModal?.();
        });

        this.setLoadingProgress(100);

        await this.ensureMinimumLoadingTime();

        setTimeout(() => {
            this.hideLoadingScreen();
        }, 220);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await CryptoZoo.init.start();
});
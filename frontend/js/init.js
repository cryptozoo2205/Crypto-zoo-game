window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,
    minLoadingVisibleMs: 300,
    startTimestamp: 0,

    removeLoadingScreen() {
        const screen = document.getElementById("loading-screen");
        if (!screen) return;

        screen.style.pointerEvents = "none";
        screen.style.opacity = "0";
        screen.style.visibility = "hidden";
        screen.style.display = "none";

        const children = screen.querySelectorAll("*");
        children.forEach((el) => {
            el.style.pointerEvents = "none";
            el.style.display = "none";
            el.style.visibility = "hidden";
        });

        setTimeout(() => {
            try {
                screen.remove();
            } catch (error) {
                console.warn("loading remove failed", error);
            }
        }, 80);
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

        await this.runSafe(async () => {
            CryptoZoo.lang?.init?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.uiSettings?.initSettings?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.audio?.init?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.telegram?.init?.();
        });

        await this.runSafe(async () => {
            await CryptoZoo.api?.init?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.uiFaq?.close?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.gameplay?.init?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.depositBind?.init?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.depositVerifyUI?.init?.();
        });

        await this.runSafe(async () => {
            CryptoZoo.minigames?.init?.();
        });

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
        });

        await this.ensureMinimumLoadingTime();

        this.removeLoadingScreen();

        setTimeout(() => {
            this.removeLoadingScreen();
            CryptoZoo.telegram?.applyViewportFix?.();
        }, 150);

        setTimeout(() => {
            this.removeLoadingScreen();
            CryptoZoo.telegram?.applyViewportFix?.();
        }, 500);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await CryptoZoo.init.start();
});
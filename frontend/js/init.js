window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.init = {
    started: false,

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

        this.setLoadingProgress(5);

        await this.runSafe(async () => {
            CryptoZoo.uiSettings?.initSettings?.();
        });

        this.setLoadingProgress(15);

        await this.runSafe(async () => {
            CryptoZoo.audio?.init?.();
        });

        this.setLoadingProgress(25);

        await this.runSafe(async () => {
            await CryptoZoo.api?.init?.();
        });

        this.setLoadingProgress(40);

        await this.runSafe(async () => {
            CryptoZoo.telegram?.init?.();
        });

        // 🔥 LANG INIT (po Telegram)
        this.setLoadingProgress(48);

        await this.runSafe(async () => {
            CryptoZoo.lang?.init?.();
        });

        this.setLoadingProgress(55);

        await this.runSafe(async () => {
            CryptoZoo.uiFaq?.close?.();
        });

        this.setLoadingProgress(65);

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

        this.setLoadingProgress(100);

        setTimeout(() => {
            this.hideLoadingScreen();
        }, 250);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await CryptoZoo.init.start();
});
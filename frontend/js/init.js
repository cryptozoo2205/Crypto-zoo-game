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

    runSafe(fn) {
        try {
            if (typeof fn === "function") {
                fn();
            }
        } catch (error) {
            console.error(error);
        }
    },

    start() {
        if (this.started) return;
        this.started = true;

        this.setLoadingProgress(5);

        this.runSafe(() => {
            CryptoZoo.uiSettings?.initSettings?.();
        });

        this.setLoadingProgress(15);

        this.runSafe(() => {
            CryptoZoo.audio?.init?.();
        });

        this.setLoadingProgress(25);

        this.runSafe(() => {
            CryptoZoo.api?.init?.();
        });

        this.setLoadingProgress(40);

        this.runSafe(() => {
            CryptoZoo.telegram?.init?.();
        });

        this.setLoadingProgress(55);

        this.runSafe(() => {
            CryptoZoo.uiFaq?.close?.();
        });

        this.setLoadingProgress(65);

        this.runSafe(() => {
            CryptoZoo.gameplay?.init?.();
        });

        this.setLoadingProgress(82);

        this.runSafe(() => {
            CryptoZoo.minigames?.init?.();
        });

        this.setLoadingProgress(92);

        this.runSafe(() => {
            CryptoZoo.ui?.render?.();
        });

        this.setLoadingProgress(100);

        setTimeout(() => {
            this.hideLoadingScreen();
        }, 250);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.init.start();
});
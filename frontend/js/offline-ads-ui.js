window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAdsUI = {
    timer: null,
    observer: null,

    getButton() {
        return document.getElementById("watchOfflineAdBtn");
    },

    updateButton() {
        if (!this.getButton()) return;
        CryptoZoo.ui?.renderOfflineInfo?.();
    },

    startTimer() {
        if (this.timer) return;

        this.timer = setInterval(() => {
            this.updateButton();
        }, 1000);
    },

    startObserver() {
        if (this.observer) return;
        if (!document.body) return;

        this.observer = new MutationObserver(() => {
            this.updateButton();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    start() {
        this.updateButton();

        setTimeout(() => this.updateButton(), 100);
        setTimeout(() => this.updateButton(), 300);
        setTimeout(() => this.updateButton(), 700);
        setTimeout(() => this.updateButton(), 1200);

        this.startTimer();
        this.startObserver();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.offlineAdsUI.start();
});

window.addEventListener("load", () => {
    CryptoZoo.offlineAdsUI.start();
});
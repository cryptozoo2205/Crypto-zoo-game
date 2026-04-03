window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAdsUI = {
    timer: null,
    observer: null,

    getRewardHours() {
        const value = Number(CryptoZoo.offlineAds?.HOURS_PER_AD);
        return Number.isFinite(value) && value > 0 ? value : 2;
    },

    getButton() {
        return document.getElementById("watchOfflineAdBtn");
    },

    formatTime(seconds) {
        const s = Math.max(0, Number(seconds) || 0);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;

        return [
            String(h).padStart(2, "0"),
            String(m).padStart(2, "0"),
            String(sec).padStart(2, "0")
        ].join(":");
    },

    updateButton() {
        const btn = this.getButton();
        if (!btn) return;

        const canWatchAd = !!CryptoZoo.offlineAds?.canWatchAd?.();
        const seconds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getSecondsUntilReset?.() || 0)
        );
        const rewardHours = this.getRewardHours();

        btn.className = "home-offline-ad-btn";
        btn.style.whiteSpace = "nowrap";
        btn.style.display = "inline-flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.textAlign = "center";
        btn.style.fontWeight = "900";

        if (canWatchAd) {
            btn.textContent = `📺 +${rewardHours}h`;
            btn.disabled = false;
        } else {
            btn.textContent = this.formatTime(seconds);
            btn.disabled = true;
        }
    },

    startTimer() {
        if (this.timer) return;

        this.timer = setInterval(() => {
            this.updateButton();
        }, 1000);
    },

    startObserver() {
        if (this.observer) return;

        this.observer = new MutationObserver(() => {
            this.updateButton();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
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
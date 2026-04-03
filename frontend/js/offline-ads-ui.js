window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAdsUI = {
    timer: null,

    findOfflineButton() {
        const buttons = document.querySelectorAll("button");

        for (let btn of buttons) {
            const text = btn.textContent || "";

            if (
                text.includes("MAX") ||
                text.includes("📺") ||
                text.includes("+1h")
            ) {
                return btn;
            }
        }

        return null;
    },

    updateButton() {
        const btn = this.findOfflineButton();
        if (!btn) return;

        const canWatchAd = !!CryptoZoo.offlineAds?.canWatchAd?.();
        const seconds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getSecondsUntilReset?.() || 0)
        );

        if (canWatchAd) {
            btn.textContent = "📺 +1h";
            btn.style.background = "#4CAF50";
        } else {
            btn.textContent = this.formatTime(seconds);
            btn.style.background = "#C9A84A";
        }
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

    start() {
        if (this.timer) return;

        this.timer = setInterval(() => {
            const screen = CryptoZoo.gameplay?.activeScreen || "game";
            if (screen !== "game") return;

            this.updateButton();
        }, 1000);
    }
};
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAdsUI = {
    timer: null,

    getRewardHours() {
        const candidates = [
            CryptoZoo.offlineAds?.getRewardHours?.(),
            CryptoZoo.offlineAds?.getHoursPerAd?.(),
            CryptoZoo.offlineAds?.rewardHours,
            CryptoZoo.offlineAds?.hoursPerAd,
            CryptoZoo.offlineAds?.AD_REWARD_HOURS,
            CryptoZoo.offlineAds?.REWARD_HOURS,
            CryptoZoo.config?.offlineAdsRewardHours,
            CryptoZoo.config?.offlineAdsHoursPerAd,
            CryptoZoo.config?.offlineAdRewardHours,
            2
        ];

        for (const value of candidates) {
            const num = Number(value);
            if (Number.isFinite(num) && num > 0) {
                return num;
            }
        }

        return 2;
    },

    findOfflinePanel() {
        return (
            document.querySelector("#game .home-offline-strip") ||
            document.querySelector(".home-offline-strip") ||
            null
        );
    },

    findOfflineButton() {
        const panel = this.findOfflinePanel();
        if (!panel) return null;

        const direct = panel.querySelector(".home-offline-ad-btn");
        if (direct) return direct;

        const buttons = Array.from(panel.querySelectorAll("button"));

        const exact = buttons.find((btn) => {
            const text = String(btn.textContent || "").trim().toUpperCase();
            return text === "MAX" || text === "📺 MAX";
        });
        if (exact) return exact;

        const fallback = buttons.find((btn) => {
            const text = String(btn.textContent || "").trim();
            return (
                text.includes("MAX") ||
                text.includes("📺") ||
                text.includes("+1h") ||
                text.includes("+2h")
            );
        });

        return fallback || null;
    },

    updateButton() {
        const btn = this.findOfflineButton();
        if (!btn) return;

        const canWatchAd = !!CryptoZoo.offlineAds?.canWatchAd?.();
        const seconds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getSecondsUntilReset?.() || 0)
        );
        const rewardHours = this.getRewardHours();

        btn.classList.add("home-offline-ad-btn");
        btn.style.whiteSpace = "nowrap";
        btn.style.display = "inline-flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.textAlign = "center";
        btn.style.fontWeight = "900";

        if (canWatchAd) {
            btn.textContent = `📺 +${CryptoZoo.formatNumber ? CryptoZoo.formatNumber(rewardHours) : rewardHours}h`;
            btn.style.background = "linear-gradient(180deg, #ffd94d 0%, #f0b90b 100%)";
            btn.style.color = "#1f1f1f";
            btn.disabled = false;
        } else {
            btn.textContent = this.formatTime(seconds);
            btn.style.background = "linear-gradient(180deg, #ffd94d 0%, #f0b90b 100%)";
            btn.style.color = "#1f1f1f";
            btn.disabled = true;
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
        this.updateButton();

        if (this.timer) return;

        this.timer = setInterval(() => {
            const screen = CryptoZoo.gameplay?.activeScreen || "game";
            if (screen !== "game") return;

            this.updateButton();
        }, 1000);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.offlineAdsUI.start();
});
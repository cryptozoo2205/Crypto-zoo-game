window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,

    updateOfflineUi() {
        const mainEl = document.getElementById("homeOfflineMainText");
        const subEl = document.getElementById("homeOfflineSubText");
        const btnEl = document.getElementById("watchOfflineAdBtn");

        const totalHours = Math.max(
            1,
            Number(CryptoZoo.gameplay?.getOfflineHoursTotal?.() || 1)
        );
        const baseHours = Math.max(
            1,
            Number(CryptoZoo.gameplay?.getOfflineBaseHours?.() || 1)
        );
        const shopHours = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getOfflineBoostHours?.() || 0)
        );
        const adsHours = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getOfflineAdsHours?.() || 0)
        );
        const offlineMultiplier = Math.max(
            1,
            Number(CryptoZoo.state?.offlineBoostMultiplier) || 1
        );

        if (mainEl) {
            mainEl.textContent = `Limit offline: ${totalHours}h • Standardowy mnożnik offline x${offlineMultiplier}`;
        }

        if (subEl) {
            subEl.textContent = `Limit bazowy: ${baseHours}h • Shop: +${shopHours}h • Ads: +${adsHours}h`;
        }

        if (btnEl) {
            const maxAds = Math.max(
                0,
                Number(CryptoZoo.offlineAds?.getMaxHours?.() || 12)
            );

            if (this.isLoading) {
                btnEl.disabled = true;
                btnEl.textContent = "⏳ Ładowanie...";
                return;
            }

            if (adsHours >= maxAds) {
                btnEl.disabled = true;
                btnEl.textContent = "📺 MAX";
                return;
            }

            btnEl.disabled = false;
            btnEl.textContent = "📺 +2h";
        }
    },

    async showRewardedAd() {
        if (this.isLoading) return false;

        if (typeof show_10822070 !== "function") {
            console.error("Monetag function show_10822070 is not loaded");
            CryptoZoo.ui?.showToast?.("Reklama nie jest jeszcze gotowa");
            return false;
        }

        this.isLoading = true;
        this.updateOfflineUi();

        try {
            await show_10822070();

            const rewarded =
                CryptoZoo.offlineAds?.grantAdReward?.() ||
                CryptoZoo.gameplay?.grantOfflineAdReward?.() ||
                false;

            if (!rewarded) {
                CryptoZoo.ui?.showToast?.("Masz już maksymalny limit reklam offline");
            }

            this.updateOfflineUi();
            return rewarded;
        } catch (error) {
            console.error("Rewarded ad error:", error);
            CryptoZoo.ui?.showToast?.("Nie udało się załadować reklamy");
            return false;
        } finally {
            this.isLoading = false;
            this.updateOfflineUi();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        CryptoZoo.ads?.updateOfflineUi?.();
    }, 400);
});
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,
    activeRequestId: null,
    lastGrantedRequestId: null,
    requestCounter: 0,

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
            mainEl.textContent =
                `Limit offline: ${totalHours}h • Standardowy mnożnik offline x${offlineMultiplier}`;
        }

        if (subEl) {
            subEl.textContent =
                `Limit bazowy: ${baseHours}h • Shop: +${shopHours}h • Ads: +${adsHours}h`;
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

    canStartRewardedAd() {
        if (this.isLoading) {
            return false;
        }

        if (typeof show_10822070 !== "function") {
            console.error("Monetag function show_10822070 is not loaded");
            CryptoZoo.ui?.showToast?.("Reklama nie jest jeszcze gotowa");
            return false;
        }

        const canWatch = !!CryptoZoo.offlineAds?.canWatchAd?.();
        if (!canWatch) {
            const resetText =
                CryptoZoo.offlineAds?.getFormattedTimeUntilReset?.() || "--:--:--";
            CryptoZoo.ui?.showToast?.(
                `Osiągnięto limit reklam offline • Reset za ${resetText}`
            );
            return false;
        }

        return true;
    },

    buildRequestId() {
        this.requestCounter += 1;
        return `ad_${Date.now()}_${this.requestCounter}`;
    },

    async showRewardedAd() {
        if (!this.canStartRewardedAd()) {
            return false;
        }

        const requestId = this.buildRequestId();

        this.isLoading = true;
        this.activeRequestId = requestId;
        this.updateOfflineUi();

        try {
            // Monetag Rewarded Interstitial:
            // promise powinien rozwiązać się po ukończeniu reklamy.
            await show_10822070();

            // Jeżeli w międzyczasie request został zmieniony/anulowany,
            // nie przyznawaj nagrody.
            if (this.activeRequestId !== requestId) {
                console.warn("Rewarded ad request mismatch, reward skipped:", requestId);
                return false;
            }

            // Dodatkowa blokada przed podwójnym przyznaniem rewardu
            // dla tego samego requestu.
            if (this.lastGrantedRequestId === requestId) {
                console.warn("Reward already granted for request:", requestId);
                return false;
            }

            const rewarded = !!CryptoZoo.offlineAds?.grantAdReward?.();

            if (rewarded) {
                this.lastGrantedRequestId = requestId;
            } else {
                CryptoZoo.ui?.showToast?.("Masz już maksymalny limit reklam offline");
            }

            this.updateOfflineUi();
            return rewarded;
        } catch (error) {
            console.error("Rewarded ad error:", error);
            CryptoZoo.ui?.showToast?.("Nie udało się załadować reklamy");
            return false;
        } finally {
            if (this.activeRequestId === requestId) {
                this.activeRequestId = null;
            }

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
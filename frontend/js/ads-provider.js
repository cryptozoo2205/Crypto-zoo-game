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

    async requestOfflineRewardFromBackend() {
        const playerId =
            CryptoZoo.telegram?.getPlayerId?.() ||
            CryptoZoo.state?.telegramId ||
            CryptoZoo.state?.playerId ||
            null;

        const response = await fetch("/api/ads/reward-offline", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.ok) {
            throw new Error(data?.error || "Nie udało się odebrać rewardu reklamy");
        }

        return data;
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

            const result = await this.requestOfflineRewardFromBackend();

            if (typeof result.offlineAdsHours === "number") {
                CryptoZoo.state = CryptoZoo.state || {};
                CryptoZoo.state.offlineAdsHours = result.offlineAdsHours;
            }

            if (typeof result.offlineAdsResetAt === "number") {
                CryptoZoo.state = CryptoZoo.state || {};
                CryptoZoo.state.offlineAdsResetAt = result.offlineAdsResetAt;
            }

            CryptoZoo.gameplay?.recalculateProgress?.();
            this.updateOfflineUi();

            if (result?.message) {
                CryptoZoo.ui?.showToast?.(result.message);
            }

            return true;
        } catch (error) {
            console.error("Rewarded ad error:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || "Nie udało się odebrać rewardu reklamy"
            );
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
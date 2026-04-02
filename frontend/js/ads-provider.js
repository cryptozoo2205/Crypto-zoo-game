window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,

    showRewardedAd() {
        if (this.isLoading) return;

        this.isLoading = true;

        if (typeof show_10822070 !== "function") {
            console.error("Ad function not loaded");
            this.isLoading = false;
            return;
        }

        show_10822070()
            .then(() => {
                this.onAdReward();
            })
            .catch((err) => {
                console.error("Ad error:", err);
            })
            .finally(() => {
                this.isLoading = false;
            });
    },

    onAdReward() {
        // 🔥 TUTAJ NAGRODA
        const hours = 2;

        CryptoZoo.state.offlineAdsHours =
            Math.max(0, Number(CryptoZoo.state.offlineAdsHours) || 0) + hours;

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(`🎁 +${hours}h offline (ad)`);
    }
};
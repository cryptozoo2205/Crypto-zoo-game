window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,

    updateOfflineUi() {
        const btnEl = document.getElementById("watchOfflineAdBtn");
        if (!btnEl) return;

        const adsHours = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getOfflineAdsHours?.() || 0)
        );

        const maxAds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getMaxHours?.() || 12)
        );

        const resetSeconds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getSecondsUntilReset?.() || 0)
        );

        const resetText =
            CryptoZoo.ui?.formatTimeLeft?.(resetSeconds) || "00:00:00";

        if (this.isLoading) {
            btnEl.disabled = true;
            btnEl.textContent = "⏳ Ładowanie...";
            return;
        }

        if (adsHours >= maxAds) {
            btnEl.disabled = true;
            btnEl.textContent = `📺 MAX • ${resetText}`;
            return;
        }

        btnEl.disabled = false;
        btnEl.textContent = `📺 +2h • ${adsHours}/${maxAds}h`;
    },

    getPlayerPayload() {
        const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;

        const playerId = String(
            telegramUser?.id ||
            CryptoZoo.state?.telegramId ||
            CryptoZoo.state?.playerId ||
            "local-player"
        );

        const username =
            telegramUser?.username ||
            telegramUser?.first_name ||
            CryptoZoo.state?.username ||
            "Gracz";

        return {
            playerId,
            telegramId: playerId,
            username
        };
    },

    getApiBase() {
        const rawBase = String(CryptoZoo.config?.apiBase || "/api").trim();
        return rawBase.replace(/\/+$/, "");
    },

    async requestOfflineRewardFromBackend() {
        const payload = this.getPlayerPayload();
        const apiBase = this.getApiBase();

        const response = await fetch(`${apiBase}/ads/reward-offline`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
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

            CryptoZoo.state = CryptoZoo.state || {};

            if (typeof result.offlineAdsHours === "number") {
                CryptoZoo.state.offlineAdsHours = result.offlineAdsHours;
            }

            CryptoZoo.gameplay?.recalculateProgress?.();
            CryptoZoo.ui?.renderOfflineInfo?.();
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
            CryptoZoo.ui?.renderOfflineInfo?.();
            this.updateOfflineUi();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        CryptoZoo.ads?.updateOfflineUi?.();
    }, 400);
});
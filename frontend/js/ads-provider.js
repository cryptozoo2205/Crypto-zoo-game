window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,
    lastAttemptAt: 0,
    minAttemptGapMs: 2500,

    // 🔥 anti-cheat (min czas oglądania)
    minWatchTimeMs: 12000,

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
        const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;

        const id = String(
            tg?.id ||
            CryptoZoo.state?.telegramUser?.id ||
            "local-player"
        );

        return {
            telegramId: id,
            username: tg?.username || tg?.first_name || "Gracz"
        };
    },

    getApiBase() {
        const raw = String(CryptoZoo.config?.apiBase || "/api").trim();
        return raw.replace(/\/+$/, "");
    },

    async requestOfflineRewardFromBackend() {
        const res = await fetch(`${this.getApiBase()}/ads/reward-offline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.getPlayerPayload())
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Reward failed");
        }

        return data;
    },

    async syncStateFromBackendReward(result) {
        if (result?.player) {
            CryptoZoo.state = CryptoZoo.api.mergeStates(
                result.player,
                CryptoZoo.state || {}
            );
        }

        CryptoZoo.api?.writeLocalState?.(CryptoZoo.state);

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.renderOfflineInfo?.();
        CryptoZoo.ui?.render?.();
        this.updateOfflineUi();
    },

    async showRewardedAd() {
        if (this.isLoading) return false;

        const now = Date.now();
        if (now - this.lastAttemptAt < this.minAttemptGapMs) return false;

        if (typeof show_10822070 !== "function") {
            CryptoZoo.ui?.showToast?.("Ad not ready");
            return false;
        }

        this.lastAttemptAt = now;
        this.isLoading = true;
        this.updateOfflineUi();

        // 🔥 start pomiaru czasu
        const startTime = Date.now();

        try {
            await new Promise((resolve, reject) => {
                try {
                    show_10822070({
                        type: "rewarded",
                        onClose: () => resolve()
                    });
                } catch (e) {
                    reject(e);
                }
            });

            const watchedMs = Date.now() - startTime;

            // 🔥 jeśli zamknął za szybko → brak rewardu
            if (watchedMs < this.minWatchTimeMs) {
                CryptoZoo.ui?.showToast?.("❌ Obejrzyj reklamę do końca");
                return false;
            }

            // ✅ reward dopiero tutaj
            const result = await this.requestOfflineRewardFromBackend();
            await this.syncStateFromBackendReward(result);

            CryptoZoo.ui?.showToast?.("🎉 +2h offline");

            return true;

        } catch (error) {
            console.error("Ad error:", error);
            CryptoZoo.ui?.showToast?.("Błąd reklamy");
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
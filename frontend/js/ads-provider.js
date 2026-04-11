window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,
    lastAttemptAt: 0,
    minAttemptGapMs: 2500,

    minWatchTimeMs: 12000,
    adHardTimeoutMs: 90000,

    updateOfflineUi() {
        const btnEl = document.getElementById("watchOfflineAdBtn");
        if (!btnEl) return;

        const adsHours = Math.max(
            0,
            Number(CryptoZoo.gameplay?.getOfflineAdsHours?.() || 0)
        );

        const maxAds = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getMaxHours?.() || 6)
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
        btnEl.textContent = `📺 +1h • ${adsHours}/${maxAds}h`;
    },

    getPlayerPayload() {
        const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;

        const id = String(
            tg?.id ||
            CryptoZoo.state?.telegramUser?.id ||
            CryptoZoo.state?.telegramId ||
            "local-player"
        );

        return {
            telegramId: id,
            username: tg?.username || tg?.first_name || "Gracz"
        };
    },

    getApiBase() {
        const raw = String(
            CryptoZoo.config?.apiBase ||
            CryptoZoo.api?.getApiBase?.() ||
            "/api"
        ).trim();

        return raw.replace(/\/+$/, "");
    },

    async requestOfflineRewardFromBackend() {
        const res = await fetch(`${this.getApiBase()}/ads/reward-offline`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(this.getPlayerPayload())
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Nie udało się odebrać rewardu reklamy");
        }

        return data;
    },

    async syncStateFromBackendReward(result) {
        CryptoZoo.state = CryptoZoo.state || {};

        if (result?.player) {
            CryptoZoo.state = CryptoZoo.api?.mergeStates
                ? CryptoZoo.api.mergeStates(result.player, CryptoZoo.state || {})
                : { ...CryptoZoo.state, ...result.player };
        }

        if (typeof result.offlineAdsHours === "number") {
            CryptoZoo.state.offlineAdsHours = result.offlineAdsHours;
        }

        if (typeof result.offlineAdsResetAt === "number") {
            CryptoZoo.state.offlineAdsResetAt = result.offlineAdsResetAt;
        }

        if (typeof result.offlineMaxSeconds === "number") {
            CryptoZoo.state.offlineMaxSeconds = result.offlineMaxSeconds;
        }

        if (typeof result.offlineBoostHours === "number") {
            CryptoZoo.state.offlineBoostHours = result.offlineBoostHours;
        }

        if (typeof result.offlineBaseHours === "number") {
            CryptoZoo.state.offlineBaseHours = result.offlineBaseHours;
        }

        if (typeof result.offlineBoostMultiplier === "number") {
            CryptoZoo.state.offlineBoostMultiplier = result.offlineBoostMultiplier;
        }

        if (typeof result.offlineBoostActiveUntil === "number") {
            CryptoZoo.state.offlineBoostActiveUntil = result.offlineBoostActiveUntil;
        }

        if (typeof CryptoZoo.api?.writeLocalState === "function") {
            CryptoZoo.api.writeLocalState(CryptoZoo.state);
        }

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.renderOfflineInfo?.();
        CryptoZoo.ui?.render?.();
        this.updateOfflineUi();
    },

    async openAdWithoutEvents() {
        const startedAt = Date.now();

        if (typeof show_10822070 !== "function") {
            throw new Error("Reklama nie jest jeszcze gotowa");
        }

        const maybePromise = show_10822070();

        if (maybePromise && typeof maybePromise.then === "function") {
            try {
                await Promise.race([
                    maybePromise,
                    new Promise((resolve) => setTimeout(resolve, this.adHardTimeoutMs))
                ]);
            } catch (error) {
                throw error instanceof Error ? error : new Error(String(error || "Ad error"));
            }
        } else {
            await new Promise((resolve) => {
                setTimeout(resolve, this.minWatchTimeMs);
            });
        }

        const watchedMs = Date.now() - startedAt;
        return watchedMs;
    },

    async showRewardedAd() {
        if (this.isLoading) return false;

        const now = Date.now();
        if (now - this.lastAttemptAt < this.minAttemptGapMs) {
            return false;
        }

        if (typeof show_10822070 !== "function") {
            CryptoZoo.ui?.showToast?.("Reklama nie jest jeszcze gotowa");
            return false;
        }

        this.lastAttemptAt = now;
        this.isLoading = true;
        this.updateOfflineUi();

        try {
            const watchedMs = await this.openAdWithoutEvents();

            if (watchedMs < this.minWatchTimeMs) {
                CryptoZoo.ui?.showToast?.("Obejrzyj reklamę do końca");
                return false;
            }

            const result = await this.requestOfflineRewardFromBackend();
            await this.syncStateFromBackendReward(result);

            CryptoZoo.ui?.showToast?.(
                result?.message || "Dodano +1h zarobków offline"
            );

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
            CryptoZoo.ui?.render?.();
            this.updateOfflineUi();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        CryptoZoo.ads?.updateOfflineUi?.();
    }, 400);
});
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,
    lastAttemptAt: 0,
    minAttemptGapMs: 2500,

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

    normalizeAdResult(result) {
        // Dla Monetag bardzo często samo poprawne zakończenie Promise oznacza sukces,
        // więc null / undefined traktujemy jako sukces.
        if (result == null) {
            return { rewarded: true, raw: result };
        }

        if (result === true) {
            return { rewarded: true, raw: result };
        }

        if (result === false) {
            return { rewarded: false, raw: result };
        }

        if (typeof result === "string") {
            const value = result.toLowerCase().trim();

            const negativeStates = [
                "closed",
                "close",
                "dismissed",
                "skipped",
                "skip",
                "cancelled",
                "canceled",
                "error",
                "failed"
            ];

            if (negativeStates.includes(value)) {
                return { rewarded: false, raw: result };
            }

            const positiveStates = [
                "rewarded",
                "reward",
                "complete",
                "completed",
                "finish",
                "finished",
                "ok",
                "success",
                "done"
            ];

            if (positiveStates.includes(value)) {
                return { rewarded: true, raw: result };
            }

            // Nieznany string po poprawnym resolve traktujemy jako sukces
            return { rewarded: true, raw: result };
        }

        if (typeof result === "object") {
            const status = String(
                result.status ||
                result.state ||
                result.result ||
                result.event ||
                ""
            ).toLowerCase().trim();

            if (
                result.rewarded === true ||
                result.completed === true ||
                result.complete === true ||
                result.finished === true ||
                result.finish === true ||
                result.done === true
            ) {
                return { rewarded: true, raw: result };
            }

            const negativeStatuses = [
                "closed",
                "close",
                "dismissed",
                "skipped",
                "skip",
                "cancelled",
                "canceled",
                "error",
                "failed"
            ];

            if (negativeStatuses.includes(status)) {
                return { rewarded: false, raw: result };
            }

            const positiveStatuses = [
                "rewarded",
                "reward",
                "completed",
                "complete",
                "finished",
                "finish",
                "success",
                "done",
                "ok"
            ];

            if (positiveStatuses.includes(status)) {
                return { rewarded: true, raw: result };
            }

            // Jeżeli obiekt przyszedł bez jasnego błędu, też uznajemy sukces
            return { rewarded: true, raw: result };
        }

        // Każdy inny poprawny resolve traktujemy jako sukces
        return { rewarded: true, raw: result };
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

    async syncStateFromBackendReward(result) {
        CryptoZoo.state = CryptoZoo.state || {};

        if (typeof result.player === "object" && result.player) {
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

    async showRewardedAd() {
        if (this.isLoading) return false;

        const now = Date.now();
        if (now - this.lastAttemptAt < this.minAttemptGapMs) {
            return false;
        }

        if (typeof show_10822070 !== "function") {
            console.error("Monetag function show_10822070 is not loaded");
            CryptoZoo.ui?.showToast?.("Reklama nie jest jeszcze gotowa");
            return false;
        }

        this.lastAttemptAt = now;
        this.isLoading = true;
        this.updateOfflineUi();

        try {
            const adRawResult = await show_10822070();
            const adResult = this.normalizeAdResult(adRawResult);

            if (!adResult.rewarded) {
                CryptoZoo.ui?.showToast?.("Nagroda tylko za obejrzenie całej reklamy");
                return false;
            }

            const result = await this.requestOfflineRewardFromBackend();
            await this.syncStateFromBackendReward(result);

            if (result?.message) {
                CryptoZoo.ui?.showToast?.(result.message);
            } else {
                CryptoZoo.ui?.showToast?.("Dodano +2h zarobków offline");
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
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,
    adHardTimeoutMs: 90000,
    githubTestAdDurationMs: 15000,
    minRequiredAdWatchMs: 15000,

    updateOfflineUi() {
        CryptoZoo.offlineAdsUI?.updateButton?.();
        CryptoZoo.ui?.renderOfflineInfo?.();
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

    isGithubLikeHost() {
        const host = String(window.location?.hostname || "").toLowerCase();
        return (
            host.includes("github.io") ||
            host === "localhost" ||
            host === "127.0.0.1"
        );
    },

    isSdkReady() {
        return typeof window.show_10822070 === "function";
    },

    async requestOfflineRewardFromBackend(adMeta = {}) {
        const payload = {
            ...this.getPlayerPayload(),
            watchedMs: Math.max(0, Number(adMeta.watchedMs) || 0),
            adStartedAt: Math.max(0, Number(adMeta.adStartedAt) || 0),
            adEndedAt: Math.max(0, Number(adMeta.adEndedAt) || 0)
        };

        const res = await fetch(`${this.getApiBase()}/ads/reward-offline`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Nie udało się odebrać rewardu reklamy");
        }

        return data;
    },

    buildLocalRewardResult(adMeta = {}) {
        const watchedMs = Math.max(0, Number(adMeta.watchedMs) || 0);

        if (watchedMs < this.minRequiredAdWatchMs) {
            throw new Error("Reklama została zamknięta przed końcem");
        }

        CryptoZoo.state = CryptoZoo.state || {};

        const added = CryptoZoo.offlineAds?.addHours?.(
            CryptoZoo.offlineAds?.HOURS_PER_AD || 0.5
        );

        if (!added) {
            throw new Error("Osiągnięto maksymalny limit 3h");
        }

        CryptoZoo.offlineAds?.ensureState?.();

        return {
            ok: true,
            message: "Dodano +30min zarobków offline",
            offlineAdsHours: Number(CryptoZoo.state.offlineAdsHours || 0),
            offlineAdsResetAt: Number(CryptoZoo.state.offlineAdsResetAt || 0),
            offlineMaxSeconds: Math.max(
                0,
                Math.round((Number(CryptoZoo.state.offlineAdsHours || 0) * 3600))
            ),
            offlineBoostHours: Number(CryptoZoo.state.offlineBoostHours || 0),
            offlineBaseHours: Number(CryptoZoo.state.offlineBaseHours || 1),
            offlineBoostMultiplier: Number(CryptoZoo.state.offlineBoostMultiplier || 1),
            offlineBoostActiveUntil: Number(CryptoZoo.state.offlineBoostActiveUntil || 0),
            player: CryptoZoo.state
        };
    },

    async requestOfflineReward(adMeta = {}) {
        try {
            return await this.requestOfflineRewardFromBackend(adMeta);
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                throw error;
            }

            console.warn("Backend reward failed on GitHub/local, using local fallback:", error);
            return this.buildLocalRewardResult(adMeta);
        }
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

        CryptoZoo.offlineAds?.ensureState?.();

        if (typeof CryptoZoo.api?.writeLocalState === "function") {
            CryptoZoo.api.writeLocalState(CryptoZoo.state);
        }

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.renderOfflineInfo?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.offlineAdsUI?.updateButton?.();
    },

    isAdSuccessResult(result) {
        if (result === true) return true;

        if (typeof result === "string") {
            const value = result.trim().toLowerCase();
            return [
                "success",
                "completed",
                "rewarded",
                "done",
                "viewed",
                "finished",
                "reward",
                "grant",
                "granted"
            ].includes(value);
        }

        if (!result || typeof result !== "object") {
            return false;
        }

        if (result.success === true) return true;
        if (result.completed === true) return true;
        if (result.rewarded === true) return true;
        if (result.reward === true) return true;
        if (result.granted === true) return true;

        const valuesToCheck = [
            result.status,
            result.result,
            result.state,
            result.event,
            result.type,
            result.message
        ]
            .map((value) => String(value || "").trim().toLowerCase())
            .filter(Boolean);

        if (valuesToCheck.some((value) => [
            "success",
            "completed",
            "rewarded",
            "done",
            "viewed",
            "finished",
            "reward",
            "grant",
            "granted"
        ].includes(value))) {
            return true;
        }

        if (
            valuesToCheck.includes("close") &&
            (result.reward === true || result.rewarded === true || result.granted === true)
        ) {
            return true;
        }

        return false;
    },

    async openGithubTestRewardedAd() {
        const adStartedAt = Date.now();

        return new Promise((resolve, reject) => {
            const ok = window.confirm(
                "Tryb GitHub/test:\n\nKliknij OK i odczekaj 15 sekund, aby zasymulować pełne obejrzenie reklamy.\nAnuluj = brak rewardu."
            );

            if (!ok) {
                reject(new Error("Reklama została zamknięta przed końcem"));
                return;
            }

            setTimeout(() => {
                const adEndedAt = Date.now();

                resolve({
                    completed: true,
                    rewarded: true,
                    source: "github-test",
                    adStartedAt,
                    adEndedAt,
                    watchedMs: Math.max(0, adEndedAt - adStartedAt)
                });
            }, this.githubTestAdDurationMs);
        });
    },

    async openRewardedAdStrict() {
        const adStartedAt = Date.now();

        if (!this.isSdkReady()) {
            if (this.isGithubLikeHost()) {
                return this.openGithubTestRewardedAd();
            }

            throw new Error("Reklama nie jest jeszcze gotowa");
        }

        let adPromise;

        try {
            adPromise = window.show_10822070();
        } catch (error) {
            throw error instanceof Error ? error : new Error(String(error || "Ad error"));
        }

        if (!adPromise || typeof adPromise.then !== "function") {
            throw new Error("Reklama nie jest jeszcze gotowa");
        }

        const sdkResult = await Promise.race([
            adPromise,
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error("Limit czasu reklamy"));
                }, this.adHardTimeoutMs);
            })
        ]);

        const adEndedAt = Date.now();
        const watchedMs = Math.max(0, adEndedAt - adStartedAt);

        const result = {
            ...(sdkResult && typeof sdkResult === "object" ? sdkResult : { raw: sdkResult }),
            adStartedAt,
            adEndedAt,
            watchedMs
        };

        console.log("Rewarded ad SDK result:", result);

        const sdkSuccess = this.isAdSuccessResult(result);
        const timeSuccess = watchedMs >= this.minRequiredAdWatchMs;

        if (!sdkSuccess && !timeSuccess) {
            throw new Error("Reklama została zamknięta przed końcem");
        }

        return result;
    },

    async showRewardedAd() {
        if (this.isLoading) return false;

        if (!CryptoZoo.offlineAds?.canWatchAd?.()) {
            CryptoZoo.ui?.showToast?.("Osiągnięto maksymalny limit 3h");
            this.updateOfflineUi();
            return false;
        }

        this.isLoading = true;
        this.updateOfflineUi();

        try {
            const adMeta = await this.openRewardedAdStrict();

            const result = await this.requestOfflineReward(adMeta);
            await this.syncStateFromBackendReward(result);

            CryptoZoo.ui?.showToast?.(
                result?.message || "Dodano +30min zarobków offline"
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
            CryptoZoo.offlineAdsUI?.updateButton?.();
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        CryptoZoo.ads?.updateOfflineUi?.();
    }, 400);
});
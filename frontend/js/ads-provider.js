window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ads = {
    isLoading: false,
    lastAttemptAt: 0,
    minAttemptGapMs: 2500,

    minWatchTimeMs: 12000,
    adHardTimeoutMs: 90000,

    activeSession: null,

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

    cleanupSession() {
        const session = this.activeSession;
        if (!session) return;

        session.closed = true;

        if (session.timeoutId) {
            clearTimeout(session.timeoutId);
        }

        this.activeSession = null;
    },

    startAdSession() {
        const session = {
            startedAt: Date.now(),
            sdkClosed: false,
            sdkResolved: false,
            timeoutId: null,
            closed: false
        };

        session.timeoutId = setTimeout(() => {
            session.sdkResolved = true;
        }, this.adHardTimeoutMs);

        this.activeSession = session;
        return session;
    },

    normalizeSdkResult(result) {
        if (result === true) {
            return { rewarded: true, closed: true };
        }

        if (result === false || result == null) {
            return { rewarded: false, closed: true };
        }

        if (typeof result === "string") {
            const value = result.toLowerCase().trim();

            if ([
                "rewarded",
                "reward",
                "complete",
                "completed",
                "finish",
                "finished",
                "success"
            ].includes(value)) {
                return { rewarded: true, closed: true };
            }

            if ([
                "closed",
                "close",
                "dismissed",
                "skipped",
                "skip",
                "cancelled",
                "canceled",
                "error",
                "failed"
            ].includes(value)) {
                return { rewarded: false, closed: true };
            }

            return { rewarded: false, closed: false };
        }

        if (typeof result === "object") {
            const status = String(
                result.status ||
                result.state ||
                result.result ||
                result.event ||
                ""
            ).toLowerCase().trim();

            const rewarded =
                result.rewarded === true ||
                result.completed === true ||
                result.complete === true ||
                result.finished === true ||
                result.finish === true ||
                [
                    "rewarded",
                    "reward",
                    "complete",
                    "completed",
                    "finish",
                    "finished",
                    "success"
                ].includes(status);

            const closed =
                rewarded ||
                [
                    "closed",
                    "close",
                    "dismissed",
                    "skipped",
                    "skip",
                    "cancelled",
                    "canceled",
                    "error",
                    "failed"
                ].includes(status);

            return { rewarded, closed };
        }

        return { rewarded: false, closed: false };
    },

    shouldGrantReward(session, sdkResult) {
        const watchedMs = Date.now() - Number(session?.startedAt || Date.now());
        const watchedEnough = watchedMs >= this.minWatchTimeMs;

        if (sdkResult?.rewarded) {
            return true;
        }

        if (sdkResult?.closed && watchedEnough) {
            return true;
        }

        return false;
    },

    async openSdkRewardedAd(session) {
        return new Promise((resolve, reject) => {
            let settled = false;

            const finish = (result) => {
                if (settled) return;
                settled = true;
                session.sdkResolved = true;
                resolve(result);
            };

            const fail = (error) => {
                if (settled) return;
                settled = true;
                reject(error);
            };

            try {
                const maybePromise = show_10822070({
                    type: "rewarded",
                    onClose: (result) => {
                        session.sdkClosed = true;
                        finish(result);
                    }
                });

                if (maybePromise && typeof maybePromise.then === "function") {
                    maybePromise
                        .then((result) => {
                            session.sdkClosed = true;
                            finish(result);
                        })
                        .catch((error) => {
                            fail(error instanceof Error ? error : new Error(String(error || "Ad error")));
                        });
                }
            } catch (error) {
                fail(error);
            }

            setTimeout(() => {
                if (!settled) {
                    session.sdkClosed = true;
                    finish({ status: "closed" });
                }
            }, this.adHardTimeoutMs);
        });
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

        const session = this.startAdSession();

        try {
            const rawResult = await this.openSdkRewardedAd(session);
            const sdkResult = this.normalizeSdkResult(rawResult);

            if (!this.shouldGrantReward(session, sdkResult)) {
                CryptoZoo.ui?.showToast?.("Obejrzyj reklamę do końca");
                return false;
            }

            const result = await this.requestOfflineRewardFromBackend();
            await this.syncStateFromBackendReward(result);

            CryptoZoo.ui?.showToast?.(
                result?.message || "Dodano +2h zarobków offline"
            );

            return true;
        } catch (error) {
            console.error("Rewarded ad error:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || "Nie udało się odebrać rewardu reklamy"
            );
            return false;
        } finally {
            this.cleanupSession();
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
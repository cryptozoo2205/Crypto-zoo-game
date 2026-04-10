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

        if (session.visibilityHandler) {
            document.removeEventListener("visibilitychange", session.visibilityHandler);
        }

        if (session.focusHandler) {
            window.removeEventListener("focus", session.focusHandler);
        }

        this.activeSession = null;
    },

    startAdSession() {
        const session = {
            startedAt: Date.now(),
            hiddenAtLeastOnce: false,
            regainedFocusAfterHide: false,
            sdkResolved: false,
            closed: false,
            timeoutId: null,
            visibilityHandler: null,
            focusHandler: null
        };

        session.visibilityHandler = () => {
            if (document.visibilityState === "hidden") {
                session.hiddenAtLeastOnce = true;
            }

            if (document.visibilityState === "visible" && session.hiddenAtLeastOnce) {
                session.regainedFocusAfterHide = true;
            }
        };

        session.focusHandler = () => {
            if (session.hiddenAtLeastOnce) {
                session.regainedFocusAfterHide = true;
            }
        };

        document.addEventListener("visibilitychange", session.visibilityHandler);
        window.addEventListener("focus", session.focusHandler);

        session.timeoutId = setTimeout(() => {
            session.sdkResolved = true;
        }, this.adHardTimeoutMs);

        this.activeSession = session;
        return session;
    },

    shouldGrantReward(session) {
        const watchedMs = Date.now() - Number(session?.startedAt || Date.now());
        const watchedEnough = watchedMs >= this.minWatchTimeMs;
        const leftAndReturned =
            session?.hiddenAtLeastOnce && session?.regainedFocusAfterHide;

        return watchedEnough && leftAndReturned;
    },

    async openSdkRewardedAd(session) {
        return new Promise((resolve, reject) => {
            let settled = false;

            const finish = () => {
                if (settled) return;
                settled = true;
                session.sdkResolved = true;
                resolve(true);
            };

            const fail = (error) => {
                if (settled) return;
                settled = true;
                reject(error);
            };

            try {
                const maybePromise = show_10822070();

                if (maybePromise && typeof maybePromise.then === "function") {
                    maybePromise
                        .then(() => {
                            finish();
                        })
                        .catch((error) => {
                            fail(error instanceof Error ? error : new Error(String(error || "Ad error")));
                        });
                } else {
                    const pollStart = Date.now();

                    const poll = () => {
                        if (settled) return;

                        const elapsed = Date.now() - pollStart;
                        if (
                            session.hiddenAtLeastOnce &&
                            session.regainedFocusAfterHide &&
                            elapsed >= 1000
                        ) {
                            finish();
                            return;
                        }

                        if (elapsed >= this.adHardTimeoutMs) {
                            finish();
                            return;
                        }

                        setTimeout(poll, 250);
                    };

                    poll();
                }
            } catch (error) {
                fail(error);
            }
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
            await this.openSdkRewardedAd(session);

            if (!this.shouldGrantReward(session)) {
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
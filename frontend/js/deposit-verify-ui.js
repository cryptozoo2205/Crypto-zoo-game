window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositVerifyUI = {
    intervalId: null,
    checking: false,
    intervalMs: 12000,

    async verifyDepositById(depositId) {
        const safeDepositId = String(depositId || "").trim();
        if (!safeDepositId) {
            return null;
        }

        try {
            if (!CryptoZoo.api?.verifyDepositById) {
                return null;
            }

            const result = await CryptoZoo.api.verifyDepositById(safeDepositId);

            if (result?.matched && result?.player) {
                CryptoZoo.state = CryptoZoo.api.normalizeState({
                    ...(CryptoZoo.state || {}),
                    ...result.player,
                    telegramUser: CryptoZoo.api.getTelegramUser()
                });

                CryptoZoo.ui?.render?.();
                await CryptoZoo.uiSettings?.loadDepositsHistory?.();
                CryptoZoo.uiSettings?.refreshSettingsModalData?.();

                const gemsAdded = Math.max(0, Number(result?.deposit?.gemsAmount) || 0);
                CryptoZoo.ui?.showToast?.(
                    gemsAdded > 0
                        ? `✅ Deposit approved +${gemsAdded} gems`
                        : "✅ Deposit approved"
                );
            }

            return result;
        } catch (error) {
            console.error("Verify deposit by id error:", error);
            return null;
        }
    },

    async verifyPendingPlayerDeposits() {
        if (this.checking) return null;

        this.checking = true;

        try {
            if (!CryptoZoo.api?.verifyPendingDepositsForPlayer) {
                return null;
            }

            const result = await CryptoZoo.api.verifyPendingDepositsForPlayer();

            if (result?.matched > 0) {
                await CryptoZoo.api.loadPlayer();
                CryptoZoo.ui?.render?.();
                await CryptoZoo.uiSettings?.loadDepositsHistory?.();
                CryptoZoo.uiSettings?.refreshSettingsModalData?.();

                CryptoZoo.ui?.showToast?.(
                    result.matched === 1
                        ? "✅ Deposit approved"
                        : `✅ Approved deposits: ${result.matched}`
                );
            }

            return result;
        } catch (error) {
            console.error("Verify pending player deposits error:", error);
            return null;
        } finally {
            this.checking = false;
        }
    },

    startInterval() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            this.verifyPendingPlayerDeposits();
        }, this.intervalMs);
    },

    stopInterval() {
        if (!this.intervalId) return;

        clearInterval(this.intervalId);
        this.intervalId = null;
    },

    bindVisibilityRefresh() {
        if (document.body?.dataset.depositVerifyVisibilityBound === "1") {
            return;
        }

        document.body.dataset.depositVerifyVisibilityBound = "1";

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.verifyPendingPlayerDeposits();
            }
        });

        window.addEventListener("focus", () => {
            this.verifyPendingPlayerDeposits();
        }, { passive: true });

        window.addEventListener("pageshow", () => {
            this.verifyPendingPlayerDeposits();
        }, { passive: true });
    },

    init() {
        this.bindVisibilityRefresh();
        this.startInterval();
        this.verifyPendingPlayerDeposits();
    }
};
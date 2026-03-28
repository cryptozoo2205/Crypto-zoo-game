window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositVerifyUI = {
    checking: false,
    intervalId: null,
    intervalMs: 15000,

    getPlayerId() {
        return String(
            CryptoZoo.api?.getPlayerId?.() ||
            CryptoZoo.state?.telegramUser?.id ||
            ""
        );
    },

    getPendingDeposits() {
        const history = Array.isArray(CryptoZoo.uiSettings?.depositsHistory)
            ? CryptoZoo.uiSettings.depositsHistory
            : [];

        return history.filter((item) => {
            const status = String(item?.status || "").toLowerCase();
            return status === "created" || status === "pending";
        });
    },

    hasPendingDeposits() {
        return this.getPendingDeposits().length > 0;
    },

    async verifyPlayerDeposits() {
        if (this.checking) {
            return false;
        }

        const telegramId = this.getPlayerId();
        if (!telegramId) {
            return false;
        }

        if (!CryptoZoo.api?.request) {
            return false;
        }

        this.checking = true;

        try {
            const result = await CryptoZoo.api.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId
                })
            });

            if (typeof CryptoZoo.uiSettings?.loadDepositsHistory === "function") {
                await CryptoZoo.uiSettings.loadDepositsHistory();
            }

            if (result?.matched > 0) {
                if (typeof CryptoZoo.api?.loadPlayer === "function") {
                    await CryptoZoo.api.loadPlayer();
                }

                CryptoZoo.ui?.render?.();
                CryptoZoo.uiSettings?.refreshSettingsModalData?.();
                CryptoZoo.uiProfile?.refreshProfileModalData?.();

                CryptoZoo.ui?.showToast?.(
                    `Deposit approved +${Number(result.matched || 0)}`
                );
            }

            return result;
        } catch (error) {
            console.error("Verify player deposits error:", error);
            return false;
        } finally {
            this.checking = false;
        }
    },

    async verifySingleDeposit(depositId) {
        const safeDepositId = String(depositId || "").trim();
        if (!safeDepositId) {
            return false;
        }

        if (!CryptoZoo.api?.request) {
            return false;
        }

        try {
            const result = await CryptoZoo.api.request("/deposit/verify", {
                method: "POST",
                body: JSON.stringify({
                    depositId: safeDepositId
                })
            });

            if (typeof CryptoZoo.uiSettings?.loadDepositsHistory === "function") {
                await CryptoZoo.uiSettings.loadDepositsHistory();
            }

            if (result?.matched) {
                if (typeof CryptoZoo.api?.loadPlayer === "function") {
                    await CryptoZoo.api.loadPlayer();
                }

                CryptoZoo.ui?.render?.();
                CryptoZoo.uiSettings?.refreshSettingsModalData?.();
                CryptoZoo.uiProfile?.refreshProfileModalData?.();

                CryptoZoo.ui?.showToast?.("Deposit approved");
            }

            return result;
        } catch (error) {
            console.error("Verify single deposit error:", error);
            return false;
        }
    },

    startAutoVerify() {
        this.stopAutoVerify();

        this.intervalId = setInterval(async () => {
            try {
                if (!this.hasPendingDeposits()) {
                    return;
                }

                await this.verifyPlayerDeposits();
            } catch (error) {
                console.error("Auto verify deposits interval error:", error);
            }
        }, this.intervalMs);
    },

    stopAutoVerify() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    async verifyNowIfNeeded() {
        if (!this.hasPendingDeposits()) {
            return false;
        }

        return this.verifyPlayerDeposits();
    },

    bindManualVerifyButton() {
        const btn = document.getElementById("settingsVerifyDepositsBtn");
        if (!btn || btn.dataset.bound) return;

        btn.dataset.bound = "1";
        btn.addEventListener("click", async () => {
            CryptoZoo.audio?.play?.("click");

            const result = await this.verifyPlayerDeposits();

            if (!result || !result.matched) {
                CryptoZoo.ui?.showToast?.("No new TON deposits");
            }
        });
    },

    init() {
        this.bindManualVerifyButton();
        this.startAutoVerify();
    }
};
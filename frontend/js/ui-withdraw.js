window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiWithdraw = {
    minWithdrawReward: 20,
    withdrawFeePercent: 0.10,
    isSavingWallet: false,
    isRequestingWithdraw: false,
    walletAddress: "",

    getApiBase() {
        const raw = String(
            CryptoZoo.config?.apiBase ||
            CryptoZoo.api?.getApiBase?.() ||
            "/api"
        ).trim();

        return raw.replace(/\/+$/, "");
    },

    getPlayerPayload() {
        const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;

        const telegramId = String(
            tg?.id ||
            CryptoZoo.state?.telegramUser?.id ||
            CryptoZoo.state?.telegramId ||
            CryptoZoo.state?.playerId ||
            ""
        ).trim();

        return {
            telegramId,
            username: tg?.username || tg?.first_name || CryptoZoo.state?.username || "Gracz"
        };
    },

    getRewardWallet() {
        return Number((Number(CryptoZoo.state?.rewardWallet) || 0).toFixed(3));
    },

    getWithdrawPending() {
        return Number((Number(CryptoZoo.state?.withdrawPending) || 0).toFixed(3));
    },

    getPlayerLevel() {
        return Math.max(1, Math.floor(Number(CryptoZoo.state?.level) || 1));
    },

    getPlayerCreatedAtMs() {
        return Math.max(
            0,
            Number(CryptoZoo.state?.createdAt) ||
            Number(CryptoZoo.state?.registeredAt) ||
            Number(CryptoZoo.state?.firstSeenAt) ||
            Number(CryptoZoo.state?.joinedAt) ||
            0
        );
    },

    getAccountAgeMs() {
        const createdAt = this.getPlayerCreatedAtMs();
        if (!createdAt) return 0;
        return Math.max(0, Date.now() - createdAt);
    },

    getWithdrawFeeAmount(rewardAmount) {
        const reward = Math.max(0, Number(rewardAmount) || 0);
        return Number((reward * this.withdrawFeePercent).toFixed(3));
    },

    getWithdrawNetAmount(rewardAmount) {
        const reward = Math.max(0, Number(rewardAmount) || 0);
        const fee = this.getWithdrawFeeAmount(reward);
        return Number(Math.max(0, reward - fee).toFixed(3));
    },

    getCurrentWalletAddress() {
        return String(
            this.walletAddress ||
            CryptoZoo.state?.tonAddress ||
            ""
        ).trim();
    },

    getWalletGetUrl(telegramId) {
        return `${this.getApiBase()}/withdraw/wallet/${encodeURIComponent(String(telegramId || "").trim())}`;
    },

    getWalletSetUrl() {
        return `${this.getApiBase()}/withdraw/set-wallet`;
    },

    getWalletInput() {
        return document.getElementById("withdrawTonWalletInput");
    },

    getAvailability() {
        const rewardWallet = this.getRewardWallet();
        const withdrawPending = this.getWithdrawPending();
        const level = this.getPlayerLevel();
        const accountAgeMs = this.getAccountAgeMs();

        if (rewardWallet < this.minWithdrawReward) {
            return {
                ok: false,
                reason: `Min withdraw ${this.minWithdrawReward}`
            };
        }

        if (withdrawPending > 0) {
            return {
                ok: false,
                reason: "Masz aktywny withdraw"
            };
        }

        if (level < 7) {
            return {
                ok: false,
                reason: "Wymagany poziom 7"
            };
        }

        if (accountAgeMs < 24 * 60 * 60 * 1000) {
            return {
                ok: false,
                reason: "Konto musi mieć minimum 24h"
            };
        }

        return {
            ok: true,
            reason: ""
        };
    },

    async loadWallet() {
        const payload = this.getPlayerPayload();
        if (!payload.telegramId) return "";

        try {
            const response = await fetch(this.getWalletGetUrl(payload.telegramId), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || "Nie udało się pobrać walleta");
            }

            this.walletAddress = String(data?.tonAddress || "").trim();
            CryptoZoo.state = CryptoZoo.state || {};
            CryptoZoo.state.tonAddress = this.walletAddress;

            const input = this.getWalletInput();
            if (input) {
                input.value = this.walletAddress;
            }

            return this.walletAddress;
        } catch (error) {
            console.error("Withdraw wallet load error:", error);
            return "";
        }
    },

    async saveWallet() {
        if (this.isSavingWallet) return false;

        const payload = this.getPlayerPayload();
        const input = this.getWalletInput();
        const tonAddress = String(input?.value || "").trim();

        if (!payload.telegramId) {
            CryptoZoo.ui?.showToast?.("Brak telegramId");
            return false;
        }

        if (!tonAddress) {
            CryptoZoo.ui?.showToast?.("Wpisz adres TON wallet");
            return false;
        }

        this.isSavingWallet = true;
        this.render();

        try {
            const response = await fetch(this.getWalletSetUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telegramId: payload.telegramId,
                    username: payload.username,
                    tonAddress
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || "Nie udało się zapisać walleta");
            }

            this.walletAddress = String(data?.tonAddress || tonAddress).trim();
            CryptoZoo.state = CryptoZoo.state || {};
            CryptoZoo.state.tonAddress = this.walletAddress;

            if (input) {
                input.value = this.walletAddress;
            }

            CryptoZoo.ui?.showToast?.("TON wallet zapisany");
            return true;
        } catch (error) {
            console.error("Withdraw wallet save error:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Błąd zapisu walleta");
            return false;
        } finally {
            this.isSavingWallet = false;
            this.render();
        }
    },

    async confirmWithdraw() {
        if (this.isRequestingWithdraw) return false;

        const availability = this.getAvailability();
        if (!availability.ok) {
            CryptoZoo.ui?.showToast?.(availability.reason);
            return false;
        }

        const input = this.getWalletInput();
        const tonAddress = String(input?.value || "").trim();

        if (!tonAddress) {
            CryptoZoo.ui?.showToast?.("Wpisz adres TON wallet");
            return false;
        }

        const currentWallet = this.getCurrentWalletAddress();
        if (tonAddress !== currentWallet) {
            const saved = await this.saveWallet();
            if (!saved) {
                return false;
            }
        }

        if (!CryptoZoo.api?.createWithdrawRequest) {
            CryptoZoo.ui?.showToast?.("createWithdrawRequest not available");
            return false;
        }

        this.isRequestingWithdraw = true;
        this.render();

        try {
            await CryptoZoo.api.createWithdrawRequest(this.getRewardWallet());

            CryptoZoo.ui?.showToast?.("Withdraw utworzony");
            CryptoZoo.uiSettings?.refreshSettingsModalData?.();
            CryptoZoo.ui?.render?.();
            this.close();

            return true;
        } catch (error) {
            console.error("Confirm withdraw error:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Błąd withdraw");
            return false;
        } finally {
            this.isRequestingWithdraw = false;
            this.render();
        }
    },

    render() {
        const grossEl = document.getElementById("withdrawGrossValue");
        const feeEl = document.getElementById("withdrawFeeValue");
        const netEl = document.getElementById("withdrawNetValue");
        const helpEl = document.getElementById("withdrawHelpText");
        const confirmBtn = document.getElementById("confirmWithdrawBtn");

        const rewardWallet = this.getRewardWallet();
        const fee = this.getWithdrawFeeAmount(rewardWallet);
        const net = this.getWithdrawNetAmount(rewardWallet);
        const availability = this.getAvailability();

        if (grossEl) grossEl.textContent = rewardWallet.toFixed(3);
        if (feeEl) feeEl.textContent = fee.toFixed(3);
        if (netEl) netEl.textContent = net.toFixed(3);

        if (helpEl) {
            if (!availability.ok) {
                helpEl.textContent = availability.reason;
            } else {
                helpEl.textContent = "Withdraw używa środków z Wallet. Wpisz adres TON wallet i potwierdź wypłatę.";
            }
        }

        if (confirmBtn) {
            const hasWalletInput = !!String(this.getWalletInput()?.value || this.getCurrentWalletAddress() || "").trim();
            const canConfirm = availability.ok && hasWalletInput && !this.isRequestingWithdraw && !this.isSavingWallet;

            confirmBtn.disabled = !canConfirm;
            confirmBtn.style.opacity = canConfirm ? "1" : "0.5";
            confirmBtn.textContent = this.isRequestingWithdraw
                ? "Wysyłanie..."
                : this.isSavingWallet
                    ? "Zapisywanie walleta..."
                    : "Wypłać";
        }
    },

    async open() {
        const modal = document.getElementById("withdrawModal");
        if (!modal) return;

        modal.classList.remove("hidden");
        this.render();
        await this.loadWallet();
        this.render();
    },

    close() {
        const modal = document.getElementById("withdrawModal");
        if (modal) {
            modal.classList.add("hidden");
        }
    },

    bind() {
        const closeBtn = document.getElementById("closeWithdrawBtn");
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.close();
            });
        }

        const backdrop = document.getElementById("withdrawBackdrop");
        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";
            backdrop.addEventListener("click", () => {
                this.close();
            });
        }

        const confirmBtn = document.getElementById("confirmWithdrawBtn");
        if (confirmBtn && !confirmBtn.dataset.bound) {
            confirmBtn.dataset.bound = "1";
            confirmBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.confirmWithdraw();
            });
        }

        const input = this.getWalletInput();
        if (input && !input.dataset.bound) {
            input.dataset.bound = "1";
            input.addEventListener("input", () => {
                this.render();
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.uiWithdraw?.bind?.();
});
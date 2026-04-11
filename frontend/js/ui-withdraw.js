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

    getWalletInput() {
        return document.getElementById("withdrawTonWalletInput");
    },

    getAmountInput() {
        return document.getElementById("withdrawAmountInput");
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

    getWithdrawRequestUrl() {
        return `${this.getApiBase()}/withdraw/request`;
    },

    getSelectedAmount() {
        const inputValue = Number(this.getAmountInput()?.value || 0);
        return Number.isFinite(inputValue) ? Number(inputValue.toFixed(3)) : 0;
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

    getAvailability() {
        const rewardWallet = this.getRewardWallet();
        const withdrawPending = this.getWithdrawPending();
        const amount = this.getSelectedAmount();

        if (withdrawPending > 0) {
            return {
                ok: false,
                reason: "Masz aktywny withdraw"
            };
        }

        if (rewardWallet < this.minWithdrawReward) {
            return {
                ok: false,
                reason: `Min withdraw ${this.minWithdrawReward}`
            };
        }

        if (amount <= 0) {
            return {
                ok: false,
                reason: "Wpisz kwotę wypłaty"
            };
        }

        if (amount < this.minWithdrawReward) {
            return {
                ok: false,
                reason: `Min withdraw ${this.minWithdrawReward}`
            };
        }

        if (amount > rewardWallet) {
            return {
                ok: false,
                reason: "Kwota większa niż Wallet"
            };
        }

        return {
            ok: true,
            reason: ""
        };
    },

    ensureAmountUi() {
        const modal = document.getElementById("withdrawModal");
        if (!modal) return;

        if (document.getElementById("withdrawAmountWrap")) {
            return;
        }

        const walletInput = document.getElementById("withdrawTonWalletInput");
        const walletRow = walletInput?.closest(".profile-boost-row");
        if (!walletRow) return;

        const amountRow = document.createElement("div");
        amountRow.id = "withdrawAmountWrap";
        amountRow.className = "profile-boost-row";
        amountRow.style.marginTop = "12px";

        amountRow.innerHTML = `
            <div class="profile-boost-left" style="width:100%;">
                <div class="profile-boost-label">Kwota reward do wypłaty</div>
                <input
                    id="withdrawAmountInput"
                    class="withdraw-wallet-input"
                    type="number"
                    inputmode="decimal"
                    min="${this.minWithdrawReward}"
                    step="0.001"
                    placeholder="Wpisz kwotę"
                >

                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button id="withdrawQuickMinBtn" class="profile-close-btn" type="button" style="margin:0;">MIN</button>
                    <button id="withdrawQuickHalfBtn" class="profile-close-btn" type="button" style="margin:0;">50%</button>
                    <button id="withdrawQuickMaxBtn" class="profile-close-btn" type="button" style="margin:0;">MAX</button>
                </div>
            </div>
        `;

        walletRow.parentNode.insertBefore(amountRow, walletRow);

        const amountInput = document.getElementById("withdrawAmountInput");
        if (amountInput && !amountInput.dataset.bound) {
            amountInput.dataset.bound = "1";
            amountInput.addEventListener("input", () => {
                this.render();
            });
        }

        const minBtn = document.getElementById("withdrawQuickMinBtn");
        if (minBtn && !minBtn.dataset.bound) {
            minBtn.dataset.bound = "1";
            minBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                const input = this.getAmountInput();
                if (input) {
                    input.value = this.minWithdrawReward.toFixed(3);
                }
                this.render();
            });
        }

        const halfBtn = document.getElementById("withdrawQuickHalfBtn");
        if (halfBtn && !halfBtn.dataset.bound) {
            halfBtn.dataset.bound = "1";
            halfBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                const input = this.getAmountInput();
                if (input) {
                    const value = Math.max(
                        this.minWithdrawReward,
                        Number((this.getRewardWallet() / 2).toFixed(3))
                    );
                    input.value = value.toFixed(3);
                }
                this.render();
            });
        }

        const maxBtn = document.getElementById("withdrawQuickMaxBtn");
        if (maxBtn && !maxBtn.dataset.bound) {
            maxBtn.dataset.bound = "1";
            maxBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                const input = this.getAmountInput();
                if (input) {
                    input.value = this.getRewardWallet().toFixed(3);
                }
                this.render();
            });
        }
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

        const payload = this.getPlayerPayload();
        const tonAddress = String(this.getWalletInput()?.value || "").trim();
        const amount = this.getSelectedAmount();

        if (!payload.telegramId) {
            CryptoZoo.ui?.showToast?.("Brak telegramId");
            return false;
        }

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

        this.isRequestingWithdraw = true;
        this.render();

        try {
            const response = await fetch(this.getWithdrawRequestUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telegramId: payload.telegramId,
                    username: payload.username,
                    tonAddress,
                    amount
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || "Błąd withdraw");
            }

            if (data?.player) {
                CryptoZoo.state = CryptoZoo.api?.mergeStates
                    ? CryptoZoo.api.mergeStates(data.player, CryptoZoo.state || {})
                    : { ...(CryptoZoo.state || {}), ...data.player };
            }

            if (typeof CryptoZoo.api?.writeLocalState === "function") {
                CryptoZoo.api.writeLocalState(CryptoZoo.state);
            }

            CryptoZoo.ui?.showToast?.("Withdraw utworzony");
            CryptoZoo.uiSettings?.loadWithdrawHistory?.();
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

        const amount = this.getSelectedAmount();
        const fee = this.getWithdrawFeeAmount(amount);
        const net = this.getWithdrawNetAmount(amount);
        const availability = this.getAvailability();

        if (grossEl) grossEl.textContent = amount.toFixed(3);
        if (feeEl) feeEl.textContent = fee.toFixed(3);
        if (netEl) netEl.textContent = net.toFixed(3);

        if (helpEl) {
            if (!availability.ok) {
                helpEl.textContent = availability.reason;
            } else {
                helpEl.textContent = `Dostępne w Wallet: ${this.getRewardWallet().toFixed(3)} • Wpisz kwotę i adres TON wallet.`;
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

        this.ensureAmountUi();

        const amountInput = this.getAmountInput();
        if (amountInput) {
            const defaultAmount = Math.max(
                0,
                Number(
                    Math.min(this.getRewardWallet(), this.minWithdrawReward).toFixed(3)
                )
            );

            amountInput.value = defaultAmount > 0 ? defaultAmount.toFixed(3) : "";
        }

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
        this.ensureAmountUi();

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

        const walletInput = this.getWalletInput();
        if (walletInput && !walletInput.dataset.bound) {
            walletInput.dataset.bound = "1";
            walletInput.addEventListener("input", () => {
                this.render();
            });
        }

        const amountInput = this.getAmountInput();
        if (amountInput && !amountInput.dataset.boundFinal) {
            amountInput.dataset.boundFinal = "1";
            amountInput.addEventListener("input", () => {
                this.render();
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.uiWithdraw?.bind?.();
});
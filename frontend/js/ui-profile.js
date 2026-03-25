window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    modalOpen: false,
    minWithdrawReward: 3,
    withdrawHistory: [],
    withdrawHistoryLoading: false,
    fallbackAvatarPath: "assets/ui/avatar.png",

    getRewardBalance() {
        return Number((Number(CryptoZoo.state?.rewardBalance) || 0).toFixed(3));
    },

    getRewardWallet() {
        return Number((Number(CryptoZoo.state?.rewardWallet) || 0).toFixed(3));
    },

    getWithdrawPending() {
        return Number((Number(CryptoZoo.state?.withdrawPending) || 0).toFixed(3));
    },

    canWithdraw() {
        return this.getRewardWallet() >= this.minWithdrawReward;
    },

    format(v) {
        return Number((Number(v) || 0).toFixed(3));
    },

    /* =========================
       RENDER
    ========================= */

    refreshProfileModalData() {
        const balance = this.getRewardBalance();
        const wallet = this.getRewardWallet();
        const pending = this.getWithdrawPending();

        const elBalance = document.getElementById("profileRewardBalance");
        const elWallet = document.getElementById("profileRewardWallet");
        const elPending = document.getElementById("profileWithdrawPending");

        if (elBalance) elBalance.textContent = this.format(balance);
        if (elWallet) elWallet.textContent = this.format(wallet);
        if (elPending) elPending.textContent = this.format(pending);

        const transferBtn = document.getElementById("transferRewardBtn");
        if (transferBtn) {
            transferBtn.disabled = balance <= 0;
            transferBtn.style.opacity = balance > 0 ? "1" : "0.5";
            transferBtn.textContent =
                balance > 0
                    ? `Transfer (${balance.toFixed(3)})`
                    : "Brak reward";
        }

        const withdrawBtn = document.getElementById("requestWithdrawBtn");
        if (withdrawBtn) {
            const can = this.canWithdraw();
            withdrawBtn.disabled = !can;
            withdrawBtn.style.opacity = can ? "1" : "0.5";
            withdrawBtn.textContent = can
                ? `Withdraw (${wallet.toFixed(3)})`
                : `Min ${this.minWithdrawReward}`;
        }

        this.renderWithdrawHistory();
    },

    /* =========================
       TRANSFER
    ========================= */

    async transferRewardToWallet() {
        const amount = this.getRewardBalance();

        if (amount <= 0) {
            CryptoZoo.ui?.showToast?.("Brak reward");
            return false;
        }

        CryptoZoo.state.rewardWallet =
            this.getRewardWallet() + amount;

        CryptoZoo.state.rewardBalance = 0;

        await CryptoZoo.api.savePlayer();

        CryptoZoo.ui?.showToast?.(`+${amount.toFixed(3)} reward → wallet`);

        this.refreshProfileModalData();
        CryptoZoo.ui?.render?.();

        return true;
    },

    /* =========================
       WITHDRAW
    ========================= */

    async requestWithdraw() {
        const wallet = this.getRewardWallet();

        if (wallet < this.minWithdrawReward) {
            CryptoZoo.ui?.showToast?.(`Min ${this.minWithdrawReward}`);
            return false;
        }

        try {
            await CryptoZoo.api.createWithdrawRequest(wallet);

            CryptoZoo.ui?.showToast?.(
                `Withdraw ${wallet.toFixed(3)}`
            );

            await this.loadWithdrawHistory();
            this.refreshProfileModalData();

            return true;
        } catch (e) {
            CryptoZoo.ui?.showToast?.(e.message || "Błąd withdraw");
            return false;
        }
    },

    /* =========================
       HISTORY
    ========================= */

    async loadWithdrawHistory() {
        this.withdrawHistoryLoading = true;
        this.renderWithdrawHistory();

        try {
            const list = await CryptoZoo.api.loadWithdrawHistory();
            this.withdrawHistory = Array.isArray(list) ? list : [];
        } catch (e) {
            this.withdrawHistory = [];
        }

        this.withdrawHistoryLoading = false;
        this.renderWithdrawHistory();
    },

    renderWithdrawHistory() {
        const el = document.getElementById("profileWithdrawHistoryList");
        if (!el) return;

        if (this.withdrawHistoryLoading) {
            el.innerHTML = `<div>Loading...</div>`;
            return;
        }

        if (!this.withdrawHistory.length) {
            el.innerHTML = `<div>Brak historii</div>`;
            return;
        }

        el.innerHTML = this.withdrawHistory
            .map((w) => {
                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.format(w.amount)} reward</div>
                        <div>${w.status}</div>
                    </div>
                `;
            })
            .join("");
    },

    /* =========================
       MODAL
    ========================= */

    async openProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        modal.classList.remove("hidden");
        this.modalOpen = true;

        this.refreshProfileModalData();
        await this.loadWithdrawHistory();
    },

    closeProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        modal.classList.add("hidden");
        this.modalOpen = false;
    },

    /* =========================
       BIND
    ========================= */

    bindProfileModal() {
        const openBtn = document.getElementById("topProfileBtn");
        const closeBtn = document.getElementById("closeProfileBtn");
        const transferBtn = document.getElementById("transferRewardBtn");
        const withdrawBtn = document.getElementById("requestWithdrawBtn");

        if (openBtn && !openBtn.dataset.bound) {
            openBtn.dataset.bound = "1";
            openBtn.onclick = () => this.openProfileModal();
        }

        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.onclick = () => this.closeProfileModal();
        }

        if (transferBtn && !transferBtn.dataset.bound) {
            transferBtn.dataset.bound = "1";
            transferBtn.onclick = () => this.transferRewardToWallet();
        }

        if (withdrawBtn && !withdrawBtn.dataset.bound) {
            withdrawBtn.dataset.bound = "1";
            withdrawBtn.onclick = () => this.requestWithdraw();
        }
    }
};
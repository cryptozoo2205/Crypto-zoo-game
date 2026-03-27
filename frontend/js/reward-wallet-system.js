window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.rewardWallet = {
    getWalletBalance() {
        return Math.max(0, Number(CryptoZoo.state?.rewardWallet) || 0);
    },

    getWithdrawPendingBalance() {
        return Math.max(0, Number(CryptoZoo.state?.withdrawPending) || 0);
    },

    getTransferableBalance() {
        return Math.max(0, Number(CryptoZoo.state?.rewardBalance) || 0);
    },

    transferToWallet(amount) {
        CryptoZoo.state = CryptoZoo.state || {};

        const available = this.getTransferableBalance();

        let transferAmount = Number(amount);

        if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
            transferAmount = available;
        }

        transferAmount = Math.floor(transferAmount * 1000) / 1000;

        if (transferAmount <= 0 || available <= 0) {
            CryptoZoo.ui?.showToast?.("Brak reward do transferu");
            return false;
        }

        if (transferAmount > available) {
            transferAmount = available;
        }

        transferAmount = Math.floor(transferAmount * 1000) / 1000;

        CryptoZoo.state.rewardBalance = Number(
            (
                Math.max(0, Number(CryptoZoo.state.rewardBalance) || 0) - transferAmount
            ).toFixed(3)
        );

        CryptoZoo.state.rewardWallet = Number(
            (
                (Number(CryptoZoo.state.rewardWallet) || 0) + transferAmount
            ).toFixed(3)
        );

        CryptoZoo.gameplay?.persistAndRender?.();

        CryptoZoo.ui?.showToast?.(
            `Przeniesiono ${transferAmount.toFixed(3)} reward do wallet`
        );

        return true;
    }
};
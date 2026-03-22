window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    modalOpen: false,
    minWithdrawReward: 10,

    getPlayerName() {
        const username =
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramFirstName") ||
            "Crypto Zoo";

        return String(username || "Crypto Zoo");
    },

    getPlayerSubtitle() {
        const username = localStorage.getItem("telegramUsername");
        if (username) {
            return `@${username}`;
        }

        const playerId =
            localStorage.getItem("telegramId") ||
            "local-player";

        return `ID: ${playerId}`;
    },

    getAnimalsTotal() {
        const animals = CryptoZoo.state?.animals || {};
        return Object.values(animals).reduce((sum, animal) => {
            return sum + Math.max(0, Number(animal?.count) || 0);
        }, 0);
    },

    getSpeciesUnlocked() {
        const animals = CryptoZoo.state?.animals || {};
        return Object.values(animals).reduce((sum, animal) => {
            return sum + ((Number(animal?.count) || 0) > 0 ? 1 : 0);
        }, 0);
    },

    getBoxesTotal() {
        const boxes = CryptoZoo.state?.boxes || {};
        return Object.values(boxes).reduce((sum, value) => {
            return sum + Math.max(0, Number(value) || 0);
        }, 0);
    },

    getRankingPlace() {
        const ranking = CryptoZoo.ui?.rankingCache;
        if (Array.isArray(ranking) && ranking.length) {
            const current = ranking.find((row) => row.isCurrentPlayer);
            if (current?.rank) {
                return `#${current.rank}`;
            }
        }

        return "#-";
    },

    getBoostStatusText() {
        const isActive = CryptoZoo.boostSystem?.isActive?.() || false;
        if (!isActive) return "Nieaktywny";

        const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
        const formatted = CryptoZoo.ui?.formatTimeLeft?.(left) || "00:00:00";
        return `Aktywny • ${formatted}`;
    },

    getRewardBalanceValue() {
        return Number(((Number(CryptoZoo.state?.rewardBalance) || 0)).toFixed(3));
    },

    getRewardWalletValue() {
        return Number(((Number(CryptoZoo.state?.rewardWallet) || 0)).toFixed(3));
    },

    getWithdrawPendingValue() {
        return Number(((Number(CryptoZoo.state?.withdrawPending) || 0)).toFixed(3));
    },

    formatRewardValue(value) {
        return Number((Number(value) || 0).toFixed(3)).toString();
    },

    canWithdraw() {
        return this.getRewardWalletValue() >= this.minWithdrawReward;
    },

    renderTopBarProfile() {
        const nameEl = document.getElementById("topPlayerName");
        const statusEl = document.getElementById("topPlayerStatus");

        if (nameEl) {
            nameEl.textContent = this.getPlayerName();
        }

        if (statusEl) {
            statusEl.textContent = "● Online";
        }
    },

    refreshProfileModalData() {
        const profileName = document.getElementById("profileName");
        const profileSubtitle = document.getElementById("profileSubtitle");
        const animalsTotal = document.getElementById("profileAnimalsTotal");
        const speciesUnlocked = document.getElementById("profileSpeciesUnlocked");
        const boxesTotal = document.getElementById("profileBoxesTotal");
        const rankingPlace = document.getElementById("profileRankingPlace");
        const rewardBalance = document.getElementById("profileRewardBalance");
        const rewardWallet = document.getElementById("profileRewardWallet");
        const withdrawPending = document.getElementById("profileWithdrawPending");
        const boostStatus = document.getElementById("profileBoostStatus");
        const transferBtn = document.getElementById("transferRewardBtn");
        const withdrawBtn = document.getElementById("requestWithdrawBtn");

        const availableReward = this.getRewardBalanceValue();
        const walletReward = this.getRewardWalletValue();
        const pendingReward = this.getWithdrawPendingValue();

        if (profileName) {
            profileName.textContent = this.getPlayerName();
        }

        if (profileSubtitle) {
            profileSubtitle.textContent = this.getPlayerSubtitle();
        }

        if (animalsTotal) {
            animalsTotal.textContent = CryptoZoo.formatNumber(this.getAnimalsTotal());
        }

        if (speciesUnlocked) {
            speciesUnlocked.textContent = CryptoZoo.formatNumber(this.getSpeciesUnlocked());
        }

        if (boxesTotal) {
            boxesTotal.textContent = CryptoZoo.formatNumber(this.getBoxesTotal());
        }

        if (rankingPlace) {
            rankingPlace.textContent = this.getRankingPlace();
        }

        if (rewardBalance) {
            rewardBalance.textContent = this.formatRewardValue(availableReward);
        }

        if (rewardWallet) {
            rewardWallet.textContent = this.formatRewardValue(walletReward);
        }

        if (withdrawPending) {
            withdrawPending.textContent = this.formatRewardValue(pendingReward);
        }

        if (boostStatus) {
            boostStatus.textContent = this.getBoostStatusText();
        }

        if (transferBtn) {
            transferBtn.disabled = availableReward <= 0;
            transferBtn.style.opacity = availableReward > 0 ? "1" : "0.6";
            transferBtn.textContent =
                availableReward > 0
                    ? `Transfer Reward (${availableReward.toFixed(3)})`
                    : "Brak Reward do transferu";
        }

        if (withdrawBtn) {
            const canWithdraw = this.canWithdraw();

            withdrawBtn.disabled = !canWithdraw;
            withdrawBtn.style.opacity = canWithdraw ? "1" : "0.6";
            withdrawBtn.textContent = canWithdraw
                ? `Withdraw Request (${walletReward.toFixed(3)})`
                : `Min withdraw ${this.minWithdrawReward.toFixed(3)}`;
        }
    },

    openProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        modal.classList.remove("hidden");
        this.modalOpen = true;
        this.refreshProfileModalData();
    },

    closeProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        modal.classList.add("hidden");
        this.modalOpen = false;
    },

    transferRewardToWallet() {
        CryptoZoo.state = CryptoZoo.state || {};

        const rewardBalance = this.getRewardBalanceValue();

        if (rewardBalance <= 0) {
            CryptoZoo.ui?.showToast?.("Brak Reward do transferu");
            this.refreshProfileModalData();
            return false;
        }

        CryptoZoo.state.rewardWallet = Number(
            ((Number(CryptoZoo.state.rewardWallet) || 0) + rewardBalance).toFixed(3)
        );

        CryptoZoo.state.rewardBalance = 0;

        CryptoZoo.audio?.play?.("win");
        this.refreshProfileModalData();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(`💎 Transfer +${rewardBalance.toFixed(3)} reward`);
        return true;
    },

    requestWithdraw() {
        CryptoZoo.state = CryptoZoo.state || {};

        const walletReward = this.getRewardWalletValue();

        if (walletReward < this.minWithdrawReward) {
            CryptoZoo.ui?.showToast?.(
                `Min withdraw ${this.minWithdrawReward.toFixed(3)} reward`
            );
            this.refreshProfileModalData();
            return false;
        }

        CryptoZoo.state.rewardWallet = 0;
        CryptoZoo.state.withdrawPending = Number(
            ((Number(CryptoZoo.state.withdrawPending) || 0) + walletReward).toFixed(3)
        );

        CryptoZoo.audio?.play?.("win");
        this.refreshProfileModalData();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(
            `📤 Withdraw request +${walletReward.toFixed(3)} reward`
        );
        return true;
    },

    bindProfileModal() {
        const openBtn = document.getElementById("topProfileBtn");
        const closeBtn = document.getElementById("closeProfileBtn");
        const backdrop = document.getElementById("profileBackdrop");
        const transferBtn = document.getElementById("transferRewardBtn");
        const withdrawBtn = document.getElementById("requestWithdrawBtn");

        if (openBtn && !openBtn.dataset.bound) {
            openBtn.dataset.bound = "1";
            openBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.openProfileModal();
            };
        }

        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.closeProfileModal();
            };
        }

        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";
            backdrop.onclick = () => {
                this.closeProfileModal();
            };
        }

        if (transferBtn && !transferBtn.dataset.bound) {
            transferBtn.dataset.bound = "1";
            transferBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.transferRewardToWallet();
            };
        }

        if (withdrawBtn && !withdrawBtn.dataset.bound) {
            withdrawBtn.dataset.bound = "1";
            withdrawBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.requestWithdraw();
            };
        }
    }
};
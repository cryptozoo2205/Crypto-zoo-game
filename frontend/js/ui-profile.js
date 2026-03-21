window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    getProfileUsername() {
        const fromApi = CryptoZoo.api?.getUsername?.();
        if (fromApi && String(fromApi).trim()) {
            return String(fromApi).trim();
        }

        return (
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramFirstName") ||
            "Gracz"
        );
    },

    getProfileSubtitle() {
        const username = localStorage.getItem("telegramUsername");
        if (username) {
            return "@" + username;
        }

        const playerId = String(CryptoZoo.api?.getPlayerId?.() || "Brak ID");

        if (playerId === "local-player") {
            return "Tryb lokalny";
        }

        return "ID: " + playerId;
    },

    getAnimalsSummary() {
        const animals = CryptoZoo.state?.animals || {};
        let totalAnimals = 0;
        let unlockedSpecies = 0;

        Object.keys(animals).forEach((type) => {
            const count = Number(animals[type]?.count) || 0;
            totalAnimals += count;

            if (count > 0) {
                unlockedSpecies += 1;
            }
        });

        return {
            totalAnimals,
            unlockedSpecies
        };
    },

    getBoxesTotal() {
        const boxes = CryptoZoo.state?.boxes || {};
        return (
            (Number(boxes.common) || 0) +
            (Number(boxes.rare) || 0) +
            (Number(boxes.epic) || 0) +
            (Number(boxes.legendary) || 0)
        );
    },

    getCurrentPlayerRankingPlace() {
        const currentId = String(CryptoZoo.api?.getPlayerId?.() || "");

        if (currentId === "local-player") {
            return "#1";
        }

        const ranking = Array.isArray(CryptoZoo.ui?.rankingCache)
            ? CryptoZoo.ui.rankingCache
            : [];

        const index = ranking.findIndex((row) => {
            return String(row.telegramId || "") === currentId || row.isCurrentPlayer === true;
        });

        return index >= 0 ? "#" + String(index + 1) : "#-";
    },

    getRewardWalletInfoElements() {
        const rows = Array.from(
            document.querySelectorAll("#profileModal .profile-boost-row")
        );

        const rewardWalletRow = rows.find((row) => {
            const label = String(
                row.querySelector(".profile-boost-label")?.textContent || ""
            ).trim().toLowerCase();

            return label === "reward wallet";
        });

        const rewardWalletValue = rewardWalletRow
            ? rewardWalletRow.querySelector(".profile-boost-value")
            : null;

        return {
            rewardWalletRow,
            rewardWalletValue
        };
    },

    refreshProfileModalData() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        const username = this.getProfileUsername();
        const subtitle = this.getProfileSubtitle();
        const summary = this.getAnimalsSummary();
        const boxesTotal = this.getBoxesTotal();

        const rewardBalance = Math.max(0, Number(CryptoZoo.state?.rewardBalance) || 0);
        const rewardWallet = Math.max(0, Number(CryptoZoo.state?.rewardWallet) || 0);
        const withdrawPending = Math.max(0, Number(CryptoZoo.state?.withdrawPending) || 0);

        const boostActive = CryptoZoo.gameplay?.isBoost2xActive?.() || false;
        const boostLeft = CryptoZoo.gameplay?.getBoost2xTimeLeft?.() || 0;
        const boostLabel = boostActive
            ? `Aktywny • ${CryptoZoo.ui?.formatTimeLeft?.(boostLeft) || "00:00:00"}`
            : "Nieaktywny";

        CryptoZoo.ui?.updateText?.("profileName", username);
        CryptoZoo.ui?.updateText?.("profileSubtitle", subtitle);
        CryptoZoo.ui?.updateText?.("profileAnimalsTotal", CryptoZoo.formatNumber(summary.totalAnimals));
        CryptoZoo.ui?.updateText?.("profileSpeciesUnlocked", CryptoZoo.formatNumber(summary.unlockedSpecies));
        CryptoZoo.ui?.updateText?.("profileBoxesTotal", CryptoZoo.formatNumber(boxesTotal));
        CryptoZoo.ui?.updateText?.("profileRankingPlace", this.getCurrentPlayerRankingPlace());
        CryptoZoo.ui?.updateText?.("profileRewardBalance", CryptoZoo.formatNumber(rewardBalance));
        CryptoZoo.ui?.updateText?.("profileRewardWallet", CryptoZoo.formatNumber(rewardWallet));
        CryptoZoo.ui?.updateText?.("profileWithdrawPending", CryptoZoo.formatNumber(withdrawPending));
        CryptoZoo.ui?.updateText?.("profileBoostStatus", boostLabel);

        const boostStatusEl = document.getElementById("profileBoostStatus");
        if (boostStatusEl) {
            boostStatusEl.classList.toggle("active", boostActive);
        }

        const { rewardWalletValue } = this.getRewardWalletInfoElements();
        if (rewardWalletValue) {
            rewardWalletValue.textContent =
                rewardBalance > 0
                    ? `Przenieś ${CryptoZoo.formatNumber(rewardBalance)} Reward do Wallet`
                    : "Brak Reward do przeniesienia";
        }

        const transferBtn = document.getElementById("transferRewardBtn");
        if (transferBtn) {
            if (rewardBalance > 0) {
                transferBtn.textContent = "Transfer Reward";
                transferBtn.disabled = false;
                transferBtn.style.opacity = "1";
                transferBtn.style.filter = "none";
                transferBtn.style.cursor = "pointer";
            } else {
                transferBtn.textContent = "Brak Reward do transferu";
                transferBtn.disabled = true;
                transferBtn.style.opacity = "0.7";
                transferBtn.style.filter = "grayscale(0.15)";
                transferBtn.style.cursor = "not-allowed";
            }
        }
    },

    renderTopBarProfile() {
        const topPlayerName = document.getElementById("topPlayerName");
        const topPlayerStatus = document.getElementById("topPlayerStatus");

        if (topPlayerName) {
            topPlayerName.textContent = this.getProfileUsername();
        }

        if (topPlayerStatus) {
            topPlayerStatus.textContent = "● Online";
        }
    },

    openProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        this.refreshProfileModalData();
        modal.classList.remove("hidden");
    },

    closeProfileModal() {
        document.getElementById("profileModal")?.classList.add("hidden");
    },

    bindProfileModal() {
        const openBtn = document.getElementById("topProfileBtn");
        if (openBtn && !openBtn.dataset.bound) {
            openBtn.dataset.bound = "1";
            openBtn.addEventListener("click", () => {
                this.openProfileModal();
            });
        }

        const closeBtn = document.getElementById("closeProfileBtn");
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.addEventListener("click", () => {
                this.closeProfileModal();
            });
        }

        const backdrop = document.getElementById("profileBackdrop");
        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";
            backdrop.addEventListener("click", () => {
                this.closeProfileModal();
            });
        }

        const transferBtn = document.getElementById("transferRewardBtn");
        if (transferBtn && !transferBtn.dataset.bound) {
            transferBtn.dataset.bound = "1";
            transferBtn.addEventListener("click", () => {
                const rewardBalance = Math.max(0, Number(CryptoZoo.state?.rewardBalance) || 0);

                if (rewardBalance <= 0) {
                    CryptoZoo.ui?.showToast?.("Brak Reward do transferu");
                    this.refreshProfileModalData();
                    return;
                }

                const success = CryptoZoo.gameplay?.transferRewardToWallet?.();

                if (!success) {
                    CryptoZoo.ui?.showToast?.("Brak Reward do transferu");
                }

                this.refreshProfileModalData();
            });
        }
    }
};
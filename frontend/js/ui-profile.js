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

    removeDuplicateStatBoxes() {
        const grid = document.querySelector("#profileModal .profile-grid");
        if (!grid) return;

        const boxes = Array.from(grid.querySelectorAll(".profile-box"));
        const seenLabels = new Set();

        boxes.forEach((box) => {
            const labelEl = box.querySelector(".profile-box-label");
            const label = String(labelEl?.textContent || "")
                .trim()
                .toLowerCase();

            if (!label) return;

            if (seenLabels.has(label)) {
                box.remove();
                return;
            }

            seenLabels.add(label);
        });
    },

    ensureSingleStatBox(labelText, valueId) {
        const grid = document.querySelector("#profileModal .profile-grid");
        if (!grid) return null;

        const normalizedTarget = String(labelText).trim().toLowerCase();
        const boxes = Array.from(grid.querySelectorAll(".profile-box"));

        let found = null;

        boxes.forEach((box) => {
            const labelEl = box.querySelector(".profile-box-label");
            const label = String(labelEl?.textContent || "").trim().toLowerCase();

            if (label !== normalizedTarget) return;

            if (!found) {
                found = box;
            } else {
                box.remove();
            }
        });

        if (!found) {
            found = document.createElement("div");
            found.className = "profile-box";
            found.innerHTML = `
                <div class="profile-box-label">${labelText}</div>
                <div class="profile-box-value" id="${valueId}">0</div>
            `;
            grid.appendChild(found);
        } else {
            const valueEl = found.querySelector(".profile-box-value");
            if (valueEl && valueEl.id !== valueId) {
                valueEl.id = valueId;
            }
        }

        return found;
    },

    ensureRewardBoxes() {
        this.removeDuplicateStatBoxes();

        this.ensureSingleStatBox("Reward", "profileRewardBalance");
        this.ensureSingleStatBox("Wallet", "profileRewardWallet");
        this.ensureSingleStatBox("Pending", "profileWithdrawPending");
    },

    removeDuplicateTransferSections() {
        const card = document.querySelector("#profileModal .profile-card");
        if (!card) return;

        const boostRows = Array.from(card.querySelectorAll(".profile-boost-row"));
        const transferRows = boostRows.filter((row) => {
            const label = String(row.querySelector(".profile-boost-label")?.textContent || "")
                .trim()
                .toLowerCase();
            return label === "reward wallet";
        });

        if (transferRows.length > 1) {
            transferRows.slice(1).forEach((row) => row.remove());
        }

        const transferButtons = Array.from(card.querySelectorAll("button")).filter((btn) => {
            const text = String(btn.textContent || "").trim().toLowerCase();
            return text.includes("transfer reward") || text.includes("brak reward do transferu");
        });

        if (transferButtons.length > 1) {
            transferButtons.slice(1).forEach((btn) => btn.remove());
        }
    },

    ensureRewardWalletTransferRow() {
        const card = document.querySelector("#profileModal .profile-card");
        if (!card) return;

        this.removeDuplicateTransferSections();

        let transferRow = Array.from(card.querySelectorAll(".profile-boost-row")).find((row) => {
            const label = String(row.querySelector(".profile-boost-label")?.textContent || "")
                .trim()
                .toLowerCase();
            return label === "reward wallet";
        });

        if (!transferRow) {
            transferRow = document.createElement("div");
            transferRow.className = "profile-boost-row";
            transferRow.id = "profileRewardWalletTransferRow";
            transferRow.innerHTML = `
                <div class="profile-boost-left">
                    <div class="profile-boost-label">Reward Wallet</div>
                    <div class="profile-boost-value" id="profileRewardWalletTransferText">Przenieś Reward do Wallet</div>
                </div>
            `;

            const closeBtn = document.getElementById("closeProfileBtn");
            if (closeBtn) {
                card.insertBefore(transferRow, closeBtn);
            } else {
                card.appendChild(transferRow);
            }
        } else {
            transferRow.id = "profileRewardWalletTransferRow";

            let textEl = transferRow.querySelector("#profileRewardWalletTransferText");
            if (!textEl) {
                const valueEl = transferRow.querySelector(".profile-boost-value");
                if (valueEl) {
                    valueEl.id = "profileRewardWalletTransferText";
                    textEl = valueEl;
                }
            }

            if (!textEl) {
                transferRow.innerHTML = `
                    <div class="profile-boost-left">
                        <div class="profile-boost-label">Reward Wallet</div>
                        <div class="profile-boost-value" id="profileRewardWalletTransferText">Przenieś Reward do Wallet</div>
                    </div>
                `;
            }
        }

        let transferBtn = document.getElementById("profileTransferRewardBtn");

        if (!transferBtn) {
            transferBtn = document.createElement("button");
            transferBtn.id = "profileTransferRewardBtn";
            transferBtn.className = "profile-close-btn";
            transferBtn.type = "button";

            const closeBtn = document.getElementById("closeProfileBtn");
            if (closeBtn) {
                card.insertBefore(transferBtn, closeBtn);
            } else {
                card.appendChild(transferBtn);
            }
        }

        if (!transferBtn.dataset.bound) {
            transferBtn.dataset.bound = "1";
            transferBtn.addEventListener("click", () => {
                const rewardBalance = Math.max(0, Number(CryptoZoo.state?.rewardBalance) || 0);

                if (rewardBalance <= 0) {
                    CryptoZoo.ui?.showToast?.("Brak Reward do transferu");
                    return;
                }

                const success = CryptoZoo.gameplay?.transferRewardToWallet?.();

                if (!success) {
                    CryptoZoo.ui?.showToast?.("Brak Reward do transferu");
                }
            });
        }
    },

    refreshProfileModalData() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        this.ensureRewardBoxes();
        this.ensureRewardWalletTransferRow();

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

        const transferTextEl = document.getElementById("profileRewardWalletTransferText");
        if (transferTextEl) {
            transferTextEl.textContent =
                rewardBalance > 0
                    ? `Dostępne do przeniesienia: ${CryptoZoo.formatNumber(rewardBalance)}`
                    : "Brak Reward do przeniesienia";
        }

        const transferBtn = document.getElementById("profileTransferRewardBtn");
        if (transferBtn) {
            if (rewardBalance > 0) {
                transferBtn.textContent = `Transfer Reward`;
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
    }
};
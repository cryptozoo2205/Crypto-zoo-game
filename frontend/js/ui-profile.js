window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    modalOpen: false,
    minWithdrawReward: 3,
    withdrawHistory: [],
    withdrawHistoryLoading: false,
    fallbackAvatarPath: "assets/ui/avatar.png",

    t(key, fallback) {
        return CryptoZoo.lang?.t?.(key) || fallback || key;
    },

    getTelegramPhotoUrl() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        const photoUrl = String(tgUser?.photo_url || "").trim();
        return photoUrl || "";
    },

    getAvatarSrc() {
        return this.getTelegramPhotoUrl() || this.fallbackAvatarPath;
    },

    getPlayerName() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        if (tgUser?.first_name || tgUser?.last_name) {
            return [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim();
        }

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
        if (!isActive) return this.t("inactive", "Nieaktywny");

        const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
        const formatted = CryptoZoo.ui?.formatTimeLeft?.(left) || "00:00:00";
        return `${this.t("active", "Aktywny")} • ${formatted}`;
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

    formatHistoryDate(timestamp) {
        const safe = Number(timestamp) || 0;
        if (!safe) return "--";

        const date = new Date(safe);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    },

    getStatusLabel(status) {
        const safe = String(status || "").toLowerCase();

        if (safe === "approved") return this.t("approved", "Approved");
        if (safe === "rejected") return this.t("rejected", "Rejected");
        return this.t("pendingStatus", "Pending");
    },

    getStatusStyle(status) {
        const safe = String(status || "").toLowerCase();

        if (safe === "approved") {
            return `
                background: rgba(76, 175, 80, 0.16);
                color: #9cffaf;
                border: 1px solid rgba(76, 175, 80, 0.28);
            `;
        }

        if (safe === "rejected") {
            return `
                background: rgba(244, 67, 54, 0.14);
                color: #ff9e98;
                border: 1px solid rgba(244, 67, 54, 0.26);
            `;
        }

        return `
            background: rgba(255, 191, 0, 0.14);
            color: #ffd96f;
            border: 1px solid rgba(255, 191, 0, 0.26);
        `;
    },

    renderWithdrawHistory() {
        const mount = document.getElementById("profileWithdrawHistoryList");
        if (!mount) return;

        if (this.withdrawHistoryLoading) {
            mount.innerHTML = `
                <div style="
                    padding:12px;
                    border-radius:14px;
                    background:rgba(255,255,255,0.04);
                    color:rgba(255,255,255,0.78);
                    font-weight:700;
                    font-size:13px;
                    text-align:center;
                ">
                    ${this.t("loadingHistory", "Ładowanie historii...")}
                </div>
            `;
            return;
        }

        if (!Array.isArray(this.withdrawHistory) || this.withdrawHistory.length === 0) {
            mount.innerHTML = `
                <div style="
                    padding:12px;
                    border-radius:14px;
                    background:rgba(255,255,255,0.04);
                    color:rgba(255,255,255,0.72);
                    font-weight:700;
                    font-size:13px;
                    text-align:center;
                ">
                    ${this.t("noWithdrawRequests", "Brak withdraw requestów")}
                </div>
            `;
            return;
        }

        mount.innerHTML = this.withdrawHistory.map((item) => {
            const amount = this.formatRewardValue(item?.amount || 0);
            const status = this.getStatusLabel(item?.status);
            const date = this.formatHistoryDate(item?.createdAt);
            const note = String(item?.note || "").trim();

            return `
                <div style="
                    padding:12px;
                    border-radius:16px;
                    background:linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.96) 100%);
                    border:1px solid rgba(255,255,255,0.08);
                    margin-bottom:10px;
                ">
                    <div style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        margin-bottom:8px;
                    ">
                        <div style="
                            font-size:14px;
                            font-weight:900;
                            color:#ffffff;
                        ">
                            ${amount} ${this.t("rewardWord", "reward")}
                        </div>

                        <div style="
                            padding:5px 9px;
                            border-radius:999px;
                            font-size:11px;
                            font-weight:900;
                            ${this.getStatusStyle(item?.status)}
                        ">
                            ${status}
                        </div>
                    </div>

                    <div style="
                        font-size:12px;
                        color:rgba(255,255,255,0.68);
                        font-weight:700;
                        line-height:1.4;
                    ">
                        ${date}
                    </div>

                    ${note ? `
                        <div style="
                            margin-top:8px;
                            font-size:12px;
                            color:rgba(255,255,255,0.82);
                            line-height:1.45;
                            font-weight:700;
                        ">
                            ${this.t("note", "Note")}: ${note}
                        </div>
                    ` : ""}
                </div>
            `;
        }).join("");
    },

    async loadWithdrawHistory() {
        const mount = document.getElementById("profileWithdrawHistoryList");
        if (!mount) return;

        this.withdrawHistoryLoading = true;
        this.renderWithdrawHistory();

        try {
            const requests = await CryptoZoo.api?.loadWithdrawHistory?.();
            this.withdrawHistory = Array.isArray(requests) ? requests : [];
        } catch (error) {
            console.error("Withdraw history load error:", error);
            this.withdrawHistory = [];
            CryptoZoo.ui?.showToast?.(this.t("withdrawHistoryLoadError", "Nie udało się pobrać historii withdraw"));
        }

        this.withdrawHistoryLoading = false;
        this.renderWithdrawHistory();
    },

    renderTopBarProfile() {
        const nameEl = document.getElementById("topPlayerName");
        const statusEl = document.getElementById("topPlayerStatus");
        const avatarEl = document.querySelector("#topProfileBtn .top-avatar");

        if (nameEl) {
            nameEl.textContent = this.getPlayerName();
        }

        if (statusEl) {
            statusEl.textContent = this.t("online", "● Online");
        }

        if (avatarEl) {
            const avatarSrc = this.getAvatarSrc();
            avatarEl.innerHTML = `
                <img
                    src="${avatarSrc}"
                    alt="avatar"
                    referrerpolicy="no-referrer"
                    onerror="this.onerror=null; this.src='${this.fallbackAvatarPath}';"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        display:block;
                        border-radius:50%;
                    "
                />
            `;
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
        const profileAvatar = document.querySelector("#profileModal .profile-header .profile-avatar");

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
                    ? `${this.t("transferReward", "Transfer Reward")} (${availableReward.toFixed(3)})`
                    : this.t("noRewardToTransfer", "Brak Reward do transferu");
        }

        if (withdrawBtn) {
            const canWithdraw = this.canWithdraw();

            withdrawBtn.disabled = !canWithdraw;
            withdrawBtn.style.opacity = canWithdraw ? "1" : "0.6";
            withdrawBtn.textContent = canWithdraw
                ? `${this.t("withdrawRequest", "Withdraw Request")} (${walletReward.toFixed(3)})`
                : `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward.toFixed(3)}`;
        }

        if (profileAvatar) {
            const avatarSrc = this.getAvatarSrc();
            profileAvatar.innerHTML = `
                <img
                    src="${avatarSrc}"
                    alt="avatar"
                    referrerpolicy="no-referrer"
                    onerror="this.onerror=null; this.src='${this.fallbackAvatarPath}';"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        display:block;
                        border-radius:50%;
                    "
                />
            `;
        }

        this.renderWithdrawHistory();
    },

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

    async transferRewardToWallet() {
        CryptoZoo.state = CryptoZoo.state || {};

        const rewardBalance = this.getRewardBalanceValue();

        if (rewardBalance <= 0) {
            CryptoZoo.ui?.showToast?.(this.t("noRewardToTransfer", "Brak Reward do transferu"));
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
        await CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(`💎 ${this.t("transferSuccess", "Transfer")} +${rewardBalance.toFixed(3)} ${this.t("rewardWord", "reward")}`);
        return true;
    },

    async requestWithdraw() {
        const walletReward = this.getRewardWalletValue();

        if (walletReward < this.minWithdrawReward) {
            CryptoZoo.ui?.showToast?.(
                `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward.toFixed(3)} ${this.t("rewardWord", "reward")}`
            );
            this.refreshProfileModalData();
            return false;
        }

        try {
            CryptoZoo.ui?.showToast?.(this.t("creatingWithdrawRequest", "Tworzenie withdraw request..."));

            await CryptoZoo.api?.createWithdrawRequest?.(walletReward);

            CryptoZoo.audio?.play?.("win");
            this.refreshProfileModalData();
            CryptoZoo.ui?.render?.();
            await this.loadWithdrawHistory();

            CryptoZoo.ui?.showToast?.(
                `📤 ${this.t("withdrawRequest", "Withdraw Request")} +${walletReward.toFixed(3)} ${this.t("rewardWord", "reward")}`
            );

            return true;
        } catch (error) {
            console.error("Withdraw request error:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || this.t("withdrawCreateError", "Nie udało się utworzyć withdraw request")
            );
            this.refreshProfileModalData();
            return false;
        }
    },

    bindProfileModal() {
        const openBtn = document.getElementById("topProfileBtn");
        const closeBtn = document.getElementById("closeProfileBtn");
        const backdrop = document.getElementById("profileBackdrop");
        const transferBtn = document.getElementById("transferRewardBtn");
        const withdrawBtn = document.getElementById("requestWithdrawBtn");

        if (openBtn && !openBtn.dataset.bound) {
            openBtn.dataset.bound = "1";
            openBtn.onclick = async () => {
                CryptoZoo.audio?.play?.("click");
                await this.openProfileModal();
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
            transferBtn.onclick = async () => {
                CryptoZoo.audio?.play?.("click");
                await this.transferRewardToWallet();
            };
        }

        if (withdrawBtn && !withdrawBtn.dataset.bound) {
            withdrawBtn.dataset.bound = "1";
            withdrawBtn.onclick = async () => {
                CryptoZoo.audio?.play?.("click");
                await this.requestWithdraw();
            };
        }
    }
};
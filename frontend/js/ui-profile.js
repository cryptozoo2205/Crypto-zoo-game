window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    modalOpen: false,
    minWithdrawReward: 10,
    withdrawHistory: [],
    withdrawHistoryLoading: false,
    avatarStorageKey: "cryptozoo_profile_avatar",

    getDefaultAvatar() {
        return {
            emoji: "🦁",
            bg: "#5b8cff"
        };
    },

    getAvatarPresets() {
        return [
            { emoji: "🦁", bg: "#5b8cff" },
            { emoji: "🐼", bg: "#0f172a" },
            { emoji: "🐵", bg: "#b7791f" },
            { emoji: "🐯", bg: "#ea580c" },
            { emoji: "🐘", bg: "#64748b" },
            { emoji: "🦒", bg: "#ca8a04" },
            { emoji: "🐻", bg: "#7c3aed" },
            { emoji: "🐺", bg: "#334155" }
        ];
    },

    getAvatarColors() {
        return [
            "#5b8cff",
            "#0f172a",
            "#b7791f",
            "#ea580c",
            "#64748b",
            "#ca8a04",
            "#7c3aed",
            "#0f766e"
        ];
    },

    getSavedAvatar() {
        try {
            const raw = localStorage.getItem(this.avatarStorageKey);
            if (!raw) return this.getDefaultAvatar();

            const parsed = JSON.parse(raw);
            return {
                emoji: String(parsed?.emoji || this.getDefaultAvatar().emoji),
                bg: String(parsed?.bg || this.getDefaultAvatar().bg)
            };
        } catch (error) {
            console.error("Avatar parse error:", error);
            return this.getDefaultAvatar();
        }
    },

    saveAvatar(avatar) {
        const safe = {
            emoji: String(avatar?.emoji || this.getDefaultAvatar().emoji),
            bg: String(avatar?.bg || this.getDefaultAvatar().bg)
        };

        localStorage.setItem(this.avatarStorageKey, JSON.stringify(safe));
        this.renderTopBarProfile();
        this.refreshProfileModalData();
    },

    setAvatarEmoji(emoji) {
        const current = this.getSavedAvatar();
        this.saveAvatar({
            ...current,
            emoji: String(emoji || current.emoji)
        });
    },

    setAvatarColor(color) {
        const current = this.getSavedAvatar();
        this.saveAvatar({
            ...current,
            bg: String(color || current.bg)
        });
    },

    ensureTopBarAvatar() {
        const profileBtn = document.getElementById("topProfileBtn");
        if (!profileBtn) return null;

        let avatar = document.getElementById("topProfileAvatar");

        if (!avatar) {
            avatar = document.createElement("div");
            avatar.id = "topProfileAvatar";
            avatar.style.width = "36px";
            avatar.style.height = "36px";
            avatar.style.minWidth = "36px";
            avatar.style.borderRadius = "50%";
            avatar.style.display = "inline-flex";
            avatar.style.alignItems = "center";
            avatar.style.justifyContent = "center";
            avatar.style.fontSize = "18px";
            avatar.style.fontWeight = "900";
            avatar.style.boxShadow = "0 8px 18px rgba(0,0,0,0.22)";
            avatar.style.border = "1px solid rgba(255,255,255,0.16)";
            avatar.style.marginRight = "10px";
            avatar.style.flexShrink = "0";

            if (
                profileBtn.firstElementChild &&
                profileBtn.firstElementChild.id !== "topProfileAvatar"
            ) {
                profileBtn.insertBefore(avatar, profileBtn.firstElementChild);
            } else {
                profileBtn.appendChild(avatar);
            }

            profileBtn.style.display = "flex";
            profileBtn.style.alignItems = "center";
        }

        return avatar;
    },

    ensureProfileModalAvatar() {
        const profileName = document.getElementById("profileName");
        if (!profileName || !profileName.parentElement) return null;

        let wrap = document.getElementById("profileAvatarWrap");
        let avatar = document.getElementById("profileAvatar");

        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "profileAvatarWrap";
            wrap.style.display = "flex";
            wrap.style.alignItems = "center";
            wrap.style.justifyContent = "center";
            wrap.style.marginBottom = "12px";

            profileName.parentElement.insertBefore(wrap, profileName);
        }

        if (!avatar) {
            avatar = document.createElement("div");
            avatar.id = "profileAvatar";
            avatar.style.width = "72px";
            avatar.style.height = "72px";
            avatar.style.borderRadius = "50%";
            avatar.style.display = "inline-flex";
            avatar.style.alignItems = "center";
            avatar.style.justifyContent = "center";
            avatar.style.fontSize = "34px";
            avatar.style.fontWeight = "900";
            avatar.style.boxShadow = "0 14px 28px rgba(0,0,0,0.24)";
            avatar.style.border = "1px solid rgba(255,255,255,0.16)";

            wrap.appendChild(avatar);
        }

        return avatar;
    },

    ensureAvatarSettingsSection() {
        const subtitle = document.getElementById("profileSubtitle");
        if (!subtitle || !subtitle.parentElement) return null;

        let section = document.getElementById("profileAvatarSettings");
        if (!section) {
            section = document.createElement("div");
            section.id = "profileAvatarSettings";
            section.style.marginTop = "14px";
            section.style.marginBottom = "14px";
            section.style.padding = "14px";
            section.style.borderRadius = "18px";
            section.style.background = "linear-gradient(180deg, rgba(18, 28, 48, 0.96) 0%, rgba(10, 17, 31, 0.96) 100%)";
            section.style.border = "1px solid rgba(255,255,255,0.08)";

            subtitle.parentElement.insertAdjacentElement("afterend", section);
        }

        return section;
    },

    bindAvatarControls() {
        const emojiButtons = document.querySelectorAll("[data-avatar-emoji]");
        const colorButtons = document.querySelectorAll("[data-avatar-color]");

        emojiButtons.forEach((btn) => {
            if (btn.dataset.bound === "1") return;
            btn.dataset.bound = "1";
            btn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.setAvatarEmoji(btn.dataset.avatarEmoji || "🦁");
            };
        });

        colorButtons.forEach((btn) => {
            if (btn.dataset.bound === "1") return;
            btn.dataset.bound = "1";
            btn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.setAvatarColor(btn.dataset.avatarColor || this.getDefaultAvatar().bg);
            };
        });
    },

    renderAvatarSettings() {
        const section = this.ensureAvatarSettingsSection();
        if (!section) return;

        const avatar = this.getSavedAvatar();
        const presets = this.getAvatarPresets();
        const colors = this.getAvatarColors();

        section.innerHTML = `
            <div style="font-size:13px; font-weight:900; color:#ffffff; margin-bottom:10px;">
                Avatar
            </div>

            <div style="font-size:12px; font-weight:800; color:rgba(255,255,255,0.72); margin-bottom:8px;">
                Emoji
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                ${presets.map((preset) => `
                    <button
                        type="button"
                        data-avatar-emoji="${preset.emoji}"
                        style="
                            width:42px;
                            height:42px;
                            border-radius:12px;
                            border:${avatar.emoji === preset.emoji ? "1px solid rgba(91,140,255,0.95)" : "1px solid rgba(255,255,255,0.10)"};
                            background:${avatar.emoji === preset.emoji ? "rgba(91,140,255,0.16)" : "rgba(255,255,255,0.05)"};
                            font-size:20px;
                            cursor:pointer;
                        "
                    >${preset.emoji}</button>
                `).join("")}
            </div>

            <div style="font-size:12px; font-weight:800; color:rgba(255,255,255,0.72); margin-bottom:8px;">
                Kolor
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ${colors.map((color) => `
                    <button
                        type="button"
                        data-avatar-color="${color}"
                        style="
                            width:28px;
                            height:28px;
                            border-radius:999px;
                            border:${avatar.bg === color ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.18)"};
                            background:${color};
                            cursor:pointer;
                            box-shadow:0 6px 14px rgba(0,0,0,0.18);
                        "
                    ></button>
                `).join("")}
            </div>
        `;

        this.bindAvatarControls();
    },

    renderTopBarAvatar() {
        const avatar = this.getSavedAvatar();
        const el = this.ensureTopBarAvatar();
        if (!el) return;

        el.textContent = avatar.emoji;
        el.style.background = avatar.bg;
        el.style.color = "#ffffff";
    },

    renderProfileModalAvatar() {
        const avatar = this.getSavedAvatar();
        const el = this.ensureProfileModalAvatar();
        if (!el) return;

        el.textContent = avatar.emoji;
        el.style.background = avatar.bg;
        el.style.color = "#ffffff";
    },

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

        if (safe === "approved") return "Approved";
        if (safe === "rejected") return "Rejected";
        return "Pending";
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
                    Ładowanie historii...
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
                    Brak withdraw requestów
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
                            ${amount} reward
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
                            Note: ${note}
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
            CryptoZoo.ui?.showToast?.("Nie udało się pobrać historii withdraw");
        }

        this.withdrawHistoryLoading = false;
        this.renderWithdrawHistory();
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

        this.renderTopBarAvatar();
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

        this.renderProfileModalAvatar();
        this.renderAvatarSettings();
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
        await CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(`💎 Transfer +${rewardBalance.toFixed(3)} reward`);
        return true;
    },

    async requestWithdraw() {
        const walletReward = this.getRewardWalletValue();

        if (walletReward < this.minWithdrawReward) {
            CryptoZoo.ui?.showToast?.(
                `Min withdraw ${this.minWithdrawReward.toFixed(3)} reward`
            );
            this.refreshProfileModalData();
            return false;
        }

        try {
            CryptoZoo.ui?.showToast?.("Tworzenie withdraw request...");

            await CryptoZoo.api?.createWithdrawRequest?.(walletReward);

            CryptoZoo.audio?.play?.("win");
            this.refreshProfileModalData();
            CryptoZoo.ui?.render?.();
            await this.loadWithdrawHistory();

            CryptoZoo.ui?.showToast?.(
                `📤 Withdraw request +${walletReward.toFixed(3)} reward`
            );

            return true;
        } catch (error) {
            console.error("Withdraw request error:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || "Nie udało się utworzyć withdraw request"
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
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    modalOpen: false,
    minWithdrawReward: 3,
    withdrawHistory: [],
    withdrawHistoryLoading: false,
    fallbackAvatarPath: "assets/ui/avatar.png",

    referralsData: {
        referralsCount: 0,
        referredBy: "",
        referralCode: "",
        referralLinkCode: "",
        referralLink: "",
        referralRewards: null,
        referrals: []
    },
    referralsLoading: false,
    withdrawSectionOpen: false,
    referralSectionOpen: false,

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

    getTelegramUser() {
        return CryptoZoo.state?.telegramUser || CryptoZoo.api?.getTelegramUser?.() || {};
    },

    getPlayerId() {
        return String(this.getTelegramUser()?.id || CryptoZoo.api?.getPlayerId?.() || "");
    },

    getPlayerUsername() {
        const user = this.getTelegramUser();
        return String(user?.username || user?.first_name || "Gracz");
    },

    getProfileDisplayName() {
        const user = this.getTelegramUser();
        return String(user?.first_name || user?.username || "Gracz");
    },

    getBotUsername() {
        const fromConfig =
            CryptoZoo.config?.telegramBotUsername ||
            CryptoZoo.config?.botUsername ||
            window.CRYPTOZOO_BOT_USERNAME ||
            "";

        return String(fromConfig || "").replace(/^@/, "").trim();
    },

    t(key, fallback = "") {
        const translated = CryptoZoo.lang?.t?.(key);
        if (translated && translated !== key) {
            return translated;
        }
        return fallback || key;
    },

    buildReferralLink() {
        const data = this.referralsData || {};
        const backendLink = String(data.referralLink || "").trim();
        if (backendLink) {
            return backendLink;
        }

        const referralLinkCode =
            String(data.referralLinkCode || "").trim() ||
            `ref_${this.getPlayerId()}`;

        const botUsername = this.getBotUsername();
        if (botUsername) {
            return `https://t.me/${botUsername}?start=${referralLinkCode}`;
        }

        if (referralLinkCode) {
            return referralLinkCode;
        }

        return "";
    },

    renderTopBarProfile() {
        const topPlayerName = document.getElementById("topPlayerName");
        const topPlayerStatus = document.getElementById("topPlayerStatus");
        const profileName = document.getElementById("profileName");
        const profileSubtitle = document.getElementById("profileSubtitle");

        const displayName = this.getProfileDisplayName();
        const username = this.getPlayerUsername();

        if (topPlayerName) {
            topPlayerName.textContent = displayName;
        }

        if (topPlayerStatus) {
            topPlayerStatus.textContent = this.t("online", "● Online");
        }

        if (profileName) {
            profileName.textContent = displayName;
        }

        if (profileSubtitle) {
            profileSubtitle.textContent = username ? `@${username}` : "Player";
        }

        this.renderProfileStats();
        this.renderBoostStatus();
    },

    renderProfileStats() {
        const animals = CryptoZoo.state?.animals || {};
        const boxes = CryptoZoo.state?.boxes || {};

        const animalEntries = Object.values(animals);
        const animalsTotal = animalEntries.reduce((sum, item) => sum + Math.max(0, Number(item?.count) || 0), 0);
        const speciesUnlocked = animalEntries.filter((item) => Math.max(0, Number(item?.count) || 0) > 0).length;
        const boxesTotal =
            Math.max(0, Number(boxes.common) || 0) +
            Math.max(0, Number(boxes.rare) || 0) +
            Math.max(0, Number(boxes.epic) || 0) +
            Math.max(0, Number(boxes.legendary) || 0);

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText("profileAnimalsTotal", CryptoZoo.formatNumber?.(animalsTotal) || String(animalsTotal));
        setText("profileSpeciesUnlocked", CryptoZoo.formatNumber?.(speciesUnlocked) || String(speciesUnlocked));
        setText("profileBoxesTotal", CryptoZoo.formatNumber?.(boxesTotal) || String(boxesTotal));
        setText("profileRewardBalance", this.format(this.getRewardBalance()).toFixed(3));
        setText("profileRewardWallet", this.format(this.getRewardWallet()).toFixed(3));
        setText("profileWithdrawPending", this.format(this.getWithdrawPending()).toFixed(3));
    },

    renderBoostStatus() {
        const profileBoostStatus = document.getElementById("profileBoostStatus");
        if (!profileBoostStatus) return;

        const isActive = CryptoZoo.boostSystem?.isActive?.() || false;
        const timeLeft = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;

        if (isActive) {
            profileBoostStatus.textContent = `${this.t("active", "Aktywny")} • ${CryptoZoo.ui?.formatTimeLeft?.(timeLeft) || timeLeft}`;
        } else {
            profileBoostStatus.textContent = this.t("inactive", "Nieaktywny");
        }
    },

    async loadReferralsData() {
        const telegramId = this.getPlayerId();

        if (!telegramId) {
            this.referralsData = {
                referralsCount: 0,
                referredBy: "",
                referralCode: "",
                referralLinkCode: "",
                referralLink: "",
                referralRewards: null,
                referrals: []
            };
            this.renderReferralsSection();
            return;
        }

        this.referralsLoading = true;
        this.renderReferralsSection();

        try {
            const result = await CryptoZoo.api.request(`/referrals/${encodeURIComponent(telegramId)}`, {
                method: "GET"
            });

            this.referralsData = {
                referralsCount: Math.max(0, Number(result?.referralsCount) || 0),
                referredBy: String(result?.referredBy || ""),
                referralCode: String(result?.referralCode || telegramId),
                referralLinkCode: String(result?.referralLinkCode || `ref_${telegramId}`),
                referralLink: String(result?.referralLink || ""),
                referralRewards: result?.referralRewards || null,
                referrals: Array.isArray(result?.referrals) ? result.referrals : []
            };
        } catch (e) {
            this.referralsData = {
                referralsCount: 0,
                referredBy: "",
                referralCode: telegramId,
                referralLinkCode: `ref_${telegramId}`,
                referralLink: "",
                referralRewards: null,
                referrals: []
            };
        }

        this.referralsLoading = false;
        this.renderReferralsSection();
    },

    renderReferralsSection() {
        const countEl = document.getElementById("profileReferralsCount");
        const codeEl = document.getElementById("profileReferralCode");
        const linkEl = document.getElementById("profileReferralLink");
        const rewardsEl = document.getElementById("profileReferralRewards");
        const listEl = document.getElementById("profileReferralsList");

        if (!countEl || !codeEl || !linkEl || !rewardsEl || !listEl) {
            return;
        }

        if (this.referralsLoading) {
            countEl.textContent = "...";
            codeEl.textContent = "...";
            linkEl.textContent = "Ładowanie...";
            rewardsEl.textContent = "Ładowanie...";
            listEl.innerHTML = `<div>Ładowanie...</div>`;
            return;
        }

        const data = this.referralsData || {};
        const fallbackPlayerId = this.getPlayerId();
        const referralCode = String(data.referralCode || fallbackPlayerId || "-");
        const referralLink = this.buildReferralLink();

        countEl.textContent = String(Math.max(0, Number(data.referralsCount) || 0));
        codeEl.textContent = referralCode || "-";
        linkEl.textContent = referralLink || `ref_${fallbackPlayerId || ""}` || "-";

        const rewardsText =
            this.t("profileReferralRewards", "Brak danych o nagrodach");

        rewardsEl.style.whiteSpace = "pre-line";
        rewardsEl.textContent = rewardsText;

        const referrals = Array.isArray(data.referrals) ? data.referrals : [];
        if (!referrals.length) {
            listEl.innerHTML = `<div>Brak zaproszonych</div>`;
            return;
        }

        listEl.innerHTML = referrals
            .slice(0, 10)
            .map((entry) => {
                const firstName = String(entry?.firstName || "").trim();
                const username = String(entry?.username || "Gracz").trim();
                const displayName = firstName || username || "Gracz";
                const activated = !!entry?.activated;

                return `
                    <div style="padding:10px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; margin-bottom:8px;">
                        <div style="font-weight:800;">${displayName}</div>
                        <div style="font-size:12px; color:rgba(255,255,255,0.68); margin-top:4px;">@${username || "gracz"}</div>
                        <div style="font-size:12px; color:${activated ? "#8df0a8" : "rgba(255,255,255,0.68)"}; margin-top:6px;">
                            ${activated ? "Aktywny" : "Oczekuje na lvl 3"}
                        </div>
                    </div>
                `;
            })
            .join("");
    },

    async copyReferralLink() {
        const link = this.buildReferralLink();

        if (!link) {
            CryptoZoo.ui?.showToast?.("Brak linku referral");
            return false;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(link);
            } else {
                const temp = document.createElement("textarea");
                temp.value = link;
                temp.setAttribute("readonly", "");
                temp.style.position = "absolute";
                temp.style.left = "-9999px";
                document.body.appendChild(temp);
                temp.select();
                document.execCommand("copy");
                temp.remove();
            }

            CryptoZoo.ui?.showToast?.("Skopiowano link referral");
            return true;
        } catch (e) {
            CryptoZoo.ui?.showToast?.("Nie udało się skopiować linku");
            return false;
        }
    },

    refreshProfileModalData() {
        const balance = this.getRewardBalance();
        const wallet = this.getRewardWallet();
        const pending = this.getWithdrawPending();

        const elBalance = document.getElementById("profileRewardBalance");
        const elWallet = document.getElementById("profileRewardWallet");
        const elPending = document.getElementById("profileWithdrawPending");

        if (elBalance) elBalance.textContent = this.format(balance).toFixed(3);
        if (elWallet) elWallet.textContent = this.format(wallet).toFixed(3);
        if (elPending) elPending.textContent = this.format(pending).toFixed(3);

        const transferBtn = document.getElementById("transferRewardBtn");
        if (transferBtn) {
            transferBtn.disabled = balance <= 0;
            transferBtn.style.opacity = balance > 0 ? "1" : "0.5";
            transferBtn.textContent =
                balance > 0
                    ? `${this.t("transferReward", "Transfer Reward")} (${balance.toFixed(3)})`
                    : this.t("noRewardToTransfer", "Brak Reward do transferu");
        }

        const withdrawBtn = document.getElementById("requestWithdrawBtn");
        if (withdrawBtn) {
            const can = this.canWithdraw();
            withdrawBtn.disabled = !can;
            withdrawBtn.style.opacity = can ? "1" : "0.5";
            withdrawBtn.textContent = can
                ? `${this.t("withdrawRequest", "Withdraw Request")} (${wallet.toFixed(3)})`
                : `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward}`;
        }

        this.renderTopBarProfile();
        this.renderToggleSections();
        this.renderReferralsSection();
        this.renderWithdrawHistory();
    },

    async transferRewardToWallet() {
        const amount = this.getRewardBalance();

        if (amount <= 0) {
            CryptoZoo.ui?.showToast?.(this.t("noRewardToTransfer", "Brak Reward do transferu"));
            return false;
        }

        CryptoZoo.state.rewardWallet = this.getRewardWallet() + amount;
        CryptoZoo.state.rewardBalance = 0;

        await CryptoZoo.api.savePlayer();

        CryptoZoo.ui?.showToast?.(`+${amount.toFixed(3)} reward → wallet`);

        this.refreshProfileModalData();
        CryptoZoo.ui?.render?.();

        return true;
    },

    async requestWithdraw() {
        const wallet = this.getRewardWallet();

        if (wallet < this.minWithdrawReward) {
            CryptoZoo.ui?.showToast?.(`${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward}`);
            return false;
        }

        try {
            await CryptoZoo.api.createWithdrawRequest(wallet);

            CryptoZoo.ui?.showToast?.(`Withdraw ${wallet.toFixed(3)}`);

            await this.loadWithdrawHistory();
            this.refreshProfileModalData();

            return true;
        } catch (e) {
            CryptoZoo.ui?.showToast?.(e.message || this.t("withdrawCreateError", "Błąd withdraw"));
            return false;
        }
    },

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
            el.innerHTML = `<div>${this.t("loadingHistory", "Loading...")}</div>`;
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
                        <div>${this.format(w.amount).toFixed(3)} reward</div>
                        <div>${w.status}</div>
                    </div>
                `;
            })
            .join("");
    },

    toggleWithdrawSection(forceValue = null) {
        this.withdrawSectionOpen = typeof forceValue === "boolean"
            ? forceValue
            : !this.withdrawSectionOpen;

        this.renderToggleSections();
    },

    toggleReferralSection(forceValue = null) {
        this.referralSectionOpen = typeof forceValue === "boolean"
            ? forceValue
            : !this.referralSectionOpen;

        this.renderToggleSections();
    },

    renderToggleSections() {
        const withdrawContent = document.getElementById("profileWithdrawContent");
        const withdrawBtn = document.getElementById("toggleWithdrawBtn");
        const withdrawArrow = document.getElementById("toggleWithdrawBtnArrow");
        const withdrawLabel = document.getElementById("toggleWithdrawBtnLabel");

        const referralContent = document.getElementById("profileReferralContent");
        const referralBtn = document.getElementById("toggleReferralBtn");
        const referralArrow = document.getElementById("toggleReferralBtnArrow");
        const referralLabel = document.getElementById("toggleReferralBtnLabel");

        if (withdrawContent) {
            withdrawContent.style.display = this.withdrawSectionOpen ? "block" : "none";
        }

        if (withdrawBtn) {
            withdrawBtn.setAttribute("aria-expanded", this.withdrawSectionOpen ? "true" : "false");
        }

        if (withdrawArrow) {
            withdrawArrow.textContent = this.withdrawSectionOpen ? "▲" : "▼";
        }

        if (withdrawLabel) {
            withdrawLabel.textContent = this.withdrawSectionOpen
                ? this.t("hideWithdraw", "Ukryj reward / wypłaty")
                : this.t("toggleWithdraw", "Reward / Withdraw");
        }

        if (referralContent) {
            referralContent.style.display = this.referralSectionOpen ? "block" : "none";
        }

        if (referralBtn) {
            referralBtn.setAttribute("aria-expanded", this.referralSectionOpen ? "true" : "false");
        }

        if (referralArrow) {
            referralArrow.textContent = this.referralSectionOpen ? "▲" : "▼";
        }

        if (referralLabel) {
            referralLabel.textContent = this.referralSectionOpen
                ? this.t("hideReferral", "Ukryj referral")
                : this.t("toggleReferral", "Referral / Zaproś znajomych");
        }
    },

    async openProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        modal.classList.remove("hidden");
        this.modalOpen = true;

        this.renderTopBarProfile();
        this.refreshProfileModalData();

        await Promise.all([
            this.loadWithdrawHistory(),
            this.loadReferralsData()
        ]);
    },

    closeProfileModal() {
        const modal = document.getElementById("profileModal");
        if (!modal) return;

        modal.classList.add("hidden");
        this.modalOpen = false;
    },

    bindProfileModal() {
        const openBtn = document.getElementById("topProfileBtn");
        const closeBtn = document.getElementById("closeProfileBtn");
        const transferBtn = document.getElementById("transferRewardBtn");
        const withdrawBtn = document.getElementById("requestWithdrawBtn");
        const copyReferralBtn = document.getElementById("copyReferralBtn");
        const profileBackdrop = document.getElementById("profileBackdrop");
        const toggleReferralBtn = document.getElementById("toggleReferralBtn");
        const toggleWithdrawBtn = document.getElementById("toggleWithdrawBtn");

        if (openBtn && !openBtn.dataset.bound) {
            openBtn.dataset.bound = "1";
            openBtn.onclick = () => this.openProfileModal();
        }

        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.onclick = () => this.closeProfileModal();
        }

        if (profileBackdrop && !profileBackdrop.dataset.bound) {
            profileBackdrop.dataset.bound = "1";
            profileBackdrop.onclick = () => this.closeProfileModal();
        }

        if (transferBtn && !transferBtn.dataset.bound) {
            transferBtn.dataset.bound = "1";
            transferBtn.onclick = () => this.transferRewardToWallet();
        }

        if (withdrawBtn && !withdrawBtn.dataset.bound) {
            withdrawBtn.dataset.bound = "1";
            withdrawBtn.onclick = () => this.requestWithdraw();
        }

        if (copyReferralBtn && !copyReferralBtn.dataset.bound) {
            copyReferralBtn.dataset.bound = "1";
            copyReferralBtn.onclick = () => this.copyReferralLink();
        }

        if (toggleReferralBtn && !toggleReferralBtn.dataset.bound) {
            toggleReferralBtn.dataset.bound = "1";
            toggleReferralBtn.onclick = () => this.toggleReferralSection();
        }

        if (toggleWithdrawBtn && !toggleWithdrawBtn.dataset.bound) {
            toggleWithdrawBtn.dataset.bound = "1";
            toggleWithdrawBtn.onclick = () => this.toggleWithdrawSection();
        }
    }
};
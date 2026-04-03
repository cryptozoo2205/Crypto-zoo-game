window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiProfile = {
    modalOpen: false,
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
    referralSectionOpen: false,
    lastAvatarUrlApplied: "",

    getRewardBalance() {
        return Number((Number(CryptoZoo.state?.rewardBalance) || 0).toFixed(3));
    },

    getRewardWallet() {
        return Number((Number(CryptoZoo.state?.rewardWallet) || 0).toFixed(3));
    },

    getWithdrawPending() {
        return Number((Number(CryptoZoo.state?.withdrawPending) || 0).toFixed(3));
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

    getFallbackAvatarUrl() {
        return String(this.fallbackAvatarPath || "assets/ui/avatar.png").trim();
    },

    hasTelegramAvatar() {
        const user = this.getTelegramUser();
        const fromUser = String(user?.photo_url || "").trim();
        const fromStorage = String(localStorage.getItem("telegramPhotoUrl") || "").trim();

        return !!(fromUser || fromStorage);
    },

    getAvatarUrl() {
        const user = this.getTelegramUser();
        const fromUser = String(user?.photo_url || "").trim();
        if (fromUser && fromUser !== "null" && fromUser !== "undefined") {
            return fromUser;
        }

        const fromStorage = String(localStorage.getItem("telegramPhotoUrl") || "").trim();
        if (fromStorage && fromStorage !== "null" && fromStorage !== "undefined") {
            return fromStorage;
        }

        return this.getFallbackAvatarUrl();
    },

    applyAvatarToElement(element, avatarUrl) {
        if (!element) return;

        const safeUrl = String(avatarUrl || "").trim();
        const fallbackUrl = this.getFallbackAvatarUrl();

        element.style.backgroundImage = safeUrl ? `url("${safeUrl}")` : "";
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
        element.style.backgroundRepeat = "no-repeat";
        element.style.overflow = "hidden";
        element.style.backgroundColor = "transparent";

        if (safeUrl === fallbackUrl) {
            element.classList.add("avatar-fallback-active");
        } else {
            element.classList.remove("avatar-fallback-active");
        }

        if (!element.dataset.avatarErrorBound) {
            element.dataset.avatarErrorBound = "1";

            const img = new Image();
            img.onload = () => {};
            img.onerror = () => {
                const latestAvatarUrl = String(this.getAvatarUrl() || "").trim();
                if (latestAvatarUrl !== fallbackUrl) {
                    this.lastAvatarUrlApplied = "";
                    this.applyAvatarToElement(element, fallbackUrl);
                }
            };

            if (safeUrl) {
                img.src = safeUrl;
            }
        }
    },

    renderAvatarImages(force = false) {
        const avatarUrl = this.getAvatarUrl();

        if (!force && this.lastAvatarUrlApplied === avatarUrl) {
            return;
        }

        this.lastAvatarUrlApplied = avatarUrl;

        const topAvatar = document.querySelector(".top-avatar");
        const profileAvatar = document.querySelector("#profileModal .profile-avatar");
        const settingsAvatar = document.querySelector("#settingsModal .profile-avatar");

        this.applyAvatarToElement(topAvatar, avatarUrl);
        this.applyAvatarToElement(profileAvatar, avatarUrl);
        this.applyAvatarToElement(settingsAvatar, avatarUrl);
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

    getProfileRankingText() {
        const possibleRank =
            CryptoZoo.state?.rankingPosition ??
            CryptoZoo.state?.rankPosition ??
            CryptoZoo.state?.playerRank ??
            CryptoZoo.state?.rankingRank ??
            CryptoZoo.state?.rank ??
            CryptoZoo.state?.ranking?.position ??
            CryptoZoo.state?.ranking?.rank ??
            CryptoZoo.ranking?.playerPosition ??
            CryptoZoo.ranking?.position ??
            CryptoZoo.rankingSystem?.playerPosition ??
            CryptoZoo.rankingSystem?.position ??
            CryptoZoo.uiRanking?.playerPosition ??
            CryptoZoo.uiRanking?.position ??
            CryptoZoo.rankingSystem?.getPlayerRank?.() ??
            CryptoZoo.uiRanking?.getPlayerRank?.();

        const rankNumber = Number(possibleRank);

        if (Number.isFinite(rankNumber) && rankNumber > 0) {
            return `#${Math.floor(rankNumber)}`;
        }

        return "#--";
    },

    getReferralRewardsText() {
        const rewards = this.referralsData?.referralRewards || null;

        const activateAtLevel = Math.max(1, Number(rewards?.activateAtLevel) || 3);

        const visitCoins = Math.max(0, Number(rewards?.visitNewPlayerCoins) || 0);
        const visitGems = Math.max(0, Number(rewards?.visitNewPlayerGems) || 0);
        const visitReward = Math.max(0, Number(rewards?.visitNewPlayerReward) || 0);

        const activatedNewCoins = Math.max(0, Number(rewards?.activatedNewPlayerCoins) || 0);
        const activatedNewGems = Math.max(0, Number(rewards?.activatedNewPlayerGems) || 0);
        const activatedNewReward = Math.max(0, Number(rewards?.activatedNewPlayerReward) || 0);

        const activatedRefCoins = Math.max(0, Number(rewards?.activatedReferrerCoins) || 0);
        const activatedRefGems = Math.max(0, Number(rewards?.activatedReferrerGems) || 0);
        const activatedRefReward = Math.max(0, Number(rewards?.activatedReferrerReward) || 0);

        const formatBundle = ({ coins = 0, gems = 0, reward = 0 }) => {
            const parts = [];

            if (coins > 0) {
                parts.push(`+${CryptoZoo.formatNumber?.(coins) || coins} coins`);
            }

            if (gems > 0) {
                parts.push(`+${CryptoZoo.formatNumber?.(gems) || gems} gem${gems === 1 ? "" : "s"}`);
            }

            if (reward > 0) {
                parts.push(`+${Number(reward).toFixed(3)} reward`);
            }

            return parts.length ? parts.join(" • ") : this.t("noReferralReward", "No bonus");
        };

        return [
            this.t("referralNewPlayerTitle", "New player:"),
            formatBundle({
                coins: visitCoins,
                gems: visitGems,
                reward: visitReward
            }),
            "",
            `${this.t("referralActivationTitle", `After reaching level ${activateAtLevel}:`)}`,
            formatBundle({
                coins: activatedNewCoins,
                gems: activatedNewGems,
                reward: activatedNewReward
            }),
            "",
            this.t("referralReferrerTitle", "Referrer:"),
            formatBundle({
                coins: activatedRefCoins,
                gems: activatedRefGems,
                reward: activatedRefReward
            }),
            "",
            this.t(
                "referralActivationInfo",
                `Bonuses unlock after the invited player reaches level ${activateAtLevel}`
            )
        ].join("\n");
    },

    setFirstExistingText(ids, value) {
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
            }
        });
    },

    renderTopBarOnly() {
        const topPlayerName = document.getElementById("topPlayerName");
        const topPlayerStatus = document.getElementById("topPlayerStatus");

        const displayName = this.getProfileDisplayName();

        if (topPlayerName) {
            topPlayerName.textContent = displayName;
        }

        if (topPlayerStatus) {
            topPlayerStatus.textContent = this.t("online", "● Online");
        }

        this.renderAvatarImages();
    },

    renderProfileHeaderOnly() {
        const profileName = document.getElementById("profileName");
        const profileSubtitle = document.getElementById("profileSubtitle");
        const displayName = this.getProfileDisplayName();
        const username = this.getPlayerUsername();

        if (profileName) {
            profileName.textContent = displayName;
        }

        if (profileSubtitle) {
            profileSubtitle.textContent = username ? `@${username}` : "Player";
        }
    },

    renderTopBarProfile() {
        this.renderTopBarOnly();

        if (this.modalOpen) {
            this.renderProfileHeaderOnly();
            this.renderProfileStats();
            this.renderBoostStatus();
        }
    },

    renderProfileStats() {
        if (!this.modalOpen) return;

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

        const rankingText = this.getProfileRankingText();
        this.setFirstExistingText(
            [
                "profileRankingPosition",
                "profileRankingValue",
                "profileRankingRank",
                "profileRankingPlace",
                "profilePlayerRanking"
            ],
            rankingText
        );
    },

    renderBoostStatus() {
        if (!this.modalOpen) return;

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
        if (!this.modalOpen) return;

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

        rewardsEl.style.whiteSpace = "pre-line";
        rewardsEl.textContent = this.getReferralRewardsText();

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
        this.renderTopBarOnly();

        if (!this.modalOpen) {
            return;
        }

        const balance = this.getRewardBalance();
        const wallet = this.getRewardWallet();
        const pending = this.getWithdrawPending();

        const elBalance = document.getElementById("profileRewardBalance");
        const elWallet = document.getElementById("profileRewardWallet");
        const elPending = document.getElementById("profileWithdrawPending");

        if (elBalance) elBalance.textContent = this.format(balance).toFixed(3);
        if (elWallet) elWallet.textContent = this.format(wallet).toFixed(3);
        if (elPending) elPending.textContent = this.format(pending).toFixed(3);

        this.renderProfileHeaderOnly();
        this.renderProfileStats();
        this.renderBoostStatus();
        this.renderToggleSections();
        this.renderReferralsSection();
        this.renderAvatarImages();
    },

    toggleReferralSection(forceValue = null) {
        this.referralSectionOpen = typeof forceValue === "boolean"
            ? forceValue
            : !this.referralSectionOpen;

        this.renderToggleSections();
    },

    renderToggleSections() {
        if (!this.modalOpen) return;

        const referralContent = document.getElementById("profileReferralContent");
        const referralBtn = document.getElementById("toggleReferralBtn");
        const referralArrow = document.getElementById("toggleReferralBtnArrow");
        const referralLabel = document.getElementById("toggleReferralBtnLabel");

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

        this.renderAvatarImages(true);
        this.refreshProfileModalData();

        await this.loadReferralsData();
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
        const copyReferralBtn = document.getElementById("copyReferralBtn");
        const profileBackdrop = document.getElementById("profileBackdrop");
        const toggleReferralBtn = document.getElementById("toggleReferralBtn");

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

        if (copyReferralBtn && !copyReferralBtn.dataset.bound) {
            copyReferralBtn.dataset.bound = "1";
            copyReferralBtn.onclick = () => this.copyReferralLink();
        }

        if (toggleReferralBtn && !toggleReferralBtn.dataset.bound) {
            toggleReferralBtn.dataset.bound = "1";
            toggleReferralBtn.onclick = () => this.toggleReferralSection();
        }

        this.renderAvatarImages();
    }
};
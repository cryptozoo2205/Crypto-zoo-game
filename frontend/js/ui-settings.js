window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiSettings = {
    storageKey: "cryptozoo_settings",
    minWithdrawReward: 20,
    usdPerReward: 0.05,
    minWithdrawLevel: 7,
    minWithdrawAccountAgeMs: 24 * 60 * 60 * 1000,

    withdrawHistory: [],
    withdrawHistoryLoading: false,
    depositsHistory: [],
    depositsHistoryLoading: false,

    financeSectionOpen: false,

    depositAmounts: [1, 3, 5, 10],

    getDefaultSettings() {
        return {
            language: "pl",
            sound: true
        };
    },

    t(key, fallback = "") {
        const translated = CryptoZoo.lang?.t?.(key);
        if (translated && translated !== key) {
            return translated;
        }
        return fallback || key;
    },

    getRewardBalance() {
        return Number((Number(CryptoZoo.state?.rewardBalance) || 0).toFixed(3));
    },

    getRewardWallet() {
        return Number((Number(CryptoZoo.state?.rewardWallet) || 0).toFixed(3));
    },

    getWithdrawPending() {
        return Number((Number(CryptoZoo.state?.withdrawPending) || 0).toFixed(3));
    },

    getPlayerLevel() {
        return Math.max(1, Math.floor(Number(CryptoZoo.state?.level) || 1));
    },

    getPlayerCreatedAtMs() {
        return Math.max(
            0,
            Number(CryptoZoo.state?.createdAt) ||
            Number(CryptoZoo.state?.registeredAt) ||
            Number(CryptoZoo.state?.firstSeenAt) ||
            Number(CryptoZoo.state?.joinedAt) ||
            0
        );
    },

    getAccountAgeMs() {
        const createdAt = this.getPlayerCreatedAtMs();
        if (!createdAt) return 0;
        return Math.max(0, Date.now() - createdAt);
    },

    format(v) {
        return Number((Number(v) || 0).toFixed(3));
    },

    formatUsdFromReward(rewardAmount) {
        const usd = Number(rewardAmount || 0) * this.usdPerReward;
        return Number(usd.toFixed(3));
    },

    getRewardUsdLabel(rewardAmount) {
        return `$${this.formatUsdFromReward(rewardAmount).toFixed(3)}`;
    },

    getWithdrawAvailability() {
        const rewardBalance = this.getRewardBalance();
        const withdrawPending = this.getWithdrawPending();
        const level = this.getPlayerLevel();
        const accountAgeMs = this.getAccountAgeMs();

        if (rewardBalance < this.minWithdrawReward) {
            return {
                ok: false,
                reason: `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward}`
            };
        }

        if (withdrawPending > 0) {
            return {
                ok: false,
                reason: this.t("pendingWithdrawExists", "Masz już aktywny withdraw")
            };
        }

        if (level < this.minWithdrawLevel) {
            return {
                ok: false,
                reason: `${this.t("requiredLevel", "Wymagany poziom")} ${this.minWithdrawLevel}`
            };
        }

        if (accountAgeMs < this.minWithdrawAccountAgeMs) {
            return {
                ok: false,
                reason: this.t("accountMustBe24h", "Konto musi mieć minimum 24h")
            };
        }

        return {
            ok: true,
            reason: ""
        };
    },

    canWithdraw() {
        return this.getWithdrawAvailability().ok;
    },

    getSettings() {
        const defaults = this.getDefaultSettings();

        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return { ...defaults };
            }

            const parsed = JSON.parse(raw);

            return {
                language: parsed?.language === "en" ? "en" : defaults.language,
                sound: typeof parsed?.sound === "boolean" ? parsed.sound : defaults.sound
            };
        } catch (error) {
            console.error("Settings parse error:", error);
            return { ...defaults };
        }
    },

    saveSettings(nextSettings) {
        const defaults = this.getDefaultSettings();
        const safeSettings = {
            language: nextSettings?.language === "en" ? "en" : defaults.language,
            sound: typeof nextSettings?.sound === "boolean" ? nextSettings.sound : defaults.sound
        };

        localStorage.setItem(this.storageKey, JSON.stringify(safeSettings));
        return safeSettings;
    },

    applySettings(settings) {
        const safeSettings = settings || this.getSettings();

        document.documentElement.setAttribute("lang", safeSettings.language);
        document.documentElement.dataset.gameLanguage = safeSettings.language;
        document.documentElement.dataset.gameSound = safeSettings.sound ? "on" : "off";

        CryptoZoo.settings = CryptoZoo.settings || {};
        CryptoZoo.settings.language = safeSettings.language;
        CryptoZoo.settings.sound = safeSettings.sound;

        if (CryptoZoo.lang) {
            CryptoZoo.lang.current = safeSettings.language;
            try {
                localStorage.setItem("cz_lang", safeSettings.language);
            } catch (error) {
                console.error("Language storage sync error:", error);
            }
        }
    },

    syncAudioWithSettings(settings) {
        const safeSettings = settings || this.getSettings();

        if (!CryptoZoo.audio) return;

        CryptoZoo.audio.enabled = !!safeSettings.sound;
        if (typeof CryptoZoo.audio.saveSettings === "function") {
            CryptoZoo.audio.saveSettings();
        }
    },

    renderExtraPanels() {
        CryptoZoo.uiUpdates?.render?.();
    },

    initSettings() {
        const settings = this.getSettings();
        this.applySettings(settings);
        this.syncAudioWithSettings(settings);
        this.refreshSettingsModalData();
        this.renderExtraPanels();
    },

    getLanguageLabel(language) {
        return language === "en" ? "English" : "Polski";
    },

    getSoundLabel(sound) {
        return sound ? "ON" : "OFF";
    },

    getSelectedDepositAmount() {
        const amount = Number(CryptoZoo.depositBind?.selectedAmount || this.depositAmounts[1] || 3);
        return amount > 0 ? amount : 3;
    },

    renderDepositAmountOptions() {
        const wrap = document.getElementById("settingsDepositAmountOptions");
        if (!wrap) return;

        const selectedAmount = this.getSelectedDepositAmount();

        wrap.innerHTML = this.depositAmounts.map((amount) => {
            const isActive = amount === selectedAmount;

            return `
                <button
                    type="button"
                    class="deposit-amount-btn${isActive ? " active" : ""}"
                    data-amount="${amount}"
                    style="
                        min-width:88px;
                        padding:12px 16px;
                        border-radius:14px;
                        border:${isActive ? "2px solid rgba(255,210,60,0.95)" : "1px solid rgba(255,255,255,0.14)"};
                        background:${isActive ? "linear-gradient(180deg, rgba(255,210,60,0.24) 0%, rgba(255,185,0,0.14) 100%)" : "rgba(255,255,255,0.04)"};
                        color:#ffffff;
                        font-weight:900;
                        font-size:14px;
                        box-shadow:${isActive ? "0 10px 24px rgba(255,190,0,0.18)" : "none"};
                        cursor:pointer;
                    "
                >${amount} TON</button>
            `;
        }).join("");

        CryptoZoo.depositBind?.bindAmountButtons?.();
    },

    refreshSettingsModalData() {
        const settings = this.getSettings();

        CryptoZoo.ui?.updateText?.(
            "settingsLanguageValue",
            this.getLanguageLabel(settings.language)
        );

        CryptoZoo.ui?.updateText?.(
            "settingsSoundValue",
            this.getSoundLabel(settings.sound)
        );

        const rewardBalanceEl = document.getElementById("settingsRewardBalance");
        const rewardWalletEl = document.getElementById("settingsRewardWallet");
        const withdrawPendingEl = document.getElementById("settingsWithdrawPending");
        const rewardBalanceUsdEl = document.getElementById("settingsRewardBalanceUsd");
        const rewardWalletUsdEl = document.getElementById("settingsRewardWalletUsd");
        const withdrawPendingUsdEl = document.getElementById("settingsWithdrawPendingUsd");
        const withdrawHintEl = document.getElementById("settingsWithdrawHint");

        const rewardBalance = this.getRewardBalance();
        const rewardWallet = this.getRewardWallet();
        const withdrawPending = this.getWithdrawPending();

        if (rewardBalanceEl) {
            rewardBalanceEl.textContent = this.format(rewardBalance).toFixed(3);
        }

        if (rewardWalletEl) {
            rewardWalletEl.textContent = this.format(rewardWallet).toFixed(3);
        }

        if (withdrawPendingEl) {
            withdrawPendingEl.textContent = this.format(withdrawPending).toFixed(3);
        }

        if (rewardBalanceUsdEl) {
            rewardBalanceUsdEl.textContent = this.getRewardUsdLabel(rewardBalance);
        }

        if (rewardWalletUsdEl) {
            rewardWalletUsdEl.textContent = this.getRewardUsdLabel(rewardWallet);
        }

        if (withdrawPendingUsdEl) {
            withdrawPendingUsdEl.textContent = this.getRewardUsdLabel(withdrawPending);
        }

        const transferBtn = document.getElementById("settingsTransferRewardBtn");
        if (transferBtn) {
            transferBtn.disabled = true;
            transferBtn.style.opacity = "0.5";
            transferBtn.textContent = this.t(
                "rewardUsedDirectlyForWithdraw",
                "Reward balance jest używany bezpośrednio do withdraw"
            );
        }

        const withdrawBtn = document.getElementById("settingsRequestWithdrawBtn");
        if (withdrawBtn) {
            const availability = this.getWithdrawAvailability();
            const can = availability.ok;

            withdrawBtn.disabled = !can;
            withdrawBtn.style.opacity = can ? "1" : "0.5";
            withdrawBtn.textContent = can
                ? `${this.t("withdrawRequest", "Withdraw Request")} (${rewardBalance.toFixed(3)} • ${this.getRewardUsdLabel(rewardBalance)})`
                : `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward}`;
        }

        if (withdrawHintEl) {
            const availability = this.getWithdrawAvailability();
            withdrawHintEl.textContent = availability.ok
                ? `${this.t("estimatedValue", "Estimated value")}: ${this.getRewardUsdLabel(rewardBalance)}`
                : availability.reason;
        }

        const depositBtn = document.getElementById("settingsCreateDepositBtn");
        if (depositBtn) {
            const selectedAmount = this.getSelectedDepositAmount();
            depositBtn.disabled = false;
            depositBtn.style.opacity = "1";
            depositBtn.textContent = `${this.t("createDeposit", "Create Deposit")} (${selectedAmount.toFixed(3)})`;
        }

        this.renderDepositAmountOptions();
        this.renderFinanceSectionToggle();
        this.renderWithdrawHistory();
        this.renderDepositsHistory();
    },

    toggleLanguage() {
        const current = this.getSettings();
        const next = {
            ...current,
            language: current.language === "pl" ? "en" : "pl"
        };

        const saved = this.saveSettings(next);

        if (CryptoZoo.lang?.set) {
            CryptoZoo.lang.set(saved.language);
        }

        this.applySettings(saved);
        this.refreshSettingsModalData();
        this.renderExtraPanels();

        CryptoZoo.ui?.showToast?.(
            saved.language === "en" ? "Language: English" : "Język: Polski"
        );

        CryptoZoo.ui?.render?.();
        CryptoZoo.uiProfile?.refreshProfileModalData?.();
        this.refreshSettingsModalData();
    },

    toggleSound() {
        const current = this.getSettings();
        const next = {
            ...current,
            sound: !current.sound
        };

        const saved = this.saveSettings(next);
        this.applySettings(saved);
        this.syncAudioWithSettings(saved);
        this.refreshSettingsModalData();
        this.renderExtraPanels();

        CryptoZoo.ui?.showToast?.(
            saved.sound ? "Dźwięki: ON" : "Dźwięki: OFF"
        );
    },

    async transferRewardToWallet() {
        CryptoZoo.ui?.showToast?.(
            this.t(
                "rewardUsedDirectlyForWithdraw",
                "Reward balance jest używany bezpośrednio do withdraw"
            )
        );
        return false;
    },

    async requestWithdraw() {
        const rewardBalance = this.getRewardBalance();
        const availability = this.getWithdrawAvailability();

        if (!availability.ok) {
            CryptoZoo.ui?.showToast?.(availability.reason);
            return false;
        }

        try {
            await CryptoZoo.api.createWithdrawRequest(rewardBalance);

            CryptoZoo.ui?.showToast?.(
                `${this.t("withdrawCreated", "Withdraw created")}: ${rewardBalance.toFixed(3)} • ${this.getRewardUsdLabel(rewardBalance)}`
            );

            await this.loadWithdrawHistory();
            this.refreshSettingsModalData();
            CryptoZoo.ui?.render?.();

            return true;
        } catch (e) {
            CryptoZoo.ui?.showToast?.(e.message || this.t("withdrawCreateError", "Błąd withdraw"));
            return false;
        }
    },

    async createDeposit() {
        const amount = this.getSelectedDepositAmount();

        try {
            if (!CryptoZoo.depositUI?.createDeposit) {
                throw new Error("Deposit UI not loaded");
            }

            const success = await CryptoZoo.depositUI.createDeposit(amount);

            if (success) {
                await this.loadDepositsHistory();
                this.refreshSettingsModalData();
            }

            return success;
        } catch (e) {
            console.error("Create deposit error:", e);
            CryptoZoo.ui?.showToast?.(e.message || this.t("depositCreateError", "Błąd depozytu"));
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
        const el = document.getElementById("settingsWithdrawHistoryList");
        if (!el) return;

        if (this.withdrawHistoryLoading) {
            el.innerHTML = `<div>${this.t("loadingHistory", "Loading...")}</div>`;
            return;
        }

        if (!this.withdrawHistory.length) {
            el.innerHTML = `<div>${this.t("noWithdrawRequests", "Brak withdraw requestów")}</div>`;
            return;
        }

        el.innerHTML = this.withdrawHistory
            .map((w) => {
                const amount = this.format(w.rewardAmount ?? w.amount).toFixed(3);
                const usd = this.getRewardUsdLabel(w.rewardAmount ?? w.amount);
                const status = String(w.status || "pending");

                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${amount} reward • ${usd}</div>
                        <div style="margin-top:4px;">${status}</div>
                    </div>
                `;
            })
            .join("");
    },

    async loadDepositsHistory() {
        this.depositsHistoryLoading = true;
        this.renderDepositsHistory();

        try {
            const list = await CryptoZoo.api.loadDepositsHistory?.();
            this.depositsHistory = Array.isArray(list) ? list : [];
        } catch (e) {
            this.depositsHistory = [];
        }

        this.depositsHistoryLoading = false;
        this.renderDepositsHistory();
    },

    renderDepositsHistory() {
        const el = document.getElementById("settingsDepositsHistoryList");
        if (!el) return;

        if (this.depositsHistoryLoading) {
            el.innerHTML = `<div>${this.t("loadingHistory", "Loading...")}</div>`;
            return;
        }

        if (!this.depositsHistory.length) {
            el.innerHTML = `<div>${this.t("noDepositsHistory", "Brak historii wpłat")}</div>`;
            return;
        }

        el.innerHTML = this.depositsHistory
            .map((d) => {
                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.format(d.amount).toFixed(3)} TON</div>
                        <div style="margin-top:4px;">${d.status}</div>
                    </div>
                `;
            })
            .join("");
    },

    toggleFinanceSection(forceValue = null) {
        this.financeSectionOpen = typeof forceValue === "boolean"
            ? forceValue
            : !this.financeSectionOpen;

        this.renderFinanceSectionToggle();
    },

    renderFinanceSectionToggle() {
        const content = document.getElementById("settingsFinanceContent");
        const btn = document.getElementById("toggleFinanceBtn");
        const arrow = document.getElementById("toggleFinanceBtnArrow");
        const label = document.getElementById("toggleFinanceBtnLabel");

        if (content) {
            content.style.display = this.financeSectionOpen ? "block" : "none";
        }

        if (btn) {
            btn.setAttribute("aria-expanded", this.financeSectionOpen ? "true" : "false");
        }

        if (arrow) {
            arrow.textContent = this.financeSectionOpen ? "▲" : "▼";
        }

        if (label) {
            label.textContent = this.financeSectionOpen
                ? this.t("hideWithdraw", "Ukryj deposit / withdraw")
                : this.t("toggleWithdraw", "Deposit / Withdraw");
        }
    },

    openSettingsModal() {
        const modal = document.getElementById("settingsModal");
        if (!modal) return;

        this.refreshSettingsModalData();
        this.renderExtraPanels();
        modal.classList.remove("hidden");

        Promise.all([
            this.loadWithdrawHistory(),
            this.loadDepositsHistory()
        ]).catch(() => {});
    },

    closeSettingsModal() {
        document.getElementById("settingsModal")?.classList.add("hidden");
        CryptoZoo.uiFaq?.close?.();
    },

    openFaq() {
        CryptoZoo.uiFaq?.open?.();
    },

    closeFaq() {
        CryptoZoo.uiFaq?.close?.();
    },

    bindFaqButtons() {
        const openFaqBtn = document.getElementById("openFaqBtn");
        if (openFaqBtn && !openFaqBtn.dataset.bound) {
            openFaqBtn.dataset.bound = "1";
            openFaqBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.openFaq();
            });
        }
    },

    bindSettingsModal() {
        const closeBtn = document.getElementById("closeSettingsBtn");
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.closeSettingsModal();
            });
        }

        const backdrop = document.getElementById("settingsBackdrop");
        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";
            backdrop.addEventListener("click", () => {
                this.closeSettingsModal();
            });
        }

        const languageValue = document.getElementById("settingsLanguageValue");
        const languageBox = languageValue?.closest(".profile-box");

        if (languageBox && !languageBox.dataset.bound) {
            languageBox.dataset.bound = "1";
            languageBox.style.cursor = "pointer";
            languageBox.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.toggleLanguage();
            });
        }

        const soundValue = document.getElementById("settingsSoundValue");
        const soundBox = soundValue?.closest(".profile-box");

        if (soundBox && !soundBox.dataset.bound) {
            soundBox.dataset.bound = "1";
            soundBox.style.cursor = "pointer";
            soundBox.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.toggleSound();
            });
        }

        const toggleFinanceBtn = document.getElementById("toggleFinanceBtn");
        if (toggleFinanceBtn && !toggleFinanceBtn.dataset.bound) {
            toggleFinanceBtn.dataset.bound = "1";
            toggleFinanceBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.toggleFinanceSection();
            });
        }

        const transferBtn = document.getElementById("settingsTransferRewardBtn");
        if (transferBtn && !transferBtn.dataset.bound) {
            transferBtn.dataset.bound = "1";
            transferBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.transferRewardToWallet();
            });
        }

        const withdrawBtn = document.getElementById("settingsRequestWithdrawBtn");
        if (withdrawBtn && !withdrawBtn.dataset.bound) {
            withdrawBtn.dataset.bound = "1";
            withdrawBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.requestWithdraw();
            });
        }

        const depositBtn = document.getElementById("settingsCreateDepositBtn");
        if (depositBtn && !depositBtn.dataset.bound) {
            depositBtn.dataset.bound = "1";
            depositBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.createDeposit();
            });
        }

        this.bindFaqButtons();
    }
};
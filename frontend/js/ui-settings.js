window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiSettings = {
    storageKey: "cryptozoo_settings",
    minWithdrawReward: 3,

    withdrawHistory: [],
    withdrawHistoryLoading: false,
    depositsHistory: [],
    depositsHistoryLoading: false,

    financeSectionOpen: false,

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

    format(v) {
        return Number((Number(v) || 0).toFixed(3));
    },

    canWithdraw() {
        return this.getRewardWallet() >= this.minWithdrawReward;
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

        if (rewardBalanceEl) {
            rewardBalanceEl.textContent = this.format(this.getRewardBalance()).toFixed(3);
        }

        if (rewardWalletEl) {
            rewardWalletEl.textContent = this.format(this.getRewardWallet()).toFixed(3);
        }

        if (withdrawPendingEl) {
            withdrawPendingEl.textContent = this.format(this.getWithdrawPending()).toFixed(3);
        }

        const transferBtn = document.getElementById("settingsTransferRewardBtn");
        if (transferBtn) {
            const balance = this.getRewardBalance();
            transferBtn.disabled = balance <= 0;
            transferBtn.style.opacity = balance > 0 ? "1" : "0.5";
            transferBtn.textContent =
                balance > 0
                    ? `${this.t("transferReward", "Transfer Reward")} (${balance.toFixed(3)})`
                    : this.t("noRewardToTransfer", "Brak Reward do transferu");
        }

        const withdrawBtn = document.getElementById("settingsRequestWithdrawBtn");
        if (withdrawBtn) {
            const wallet = this.getRewardWallet();
            const can = this.canWithdraw();

            withdrawBtn.disabled = !can;
            withdrawBtn.style.opacity = can ? "1" : "0.5";
            withdrawBtn.textContent = can
                ? `${this.t("withdrawRequest", "Withdraw Request")} (${wallet.toFixed(3)})`
                : `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward}`;
        }

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
        const amount = this.getRewardBalance();

        if (amount <= 0) {
            CryptoZoo.ui?.showToast?.(this.t("noRewardToTransfer", "Brak Reward do transferu"));
            return false;
        }

        CryptoZoo.state.rewardWallet = this.getRewardWallet() + amount;
        CryptoZoo.state.rewardBalance = 0;

        await CryptoZoo.api.savePlayer();

        CryptoZoo.ui?.showToast?.(`+${amount.toFixed(3)} reward → wallet`);

        this.refreshSettingsModalData();
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
            this.refreshSettingsModalData();

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
                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.format(w.amount).toFixed(3)} reward</div>
                        <div style="margin-top:4px;">${w.status}</div>
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
            el.innerHTML = `<div>Brak historii wpłat</div>`;
            return;
        }

        el.innerHTML = this.depositsHistory
            .map((d) => {
                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.format(d.amount).toFixed(3)} reward</div>
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
                ? this.t("hideWithdraw", "Ukryj reward / wypłaty")
                : this.t("toggleWithdraw", "Reward / Withdraw");
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

        this.bindFaqButtons();
    }
};
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiSettings = {
    storageKey: "cryptozoo_settings",
    withdrawHistory: [],
    withdrawHistoryLoading: false,
    depositsHistory: [],
    depositsHistoryLoading: false,
    financeSectionOpen: false,

    minDepositUsd: 1,
    defaultDepositUsd: 10,

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

    initSettings() {
        const settings = this.getSettings();
        this.applySettings(settings);
        this.syncAudioWithSettings(settings);
        this.refreshSettingsModalData();
    },

    getLanguageLabel(language) {
        return language === "en" ? "English" : "Polski";
    },

    getSoundLabel(sound) {
        return sound ? "ON" : "OFF";
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

    formatUsdAmount(rewardValue) {
        if (typeof CryptoZoo.formatUsd === "function") {
            return CryptoZoo.formatUsd(rewardValue);
        }

        const rate = Number(CryptoZoo.config?.rewardToUsdRate || 0);
        const usd = (Number(rewardValue) || 0) * rate;
        return "$" + usd.toFixed(2);
    },

    formatDepositUsd(value) {
        const safe = Math.max(0, Number(value) || 0);
        return Number(safe.toFixed(2));
    },

    getDepositInputValue() {
        const rawValue =
            CryptoZoo.depositBind?.customUsdAmount ??
            CryptoZoo.depositBind?.selectedAmount ??
            this.defaultDepositUsd;

        const safeValue = this.formatDepositUsd(rawValue);
        return safeValue >= this.minDepositUsd ? safeValue : this.defaultDepositUsd;
    },

    setDepositInputValue(value) {
        const safeValue = this.formatDepositUsd(value);

        CryptoZoo.depositBind = CryptoZoo.depositBind || {};
        CryptoZoo.depositBind.customUsdAmount = safeValue;
        CryptoZoo.depositBind.selectedAmount = safeValue;
    },

    getDepositBonusMeta(amountUsd) {
        const safeAmount = Math.max(this.minDepositUsd, this.formatDepositUsd(amountUsd));

        return {
            amountUsd: safeAmount,
            gems: Math.floor(safeAmount * 5),
            boostPercent: Math.min(100, Math.floor(safeAmount * 6)),
            durationHours: Math.floor(safeAmount * 7)
        };
    },

    formatDaysLabel(days) {
        const safeDays = Math.max(0, Math.floor(Number(days) || 0));

        if (safeDays === 1) {
            return "1 dzień";
        }

        return `${safeDays} dni`;
    },

    formatHoursLabel(hours) {
        const safeHours = Math.max(0, Math.floor(Number(hours) || 0));

        if (safeHours <= 0) {
            return "0h";
        }

        const days = Math.floor(safeHours / 24);
        const restHours = safeHours % 24;

        if (days <= 0) {
            return `${safeHours}h`;
        }

        if (restHours <= 0) {
            return this.formatDaysLabel(days);
        }

        return `${this.formatDaysLabel(days)} ${restHours}h`;
    },

    getSelectedDepositAmount() {
        return this.getDepositInputValue();
    },

    updateDepositPreviewUi() {
        const input = document.getElementById("settingsDepositUsdInput");
        const gemsEl = document.getElementById("settingsDepositPreviewGems");
        const boostEl = document.getElementById("settingsDepositPreviewBoost");
        const durationEl = document.getElementById("settingsDepositPreviewDuration");
        const depositBtn = document.getElementById("settingsCreateDepositBtn");

        const currentValue = input
            ? this.formatDepositUsd(input.value)
            : this.getSelectedDepositAmount();

        const safeValue = currentValue >= this.minDepositUsd
            ? currentValue
            : this.minDepositUsd;

        this.setDepositInputValue(safeValue);

        const bonus = this.getDepositBonusMeta(safeValue);

        if (gemsEl) {
            gemsEl.textContent = `+${CryptoZoo.formatNumber(bonus.gems)} gem`;
        }

        if (boostEl) {
            boostEl.textContent = `+${CryptoZoo.formatNumber(bonus.boostPercent)}% boost ekspedycji`;
        }

        if (durationEl) {
            durationEl.textContent = this.formatHoursLabel(bonus.durationHours);
        }

        if (depositBtn) {
            depositBtn.textContent = `Create Deposit (${safeValue}$)`;
        }
    },

    bindDepositInput() {
        const input = document.getElementById("settingsDepositUsdInput");
        if (!input || input.dataset.bound) return;

        input.dataset.bound = "1";

        input.addEventListener("input", () => {
            this.updateDepositPreviewUi();
        });

        input.addEventListener("change", () => {
            this.updateDepositPreviewUi();
        });

        input.addEventListener("blur", () => {
            const parsed = this.formatDepositUsd(input.value);

            if (parsed < this.minDepositUsd) {
                input.value = this.minDepositUsd.toFixed(2).replace(/\.00$/, "");
                this.setDepositInputValue(this.minDepositUsd);
            } else {
                input.value = String(this.formatDepositUsd(parsed));
                this.setDepositInputValue(parsed);
            }

            this.updateDepositPreviewUi();
        });
    },

    renderDepositAmountOptions() {
        const wrap = document.getElementById("settingsDepositAmountOptions");
        if (!wrap) return;

        CryptoZoo.depositBind = CryptoZoo.depositBind || {};

        const currentValue = this.getDepositInputValue();
        const bonus = this.getDepositBonusMeta(currentValue);

        wrap.innerHTML = `
            <div
                style="
                    width:100%;
                    padding:14px 16px;
                    border-radius:16px;
                    border:1px solid rgba(255,255,255,0.14);
                    background:rgba(255,255,255,0.04);
                    color:#ffffff;
                    box-sizing:border-box;
                "
            >
                <div style="font-size:13px;font-weight:800;color:rgba(255,255,255,0.72);">
                    Minimalna wpłata
                </div>
                <div style="margin-top:4px;font-size:15px;font-weight:900;">
                    ${this.minDepositUsd}$
                </div>

                <div style="margin-top:14px;font-size:13px;font-weight:800;color:rgba(255,255,255,0.72);">
                    Wpisz kwotę $
                </div>

                <input
                    id="settingsDepositUsdInput"
                    type="number"
                    inputmode="decimal"
                    min="${this.minDepositUsd}"
                    step="0.01"
                    value="${currentValue}"
                    placeholder="${this.defaultDepositUsd}"
                    style="
                        width:100%;
                        margin-top:10px;
                        padding:14px 16px;
                        border-radius:14px;
                        border:1px solid rgba(255,255,255,0.14);
                        background:rgba(0,0,0,0.20);
                        color:#fff;
                        font-size:16px;
                        font-weight:900;
                        outline:none;
                        box-sizing:border-box;
                    "
                />

                <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.10);">
                    <div
                        id="settingsDepositPreviewGems"
                        style="font-size:13px;font-weight:800;line-height:1.35;color:rgba(255,255,255,0.92);"
                    >
                        +${CryptoZoo.formatNumber(bonus.gems)} gem
                    </div>
                    <div
                        id="settingsDepositPreviewBoost"
                        style="margin-top:6px;font-size:13px;font-weight:800;line-height:1.35;color:rgba(255,255,255,0.82);"
                    >
                        +${CryptoZoo.formatNumber(bonus.boostPercent)}% boost ekspedycji
                    </div>
                    <div
                        id="settingsDepositPreviewDuration"
                        style="margin-top:6px;font-size:13px;font-weight:800;line-height:1.35;color:rgba(255,255,255,0.72);"
                    >
                        ${this.formatHoursLabel(bonus.durationHours)}
                    </div>
                </div>
            </div>
        `;

        this.bindDepositInput();
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
            rewardBalanceUsdEl.textContent = this.formatUsdAmount(rewardBalance);
        }

        if (rewardWalletUsdEl) {
            rewardWalletUsdEl.textContent = this.formatUsdAmount(rewardWallet);
        }

        if (withdrawPendingUsdEl) {
            withdrawPendingUsdEl.textContent = this.formatUsdAmount(withdrawPending);
        }

        const transferBtn = document.getElementById("settingsTransferRewardBtn");
        if (transferBtn) {
            const canTransfer = rewardBalance > 0;
            transferBtn.disabled = !canTransfer;
            transferBtn.style.opacity = canTransfer ? "1" : "0.5";
            transferBtn.textContent = canTransfer
                ? `Przenieś do wallet (${rewardBalance.toFixed(3)})`
                : "Brak Reward do transferu";
        }

        const withdrawBtn = document.getElementById("settingsRequestWithdrawBtn");
        if (withdrawBtn) {
            const canOpenWithdraw = rewardWallet >= 20 && withdrawPending <= 0;

            withdrawBtn.disabled = !canOpenWithdraw;
            withdrawBtn.style.opacity = canOpenWithdraw ? "1" : "0.5";

            if (withdrawPending > 0) {
                withdrawBtn.textContent = "Masz aktywny withdraw";
            } else if (rewardWallet < 20) {
                withdrawBtn.textContent = "Min withdraw 20";
            } else {
                withdrawBtn.textContent = "Open Withdraw";
            }
        }

        const depositBtn = document.getElementById("settingsCreateDepositBtn");
        if (depositBtn) {
            const selectedAmount = this.getSelectedDepositAmount();
            depositBtn.disabled = false;
            depositBtn.style.opacity = "1";
            depositBtn.textContent = `Create Deposit (${selectedAmount}$)`;
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

        CryptoZoo.ui?.showToast?.(
            saved.sound ? "Dźwięki: ON" : "Dźwięki: OFF"
        );
    },

    async transferRewardToWallet() {
        const rewardBalance = this.getRewardBalance();

        if (rewardBalance <= 0) {
            CryptoZoo.ui?.showToast?.("Brak reward do przeniesienia");
            return false;
        }

        try {
            const response = await CryptoZoo.api.transferRewardToWallet();
            const transferredAmount = Number(
                response?.transferredAmount || rewardBalance
            );

            CryptoZoo.ui?.showToast?.(
                `Przeniesiono do wallet: ${transferredAmount.toFixed(3)}`
            );

            this.refreshSettingsModalData();
            CryptoZoo.ui?.render?.();

            return true;
        } catch (error) {
            console.error("Transfer reward->wallet failed:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || "Błąd transferu"
            );
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
            CryptoZoo.ui?.showToast?.(e.message || "Błąd depozytu");
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
            el.innerHTML = `<div>Loading...</div>`;
            return;
        }

        if (!this.withdrawHistory.length) {
            el.innerHTML = `<div>Brak withdraw requestów</div>`;
            return;
        }

        const recentWithdraws = this.withdrawHistory.slice(0, 3);

        el.innerHTML = recentWithdraws
            .map((w) => {
                const grossReward = this.format(
                    w.grossRewardAmount ??
                    w.rewardAmount ??
                    w.amount
                );

                const status = String(w.status || "pending");
                const usdText = this.formatUsdAmount(grossReward);

                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${grossReward.toFixed(3)} reward</div>
                        <div style="margin-top:4px; font-size:12px; color:rgba(255,255,255,0.68);">${usdText}</div>
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
            el.innerHTML = `<div>Loading...</div>`;
            return;
        }

        if (!this.depositsHistory.length) {
            el.innerHTML = `<div>Brak historii wpłat</div>`;
            return;
        }

        const recentDeposits = this.depositsHistory.slice(0, 3);

        el.innerHTML = recentDeposits
            .map((d) => {
                const gemsAmount = Math.max(0, Number(d.gemsAmount) || 0);
                const expeditionBoostAmount = Math.max(0, Number(d.expeditionBoostAmount) || 0);
                const boostPercent = Math.round(expeditionBoostAmount * 100);
                const durationMs = Math.max(0, Number(d.expeditionBoostDurationMs) || 0);
                const durationHours = durationMs > 0
                    ? Math.max(1, Math.floor(durationMs / (60 * 60 * 1000)))
                    : 0;

                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.format(d.amount).toFixed(3)} TON</div>
                        ${gemsAmount > 0 ? `<div style="margin-top:4px;">+${CryptoZoo.formatNumber(gemsAmount)} gem</div>` : ``}
                        ${boostPercent > 0 ? `<div style="margin-top:4px;">+${boostPercent}% boost ekspedycji</div>` : ``}
                        ${durationHours > 0 ? `<div style="margin-top:4px;">${this.formatHoursLabel(durationHours)}</div>` : ``}
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
                ? "Ukryj deposit / withdraw"
                : "Deposit / Withdraw";
        }
    },

    openSettingsModal() {
        const modal = document.getElementById("settingsModal");
        if (!modal) return;

        this.refreshSettingsModalData();
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

    bindFaqButtons() {
        const openFaqBtn = document.getElementById("openFaqBtn");
        if (openFaqBtn && !openFaqBtn.dataset.bound) {
            openFaqBtn.dataset.bound = "1";
            openFaqBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.openFaq();
            });
        }

        const openSupportBtn = document.getElementById("openSupportBtn");
        if (openSupportBtn && !openSupportBtn.dataset.bound) {
            openSupportBtn.dataset.bound = "1";
            openSupportBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");

                const tg = window.Telegram?.WebApp;
                const url = "https://t.me/CryptoZooSupportBot";

                CryptoZoo.ui?.showToast?.("Otwieranie supportu...");

                if (tg?.openLink) {
                    tg.openLink(url);
                } else {
                    window.open(url, "_blank");
                }
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
                CryptoZoo.uiWithdraw?.open?.();
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
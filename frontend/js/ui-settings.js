window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiSettings = {
    storageKey: "cryptozoo_settings",
    minWithdrawReward: 20,
    usdPerReward: 0.05,
    withdrawFeePercent: 0.10,
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

    formatDaysLabel(days) {
        const safeDays = Math.max(0, Math.floor(Number(days) || 0));

        if (safeDays === 1) {
            return this.t("oneDay", "1 dzień");
        }

        return `${safeDays} ${this.t("days", "dni")}`;
    },

    formatDateTime(value) {
        const ts = Math.max(0, Number(value) || 0);
        if (!ts) return "";

        try {
            return new Date(ts).toLocaleString();
        } catch (error) {
            return "";
        }
    },

    formatTimeLeftMs(ms) {
        const safeMs = Math.max(0, Number(ms) || 0);
        const totalSeconds = Math.ceil(safeMs / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const hh = String(hours).padStart(2, "0");
        const mm = String(minutes).padStart(2, "0");
        const ss = String(seconds).padStart(2, "0");

        return `${hh}:${mm}:${ss}`;
    },

    getDepositBonusMeta(amount) {
        const safeAmount = Number(amount) || 0;

        if (safeAmount >= 10) {
            return {
                amount: 10,
                gems: 150,
                boostPercent: 60,
                durationDays: 7
            };
        }

        if (safeAmount >= 5) {
            return {
                amount: 5,
                gems: 70,
                boostPercent: 30,
                durationDays: 5
            };
        }

        if (safeAmount >= 3) {
            return {
                amount: 3,
                gems: 35,
                boostPercent: 15,
                durationDays: 3
            };
        }

        return {
            amount: 1,
            gems: 10,
            boostPercent: 5,
            durationDays: 1
        };
    },

    getWithdrawFeeAmount(rewardAmount) {
        const reward = Math.max(0, Number(rewardAmount) || 0);
        return Number((reward * this.withdrawFeePercent).toFixed(3));
    },

    getWithdrawNetReward(rewardAmount) {
        const reward = Math.max(0, Number(rewardAmount) || 0);
        const fee = this.getWithdrawFeeAmount(reward);
        return Number(Math.max(0, reward - fee).toFixed(3));
    },

    formatUsdFromReward(rewardAmount) {
        const usd = Number(rewardAmount || 0) * this.usdPerReward;
        return Number(usd.toFixed(3));
    },

    getRewardUsdLabel(rewardAmount) {
        return `$${this.formatUsdFromReward(rewardAmount).toFixed(3)}`;
    },

    getWithdrawGrossUsdLabel(rewardAmount) {
        return this.getRewardUsdLabel(rewardAmount);
    },

    getWithdrawFeeUsdLabel(rewardAmount) {
        return this.getRewardUsdLabel(this.getWithdrawFeeAmount(rewardAmount));
    },

    getWithdrawNetUsdLabel(rewardAmount) {
        return this.getRewardUsdLabel(this.getWithdrawNetReward(rewardAmount));
    },

    getWithdrawAvailability() {
        const rewardWallet = this.getRewardWallet();
        const withdrawPending = this.getWithdrawPending();
        const level = this.getPlayerLevel();
        const accountAgeMs = this.getAccountAgeMs();

        if (rewardWallet < this.minWithdrawReward) {
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

    normalizeDepositItem(raw) {
        const item = raw && typeof raw === "object" ? raw : {};

        return {
            ...item,
            id: String(item.id || item._id || item.depositId || ""),
            depositId: String(item.depositId || item.id || item._id || ""),
            amount: Number(item.amount) || 0,
            gemsAmount: Math.max(0, Number(item.gemsAmount) || 0),
            expeditionBoostAmount: Math.max(0, Number(item.expeditionBoostAmount) || 0),
            expeditionBoostDurationMs: Math.max(0, Number(item.expeditionBoostDurationMs) || 0),
            paymentComment: String(item.paymentComment || ""),
            txHash: String(item.txHash || item.hash || ""),
            status: String(item.status || "created").toLowerCase(),
            note: String(item.note || ""),
            createdAt: Math.max(0, Number(item.createdAt) || 0),
            updatedAt: Math.max(0, Number(item.updatedAt) || 0),
            approvedAt: Math.max(0, Number(item.approvedAt) || 0),
            expiresAt: Math.max(0, Number(item.expiresAt) || 0),
            asset: String(item.asset || item.currency || "TON"),
            currency: String(item.currency || item.asset || "TON")
        };
    },

    getAllKnownDeposits() {
        const history = Array.isArray(this.depositsHistory) ? this.depositsHistory : [];
        const stateDeposits = Array.isArray(CryptoZoo.state?.deposits) ? CryptoZoo.state.deposits : [];
        const stateDepositHistory = Array.isArray(CryptoZoo.state?.depositHistory)
            ? CryptoZoo.state.depositHistory
            : [];

        const map = new Map();

        [...history, ...stateDeposits, ...stateDepositHistory].forEach((entry, index) => {
            const item = this.normalizeDepositItem(entry);
            const key =
                item.id ||
                item.depositId ||
                item.paymentComment ||
                item.txHash ||
                `deposit-${index}-${item.createdAt}`;

            const existing = map.get(key);

            if (!existing) {
                map.set(key, item);
                return;
            }

            const existingUpdated = Math.max(
                Number(existing.updatedAt || 0),
                Number(existing.createdAt || 0),
                Number(existing.approvedAt || 0)
            );
            const nextUpdated = Math.max(
                Number(item.updatedAt || 0),
                Number(item.createdAt || 0),
                Number(item.approvedAt || 0)
            );

            if (nextUpdated >= existingUpdated) {
                map.set(key, item);
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const timeA = Math.max(
                Number(a.updatedAt || 0),
                Number(a.createdAt || 0),
                Number(a.approvedAt || 0)
            );
            const timeB = Math.max(
                Number(b.updatedAt || 0),
                Number(b.createdAt || 0),
                Number(b.approvedAt || 0)
            );
            return timeB - timeA;
        });
    },

    isPendingDepositStatus(status) {
        const safe = String(status || "").toLowerCase();
        return safe === "created" || safe === "pending";
    },

    isDepositExpired(deposit) {
        const expiresAt = Math.max(0, Number(deposit?.expiresAt) || 0);

        if (!expiresAt) {
            return false;
        }

        return Date.now() > expiresAt;
    },

    isDepositActive(deposit) {
        if (!deposit) return false;
        return this.isPendingDepositStatus(deposit.status) && !this.isDepositExpired(deposit);
    },

    getActivePendingDeposit() {
        const deposits = this.getAllKnownDeposits();
        return deposits.find((deposit) => this.isDepositActive(deposit)) || null;
    },

    getDepositAvailability() {
        const activeDeposit = this.getActivePendingDeposit();

        if (activeDeposit) {
            const remainingMs = Math.max(
                0,
                Number(activeDeposit.expiresAt || 0) - Date.now()
            );

            return {
                ok: false,
                activeDeposit,
                reason:
                    remainingMs > 0
                        ? `${this.t("activeDepositExists", "Masz już aktywny deposit")} • ${this.formatTimeLeftMs(remainingMs)}`
                        : this.t("activeDepositExists", "Masz już aktywny deposit")
            };
        }

        return {
            ok: true,
            activeDeposit: null,
            reason: ""
        };
    },

    canCreateDeposit() {
        return this.getDepositAvailability().ok;
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
        const amount = Number(
            CryptoZoo.depositBind?.selectedAmount || this.depositAmounts[1] || 3
        );
        return amount > 0 ? amount : 3;
    },

    renderDepositAmountOptions() {
        const wrap = document.getElementById("settingsDepositAmountOptions");
        if (!wrap) return;

        CryptoZoo.depositBind = CryptoZoo.depositBind || {};

        const selectedAmount = this.getSelectedDepositAmount();
        const depositAvailability = this.getDepositAvailability();
        const disableSelection = !depositAvailability.ok;

        wrap.innerHTML = this.depositAmounts
            .map((amount) => {
                const isActive = amount === selectedAmount;
                const bonus = this.getDepositBonusMeta(amount);

                return `
                <button
                    type="button"
                    class="deposit-amount-btn${isActive ? " active" : ""}"
                    data-amount="${amount}"
                    ${disableSelection ? "disabled" : ""}
                    style="
                        width:100%;
                        padding:14px 16px;
                        border-radius:16px;
                        border:${isActive ? "2px solid rgba(255,210,60,0.95)" : "1px solid rgba(255,255,255,0.14)"};
                        background:${isActive ? "linear-gradient(180deg, rgba(255,210,60,0.20) 0%, rgba(255,185,0,0.10) 100%)" : "rgba(255,255,255,0.04)"};
                        color:#ffffff;
                        font-weight:900;
                        font-size:14px;
                        box-shadow:${isActive ? "0 10px 24px rgba(255,190,0,0.14)" : "none"};
                        cursor:${disableSelection ? "not-allowed" : "pointer"};
                        display:block;
                        text-align:left;
                        appearance:none;
                        -webkit-appearance:none;
                        opacity:${disableSelection ? "0.55" : "1"};
                    "
                >
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                        <div style="font-size:16px;font-weight:900;">${amount} TON</div>
                        <div style="font-size:18px;line-height:1;">${isActive ? "▲" : "▼"}</div>
                    </div>

                    ${
                        isActive
                            ? `
                                <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.10);">
                                    <div style="font-size:13px;font-weight:800;line-height:1.35;color:rgba(255,255,255,0.92);">
                                        +${CryptoZoo.formatNumber(bonus.gems)} gem
                                    </div>
                                    <div style="margin-top:6px;font-size:13px;font-weight:800;line-height:1.35;color:rgba(255,255,255,0.82);">
                                        +${CryptoZoo.formatNumber(bonus.boostPercent)}% ${this.t("expeditionBoost", "boost ekspedycji")}
                                    </div>
                                    <div style="margin-top:6px;font-size:13px;font-weight:800;line-height:1.35;color:rgba(255,255,255,0.72);">
                                        ${this.formatDaysLabel(bonus.durationDays)}
                                    </div>
                                </div>
                            `
                            : ``
                    }
                </button>
            `;
            })
            .join("");

        const buttons = wrap.querySelectorAll(".deposit-amount-btn");
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (btn.disabled) {
                    return;
                }

                const amount = Number(btn.dataset.amount) || 1;

                CryptoZoo.depositBind = CryptoZoo.depositBind || {};
                CryptoZoo.depositBind.selectedAmount = amount;

                this.renderDepositAmountOptions();

                const depositBtn = document.getElementById("settingsCreateDepositBtn");
                if (depositBtn) {
                    depositBtn.textContent = `${this.t("createDeposit", "Stwórz deposit")} (${amount} TON)`;
                }
            });
        });

        if (typeof CryptoZoo.depositBind?.bindAmountButtons === "function") {
            CryptoZoo.depositBind.bindAmountButtons();
        }
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
        const rewardWalletDescEl = document.getElementById("settingsRewardWalletDesc");

        const rewardBalance = this.getRewardBalance();
        const rewardWallet = this.getRewardWallet();
        const withdrawPending = this.getWithdrawPending();

        const feeAmount = this.getWithdrawFeeAmount(rewardWallet);
        const netReward = this.getWithdrawNetReward(rewardWallet);

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

        if (rewardWalletDescEl) {
            const depositAvailability = this.getDepositAvailability();

            rewardWalletDescEl.textContent = "";
            rewardWalletDescEl.innerHTML = "";
            rewardWalletDescEl.style.display = "none";

            if (depositAvailability.activeDeposit) {
                const activeDeposit = depositAvailability.activeDeposit;
                const expiresLabel = activeDeposit.expiresAt
                    ? this.formatDateTime(activeDeposit.expiresAt)
                    : "";
                const remainingMs = Math.max(
                    0,
                    Number(activeDeposit.expiresAt || 0) - Date.now()
                );

                rewardWalletDescEl.style.display = "block";
                rewardWalletDescEl.innerHTML = `
                    <div style="margin-top:8px;font-size:12px;line-height:1.45;color:rgba(255,255,255,0.78);">
                        <div>${this.t("activeDepositExists", "Masz już aktywny deposit")}: ${this.format(activeDeposit.amount).toFixed(3)} TON</div>
                        ${
                            activeDeposit.paymentComment
                                ? `<div style="margin-top:4px;">${this.t("paymentComment", "Komentarz płatności")}: ${activeDeposit.paymentComment}</div>`
                                : ``
                        }
                        ${
                            remainingMs > 0
                                ? `<div style="margin-top:4px;">${this.t("timeLeft", "Pozostało")}: ${this.formatTimeLeftMs(remainingMs)}</div>`
                                : ``
                        }
                        ${
                            expiresLabel
                                ? `<div style="margin-top:4px;">${this.t("expiresAt", "Wygasa")}: ${expiresLabel}</div>`
                                : ``
                        }
                    </div>
                `;
            }
        }

        const transferBtn = document.getElementById("settingsTransferRewardBtn");
        if (transferBtn) {
            const canTransfer = rewardBalance > 0;
            transferBtn.disabled = !canTransfer;
            transferBtn.style.opacity = canTransfer ? "1" : "0.5";
            transferBtn.style.display = "";
            transferBtn.textContent = canTransfer
                ? `${this.t("transferToWallet", "Przenieś do wallet")} (${rewardBalance.toFixed(3)})`
                : this.t("noRewardToTransfer", "Brak reward do przeniesienia");
        }

        const withdrawBtn = document.getElementById("settingsRequestWithdrawBtn");
        if (withdrawBtn) {
            const availability = this.getWithdrawAvailability();
            const can = availability.ok;

            withdrawBtn.disabled = !can;
            withdrawBtn.style.opacity = can ? "1" : "0.5";
            withdrawBtn.textContent = can
                ? `${this.t("withdrawRequest", "Withdraw Request")} (${netReward.toFixed(3)} • ${this.getWithdrawNetUsdLabel(rewardWallet)})`
                : `${this.t("minWithdraw", "Min withdraw")} ${this.minWithdrawReward}`;
        }

        if (withdrawHintEl) {
            const availability = this.getWithdrawAvailability();

            if (availability.ok) {
                withdrawHintEl.textContent =
                    `${this.t("walletUsedForWithdraw", "Withdraw używa reward wallet")}. ` +
                    `${this.t("grossValue", "Brutto")}: ${rewardWallet.toFixed(3)} • ${this.getWithdrawGrossUsdLabel(rewardWallet)} | ` +
                    `${this.t("fee", "Fee")} 10%: ${feeAmount.toFixed(3)} • ${this.getWithdrawFeeUsdLabel(rewardWallet)} | ` +
                    `${this.t("netValue", "Netto")}: ${netReward.toFixed(3)} • ${this.getWithdrawNetUsdLabel(rewardWallet)}`;
            } else {
                withdrawHintEl.textContent =
                    `${this.t("walletUsedForWithdraw", "Withdraw używa reward wallet")}. ${availability.reason}`;
            }
        }

        const depositBtn = document.getElementById("settingsCreateDepositBtn");
        if (depositBtn) {
            const selectedAmount = this.getSelectedDepositAmount();
            const depositAvailability = this.getDepositAvailability();

            depositBtn.disabled = !depositAvailability.ok;
            depositBtn.style.opacity = depositAvailability.ok ? "1" : "0.5";
            depositBtn.textContent = depositAvailability.ok
                ? `${this.t("createDeposit", "Stwórz deposit")} (${selectedAmount} TON)`
                : depositAvailability.reason || this.t("activeDepositExists", "Masz już aktywny deposit");
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
        const rewardBalance = this.getRewardBalance();

        if (rewardBalance <= 0) {
            CryptoZoo.ui?.showToast?.(
                this.t("noRewardToTransfer", "Brak reward do przeniesienia")
            );
            return false;
        }

        try {
            const response = await CryptoZoo.api.transferRewardToWallet();
            const transferredAmount = Number(response?.transferredAmount || rewardBalance);

            CryptoZoo.ui?.showToast?.(
                `${this.t("transferredToWallet", "Przeniesiono do wallet")}: ${transferredAmount.toFixed(3)}`
            );

            this.refreshSettingsModalData();
            CryptoZoo.ui?.render?.();

            return true;
        } catch (error) {
            console.error("Transfer reward->wallet failed:", error);
            CryptoZoo.ui?.showToast?.(
                error?.message || this.t("transferError", "Błąd transferu")
            );
            return false;
        }
    },

    async requestWithdraw() {
        const rewardWallet = this.getRewardWallet();
        const availability = this.getWithdrawAvailability();
        const netReward = this.getWithdrawNetReward(rewardWallet);

        if (!availability.ok) {
            CryptoZoo.ui?.showToast?.(availability.reason);
            return false;
        }

        try {
            await CryptoZoo.api.createWithdrawRequest(rewardWallet);

            CryptoZoo.ui?.showToast?.(
                `${this.t("withdrawCreated", "Withdraw created")}: ${netReward.toFixed(3)} • ${this.getWithdrawNetUsdLabel(rewardWallet)}`
            );

            await this.loadWithdrawHistory();
            this.refreshSettingsModalData();
            CryptoZoo.ui?.render?.();

            return true;
        } catch (e) {
            CryptoZoo.ui?.showToast?.(
                e.message || this.t("withdrawCreateError", "Błąd withdraw")
            );
            return false;
        }
    },

    async createDeposit() {
        const amount = this.getSelectedDepositAmount();
        const availabilityBefore = this.getDepositAvailability();

        if (!availabilityBefore.ok) {
            CryptoZoo.ui?.showToast?.(
                availabilityBefore.reason || this.t("activeDepositExists", "Masz już aktywny deposit")
            );
            this.refreshSettingsModalData();
            return false;
        }

        try {
            if (!CryptoZoo.depositUI?.createDeposit) {
                throw new Error("Deposit UI not loaded");
            }

            await CryptoZoo.api.syncPendingDeposits?.(false);
            await this.loadDepositsHistory();

            const availabilityAfterSync = this.getDepositAvailability();
            if (!availabilityAfterSync.ok) {
                CryptoZoo.ui?.showToast?.(
                    availabilityAfterSync.reason || this.t("activeDepositExists", "Masz już aktywny deposit")
                );
                this.refreshSettingsModalData();
                return false;
            }

            const success = await CryptoZoo.depositUI.createDeposit(amount);

            if (success) {
                await CryptoZoo.api.syncPendingDeposits?.(false);
                await this.loadDepositsHistory();
                this.refreshSettingsModalData();
            }

            return success;
        } catch (e) {
            console.error("Create deposit error:", e);
            CryptoZoo.ui?.showToast?.(
                e.message || this.t("depositCreateError", "Błąd depozytu")
            );
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
                const grossReward = this.format(
                    w.grossRewardAmount ?? w.rewardAmount ?? w.amount
                );

                const feeReward = this.format(
                    w.feeRewardAmount ?? this.getWithdrawFeeAmount(grossReward)
                );

                const netReward = this.format(
                    w.netRewardAmount ?? this.getWithdrawNetReward(grossReward)
                );

                const status = String(w.status || "pending");

                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.t("grossValue", "Brutto")}: ${grossReward.toFixed(3)} reward • ${this.getWithdrawGrossUsdLabel(grossReward)}</div>
                        <div style="margin-top:4px;">${this.t("fee", "Fee")} 10%: ${feeReward.toFixed(3)} reward • ${this.getWithdrawFeeUsdLabel(grossReward)}</div>
                        <div style="margin-top:4px;">${this.t("netValue", "Netto")}: ${netReward.toFixed(3)} reward • ${this.getWithdrawNetUsdLabel(grossReward)}</div>
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
            this.depositsHistory = Array.isArray(list)
                ? list.map((item) => this.normalizeDepositItem(item))
                : [];
        } catch (e) {
            this.depositsHistory = [];
        }

        this.depositsHistoryLoading = false;
        this.renderDepositsHistory();
        this.refreshSettingsModalData();
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
            .map((rawDeposit) => {
                const d = this.normalizeDepositItem(rawDeposit);
                const gemsAmount = Math.max(0, Number(d.gemsAmount) || 0);
                const expeditionBoostAmount = Math.max(0, Number(d.expeditionBoostAmount) || 0);
                const boostPercent = Math.round(expeditionBoostAmount * 100);
                const durationMs = Math.max(0, Number(d.expeditionBoostDurationMs) || 0);
                const durationDays =
                    durationMs > 0
                        ? Math.max(1, Math.round(durationMs / (24 * 60 * 60 * 1000)))
                        : 0;

                const isActive = this.isDepositActive(d);
                const isExpired = this.isDepositExpired(d);
                const statusLabel = isActive
                    ? this.t("activeDeposit", "Aktywny deposit")
                    : isExpired && this.isPendingDepositStatus(d.status)
                      ? this.t("expired", "expired")
                      : d.status;

                const remainingMs = isActive
                    ? Math.max(0, Number(d.expiresAt || 0) - Date.now())
                    : 0;

                return `
                    <div style="padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:8px;">
                        <div>${this.format(d.amount).toFixed(3)} TON</div>
                        ${gemsAmount > 0 ? `<div style="margin-top:4px;">+${CryptoZoo.formatNumber(gemsAmount)} gem</div>` : ``}
                        ${boostPercent > 0 ? `<div style="margin-top:4px;">+${boostPercent}% ${this.t("expeditionBoost", "boost ekspedycji")}</div>` : ``}
                        ${durationDays > 0 ? `<div style="margin-top:4px;">${this.formatDaysLabel(durationDays)}</div>` : ``}
                        ${d.paymentComment ? `<div style="margin-top:4px;">${this.t("paymentComment", "Komentarz płatności")}: ${d.paymentComment}</div>` : ``}
                        ${remainingMs > 0 ? `<div style="margin-top:4px;">${this.t("timeLeft", "Pozostało")}: ${this.formatTimeLeftMs(remainingMs)}</div>` : ``}
                        <div style="margin-top:4px;">${statusLabel}</div>
                    </div>
                `;
            })
            .join("");
    },

    toggleFinanceSection(forceValue = null) {
        this.financeSectionOpen =
            typeof forceValue === "boolean" ? forceValue : !this.financeSectionOpen;

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
            btn.setAttribute(
                "aria-expanded",
                this.financeSectionOpen ? "true" : "false"
            );
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
            CryptoZoo.api?.syncPendingDeposits?.(false),
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
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiSettings = {
    storageKey: "cryptozoo_settings",
    financeSectionOpen: false,
    tonWalletAddress: "",
    tonWalletLoading: false,
    tonWalletSaving: false,

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
                console.error("Language sync error:", error);
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

    formatReward(value) {
        return Number((Number(value) || 0).toFixed(3)).toFixed(3);
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

    getCurrentTonWalletAddress() {
        const stateWallet = String(CryptoZoo.state?.tonAddress || "").trim();
        const localWallet = String(this.tonWalletAddress || "").trim();
        return localWallet || stateWallet || "";
    },

    getPlayerPayload() {
        const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;

        const telegramId = String(
            tg?.id ||
            CryptoZoo.state?.telegramUser?.id ||
            CryptoZoo.state?.telegramId ||
            CryptoZoo.state?.playerId ||
            ""
        ).trim();

        return {
            telegramId,
            username: tg?.username || tg?.first_name || CryptoZoo.state?.username || "Gracz"
        };
    },

    getApiBase() {
        const raw = String(
            CryptoZoo.config?.apiBase ||
            CryptoZoo.api?.getApiBase?.() ||
            "/api"
        ).trim();

        return raw.replace(/\/+$/, "");
    },

    getWithdrawWalletGetUrl(telegramId) {
        return `${this.getApiBase()}/withdraw/wallet/${encodeURIComponent(String(telegramId || "").trim())}`;
    },

    getWithdrawWalletSetUrl() {
        return `${this.getApiBase()}/withdraw/set-wallet`;
    },

    async loadTonWallet() {
        const payload = this.getPlayerPayload();

        if (!payload.telegramId) {
            return "";
        }

        this.tonWalletLoading = true;
        this.renderTonWalletSection();

        try {
            const response = await fetch(this.getWithdrawWalletGetUrl(payload.telegramId), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || "Nie udało się pobrać TON wallet");
            }

            this.tonWalletAddress = String(data?.tonAddress || "").trim();

            CryptoZoo.state = CryptoZoo.state || {};
            CryptoZoo.state.tonAddress = this.tonWalletAddress;

            const input = document.getElementById("settingsTonWalletInput");
            if (input && document.activeElement !== input) {
                input.value = this.tonWalletAddress;
            }

            return this.tonWalletAddress;
        } catch (error) {
            console.error("Load TON wallet error:", error);
            return "";
        } finally {
            this.tonWalletLoading = false;
            this.renderTonWalletSection();
            this.refreshSettingsModalData();
        }
    },

    async saveTonWallet() {
        if (this.tonWalletSaving) return false;

        const payload = this.getPlayerPayload();
        const input = document.getElementById("settingsTonWalletInput");
        const tonAddress = String(input?.value || this.tonWalletAddress || "").trim();

        if (!payload.telegramId) {
            CryptoZoo.ui?.showToast?.("Brak telegramId");
            return false;
        }

        if (!tonAddress) {
            CryptoZoo.ui?.showToast?.("Wpisz adres TON wallet");
            return false;
        }

        this.tonWalletSaving = true;
        this.renderTonWalletSection();

        try {
            const response = await fetch(this.getWithdrawWalletSetUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telegramId: payload.telegramId,
                    username: payload.username,
                    tonAddress
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || "Nie udało się zapisać TON wallet");
            }

            this.tonWalletAddress = String(data?.tonAddress || tonAddress).trim();

            CryptoZoo.state = CryptoZoo.state || {};
            CryptoZoo.state.tonAddress = this.tonWalletAddress;

            if (input) {
                input.value = this.tonWalletAddress;
            }

            CryptoZoo.ui?.showToast?.("TON wallet zapisany");
            this.refreshSettingsModalData();
            return true;
        } catch (error) {
            console.error("Save TON wallet error:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Błąd zapisu TON wallet");
            return false;
        } finally {
            this.tonWalletSaving = false;
            this.renderTonWalletSection();
        }
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
            CryptoZoo.ui?.showToast?.("Brak Reward do transferu");
            return false;
        }

        try {
            if (!CryptoZoo.api?.transferRewardToWallet) {
                throw new Error("transferRewardToWallet not available");
            }

            const response = await CryptoZoo.api.transferRewardToWallet();
            const transferredAmount = Number(response?.transferredAmount || rewardBalance);

            CryptoZoo.ui?.showToast?.(`Przeniesiono do wallet: ${transferredAmount.toFixed(3)}`);
            this.refreshSettingsModalData();
            CryptoZoo.ui?.render?.();

            return true;
        } catch (error) {
            console.error("Transfer reward->wallet failed:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Błąd transferu");
            return false;
        }
    },

    async requestWithdraw() {
        try {
            const rewardWallet = this.getRewardWallet();

            if (!this.getCurrentTonWalletAddress()) {
                CryptoZoo.ui?.showToast?.("Najpierw ustaw adres TON wallet");
                return false;
            }

            if (rewardWallet < 20) {
                CryptoZoo.ui?.showToast?.("Min withdraw 20");
                return false;
            }

            if (!CryptoZoo.api?.createWithdrawRequest) {
                throw new Error("createWithdrawRequest not available");
            }

            await CryptoZoo.api.createWithdrawRequest(rewardWallet);

            CryptoZoo.ui?.showToast?.("Withdraw utworzony");
            this.refreshSettingsModalData();
            CryptoZoo.ui?.render?.();

            return true;
        } catch (error) {
            console.error("Withdraw request failed:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Błąd withdraw");
            return false;
        }
    },

    async createDeposit() {
        try {
            if (!CryptoZoo.depositUI?.createDeposit) {
                throw new Error("Deposit UI not loaded");
            }

            const selectedEl = document.querySelector("#settingsDepositAmountOptions .deposit-option.active");
            const amount = Number(selectedEl?.dataset?.amount || 1);

            const success = await CryptoZoo.depositUI.createDeposit(amount);
            if (success) {
                this.refreshSettingsModalData();
            }

            return success;
        } catch (error) {
            console.error("Create deposit error:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Błąd depozytu");
            return false;
        }
    },

    renderDepositAmountOptions() {
        const wrap = document.getElementById("settingsDepositAmountOptions");
        if (!wrap) return;

        const amounts = [1, 3, 5, 10];
        let selectedAmount = Number(CryptoZoo.depositBind?.selectedAmount || 1);
        if (!amounts.includes(selectedAmount)) {
            selectedAmount = 1;
        }

        wrap.innerHTML = amounts.map((amount) => {
            const active = amount === selectedAmount;

            return `
                <button
                    type="button"
                    class="deposit-option${active ? " active" : ""}"
                    data-amount="${amount}"
                    style="
                        min-width:110px;
                        padding:12px 14px;
                        border-radius:14px;
                        border:${active ? "2px solid rgba(255,210,60,0.95)" : "1px solid rgba(255,255,255,0.14)"};
                        background:${active ? "linear-gradient(180deg, rgba(255,210,60,0.20) 0%, rgba(255,185,0,0.10) 100%)" : "rgba(255,255,255,0.04)"};
                        color:#fff;
                        font-weight:900;
                    "
                >
                    ${amount} TON
                </button>
            `;
        }).join("");

        wrap.querySelectorAll(".deposit-option").forEach((btn) => {
            btn.addEventListener("click", () => {
                const amount = Number(btn.dataset.amount || 1);

                CryptoZoo.depositBind = CryptoZoo.depositBind || {};
                CryptoZoo.depositBind.selectedAmount = amount;

                this.renderDepositAmountOptions();

                const depositBtn = document.getElementById("settingsCreateDepositBtn");
                if (depositBtn) {
                    depositBtn.textContent = `Create Deposit (${amount} TON)`;
                }
            });
        });
    },

    renderTonWalletSection() {
        const financeContent = document.getElementById("settingsFinanceContent");
        if (!financeContent) return;

        let section = document.getElementById("settingsTonWalletSection");

        if (!section) {
            section = document.createElement("div");
            section.id = "settingsTonWalletSection";
            section.className = "profile-boost-row";
            section.style.marginTop = "12px";

            const withdrawHistoryRow = document.getElementById("settingsWithdrawHistoryList")?.closest(".profile-boost-row");
            if (withdrawHistoryRow) {
                financeContent.insertBefore(section, withdrawHistoryRow);
            } else {
                financeContent.appendChild(section);
            }
        }

        const currentWallet = this.getCurrentTonWalletAddress();
        const buttonLabel = this.tonWalletSaving
            ? "Zapisywanie..."
            : "Zapisz TON wallet";

        section.innerHTML = `
            <div class="profile-boost-left" style="width:100%;">
                <div class="profile-boost-label">TON wallet do wypłat</div>

                <div style="margin-top:10px;">
                    <input
                        id="settingsTonWalletInput"
                        type="text"
                        inputmode="text"
                        autocomplete="off"
                        spellcheck="false"
                        placeholder="Wpisz adres TON wallet"
                        value="${currentWallet.replace(/"/g, "&quot;")}"
                        style="
                            width:100%;
                            min-height:48px;
                            padding:12px 14px;
                            border-radius:14px;
                            border:1px solid rgba(255,255,255,0.12);
                            background:rgba(255,255,255,0.04);
                            color:#ffffff;
                            font-size:14px;
                            font-weight:700;
                            box-sizing:border-box;
                            outline:none;
                        "
                    >
                </div>

                <div
                    style="
                        margin-top:8px;
                        padding:10px 12px;
                        border-radius:12px;
                        background:rgba(255,255,255,0.03);
                        border:1px solid rgba(255,255,255,0.08);
                        color:rgba(255,255,255,0.76);
                        font-size:12px;
                        line-height:1.45;
                        word-break:break-all;
                    "
                >${currentWallet || "Brak zapisanego adresu TON wallet"}</div>

                <button
                    id="settingsSaveTonWalletBtn"
                    class="profile-close-btn"
                    type="button"
                    style="margin-top:10px;"
                    ${this.tonWalletSaving ? "disabled" : ""}
                >${buttonLabel}</button>
            </div>
        `;

        const saveBtn = document.getElementById("settingsSaveTonWalletBtn");
        if (saveBtn && !saveBtn.dataset.bound) {
            saveBtn.dataset.bound = "1";
            saveBtn.addEventListener("click", () => {
                CryptoZoo.audio?.play?.("click");
                this.saveTonWallet();
            });
        }
    },

    refreshSettingsModalData() {
        const settings = this.getSettings();

        const languageEl = document.getElementById("settingsLanguageValue");
        if (languageEl) {
            languageEl.textContent = this.getLanguageLabel(settings.language);
        }

        const soundEl = document.getElementById("settingsSoundValue");
        if (soundEl) {
            soundEl.textContent = this.getSoundLabel(settings.sound);
        }

        const rewardBalance = this.getRewardBalance();
        const rewardWallet = this.getRewardWallet();
        const withdrawPending = this.getWithdrawPending();

        const rewardBalanceEl = document.getElementById("settingsRewardBalance");
        if (rewardBalanceEl) {
            rewardBalanceEl.textContent = this.formatReward(rewardBalance);
        }

        const rewardWalletEl = document.getElementById("settingsRewardWallet");
        if (rewardWalletEl) {
            rewardWalletEl.textContent = this.formatReward(rewardWallet);
        }

        const withdrawPendingEl = document.getElementById("settingsWithdrawPending");
        if (withdrawPendingEl) {
            withdrawPendingEl.textContent = this.formatReward(withdrawPending);
        }

        const transferBtn = document.getElementById("settingsTransferRewardBtn");
        if (transferBtn) {
            const canTransfer = rewardBalance > 0;
            transferBtn.disabled = !canTransfer;
            transferBtn.style.opacity = canTransfer ? "1" : "0.5";
            transferBtn.textContent = canTransfer
                ? `Przenieś do wallet (${this.formatReward(rewardBalance)})`
                : "Brak Reward do transferu";
        }

        const withdrawBtn = document.getElementById("settingsRequestWithdrawBtn");
        if (withdrawBtn) {
            const hasWallet = !!this.getCurrentTonWalletAddress();
            const canWithdraw = hasWallet && rewardWallet >= 20 && withdrawPending <= 0;

            withdrawBtn.disabled = !canWithdraw;
            withdrawBtn.style.opacity = canWithdraw ? "1" : "0.5";

            if (!hasWallet) {
                withdrawBtn.textContent = "Ustaw TON wallet";
            } else if (rewardWallet < 20) {
                withdrawBtn.textContent = "Min withdraw 20";
            } else if (withdrawPending > 0) {
                withdrawBtn.textContent = "Masz aktywny withdraw";
            } else {
                withdrawBtn.textContent = `Withdraw Request (${this.formatReward(rewardWallet)})`;
            }
        }

        const depositBtn = document.getElementById("settingsCreateDepositBtn");
        if (depositBtn) {
            const selectedAmount = Number(CryptoZoo.depositBind?.selectedAmount || 1);
            depositBtn.textContent = `Create Deposit (${selectedAmount} TON)`;
        }

        this.renderDepositAmountOptions();
        this.renderFinanceSectionToggle();
        this.renderTonWalletSection();
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

        this.loadTonWallet().catch(() => {});
    },

    closeSettingsModal() {
        const modal = document.getElementById("settingsModal");
        if (modal) {
            modal.classList.add("hidden");
        }

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

                if (!this.getCurrentTonWalletAddress()) {
                    const input = document.getElementById("settingsTonWalletInput");
                    if (input) {
                        input.focus();
                    }
                    CryptoZoo.ui?.showToast?.("Najpierw ustaw TON wallet");
                    return;
                }

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
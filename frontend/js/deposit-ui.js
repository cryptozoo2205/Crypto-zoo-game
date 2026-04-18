window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    currentDepositData: null,
    isCreatingDeposit: false,
    isOpeningWallet: false,
    isVerifyingDeposit: false,
    verifyIntervalId: null,
    verifyTimeoutId: null,
    resumeEventsBound: false,

    tonConnectUI: null,
    tonWalletAddress: "",
    tonConnectInitialized: false,
    tonConnectInitInProgress: false,

    getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    },

    toNanoString(amount) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return String(Math.round(safeAmount * 1000000000));
    },

    formatTonAmount(amount, decimals = 6) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return safeAmount.toFixed(decimals).replace(/\.?0+$/, (match) => {
            return match.startsWith(".") ? "" : match;
        });
    },

    stopEvent(event) {
        if (!event) return;
        event.preventDefault?.();
        event.stopPropagation?.();
    },

    getDepositBonusMeta(amount, payment = {}, deposit = {}) {
        const safeAmount = Math.max(
            0,
            Number(payment?.baseAmount ?? deposit?.baseAmount ?? amount) || 0
        );

        const gemsAmount = Math.max(
            0,
            Number(payment?.gemsAmount ?? deposit?.gemsAmount) || 0
        );

        const expeditionBoostAmount = Math.max(
            0,
            Number(payment?.expeditionBoostAmount ?? deposit?.expeditionBoostAmount) || 0
        );

        const boostPercent = Math.round(expeditionBoostAmount * 100);

        const durationMsRaw = Math.max(
            0,
            Number(payment?.expeditionBoostDurationMs ?? deposit?.expeditionBoostDurationMs) || 0
        );

        let durationDays = 0;

        if (durationMsRaw > 0) {
            durationDays = Math.max(1, Math.round(durationMsRaw / (24 * 60 * 60 * 1000)));
        } else {
            if (safeAmount >= 10) durationDays = 7;
            else if (safeAmount >= 5) durationDays = 5;
            else if (safeAmount >= 3) durationDays = 3;
            else if (safeAmount >= 1) durationDays = 1;
        }

        return {
            gemsAmount,
            boostPercent,
            durationDays
        };
    },

    formatBonusText(meta) {
        const gems = Math.max(0, Number(meta?.gemsAmount) || 0);
        const boostPercent = Math.max(0, Number(meta?.boostPercent) || 0);
        const durationDays = Math.max(0, Number(meta?.durationDays) || 0);

        const parts = [];

        if (gems > 0) {
            parts.push(`+${CryptoZoo.formatNumber(gems)} gem`);
        }

        if (boostPercent > 0) {
            parts.push(`+${CryptoZoo.formatNumber(boostPercent)}% boost ekspedycji`);
        }

        if (durationDays > 0) {
            parts.push(durationDays === 1 ? "1 dzień" : `${durationDays} dni`);
        }

        return parts.join(" • ");
    },

    async copy(text, label = "Skopiowano") {
        const safeText = String(text || "").trim();

        if (!safeText) {
            CryptoZoo.ui?.showToast?.("Brak danych do skopiowania");
            return false;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(safeText);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = safeText;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                textarea.remove();
            }

            CryptoZoo.ui?.showToast?.(label);
            return true;
        } catch (error) {
            console.error("Copy failed:", error);
            CryptoZoo.ui?.showToast?.("Nie udało się skopiować");
            return false;
        }
    },

    getManifestUrl() {
        const origin = String(window.location?.origin || "").replace(/\/+$/, "");
        return `${origin}/tonconnect-manifest.json`;
    },

    getTonConnectButtonEl() {
        return document.getElementById("tonConnectButton");
    },

    getTonConnectStatusEl() {
        return document.getElementById("tonConnectStatus");
    },

    getPayWithTonBtn() {
        return document.getElementById("settingsPayWithTonBtn");
    },

    getTonConnectUiClass() {
        return window.TON_CONNECT_UI?.TonConnectUI || window.TonConnectUI || null;
    },

    canInitTonConnect() {
        const TonConnectUIClass = this.getTonConnectUiClass();
        const buttonEl = this.getTonConnectButtonEl();
        return !!TonConnectUIClass && !!buttonEl;
    },

    shortenAddress(address) {
        const safe = String(address || "").trim();
        if (safe.length <= 14) return safe;
        return `${safe.slice(0, 6)}...${safe.slice(-6)}`;
    },

    isWalletConnected() {
        return !!(this.tonConnectUI?.wallet?.account?.address || this.tonWalletAddress);
    },

    updateTonConnectUi() {
        const statusEl = this.getTonConnectStatusEl();
        const payBtn = this.getPayWithTonBtn();

        const connectedAddress =
            String(this.tonConnectUI?.wallet?.account?.address || this.tonWalletAddress || "").trim();

        if (connectedAddress) {
            this.tonWalletAddress = connectedAddress;
        }

        if (statusEl) {
            statusEl.textContent = connectedAddress
                ? `Connected: ${this.shortenAddress(connectedAddress)}`
                : "Wallet not connected";
        }

        if (payBtn) {
            const canPay = this.isWalletConnected() && !!this.currentDepositData && !this.isOpeningWallet;
            payBtn.disabled = !canPay;
            payBtn.textContent = this.isOpeningWallet ? "Processing..." : "Pay with TON";
        }
    },

    async initTonConnect() {
        if (this.tonConnectInitialized && this.tonConnectUI) {
            this.updateTonConnectUi();
            return true;
        }

        if (this.tonConnectInitInProgress) {
            return !!this.tonConnectUI;
        }

        this.tonConnectInitInProgress = true;

        try {
            const TonConnectUIClass = this.getTonConnectUiClass();
            const buttonEl = this.getTonConnectButtonEl();

            if (!TonConnectUIClass) {
                console.warn("TonConnect UI SDK not found");
                this.tonConnectInitialized = false;
                this.updateTonConnectUi();
                return false;
            }

            if (!buttonEl) {
                console.warn("TonConnect button root not found");
                this.tonConnectInitialized = false;
                this.updateTonConnectUi();
                return false;
            }

            if (!this.tonConnectUI) {
                this.tonConnectUI = new TonConnectUIClass({
                    manifestUrl: this.getManifestUrl(),
                    buttonRootId: "tonConnectButton"
                });

                if (typeof this.tonConnectUI.onStatusChange === "function") {
                    this.tonConnectUI.onStatusChange((wallet) => {
                        this.tonWalletAddress = String(wallet?.account?.address || "").trim();
                        this.updateTonConnectUi();
                    });
                }
            }

            this.tonWalletAddress = String(this.tonConnectUI?.wallet?.account?.address || "").trim();
            this.tonConnectInitialized = true;
            this.updateTonConnectUi();
            return true;
        } catch (error) {
            console.error("TonConnect init error:", error);
            this.tonConnectInitialized = false;
            this.tonConnectUI = null;
            this.updateTonConnectUi();
            return false;
        } finally {
            this.tonConnectInitInProgress = false;
        }
    },

    ensureModal() {
        let modal = document.getElementById("depositPaymentModal");

        if (modal) {
            return modal;
        }

        modal = document.createElement("div");
        modal.id = "depositPaymentModal";
        modal.className = "profile-modal hidden";
        modal.style.zIndex = "10020";
        modal.innerHTML = `
            <div class="profile-backdrop" id="depositPaymentBackdrop"></div>

            <div id="depositPaymentCard" class="profile-card" style="max-width:520px;">
                <div class="profile-header">
                    <div class="profile-avatar">💰</div>

                    <div class="profile-user-meta">
                        <div class="profile-name">Deposit TON</div>
                        <div class="profile-subtitle">Wyślij dokładną kwotę na podany adres</div>
                    </div>
                </div>

                <div class="profile-boost-row">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Kwota do wysłania</div>
                        <div
                            id="depositPaymentAmount"
                            class="profile-boost-value"
                            style="margin-top:6px; word-break:break-word;"
                        >-</div>
                        <button id="depositCopyAmountBtn" class="profile-close-btn" type="button" style="margin-top:10px;">
                            Kopiuj kwotę
                        </button>
                    </div>
                </div>

                <div class="profile-boost-row" style="margin-top:12px;">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Wybrany pakiet</div>
                        <div
                            id="depositPaymentBaseAmount"
                            class="profile-boost-value"
                            style="margin-top:6px; word-break:break-word; font-size:13px; line-height:1.5;"
                        >-</div>
                    </div>
                </div>

                <div class="profile-boost-row" style="margin-top:12px;">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Bonus depozytu</div>
                        <div
                            id="depositPaymentBonus"
                            class="profile-boost-value"
                            style="margin-top:6px; word-break:break-word; font-size:13px; line-height:1.5;"
                        >-</div>
                    </div>
                </div>

                <div class="profile-boost-row" style="margin-top:12px;">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Adres odbiorcy</div>
                        <div
                            id="depositPaymentAddress"
                            class="profile-boost-value"
                            style="margin-top:6px; word-break:break-all; font-size:13px; line-height:1.5;"
                        >-</div>
                        <button id="depositCopyAddressBtn" class="profile-close-btn" type="button" style="margin-top:10px;">
                            Kopiuj adres
                        </button>
                    </div>
                </div>

                <div class="profile-boost-row" style="margin-top:12px;">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Płatność</div>
                        <div class="profile-boost-value" style="margin-top:6px; font-size:13px; line-height:1.5;">
                            Wyślij dokładnie podaną kwotę. System automatycznie wykryje wpłatę i doda bonus po potwierdzeniu.
                        </div>
                    </div>
                </div>

                <button id="depositCopyAllBtn" class="profile-close-btn" type="button" style="margin-top:12px;">
                    Kopiuj dane płatności
                </button>

                <button id="depositOpenWalletBtn" class="profile-close-btn" type="button">
                    Zapłać TON
                </button>

                <button id="depositVerifyBtn" class="profile-close-btn" type="button">
                    Sprawdź wpłatę
                </button>

                <button id="depositCloseBtn" class="profile-close-btn" type="button">
                    Zamknij
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        this.bindModalEvents();

        return modal;
    },

    bindModalEvents() {
        const modal = document.getElementById("depositPaymentModal");
        const backdrop = document.getElementById("depositPaymentBackdrop");
        const card = document.getElementById("depositPaymentCard");
        const closeBtn = document.getElementById("depositCloseBtn");
        const copyAmountBtn = document.getElementById("depositCopyAmountBtn");
        const copyAddressBtn = document.getElementById("depositCopyAddressBtn");
        const copyAllBtn = document.getElementById("depositCopyAllBtn");
        const openWalletBtn = document.getElementById("depositOpenWalletBtn");
        const verifyBtn = document.getElementById("depositVerifyBtn");
        const payBtn = this.getPayWithTonBtn();

        if (modal && !modal.dataset.boundModal) {
            modal.dataset.boundModal = "1";

            ["click", "touchstart", "touchend", "pointerdown", "pointerup"].forEach((eventName) => {
                modal.addEventListener(eventName, (event) => {
                    event.stopPropagation?.();
                });
            });
        }

        if (card && !card.dataset.boundCard) {
            card.dataset.boundCard = "1";

            ["click", "touchstart", "touchend", "pointerdown", "pointerup"].forEach((eventName) => {
                card.addEventListener(eventName, (event) => {
                    event.stopPropagation?.();
                });
            });
        }

        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";

            const closeFromBackdrop = (event) => {
                this.stopEvent(event);
                this.closeDepositModal();
            };

            backdrop.addEventListener("click", closeFromBackdrop);
            backdrop.addEventListener("touchstart", closeFromBackdrop, { passive: false });
        }

        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.addEventListener("click", (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                this.closeDepositModal();
            });
        }

        if (copyAmountBtn && !copyAmountBtn.dataset.bound) {
            copyAmountBtn.dataset.bound = "1";
            copyAmountBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                const amount = this.formatTonAmount(
                    this.currentDepositData?.expectedAmount ?? this.currentDepositData?.amount ?? 0,
                    6
                );
                await this.copy(`${amount} TON`, "Skopiowano kwotę");
            });
        }

        if (copyAddressBtn && !copyAddressBtn.dataset.bound) {
            copyAddressBtn.dataset.bound = "1";
            copyAddressBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.copy(this.currentDepositData?.address || "", "Skopiowano adres");
            });
        }

        if (copyAllBtn && !copyAllBtn.dataset.bound) {
            copyAllBtn.dataset.bound = "1";
            copyAllBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");

                const address = this.currentDepositData?.address || "";
                const amount = this.formatTonAmount(
                    this.currentDepositData?.expectedAmount ?? this.currentDepositData?.amount ?? 0,
                    6
                );
                const baseAmount = this.formatTonAmount(this.currentDepositData?.baseAmount || 0, 3);
                const bonusText = String(this.currentDepositData?.bonusText || "").trim();

                const fullText = [
                    `AMOUNT: ${amount} TON`,
                    `PACKAGE: ${baseAmount} TON`,
                    `ADDRESS: ${address}`,
                    bonusText ? `BONUS: ${bonusText}` : ""
                ].filter(Boolean).join("\n");

                await this.copy(fullText, "Skopiowano dane płatności");
            });
        }

        if (openWalletBtn && !openWalletBtn.dataset.bound) {
            openWalletBtn.dataset.bound = "1";
            openWalletBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.openWallet();
            });
        }

        if (verifyBtn && !verifyBtn.dataset.bound) {
            verifyBtn.dataset.bound = "1";
            verifyBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.verifyCurrentDeposit(false);
            });
        }

        if (payBtn && !payBtn.dataset.bound) {
            payBtn.dataset.bound = "1";
            payBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.openWallet();
            });
        }
    },

    fillModalData() {
        const amountEl = document.getElementById("depositPaymentAmount");
        const baseAmountEl = document.getElementById("depositPaymentBaseAmount");
        const bonusEl = document.getElementById("depositPaymentBonus");
        const addressEl = document.getElementById("depositPaymentAddress");

        const amount = Number(this.currentDepositData?.expectedAmount ?? this.currentDepositData?.amount ?? 0);
        const baseAmount = Number(this.currentDepositData?.baseAmount || 0);
        const address = String(this.currentDepositData?.address || "");
        const bonusText = String(this.currentDepositData?.bonusText || "").trim();

        if (amountEl) {
            amountEl.textContent = `${this.formatTonAmount(amount, 6)} TON`;
        }

        if (baseAmountEl) {
            baseAmountEl.textContent = `${this.formatTonAmount(baseAmount, 3)} TON`;
        }

        if (bonusEl) {
            bonusEl.textContent = bonusText || "-";
        }

        if (addressEl) {
            addressEl.textContent = address || "-";
        }
    },

    async showDepositModal() {
        const modal = this.ensureModal();
        this.fillModalData();
        modal.classList.remove("hidden");
        await this.initTonConnect();
        this.updateTonConnectUi();
    },

    closeDepositModal() {
        document.getElementById("depositPaymentModal")?.classList.add("hidden");
    },

    bindResumeEvents() {
        if (this.resumeEventsBound) {
            return;
        }

        this.resumeEventsBound = true;

        window.addEventListener("focus", () => {
            this.verifyCurrentDeposit(true);
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.verifyCurrentDeposit(true);
            }
        });
    },

    stopVerifyWatcher() {
        if (this.verifyIntervalId) {
            clearInterval(this.verifyIntervalId);
            this.verifyIntervalId = null;
        }

        if (this.verifyTimeoutId) {
            clearTimeout(this.verifyTimeoutId);
            this.verifyTimeoutId = null;
        }
    },

    startVerifyWatcher() {
        this.stopVerifyWatcher();
        this.bindResumeEvents();

        this.verifyIntervalId = setInterval(() => {
            this.verifyCurrentDeposit(true);
        }, 5000);

        this.verifyTimeoutId = setTimeout(() => {
            this.stopVerifyWatcher();
        }, 120000);
    },

    async refreshPlayerAndUi(successMessage = "") {
        try {
            await CryptoZoo.api?.loadPlayer?.();
        } catch (error) {
            console.warn("Player reload after deposit failed:", error);
        }

        CryptoZoo.ui?.render?.();
        CryptoZoo.uiSettings?.refreshSettingsModalData?.();

        if (successMessage) {
            CryptoZoo.ui?.showToast?.(successMessage);
        }
    },

    async verifyCurrentDeposit(silent = true) {
        if (this.isVerifyingDeposit) {
            return false;
        }

        if (!CryptoZoo.api?.verifyDepositById && !CryptoZoo.api?.verifyPendingDepositsForPlayer) {
            return false;
        }

        this.isVerifyingDeposit = true;

        try {
            let result = null;
            const depositId = String(this.currentDepositData?.depositId || "").trim();

            if (depositId && CryptoZoo.api?.verifyDepositById) {
                result = await CryptoZoo.api.verifyDepositById(depositId);
            } else if (CryptoZoo.api?.verifyPendingDepositsForPlayer) {
                result = await CryptoZoo.api.verifyPendingDepositsForPlayer();
            }

            const deposit = result?.deposit || null;
            const matched = !!result?.matched;
            const expired = !!result?.expired;
            const alreadyProcessed = !!result?.alreadyProcessed;
            const approved =
                String(deposit?.status || "").toLowerCase() === "approved" ||
                matched;

            if (approved || alreadyProcessed) {
                this.stopVerifyWatcher();
                await this.refreshPlayerAndUi("✅ Depozyt zatwierdzony, bonus dodany");
                this.closeDepositModal();
                this.currentDepositData = null;
                this.updateTonConnectUi();
                return true;
            }

            if (expired) {
                this.stopVerifyWatcher();
                if (!silent) {
                    CryptoZoo.ui?.showToast?.("Ten depozyt wygasł");
                }
                return false;
            }

            if (!silent) {
                CryptoZoo.ui?.showToast?.("Wpłata jeszcze niepotwierdzona");
            }

            return false;
        } catch (error) {
            console.error("Verify deposit error:", error);

            if (!silent) {
                CryptoZoo.ui?.showToast?.(error.message || "Nie udało się sprawdzić wpłaty");
            }

            return false;
        } finally {
            this.isVerifyingDeposit = false;
        }
    },

    async openWallet() {
        if (this.isOpeningWallet) {
            return false;
        }

        this.isOpeningWallet = true;
        this.updateTonConnectUi();

        try {
            await this.initTonConnect();

            if (!this.tonConnectUI) {
                throw new Error("TonConnect not initialized");
            }

            if (!this.isWalletConnected()) {
                await this.tonConnectUI.openModal();
                this.updateTonConnectUi();

                if (!this.isWalletConnected()) {
                    throw new Error("Najpierw podłącz wallet");
                }
            }

            const address = String(this.currentDepositData?.address || "").trim();
            const amount = Number(this.currentDepositData?.expectedAmount ?? this.currentDepositData?.amount ?? 0);

            if (!address || amount <= 0) {
                throw new Error("Brak danych płatności");
            }

            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address,
                        amount: this.toNanoString(amount)
                    }
                ]
            };

            this.startVerifyWatcher();
            await this.tonConnectUI.sendTransaction(tx);

            CryptoZoo.ui?.showToast?.("Transakcja wysłana. System sprawdza wpłatę...");
            return true;
        } catch (error) {
            console.error("TON payment error:", error);
            CryptoZoo.ui?.showToast?.(error?.message || "Nie udało się otworzyć płatności");
            return false;
        } finally {
            this.isOpeningWallet = false;
            this.updateTonConnectUi();
        }
    },

    async createDeposit(amount) {
        if (this.isCreatingDeposit) {
            return false;
        }

        this.isCreatingDeposit = true;

        try {
            const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

            if (safeAmount <= 0) {
                throw new Error("Invalid deposit amount");
            }

            if (!CryptoZoo.api?.createDepositWithPayment) {
                throw new Error("createDepositWithPayment not available");
            }

            const result = await CryptoZoo.api.createDepositWithPayment(safeAmount);
            const deposit = result?.deposit || null;
            const payment = result?.payment || null;

            if (!deposit || !payment) {
                throw new Error("Deposit payment data missing");
            }

            const receiverAddress = String(
                payment.receiverAddress ||
                payment.address ||
                payment.walletAddress ||
                deposit.receiverAddress ||
                deposit.walletAddress ||
                ""
            ).trim();

            const paymentAmount = Number(
                payment.expectedAmount ??
                deposit.expectedAmount ??
                payment.amount ??
                deposit.amount ??
                safeAmount
            ) || safeAmount;

            const baseAmount = Number(
                payment.baseAmount ??
                deposit.baseAmount ??
                safeAmount
            ) || safeAmount;

            const uniqueFraction = Number(
                payment.uniqueFraction ??
                deposit.uniqueFraction ??
                0
            ) || 0;

            if (!receiverAddress) {
                throw new Error("Missing TON receiver address");
            }

            const bonusMeta = this.getDepositBonusMeta(baseAmount, payment, deposit);
            const bonusText = this.formatBonusText(bonusMeta);

            this.currentDepositData = {
                depositId: String(deposit.depositId || deposit.id || payment.depositId || ""),
                address: receiverAddress,
                amount: paymentAmount,
                baseAmount,
                expectedAmount: paymentAmount,
                uniqueFraction,
                bonusText
            };

            this.bindResumeEvents();
            await this.showDepositModal();
            this.updateTonConnectUi();

            const toastMessage = bonusText
                ? `Deposit ${this.formatTonAmount(paymentAmount, 6)} TON utworzony • ${bonusText}`
                : `Deposit ${this.formatTonAmount(paymentAmount, 6)} TON utworzony`;

            CryptoZoo.ui?.showToast?.(toastMessage);

            return {
                ok: true,
                deposit,
                payment
            };
        } catch (error) {
            console.error("Create deposit error:", error);
            CryptoZoo.ui?.showToast?.(error.message || "Deposit error");
            return false;
        } finally {
            this.isCreatingDeposit = false;
        }
    },

    async createAndPaySelectedDeposit() {
        const selectedAmount =
            Number(CryptoZoo.uiDeposit?.selectedAmount) ||
            Number(CryptoZoo.uiSettings?.selectedDepositAmount) ||
            1;

        const created = await this.createDeposit(selectedAmount);

        if (!created) {
            return false;
        }

        return this.openWallet();
    },

    async init() {
        this.bindResumeEvents();
        this.ensureModal();
        await this.initTonConnect();
        this.updateTonConnectUi();
    }
};
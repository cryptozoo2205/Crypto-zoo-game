window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    currentDepositData: null,
    isCreatingDeposit: false,
    isVerifyingDeposit: false,
    verifyIntervalId: null,
    verifyTimeoutId: null,
    resumeEventsBound: false,

    getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    },

    formatTonAmount(amount, decimals = 6) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return safeAmount.toFixed(decimals).replace(/\.?0+$/, (match) => {
            return match.startsWith(".") ? "" : match;
        });
    },

    formatUsdAmount(amount, decimals = 2) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return safeAmount.toFixed(decimals).replace(/\.?0+$/, (match) => {
            return match.startsWith(".") ? "" : match;
        });
    },

    formatDurationFromMs(durationMs) {
        const safeMs = Math.max(0, Number(durationMs) || 0);
        const totalHours = Math.max(0, Math.floor(safeMs / (60 * 60 * 1000)));

        if (totalHours <= 0) {
            return "0h";
        }

        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;

        if (days <= 0) {
            return `${totalHours}h`;
        }

        if (hours <= 0) {
            return days === 1 ? "1 dzień" : `${days} dni`;
        }

        return `${days === 1 ? "1 dzień" : `${days} dni`} ${hours}h`;
    },

    stopEvent(event) {
        if (!event) return;
        event.preventDefault?.();
        event.stopPropagation?.();
    },

    getDepositBonusMeta(amountUsd, payment = {}, deposit = {}) {
        const safeAmountUsd = Math.max(
            0,
            Number(
                payment?.baseAmountUsd ??
                deposit?.baseAmountUsd ??
                payment?.baseAmount ??
                deposit?.baseAmount ??
                amountUsd
            ) || 0
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

        const durationMs = Math.max(
            0,
            Number(payment?.expeditionBoostDurationMs ?? deposit?.expeditionBoostDurationMs) || 0
        );

        return {
            amountUsd: safeAmountUsd,
            gemsAmount,
            boostPercent,
            durationMs
        };
    },

    formatBonusText(meta) {
        const gems = Math.max(0, Number(meta?.gemsAmount) || 0);
        const boostPercent = Math.max(0, Number(meta?.boostPercent) || 0);
        const durationMs = Math.max(0, Number(meta?.durationMs) || 0);

        const parts = [];

        if (gems > 0) {
            parts.push(`+${CryptoZoo.formatNumber(gems)} gem`);
        }

        if (boostPercent > 0) {
            parts.push(`+${CryptoZoo.formatNumber(boostPercent)}% boost ekspedycji`);
        }

        if (durationMs > 0) {
            parts.push(this.formatDurationFromMs(durationMs));
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
                        <div class="profile-boost-label">Kwota wpłaty</div>
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
                            Wyślij dokładnie podaną kwotę ze swojego portfela. System automatycznie wykryje wpłatę i doda bonus po potwierdzeniu. Działa tak samo na GitHub test mode i na VPS.
                        </div>
                    </div>
                </div>

                <button id="depositCopyAllBtn" class="profile-close-btn" type="button" style="margin-top:12px;">
                    Kopiuj dane płatności
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
        const verifyBtn = document.getElementById("depositVerifyBtn");

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
                const tonAmount = this.formatTonAmount(
                    this.currentDepositData?.expectedAmount ?? this.currentDepositData?.amount ?? 0,
                    6
                );
                const usdAmount = this.formatUsdAmount(
                    this.currentDepositData?.baseAmountUsd ??
                    this.currentDepositData?.baseAmount ??
                    0,
                    2
                );
                const bonusText = String(this.currentDepositData?.bonusText || "").trim();

                const fullText = [
                    `AMOUNT: ${tonAmount} TON`,
                    `DEPOSIT: ${usdAmount}$`,
                    `ADDRESS: ${address}`,
                    bonusText ? `BONUS: ${bonusText}` : ""
                ].filter(Boolean).join("\n");

                await this.copy(fullText, "Skopiowano dane płatności");
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
    },

    fillModalData() {
        const amountEl = document.getElementById("depositPaymentAmount");
        const baseAmountEl = document.getElementById("depositPaymentBaseAmount");
        const bonusEl = document.getElementById("depositPaymentBonus");
        const addressEl = document.getElementById("depositPaymentAddress");

        const tonAmount = Number(this.currentDepositData?.expectedAmount ?? this.currentDepositData?.amount ?? 0);
        const baseAmountUsd = Number(
            this.currentDepositData?.baseAmountUsd ??
            this.currentDepositData?.baseAmount ??
            0
        );
        const address = String(this.currentDepositData?.address || "");
        const bonusText = String(this.currentDepositData?.bonusText || "").trim();

        if (amountEl) {
            amountEl.textContent = `${this.formatTonAmount(tonAmount, 6)} TON`;
        }

        if (baseAmountEl) {
            baseAmountEl.textContent = `${this.formatUsdAmount(baseAmountUsd, 2)}$`;
        }

        if (bonusEl) {
            bonusEl.textContent = bonusText || "-";
        }

        if (addressEl) {
            addressEl.textContent = address || "-";
        }
    },

    showDepositModal() {
        const modal = this.ensureModal();
        this.fillModalData();
        modal.classList.remove("hidden");
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

    async createDeposit(amountUsd) {
        if (this.isCreatingDeposit) {
            return false;
        }

        this.isCreatingDeposit = true;

        try {
            const safeAmountUsd = Number((Math.max(0, Number(amountUsd) || 0)).toFixed(2));

            if (safeAmountUsd < 1) {
                throw new Error("Minimalna wpłata to 1$");
            }

            if (!CryptoZoo.api?.createDepositWithPayment) {
                throw new Error("createDepositWithPayment not available");
            }

            const result = await CryptoZoo.api.createDepositWithPayment(safeAmountUsd);
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

            const paymentAmountTon = Number(
                payment.expectedAmount ??
                deposit.expectedAmount ??
                payment.amount ??
                deposit.amount ??
                0
            ) || 0;

            const baseAmountUsd = Number(
                payment.baseAmountUsd ??
                deposit.baseAmountUsd ??
                payment.baseAmount ??
                deposit.baseAmount ??
                safeAmountUsd
            ) || safeAmountUsd;

            const uniqueFraction = Number(
                payment.uniqueFraction ??
                deposit.uniqueFraction ??
                0
            ) || 0;

            if (!receiverAddress) {
                throw new Error("Missing TON receiver address");
            }

            if (paymentAmountTon <= 0) {
                throw new Error("Missing TON payment amount");
            }

            const bonusMeta = this.getDepositBonusMeta(baseAmountUsd, payment, deposit);
            const bonusText = this.formatBonusText(bonusMeta);

            this.currentDepositData = {
                depositId: String(deposit.depositId || deposit.id || payment.depositId || ""),
                address: receiverAddress,
                amount: paymentAmountTon,
                expectedAmount: paymentAmountTon,
                baseAmount: baseAmountUsd,
                baseAmountUsd,
                uniqueFraction,
                bonusText
            };

            this.bindResumeEvents();
            this.showDepositModal();
            this.startVerifyWatcher();

            const toastMessage = bonusText
                ? `Depozyt ${this.formatUsdAmount(baseAmountUsd, 2)}$ utworzony • ${bonusText}`
                : `Depozyt ${this.formatUsdAmount(baseAmountUsd, 2)}$ utworzony`;

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
            Number(CryptoZoo.depositBind?.customUsdAmount) ||
            Number(CryptoZoo.depositBind?.selectedAmount) ||
            1;

        return this.createDeposit(selectedAmount);
    },

    init() {
        this.bindResumeEvents();
        this.ensureModal();
    }
};
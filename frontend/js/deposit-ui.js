window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    currentDepositData: null,
    isCreatingDeposit: false,
    isOpeningWallet: false,
    isVerifyingDeposit: false,
    verifyIntervalId: null,
    verifyTimeoutId: null,
    resumeEventsBound: false,

    getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    },

    toNano(amount) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return Math.floor(safeAmount * 1000000000);
    },

    stopEvent(event) {
        if (!event) return;
        event.preventDefault?.();
        event.stopPropagation?.();
    },

    getDepositBonusMeta(amount, payment = {}, deposit = {}) {
        const safeAmount = Math.max(0, Number(amount) || 0);

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

    buildTonkeeperUniversalLink({ address, amount, comment }) {
        const safeAddress = String(address || "").trim();
        const safeComment = String(comment || "").trim();
        const nanoAmount = this.toNano(amount);

        if (!safeAddress) {
            return "";
        }

        let link = `https://app.tonkeeper.com/transfer/${encodeURIComponent(safeAddress)}?amount=${nanoAmount}`;

        if (safeComment) {
            link += `&text=${encodeURIComponent(safeComment)}`;
        }

        return link;
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
                        <div class="profile-subtitle">Skopiuj dane, wyślij TON i wróć do gry</div>
                    </div>
                </div>

                <div class="profile-boost-row">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Kwota</div>
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
                        <div class="profile-boost-label">Adres portfela</div>
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
                        <div class="profile-boost-label">Komentarz transakcji</div>
                        <div
                            id="depositPaymentComment"
                            class="profile-boost-value"
                            style="margin-top:6px; word-break:break-all; font-size:13px; line-height:1.5;"
                        >-</div>
                        <button id="depositCopyCommentBtn" class="profile-close-btn" type="button" style="margin-top:10px;">
                            Kopiuj komentarz
                        </button>
                    </div>
                </div>

                <div class="profile-boost-row" style="margin-top:12px;">
                    <div class="profile-boost-left" style="width:100%;">
                        <div class="profile-boost-label">Ważne</div>
                        <div class="profile-boost-value" style="margin-top:6px; font-size:13px; line-height:1.5;">
                            Wyślij dokładną kwotę i dokładnie ten komentarz. Po powrocie do gry system sam sprawdzi wpłatę.
                        </div>
                    </div>
                </div>

                <button id="depositCopyAllBtn" class="profile-close-btn" type="button" style="margin-top:12px;">
                    Kopiuj wszystko
                </button>

                <button id="depositOpenWalletBtn" class="profile-close-btn" type="button">
                    Otwórz portfel
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
        const copyCommentBtn = document.getElementById("depositCopyCommentBtn");
        const copyAllBtn = document.getElementById("depositCopyAllBtn");
        const openWalletBtn = document.getElementById("depositOpenWalletBtn");
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
                const amount = Number(this.currentDepositData?.amount || 0).toFixed(3);
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

        if (copyCommentBtn && !copyCommentBtn.dataset.bound) {
            copyCommentBtn.dataset.bound = "1";
            copyCommentBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.copy(this.currentDepositData?.comment || "", "Skopiowano komentarz");
            });
        }

        if (copyAllBtn && !copyAllBtn.dataset.bound) {
            copyAllBtn.dataset.bound = "1";
            copyAllBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");

                const address = this.currentDepositData?.address || "";
                const amount = Number(this.currentDepositData?.amount || 0).toFixed(3);
                const comment = this.currentDepositData?.comment || "";
                const bonusText = String(this.currentDepositData?.bonusText || "").trim();

                const fullText = [
                    `AMOUNT: ${amount} TON`,
                    `ADDRESS: ${address}`,
                    `COMMENT: ${comment}`,
                    bonusText ? `BONUS: ${bonusText}` : ""
                ].filter(Boolean).join("\n");

                await this.copy(fullText, "Skopiowano wszystko");
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
    },

    fillModalData() {
        const amountEl = document.getElementById("depositPaymentAmount");
        const bonusEl = document.getElementById("depositPaymentBonus");
        const addressEl = document.getElementById("depositPaymentAddress");
        const commentEl = document.getElementById("depositPaymentComment");

        const amount = Number(this.currentDepositData?.amount || 0);
        const address = String(this.currentDepositData?.address || "");
        const comment = String(this.currentDepositData?.comment || "");
        const bonusText = String(this.currentDepositData?.bonusText || "").trim();

        if (amountEl) {
            amountEl.textContent = `${amount.toFixed(3)} TON`;
        }

        if (bonusEl) {
            bonusEl.textContent = bonusText || "-";
        }

        if (addressEl) {
            addressEl.textContent = address || "-";
        }

        if (commentEl) {
            commentEl.textContent = comment || "-";
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
        CryptoZoo.ui?.renderProfile?.();
        CryptoZoo.ui?.renderWithdrawHistory?.();
        CryptoZoo.ui?.renderDepositHistory?.();
        CryptoZoo.ui?.renderDepositsHistory?.();

        if (successMessage) {
            CryptoZoo.ui?.showToast?.(successMessage);
        }
    },

    async verifyCurrentDeposit(silent = true) {
        if (this.isVerifyingDeposit) {
            return false;
        }

        if (!CryptoZoo.api?.verifyDepositById || !CryptoZoo.api?.verifyPendingDepositsForPlayer) {
            return false;
        }

        this.isVerifyingDeposit = true;

        try {
            let result = null;
            const depositId = String(this.currentDepositData?.depositId || "").trim();

            if (depositId) {
                result = await CryptoZoo.api.verifyDepositById(depositId);
            } else {
                result = await CryptoZoo.api.verifyPendingDepositsForPlayer();
            }

            const deposit = result?.deposit || null;
            const matched = !!result?.matched;
            const expired = !!result?.expired;
            const alreadyProcessed = !!result?.alreadyProcessed;
            const approved =
                String(deposit?.status || "").toLowerCase() === "approved" ||
                matched;

            if (approved || alreadyProcessed || result?.player) {
                this.stopVerifyWatcher();
                await this.refreshPlayerAndUi("✅ Depozyt zatwierdzony, bonus dodany");
                this.closeDepositModal();
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

        try {
            const address = String(this.currentDepositData?.address || "").trim();
            const amount = Number(this.currentDepositData?.amount || 0);
            const comment = String(this.currentDepositData?.comment || "").trim();

            if (!address || amount <= 0) {
                throw new Error("Brak danych płatności");
            }

            const universalLink = this.buildTonkeeperUniversalLink({
                address,
                amount,
                comment
            });

            if (!universalLink) {
                throw new Error("Nie udało się zbudować linku płatności");
            }

            const tg = this.getTelegramWebApp();

            this.startVerifyWatcher();

            if (tg?.openLink) {
                tg.openLink(universalLink);
            } else {
                window.open(universalLink, "_blank");
            }

            CryptoZoo.ui?.showToast?.("Po wysłaniu TON wróć do gry — system sprawdzi wpłatę");
            return true;
        } catch (error) {
            console.error("Open wallet error:", error);
            CryptoZoo.ui?.showToast?.(error.message || "Nie udało się otworzyć portfela");
            return false;
        } finally {
            setTimeout(() => {
                this.isOpeningWallet = false;
            }, 800);
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
            const paymentRaw = result?.payment || null;
            const payment = paymentRaw?.payment || paymentRaw;

            if (!deposit || !payment) {
                throw new Error("Deposit payment data missing");
            }

            const receiverAddress = String(payment.receiverAddress || "").trim();
            const paymentComment = String(payment.paymentComment || "").trim();
            const paymentAmount = Number(payment.amount || safeAmount) || safeAmount;

            if (!receiverAddress) {
                throw new Error("Missing TON receiver address");
            }

            const bonusMeta = this.getDepositBonusMeta(paymentAmount, payment, deposit);
            const bonusText = this.formatBonusText(bonusMeta);

            this.currentDepositData = {
                depositId: String(deposit.id || ""),
                address: receiverAddress,
                amount: paymentAmount,
                comment: paymentComment,
                bonusText
            };

            this.bindResumeEvents();
            this.showDepositModal();

            const toastMessage = bonusText
                ? `Deposit ${paymentAmount.toFixed(3)} TON utworzony • ${bonusText}`
                : `Deposit ${paymentAmount.toFixed(3)} TON utworzony`;

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
    }
};
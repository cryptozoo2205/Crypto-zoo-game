window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    currentDepositData: null,
    isCreatingDeposit: false,
    isOpeningWallet: false,

    getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    },

    toNano(amount) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return Math.floor(safeAmount * 1000000000);
    },

    stopEvent(event) {
        if (!event) return;
        if (typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        if (typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }
    },

    bindBlockTouches(element) {
        if (!element || element.dataset.touchBlocked) return;

        element.dataset.touchBlocked = "1";

        const block = (event) => {
            this.stopEvent(event);
        };

        element.addEventListener("click", block, true);
        element.addEventListener("mousedown", block, true);
        element.addEventListener("mouseup", block, true);
        element.addEventListener("touchstart", block, { passive: false, capture: true });
        element.addEventListener("touchend", block, { passive: false, capture: true });
        element.addEventListener("pointerdown", block, true);
        element.addEventListener("pointerup", block, true);
    },

    async copy(text, label = "Skopiowano") {
        const safeText = String(text || "");

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
                textarea.style.opacity = "0";
                textarea.style.pointerEvents = "none";
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
        modal.style.pointerEvents = "auto";
        modal.innerHTML = `
            <div class="profile-backdrop" id="depositPaymentBackdrop"></div>

            <div id="depositPaymentCard" class="profile-card" style="max-width:520px; pointer-events:auto;">
                <div class="profile-header">
                    <div class="profile-avatar">💰</div>

                    <div class="profile-user-meta">
                        <div class="profile-name">Deposit TON</div>
                        <div class="profile-subtitle">Skopiuj dane lub otwórz portfel</div>
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

                <button id="depositCopyAllBtn" class="profile-close-btn" type="button" style="margin-top:12px;">
                    Kopiuj wszystko
                </button>

                <button id="depositOpenWalletBtn" class="profile-close-btn" type="button">
                    Otwórz portfel
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

        this.bindBlockTouches(modal);
        this.bindBlockTouches(card);
        this.bindBlockTouches(closeBtn);
        this.bindBlockTouches(copyAmountBtn);
        this.bindBlockTouches(copyAddressBtn);
        this.bindBlockTouches(copyCommentBtn);
        this.bindBlockTouches(copyAllBtn);
        this.bindBlockTouches(openWalletBtn);

        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "1";

            const closeFromBackdrop = (event) => {
                this.stopEvent(event);
                this.closeDepositModal();
            };

            backdrop.addEventListener("click", closeFromBackdrop, true);
            backdrop.addEventListener("touchstart", closeFromBackdrop, { passive: false, capture: true });
        }

        if (card && !card.dataset.boundCard) {
            card.dataset.boundCard = "1";

            const blockInside = (event) => {
                this.stopEvent(event);
            };

            card.addEventListener("click", blockInside, true);
            card.addEventListener("mousedown", blockInside, true);
            card.addEventListener("mouseup", blockInside, true);
            card.addEventListener("touchstart", blockInside, { passive: false, capture: true });
            card.addEventListener("touchend", blockInside, { passive: false, capture: true });
            card.addEventListener("pointerdown", blockInside, true);
            card.addEventListener("pointerup", blockInside, true);
        }

        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "1";
            closeBtn.addEventListener("click", (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                this.closeDepositModal();
            }, true);
        }

        if (copyAmountBtn && !copyAmountBtn.dataset.bound) {
            copyAmountBtn.dataset.bound = "1";
            copyAmountBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                const amount = Number(this.currentDepositData?.amount || 0).toFixed(3);
                await this.copy(`${amount} TON`, "Skopiowano kwotę");
            }, true);
        }

        if (copyAddressBtn && !copyAddressBtn.dataset.bound) {
            copyAddressBtn.dataset.bound = "1";
            copyAddressBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.copy(this.currentDepositData?.address || "", "Skopiowano adres");
            }, true);
        }

        if (copyCommentBtn && !copyCommentBtn.dataset.bound) {
            copyCommentBtn.dataset.bound = "1";
            copyCommentBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.copy(this.currentDepositData?.comment || "", "Skopiowano komentarz");
            }, true);
        }

        if (copyAllBtn && !copyAllBtn.dataset.bound) {
            copyAllBtn.dataset.bound = "1";
            copyAllBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");

                const address = this.currentDepositData?.address || "";
                const amount = Number(this.currentDepositData?.amount || 0).toFixed(3);
                const comment = this.currentDepositData?.comment || "";

                const fullText = [
                    `AMOUNT: ${amount} TON`,
                    `ADDRESS: ${address}`,
                    `COMMENT: ${comment}`
                ].join("\n");

                await this.copy(fullText, "Skopiowano wszystko");
            }, true);
        }

        if (openWalletBtn && !openWalletBtn.dataset.bound) {
            openWalletBtn.dataset.bound = "1";
            openWalletBtn.addEventListener("click", async (event) => {
                this.stopEvent(event);
                CryptoZoo.audio?.play?.("click");
                await this.openWallet();
            }, true);
        }
    },

    fillModalData() {
        const amountEl = document.getElementById("depositPaymentAmount");
        const addressEl = document.getElementById("depositPaymentAddress");
        const commentEl = document.getElementById("depositPaymentComment");

        const amount = Number(this.currentDepositData?.amount || 0);
        const address = String(this.currentDepositData?.address || "");
        const comment = String(this.currentDepositData?.comment || "");

        if (amountEl) {
            amountEl.textContent = `${amount.toFixed(3)} TON`;
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

            if (tg?.openLink) {
                tg.openLink(universalLink);
            } else {
                window.open(universalLink, "_blank");
            }

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

            this.currentDepositData = {
                depositId: String(deposit.id || ""),
                address: receiverAddress,
                amount: paymentAmount,
                comment: paymentComment
            };

            this.showDepositModal();
            CryptoZoo.ui?.showToast?.(`Deposit ${paymentAmount.toFixed(3)} TON utworzony`);

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
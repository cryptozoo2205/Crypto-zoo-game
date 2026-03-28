window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    },

    toNano(amount) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        return Math.floor(safeAmount * 1000000000);
    },

    buildTonTransferLink({ address, amount, comment }) {
        const safeAddress = String(address || "").trim();
        const safeAmount = Math.max(0, Number(amount) || 0);
        const safeComment = String(comment || "").trim();

        if (!safeAddress) {
            return "";
        }

        const nanoAmount = this.toNano(safeAmount);

        let link = `ton://transfer/${safeAddress}?amount=${nanoAmount}`;

        if (safeComment) {
            link += `&text=${encodeURIComponent(safeComment)}`;
        }

        return link;
    },

    openTonPayment(link) {
        const safeLink = String(link || "").trim();
        if (!safeLink) {
            return false;
        }

        const tg = this.getTelegramWebApp();

        try {
            if (tg?.openTelegramLink) {
                tg.openTelegramLink(safeLink);
                return true;
            }

            window.open(safeLink, "_blank");
            return true;
        } catch (error) {
            console.error("TON open link error:", error);
            return false;
        }
    },

    async createDeposit(amount) {
        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        if (safeAmount <= 0) {
            CryptoZoo.ui?.showToast?.("Invalid deposit amount");
            return false;
        }

        try {
            if (!CryptoZoo.api?.createDepositWithPayment) {
                throw new Error("createDepositWithPayment not available");
            }

            const result = await CryptoZoo.api.createDepositWithPayment(safeAmount);
            const deposit = result?.deposit || null;
            const payment = result?.payment || null;

            if (!deposit || !payment) {
                throw new Error("Deposit payment data missing");
            }

            const receiverAddress = String(payment.receiverAddress || "").trim();
            const paymentComment = String(payment.paymentComment || "").trim();
            const paymentAmount = Number(payment.amount || safeAmount) || safeAmount;

            if (!receiverAddress) {
                throw new Error("Missing TON receiver address");
            }

            const tonLink = this.buildTonTransferLink({
                address: receiverAddress,
                amount: paymentAmount,
                comment: paymentComment
            });

            if (!tonLink) {
                throw new Error("Failed to build TON payment link");
            }

            const opened = this.openTonPayment(tonLink);

            if (!opened) {
                throw new Error("Failed to open TON payment");
            }

            CryptoZoo.ui?.showToast?.(`Send ${paymentAmount.toFixed(3)} TON`);

            return {
                ok: true,
                deposit,
                payment,
                tonLink
            };
        } catch (error) {
            console.error("Create deposit error:", error);
            CryptoZoo.ui?.showToast?.(error.message || "Deposit error");
            return false;
        }
    }
};
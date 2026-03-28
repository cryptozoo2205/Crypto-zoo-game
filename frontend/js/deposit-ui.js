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

    buildTonkeeperUniversalLink({ address, amount, comment }) {
        const safeAddress = String(address || "").trim();
        const safeAmount = Math.max(0, Number(amount) || 0);
        const safeComment = String(comment || "").trim();

        if (!safeAddress) {
            return "";
        }

        const nanoAmount = this.toNano(safeAmount);

        let link = `https://app.tonkeeper.com/transfer/${encodeURIComponent(safeAddress)}?amount=${nanoAmount}`;

        if (safeComment) {
            link += `&text=${encodeURIComponent(safeComment)}`;
        }

        return link;
    },

    openTonPayment({ tonLink, universalLink }) {
        const safeTonLink = String(tonLink || "").trim();
        const safeUniversalLink = String(universalLink || "").trim();
        const tg = this.getTelegramWebApp();

        try {
            if (tg?.openLink && safeUniversalLink) {
                tg.openLink(safeUniversalLink);
                return true;
            }
        } catch (error) {
            console.error("Telegram openLink error:", error);
        }

        try {
            if (safeUniversalLink) {
                window.open(safeUniversalLink, "_blank");
                return true;
            }
        } catch (error) {
            console.error("Window universal link open error:", error);
        }

        try {
            if (safeTonLink) {
                window.location.href = safeTonLink;
                return true;
            }
        } catch (error) {
            console.error("TON deep link open error:", error);
        }

        return false;
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

            const tonLink = this.buildTonTransferLink({
                address: receiverAddress,
                amount: paymentAmount,
                comment: paymentComment
            });

            const universalLink = this.buildTonkeeperUniversalLink({
                address: receiverAddress,
                amount: paymentAmount,
                comment: paymentComment
            });

            const opened = this.openTonPayment({
                tonLink,
                universalLink
            });

            if (!opened) {
                throw new Error("Failed to open TON payment");
            }

            CryptoZoo.ui?.showToast?.(`Send ${paymentAmount.toFixed(3)} TON`);

            return {
                ok: true,
                deposit,
                payment,
                tonLink,
                universalLink
            };
        } catch (error) {
            console.error("Create deposit error:", error);
            CryptoZoo.ui?.showToast?.(error.message || "Deposit error");
            return false;
        }
    }
};
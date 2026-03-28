window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    async createDeposit(amount) {
        try {
            const { payment } = await CryptoZoo.api.createDepositWithPayment(amount);

            const address = String(payment.receiverAddress || "").trim();
            const comment = String(payment.paymentComment || "").trim();
            const value = Number(payment.amount || amount);

            if (!address) {
                throw new Error("Missing TON address");
            }

            // TON → nano
            const nano = Math.floor(value * 1e9);

            const tonLink =
                `ton://transfer/${address}` +
                `?amount=${nano}` +
                `&text=${encodeURIComponent(comment)}`;

            if (window.Telegram?.WebApp?.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(tonLink);
            } else {
                window.open(tonLink, "_blank");
            }

            CryptoZoo.ui?.showToast?.(`Send ${value.toFixed(3)} TON`);

            return true;

        } catch (e) {
            console.error("Deposit error:", e);
            CryptoZoo.ui?.showToast?.(e.message || "Deposit error");
            return false;
        }
    }
};
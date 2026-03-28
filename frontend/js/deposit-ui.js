window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositUI = {
    currentDepositData: null,

    getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    },

    async copy(text, label = "Copied") {
        try {
            await navigator.clipboard.writeText(String(text));
            CryptoZoo.ui?.showToast?.(label);
        } catch (e) {
            CryptoZoo.ui?.showToast?.("Copy failed");
        }
    },

    buildTonkeeperLink(address, amount, comment) {
        const nano = Math.floor(Number(amount) * 1e9);

        let url = `https://app.tonkeeper.com/transfer/${address}?amount=${nano}`;

        if (comment) {
            url += `&text=${encodeURIComponent(comment)}`;
        }

        return url;
    },

    openWallet(link) {
        const tg = this.getTelegramWebApp();

        try {
            if (tg?.openLink) {
                tg.openLink(link);
                return true;
            }
        } catch (e) {}

        try {
            window.open(link, "_blank");
            return true;
        } catch (e) {}

        return false;
    },

    renderDepositModal({ address, amount, comment }) {
        let modal = document.getElementById("depositModal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "depositModal";
            modal.style.position = "fixed";
            modal.style.inset = "0";
            modal.style.zIndex = "9999";
            modal.style.background = "rgba(0,0,0,0.7)";
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";

            modal.innerHTML = `
                <div style="
                    width:90%;
                    max-width:420px;
                    background:#0f172a;
                    border-radius:16px;
                    padding:16px;
                    color:#fff;
                ">
                    <h3 style="margin:0 0 10px;">💰 Deposit TON</h3>

                    <div style="margin-top:10px;">
                        <div style="opacity:.7;">Amount</div>
                        <div id="depAmount" style="font-size:18px;margin-top:4px;"></div>
                        <button id="copyAmountBtn" style="margin-top:6px;">Copy Amount</button>
                    </div>

                    <div style="margin-top:12px;">
                        <div style="opacity:.7;">Address</div>
                        <div id="depAddress" style="word-break:break-all;font-size:12px;margin-top:4px;"></div>
                        <button id="copyAddressBtn" style="margin-top:6px;">Copy Address</button>
                    </div>

                    <div style="margin-top:12px;">
                        <div style="opacity:.7;">Comment</div>
                        <div id="depComment" style="font-size:12px;margin-top:4px;"></div>
                        <button id="copyCommentBtn" style="margin-top:6px;">Copy Comment</button>
                    </div>

                    <button id="copyAllBtn" style="margin-top:12px;width:100%;">
                        🔥 Copy ALL
                    </button>

                    <button id="openWalletBtn" style="margin-top:8px;width:100%;">
                        Open Wallet
                    </button>

                    <button id="closeDepositBtn" style="margin-top:8px;width:100%;">
                        Close
                    </button>
                </div>
            `;

            document.body.appendChild(modal);
        }

        document.getElementById("depAmount").textContent = `${amount.toFixed(3)} TON`;
        document.getElementById("depAddress").textContent = address;
        document.getElementById("depComment").textContent = comment;

        const link = this.buildTonkeeperLink(address, amount, comment);

        document.getElementById("copyAmountBtn").onclick = () =>
            this.copy(amount.toFixed(3), "Amount copied");

        document.getElementById("copyAddressBtn").onclick = () =>
            this.copy(address, "Address copied");

        document.getElementById("copyCommentBtn").onclick = () =>
            this.copy(comment, "Comment copied");

        document.getElementById("copyAllBtn").onclick = () =>
            this.copy(`${address}\n${amount}\n${comment}`, "All copied");

        document.getElementById("openWalletBtn").onclick = () =>
            this.openWallet(link);

        document.getElementById("closeDepositBtn").onclick = () =>
            modal.remove();
    },

    async createDeposit(amount) {
        try {
            const result = await CryptoZoo.api.createDepositWithPayment(amount);

            const paymentRaw = result?.payment;
            const payment = paymentRaw?.payment || paymentRaw;

            const address = payment.receiverAddress;
            const comment = payment.paymentComment;
            const paymentAmount = Number(payment.amount || amount);

            if (!address) throw new Error("No address");

            this.currentDepositData = {
                address,
                amount: paymentAmount,
                comment
            };

            // 🔥 POKAZUJEMY UI zamiast tylko linka
            this.renderDepositModal({
                address,
                amount: paymentAmount,
                comment
            });

            return true;
        } catch (e) {
            console.error(e);
            CryptoZoo.ui?.showToast?.("Deposit error");
            return false;
        }
    }
};
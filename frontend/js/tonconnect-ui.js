window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.tonConnect = {
    ui: null,
    wallet: null,

    async init() {
        try {
            if (!window.TON_CONNECT_UI) return;

            this.ui = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: "https://cryptozoo.pl/tonconnect-manifest.json",
                buttonRootId: "ton-connect-root"
            });

            this.ui.onStatusChange(wallet => {
                this.wallet = wallet || null;
                console.log("TON wallet:", wallet);
            });
        } catch (e) {
            console.error("TON CONNECT INIT ERROR", e);
        }
    },

    async connect() {
        if (!this.ui) return false;
        await this.ui.openModal();
        return true;
    },

    async payTon(amountTon, comment) {
        if (!this.ui) throw new Error("TonConnect not ready");

        const tx = await this.ui.sendTransaction({
            validUntil: Math.floor(Date.now()/1000) + 600,
            messages: [
                {
                    address: "UQBkMGcFpt0QK8huriOMEYC8T2hfhPGHJXDxnKT8Shguc0jY",
                    amount: String(Math.floor(Number(amountTon) * 1000000000)),
                    payload: comment || "CryptoZoo Deposit"
                }
            ]
        });

        return tx;
    }
};

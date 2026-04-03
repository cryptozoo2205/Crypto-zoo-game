window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiDeposit = {
    getDepositOptions() {
        return [
            { amount: 1, gems: 10, boost: 0.05 },
            { amount: 3, gems: 35, boost: 0.15 },
            { amount: 5, gems: 70, boost: 0.30 },
            { amount: 10, gems: 150, boost: 0.60 }
        ];
    },

    formatBoost(boost) {
        return `+${Math.round(boost * 100)}% expedition`;
    },

    render() {
        const mount = document.getElementById("depositMount");
        if (!mount) return;

        const options = this.getDepositOptions();

        mount.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
                ${options.map(opt => `
                    <div onclick="CryptoZoo.uiDeposit.select(${opt.amount})"
                        style="
                            padding:14px;
                            border-radius:16px;
                            background:linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
                            border:1px solid rgba(255,255,255,0.1);
                            box-shadow:0 6px 18px rgba(0,0,0,0.25);
                            cursor:pointer;
                        ">

                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-size:16px; font-weight:900;">
                                ${opt.amount} TON
                            </div>

                            <div style="
                                font-size:12px;
                                background:rgba(255,255,255,0.1);
                                padding:4px 8px;
                                border-radius:8px;
                            ">
                                BEST VALUE
                            </div>
                        </div>

                        <div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.85);">
                            💎 +${opt.gems} gems
                        </div>

                        <div style="margin-top:4px; font-size:13px; color:#4ade80;">
                            ⚡ ${this.formatBoost(opt.boost)}
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    },

    async select(amount) {
        try {
            const res = await CryptoZoo.api.request("/deposit/create", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: CryptoZoo.api.getPlayerId(),
                    amount
                })
            });

            if (res?.depositId) {
                CryptoZoo.ui?.showToast?.("Deposit created");
                CryptoZoo.ui?.renderDepositPayment?.(res);
            }
        } catch (e) {
            console.error(e);
            CryptoZoo.ui?.showToast?.("Deposit error");
        }
    }
};
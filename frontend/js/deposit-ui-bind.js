window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositBind = {
    selectedAmount: 3,

    init() {
        this.bindAmountButtons();
        this.bindCreateDeposit();
    },

    bindAmountButtons() {
        const buttons = document.querySelectorAll(".deposit-amount-btn");

        buttons.forEach((btn) => {
            if (btn.dataset.bound) return;
            btn.dataset.bound = "1";

            btn.addEventListener("click", () => {
                const amount = Number(btn.dataset.amount || 0);
                if (!amount) return;

                this.selectedAmount = amount;

                buttons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                CryptoZoo.ui?.showToast?.(`Selected ${amount} TON`);
            });
        });
    },

    bindCreateDeposit() {
        const btn = document.getElementById("settingsCreateDepositBtn");
        if (!btn || btn.dataset.bound) return;

        btn.dataset.bound = "1";

        btn.addEventListener("click", async () => {
            CryptoZoo.audio?.play?.("click");

            if (!CryptoZoo.depositUI) {
                CryptoZoo.ui?.showToast?.("Deposit system not ready");
                return;
            }

            await CryptoZoo.depositUI.createDeposit(this.selectedAmount);

            // refresh history po utworzeniu
            CryptoZoo.uiSettings?.loadDepositsHistory?.();
        });
    }
};
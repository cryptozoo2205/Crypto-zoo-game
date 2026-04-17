window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.depositBind = {
    selectedAmount: 3,

    init() {
        this.bindAmountButtons();
    },

    bindAmountButtons() {
        const buttons = document.querySelectorAll(".deposit-amount-btn");

        if (!buttons.length) return;

        buttons.forEach((btn) => {
            if (btn.dataset.bound === "1") return;
            btn.dataset.bound = "1";

            btn.addEventListener("click", () => {
                const amount = Number(btn.dataset.amount || 0);
                if (!amount) return;

                this.selectedAmount = amount;

                buttons.forEach((b) => {
                    b.classList.remove("active");
                    b.style.border = "1px solid rgba(255,255,255,0.14)";
                    b.style.background = "rgba(255,255,255,0.04)";
                    b.style.boxShadow = "none";
                });

                btn.classList.add("active");
                btn.style.border = "2px solid rgba(255,210,60,0.95)";
                btn.style.background = "linear-gradient(180deg, rgba(255,210,60,0.24) 0%, rgba(255,185,0,0.14) 100%)";
                btn.style.boxShadow = "0 10px 24px rgba(255,190,0,0.18)";

                const createBtn = document.getElementById("settingsCreateDepositBtn");
                if (createBtn) {
                    createBtn.textContent = `Create Deposit (${amount.toFixed(3)})`;
                }

                CryptoZoo.ui?.showToast?.(`Selected ${amount} TON`);
            });
        });
    }
};
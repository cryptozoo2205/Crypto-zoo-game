window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shop = {
    init() {
        this.bindBoxBuyButtons();
    },

    bindBoxBuyButtons() {
        const buttons = document.querySelectorAll("[data-box-type]");

        buttons.forEach((button) => {
            button.onclick = () => {
                const type = button.getAttribute("data-box-type");
                CryptoZoo.boxes?.buy?.(type);
            };
        });
    }
}; 
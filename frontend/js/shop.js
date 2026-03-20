window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shop = {
    initialized: false,
    touchLockUntil: 0,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.bindBoxBuyButtons();
        this.bindDelegatedBoxBuy();
    },

    bindBoxBuyButtons() {
        const buttons = document.querySelectorAll("[data-box-type]");

        buttons.forEach((button) => {
            if (button.dataset.shopBound === "1") return;

            button.dataset.shopBound = "1";

            button.onclick = (event) => {
                event.preventDefault();

                const type = button.getAttribute("data-box-type");
                if (!type) return;

                CryptoZoo.boxes?.buy?.(type);
            };

            button.addEventListener(
                "touchstart",
                (event) => {
                    const now = Date.now();

                    if (now < this.touchLockUntil) {
                        event.preventDefault();
                        return;
                    }

                    this.touchLockUntil = now + 700;
                    event.preventDefault();

                    const type = button.getAttribute("data-box-type");
                    if (!type) return;

                    CryptoZoo.boxes?.buy?.(type);
                },
                { passive: false }
            );
        });
    },

    bindDelegatedBoxBuy() {
        if (document.body?.dataset.shopDelegationBound === "1") return;

        document.body.dataset.shopDelegationBound = "1";

        document.addEventListener(
            "click",
            (event) => {
                const button = event.target.closest("[data-box-type]");
                if (!button) return;

                event.preventDefault();

                const type = button.getAttribute("data-box-type");
                if (!type) return;

                CryptoZoo.boxes?.buy?.(type);
            },
            true
        );
    }
};
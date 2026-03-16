window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.shop = {
    items: [
        {
            id: "click_upgrade",
            title: "Click Upgrade",
            description: "+1 do kliknięcia",
            getPrice() {
                return Number(CryptoZoo.state.upgradeCost) || 50;
            },
            isActive: true,
            buy() {
                const state = CryptoZoo.state;

                if ((Number(state.coins) || 0) < (Number(state.upgradeCost) || 50)) {
                    if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
                        CryptoZoo.ui.showToast("Za mało monet");
                    }
                    return;
                }

                state.coins -= Number(state.upgradeCost) || 50;
                state.coinsPerClick = (Number(state.coinsPerClick) || 1) + 1;
                state.upgradeCost = Math.floor((Number(state.upgradeCost) || 50) * 1.4);

                if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
                    CryptoZoo.ui.showToast("Kupiono ulepszenie kliknięcia");
                }

                if (CryptoZoo.ui && CryptoZoo.ui.render) {
                    CryptoZoo.ui.render();
                }

                this.render();

                if (CryptoZoo.api && CryptoZoo.api.savePlayer) {
                    CryptoZoo.api.savePlayer();
                }
            }
        },
        {
            id: "zoo_income_boost",
            title: "Zoo Income Boost",
            description: "Wkrótce",
            getPrice() {
                return 5000;
            },
            isActive: false
        },
        {
            id: "expedition_boost",
            title: "Expedition Boost",
            description: "Wkrótce",
            getPrice() {
                return 15000;
            },
            isActive: false
        },
        {
            id: "offline_boost",
            title: "Offline Boost",
            description: "Wkrótce",
            getPrice() {
                return 25000;
            },
            isActive: false
        }
    ],

    getContainer() {
        return document.getElementById("shop-list");
    },

    render() {
        const container = this.getContainer();
        if (!container) return;

        container.innerHTML = "";

        this.items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "shop-item-card";

            const price = item.getPrice();

            card.innerHTML = `
                <div class="shop-item-left">
                    <div class="shop-item-title">${item.title}</div>
                    <div class="shop-item-desc">${item.description}</div>
                    <div class="shop-item-price">Koszt: ${CryptoZoo.formatNumber(price)}</div>
                </div>
                <div class="shop-item-right">
                    <button
                        type="button"
                        class="shop-buy-btn ${item.isActive ? "" : "shop-disabled-btn"}"
                        data-shop-id="${item.id}"
                        ${item.isActive ? "" : "disabled"}
                    >
                        ${item.isActive ? "Kup" : "Soon"}
                    </button>
                </div>
            `;

            container.appendChild(card);
        });

        this.bindButtons();
    },

    bindButtons() {
        const buttons = document.querySelectorAll("[data-shop-id]");

        buttons.forEach((button) => {
            button.onclick = () => {
                const itemId = button.getAttribute("data-shop-id");
                const item = this.items.find((entry) => entry.id === itemId);

                if (!item || !item.isActive || typeof item.buy !== "function") {
                    return;
                }

                item.buy();
            };
        });
    },

    init() {
        this.render();
    }
};
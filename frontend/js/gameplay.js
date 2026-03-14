window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {

    getLevelFromCoins(coins) {
        return Math.floor(Math.sqrt(coins / 100)) + 1;
    },

    normalizeAnimals() {
        const state = CryptoZoo.state;

        if (!state.animals) {
            state.animals = {
                monkey: { count: 0, level: 1 },
                panda: { count: 0, level: 1 },
                lion: { count: 0, level: 1 }
            };
        }

        if (!state.animals.monkey) state.animals.monkey = { count: 0, level: 1 };
        if (!state.animals.panda) state.animals.panda = { count: 0, level: 1 };
        if (!state.animals.lion) state.animals.lion = { count: 0, level: 1 };
    },

    getAnimalUpgradeCost(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = CryptoZoo.config.animalConfig[type];
        return Math.floor(config.upgradeBaseCost * (animal.level * 1.8));
    },

    getAnimalIncome(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = CryptoZoo.config.animalConfig[type];
        return config.baseIncome * animal.level * animal.count;
    },

    updateZooIncome() {
        const state = CryptoZoo.state;

        state.zooIncome =
            this.getAnimalIncome("monkey") +
            this.getAnimalIncome("panda") +
            this.getAnimalIncome("lion");
    },

    buyClickUpgrade() {
        const state = CryptoZoo.state;

        if (state.coins < state.upgradeCost) {
            CryptoZoo.ui.showToast("Za mało monet");
            return;
        }

        state.coins -= state.upgradeCost;
        state.coinsPerClick += 1;
        state.upgradeCost = state.upgradeCost * 2;
        state.level = this.getLevelFromCoins(state.coins);

        CryptoZoo.ui.render();
    },

    buyAnimal(type) {
        const state = CryptoZoo.state;
        const config = CryptoZoo.config.animalConfig[type];

        if (state.coins < config.buyCost) {
            CryptoZoo.ui.showToast("Za mało monet");
            return;
        }

        state.coins -= config.buyCost;
        state.animals[type].count += 1;

        this.updateZooIncome();
        state.level = this.getLevelFromCoins(state.coins);

        CryptoZoo.ui.render();
    },

    upgradeAnimal(type) {
        const state = CryptoZoo.state;
        const cost = this.getAnimalUpgradeCost(type);

        if (state.animals[type].count <= 0) {
            CryptoZoo.ui.showToast("Najpierw kup zwierzę");
            return;
        }

        if (state.coins < cost) {
            CryptoZoo.ui.showToast("Za mało monet");
            return;
        }

        state.coins -= cost;
        state.animals[type].level += 1;

        this.updateZooIncome();
        state.level = this.getLevelFromCoins(state.coins);

        CryptoZoo.ui.render();
    },

    click() {
        const state = CryptoZoo.state;

        state.coins += state.coinsPerClick;
        state.level = this.getLevelFromCoins(state.coins);

        CryptoZoo.ui.render();
        CryptoZoo.ui.animateCoinsBurst();
    },

    loadRanking() {
        const list = document.getElementById("ranking-list");
        if (!list) return;

        list.innerHTML = `
            <li>1. Gracz testowy — 12.50K monet</li>
            <li>2. CryptoPanda — 8.20K monet</li>
            <li>3. JungleLion — 4.60K monet</li>
        `;
    },

    bindNavigation() {
        const buttons = document.querySelectorAll(".nav-btn");

        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const screenId = btn.getAttribute("data-screen");
                CryptoZoo.ui.showScreen(screenId);

                if (screenId === "ranking") {
                    this.loadRanking();
                }
            });
        });
    },

    bindActions() {
        const tapBtn = document.getElementById("tap-btn");
        const buyUpgradeBtn = document.getElementById("buy-upgrade-btn");

        const buyMonkeyBtn = document.getElementById("buy-monkey-btn");
        const buyPandaBtn = document.getElementById("buy-panda-btn");
        const buyLionBtn = document.getElementById("buy-lion-btn");

        const upgradeMonkeyBtn = document.getElementById("upgrade-monkey-btn");
        const upgradePandaBtn = document.getElementById("upgrade-panda-btn");
        const upgradeLionBtn = document.getElementById("upgrade-lion-btn");

        if (tapBtn) {
            tapBtn.addEventListener("click", () => {
                this.click();
            });
        }

        if (buyUpgradeBtn) {
            buyUpgradeBtn.addEventListener("click", () => {
                this.buyClickUpgrade();
            });
        }

        if (buyMonkeyBtn) {
            buyMonkeyBtn.addEventListener("click", () => {
                this.buyAnimal("monkey");
            });
        }

        if (buyPandaBtn) {
            buyPandaBtn.addEventListener("click", () => {
                this.buyAnimal("panda");
            });
        }

        if (buyLionBtn) {
            buyLionBtn.addEventListener("click", () => {
                this.buyAnimal("lion");
            });
        }

        if (upgradeMonkeyBtn) {
            upgradeMonkeyBtn.addEventListener("click", () => {
                this.upgradeAnimal("monkey");
            });
        }

        if (upgradePandaBtn) {
            upgradePandaBtn.addEventListener("click", () => {
                this.upgradeAnimal("panda");
            });
        }

        if (upgradeLionBtn) {
            upgradeLionBtn.addEventListener("click", () => {
                this.upgradeAnimal("lion");
            });
        }
    },

    startPassiveIncome() {
        setInterval(() => {
            const state = CryptoZoo.state;

            if (state.zooIncome > 0) {
                state.coins += state.zooIncome;
                state.level = this.getLevelFromCoins(state.coins);
                CryptoZoo.ui.render();
            }
        }, CryptoZoo.config.passiveIncomeIntervalMs);
    }
};
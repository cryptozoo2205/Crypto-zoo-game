window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {
    passiveIncomeStarted: false,

    getLevelFromCoins(coins) {
        return Math.floor(Math.sqrt(Math.max(0, coins) / 100)) + 1;
    },

    normalizeAnimals() {
        const state = CryptoZoo.state;

        if (!state.animals) {
            state.animals = {};
        }

        if (!state.animals.monkey) state.animals.monkey = { count: 0, level: 1 };
        if (!state.animals.panda) state.animals.panda = { count: 0, level: 1 };
        if (!state.animals.lion) state.animals.lion = { count: 0, level: 1 };

        state.animals.monkey.count = Number(state.animals.monkey.count) || 0;
        state.animals.monkey.level = Number(state.animals.monkey.level) || 1;

        state.animals.panda.count = Number(state.animals.panda.count) || 0;
        state.animals.panda.level = Number(state.animals.panda.level) || 1;

        state.animals.lion.count = Number(state.animals.lion.count) || 0;
        state.animals.lion.level = Number(state.animals.lion.level) || 1;
    },

    getAnimalUpgradeCost(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = CryptoZoo.config.animalConfig[type];
        return Math.floor(config.upgradeBaseCost * (animal.level * 1.8));
    },

    getAnimalIncome(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = CryptoZoo.config.animalConfig[type];
        return (config.baseIncome * animal.level * animal.count);
    },

    updateZooIncome() {
        const state = CryptoZoo.state;

        state.zooIncome =
            this.getAnimalIncome("monkey") +
            this.getAnimalIncome("panda") +
            this.getAnimalIncome("lion");

        state.zooIncome = Math.floor(state.zooIncome);
    },

    async saveGame() {
        if (CryptoZoo.api && CryptoZoo.api.savePlayer) {
            try {
                await CryptoZoo.api.savePlayer();
            } catch (e) {
                console.error("Błąd zapisu:", e);
            }
        }
    },

    async loadPlayerState() {
        if (!CryptoZoo.api || !CryptoZoo.api.loadPlayer) {
            this.normalizeAnimals();
            this.updateZooIncome();
            return;
        }

        try {
            const user = await CryptoZoo.api.loadPlayer();
            if (!user) {
                this.normalizeAnimals();
                this.updateZooIncome();
                return;
            }

            const state = CryptoZoo.state;

            state.coins = Number(user.coins) || 0;
            state.coinsPerClick = Number(user.coinsPerClick) || 1;
            state.upgradeCost = Number(user.upgradeCost) || CryptoZoo.config.clickUpgradeBaseCost || 50;
            state.animals = user.animals || state.animals || {};
            this.normalizeAnimals();
            this.updateZooIncome();
            state.level = this.getLevelFromCoins(state.coins);
        } catch (error) {
            console.error("Błąd loadPlayerState:", error);
            this.normalizeAnimals();
            this.updateZooIncome();
        }
    },

    click() {
        const state = CryptoZoo.state;

        state.coins += state.coinsPerClick;
        state.level = this.getLevelFromCoins(state.coins);

        CryptoZoo.ui.render();
        CryptoZoo.ui.animateCoinsBurst();
        this.saveGame();
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
        this.saveGame();
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
        this.saveGame();
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
        this.saveGame();
    },

    async loadRanking() {
        const list = document.getElementById("ranking-list");
        if (!list) return;

        if (CryptoZoo.api && CryptoZoo.api.loadRanking) {
            try {
                const ranking = await CryptoZoo.api.loadRanking();
                if (Array.isArray(ranking) && ranking.length > 0) {
                    list.innerHTML = "";
                    ranking.forEach((player, index) => {
                        const li = document.createElement("li");
                        li.textContent = `${index + 1}. ${player.username} — ${CryptoZoo.formatNumber(player.coins || 0)} monet`;
                        list.appendChild(li);
                    });
                    return;
                }
            } catch (e) {
                console.error("Błąd rankingu:", e);
            }
        }

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
            tapBtn.onclick = () => this.click();
        }

        if (buyUpgradeBtn) {
            buyUpgradeBtn.onclick = () => this.buyClickUpgrade();
        }

        if (buyMonkeyBtn) {
            buyMonkeyBtn.onclick = () => this.buyAnimal("monkey");
        }

        if (buyPandaBtn) {
            buyPandaBtn.onclick = () => this.buyAnimal("panda");
        }

        if (buyLionBtn) {
            buyLionBtn.onclick = () => this.buyAnimal("lion");
        }

        if (upgradeMonkeyBtn) {
            upgradeMonkeyBtn.onclick = () => this.upgradeAnimal("monkey");
        }

        if (upgradePandaBtn) {
            upgradePandaBtn.onclick = () => this.upgradeAnimal("panda");
        }

        if (upgradeLionBtn) {
            upgradeLionBtn.onclick = () => this.upgradeAnimal("lion");
        }
    },

    startPassiveIncome() {
        if (this.passiveIncomeStarted) return;
        this.passiveIncomeStarted = true;

        setInterval(() => {
            const state = CryptoZoo.state;

            this.updateZooIncome();

            if (state.zooIncome > 0) {
                state.coins += state.zooIncome;
                state.level = this.getLevelFromCoins(state.coins);
                CryptoZoo.ui.render();
                this.saveGame();
            }
        }, CryptoZoo.config.passiveIncomeIntervalMs || 1000);
    }
};
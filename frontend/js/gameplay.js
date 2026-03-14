lwindow.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {
    passiveIncomeStarted: false,

    getEconomy() {
        return CryptoZoo.config.economy;
    },

    getAnimalsConfig() {
        return CryptoZoo.config.animals;
    },

    getAnimalConfig(type) {
        return this.getAnimalsConfig()[type];
    },

    getLevelFromCoins(coins) {
        const divider = this.getEconomy().levelDivider || 5000;
        return Math.floor(Math.sqrt(Math.max(0, Number(coins) || 0) / divider)) + 1;
    },

    createDefaultAnimalState() {
        return {
            count: 0,
            level: 1
        };
    },

    normalizeAnimals() {
        const state = CryptoZoo.state;
        const animalsConfig = this.getAnimalsConfig();

        if (!state.animals) {
            state.animals = {};
        }

        Object.keys(animalsConfig).forEach((type) => {
            if (!state.animals[type]) {
                state.animals[type] = this.createDefaultAnimalState();
            }

            state.animals[type].count = Number(state.animals[type].count) || 0;
            state.animals[type].level = Number(state.animals[type].level) || 1;
        });
    },

    getAnimalUpgradeCost(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = this.getAnimalConfig(type);

        if (!animal || !config) return 0;

        return Math.floor(config.upgradeBaseCost * Math.pow(animal.level, 2));
    },

    getAnimalIncome(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = this.getAnimalConfig(type);

        if (!animal || !config) return 0;

        return config.baseIncome * animal.level * animal.count;
    },

    updateZooIncome() {
        const state = CryptoZoo.state;
        const animalsConfig = this.getAnimalsConfig();

        let totalIncome = 0;

        Object.keys(animalsConfig).forEach((type) => {
            totalIncome += this.getAnimalIncome(type);
        });

        state.zooIncome = Math.floor(totalIncome);
    },

    recalculateCoreStats() {
        const state = CryptoZoo.state;

        this.normalizeAnimals();
        this.updateZooIncome();
        state.level = this.getLevelFromCoins(state.coins);
    },

    awardGemsForLevelUp(oldLevel, newLevel) {
        const economy = this.getEconomy();
        const gainedLevels = Math.max(0, newLevel - oldLevel);

        if (gainedLevels <= 0) return;

        const gemsAward = gainedLevels * (economy.gemsPerLevel || 1);
        CryptoZoo.state.gems += gemsAward;

        if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
            CryptoZoo.ui.showToast("Gems +" + gemsAward);
        }
    },

    async saveGame() {
        if (!CryptoZoo.api || !CryptoZoo.api.savePlayer) return;

        try {
            await CryptoZoo.api.savePlayer();
        } catch (error) {
            console.error("Błąd zapisu:", error);
        }
    },

    async loadPlayerState() {
        const economy = this.getEconomy();

        if (!CryptoZoo.api || !CryptoZoo.api.loadPlayer) {
            this.normalizeAnimals();
            this.recalculateCoreStats();
            return;
        }

        try {
            const user = await CryptoZoo.api.loadPlayer();

            if (!user) {
                this.normalizeAnimals();
                this.recalculateCoreStats();
                return;
            }

            const state = CryptoZoo.state;

            state.coins = Number(user.coins) || economy.startCoins || 0;
            state.gems = Number(user.gems) || economy.startGems || 0;
            state.coinsPerClick = Number(user.coinsPerClick) || economy.startCoinsPerClick || 1;
            state.upgradeCost = Number(user.upgradeCost) || economy.startUpgradeCost || 50;
            state.animals = user.animals || state.animals || {};

            this.normalizeAnimals();
            this.recalculateCoreStats();
        } catch (error) {
            console.error("Błąd loadPlayerState:", error);
            this.normalizeAnimals();
            this.recalculateCoreStats();
        }
    },

    click() {
        const state = CryptoZoo.state;
        const oldLevel = state.level;

        state.coins += state.coinsPerClick;
        state.level = this.getLevelFromCoins(state.coins);

        this.awardGemsForLevelUp(oldLevel, state.level);

        if (CryptoZoo.ui && CryptoZoo.ui.render) {
            CryptoZoo.ui.render();
        }

        if (CryptoZoo.ui && CryptoZoo.ui.animateCoinsBurst) {
            CryptoZoo.ui.animateCoinsBurst();
        }

        this.saveGame();
    },

    buyClickUpgrade() {
        const state = CryptoZoo.state;
        const economy = this.getEconomy();

        if (state.coins < state.upgradeCost) {
            if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
                CryptoZoo.ui.showToast("Za mało monet");
            }
            return;
        }

        state.coins -= state.upgradeCost;
        state.coinsPerClick += 1;
        state.upgradeCost = Math.floor(state.upgradeCost * (economy.clickUpgradeMultiplier || 2.4));
        state.level = this.getLevelFromCoins(state.coins);

        if (CryptoZoo.ui && CryptoZoo.ui.render) {
            CryptoZoo.ui.render();
        }

        this.saveGame();
    },

    buyAnimal(type) {
        const state = CryptoZoo.state;
        const config = this.getAnimalConfig(type);

        if (!config) return;

        if (state.coins < config.buyCost) {
            if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
                CryptoZoo.ui.showToast("Za mało monet");
            }
            return;
        }

        if (!state.animals[type]) {
            state.animals[type] = this.createDefaultAnimalState();
        }

        state.coins -= config.buyCost;
        state.animals[type].count += 1;

        this.recalculateCoreStats();

        if (CryptoZoo.ui && CryptoZoo.ui.render) {
            CryptoZoo.ui.render();
        }

        this.saveGame();
    },

    upgradeAnimal(type) {
        const state = CryptoZoo.state;
        const cost = this.getAnimalUpgradeCost(type);

        if (!state.animals[type] || state.animals[type].count <= 0) {
            if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
                CryptoZoo.ui.showToast("Najpierw kup zwierzę");
            }
            return;
        }

        if (state.coins < cost) {
            if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
                CryptoZoo.ui.showToast("Za mało monet");
            }
            return;
        }

        state.coins -= cost;
        state.animals[type].level += 1;

        this.recalculateCoreStats();

        if (CryptoZoo.ui && CryptoZoo.ui.render) {
            CryptoZoo.ui.render();
        }

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
                        li.textContent = `${index + 1}. ${player.username || "Gracz"} — ${CryptoZoo.formatNumber(player.coins || 0)} monet`;
                        list.appendChild(li);
                    });

                    return;
                }
            } catch (error) {
                console.error("Błąd rankingu:", error);
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
            btn.onclick = () => {
                const screenId = btn.getAttribute("data-screen");

                if (CryptoZoo.ui && CryptoZoo.ui.showScreen) {
                    CryptoZoo.ui.showScreen(screenId);
                }

                if (screenId === "ranking") {
                    this.loadRanking();
                }
            };
        });
    },

    bindActions() {
        const tapBtn = document.getElementById("tap-btn");
        const buyUpgradeBtn = document.getElementById("buy-upgrade-btn");

        if (tapBtn) {
            tapBtn.onclick = () => this.click();
        }

        if (buyUpgradeBtn) {
            buyUpgradeBtn.onclick = () => this.buyClickUpgrade();
        }

        Object.keys(this.getAnimalsConfig()).forEach((type) => {
            const buyBtn = document.getElementById(`buy-${type}-btn`);
            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);

            if (buyBtn) {
                buyBtn.onclick = () => this.buyAnimal(type);
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = () => this.upgradeAnimal(type);
            }
        });
    },

    startPassiveIncome() {
        if (this.passiveIncomeStarted) return;
        this.passiveIncomeStarted = true;

        const intervalMs = this.getEconomy().passiveIncomeIntervalMs || 1000;

        setInterval(() => {
            const state = CryptoZoo.state;
            const oldLevel = state.level;

            this.updateZooIncome();

            if (state.zooIncome > 0) {
                state.coins += state.zooIncome;
                state.level = this.getLevelFromCoins(state.coins);

                this.awardGemsForLevelUp(oldLevel, state.level);

                if (CryptoZoo.ui && CryptoZoo.ui.render) {
                    CryptoZoo.ui.render();
                }

                this.saveGame();
            }
        }, intervalMs);
    }
};
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {
    passiveIncomeStarted: false,

    getEconomy() {
        return CryptoZoo.config.economy;
    },

    getAnimalsConfig() {
        return CryptoZoo.config.animals || {};
    },

    getAnimalConfig(type) {
        return this.getAnimalsConfig()[type];
    },

    createDefaultAnimalState() {
        return {
            count: 0,
            level: 1
        };
    },

    getLevelFromCoins(coins) {
        const divider = this.getEconomy().levelDivider || 20000;
        return Math.floor(Math.sqrt(Math.max(0, Number(coins) || 0) / divider)) + 1;
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

        return Math.floor((config.upgradeBaseCost || 100) * Math.pow(animal.level, 2));
    },

    getAnimalIncome(type) {
        const animal = CryptoZoo.state.animals[type];
        const config = this.getAnimalConfig(type);

        if (!animal || !config) return 0;

        return (config.baseIncome || 0) * animal.level * animal.count;
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
        const gainedLevels = Math.max(0, newLevel - oldLevel);
        const gemsPerLevel = this.getEconomy().gemsPerLevel || 1;

        if (gainedLevels > 0) {
            CryptoZoo.state.gems += gainedLevels * gemsPerLevel;
        }
    },

    applyOfflineEarnings() {
        const now = Date.now();
        const lastLogin = Number(CryptoZoo.state.lastLogin) || now;
        const maxSeconds = this.getEconomy().offlineMaxSeconds || 28800;

        let diffSeconds = Math.floor((now - lastLogin) / 1000);
        if (diffSeconds < 0) diffSeconds = 0;

        const offlineSeconds = Math.min(diffSeconds, maxSeconds);
        const reward = Math.floor((CryptoZoo.state.zooIncome || 0) * offlineSeconds);

        if (reward > 0) {
            CryptoZoo.state.coins += reward;
            CryptoZoo.ui.showToast(`Offline zarobek: ${CryptoZoo.formatNumber(reward)}`);
        }

        CryptoZoo.state.lastLogin = now;
    },

    async saveGame() {
        CryptoZoo.state.lastLogin = Date.now();

        if (CryptoZoo.api && CryptoZoo.api.savePlayer) {
            await CryptoZoo.api.savePlayer();
        }
    },

    async loadPlayerState() {
        const economy = this.getEconomy();

        try {
            const user = await CryptoZoo.api.loadPlayer();

            if (!user) {
                this.normalizeAnimals();
                this.recalculateCoreStats();
                this.applyOfflineEarnings();
                return;
            }

            const state = CryptoZoo.state;

            state.coins = Number(user.coins) || economy.startCoins || 0;
            state.gems = Number(user.gems) || economy.startGems || 0;
            state.level = Number(user.level) || economy.startLevel || 1;
            state.coinsPerClick = Number(user.coinsPerClick) || economy.startCoinsPerClick || 1;
            state.upgradeCost = Number(user.upgradeCost) || economy.startUpgradeCost || 50;
            state.animals = user.animals || state.animals || {};
            state.expedition = user.expedition || null;
            state.lastLogin = Number(user.lastLogin) || Date.now();

            this.normalizeAnimals();
            this.recalculateCoreStats();
            this.applyOfflineEarnings();
        } catch (error) {
            console.error("LOAD PLAYER STATE ERROR:", error);
            this.normalizeAnimals();
            this.recalculateCoreStats();
            this.applyOfflineEarnings();
        }
    },

    click() {
        const state = CryptoZoo.state;
        const oldLevel = state.level;

        state.coins += state.coinsPerClick;
        state.level = this.getLevelFromCoins(state.coins);

        this.awardGemsForLevelUp(oldLevel, state.level);

        CryptoZoo.ui.render();
        CryptoZoo.ui.animateCoinsBurst();
        this.saveGame();
    },

    buyClickUpgrade() {
        const state = CryptoZoo.state;
        const economy = this.getEconomy();

        if (state.coins < state.upgradeCost) {
            CryptoZoo.ui.showToast("Za mało monet");
            return;
        }

        state.coins -= state.upgradeCost;
        state.coinsPerClick += 1;
        state.upgradeCost = Math.floor(state.upgradeCost * (economy.clickUpgradeMultiplier || 2.2));

        this.recalculateCoreStats();
        CryptoZoo.ui.showToast("Kupiono ulepszenie kliku");
        CryptoZoo.ui.render();
        this.saveGame();
    },

    buyAnimal(type) {
        const state = CryptoZoo.state;
        const config = this.getAnimalConfig(type);

        if (!config) return;

        if (state.coins < config.buyCost) {
            CryptoZoo.ui.showToast("Za mało monet");
            return;
        }

        if (!state.animals[type]) {
            state.animals[type] = this.createDefaultAnimalState();
        }

        state.coins -= config.buyCost;
        state.animals[type].count += 1;

        this.recalculateCoreStats();
        CryptoZoo.ui.showToast(`Kupiono: ${config.name}`);
        CryptoZoo.ui.render();
        this.saveGame();
    },

    upgradeAnimal(type) {
        const state = CryptoZoo.state;
        const cost = this.getAnimalUpgradeCost(type);
        const config = this.getAnimalConfig(type);

        if (!state.animals[type] || state.animals[type].count <= 0) {
            CryptoZoo.ui.showToast("Najpierw kup zwierzę");
            return;
        }

        if (state.coins < cost) {
            CryptoZoo.ui.showToast("Za mało monet");
            return;
        }

        state.coins -= cost;
        state.animals[type].level += 1;

        this.recalculateCoreStats();
        CryptoZoo.ui.showToast(`Ulepszono: ${config.name}`);
        CryptoZoo.ui.render();
        this.saveGame();
    },

    startExpedition(type) {
        const expConfig = (CryptoZoo.config.expeditions || []).find(function (e) {
            return e.id === type;
        });

        if (!expConfig) return;

        if (CryptoZoo.state.expedition) {
            CryptoZoo.ui.showToast("Ekspedycja już trwa");
            return;
        }

        const endTime = Date.now() + (expConfig.duration * 1000);

        CryptoZoo.state.expedition = {
            type: type,
            endTime: endTime
        };

        CryptoZoo.ui.showToast("Ekspedycja rozpoczęta");
        CryptoZoo.ui.render();
        this.saveGame();
    },

    collectExpedition() {
        const expedition = CryptoZoo.state.expedition;

        if (!expedition) return;

        const expConfig = (CryptoZoo.config.expeditions || []).find(function (e) {
            return e.id === expedition.type;
        });

        if (!expConfig) return;

        if (Date.now() < expedition.endTime) {
            CryptoZoo.ui.showToast("Ekspedycja jeszcze trwa");
            return;
        }

        CryptoZoo.state.coins += Number(expConfig.rewardCoins) || 0;
        CryptoZoo.state.gems += Number(expConfig.rewardGems) || 0;
        CryptoZoo.state.expedition = null;

        this.recalculateCoreStats();
        CryptoZoo.ui.showToast("Nagroda z ekspedycji odebrana");
        CryptoZoo.ui.render();
        this.saveGame();
    },

    async loadRanking() {
        const list = document.getElementById("ranking-list");
        if (!list) return;

        const ranking = await CryptoZoo.api.loadRanking();

        if (!ranking.length) {
            list.innerHTML = `
                <li>1. Gracz testowy — 12.50K monet</li>
                <li>2. CryptoPanda — 8.20K monet</li>
                <li>3. JungleLion — 4.60K monet</li>
            `;
            return;
        }

        list.innerHTML = "";

        ranking.forEach(function (player, index) {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${player.username || "Gracz"} — ${CryptoZoo.formatNumber(player.coins || 0)} monet`;
            list.appendChild(li);
        });
    },

    bindNavigation() {
        const buttons = document.querySelectorAll(".nav-btn");

        buttons.forEach((btn) => {
            btn.onclick = () => {
                const screenId = btn.getAttribute("data-screen");
                CryptoZoo.ui.showScreen(screenId);

                if (screenId === "ranking") {
                    this.loadRanking();
                }

                if (screenId === "expeditions") {
                    CryptoZoo.ui.renderExpeditions();
                }
            };
        });
    },

    bindAnimalButtons() {
        const animalsConfig = this.getAnimalsConfig();

        Object.keys(animalsConfig).forEach((type) => {
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

    bindActions() {
        const tapBtn = document.getElementById("tap-btn");
        const buyUpgradeBtn = document.getElementById("buy-upgrade-btn");

        if (tapBtn) {
            tapBtn.onclick = () => this.click();
        }

        if (buyUpgradeBtn) {
            buyUpgradeBtn.onclick = () => this.buyClickUpgrade();
        }

        this.bindAnimalButtons();
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

                CryptoZoo.ui.render();
                this.saveGame();
            } else if (state.expedition) {
                CryptoZoo.ui.renderExpeditions();
            }
        }, intervalMs);
    }
};
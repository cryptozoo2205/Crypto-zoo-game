window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {
    passiveIncomeStarted: false,

    getEconomy() {
        return CryptoZoo.config.economy;
    },

    getAnimalConfig(type) {
        return CryptoZoo.config.animals[type];
    },

    getLevelFromCoins(coins) {
        const divider = this.getEconomy().levelDivider || 5000;
        return Math.floor(Math.sqrt(Math.max(0, Number(coins) || 0) / divider)) + 1;
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

        state.zooIncome =
            this.getAnimalIncome("monkey") +
            this.getAnimalIncome("panda") +
            this.getAnimalIncome("lion");
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

    async saveGame() {
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
                return;
            }

            const state = CryptoZoo.state;

            state.coins = Number(user.coins) || economy.startCoins || 0;
            state.gems = Number(user.gems) || economy.startGems || 0;
            state.level = Number(user.level) || economy.startLevel || 1;
            state.coinsPerClick = Number(user.coinsPerClick) || economy.startCoinsPerClick || 1;
            state.upgradeCost = Number(user.upgradeCost) || economy.startUpgradeCost || 50;
            state.animals = user.animals || state.animals || {};

            this.normalizeAnimals();
            this.recalculateCoreStats();
        } catch (error) {
            console.error("LOAD PLAYER STATE ERROR:", error);
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
        state.upgradeCost = Math.floor(state.upgradeCost * (economy.clickUpgradeMultiplier || 2.4));

        this.recalculateCoreStats();
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

        state.coins -= config.buyCost;
        state.animals[type].count += 1;

        this.recalculateCoreStats();
        CryptoZoo.ui.render();
        this.saveGame();
    },

    upgradeAnimal(type) {
        const state = CryptoZoo.state;
        const cost = this.getAnimalUpgradeCost(type);

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
        ranking.forEach((player, index) => {
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
            };
        });
    },

    bindActions() {
        const tapBtn = document.getElementById("tap-btn");
        const buyUpgradeBtn = document.getElementById("buy-upgrade-btn");

        if (tapBtn) tapBtn.onclick = () => this.click();
        if (buyUpgradeBtn) buyUpgradeBtn.onclick = () => this.buyClickUpgrade();

        const buyMonkeyBtn = document.getElementById("buy-monkey-btn");
        const buyPandaBtn = document.getElementById("buy-panda-btn");
        const buyLionBtn = document.getElementById("buy-lion-btn");

        const upgradeMonkeyBtn = document.getElementById("upgrade-monkey-btn");
        const upgradePandaBtn = document.getElementById("upgrade-panda-btn");
        const upgradeLionBtn = document.getElementById("upgrade-lion-btn");

        if (buyMonkeyBtn) buyMonkeyBtn.onclick = () => this.buyAnimal("monkey");
        if (buyPandaBtn) buyPandaBtn.onclick = () => this.buyAnimal("panda");
        if (buyLionBtn) buyLionBtn.onclick = () => this.buyAnimal("lion");

        if (upgradeMonkeyBtn) upgradeMonkeyBtn.onclick = () => this.upgradeAnimal("monkey");
        if (upgradePandaBtn) upgradePandaBtn.onclick = () => this.upgradeAnimal("panda");
        if (upgradeLionBtn) upgradeLionBtn.onclick = () => this.upgradeAnimal("lion");
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
            }
        }, intervalMs);
    }
};
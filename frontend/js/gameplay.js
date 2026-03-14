
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {
    normalizeAnimal(value) {
        if (typeof value === "number") {
            return { count: value, level: 1 };
        }

        return {
            count: Number(value && value.count) || 0,
            level: Number(value && value.level) || 1
        };
    },

    normalizeAnimals() {
        const state = CryptoZoo.state;

        state.animals = {
            monkey: this.normalizeAnimal(state.animals.monkey),
            panda: this.normalizeAnimal(state.animals.panda),
            lion: this.normalizeAnimal(state.animals.lion)
        };
    },

    updateLevel() {
        CryptoZoo.state.level = Math.floor(CryptoZoo.state.coins / 25) + 1;
    },

    getAnimalIncome(animalKey) {
        const state = CryptoZoo.state;
        const config = CryptoZoo.config.animalConfig[animalKey];
        const animal = state.animals[animalKey];

        return animal.count * animal.level * config.baseIncome * config.rarityMultiplier;
    },

    updateZooIncome() {
        const state = CryptoZoo.state;

        state.zooIncome =
            this.getAnimalIncome("monkey") +
            this.getAnimalIncome("panda") +
            this.getAnimalIncome("lion");

        state.zooIncome = Math.floor(state.zooIncome);
    },

    getAnimalsTotal() {
        const animals = CryptoZoo.state.animals;
        return animals.monkey.count + animals.panda.count + animals.lion.count;
    },

    getCollectionFoundCount() {
        const animals = CryptoZoo.state.animals;
        let found = 0;

        if (animals.monkey.count > 0) found += 1;
        if (animals.panda.count > 0) found += 1;
        if (animals.lion.count > 0) found += 1;

        return found;
    },

    getAnimalUpgradeCost(animalKey) {
        const state = CryptoZoo.state;
        const config = CryptoZoo.config.animalConfig[animalKey];
        return config.upgradeBaseCost * state.animals[animalKey].level;
    },

    async applyOfflineIncome(user) {
        const state = CryptoZoo.state;

        if (!user || !user.lastLogin) return;

        const last = new Date(user.lastLogin).getTime();
        const now = Date.now();

        let secondsOffline = Math.floor((now - last) / 1000);

        if (secondsOffline > CryptoZoo.config.maxOfflineSeconds) {
            secondsOffline = CryptoZoo.config.maxOfflineSeconds;
        }

        const offlineCoins = secondsOffline * state.zooIncome;

        if (offlineCoins > 0) {
            state.coins += offlineCoins;
            CryptoZoo.ui.showToast(`Zarobiłeś offline: ${offlineCoins} monet`);
        }
    },

    async loadPlayerState() {
        const state = CryptoZoo.state;
        const user = await CryptoZoo.api.loadPlayer();

        if (!user) return;

        state.coins = Number(user.coins) || 0;
        state.level = Number(user.level) || 1;
        state.coinsPerClick = Number(user.coinsPerClick) || 1;
        state.upgradeCost = Number(user.upgradeCost) || 50;
        state.animals = user.animals || state.animals;

        this.normalizeAnimals();
        this.updateZooIncome();
        await this.applyOfflineIncome(user);
        this.updateLevel();
        CryptoZoo.ui.render();
        await CryptoZoo.api.savePlayer();
    },

    async loadRanking() {
        const ranking = await CryptoZoo.api.loadRanking();
        const rankingList = CryptoZoo.state.els.rankingList;
        if (!rankingList) return;

        rankingList.innerHTML = "";

        ranking.forEach(function (player, index) {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${player.username} — ${player.coins} monet`;
            rankingList.appendChild(li);
        });
    },

    async tapCoins() {
        const state = CryptoZoo.state;

        state.coins += state.coinsPerClick;
        this.updateLevel();
        CryptoZoo.ui.render();
        CryptoZoo.ui.animateCoinsBurst();
        await CryptoZoo.api.savePlayer();
    },

    async buyClickUpgrade() {
        const state = CryptoZoo.state;

        if (state.coins < state.upgradeCost) {
            CryptoZoo.ui.showToast("Za mało monet na ulepszenie.");
            return;
        }

        state.coins -= state.upgradeCost;
        state.coinsPerClick += 1;
        state.upgradeCost = Math.floor(state.upgradeCost * 1.8);

        this.updateLevel();
        CryptoZoo.ui.render();
        await CryptoZoo.api.savePlayer();
        CryptoZoo.ui.showToast("Kupiono ulepszenie kliknięcia.");
    },

    async buyAnimal(animalKey) {
        const state = CryptoZoo.state;
        const config = CryptoZoo.config.animalConfig[animalKey];

        if (state.coins < config.buyCost) {
            CryptoZoo.ui.showToast(`Za mało monet na ${config.buyName}.`);
            return;
        }

        state.coins -= config.buyCost;
        state.animals[animalKey].count += 1;

        this.updateZooIncome();
        this.updateLevel();
        CryptoZoo.ui.render();
        await CryptoZoo.api.savePlayer();
        CryptoZoo.ui.showToast(`Kupiono ${config.buyName}.`);
    },

    async upgradeAnimal(animalKey) {
        const state = CryptoZoo.state;
        const cost = this.getAnimalUpgradeCost(animalKey);

        if (state.animals[animalKey].count <= 0) {
            CryptoZoo.ui.showToast("Najpierw musisz kupić to zwierzę.");
            return;
        }

        if (state.coins < cost) {
            CryptoZoo.ui.showToast("Za mało monet na ulepszenie zwierzęcia.");
            return;
        }

        state.coins -= cost;
        state.animals[animalKey].level += 1;

        this.updateZooIncome();
        this.updateLevel();
        CryptoZoo.ui.render();
        await CryptoZoo.api.savePlayer();
        CryptoZoo.ui.showToast("Ulepszono zwierzę.");
    },

    bindNavigation() {
        CryptoZoo.state.els.navButtons.forEach(function (btn) {
            btn.addEventListener("click", async function () {
                const screenId = btn.dataset.screen;
                CryptoZoo.ui.showScreen(screenId);

                if (screenId === "ranking") {
                    await CryptoZoo.gameplay.loadRanking();
                }
            });
        });
    },

    bindActions() {
        const els = CryptoZoo.state.els;

        els.tapBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.tapCoins();
        });

        els.buyUpgradeBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.buyClickUpgrade();
        });

        els.buyMonkeyBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.buyAnimal("monkey");
        });

        els.buyPandaBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.buyAnimal("panda");
        });

        els.buyLionBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.buyAnimal("lion");
        });

        els.upgradeMonkeyBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.upgradeAnimal("monkey");
        });

        els.upgradePandaBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.upgradeAnimal("panda");
        });

        els.upgradeLionBtn.addEventListener("click", async function () {
            await CryptoZoo.gameplay.upgradeAnimal("lion");
        });
    },

    startPassiveIncome() {
        setInterval(async function () {
            const state = CryptoZoo.state;

            if (state.zooIncome > 0) {
                state.coins += state.zooIncome;
                CryptoZoo.gameplay.updateLevel();
                CryptoZoo.ui.render();
                await CryptoZoo.api.savePlayer();
            }
        }, CryptoZoo.config.passiveIncomeIntervalMs);
    }
};
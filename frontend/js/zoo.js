window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.zoo = {
    normalizeAnimals() {
        const state = window.CryptoZoo.state;

        function normalizeAnimal(value) {
            if (typeof value === "number") {
                return {
                    count: value,
                    level: 1
                };
            }

            return {
                count: Number(value && value.count) || 0,
                level: Number(value && value.level) || 1
            };
        }

        state.animals = {
            monkey: normalizeAnimal(state.animals.monkey),
            panda: normalizeAnimal(state.animals.panda),
            lion: normalizeAnimal(state.animals.lion)
        };
    },

    isDiscovered(animalKey) {
        return this.getAnimalCount(animalKey) > 0;
    },

    getAnimalCount(animalKey) {
        const animal = window.CryptoZoo.state.animals[animalKey];
        return animal ? animal.count : 0;
    },

    getAnimalLevel(animalKey) {
        const animal = window.CryptoZoo.state.animals[animalKey];
        return animal ? animal.level : 1;
    },

    getAnimalIncome(animalKey) {
        const state = window.CryptoZoo.state;
        const config = window.CryptoZoo.config.animals[animalKey];
        const animal = state.animals[animalKey];

        return animal.count * config.baseIncome * animal.level * config.rarityMultiplier;
    },

    updateZooIncome() {
        const state = window.CryptoZoo.state;

        state.zooIncome =
            this.getAnimalIncome("monkey") +
            this.getAnimalIncome("panda") +
            this.getAnimalIncome("lion");

        state.zooIncome = Math.floor(state.zooIncome);
    },

    getAnimalsTotal() {
        return this.getAnimalCount("monkey") + this.getAnimalCount("panda") + this.getAnimalCount("lion");
    },

    getCollectionFoundCount() {
        let found = 0;
        if (this.isDiscovered("monkey")) found += 1;
        if (this.isDiscovered("panda")) found += 1;
        if (this.isDiscovered("lion")) found += 1;
        return found;
    },

    getAnimalUpgradeCost(animalKey) {
        const config = window.CryptoZoo.config.animals[animalKey];
        return config.upgradeBaseCost * this.getAnimalLevel(animalKey);
    },

    async buyAnimal(animalKey) {
        const state = window.CryptoZoo.state;
        const config = window.CryptoZoo.config.animals[animalKey];
        const ui = window.CryptoZoo.ui;
        const api = window.CryptoZoo.api;
        const app = window.CryptoZoo.app;

        if (!config) {
            console.error("Brak configu dla:", animalKey);
            return;
        }

        if (state.coins < config.buyCost) {
            ui.showToast(`Za mało monet na ${config.buyName}.`);
            return;
        }

        state.coins -= config.buyCost;
        state.animals[animalKey].count += 1;

        this.updateZooIncome();
        app.updateLevel();
        ui.render();
        await api.savePlayer();
        ui.showToast(`Kupiono ${config.buyName}.`);
    },

    async upgradeAnimal(animalKey) {
        const state = window.CryptoZoo.state;
        const ui = window.CryptoZoo.ui;
        const api = window.CryptoZoo.api;
        const app = window.CryptoZoo.app;
        const cost = this.getAnimalUpgradeCost(animalKey);

        if (this.getAnimalCount(animalKey) <= 0) {
            ui.showToast("Najpierw musisz kupić to zwierzę.");
            return;
        }

        if (state.coins < cost) {
            ui.showToast("Za mało monet na ulepszenie zwierzęcia.");
            return;
        }

        state.coins -= cost;
        state.animals[animalKey].level += 1;

        this.updateZooIncome();
        app.updateLevel();
        ui.render();
        await api.savePlayer();
        ui.showToast("Ulepszono zwierzę.");
    }
};
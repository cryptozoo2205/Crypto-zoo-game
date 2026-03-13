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
                count: Number(value?.count) || 0,
                level: Number(value?.level) || 1
            };
        }

        state.animals = {
            monkey: normalizeAnimal(state.animals?.monkey),
            panda: normalizeAnimal(state.animals?.panda),
            lion: normalizeAnimal(state.animals?.lion)
        };
    },

    isDiscovered(animalKey) {
        return (window.CryptoZoo.state.animals[animalKey]?.count || 0) > 0;
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

        state.zooIncome = Math.floor(state.zoo
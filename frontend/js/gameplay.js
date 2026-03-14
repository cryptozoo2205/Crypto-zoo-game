window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.gameplay = {

    getLevelFromCoins(coins){

        return Math.floor(Math.sqrt(coins / 100)) + 1;

    },

    normalizeAnimals(){

        const state = CryptoZoo.state;

        if(!state.animals){

            state.animals = {

                monkey:{count:0,level:1},
                panda:{count:0,level:1},
                lion:{count:0,level:1}

            }

        }

    },

    getAnimalUpgradeCost(type){

        const animal = CryptoZoo.state.animals[type];
        const config = CryptoZoo.config.animalConfig[type];

        return Math.floor(config.upgradeBaseCost * (animal.level * 1.8));

    },

    getAnimalIncome(type){

        const animal = CryptoZoo.state.animals[type];
        const config = CryptoZoo.config.animalConfig[type];

        return config.baseIncome * animal.level * animal.count;

    },

    updateZooIncome(){

        const state = CryptoZoo.state;

        const income =
        this.getAnimalIncome("monkey") +
        this.getAnimalIncome("panda") +
        this.getAnimalIncome("lion");

        state.zooIncome = income;

    },

    startPassiveIncome(){

        setInterval(()=>{

            const state = CryptoZoo.state;

            state.coins += state.zooIncome;

            state.level = this.getLevelFromCoins(state.coins);

            CryptoZoo.ui.render();

        },CryptoZoo.config.passiveIncomeIntervalMs)

    },

    click(){

        const state = CryptoZoo.state;

        state.coins += state.coinsPerClick;

        state.level = this.getLevelFromCoins(state.coins);

        CryptoZoo.ui.render();

        CryptoZoo.ui.animateCoinsBurst();

    }

}
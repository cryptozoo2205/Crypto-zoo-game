window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.config = {

    clickUpgradeBaseCost: 50,

    animalConfig: {

        monkey: {
            name: "Małpa",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150
        },

        panda: {
            name: "Panda",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600
        },

        lion: {
            name: "Lew",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800
        }

    },

    passiveIncomeIntervalMs: 1000
};


window.CryptoZoo.formatNumber = function(num){

    if(num >= 1000000000000){
        return (num/1000000000000).toFixed(2) + "T";
    }

    if(num >= 1000000000){
        return (num/1000000000).toFixed(2) + "B";
    }

    if(num >= 1000000){
        return (num/1000000).toFixed(2) + "M";
    }

    if(num >= 1000){
        return (num/1000).toFixed(2) + "K";
    }

    return Math.floor(num).toString();
}
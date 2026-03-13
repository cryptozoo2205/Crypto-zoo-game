window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.state = {
    telegramId: localStorage.getItem("telegramId") || String(Date.now()),
    coins: 0,
    level: 1,
    coinsPerClick: 1,
    upgradeCost: 50,
    zooIncome: 0,
    animals: {
        monkey: { count: 0, level: 1 },
        panda: { count: 0, level: 1 },
        lion: { count: 0, level: 1 }
    }
};

localStorage.setItem("telegramId", window.CryptoZoo.state.telegramId);
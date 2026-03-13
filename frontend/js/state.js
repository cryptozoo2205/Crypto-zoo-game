window.CryptoZoo = window.CryptoZoo || {};

const savedTelegramId = localStorage.getItem("telegramId");
const telegramId = savedTelegramId || String(Date.now());

localStorage.setItem("telegramId", telegramId);

window.CryptoZoo.state = {
    telegramId: telegramId,
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
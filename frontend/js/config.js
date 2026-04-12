window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    apiBase: "https://cryptozoo.pl/api",
    telegramBotUsername: "cryptzoo_bot",

    // 🔥 USD RATE (z backendu)
    rewardToUsdRate: 0.05,

    limits: {
        maxOwnedPerAnimal: 50,
        maxLevelPerAnimal: 100
    },

    clickValue: 1,

    animals: {
        monkey: { name: "Monkey", namePl: "Małpa", nameEn: "Monkey", asset: "monkey", buyCost: 120, baseIncome: 1 },
        panda: { name: "Panda", namePl: "Panda", nameEn: "Panda", asset: "panda", buyCost: 520, baseIncome: 5 },
        lion: { name: "Lion", namePl: "Lew", nameEn: "Lion", asset: "lion", buyCost: 2200, baseIncome: 14 },
        tiger: { name: "Tiger", namePl: "Tygrys", nameEn: "Tiger", asset: "tiger", buyCost: 9000, baseIncome: 36 },
        elephant: { name: "Elephant", namePl: "Słoń", nameEn: "Elephant", asset: "elephant", buyCost: 36000, baseIncome: 90 },
        giraffe: { name: "Giraffe", namePl: "Żyrafa", nameEn: "Giraffe", asset: "giraffe", buyCost: 145000, baseIncome: 220 },
        zebra: { name: "Zebra", namePl: "Zebra", nameEn: "Zebra", asset: "zebra", buyCost: 580000, baseIncome: 520 },
        hippo: { name: "Hippo", namePl: "Hipopotam", nameEn: "Hippo", asset: "hippo", buyCost: 2300000, baseIncome: 1200 },
        penguin: { name: "Penguin", namePl: "Pingwin", nameEn: "Penguin", asset: "penguin", buyCost: 9200000, baseIncome: 2700 },
        bear: { name: "Bear", namePl: "Niedźwiedź", nameEn: "Bear", asset: "bear", buyCost: 37000000, baseIncome: 6000 },
        crocodile: { name: "Crocodile", namePl: "Krokodyl", nameEn: "Crocodile", asset: "crocodile", buyCost: 148000000, baseIncome: 13200 },
        kangaroo: { name: "Kangaroo", namePl: "Kangur", nameEn: "Kangaroo", asset: "kangaroo", buyCost: 590000000, baseIncome: 29000 },
        wolf: { name: "Wolf", namePl: "Wilk", nameEn: "Wolf", asset: "wolf", buyCost: 2360000000, baseIncome: 64000 }
    },

    expeditions: [
        { id: "forest", name: "Magic Forest", namePl: "Magiczny Las", nameEn: "Magic Forest", duration: 300, baseCoins: 80, startCostCoins: 50, gemChance: 0.01, rareChance: 0.12, epicChance: 0.01, unlockLevel: 1 },
        { id: "river", name: "Crystal River", namePl: "Kryształowa Rzeka", nameEn: "Crystal River", duration: 900, baseCoins: 320, startCostCoins: 250, gemChance: 0.015, rareChance: 0.13, epicChance: 0.015, unlockLevel: 3 },
        { id: "volcano", name: "Golden Volcano", namePl: "Złoty Wulkan", nameEn: "Golden Volcano", duration: 1800, baseCoins: 900, startCostCoins: 750, gemChance: 0.02, rareChance: 0.14, epicChance: 0.02, unlockLevel: 5 },
        { id: "canyon", name: "Sunstone Canyon", namePl: "Kanion Słonecznego Kamienia", nameEn: "Sunstone Canyon", duration: 3600, baseCoins: 2400, startCostCoins: 2000, gemChance: 0.025, rareChance: 0.15, epicChance: 0.025, unlockLevel: 7 },
        { id: "glacier", name: "Frozen Glacier", namePl: "Zamarznięty Lodowiec", nameEn: "Frozen Glacier", duration: 7200, baseCoins: 5800, startCostCoins: 5000, gemChance: 0.03, rareChance: 0.16, epicChance: 0.03, unlockLevel: 10 },
        { id: "jungle", name: "Emerald Jungle", namePl: "Szmaragdowa Dżungla", nameEn: "Emerald Jungle", duration: 14400, baseCoins: 13800, startCostCoins: 12000, gemChance: 0.04, rareChance: 0.17, epicChance: 0.04, unlockLevel: 14 },
        { id: "temple", name: "Ancient Temple", namePl: "Starożytna Świątynia", nameEn: "Ancient Temple", duration: 28800, baseCoins: 32000, startCostCoins: 28000, gemChance: 0.05, rareChance: 0.18, epicChance: 0.05, unlockLevel: 18 },
        { id: "oasis", name: "Royal Oasis", namePl: "Królewska Oaza", nameEn: "Royal Oasis", duration: 43200, baseCoins: 68000, startCostCoins: 60000, gemChance: 0.06, rareChance: 0.19, epicChance: 0.06, unlockLevel: 22 },
        { id: "kingdom", name: "Lost Beast Kingdom", namePl: "Zaginione Królestwo Bestii", nameEn: "Lost Beast Kingdom", duration: 86400, baseCoins: 145000, startCostCoins: 125000, gemChance: 0.07, rareChance: 0.20, epicChance: 0.07, unlockLevel: 28 }
    ]
};

/* =========================
   FORMAT NUMBER (K, M, B)
========================= */

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;
    const abs = Math.abs(num);

    const suffixes = [
        { value: 1e12, suffix: "T" },
        { value: 1e9, suffix: "B" },
        { value: 1e6, suffix: "M" },
        { value: 1e3, suffix: "K" }
    ];

    for (const item of suffixes) {
        if (abs >= item.value) {
            return (num / item.value).toFixed(1).replace(/\.0$/, "") + item.suffix;
        }
    }

    return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

/* =========================
   FORMAT USD 🔥
========================= */

CryptoZoo.formatUsd = function (rewardValue) {
    const rate = Number(CryptoZoo.config?.rewardToUsdRate || 0);
    const usd = (Number(rewardValue) || 0) * rate;

    return "$" + usd.toFixed(2);
};
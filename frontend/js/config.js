window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    apiBase: "https://cryptozoo.pl/api",
    telegramBotUsername: "cryptzoo_bot",
    rewardToUsdRate: 0.05,

    limits: {
        maxOwnedPerAnimal: 20,
        maxLevelPerAnimal: 25
    },

    clickValue: 1,

    animals: {
        monkey: {
            name: "Monkey",
            namePl: "Małpa",
            nameEn: "Monkey",
            asset: "monkey",
            buyCost: 150,
            baseIncome: 1,
            unlockLevel: 1
        },
        panda: {
            name: "Panda",
            namePl: "Panda",
            nameEn: "Panda",
            asset: "panda",
            buyCost: 850,
            baseIncome: 4,
            unlockLevel: 3
        },
        lion: {
            name: "Lion",
            namePl: "Lew",
            nameEn: "Lion",
            asset: "lion",
            buyCost: 4500,
            baseIncome: 11,
            unlockLevel: 6
        },
        tiger: {
            name: "Tiger",
            namePl: "Tygrys",
            nameEn: "Tiger",
            asset: "tiger",
            buyCost: 18000,
            baseIncome: 26,
            unlockLevel: 10
        },
        elephant: {
            name: "Elephant",
            namePl: "Słoń",
            nameEn: "Elephant",
            asset: "elephant",
            buyCost: 78000,
            baseIncome: 58,
            unlockLevel: 14
        },
        giraffe: {
            name: "Giraffe",
            namePl: "Żyrafa",
            nameEn: "Giraffe",
            asset: "giraffe",
            buyCost: 340000,
            baseIncome: 125,
            unlockLevel: 18
        },
        zebra: {
            name: "Zebra",
            namePl: "Zebra",
            nameEn: "Zebra",
            asset: "zebra",
            buyCost: 1450000,
            baseIncome: 265,
            unlockLevel: 22
        },
        hippo: {
            name: "Hippo",
            namePl: "Hipopotam",
            nameEn: "Hippo",
            asset: "hippo",
            buyCost: 6200000,
            baseIncome: 560,
            unlockLevel: 27
        },
        penguin: {
            name: "Penguin",
            namePl: "Pingwin",
            nameEn: "Penguin",
            asset: "penguin",
            buyCost: 27000000,
            baseIncome: 1180,
            unlockLevel: 32
        },
        bear: {
            name: "Bear",
            namePl: "Niedźwiedź",
            nameEn: "Bear",
            asset: "bear",
            buyCost: 120000000,
            baseIncome: 2450,
            unlockLevel: 38
        },
        crocodile: {
            name: "Crocodile",
            namePl: "Krokodyl",
            nameEn: "Crocodile",
            asset: "crocodile",
            buyCost: 540000000,
            baseIncome: 5100,
            unlockLevel: 44
        },
        kangaroo: {
            name: "Kangaroo",
            namePl: "Kangur",
            nameEn: "Kangaroo",
            asset: "kangaroo",
            buyCost: 2400000000,
            baseIncome: 10400,
            unlockLevel: 50
        },
        wolf: {
            name: "Wolf",
            namePl: "Wilk",
            nameEn: "Wolf",
            asset: "wolf",
            buyCost: 10500000000,
            baseIncome: 21000,
            unlockLevel: 58
        }
    },

    expeditions: [
        { id: "forest", name: "Magic Forest", namePl: "Magiczny Las", nameEn: "Magic Forest", duration: 300, baseDuration: 300, baseCoins: 70, startCostCoins: 55, baseGems: 0, gemChance: 0.01, rareChance: 0.12, epicChance: 0.01, unlockLevel: 1 },
        { id: "river", name: "Crystal River", namePl: "Kryształowa Rzeka", nameEn: "Crystal River", duration: 900, baseDuration: 900, baseCoins: 260, startCostCoins: 220, baseGems: 0, gemChance: 0.014, rareChance: 0.13, epicChance: 0.014, unlockLevel: 4 },
        { id: "volcano", name: "Golden Volcano", namePl: "Złoty Wulkan", nameEn: "Golden Volcano", duration: 1800, baseDuration: 1800, baseCoins: 760, startCostCoins: 650, baseGems: 0, gemChance: 0.019, rareChance: 0.145, epicChance: 0.019, unlockLevel: 8 },
        { id: "canyon", name: "Sunstone Canyon", namePl: "Kanion Słonecznego Kamienia", nameEn: "Sunstone Canyon", duration: 3600, baseDuration: 3600, baseCoins: 2100, startCostCoins: 1750, baseGems: 0, gemChance: 0.024, rareChance: 0.155, epicChance: 0.024, unlockLevel: 12 },
        { id: "glacier", name: "Frozen Glacier", namePl: "Zamarznięty Lodowiec", nameEn: "Frozen Glacier", duration: 7200, baseDuration: 7200, baseCoins: 5600, startCostCoins: 4600, baseGems: 0, gemChance: 0.03, rareChance: 0.165, epicChance: 0.03, unlockLevel: 17 },
        { id: "jungle", name: "Emerald Jungle", namePl: "Szmaragdowa Dżungla", nameEn: "Emerald Jungle", duration: 14400, baseDuration: 14400, baseCoins: 14500, startCostCoins: 11600, baseGems: 0, gemChance: 0.038, rareChance: 0.175, epicChance: 0.038, unlockLevel: 23 },
        { id: "temple", name: "Ancient Temple", namePl: "Starożytna Świątynia", nameEn: "Ancient Temple", duration: 28800, baseDuration: 28800, baseCoins: 36000, startCostCoins: 28000, baseGems: 0, gemChance: 0.05, rareChance: 0.185, epicChance: 0.05, unlockLevel: 30 },
        { id: "oasis", name: "Royal Oasis", namePl: "Królewska Oaza", nameEn: "Royal Oasis", duration: 43200, baseDuration: 43200, baseCoins: 80000, startCostCoins: 61000, baseGems: 0, gemChance: 0.062, rareChance: 0.195, epicChance: 0.062, unlockLevel: 38 },
        { id: "kingdom", name: "Lost Beast Kingdom", namePl: "Zaginione Królestwo Bestii", nameEn: "Lost Beast Kingdom", duration: 86400, baseDuration: 86400, baseCoins: 180000, startCostCoins: 145000, baseGems: 0, gemChance: 0.078, rareChance: 0.21, epicChance: 0.078, unlockLevel: 48 }
    ],

    shopItems: [
        {
            id: "click1",
            name: "Click Upgrade I",
            namePl: "Ulepszenie Kliku I",
            nameEn: "Click Upgrade I",
            desc: "+1 coin do każdego kliknięcia",
            descPl: "+1 coin do każdego kliknięcia",
            descEn: "+1 coin to every click",
            price: 2500,
            priceScale: 1.30,
            type: "click",
            clickValueBonus: 1
        },
        {
            id: "click2",
            name: "Strong Finger",
            namePl: "Silny Palec",
            nameEn: "Strong Finger",
            desc: "+2 coins do każdego kliknięcia",
            descPl: "+2 coins do każdego kliknięcia",
            descEn: "+2 coins to every click",
            price: 12000,
            priceScale: 1.32,
            type: "click",
            clickValueBonus: 2
        },
        {
            id: "click3",
            name: "Turbo Tap",
            namePl: "Turbo Tap",
            nameEn: "Turbo Tap",
            desc: "+4 coins do każdego kliknięcia",
            descPl: "+4 coins do każdego kliknięcia",
            descEn: "+4 coins to every click",
            price: 48000,
            priceScale: 1.35,
            type: "click",
            clickValueBonus: 4
        },

        {
            id: "income1",
            name: "Zoo Manager",
            namePl: "Manager Zoo",
            nameEn: "Zoo Manager",
            desc: "+1 level do wszystkich posiadanych zwierząt",
            descPl: "+1 level do wszystkich posiadanych zwierząt",
            descEn: "+1 level to all owned animals",
            price: 95000,
            priceScale: 1.40,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income2",
            name: "Automation Crew",
            namePl: "Ekipa Automatyzacji",
            nameEn: "Automation Crew",
            desc: "+1 level do wszystkich posiadanych zwierząt",
            descPl: "+1 level do wszystkich posiadanych zwierząt",
            descEn: "+1 level to all owned animals",
            price: 420000,
            priceScale: 1.42,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income3",
            name: "Elite Zoo Director",
            namePl: "Elitarny Dyrektor Zoo",
            nameEn: "Elite Zoo Director",
            desc: "+2 level do wszystkich posiadanych zwierząt",
            descPl: "+2 level do wszystkich posiadanych zwierząt",
            descEn: "+2 levels to all owned animals",
            price: 2200000,
            priceScale: 1.46,
            type: "income",
            incomeBonus: 2
        },

        {
            id: "expedition1",
            name: "Daily Expedition Boost",
            namePl: "Lepszy Ekwipunek Ekspedycji",
            nameEn: "Daily Expedition Boost",
            desc: "+20% reward z ekspedycji przez 24h",
            descPl: "+20% reward z ekspedycji przez 24h",
            descEn: "+20% expedition reward for 24h",
            gemPrice: 3,
            priceScale: 1,
            type: "expedition",
            expeditionBonus: 0.20
        },
        {
            id: "expeditionTime1",
            name: "Quick Expedition",
            namePl: "Szybka Ekspedycja",
            nameEn: "Quick Expedition",
            desc: "Skraca czas jednej aktywnej ekspedycji o 10 minut",
            descPl: "Skraca czas jednej aktywnej ekspedycji o 10 minut",
            descEn: "Reduces one active expedition by 10 minutes",
            gemPrice: 4,
            effect: "expeditionTime",
            timeReductionSeconds: 600
        },
        {
            id: "expeditionTime2",
            name: "Instant Expedition",
            namePl: "Natychmiastowa Ekspedycja",
            nameEn: "Instant Expedition",
            desc: "Skraca czas jednej aktywnej ekspedycji o 30 minut",
            descPl: "Skraca czas jednej aktywnej ekspedycji o 30 minut",
            descEn: "Reduces one active expedition by 30 minutes",
            gemPrice: 8,
            effect: "expeditionTime",
            timeReductionSeconds: 1800
        },
        {
            id: "expeditionTime3",
            name: "Rapid Expedition",
            namePl: "Szybka Ekspedycja+",
            nameEn: "Rapid Expedition",
            desc: "Skraca czas jednej aktywnej ekspedycji o 1 godzinę",
            descPl: "Skraca czas jednej aktywnej ekspedycji o 1 godzinę",
            descEn: "Reduces one active expedition by 1 hour",
            gemPrice: 14,
            effect: "expeditionTime",
            timeReductionSeconds: 3600
        },
        {
            id: "expeditionTime4",
            name: "Mega Expedition",
            namePl: "Mega Ekspedycja",
            nameEn: "Mega Expedition",
            desc: "Skraca czas jednej aktywnej ekspedycji o 4 godziny",
            descPl: "Skraca czas jednej aktywnej ekspedycji o 4 godziny",
            descEn: "Reduces one active expedition by 4 hours",
            gemPrice: 48,
            effect: "expeditionTime",
            timeReductionSeconds: 14400
        }
    ]
};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;
    const abs = Math.abs(num);

    const suffixes = [
        { value: 1e33, suffix: "Dc" },
        { value: 1e30, suffix: "No" },
        { value: 1e27, suffix: "Oc" },
        { value: 1e24, suffix: "Sp" },
        { value: 1e21, suffix: "Sx" },
        { value: 1e18, suffix: "Qi" },
        { value: 1e15, suffix: "Qa" },
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

CryptoZoo.formatUsd = function (rewardValue) {
    const rate = Number(CryptoZoo.config?.rewardToUsdRate || 0);
    const usd = (Number(rewardValue) || 0) * rate;
    return "$" + usd.toFixed(2);
};
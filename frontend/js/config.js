window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.regionAnimals = CryptoZoo.regionAnimals || {};
CryptoZoo.regionExpeditions = CryptoZoo.regionExpeditions || {};

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
        ...(CryptoZoo.regionAnimals.jungle || {}),
        ...(CryptoZoo.regionAnimals.desert || {})
    },

    expeditions: [
        ...(CryptoZoo.regionExpeditions.jungle || []),
        ...(CryptoZoo.regionExpeditions.desert || [])
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
            gemPrice: 5,
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
            gemPrice: 3,
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
            gemPrice: 6,
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
            gemPrice: 10,
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
            gemPrice: 28,
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
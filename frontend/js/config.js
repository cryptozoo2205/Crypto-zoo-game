window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    clickValue: 1,

    animals: {
        monkey: {
            name: "Monkey",
            asset: "monkey",
            buyCost: 70,
            baseIncome: 1
        },
        panda: {
            name: "Panda",
            asset: "panda",
            buyCost: 260,
            baseIncome: 4
        },
        lion: {
            name: "Lion",
            asset: "lion",
            buyCost: 900,
            baseIncome: 10
        },
        tiger: {
            name: "Tiger",
            asset: "tiger",
            buyCost: 2600,
            baseIncome: 24
        },
        elephant: {
            name: "Elephant",
            asset: "elephant",
            buyCost: 7500,
            baseIncome: 58
        },
        giraffe: {
            name: "Giraffe",
            asset: "giraffe",
            buyCost: 18000,
            baseIncome: 130
        },
        zebra: {
            name: "Zebra",
            asset: "zebra",
            buyCost: 42000,
            baseIncome: 280
        },
        hippo: {
            name: "Hippo",
            asset: "hippo",
            buyCost: 100000,
            baseIncome: 620
        },
        penguin: {
            name: "Penguin",
            asset: "penguin",
            buyCost: 230000,
            baseIncome: 1400
        },
        bear: {
            name: "Bear",
            asset: "bear",
            buyCost: 520000,
            baseIncome: 3000
        },
        crocodile: {
            name: "Crocodile",
            asset: "crocodile",
            buyCost: 1200000,
            baseIncome: 6200
        },
        kangaroo: {
            name: "Kangaroo",
            asset: "kangaroo",
            buyCost: 2600000,
            baseIncome: 12500
        },
        wolf: {
            name: "Wolf",
            asset: "wolf",
            buyCost: 6000000,
            baseIncome: 24000
        }
    },

    expeditions: [
        {
            id: "forest",
            name: "Magic Forest",
            duration: 300,
            baseCoins: 900,
            baseGems: 1,
            rareChance: 0.22,
            epicChance: 0.06
        },
        {
            id: "river",
            name: "Crystal River",
            duration: 900,
            baseCoins: 2500,
            baseGems: 2,
            rareChance: 0.25,
            epicChance: 0.07
        },
        {
            id: "volcano",
            name: "Golden Volcano",
            duration: 1800,
            baseCoins: 6500,
            baseGems: 3,
            rareChance: 0.28,
            epicChance: 0.09
        },
        {
            id: "canyon",
            name: "Sunstone Canyon",
            duration: 3600,
            baseCoins: 17000,
            baseGems: 5,
            rareChance: 0.31,
            epicChance: 0.10
        },
        {
            id: "glacier",
            name: "Frozen Glacier",
            duration: 7200,
            baseCoins: 43000,
            baseGems: 8,
            rareChance: 0.34,
            epicChance: 0.11
        },
        {
            id: "jungle",
            name: "Emerald Jungle",
            duration: 14400,
            baseCoins: 105000,
            baseGems: 13,
            rareChance: 0.37,
            epicChance: 0.13
        },
        {
            id: "temple",
            name: "Ancient Temple",
            duration: 28800,
            baseCoins: 270000,
            baseGems: 22,
            rareChance: 0.40,
            epicChance: 0.14
        },
        {
            id: "oasis",
            name: "Royal Oasis",
            duration: 43200,
            baseCoins: 520000,
            baseGems: 32,
            rareChance: 0.42,
            epicChance: 0.15
        },
        {
            id: "kingdom",
            name: "Lost Beast Kingdom",
            duration: 86400,
            baseCoins: 1200000,
            baseGems: 55,
            rareChance: 0.44,
            epicChance: 0.17
        }
    ],

        shopItems: [
    {
        id: "click1",
        name: "Click Upgrade I",
        desc: "+1 coin per click",
        price: 700,
        type: "click",
        clickValueBonus: 1
    },
    {
        id: "click2",
        name: "Click Upgrade II",
        desc: "+2 coins per click",
        price: 2200,
        type: "click",
        clickValueBonus: 2
    },
    {
        id: "click3",
        name: "Strong Finger",
        desc: "+3 coins per click",
        price: 6500,
        type: "click",
        clickValueBonus: 3
    },
    {
        id: "click4",
        name: "Turbo Tap",
        desc: "+5 coins per click",
        price: 18000,
        type: "click",
        clickValueBonus: 5
    },
    {
        id: "click5",
        name: "Diamond Claw",
        desc: "+8 coins per click",
        price: 52000,
        type: "click",
        clickValueBonus: 8
    },

        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+25% zoo income",
            price: 5000,
            type: "income"
        },
        {
            id: "income2",
            name: "VIP Caretaker",
            desc: "+25% zoo income",
            price: 15000,
            type: "income"
        },
        {
            id: "income3",
            name: "Automation Crew",
            desc: "+25% zoo income",
            price: 42000,
            type: "income"
        },
        {
            id: "income4",
            name: "Golden Feeding System",
            desc: "+25% zoo income",
            price: 110000,
            type: "income"
        },
        {
            id: "income5",
            name: "Elite Zoo Director",
            desc: "+25% zoo income",
            price: 280000,
            type: "income"
        },

        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "+20% expedition rewards",
            price: 12000,
            type: "expedition"
        },
        {
            id: "expedition2",
            name: "Rare Route Maps",
            desc: "+20% expedition rewards",
            price: 32000,
            type: "expedition"
        },
        {
            id: "expedition3",
            name: "Epic Explorer Team",
            desc: "+20% expedition rewards",
            price: 85000,
            type: "expedition"
        },

        {
            id: "offline10m",
            name: "Offline Boost 10m",
            desc: "x2 offline income przez 10 minut",
            price: 15000,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 10 * 60
        },
        {
            id: "offline1h",
            name: "Offline Boost 1h",
            desc: "x2 offline income przez 1 godzinę",
            price: 65000,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 60 * 60
        },
        {
            id: "offline3h",
            name: "Offline Boost 3h",
            desc: "x2 offline income przez 3 godziny",
            price: 180000,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 3 * 60 * 60
        },
        {
            id: "offline5h",
            name: "Offline Boost 5h",
            desc: "x2 offline income przez 5 godzin",
            price: 320000,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 5 * 60 * 60
        }
    ]
};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;

    if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(num >= 10000000000000 ? 0 : 1).replace(/\.0$/, "") + "T";
    }

    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(num >= 10000000000 ? 0 : 1).replace(/\.0$/, "") + "B";
    }

    if (num >= 1000000) {
        return (num / 1000000).toFixed(num >= 10000000 ? 0 : 1).replace(/\.0$/, "") + "M";
    }

    if (num >= 1000) {
        return (num / 1000).toFixed(num >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
    }

    if (Number.isInteger(num)) {
        return String(num);
    }

    return num.toFixed(2).replace(/\.00$/, "");
};
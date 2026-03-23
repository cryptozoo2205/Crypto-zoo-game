window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    apiBase: "/api",

    clickValue: 1,

    animals: {
        monkey: { name: "Monkey", asset: "monkey", buyCost: 120, baseIncome: 1 },
        panda: { name: "Panda", asset: "panda", buyCost: 520, baseIncome: 3 },
        lion: { name: "Lion", asset: "lion", buyCost: 2200, baseIncome: 8 },
        tiger: { name: "Tiger", asset: "tiger", buyCost: 9000, baseIncome: 18 },
        elephant: { name: "Elephant", asset: "elephant", buyCost: 36000, baseIncome: 42 },
        giraffe: { name: "Giraffe", asset: "giraffe", buyCost: 145000, baseIncome: 95 },
        zebra: { name: "Zebra", asset: "zebra", buyCost: 580000, baseIncome: 210 },
        hippo: { name: "Hippo", asset: "hippo", buyCost: 2300000, baseIncome: 470 },
        penguin: { name: "Penguin", asset: "penguin", buyCost: 9200000, baseIncome: 1050 },
        bear: { name: "Bear", asset: "bear", buyCost: 37000000, baseIncome: 2300 },
        crocodile: { name: "Crocodile", asset: "crocodile", buyCost: 148000000, baseIncome: 5000 },
        kangaroo: { name: "Kangaroo", asset: "kangaroo", buyCost: 590000000, baseIncome: 10800 },
        wolf: { name: "Wolf", asset: "wolf", buyCost: 2360000000, baseIncome: 23000 }
    },

    expeditions: [
        {
            id: "forest",
            name: "Magic Forest",
            duration: 300,
            baseCoins: 450,
            baseGems: 0,
            rareChance: 0.16,
            epicChance: 0.03,
            unlockLevel: 1
        },
        {
            id: "river",
            name: "Crystal River",
            duration: 900,
            baseCoins: 1200,
            baseGems: 0,
            rareChance: 0.18,
            epicChance: 0.04,
            unlockLevel: 3
        },
        {
            id: "volcano",
            name: "Golden Volcano",
            duration: 1800,
            baseCoins: 2800,
            baseGems: 1,
            rareChance: 0.20,
            epicChance: 0.05,
            unlockLevel: 5
        },
        {
            id: "canyon",
            name: "Sunstone Canyon",
            duration: 3600,
            baseCoins: 6500,
            baseGems: 1,
            rareChance: 0.21,
            epicChance: 0.05,
            unlockLevel: 7
        },
        {
            id: "glacier",
            name: "Frozen Glacier",
            duration: 7200,
            baseCoins: 15000,
            baseGems: 1,
            rareChance: 0.23,
            epicChance: 0.06,
            unlockLevel: 10
        },
        {
            id: "jungle",
            name: "Emerald Jungle",
            duration: 14400,
            baseCoins: 32000,
            baseGems: 2,
            rareChance: 0.24,
            epicChance: 0.07,
            unlockLevel: 14
        },
        {
            id: "temple",
            name: "Ancient Temple",
            duration: 28800,
            baseCoins: 70000,
            baseGems: 2,
            rareChance: 0.26,
            epicChance: 0.08,
            unlockLevel: 18
        },
        {
            id: "oasis",
            name: "Royal Oasis",
            duration: 43200,
            baseCoins: 115000,
            baseGems: 3,
            rareChance: 0.27,
            epicChance: 0.08,
            unlockLevel: 22
        },
        {
            id: "kingdom",
            name: "Lost Beast Kingdom",
            duration: 86400,
            baseCoins: 260000,
            baseGems: 4,
            rareChance: 0.29,
            epicChance: 0.09,
            unlockLevel: 28
        }
    ],

    shopItems: [
        // CLICK
        {
            id: "click1",
            name: "Click Upgrade I",
            desc: "+1 coin per click",
            price: 2500,
            priceScale: 1.25,
            type: "click",
            clickValueBonus: 1
        },
        {
            id: "click2",
            name: "Strong Finger",
            desc: "+3 coins per click",
            price: 16000,
            priceScale: 1.27,
            type: "click",
            clickValueBonus: 3
        },
        {
            id: "click3",
            name: "Turbo Tap",
            desc: "+5 coins per click",
            price: 70000,
            priceScale: 1.29,
            type: "click",
            clickValueBonus: 5
        },

        // INCOME
        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+1 level do wszystkich kupionych zwierząt",
            price: 18000,
            priceScale: 1.28,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income2",
            name: "Automation Crew",
            desc: "+3 level do wszystkich kupionych zwierząt",
            price: 120000,
            priceScale: 1.31,
            type: "income",
            incomeBonus: 3
        },
        {
            id: "income3",
            name: "Elite Zoo Director",
            desc: "+5 level do wszystkich kupionych zwierząt",
            price: 480000,
            priceScale: 1.34,
            type: "income",
            incomeBonus: 5
        },

        // EXPEDITIONS
        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "Zwiększa nagrody z ekspedycji",
            price: 32000,
            priceScale: 1.30,
            type: "expedition",
            expeditionBonus: 1
        },
        {
            id: "expedition2",
            name: "Rare Route Maps",
            desc: "Mocniej zwiększa nagrody z ekspedycji",
            price: 92000,
            priceScale: 1.31,
            type: "expedition",
            expeditionBonus: 1
        },

        // OFFLINE
        {
            id: "offline1",
            name: "Offline Boost 10m",
            desc: "x2 offline income przez 10m",
            gemPrice: 2,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 600
        },
        {
            id: "offline2",
            name: "Offline Boost 1h",
            desc: "x2 offline income przez 1h",
            gemPrice: 5,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 3600
        },

        // SPECIAL
        {
            id: "spin",
            name: "Extra Spin",
            desc: "Free spin",
            effect: "extraSpin",
            gemPrice: 1,
            spinCount: 1
        }
    ]
};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;

    if (num >= 1e12) {
        return (num / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    }

    if (num >= 1e9) {
        return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    }

    if (num >= 1e6) {
        return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    }

    if (num >= 1e3) {
        return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    }

    return Number.isInteger(num) ? String(num) : num.toFixed(2);
};
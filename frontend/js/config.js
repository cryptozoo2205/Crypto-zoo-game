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
            baseIncome: 3
        },
        lion: {
            name: "Lion",
            asset: "lion",
            buyCost: 900,
            baseIncome: 15
        },
        tiger: {
            name: "Tiger",
            asset: "tiger",
            buyCost: 2600,
            baseIncome: 34
        },
        elephant: {
            name: "Elephant",
            asset: "elephant",
            buyCost: 7500,
            baseIncome: 95
        },
        giraffe: {
            name: "Giraffe",
            asset: "giraffe",
            buyCost: 18000,
            baseIncome: 210
        },
        zebra: {
            name: "Zebra",
            asset: "zebra",
            buyCost: 42000,
            baseIncome: 420
        },
        hippo: {
            name: "Hippo",
            asset: "hippo",
            buyCost: 100000,
            baseIncome: 900
        },
        penguin: {
            name: "Penguin",
            asset: "penguin",
            buyCost: 230000,
            baseIncome: 1600
        },
        bear: {
            name: "Bear",
            asset: "bear",
            buyCost: 520000,
            baseIncome: 3200
        },
        crocodile: {
            name: "Crocodile",
            asset: "crocodile",
            buyCost: 1200000,
            baseIncome: 6000
        },
        kangaroo: {
            name: "Kangaroo",
            asset: "kangaroo",
            buyCost: 2600000,
            baseIncome: 12000
        },
        wolf: {
            name: "Wolf",
            asset: "wolf",
            buyCost: 6000000,
            baseIncome: 22000
        }
    },

    expeditions: [
        {
            id: "forest",
            name: "Magic Forest",
            duration: 300,
            baseCoins: 1200,
            baseGems: 1,
            rareChance: 0.25,
            epicChance: 0.08
        },
        {
            id: "river",
            name: "Crystal River",
            duration: 900,
            baseCoins: 4500,
            baseGems: 4,
            rareChance: 0.30,
            epicChance: 0.10
        },
        {
            id: "volcano",
            name: "Golden Volcano",
            duration: 1800,
            baseCoins: 12000,
            baseGems: 9,
            rareChance: 0.35,
            epicChance: 0.12
        },
        {
            id: "canyon",
            name: "Sunstone Canyon",
            duration: 3600,
            baseCoins: 28000,
            baseGems: 14,
            rareChance: 0.36,
            epicChance: 0.13
        },
        {
            id: "glacier",
            name: "Frozen Glacier",
            duration: 7200,
            baseCoins: 70000,
            baseGems: 22,
            rareChance: 0.38,
            epicChance: 0.14
        },
        {
            id: "jungle",
            name: "Emerald Jungle",
            duration: 14400,
            baseCoins: 180000,
            baseGems: 36,
            rareChance: 0.40,
            epicChance: 0.15
        },
        {
            id: "temple",
            name: "Ancient Temple",
            duration: 28800,
            baseCoins: 420000,
            baseGems: 60,
            rareChance: 0.42,
            epicChance: 0.16
        },
        {
            id: "oasis",
            name: "Royal Oasis",
            duration: 43200,
            baseCoins: 800000,
            baseGems: 90,
            rareChance: 0.44,
            epicChance: 0.17
        },
        {
            id: "kingdom",
            name: "Lost Beast Kingdom",
            duration: 86400,
            baseCoins: 1800000,
            baseGems: 160,
            rareChance: 0.46,
            epicChance: 0.18
        }
    ],

    shopItems: [
        {
            id: "click1",
            name: "Click Upgrade I",
            desc: "+1 coin per click",
            price: 600,
            type: "click"
        },
        {
            id: "click2",
            name: "Click Upgrade II",
            desc: "+1 coin per click",
            price: 1800,
            type: "click"
        },
        {
            id: "click3",
            name: "Strong Finger",
            desc: "+1 coin per click",
            price: 4500,
            type: "click"
        },
        {
            id: "click4",
            name: "Turbo Tap",
            desc: "+1 coin per click",
            price: 10000,
            type: "click"
        },
        {
            id: "click5",
            name: "Diamond Claw",
            desc: "+1 coin per click",
            price: 22000,
            type: "click"
        },

        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+25% zoo income",
            price: 3000,
            type: "income"
        },
        {
            id: "income2",
            name: "VIP Caretaker",
            desc: "+25% zoo income",
            price: 9000,
            type: "income"
        },
        {
            id: "income3",
            name: "Automation Crew",
            desc: "+25% zoo income",
            price: 22000,
            type: "income"
        },
        {
            id: "income4",
            name: "Golden Feeding System",
            desc: "+25% zoo income",
            price: 55000,
            type: "income"
        },
        {
            id: "income5",
            name: "Elite Zoo Director",
            desc: "+25% zoo income",
            price: 140000,
            type: "income"
        },

        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "+20% expedition rewards",
            price: 5000,
            type: "expedition"
        },
        {
            id: "expedition2",
            name: "Rare Route Maps",
            desc: "+20% expedition rewards",
            price: 14000,
            type: "expedition"
        },
        {
            id: "expedition3",
            name: "Epic Explorer Team",
            desc: "+20% expedition rewards",
            price: 36000,
            type: "expedition"
        },

        {
            id: "offline1",
            name: "Offline Booster",
            desc: "x2 offline income",
            price: 8000,
            type: "offline"
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
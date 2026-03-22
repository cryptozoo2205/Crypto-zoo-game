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
            duration: 5 * 60,
            baseCoins: 450,
            baseGems: 0,
            rareChance: 0.18,
            epicChance: 0.04,
            unlockLevel: 1
        },
        {
            id: "river",
            name: "Crystal River",
            duration: 15 * 60,
            baseCoins: 1200,
            baseGems: 0,
            rareChance: 0.20,
            epicChance: 0.05,
            unlockLevel: 3
        },
        {
            id: "volcano",
            name: "Golden Volcano",
            duration: 30 * 60,
            baseCoins: 2800,
            baseGems: 1,
            rareChance: 0.22,
            epicChance: 0.06,
            unlockLevel: 5
        },
        {
            id: "canyon",
            name: "Sunstone Canyon",
            duration: 60 * 60,
            baseCoins: 6500,
            baseGems: 1,
            rareChance: 0.24,
            epicChance: 0.07,
            unlockLevel: 7
        },
        {
            id: "glacier",
            name: "Frozen Glacier",
            duration: 2 * 60 * 60,
            baseCoins: 15000,
            baseGems: 1,
            rareChance: 0.26,
            epicChance: 0.08,
            unlockLevel: 10
        },
        {
            id: "jungle",
            name: "Emerald Jungle",
            duration: 4 * 60 * 60,
            baseCoins: 32000,
            baseGems: 2,
            rareChance: 0.28,
            epicChance: 0.09,
            unlockLevel: 14
        },
        {
            id: "temple",
            name: "Ancient Temple",
            duration: 8 * 60 * 60,
            baseCoins: 70000,
            baseGems: 2,
            rareChance: 0.30,
            epicChance: 0.10,
            unlockLevel: 18
        },
        {
            id: "oasis",
            name: "Royal Oasis",
            duration: 12 * 60 * 60,
            baseCoins: 115000,
            baseGems: 3,
            rareChance: 0.32,
            epicChance: 0.11,
            unlockLevel: 22
        },
        {
            id: "kingdom",
            name: "Lost Beast Kingdom",
            duration: 24 * 60 * 60,
            baseCoins: 260000,
            baseGems: 4,
            rareChance: 0.35,
            epicChance: 0.12,
            unlockLevel: 28
        }
    ],

    shopItems: [
        {
            id: "click1",
            name: "Click Upgrade I",
            desc: "+1 coin per click",
            price: 1800,
            priceScale: 1.22,
            type: "click",
            clickValueBonus: 1
        },
        {
            id: "click2",
            name: "Click Upgrade II",
            desc: "+2 coins per click",
            price: 6500,
            priceScale: 1.22,
            type: "click",
            clickValueBonus: 2
        },
        {
            id: "click3",
            name: "Strong Finger",
            desc: "+3 coins per click",
            price: 18000,
            priceScale: 1.22,
            type: "click",
            clickValueBonus: 3
        },
        {
            id: "click4",
            name: "Turbo Tap",
            desc: "+5 coins per click",
            price: 52000,
            priceScale: 1.22,
            type: "click",
            clickValueBonus: 5
        },
        {
            id: "click5",
            name: "Diamond Claw",
            desc: "+8 coins per click",
            price: 150000,
            priceScale: 1.22,
            type: "click",
            clickValueBonus: 8
        },

        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+1 level to all owned animals",
            price: 12000,
            priceScale: 1.24,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income2",
            name: "VIP Caretaker",
            desc: "+1 level to all owned animals",
            price: 42000,
            priceScale: 1.24,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income3",
            name: "Automation Crew",
            desc: "+1 level to all owned animals",
            price: 120000,
            priceScale: 1.24,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income4",
            name: "Golden Feeding System",
            desc: "+1 level to all owned animals",
            price: 320000,
            priceScale: 1.24,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income5",
            name: "Elite Zoo Director",
            desc: "+1 level to all owned animals",
            price: 850000,
            priceScale: 1.24,
            type: "income",
            incomeBonus: 1
        },

        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "+1 expedition boost",
            price: 25000,
            priceScale: 1.28,
            type: "expedition",
            expeditionBonus: 1
        },
        {
            id: "expedition2",
            name: "Rare Route Maps",
            desc: "+1 expedition boost",
            price: 75000,
            priceScale: 1.28,
            type: "expedition",
            expeditionBonus: 1
        },
        {
            id: "expedition3",
            name: "Epic Explorer Team",
            desc: "+1 expedition boost",
            price: 200000,
            priceScale: 1.28,
            type: "expedition",
            expeditionBonus: 1
        },

        {
            id: "offline10m",
            name: "Offline Boost 10m",
            desc: "x2 offline income przez 10 minut",
            gemPrice: 2,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 10 * 60
        },
        {
            id: "offline1h",
            name: "Offline Boost 1h",
            desc: "x2 offline income przez 1 godzinę",
            gemPrice: 5,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 60 * 60
        },
        {
            id: "offline3h",
            name: "Offline Boost 3h",
            desc: "x2 offline income przez 3 godziny",
            gemPrice: 10,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 3 * 60 * 60
        },
        {
            id: "offline5h",
            name: "Offline Boost 5h",
            desc: "x2 offline income przez 5 godzin",
            gemPrice: 15,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 5 * 60 * 60
        },

        {
            id: "extra_spin",
            name: "Extra Spin",
            desc: "Natychmiastowy spin wheel",
            effect: "extraSpin",
            gemPrice: 1,
            spinCount: 1
        },
        {
            id: "skip_wheel_cd",
            name: "Skip Wheel Cooldown",
            desc: "Resetuje cooldown wheel",
            effect: "skipWheelCooldown",
            gemPrice: 1
        },
        {
            id: "coin_pack_small",
            name: "Coin Pack",
            desc: "+2000 coins",
            effect: "coinPack",
            gemPrice: 1,
            coinPackAmount: 2000
        },
        {
            id: "coin_pack_big",
            name: "Big Coin Pack",
            desc: "+12000 coins",
            effect: "coinPack",
            gemPrice: 4,
            coinPackAmount: 12000
        },
        {
            id: "boost_2x_shop",
            name: "X2 Boost 10m",
            desc: "Podwaja klik i dochód zoo przez 10 minut",
            effect: "boost2x",
            gemPrice: 1,
            boostDurationSeconds: 10 * 60
        },
        {
            id: "boost_2x_long",
            name: "X2 Boost 30m",
            desc: "Podwaja klik i dochód zoo przez 30 minut",
            effect: "boost2x",
            gemPrice: 3,
            boostDurationSeconds: 30 * 60
        }
    ]
};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;

    if (num >= 1000000000000) {
        return (num / 1000000000000)
            .toFixed(num >= 10000000000000 ? 0 : 1)
            .replace(/\.0$/, "") + "T";
    }

    if (num >= 1000000000) {
        return (num / 1000000000)
            .toFixed(num >= 10000000000 ? 0 : 1)
            .replace(/\.0$/, "") + "B";
    }

    if (num >= 1000000) {
        return (num / 1000000)
            .toFixed(num >= 10000000 ? 0 : 1)
            .replace(/\.0$/, "") + "M";
    }

    if (num >= 1000) {
        return (num / 1000)
            .toFixed(num >= 10000 ? 0 : 1)
            .replace(/\.0$/, "") + "K";
    }

    if (Number.isInteger(num)) {
        return String(num);
    }

    return num.toFixed(2).replace(/\.00$/, "");
};
window.CryptoZoo = window.CryptoZoo || {}


CryptoZoo.config = {
    apiBase: "/api",
limits: {
    maxOwnedPerAnimal: 50,
    maxLevelPerAnimal: 100
},
    clickValue: 1,

    animals: {
        monkey: {
            name: "Monkey",
            namePl: "Małpa",
            nameEn: "Monkey",
            asset: "monkey",
            buyCost: 120,
            baseIncome: 1
        },
        panda: {
            name: "Panda",
            namePl: "Panda",
            nameEn: "Panda",
            asset: "panda",
            buyCost: 520,
            baseIncome: 3
        },
        lion: {
            name: "Lion",
            namePl: "Lew",
            nameEn: "Lion",
            asset: "lion",
            buyCost: 2200,
            baseIncome: 8
        },
        tiger: {
            name: "Tiger",
            namePl: "Tygrys",
            nameEn: "Tiger",
            asset: "tiger",
            buyCost: 9000,
            baseIncome: 18
        },
        elephant: {
            name: "Elephant",
            namePl: "Słoń",
            nameEn: "Elephant",
            asset: "elephant",
            buyCost: 36000,
            baseIncome: 42
        },
        giraffe: {
            name: "Giraffe",
            namePl: "Żyrafa",
            nameEn: "Giraffe",
            asset: "giraffe",
            buyCost: 145000,
            baseIncome: 95
        },
        zebra: {
            name: "Zebra",
            namePl: "Zebra",
            nameEn: "Zebra",
            asset: "zebra",
            buyCost: 580000,
            baseIncome: 210
        },
        hippo: {
            name: "Hippo",
            namePl: "Hipopotam",
            nameEn: "Hippo",
            asset: "hippo",
            buyCost: 2300000,
            baseIncome: 470
        },
        penguin: {
            name: "Penguin",
            namePl: "Pingwin",
            nameEn: "Penguin",
            asset: "penguin",
            buyCost: 9200000,
            baseIncome: 1050
        },
        bear: {
            name: "Bear",
            namePl: "Niedźwiedź",
            nameEn: "Bear",
            asset: "bear",
            buyCost: 37000000,
            baseIncome: 2300
        },
        crocodile: {
            name: "Crocodile",
            namePl: "Krokodyl",
            nameEn: "Crocodile",
            asset: "crocodile",
            buyCost: 148000000,
            baseIncome: 5000
        },
        kangaroo: {
            name: "Kangaroo",
            namePl: "Kangur",
            nameEn: "Kangaroo",
            asset: "kangaroo",
            buyCost: 590000000,
            baseIncome: 10800
        },
        wolf: {
            name: "Wolf",
            namePl: "Wilk",
            nameEn: "Wolf",
            asset: "wolf",
            buyCost: 2360000000,
            baseIncome: 23000
        }
    },

    expeditions: [
        {
            id: "forest",
            name: "Magic Forest",
            namePl: "Magiczny Las",
            nameEn: "Magic Forest",
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
            namePl: "Kryształowa Rzeka",
            nameEn: "Crystal River",
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
            namePl: "Złoty Wulkan",
            nameEn: "Golden Volcano",
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
            namePl: "Kanion Słonecznego Kamienia",
            nameEn: "Sunstone Canyon",
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
            namePl: "Zamarznięty Lodowiec",
            nameEn: "Frozen Glacier",
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
            namePl: "Szmaragdowa Dżungla",
            nameEn: "Emerald Jungle",
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
            namePl: "Starożytna Świątynia",
            nameEn: "Ancient Temple",
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
            namePl: "Królewska Oaza",
            nameEn: "Royal Oasis",
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
            namePl: "Zaginione Królestwo Bestii",
            nameEn: "Lost Beast Kingdom",
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
            namePl: "Ulepszenie Kliku I",
            nameEn: "Click Upgrade I",
            desc: "+1 coin do każdego kliknięcia",
            descPl: "+1 coin do każdego kliknięcia",
            descEn: "+1 coin to every click",
            price: 2500,
            priceScale: 1.25,
            type: "click",
            clickValueBonus: 1
        },
        {
            id: "click2",
            name: "Strong Finger",
            namePl: "Silny Palec",
            nameEn: "Strong Finger",
            desc: "+3 coins do każdego kliknięcia",
            descPl: "+3 coins do każdego kliknięcia",
            descEn: "+3 coins to every click",
            price: 16000,
            priceScale: 1.27,
            type: "click",
            clickValueBonus: 3
        },
        {
            id: "click3",
            name: "Turbo Tap",
            namePl: "Turbo Tap",
            nameEn: "Turbo Tap",
            desc: "+5 coins do każdego kliknięcia",
            descPl: "+5 coins do każdego kliknięcia",
            descEn: "+5 coins to every click",
            price: 70000,
            priceScale: 1.29,
            type: "click",
            clickValueBonus: 5
        },

        // INCOME
        {
            id: "income1",
            name: "Zoo Manager",
            namePl: "Manager Zoo",
            nameEn: "Zoo Manager",
            desc: "+1 level do wszystkich posiadanych zwierząt",
            descPl: "+1 level do wszystkich posiadanych zwierząt",
            descEn: "+1 level to all owned animals",
            price: 18000,
            priceScale: 1.28,
            type: "income",
            incomeBonus: 1
        },
        {
            id: "income2",
            name: "Automation Crew",
            namePl: "Ekipa Automatyzacji",
            nameEn: "Automation Crew",
            desc: "+3 level do wszystkich posiadanych zwierząt",
            descPl: "+3 level do wszystkich posiadanych zwierząt",
            descEn: "+3 levels to all owned animals",
            price: 120000,
            priceScale: 1.31,
            type: "income",
            incomeBonus: 3
        },
        {
            id: "income3",
            name: "Elite Zoo Director",
            namePl: "Elitarny Dyrektor Zoo",
            nameEn: "Elite Zoo Director",
            desc: "+5 level do wszystkich posiadanych zwierząt",
            descPl: "+5 level do wszystkich posiadanych zwierząt",
            descEn: "+5 levels to all owned animals",
            price: 480000,
            priceScale: 1.34,
            type: "income",
            incomeBonus: 5
        },

        // EXPEDITIONS
        {
            id: "expedition1",
            name: "Better Expedition Gear",
            namePl: "Lepszy Ekwipunek Ekspedycji",
            nameEn: "Better Expedition Gear",
            desc: "Zwiększa reward z każdej ekspedycji",
            descPl: "Zwiększa reward z każdej ekspedycji",
            descEn: "Increases reward from every expedition",
            price: 32000,
            priceScale: 1.30,
            type: "expedition",
            expeditionBonus: 1
        },
        {
            id: "expedition2",
            name: "Rare Route Maps",
            namePl: "Mapy Rzadkich Tras",
            nameEn: "Rare Route Maps",
            desc: "Mocniej zwiększa reward z każdej ekspedycji",
            descPl: "Mocniej zwiększa reward z każdej ekspedycji",
            descEn: "Strongly increases reward from every expedition",
            price: 92000,
            priceScale: 1.31,
            type: "expedition",
            expeditionBonus: 1
        },
        {
            id: "expeditionTime1",
            name: "Quick Expedition",
            namePl: "Szybka Ekspedycja",
            nameEn: "Quick Expedition",
            desc: "Skraca czas jednej aktywnej ekspedycji o 10 minut",
            descPl: "Skraca czas jednej aktywnej ekspedycji o 10 minut",
            descEn: "Reduces one active expedition by 10 minutes",
            gemPrice: 2,
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
            gemPrice: 5,
            effect: "expeditionTime",
            timeReductionSeconds: 1800
        },

        // OFFLINE
        {
            id: "offline1",
            name: "Offline Boost 10m",
            namePl: "Boost Offline 10m",
            nameEn: "Offline Boost 10m",
            desc: "x2 offline income przez 10 minut",
            descPl: "x2 offline income przez 10 minut",
            descEn: "x2 offline income for 10 minutes",
            gemPrice: 2,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 600
        },
        {
            id: "offline2",
            name: "Offline Boost 1h",
            namePl: "Boost Offline 1h",
            nameEn: "Offline Boost 1h",
            desc: "x2 offline income przez 1 godzinę",
            descPl: "x2 offline income przez 1 godzinę",
            descEn: "x2 offline income for 1 hour",
            gemPrice: 5,
            type: "offline",
            offlineMultiplier: 2,
            offlineDurationSeconds: 3600
        },

        // SPECIAL
        {
            id: "spin",
            name: "Extra Spin",
            namePl: "Dodatkowy Spin",
            nameEn: "Extra Spin",
            desc: "Daje 1 dodatkowy spin koła",
            descPl: "Daje 1 dodatkowy spin koła",
            descEn: "Gives 1 extra wheel spin",
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
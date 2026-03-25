window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.lang = {
    current: "en",

    translations: {
        en: {
            // GENERAL
            collect: "Collect reward",
            collectReward: "Collect reward",
            expeditionInProgress: "Expedition in progress",
            start: "Start",
            claimed: "Claimed",
            claim: "Claim",
            ready: "READY",
            next: "Next",
            unlockIn: "Unlock in",
            nextRewardIn: "Next reward in",
            active: "Active",
            inactive: "Inactive",
            status: "Status",
            progress: "Progress",
            rewardWord: "reward",
            close: "Close",
            settings: "Settings",
            language: "Language",
            sounds: "Sounds",
            info: "Info",
            countdown: "Countdown",
            streak: "Streak",
            collectNow: "To collect",
            online: "● Online",
            baseReward: "Base reward",
            activeExpedition: "Active expedition",
            useTimeReduction: "Use time reduction",
            comingSoon: "🚀 Coming soon",

            // DAILY
            dailyReward: "Daily Reward",
            day: "Day",
            dailyRewardSubtitle: "Claim your daily reward and come back for more",

            // MISSIONS
            dailyMissions: "Daily Missions",
            inProgress: "In progress",
            completed: "Completed",

            // SHOP
            shop: "Shop",
            buy: "Buy",

            // BOOST
            x2Boost: "⚡ X2 Boost",

            // UI
            coins: "Coins",
            gems: "Gems",
            rewardLabel: "Reward",
            levelLabel: "Level",
            clickLabel: "Per click",
            zooPerSecLabel: "Zoo / sec",
            getCoinsTitle: "GET COINS",
            tapSubtitle: "Tap and grow your zoo",
            yourZoo: "🐾 Your Zoo",
            seeMore: "See more",

            // MINIGAMES
            miniGames: "🎮 Mini Games",
            miniGamesSubtitle: "Spin the wheel or play memory and claim rewards",
            wheelOfFortune: "Wheel Of Fortune",
            wheelDesc: "Random reward after every spin",
            spinWheel: "Spin Wheel",
            memoryAnimals: "Memory Animals",
            memoryDesc: "Find all pairs and claim rewards",
            startMemory: "Start Memory",

            // 🔥 NEW (WHEEL + MEMORY)
            spinning: "Spinning...",
            nextSpinIn: "Next spin in",
            freeSpinReady: "Free spin ready",
            extraSpinAvailable: "Extra spin available",
            memoryReadyIn: "Memory ready in",
            memoryCooldown: "Memory CD",
            memoryCompleted: "Completed!",
            memoryRewardText: "Reward: 3000 Coins + 1 Gem",
            memoryToast: "Memory reward: 3000 Coins + 1 Gem",

            // PROFILE
            profileReward: "Reward",
            profileWallet: "Wallet",
            profilePending: "Pending",
            transferReward: "Transfer Reward",
            withdrawRequest: "Withdraw Request",

            // WITHDRAW
            approved: "Approved",
            rejected: "Rejected",
            pendingStatus: "Pending",
            noWithdrawRequests: "No withdraw requests",

            // SETTINGS
            settingsSubtitle: "Game settings and FAQ",

            // ANIMALS
            lvl: "Lvl",
            lvlUp: "Lvl Up"
        },

        pl: {
            // GENERAL
            collect: "Odbierz nagrodę",
            collectReward: "Odbierz nagrodę",
            expeditionInProgress: "Trwa ekspedycja",
            start: "Start",
            claimed: "Odebrane",
            claim: "Odbierz",
            ready: "GOTOWE",
            next: "Następny",
            unlockIn: "Odblokuj za",
            nextRewardIn: "Następna nagroda za",
            active: "Aktywny",
            inactive: "Nieaktywny",
            status: "Status",
            progress: "Postęp",
            rewardWord: "reward",
            close: "Zamknij",
            settings: "Settings",
            language: "Language",
            sounds: "Sounds",
            info: "Info",
            countdown: "Countdown",
            streak: "Streak",
            collectNow: "Do odebrania",
            online: "● Online",
            baseReward: "Nagroda bazowa",
            activeExpedition: "Aktywna ekspedycja",
            useTimeReduction: "Użyj skracania czasu",
            comingSoon: "🚀 Wkrótce",

            // DAILY
            dailyReward: "Daily Reward",
            day: "Dzień",
            dailyRewardSubtitle: "Odbierz codzienną nagrodę i wracaj po więcej",

            // MISSIONS
            dailyMissions: "Misje dzienne",
            inProgress: "W trakcie",
            completed: "Ukończone",

            // SHOP
            shop: "Shop",
            buy: "Kup",

            // BOOST
            x2Boost: "⚡ X2 Boost",

            // UI
            coins: "Coins",
            gems: "Gems",
            rewardLabel: "Reward",
            levelLabel: "Poziom",
            clickLabel: "Za klik",
            zooPerSecLabel: "Zoo / sek",
            getCoinsTitle: "UZYSKAJ MONETY",
            tapSubtitle: "Klikaj i rozwijaj swoje zoo",
            yourZoo: "🐾 Twoje Zoo",
            seeMore: "Zobacz więcej",

            // MINIGAMES
            miniGames: "🎮 Mini Games",
            miniGamesSubtitle: "Zakręć kołem albo zagraj w memory i odbierz nagrody",
            wheelOfFortune: "Wheel Of Fortune",
            wheelDesc: "Losowa nagroda po każdym spinie",
            spinWheel: "Spin Wheel",
            memoryAnimals: "Memory Animals",
            memoryDesc: "Znajdź wszystkie pary i odbierz nagrody",
            startMemory: "Start Memory",

            // 🔥 NEW (WHEEL + MEMORY)
            spinning: "Kręcenie...",
            nextSpinIn: "Następny spin za",
            freeSpinReady: "Darmowy spin gotowy",
            extraSpinAvailable: "Dostępny extra spin",
            memoryReadyIn: "Memory gotowe za",
            memoryCooldown: "Memory CD",
            memoryCompleted: "Ukończono!",
            memoryRewardText: "Nagroda: 3000 Coins + 1 Gem",
            memoryToast: "Nagroda Memory: 3000 Coins + 1 Gem",

            // PROFILE
            profileReward: "Reward",
            profileWallet: "Wallet",
            profilePending: "Pending",
            transferReward: "Transfer Reward",
            withdrawRequest: "Withdraw Request",

            // WITHDRAW
            approved: "Approved",
            rejected: "Rejected",
            pendingStatus: "Pending",
            noWithdrawRequests: "Brak withdraw requestów",

            // SETTINGS
            settingsSubtitle: "Ustawienia gry i FAQ",

            // ANIMALS
            lvl: "Lvl",
            lvlUp: "Lvl Up"
        }
    },

    t(key) {
        const lang = this.current || "en";
        return this.translations?.[lang]?.[key] || key;
    },

    init() {
        const saved = localStorage.getItem("cz_lang");
        this.current = saved || "en";
    },

    set(lang) {
        if (!this.translations[lang]) return;

        this.current = lang;
        localStorage.setItem("cz_lang", lang);
    }
};
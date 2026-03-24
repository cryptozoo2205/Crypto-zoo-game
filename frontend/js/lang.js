window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.lang = {
    current: "en",

    translations: {
        en: {
            // GENERAL
            collect: "Collect reward",
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

            // DAILY
            dailyReward: "Daily Reward",
            day: "Day",

            // MISSIONS
            dailyMission: "Daily Mission",
            dailyMissions: "Daily Missions",
            inProgress: "In progress",
            completed: "Completed",
            reward: "Reward",

            // EXPEDITIONS
            expeditionStarted: "Expedition started",
            expeditionComplete: "Expedition complete",
            noActiveExpedition: "No active expedition",
            timeLeft: "Time left",
            rewardWallet: "Reward Wallet",

            // SHOP
            buy: "Buy",
            buyWithGems: "Buy with gems",
            cost: "Cost",
            owned: "Owned",
            charges: "Charges",
            available: "Available",

            // BOOST
            boostActive: "Boost active",
            needGemBoost: "You need 1 gem for X2 Boost",
            boostActiveShort: "Active",

            // TOAST
            needGem: "You need 1 gem",
            noExpedition: "No expedition",
            expeditionRunning: "Expedition is still running",
            timeReduced: "Time reduced",

            // OFFLINE
            offlineEarnings: "Offline Earnings",
            baseLimit: "Base limit",
            activeMultiplier: "Active multiplier",
            standardMultiplier: "Standard multiplier"
        },

        pl: {
            // GENERAL
            collect: "Odbierz nagrodę",
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

            // DAILY
            dailyReward: "Daily Reward",
            day: "Dzień",

            // MISSIONS
            dailyMission: "Misja dzienna",
            dailyMissions: "Misje dzienne",
            inProgress: "W trakcie",
            completed: "Ukończone",
            reward: "Nagroda",

            // EXPEDITIONS
            expeditionStarted: "Ekspedycja rozpoczęta",
            expeditionComplete: "Ekspedycja zakończona",
            noActiveExpedition: "Brak ekspedycji",
            timeLeft: "Pozostało",
            rewardWallet: "Reward Wallet",

            // SHOP
            buy: "Kup",
            buyWithGems: "Kup za gemy",
            cost: "Koszt",
            owned: "Posiadane",
            charges: "Ładunki",
            available: "Dostępne",

            // BOOST
            boostActive: "Boost aktywny",
            needGemBoost: "Potrzebujesz 1 gema na X2 Boost",
            boostActiveShort: "Aktywny",

            // TOAST
            needGem: "Potrzebujesz gema",
            noExpedition: "Brak ekspedycji",
            expeditionRunning: "Ekspedycja jeszcze trwa",
            timeReduced: "Skrócono czas",

            // OFFLINE
            offlineEarnings: "Offline Earnings",
            baseLimit: "Limit bazowy",
            activeMultiplier: "Aktywny mnożnik",
            standardMultiplier: "Standardowy mnożnik"
        }
    },

    t(key) {
        const lang = this.current || "en";
        return this.translations?.[lang]?.[key] || key;
    },

    detectFromTelegram() {
        try {
            const tgLang =
                window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

            if (!tgLang) return "en";

            if (tgLang.startsWith("pl")) return "pl";
            return "en";
        } catch (e) {
            return "en";
        }
    },

    init() {
        const saved = localStorage.getItem("cz_lang");

        if (saved) {
            this.current = saved;
        } else {
            this.current = this.detectFromTelegram();
        }
    },

    set(lang) {
        if (!this.translations[lang]) return;

        this.current = lang;
        localStorage.setItem("cz_lang", lang);

        CryptoZoo.ui?.render?.();
    }
};
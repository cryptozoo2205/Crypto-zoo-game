window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyMissions = {
    storageKey: "cryptozoo_daily_missions_seed",

    getDefaultState() {
        return {
            dayKey: "",
            missions: [],
            claimedCount: 0
        };
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        if (!CryptoZoo.state.dailyMissions || typeof CryptoZoo.state.dailyMissions !== "object") {
            CryptoZoo.state.dailyMissions = this.getDefaultState();
        }

        CryptoZoo.state.dailyMissions.dayKey =
            String(CryptoZoo.state.dailyMissions.dayKey || "");

        CryptoZoo.state.dailyMissions.claimedCount = Math.max(
            0,
            Number(CryptoZoo.state.dailyMissions.claimedCount) || 0
        );

        if (!Array.isArray(CryptoZoo.state.dailyMissions.missions)) {
            CryptoZoo.state.dailyMissions.missions = [];
        }
    },

    getTodayKey() {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    },

    getSeedForDay(dayKey) {
        const saved = localStorage.getItem(`${this.storageKey}_${dayKey}`);
        if (saved) {
            return Number(saved) || 1;
        }

        let seed = 0;
        for (let i = 0; i < dayKey.length; i += 1) {
            seed += dayKey.charCodeAt(i) * (i + 1);
        }

        seed = Math.max(1, seed);
        localStorage.setItem(`${this.storageKey}_${dayKey}`, String(seed));
        return seed;
    },

    seededPick(options, count, seed) {
        const list = Array.isArray(options) ? [...options] : [];
        const picked = [];
        let currentSeed = Math.max(1, Number(seed) || 1);

        while (list.length > 0 && picked.length < count) {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            const index = currentSeed % list.length;
            picked.push(list[index]);
            list.splice(index, 1);
        }

        return picked;
    },

    buildMissionTemplates() {
        return [
            {
                id: "tap_100",
                type: "tap",
                target: 100,
                title: "Kliknij 100 razy",
                rewardCoins: 800,
                rewardGems: 0
            },
            {
                id: "tap_250",
                type: "tap",
                target: 250,
                title: "Kliknij 250 razy",
                rewardCoins: 1800,
                rewardGems: 1
            },
            {
                id: "tap_500",
                type: "tap",
                target: 500,
                title: "Kliknij 500 razy",
                rewardCoins: 4200,
                rewardGems: 1
            },
            {
                id: "spend_5000",
                type: "spendCoins",
                target: 5000,
                title: "Wydaj 5K coins",
                rewardCoins: 1200,
                rewardGems: 0
            },
            {
                id: "spend_25000",
                type: "spendCoins",
                target: 25000,
                title: "Wydaj 25K coins",
                rewardCoins: 3500,
                rewardGems: 1
            },
            {
                id: "spend_100000",
                type: "spendCoins",
                target: 100000,
                title: "Wydaj 100K coins",
                rewardCoins: 12000,
                rewardGems: 2
            },
            {
                id: "expedition_1",
                type: "startExpedition",
                target: 1,
                title: "Uruchom 1 ekspedycję",
                rewardCoins: 1500,
                rewardGems: 0
            },
            {
                id: "expedition_2",
                type: "startExpedition",
                target: 2,
                title: "Uruchom 2 ekspedycje",
                rewardCoins: 4500,
                rewardGems: 1
            },
            {
                id: "spin_1",
                type: "spinWheel",
                target: 1,
                title: "Zakręć kołem 1 raz",
                rewardCoins: 1000,
                rewardGems: 0
            }
        ];
    },

    makeMission(template) {
        return {
            id: String(template.id || ""),
            type: String(template.type || ""),
            target: Math.max(1, Number(template.target) || 1),
            progress: 0,
            title: String(template.title || "Misja"),
            rewardCoins: Math.max(0, Number(template.rewardCoins) || 0),
            rewardGems: Math.max(0, Number(template.rewardGems) || 0),
            claimed: false
        };
    },

    generateDailyMissions(dayKey) {
        const templates = this.buildMissionTemplates();
        const seed = this.getSeedForDay(dayKey);
        const picked = this.seededPick(templates, 3, seed);

        return picked.map((template) => this.makeMission(template));
    },

    refreshDayIfNeeded() {
        this.ensureState();

        const todayKey = this.getTodayKey();
        const state = CryptoZoo.state.dailyMissions;

        if (state.dayKey === todayKey && Array.isArray(state.missions) && state.missions.length > 0) {
            return false;
        }

        state.dayKey = todayKey;
        state.claimedCount = 0;
        state.missions = this.generateDailyMissions(todayKey);
        return true;
    },

    init() {
        this.ensureState();
        const changed = this.refreshDayIfNeeded();

        if (changed) {
            CryptoZoo.api?.savePlayer?.();
        }
    },

    getAll() {
        this.ensureState();
        this.refreshDayIfNeeded();
        return Array.isArray(CryptoZoo.state.dailyMissions.missions)
            ? CryptoZoo.state.dailyMissions.missions
            : [];
    },

    getById(missionId) {
        return this.getAll().find((mission) => mission.id === missionId) || null;
    },

    getCompletedCount() {
        return this.getAll().filter((mission) => mission.claimed).length;
    },

    isCompleted(mission) {
        return !!mission && Number(mission.progress || 0) >= Number(mission.target || 0);
    },

    clampMissionProgress(mission) {
        if (!mission) return;

        mission.progress = Math.max(0, Number(mission.progress) || 0);
        mission.target = Math.max(1, Number(mission.target) || 1);

        if (mission.progress > mission.target) {
            mission.progress = mission.target;
        }
    },

    addProgress(type, amount = 1) {
        this.ensureState();
        this.refreshDayIfNeeded();

        const safeAmount = Math.max(0, Number(amount) || 0);
        if (safeAmount <= 0) return false;

        let changed = false;

        this.getAll().forEach((mission) => {
            if (mission.claimed) return;
            if (mission.type !== type) return;

            const before = Number(mission.progress) || 0;
            mission.progress = before + safeAmount;
            this.clampMissionProgress(mission);

            if ((Number(mission.progress) || 0) !== before) {
                changed = true;
            }
        });

        if (changed) {
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }

        return changed;
    },

    recordTap(count = 1) {
        return this.addProgress("tap", count);
    },

    recordSpendCoins(amount) {
        return this.addProgress("spendCoins", amount);
    },

    recordStartExpedition(count = 1) {
        return this.addProgress("startExpedition", count);
    },

    recordSpinWheel(count = 1) {
        return this.addProgress("spinWheel", count);
    },

    claimMission(missionId) {
        const mission = this.getById(missionId);

        if (!mission) {
            CryptoZoo.ui?.showToast?.("Nie znaleziono misji");
            return false;
        }

        if (mission.claimed) {
            CryptoZoo.ui?.showToast?.("Misja już odebrana");
            return false;
        }

        if (!this.isCompleted(mission)) {
            CryptoZoo.ui?.showToast?.("Misja jeszcze nieukończona");
            return false;
        }

        const rewardCoins = Math.max(0, Number(mission.rewardCoins) || 0);
        const rewardGems = Math.max(0, Number(mission.rewardGems) || 0);

        CryptoZoo.state.coins = (Number(CryptoZoo.state?.coins) || 0) + rewardCoins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state?.gems) || 0) + rewardGems;

        mission.claimed = true;
        CryptoZoo.state.dailyMissions.claimedCount = this.getCompletedCount();

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(
            `🎯 Misja ukończona • +${CryptoZoo.formatNumber(rewardCoins)} coins${rewardGems > 0 ? ` +${CryptoZoo.formatNumber(rewardGems)} gem` : ""}`
        );

        return true;
    }
};

CryptoZoo.dailyMissions.init();
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

        CryptoZoo.state.dailyMissions.dayKey = String(CryptoZoo.state.dailyMissions.dayKey || "");
        CryptoZoo.state.dailyMissions.claimedCount = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state.dailyMissions.claimedCount) || 0)
        );

        if (!Array.isArray(CryptoZoo.state.dailyMissions.missions)) {
            CryptoZoo.state.dailyMissions.missions = [];
        }

        CryptoZoo.state.dailyMissions.missions = CryptoZoo.state.dailyMissions.missions
            .map((mission) => {
                const normalized = {
                    id: String(mission?.id || ""),
                    type: String(mission?.type || ""),
                    target: Math.max(1, Math.floor(Number(mission?.target) || 1)),
                    progress: Math.max(0, Number(mission?.progress) || 0),
                    title: String(mission?.title || "Misja"),
                    rewardCoins: Math.max(0, Number(mission?.rewardCoins) || 0),
                    rewardGems: Math.max(0, Number(mission?.rewardGems) || 0),
                    claimed: !!mission?.claimed
                };

                if (
                    normalized.type !== "tap" &&
                    normalized.type !== "spendCoins" &&
                    normalized.type !== "startExpedition"
                ) {
                    return null;
                }

                if (normalized.progress > normalized.target) {
                    normalized.progress = normalized.target;
                }

                return normalized;
            })
            .filter(Boolean);
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
                rewardCoins: 180,
                rewardGems: 0
            },
            {
                id: "tap_250",
                type: "tap",
                target: 250,
                title: "Kliknij 250 razy",
                rewardCoins: 320,
                rewardGems: 0
            },
            {
                id: "tap_500",
                type: "tap",
                target: 500,
                title: "Kliknij 500 razy",
                rewardCoins: 650,
                rewardGems: 1
            },
            {
                id: "spend_5000",
                type: "spendCoins",
                target: 5000,
                title: "Wydaj 5K coins",
                rewardCoins: 250,
                rewardGems: 0
            },
            {
                id: "spend_25000",
                type: "spendCoins",
                target: 25000,
                title: "Wydaj 25K coins",
                rewardCoins: 700,
                rewardGems: 0
            },
            {
                id: "spend_100000",
                type: "spendCoins",
                target: 100000,
                title: "Wydaj 100K coins",
                rewardCoins: 1800,
                rewardGems: 1
            },
            {
                id: "expedition_1",
                type: "startExpedition",
                target: 1,
                title: "Uruchom 1 ekspedycję",
                rewardCoins: 300,
                rewardGems: 0
            },
            {
                id: "expedition_2",
                type: "startExpedition",
                target: 2,
                title: "Uruchom 2 ekspedycje",
                rewardCoins: 900,
                rewardGems: 1
            }
        ];
    },

    makeMission(template) {
        return {
            id: String(template.id || ""),
            type: String(template.type || ""),
            target: Math.max(1, Math.floor(Number(template.target) || 1)),
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

    countClaimedMissions(missions) {
        const list = Array.isArray(missions) ? missions : [];
        return list.filter((mission) => !!mission?.claimed).length;
    },

    refreshDayIfNeeded() {
        this.ensureState();

        const todayKey = this.getTodayKey();
        const state = CryptoZoo.state.dailyMissions;

        if (state.dayKey === todayKey && Array.isArray(state.missions) && state.missions.length > 0) {
            state.claimedCount = this.countClaimedMissions(state.missions);
            return false;
        }

        state.dayKey = todayKey;
        state.missions = this.generateDailyMissions(todayKey);
        state.claimedCount = 0;
        return true;
    },

    init() {
        if (!CryptoZoo.state || typeof CryptoZoo.state !== "object") {
            return false;
        }

        this.ensureState();
        const changed = this.refreshDayIfNeeded();

        if (changed && CryptoZoo.api?.initialized) {
            CryptoZoo.api?.savePlayer?.();
        }

        return changed;
    },

    getAll() {
        this.ensureState();
        this.refreshDayIfNeeded();

        const missions = Array.isArray(CryptoZoo.state.dailyMissions.missions)
            ? CryptoZoo.state.dailyMissions.missions
            : [];

        CryptoZoo.state.dailyMissions.claimedCount = this.countClaimedMissions(missions);
        return missions;
    },

    getById(missionId) {
        return this.getAll().find((mission) => mission.id === missionId) || null;
    },

    getCompletedCount() {
        return this.countClaimedMissions(this.getAll());
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

    getVisibleMissionIndex() {
        const missions = this.getAll();

        if (!missions.length) {
            return -1;
        }

        const firstUnclaimedIndex = missions.findIndex((mission) => !mission.claimed);

        if (firstUnclaimedIndex !== -1) {
            return firstUnclaimedIndex;
        }

        return missions.length - 1;
    },

    getVisibleMission() {
        const index = this.getVisibleMissionIndex();
        const missions = this.getAll();

        if (index < 0 || !missions[index]) {
            return null;
        }

        return missions[index];
    },

    getVisibleMissions() {
        const mission = this.getVisibleMission();
        return mission ? [mission] : [];
    },

    hasNextMission() {
        const missions = this.getAll();
        return missions.some((mission) => !mission.claimed);
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
            CryptoZoo.state.dailyMissions.claimedCount = this.countClaimedMissions(
                CryptoZoo.state.dailyMissions.missions
            );
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
        CryptoZoo.state.dailyMissions.claimedCount = this.countClaimedMissions(
            CryptoZoo.state.dailyMissions.missions
        );

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

if (CryptoZoo.state && typeof CryptoZoo.state === "object") {
    CryptoZoo.dailyMissions.init();
}
const EXPEDITIONS_CONFIG = {
    jungle_scout: {
        id: "jungle_scout",
        regionId: "jungle",
        name: "Jungle Scout",
        duration: 300,
        baseDuration: 300,
        baseCoins: 80,
        startCostCoins: 50,
        gemChance: 0.01,
        rareChance: 0.12,
        epicChance: 0.01,
        unlockLevel: 1,
        enabled: true
    },
    jungle_river: {
        id: "jungle_river",
        regionId: "jungle",
        name: "Jungle River",
        duration: 900,
        baseDuration: 900,
        baseCoins: 350,
        startCostCoins: 260,
        gemChance: 0.016,
        rareChance: 0.13,
        epicChance: 0.015,
        unlockLevel: 6,
        enabled: true
    },
    jungle_ruins: {
        id: "jungle_ruins",
        regionId: "jungle",
        name: "Jungle Ruins",
        duration: 1800,
        baseDuration: 1800,
        baseCoins: 1050,
        startCostCoins: 780,
        gemChance: 0.022,
        rareChance: 0.145,
        epicChance: 0.022,
        unlockLevel: 12,
        enabled: true
    },
    jungle_canopy: {
        id: "jungle_canopy",
        regionId: "jungle",
        name: "Jungle Canopy",
        duration: 3600,
        baseDuration: 3600,
        baseCoins: 2900,
        startCostCoins: 2100,
        gemChance: 0.028,
        rareChance: 0.155,
        epicChance: 0.028,
        unlockLevel: 18,
        enabled: true
    },
    jungle_depths: {
        id: "jungle_depths",
        regionId: "jungle",
        name: "Jungle Depths",
        duration: 7200,
        baseDuration: 7200,
        baseCoins: 7600,
        startCostCoins: 5200,
        gemChance: 0.035,
        rareChance: 0.165,
        epicChance: 0.035,
        unlockLevel: 24,
        enabled: true
    },
    jungle_temple: {
        id: "jungle_temple",
        regionId: "jungle",
        name: "Jungle Temple",
        duration: 14400,
        baseDuration: 14400,
        baseCoins: 19000,
        startCostCoins: 12800,
        gemChance: 0.045,
        rareChance: 0.175,
        epicChance: 0.045,
        unlockLevel: 32,
        enabled: true
    },
    jungle_king: {
        id: "jungle_king",
        regionId: "jungle",
        name: "Jungle King",
        duration: 28800,
        baseDuration: 28800,
        baseCoins: 47000,
        startCostCoins: 29500,
        gemChance: 0.058,
        rareChance: 0.185,
        epicChance: 0.058,
        unlockLevel: 40,
        enabled: true
    },

    desert_outpost: {
        id: "desert_outpost",
        regionId: "desert",
        name: "Desert Outpost",
        duration: 43200,
        baseDuration: 43200,
        baseCoins: 104000,
        startCostCoins: 63000,
        gemChance: 0.072,
        rareChance: 0.195,
        epicChance: 0.072,
        unlockLevel: 48,
        enabled: true
    },
    desert_dunes: {
        id: "desert_dunes",
        regionId: "desert",
        name: "Desert Dunes",
        duration: 86400,
        baseDuration: 86400,
        baseCoins: 235000,
        startCostCoins: 132000,
        gemChance: 0.09,
        rareChance: 0.21,
        epicChance: 0.09,
        unlockLevel: 56,
        enabled: true
    }
};

function getAllExpeditions() {
    return Object.values(EXPEDITIONS_CONFIG);
}

function getExpeditionById(expeditionId) {
    return EXPEDITIONS_CONFIG[String(expeditionId || "").trim()] || null;
}

function getExpeditionsByRegion(regionId) {
    const safeRegionId = String(regionId || "").trim();

    return getAllExpeditions()
        .filter((expedition) => expedition.regionId === safeRegionId)
        .sort((a, b) => {
            if (a.unlockLevel !== b.unlockLevel) {
                return Number(a.unlockLevel || 0) - Number(b.unlockLevel || 0);
            }

            return Number(a.baseDuration || 0) - Number(b.baseDuration || 0);
        });
}

function getAvailableExpeditionsForLevel(level) {
    const safeLevel = Math.max(1, Number(level) || 1);

    return getAllExpeditions()
        .filter((expedition) => {
            return expedition.enabled !== false &&
                safeLevel >= Math.max(1, Number(expedition.unlockLevel) || 1);
        })
        .sort((a, b) => {
            if (a.unlockLevel !== b.unlockLevel) {
                return Number(a.unlockLevel || 0) - Number(b.unlockLevel || 0);
            }

            return Number(a.baseDuration || 0) - Number(b.baseDuration || 0);
        });
}

module.exports = {
    EXPEDITIONS_CONFIG,
    getAllExpeditions,
    getExpeditionById,
    getExpeditionsByRegion,
    getAvailableExpeditionsForLevel
};
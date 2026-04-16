const REGIONS_CONFIG = {
    jungle: {
        id: "jungle",
        name: "Jungle",
        namePl: "Dżungla",
        nameEn: "Jungle",
        minLevel: 1,
        maxLevel: 48,
        order: 1,
        enabled: true
    },
    desert: {
        id: "desert",
        name: "Desert",
        namePl: "Pustynia",
        nameEn: "Desert",
        minLevel: 49,
        maxLevel: null,
        order: 2,
        enabled: true
    }
};

function getOrderedRegions() {
    return Object.values(REGIONS_CONFIG)
        .filter((region) => region.enabled !== false)
        .sort((a, b) => {
            return Number(a.order || 0) - Number(b.order || 0);
        });
}

function getRegionById(regionId) {
    return REGIONS_CONFIG[String(regionId || "").trim()] || null;
}

function isLevelInRegion(region, level) {
    const safeLevel = Math.max(1, Number(level) || 1);

    const minLevel = Math.max(1, Number(region?.minLevel) || 1);

    const maxLevel =
        region?.maxLevel === null || region?.maxLevel === undefined
            ? null
            : Math.max(minLevel, Number(region.maxLevel) || minLevel);

    if (maxLevel === null) {
        return safeLevel >= minLevel;
    }

    return safeLevel >= minLevel && safeLevel <= maxLevel;
}

function getRegionForLevel(level) {
    const safeLevel = Math.max(1, Number(level) || 1);

    const regions = getOrderedRegions();

    for (let i = 0; i < regions.length; i++) {
        if (isLevelInRegion(regions[i], safeLevel)) {
            return regions[i];
        }
    }

    return null;
}

function getNextRegion(currentRegionId) {
    const ordered = getOrderedRegions();
    const index = ordered.findIndex((r) => r.id === currentRegionId);

    if (index === -1) return null;

    return ordered[index + 1] || null;
}

function isLastRegion(regionId) {
    const ordered = getOrderedRegions();
    return ordered.length > 0 && ordered[ordered.length - 1].id === regionId;
}

module.exports = {
    REGIONS_CONFIG,
    getOrderedRegions,
    getRegionById,
    getRegionForLevel,
    isLevelInRegion,
    getNextRegion,
    isLastRegion
};
const REGIONS_CONFIG = {
    jungle: {
        id: "jungle",
        name: "Jungle",
        minLevel: 1,
        maxLevel: 48,
        order: 1,
        enabled: true
    },
    desert: {
        id: "desert",
        name: "Desert",
        minLevel: 48,
        maxLevel: null,
        order: 2,
        enabled: true
    }
};

function getOrderedRegions() {
    return Object.values(REGIONS_CONFIG).sort((a, b) => {
        return Number(a.order || 0) - Number(b.order || 0);
    });
}

function getRegionById(regionId) {
    return REGIONS_CONFIG[String(regionId || "").trim()] || null;
}

function getRegionForLevel(level) {
    const safeLevel = Math.max(1, Number(level) || 1);
    const ordered = getOrderedRegions();

    return (
        ordered.find((region) => {
            const minLevel = Math.max(1, Number(region.minLevel) || 1);
            const maxLevel =
                region.maxLevel === null || region.maxLevel === undefined
                    ? null
                    : Math.max(minLevel, Number(region.maxLevel) || minLevel);

            if (maxLevel === null) {
                return safeLevel >= minLevel;
            }

            return safeLevel >= minLevel && safeLevel <= maxLevel;
        }) || null
    );
}

module.exports = {
    REGIONS_CONFIG,
    getOrderedRegions,
    getRegionById,
    getRegionForLevel
};
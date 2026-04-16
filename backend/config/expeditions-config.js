const { EXPEDITIONS_CONFIG } = require("./game-config");

function getAllExpeditions() {
    return Object.values(EXPEDITIONS_CONFIG || {});
}

function getExpeditionById(expeditionId) {
    return EXPEDITIONS_CONFIG[String(expeditionId || "").trim()] || null;
}

function getExpeditionsByRegion(regionId) {
    const safeRegionId = String(regionId || "").trim();

    return getAllExpeditions()
        .filter((expedition) => expedition.regionId === safeRegionId)
        .sort((a, b) => {
            if (Number(a.unlockLevel || 0) !== Number(b.unlockLevel || 0)) {
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
            if (Number(a.unlockLevel || 0) !== Number(b.unlockLevel || 0)) {
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
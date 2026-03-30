const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const DB_TMP_PATH = path.join(DATA_DIR, "db.tmp.json");
const DB_BACKUP_PATH = path.join(DATA_DIR, "db.backup.json");

function getDefaultDb() {
    return {
        players: {},
        withdrawRequests: [],
        deposits: []
    };
}

function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeDbShape(parsed) {
    const safe = isObject(parsed) ? parsed : {};

    return {
        players: isObject(safe.players) ? safe.players : {},
        withdrawRequests: Array.isArray(safe.withdrawRequests)
            ? safe.withdrawRequests
            : [],
        deposits: Array.isArray(safe.deposits)
            ? safe.deposits
            : []
    };
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function safeWriteJson(filePath, data) {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, json, "utf8");
}

function readJsonSafe(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const raw = fs.readFileSync(filePath, "utf8");
        if (!raw || !raw.trim()) {
            return null;
        }
        return JSON.parse(raw);
    } catch (error) {
        console.error(`JSON read error for ${filePath}:`, error);
        return null;
    }
}

function atomicWriteDb(db) {
    ensureDataDir();

    const normalized = normalizeDbShape(db);

    safeWriteJson(DB_TMP_PATH, normalized);

    if (fs.existsSync(DB_PATH)) {
        try {
            fs.copyFileSync(DB_PATH, DB_BACKUP_PATH);
        } catch (error) {
            console.error("DB backup copy error:", error);
        }
    }

    fs.renameSync(DB_TMP_PATH, DB_PATH);
}

function ensureDb() {
    ensureDataDir();

    if (!fs.existsSync(DB_PATH)) {
        atomicWriteDb(getDefaultDb());
        return;
    }

    const parsed = readJsonSafe(DB_PATH);

    if (parsed) {
        const normalized = normalizeDbShape(parsed);
        atomicWriteDb(normalized);
        return;
    }

    const backupParsed = readJsonSafe(DB_BACKUP_PATH);

    if (backupParsed) {
        console.warn("Main DB broken, restoring from backup.");
        atomicWriteDb(normalizeDbShape(backupParsed));
        return;
    }

    console.error("DB ensure/repair error: main and backup invalid, recreating default DB.");
    atomicWriteDb(getDefaultDb());
}

function readDb() {
    ensureDb();

    const parsed = readJsonSafe(DB_PATH);
    if (parsed) {
        return normalizeDbShape(parsed);
    }

    const backupParsed = readJsonSafe(DB_BACKUP_PATH);
    if (backupParsed) {
        console.warn("DB read fallback: using backup DB.");
        const normalized = normalizeDbShape(backupParsed);
        atomicWriteDb(normalized);
        return normalized;
    }

    console.error("DB read error: using default DB in memory.");
    return getDefaultDb();
}

function writeDb(db) {
    ensureDb();
    atomicWriteDb(db);
}

module.exports = {
    DATA_DIR,
    DB_PATH,
    ensureDb,
    readDb,
    writeDb
};
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function getDefaultDb() {
    return {
        players: {},
        withdrawRequests: [],
        deposits: []
    };
}

function normalizeDbShape(parsed) {
    const safe = parsed && typeof parsed === "object" ? parsed : {};

    return {
        players: safe.players && typeof safe.players === "object" ? safe.players : {},
        withdrawRequests: Array.isArray(safe.withdrawRequests)
            ? safe.withdrawRequests
            : [],
        deposits: Array.isArray(safe.deposits)
            ? safe.deposits
            : []
    };
}

function ensureDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(getDefaultDb(), null, 2),
            "utf8"
        );
        return;
    }

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        const parsed = raw ? JSON.parse(raw) : getDefaultDb();
        const normalized = normalizeDbShape(parsed);

        fs.writeFileSync(DB_PATH, JSON.stringify(normalized, null, 2), "utf8");
    } catch (error) {
        console.error("DB ensure/repair error:", error);
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(getDefaultDb(), null, 2),
            "utf8"
        );
    }
}

function readDb() {
    ensureDb();

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        const parsed = JSON.parse(raw);
        return normalizeDbShape(parsed);
    } catch (error) {
        console.error("DB read error:", error);
        return getDefaultDb();
    }
}

function writeDb(db) {
    ensureDb();
    const normalized = normalizeDbShape(db);
    fs.writeFileSync(DB_PATH, JSON.stringify(normalized, null, 2), "utf8");
}

module.exports = {
    DATA_DIR,
    DB_PATH,
    ensureDb,
    readDb,
    writeDb
};
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(
                {
                    players: {},
                    withdrawRequests: []
                },
                null,
                2
            ),
            "utf8"
        );
    }
}

function readDb() {
    ensureDb();

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        const parsed = JSON.parse(raw);

        return {
            players: parsed.players || {},
            withdrawRequests: Array.isArray(parsed.withdrawRequests)
                ? parsed.withdrawRequests
                : []
        };
    } catch (error) {
        console.error("DB read error:", error);
        return {
            players: {},
            withdrawRequests: []
        };
    }
}

function writeDb(db) {
    ensureDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

module.exports = {
    DATA_DIR,
    DB_PATH,
    ensureDb,
    readDb,
    writeDb
};
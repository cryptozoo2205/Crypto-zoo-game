require("dotenv").config();
require("./bot");

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { ensureDb } = require("./db/db");
const healthRoutes = require("./routes/health-routes");
const playerRoutes = require("./routes/player-routes");
const rankingRoutes = require("./routes/ranking-routes");
const referralRoutes = require("./routes/referral-routes");
const withdrawRoutes = require("./routes/withdraw-routes");
const depositRoutes = require("./routes/deposit-routes");
const depositVerifierRoutes = require("./routes/deposit-verifier-routes");

process.on("uncaughtException", (error) => {
    console.error("UNCAUGHT EXCEPTION:", error);
});

process.on("unhandledRejection", (error) => {
    console.error("UNHANDLED REJECTION:", error);
});

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const INDEX_PATH = path.join(FRONTEND_DIR, "index.html");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.locals.paths = {
    FRONTEND_DIR,
    INDEX_PATH
};

app.use(healthRoutes);
app.use(playerRoutes);
app.use(rankingRoutes);
app.use(referralRoutes);
app.use(withdrawRoutes);
app.use(depositRoutes);
app.use(depositVerifierRoutes);

if (fs.existsSync(FRONTEND_DIR)) {
    app.use(express.static(FRONTEND_DIR));
}

app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
    }

    if (fs.existsSync(INDEX_PATH)) {
        return res.sendFile(INDEX_PATH);
    }

    return res.status(404).send("Not found");
});




ensureDb();

app.listen(PORT, () => {
    console.log("Crypto Zoo backend starting...");
    console.log("PORT:", PORT);
    console.log("FRONTEND_DIR:", FRONTEND_DIR, fs.existsSync(FRONTEND_DIR) ? "[OK]" : "[MISSING]");
    console.log("INDEX_PATH:", INDEX_PATH, fs.existsSync(INDEX_PATH) ? "[OK]" : "[MISSING]");
    console.log(`Crypto Zoo backend running on port ${PORT}`);
});
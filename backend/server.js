require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 📁 Ścieżki
const FRONTEND_DIR = path.join(__dirname, "../frontend");
const INDEX_PATH = path.join(FRONTEND_DIR, "index.html");

// 🧠 Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// 📦 ROUTES
const healthRoutes = require("./routes/health-routes");
const playerRoutes = require("./routes/player-routes");
const rankingRoutes = require("./routes/ranking-routes");
const referralRoutes = require("./routes/referral-routes");
const withdrawRoutes = require("./routes/withdraw-routes");
const depositRoutes = require("./routes/deposit-routes");
const depositVerifierRoutes = require("./routes/deposit-verifier-routes");
const rewardRoutes = require("./routes/reward-routes");
const expeditionRoutes = require("./routes/expedition-routes");

// 🔥 API ROUTING
app.use("/api/health", healthRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api", referralRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/deposit-verifier", depositVerifierRoutes);
app.use("/api/reward", rewardRoutes);
app.use("/api/expedition", expeditionRoutes);

// 🖼️ STATIC FILES
if (fs.existsSync(FRONTEND_DIR)) {
    console.log("Frontend found:", FRONTEND_DIR);

    app.use(express.static(FRONTEND_DIR));
    app.use("/assets", express.static(path.join(FRONTEND_DIR, "assets")));
} else {
    console.warn("Frontend NOT found:", FRONTEND_DIR);
}

// 🧠 FALLBACK
app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({
            error: "API route not found"
        });
    }

    if (fs.existsSync(INDEX_PATH)) {
        return res.sendFile(INDEX_PATH);
    }

    return res.status(200).send("Backend działa, ale frontend nie znaleziony");
});

// 🟢 START
app.listen(PORT, () => {
    console.log("🚀 Crypto Zoo backend running");
    console.log("PORT:", PORT);
    console.log("FRONTEND_DIR:", FRONTEND_DIR, fs.existsSync(FRONTEND_DIR));
    console.log("INDEX_PATH:", INDEX_PATH, fs.existsSync(INDEX_PATH));
});
// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------
// MongoDB Atlas
// -------------------------
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Połączono z MongoDB Atlas"))
    .catch(err => console.log("❌ Błąd MongoDB:", err));

// -------------------------
// Serwowanie statycznych plików frontend
// -------------------------
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// -------------------------
// Model gracza
// -------------------------
const playerSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String },
    coins: { type: Number, default: 0 },
    animals: { type: Object, default: {} },
    level: { type: Number, default: 1 },
    coinsPerClick: { type: Number, default: 1 },
    upgradeCost: { type: Number, default: 50 }
});

const Player = mongoose.model("Player", playerSchema);

// -------------------------
// API
// -------------------------
app.get("/player/:telegramId", async (req, res) => {
    try {
        const player = await Player.findOne({ telegramId: req.params.telegramId });
        if (!player) {
            return res.status(404).json({ message: "Nie znaleziono gracza" });
        }
        res.json(player);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/player", async (req, res) => {
    try {
        const {
            telegramId,
            username,
            coins,
            animals,
            level,
            coinsPerClick,
            upgradeCost
        } = req.body;

        let player = await Player.findOne({ telegramId });

        if (player) {
            player.username = username;
            player.coins = coins;
            player.animals = animals;
            player.level = level;
            player.coinsPerClick = coinsPerClick;
            player.upgradeCost = upgradeCost;

            await player.save();

            res.json({ message: "Zaktualizowano gracza", player });
        } else {
            player = new Player({
                telegramId,
                username,
                coins,
                animals,
                level,
                coinsPerClick,
                upgradeCost
            });

            await player.save();

            res.json({ message: "Dodano nowego gracza", player });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/ranking", async (req, res) => {
    try {
        const topPlayers = await Player.find().sort({ coins: -1 }).limit(100);
        res.json(topPlayers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/test", (req, res) => {
    res.send("✅ Backend działa!");
});

// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend działa na porcie ${PORT}`));
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/user");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB error:", error);
    });

function getDefaultAnimals() {
    return {
        monkey: { count: 0, level: 1 },
        rabbit: { count: 0, level: 1 },
        parrot: { count: 0, level: 1 },
        turtle: { count: 0, level: 1 },
        panda: { count: 0, level: 1 },
        wolf: { count: 0, level: 1 },
        flamingo: { count: 0, level: 1 },
        lion: { count: 0, level: 1 },
        tiger: { count: 0, level: 1 },
        elephant: { count: 0, level: 1 }
    };
}

app.get("/api/player/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;

        let user = await User.findOne({ telegramId });

        if (!user) {
            user = await User.create({
                telegramId,
                username: "Gracz",
                coins: 0,
                level: 1,
                coinsPerClick: 1,
                upgradeCost: 50,
                animals: getDefaultAnimals()
            });
        }

        res.json(user);
    } catch (error) {
        console.error("GET /api/player/:telegramId error:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.post("/api/player", async (req, res) => {
    try {
        const {
            telegramId,
            username,
            coins,
            level,
            coinsPerClick,
            upgradeCost,
            animals
        } = req.body;

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const user = await User.findOneAndUpdate(
            { telegramId },
            {
                telegramId,
                username: username || "Gracz",
                coins: Number(coins) || 0,
                level: Number(level) || 1,
                coinsPerClick: Number(coinsPerClick) || 1,
                upgradeCost: Number(upgradeCost) || 50,
                animals: animals || getDefaultAnimals()
            },
            {
                new: true,
                upsert: true
            }
        );

        res.json(user);
    } catch (error) {
        console.error("POST /api/player error:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.get("/api/ranking", async (req, res) => {
    try {
        const ranking = await User.find({})
            .sort({ coins: -1 })
            .limit(50)
            .select("username coins level telegramId");

        res.json(ranking);
    } catch (error) {
        console.error("GET /api/ranking error:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/player/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;

        let user = await User.findOne({ telegramId });

        if (!user) {
            user = await User.create({
                telegramId,
                username: `Gracz_${telegramId}`
            });
        }

        res.json(user);
    } catch (error) {
        console.error("GET /player/:telegramId error:", error);
        res.status(500).json({ error: "Błąd pobierania gracza" });
    }
});

app.post("/player/update", async (req, res) => {
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
            return res.status(400).json({ error: "Brak telegramId" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { telegramId },
            {
                telegramId,
                username: username || `Gracz_${telegramId}`,
                coins: Number(coins) || 0,
                level: Number(level) || 1,
                coinsPerClick: Number(coinsPerClick) || 1,
                upgradeCost: Number(upgradeCost) || 50,
                animals: {
                    monkey: Number(animals?.monkey) || 0,
                    panda: Number(animals?.panda) || 0,
                    lion: Number(animals?.lion) || 0
                }
            },
            {
                new: true,
                upsert: true
            }
        );

        res.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error("POST /player/update error:", error);
        res.status(500).json({ error: "Błąd zapisu gracza" });
    }
});

app.get("/ranking", async (req, res) => {
    try {
        const ranking = await User.find({})
            .sort({ coins: -1 })
            .limit(10)
            .select("username coins");

        res.json(ranking);
    } catch (error) {
        console.error("GET /ranking error:", error);
        res.status(500).json({ error: "Błąd pobierania rankingu" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
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

function normalizeAnimals(animals) {
    const raw = animals || {};

    function normalizeAnimal(animalValue) {
        if (typeof animalValue === "number") {
            return {
                count: animalValue,
                level: 1
            };
        }

        return {
            count: Number(animalValue?.count) || 0,
            level: Number(animalValue?.level) || 1
        };
    }

    return {
        monkey: normalizeAnimal(raw.monkey),
        panda: normalizeAnimal(raw.panda),
        lion: normalizeAnimal(raw.lion)
    };
}

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
                username: `Gracz_${telegramId}`,
                lastLogin: new Date()
            });
        } else {
            const normalizedAnimals = normalizeAnimals(user.animals);
            user.animals = normalizedAnimals;
            await user.save();
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
            animals,
            lastLogin
        } = req.body;

        if (!telegramId) {
            return res.status(400).json({ error: "Brak telegramId" });
        }

        const normalizedAnimals = normalizeAnimals(animals);

        const updatedUser = await User.findOneAndUpdate(
            { telegramId },
            {
                telegramId,
                username: username || `Gracz_${telegramId}`,
                coins: Number(coins) || 0,
                level: Number(level) || 1,
                coinsPerClick: Number(coinsPerClick) || 1,
                upgradeCost: Number(upgradeCost) || 50,
                animals: normalizedAnimals,
                lastLogin: lastLogin ? new Date(lastLogin) :
const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema(
    {
        count: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    },
    { _id: false }
);

const expeditionSchema = new mongoose.Schema(
    {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        startTime: { type: Number, default: 0 },
        endTime: { type: Number, default: 0 },
        rewardCoins: { type: Number, default: 0 },
        rewardGems: { type: Number, default: 0 },
        rewardRarity: { type: String, default: "common" }
    },
    { _id: false }
);

const boxesSchema = new mongoose.Schema(
    {
        common: { type: Number, default: 0 },
        rare: { type: Number, default: 0 },
        epic: { type: Number, default: 0 },
        legendary: { type: Number, default: 0 }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, unique: true, index: true },
        username: { type: String, default: "Gracz" },

        coins: { type: Number, default: 0, index: true },
        gems: { type: Number, default: 0 },
        rewardBalance: { type: Number, default: 0 },
        level: { type: Number, default: 1, index: true },
        xp: { type: Number, default: 0 },

        coinsPerClick: { type: Number, default: 1 },
        upgradeCost: { type: Number, default: 50 },
        zooIncome: { type: Number, default: 0 },
        expeditionBoost: { type: Number, default: 0 },
        offlineBoost: { type: Number, default: 1 },

        lastLogin: { type: Number, default: Date.now },
        boost2xActiveUntil: { type: Number, default: 0 },

        expedition: { type: expeditionSchema, default: null },
        boxes: { type: boxesSchema, default: () => ({}) },

        animals: {
            monkey: { type: animalSchema, default: () => ({}) },
            panda: { type: animalSchema, default: () => ({}) },
            lion: { type: animalSchema, default: () => ({}) },
            tiger: { type: animalSchema, default: () => ({}) },
            elephant: { type: animalSchema, default: () => ({}) },
            giraffe: { type: animalSchema, default: () => ({}) },
            zebra: { type: animalSchema, default: () => ({}) },
            hippo: { type: animalSchema, default: () => ({}) },
            penguin: { type: animalSchema, default: () => ({}) },
            bear: { type: animalSchema, default: () => ({}) },
            crocodile: { type: animalSchema, default: () => ({}) },
            kangaroo: { type: animalSchema, default: () => ({}) },
            wolf: { type: animalSchema, default: () => ({}) }
        }
    },
    {
        minimize: false,
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
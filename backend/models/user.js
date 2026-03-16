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
        type: { type: String, default: null },
        endTime: { type: Number, default: null }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, default: "Gracz" },

    coins: { type: Number, default: 0 },
    gems: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coinsPerClick: { type: Number, default: 1 },
    upgradeCost: { type: Number, default: 50 },
    lastLogin: { type: Number, default: Date.now },

    expedition: { type: expeditionSchema, default: null },

    animals: {
        monkey: { type: animalSchema, default: () => ({}) },
        panda: { type: animalSchema, default: () => ({}) },
        lion: { type: animalSchema, default: () => ({}) },
        tiger: { type: animalSchema, default: () => ({}) },
        elephant: { type: animalSchema, default: () => ({}) },
        giraffe: { type: animalSchema, default: () => ({}) },
        zebra: { type: animalSchema, default: () => ({}) },
        penguin: { type: animalSchema, default: () => ({}) },
        bear: { type: animalSchema, default: () => ({}) },
        wolf: { type: animalSchema, default: () => ({}) }
    }
});

module.exports = mongoose.model("User", userSchema);
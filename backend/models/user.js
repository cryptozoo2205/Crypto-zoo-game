const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema(
    {
        count: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1
        }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        telegramId: {
            type: String,
            required: true,
            unique: true
        },
        username: {
            type: String,
            default: "Gracz"
        },
        coins: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1
        },
        coinsPerClick: {
            type: Number,
            default: 1
        },
        upgradeCost: {
            type: Number,
            default: 50
        },
        animals: {
            monkey: {
                type: animalSchema,
                default: () => ({ count: 0, level: 1 })
            },
            panda: {
                type: animalSchema,
                default: () => ({ count: 0, level: 1 })
            },
            lion: {
                type: animalSchema,
                default: () => ({ count: 0, level: 1 })
            }
        },
        lastLogin: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
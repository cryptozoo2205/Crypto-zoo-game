const mongoose = require("mongoose");

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
                type: Number,
                default: 0
            },
            panda: {
                type: Number,
                default: 0
            },
            lion: {
                type: Number,
                default: 0
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
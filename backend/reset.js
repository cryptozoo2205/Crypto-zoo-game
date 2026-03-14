const mongoose = require("mongoose");
require("dotenv").config();

async function reset() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const Player = require("./models/Player");

    await Player.deleteMany({});

    console.log("SAVE RESET OK");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit();
  }
}

reset();
const express = require("express");
const fs = require("fs");

const router = express.Router();

router.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

router.get("/api/health", (req, res) => {
    const { FRONTEND_DIR, INDEX_PATH } = req.app.locals.paths;

    res.json({
        ok: true,
        service: "cryptozoo-backend",
        port: process.env.PORT || 3000,
        timestamp: Date.now(),
        frontendExists: fs.existsSync(FRONTEND_DIR),
        indexExists: fs.existsSync(INDEX_PATH)
    });
});

module.exports = router;
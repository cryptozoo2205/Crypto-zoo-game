const express = require("express");

const router = express.Router();

router.post("/reward-offline", async (req, res) => {
    try {
        return res.status(200).json({
            ok: true,
            message: "Endpoint ads działa, reward jeszcze nie jest dodawany"
        });
    } catch (error) {
        console.error("ads reward-offline error:", error);
        return res.status(500).json({
            ok: false,
            error: "Nie udało się obsłużyć reward reklamy"
        });
    }
});

module.exports = router;
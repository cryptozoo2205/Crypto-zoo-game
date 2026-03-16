window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.daily = {
    rewards: [
        { text: "5000 Coins", type: "coins", value: 5000 },
        { text: "1 Gem", type: "gems", value: 1 },
        { text: "10000 Coins", type: "coins", value: 10000 },
        { text: "Rare Box", type: "box", value: "rare" },
        { text: "2 Gems", type: "gems", value: 2 },
        { text: "Epic Box", type: "box", value: "epic" },
        { text: "Legendary Box", type: "box", value: "legendary" }
    ],

    init() {
        const popup = document.getElementById("dailyReward");
        const text = document.getElementById("dailyRewardText");
        const btn = document.getElementById("claimDailyBtn");

        if (!popup || !text || !btn) return;

        const lastClaim = localStorage.getItem("dailyLast");
        const today = new Date().toDateString();
        const day = parseInt(localStorage.getItem("dailyDay") || "0", 10);
        const reward = this.rewards[day];

        if (!reward) return;

        text.textContent = "Today's reward: " + reward.text;

        if (lastClaim !== today) {
            popup.style.display = "flex";
        }

        btn.onclick = () => {
            this.claim();
        };
    },

    claim() {
        const popup = document.getElementById("dailyReward");
        const today = new Date().toDateString();
        const day = parseInt(localStorage.getItem("dailyDay") || "0", 10);
        const reward = this.rewards[day];

        if (!reward) return;

        if (reward.type === "coins") {
            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + reward.value;
        }

        if (reward.type === "gems") {
            CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + reward.value;
        }

        if (reward.type === "box" && CryptoZoo.boxes && CryptoZoo.boxes.open) {
            CryptoZoo.boxes.open(reward.value);
        }

        if (CryptoZoo.ui && CryptoZoo.ui.showToast) {
            CryptoZoo.ui.showToast("Daily reward: " + reward.text);
        }

        if (CryptoZoo.ui && CryptoZoo.ui.render) {
            CryptoZoo.ui.render();
        }

        if (CryptoZoo.api && CryptoZoo.api.savePlayer) {
            CryptoZoo.api.savePlayer();
        }

        localStorage.setItem("dailyLast", today);
        localStorage.setItem("dailyDay", String((day + 1) % this.rewards.length));

        if (popup) {
            popup.style.display = "none";
        }
    }
};
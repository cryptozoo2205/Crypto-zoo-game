window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {

    wheelSpinning: false,
    memoryCards: [],
    memoryFlipped: [],
    memoryMatched: 0,
    memoryLocked: false,

    isActive() {
        const screen = document.getElementById("screen-minigames");
        return screen && !screen.classList.contains("hidden");
    },

    spinWheel() {

        if (!this.isActive()) return; // ✅ FIX
        if (this.wheelSpinning) return;

        const wheel = document.getElementById("wheel");
        const rewardText = document.getElementById("wheelRewardText");

        if (!wheel) return;

        this.wheelSpinning = true;
        if (rewardText) rewardText.textContent = "";

        const rewards = [
            { label: "1000 Coins", type: "coins", value: 1000, angle: 30 },
            { label: "2 Gems", type: "gems", value: 2, angle: 90 },
            { label: "0.01 Reward", type: "reward", value: 0.01, angle: 150 },
            { label: "2500 Coins", type: "coins", value: 2500, angle: 210 },
            { label: "1 Gem", type: "gems", value: 1, angle: 270 },
            { label: "5000 Coins", type: "coins", value: 5000, angle: 330 }
        ];

        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        const spins = 360 * (4 + Math.floor(Math.random() * 3));
        const finalDeg = spins + (360 - reward.angle);

        wheel.style.transform = `rotate(${finalDeg}deg)`;

        setTimeout(() => {

            if (reward.type === "coins") {
                CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + reward.value;
            }

            if (reward.type === "gems") {
                CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + reward.value;
            }

            if (reward.type === "reward") {
                CryptoZoo.state.rewardBalance = (Number(CryptoZoo.state.rewardBalance) || 0) + reward.value;
            }

            if (rewardText) {
                rewardText.textContent = "Reward: " + reward.label;
            }

            CryptoZoo.ui?.render();
            CryptoZoo.api?.savePlayer();

            this.wheelSpinning = false;

        }, 4100);
    },

    createMemoryDeck() {
        const animals = ["🐵","🐼","🦁","🐯"];
        const deck = [...animals, ...animals];

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        return deck.map((animal, index) => ({
            id: index,
            animal,
            flipped: false,
            matched: false
        }));
    },

    renderMemory() {
        if (!this.isActive()) return; // ✅ FIX

        const board = document.getElementById("memoryBoard");
        if (!board) return;

        board.innerHTML = "";

        this.memoryCards.forEach(card => {
            const btn = document.createElement("button");

            btn.textContent = card.flipped || card.matched ? card.animal : "?";
            btn.onclick = () => this.flipMemoryCard(card.id);

            board.appendChild(btn);
        });
    },

    startMemory() {
        if (!this.isActive()) return; // ✅ FIX

        this.memoryCards = this.createMemoryDeck();
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = false;

        this.renderMemory();
    },

    flipMemoryCard(id) {

        if (!this.isActive()) return;
        if (this.memoryLocked) return;

        const card = this.memoryCards.find(c => c.id === id);
        if (!card || card.flipped || card.matched) return;

        card.flipped = true;
        this.memoryFlipped.push(card);

        this.renderMemory();

        if (this.memoryFlipped.length < 2) return;

        this.memoryLocked = true;

        const [a, b] = this.memoryFlipped;

        if (a.animal === b.animal) {

            a.matched = true;
            b.matched = true;

            this.memoryMatched += 2;
            this.memoryFlipped = [];
            this.memoryLocked = false;

            if (this.memoryMatched === this.memoryCards.length) {

                CryptoZoo.state.coins += 3000;
                CryptoZoo.state.gems += 1;

                CryptoZoo.ui?.render();
                CryptoZoo.api?.savePlayer();
            }

        } else {

            setTimeout(() => {
                a.flipped = false;
                b.flipped = false;
                this.memoryFlipped = [];
                this.memoryLocked = false;
                this.renderMemory();
            }, 800);
        }
    },

    bindButtons() {

        const spinBtn = document.getElementById("spinWheelBtn");
        const memoryBtn = document.getElementById("startMemoryBtn");

        if (spinBtn) spinBtn.onclick = () => this.spinWheel();
        if (memoryBtn) memoryBtn.onclick = () => this.startMemory();
    },

    init() {
        this.bindButtons(); // ✅ TYLKO TO
    }

};
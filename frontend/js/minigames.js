window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {
    wheelSpinning: false,
    memoryCards: [],
    memoryFlipped: [],
    memoryMatched: 0,
    memoryLocked: false,
    cooldownTimerStarted: false,

    wheelCooldownSeconds: 30 * 60,
    memoryCooldownSeconds: 15 * 60,

    isMiniGamesVisible() {
        const screen = document.getElementById("screen-minigames");
        return screen && !screen.classList.contains("hidden");
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.minigames = CryptoZoo.state.minigames || {};

        CryptoZoo.state.minigames.wheelCooldownUntil =
            Number(CryptoZoo.state.minigames.wheelCooldownUntil) || 0;

        CryptoZoo.state.minigames.memoryCooldownUntil =
            Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0;
    },

    getWheelCooldownLeft() {
        this.ensureState();
        return Math.max(
            0,
            Math.ceil(
                ((Number(CryptoZoo.state.minigames.wheelCooldownUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    getMemoryCooldownLeft() {
        this.ensureState();
        return Math.max(
            0,
            Math.ceil(
                ((Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    isWheelReady() {
        return this.getWheelCooldownLeft() <= 0 && !this.wheelSpinning;
    },

    isMemoryReady() {
        return this.getMemoryCooldownLeft() <= 0;
    },

    startWheelCooldown() {
        this.ensureState();
        CryptoZoo.state.minigames.wheelCooldownUntil =
            Date.now() + this.wheelCooldownSeconds * 1000;
    },

    startMemoryCooldown() {
        this.ensureState();
        CryptoZoo.state.minigames.memoryCooldownUntil =
            Date.now() + this.memoryCooldownSeconds * 1000;
    },

    formatCooldown(seconds) {
        if (CryptoZoo.ui?.formatTimeLeft) {
            return CryptoZoo.ui.formatTimeLeft(seconds);
        }

        const safe = Math.max(0, Number(seconds) || 0);
        const hours = Math.floor(safe / 3600);
        const minutes = Math.floor((safe % 3600) / 60);
        const secs = safe % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    },

    renderCooldowns() {
        this.ensureState();

        const spinBtn = document.getElementById("spinWheelBtn");
        const rewardText = document.getElementById("wheelRewardText");
        const memoryBtn = document.getElementById("startMemoryBtn");
        const memoryStatus = document.getElementById("memoryStatus");

        const wheelLeft = this.getWheelCooldownLeft();
        const memoryLeft = this.getMemoryCooldownLeft();

        if (spinBtn) {
            if (this.wheelSpinning) {
                spinBtn.disabled = true;
                spinBtn.textContent = "Spinning...";
            } else if (wheelLeft > 0) {
                spinBtn.disabled = true;
                spinBtn.textContent = `Wheel CD ${this.formatCooldown(wheelLeft)}`;
            } else {
                spinBtn.disabled = false;
                spinBtn.textContent = "Spin Wheel";
            }
        }

        if (rewardText && !this.wheelSpinning) {
            if (wheelLeft > 0) {
                rewardText.textContent = `Next spin in ${this.formatCooldown(wheelLeft)}`;
            } else if (!rewardText.dataset.rewardLocked) {
                rewardText.textContent = "Wheel ready";
            }
        }

        if (memoryBtn) {
            if (memoryLeft > 0) {
                memoryBtn.disabled = true;
                memoryBtn.textContent = `Memory CD ${this.formatCooldown(memoryLeft)}`;
            } else {
                memoryBtn.disabled = false;
                memoryBtn.textContent = "Start Memory";
            }
        }

        if (memoryStatus && this.memoryMatched !== this.memoryCards.length) {
            if (memoryLeft > 0 && this.memoryCards.length === 0) {
                memoryStatus.textContent = `Memory ready in ${this.formatCooldown(memoryLeft)}`;
            } else if (memoryLeft <= 0 && this.memoryCards.length === 0) {
                memoryStatus.textContent = "Find all pairs";
            }
        }
    },

    spinWheel() {
        if (!this.isMiniGamesVisible()) return;
        if (this.wheelSpinning) return;

        const wheelLeft = this.getWheelCooldownLeft();
        if (wheelLeft > 0) {
            CryptoZoo.ui?.showToast?.(`Wheel ready in ${this.formatCooldown(wheelLeft)}`);
            this.renderCooldowns();
            return;
        }

        const wheel = document.getElementById("wheel");
        const rewardText = document.getElementById("wheelRewardText");

        if (!wheel) return;

        this.wheelSpinning = true;

        if (rewardText) {
            rewardText.textContent = "";
            rewardText.dataset.rewardLocked = "1";
        }

        const rewards = [
            { label: "1000 Coins", type: "coins", value: 1000, angle: 30 },
            { label: "2 Gems", type: "gems", value: 2, angle: 90 },
            { label: "1 Reward", type: "reward", value: 1, angle: 150 },
            { label: "2500 Coins", type: "coins", value: 2500, angle: 210 },
            { label: "1 Gem", type: "gems", value: 1, angle: 270 },
            { label: "5000 Coins", type: "coins", value: 5000, angle: 330 }
        ];

        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        const spins = 360 * (4 + Math.floor(Math.random() * 3));
        const finalDeg = spins + (360 - reward.angle);

        wheel.style.transform = `rotate(${finalDeg}deg)`;
        this.renderCooldowns();

        setTimeout(() => {
            CryptoZoo.state = CryptoZoo.state || {};

            if (reward.type === "coins") {
                CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + reward.value;
            }

            if (reward.type === "gems") {
                CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + reward.value;
            }

            if (reward.type === "reward") {
                CryptoZoo.state.rewardBalance =
                    (Number(CryptoZoo.state.rewardBalance) || 0) + reward.value;
            }

            this.startWheelCooldown();

            if (rewardText) {
                rewardText.textContent = "Reward: " + reward.label;
                rewardText.dataset.rewardLocked = "";
            }

            CryptoZoo.ui?.showToast?.(reward.label);
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();

            this.wheelSpinning = false;
            this.renderCooldowns();
        }, 4100);
    },

    createMemoryDeck() {
        const animals = ["🐵", "🐼", "🦁", "🐯"];
        const deck = [...animals, ...animals];

        for (let i = deck.length - 1; i > 0; i -= 1) {
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
        if (!this.isMiniGamesVisible()) return;

        const board = document.getElementById("memoryBoard");
        if (!board) return;

        board.innerHTML = "";

        this.memoryCards.forEach((card) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.style.width = "70px";
            btn.style.height = "70px";
            btn.style.fontSize = "30px";
            btn.style.borderRadius = "12px";
            btn.style.border = "none";
            btn.style.cursor = "pointer";
            btn.style.background = card.flipped || card.matched ? "#ffffff" : "#3b4a68";
            btn.textContent = card.flipped || card.matched ? card.animal : "?";
            btn.onclick = () => this.flipMemoryCard(card.id);
            board.appendChild(btn);
        });
    },

    startMemory() {
        if (!this.isMiniGamesVisible()) return;

        const memoryLeft = this.getMemoryCooldownLeft();
        if (memoryLeft > 0) {
            CryptoZoo.ui?.showToast?.(`Memory ready in ${this.formatCooldown(memoryLeft)}`);
            this.renderCooldowns();
            return;
        }

        this.memoryCards = this.createMemoryDeck();
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = false;

        const status = document.getElementById("memoryStatus");
        if (status) {
            status.textContent = "Find all pairs";
        }

        this.renderMemory();
        this.renderCooldowns();
    },

    finishMemoryGame() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + 3000;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + 1;

        this.startMemoryCooldown();

        const status = document.getElementById("memoryStatus");
        if (status) {
            status.textContent = "Completed! Reward: 3000 Coins + 1 Gem";
        }

        CryptoZoo.ui?.showToast?.("Memory reward: 3000 Coins + 1 Gem");
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        this.renderCooldowns();
    },

    flipMemoryCard(cardId) {
        if (!this.isMiniGamesVisible()) return;
        if (this.memoryLocked) return;
        if (!this.isMemoryReady() && this.memoryCards.length === 0) return;

        const card = this.memoryCards.find((c) => c.id === cardId);

        if (!card || card.flipped || card.matched) return;

        card.flipped = true;
        this.memoryFlipped.push(card);
        this.renderMemory();

        if (this.memoryFlipped.length < 2) return;

        this.memoryLocked = true;

        const [first, second] = this.memoryFlipped;

        if (first.animal === second.animal) {
            first.matched = true;
            second.matched = true;
            this.memoryMatched += 2;
            this.memoryFlipped = [];
            this.memoryLocked = false;
            this.renderMemory();

            if (this.memoryMatched === this.memoryCards.length) {
                this.finishMemoryGame();
            }
        } else {
            setTimeout(() => {
                first.flipped = false;
                second.flipped = false;
                this.memoryFlipped = [];
                this.memoryLocked = false;
                this.renderMemory();
            }, 800);
        }
    },

    bindButtons() {
        const spinBtn = document.getElementById("spinWheelBtn");
        const memoryBtn = document.getElementById("startMemoryBtn");

        if (spinBtn) {
            spinBtn.onclick = () => this.spinWheel();
        }

        if (memoryBtn) {
            memoryBtn.onclick = () => this.startMemory();
        }
    },

    startCooldownTimer() {
        if (this.cooldownTimerStarted) return;
        this.cooldownTimerStarted = true;

        setInterval(() => {
            this.renderCooldowns();
        }, 1000);
    },

    init() {
        this.ensureState();
        this.bindButtons();
        this.startCooldownTimer();
        this.renderCooldowns();
    }
};
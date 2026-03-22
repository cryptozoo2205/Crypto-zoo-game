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
    wheelBaseRotation: 0,

    init() {
        this.ensureState();
        this.bindButtons();
        this.startCooldownTimer();
        this.renderCooldowns();
        this.resetWheelIfNeeded();
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.minigames = CryptoZoo.state.minigames || {};

        CryptoZoo.state.minigames.wheelCooldownUntil =
            Number(CryptoZoo.state.minigames.wheelCooldownUntil) || 0;

        CryptoZoo.state.minigames.memoryCooldownUntil =
            Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0;
    },

    isMiniGamesVisible() {
        const screen = document.getElementById("screen-minigames");
        return !!(screen && !screen.classList.contains("hidden"));
    },

    resetWheelIfNeeded() {
        const wheel = document.getElementById("wheel");
        if (!wheel) return;

        const normalized = ((Number(this.wheelBaseRotation) || 0) % 360 + 360) % 360;
        this.wheelBaseRotation = normalized;
        wheel.style.transition = "none";
        wheel.style.transform = `rotate(${normalized}deg)`;
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
        return CryptoZoo.ui?.formatTimeLeft?.(seconds) || "00:00:00";
    },

    getWheelRewards() {
        return [
            { label: "1000 Coins", type: "coins", value: 1000, angle: 30 },
            { label: "2 Gems", type: "gems", value: 2, angle: 90 },
            { label: "1 Reward", type: "reward", value: 1, angle: 150 },
            { label: "2500 Coins", type: "coins", value: 2500, angle: 210 },
            { label: "1 Gem", type: "gems", value: 1, angle: 270 },
            { label: "5000 Coins", type: "coins", value: 5000, angle: 330 }
        ];
    },

    renderCooldowns() {
        const spinBtn = document.getElementById("spinWheelBtn");
        const wheelStatus = document.getElementById("wheelRewardText");
        const memoryBtn = document.getElementById("startMemoryBtn");
        const memoryStatus = document.getElementById("memoryStatus");

        const wheelLeft = this.getWheelCooldownLeft();
        const memoryLeft = this.getMemoryCooldownLeft();

        if (spinBtn) {
            if (this.wheelSpinning) {
                spinBtn.disabled = true;
                spinBtn.textContent = "Kręci się...";
                spinBtn.style.opacity = "0.75";
                spinBtn.style.cursor = "not-allowed";
            } else if (wheelLeft > 0) {
                spinBtn.disabled = true;
                spinBtn.textContent = `Wheel CD ${this.formatCooldown(wheelLeft)}`;
                spinBtn.style.opacity = "0.6";
                spinBtn.style.cursor = "not-allowed";
            } else {
                spinBtn.disabled = false;
                spinBtn.textContent = "Spin Wheel";
                spinBtn.style.opacity = "1";
                spinBtn.style.cursor = "pointer";
            }
        }

        if (wheelStatus && !this.wheelSpinning) {
            if (wheelLeft > 0) {
                wheelStatus.textContent = `Next spin in ${this.formatCooldown(wheelLeft)}`;
            } else if (!wheelStatus.dataset.rewardLocked) {
                wheelStatus.textContent = "🎁 Tap to spin";
            }
        }

        if (memoryBtn) {
            if (memoryLeft > 0) {
                memoryBtn.disabled = true;
                memoryBtn.textContent = `Memory CD ${this.formatCooldown(memoryLeft)}`;
                memoryBtn.style.opacity = "0.6";
                memoryBtn.style.cursor = "not-allowed";
            } else {
                memoryBtn.disabled = false;
                memoryBtn.textContent = "Start Memory";
                memoryBtn.style.opacity = "1";
                memoryBtn.style.cursor = "pointer";
            }
        }

        if (memoryStatus && this.memoryCards.length === 0) {
            if (memoryLeft > 0) {
                memoryStatus.textContent = `Memory ready in ${this.formatCooldown(memoryLeft)}`;
            } else {
                memoryStatus.textContent = "Find all pairs";
            }
        }
    },

    applyWheelReward(reward) {
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
        const wheelStatus = document.getElementById("wheelRewardText");

        if (!wheel) return;

        this.wheelSpinning = true;
        CryptoZoo.audio?.play?.("spin");

        if (wheelStatus) {
            wheelStatus.textContent = "🎲 Spinning...";
            wheelStatus.dataset.rewardLocked = "1";
        }

        const rewards = this.getWheelRewards();
        const reward = rewards[Math.floor(Math.random() * rewards.length)];

        const extraSpins = 8 + Math.floor(Math.random() * 5);
        const spins = 360 * extraSpins;
        const targetAngle = 360 - reward.angle;
        const finalDeg = this.wheelBaseRotation + spins + targetAngle;

        wheel.style.transition = "none";
        wheel.style.transform = `rotate(${this.wheelBaseRotation}deg)`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                wheel.style.transition = "transform 6.6s cubic-bezier(0.12, 0.82, 0.16, 1)";
                wheel.style.transform = `rotate(${finalDeg}deg)`;
            });
        });

        this.renderCooldowns();

        setTimeout(() => {
            this.applyWheelReward(reward);
            this.startWheelCooldown();

            const normalized = ((finalDeg % 360) + 360) % 360;
            this.wheelBaseRotation = normalized;

            wheel.style.transition = "none";
            wheel.style.transform = `rotate(${normalized}deg)`;

            if (wheelStatus) {
                wheelStatus.textContent = `🎉 +${reward.label}`;
                wheelStatus.dataset.rewardLocked = "";
            }

            CryptoZoo.audio?.play?.("win");
            CryptoZoo.ui?.showToast?.(`🎉 ${reward.label}`);
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();

            this.wheelSpinning = false;
            this.renderCooldowns();
        }, 6600);
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
            btn.textContent = card.flipped || card.matched ? card.animal : "?";

            btn.style.background = card.flipped || card.matched
                ? "linear-gradient(180deg,#ffffff,#e6ecff)"
                : "linear-gradient(180deg,#4a5a7a,#2f3d5a)";

            btn.style.boxShadow = "0 6px 12px rgba(0,0,0,0.25)";
            btn.style.color = card.flipped || card.matched ? "#000000" : "#ffffff";

            btn.onclick = () => this.flipMemoryCard(card.id);
            board.appendChild(btn);
        });
    },

    resetMemoryBoard() {
        this.memoryCards = [];
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = false;

        const board = document.getElementById("memoryBoard");
        if (board) {
            board.innerHTML = "";
        }
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

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.("Memory reward: 3000 Coins + 1 Gem");
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        setTimeout(() => {
            this.resetMemoryBoard();
            this.renderCooldowns();
        }, 1200);
    },

    flipMemoryCard(cardId) {
        if (!this.isMiniGamesVisible()) return;
        if (this.memoryLocked) return;
        if (!this.isMemoryReady() && this.memoryCards.length === 0) return;

        const card = this.memoryCards.find((c) => c.id === cardId);

        if (!card || card.flipped || card.matched) return;

        card.flipped = true;
        this.memoryFlipped.push(card);
        CryptoZoo.audio?.play?.("flip");
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
            CryptoZoo.audio?.play?.("match");
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

        if (spinBtn && !spinBtn.dataset.bound) {
            spinBtn.dataset.bound = "1";
            spinBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.spinWheel();
            };
        }

        if (memoryBtn && !memoryBtn.dataset.bound) {
            memoryBtn.dataset.bound = "1";
            memoryBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.startMemory();
            };
        }
    },

    startCooldownTimer() {
        if (this.cooldownTimerStarted) return;
        this.cooldownTimerStarted = true;

        setInterval(() => {
            this.renderCooldowns();
        }, 1000);
    }
};
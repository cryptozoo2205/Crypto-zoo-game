window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {
    wheelSpinning: false,
    memoryCards: [],
    memoryFlipped: [],
    memoryMatched: 0,
    memoryLocked: false,

    wheelCooldownSeconds: 60 * 30,
    memoryCooldownSeconds: 60 * 15,

    isMiniGamesVisible() {
        const screen = document.getElementById("screen-minigames");
        return screen && !screen.classList.contains("hidden");
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        if (typeof CryptoZoo.state.wheelLastPlayedAt !== "number") {
            CryptoZoo.state.wheelLastPlayedAt = 0;
        }

        if (typeof CryptoZoo.state.memoryLastPlayedAt !== "number") {
            CryptoZoo.state.memoryLastPlayedAt = 0;
        }
    },

    getWheelRewards() {
        return [
            { label: "1000 Coins", shortLabel: "1000C", type: "coins", value: 1000, angle: 30 },
            { label: "2 Gems", shortLabel: "2G", type: "gems", value: 2, angle: 90 },
            { label: "1 Reward", shortLabel: "1R", type: "reward", value: 1, angle: 150 },
            { label: "2500 Coins", shortLabel: "2500C", type: "coins", value: 2500, angle: 210 },
            { label: "1 Gem", shortLabel: "1G", type: "gems", value: 1, angle: 270 },
            { label: "5000 Coins", shortLabel: "5000C", type: "coins", value: 5000, angle: 330 }
        ];
    },

    getWheelTimeLeftSeconds() {
        this.ensureState();

        const lastPlayedAt = Math.max(0, Number(CryptoZoo.state.wheelLastPlayedAt) || 0);
        if (!lastPlayedAt) return 0;

        const nextAvailableAt = lastPlayedAt + this.wheelCooldownSeconds * 1000;
        return Math.max(0, Math.ceil((nextAvailableAt - Date.now()) / 1000));
    },

    canSpinWheel() {
        return this.getWheelTimeLeftSeconds() <= 0;
    },

    getMemoryTimeLeftSeconds() {
        this.ensureState();

        const lastPlayedAt = Math.max(0, Number(CryptoZoo.state.memoryLastPlayedAt) || 0);
        if (!lastPlayedAt) return 0;

        const nextAvailableAt = lastPlayedAt + this.memoryCooldownSeconds * 1000;
        return Math.max(0, Math.ceil((nextAvailableAt - Date.now()) / 1000));
    },

    canStartMemory() {
        return this.getMemoryTimeLeftSeconds() <= 0;
    },

    renderWheelLabels() {
        const wheel = document.getElementById("wheel");
        if (!wheel) return;

        const rewards = this.getWheelRewards();

        wheel.innerHTML = rewards.map((reward, index) => {
            const rotation = index * 60;
            return `
                <div
                    style="
                        position:absolute;
                        left:50%;
                        top:50%;
                        width:0;
                        height:0;
                        transform: translate(-50%, -50%) rotate(${rotation}deg);
                        pointer-events:none;
                    "
                >
                    <div
                        style="
                            transform: translateY(-98px) rotate(-${rotation}deg);
                            min-width:54px;
                            text-align:center;
                            font-size:11px;
                            font-weight:900;
                            color:#ffffff;
                            text-shadow:0 1px 4px rgba(0,0,0,0.55);
                            letter-spacing:0.2px;
                        "
                    >
                        ${reward.shortLabel}
                    </div>
                </div>
            `;
        }).join("");
    },

    updateWheelUI() {
        const spinBtn = document.getElementById("spinWheelBtn");
        const rewardText = document.getElementById("wheelRewardText");
        const left = this.getWheelTimeLeftSeconds();

        if (spinBtn) {
            if (this.wheelSpinning) {
                spinBtn.disabled = true;
                spinBtn.textContent = "Spinning...";
            } else if (left > 0) {
                spinBtn.disabled = true;
                spinBtn.textContent = `Wheel za ${CryptoZoo.ui?.formatTimeLeft?.(left) || left + "s"}`;
            } else {
                spinBtn.disabled = false;
                spinBtn.textContent = "Spin Wheel";
            }
        }

        if (rewardText && left > 0 && !this.wheelSpinning && !rewardText.dataset.keepResult) {
            rewardText.textContent = `Następny spin za ${CryptoZoo.ui?.formatTimeLeft?.(left) || left + "s"}`;
        }
    },

    spinWheel() {
        if (!this.isMiniGamesVisible()) return;
        if (this.wheelSpinning) return;

        const left = this.getWheelTimeLeftSeconds();
        if (left > 0) {
            CryptoZoo.ui?.showToast?.(`Koło Fortuny za ${CryptoZoo.ui?.formatTimeLeft?.(left) || left + "s"}`);
            this.updateWheelUI();
            return;
        }

        const wheel = document.getElementById("wheel");
        const rewardText = document.getElementById("wheelRewardText");

        if (!wheel) return;

        this.ensureState();
        this.wheelSpinning = true;

        if (rewardText) {
            rewardText.textContent = "Koło się kręci...";
            rewardText.dataset.keepResult = "0";
        }

        const rewards = this.getWheelRewards();
        const reward = rewards[Math.floor(Math.random() * rewards.length)];

        const spins = 360 * (7 + Math.floor(Math.random() * 3));
        const finalDeg = spins + (360 - reward.angle);

        wheel.style.transition = "transform 6.8s cubic-bezier(0.12, 0.85, 0.14, 1)";
        wheel.style.transform = `rotate(${finalDeg}deg)`;

        this.updateWheelUI();

        setTimeout(() => {
            CryptoZoo.state = CryptoZoo.state || {};

            if (reward.type === "coins") {
                CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + reward.value;
            }

            if (reward.type === "gems") {
                CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + reward.value;
            }

            if (reward.type === "reward") {
                CryptoZoo.state.rewardBalance = (Number(CryptoZoo.state.rewardBalance) || 0) + reward.value;
            }

            CryptoZoo.state.wheelLastPlayedAt = Date.now();

            if (rewardText) {
                rewardText.textContent = "Reward: " + reward.label;
                rewardText.dataset.keepResult = "1";
            }

            CryptoZoo.ui?.showToast?.(reward.label);
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();

            this.wheelSpinning = false;
            this.updateWheelUI();

            setTimeout(() => {
                if (rewardText) {
                    rewardText.dataset.keepResult = "0";
                    this.updateWheelUI();
                }
            }, 3000);
        }, 6900);
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

    updateMemoryUI() {
        const btn = document.getElementById("startMemoryBtn");
        const status = document.getElementById("memoryStatus");
        const left = this.getMemoryTimeLeftSeconds();

        if (btn) {
            if (this.memoryCards.length > 0 && this.memoryMatched < this.memoryCards.length) {
                btn.disabled = true;
                btn.textContent = "Memory trwa...";
            } else if (left > 0) {
                btn.disabled = true;
                btn.textContent = `Memory za ${CryptoZoo.ui?.formatTimeLeft?.(left) || left + "s"}`;
            } else {
                btn.disabled = false;
                btn.textContent = "Start Memory";
            }
        }

        if (status && left > 0 && !(this.memoryCards.length > 0 && this.memoryMatched < this.memoryCards.length)) {
            status.textContent = `Następna gra za ${CryptoZoo.ui?.formatTimeLeft?.(left) || left + "s"}`;
        }
    },

    startMemory() {
        if (!this.isMiniGamesVisible()) return;

        const left = this.getMemoryTimeLeftSeconds();
        if (left > 0) {
            CryptoZoo.ui?.showToast?.(`Memory za ${CryptoZoo.ui?.formatTimeLeft?.(left) || left + "s"}`);
            this.updateMemoryUI();
            return;
        }

        this.memoryCards = this.createMemoryDeck();
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = false;

        const status = document.getElementById("memoryStatus");
        if (status) {
            status.textContent = "Znajdź wszystkie pary";
        }

        this.renderMemory();
        this.updateMemoryUI();
    },

    finishMemoryWithReward() {
        CryptoZoo.ensureState = CryptoZoo.ensureState || function () {};
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + 3000;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + 1;
        CryptoZoo.state.memoryLastPlayedAt = Date.now();

        const status = document.getElementById("memoryStatus");
        if (status) {
            status.textContent = "Completed! Reward: 3000 Coins + 1 Gem";
        }

        CryptoZoo.ui?.showToast?.("Memory reward: 3000 Coins + 1 Gem");
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        this.updateMemoryUI();
    },

    flipMemoryCard(cardId) {
        if (!this.isMiniGamesVisible()) return;
        if (this.memoryLocked) return;

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
                this.finishMemoryWithReward();
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

    startUiTimer() {
        if (this.uiTimerStarted) return;
        this.uiTimerStarted = true;

        setInterval(() => {
            if (!this.isMiniGamesVisible()) return;
            this.updateWheelUI();
            this.updateMemoryUI();
        }, 1000);
    },

    init() {
        this.ensureState();
        this.bindButtons();
        this.renderWheelLabels();
        this.updateWheelUI();
        this.updateMemoryUI();
        this.startUiTimer();
    }
};
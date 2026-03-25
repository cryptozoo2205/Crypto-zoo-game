window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {
    wheelSpinning: false,
    wheelCooldownSeconds: 2 * 60 * 60,
    memoryCooldownSeconds: 15 * 60,
    wheelRotation: 0,
    wheelBuilt: false,
    cooldownTimerStarted: false,
    activeWheelRewardId: "",

    memoryCards: [],
    memoryFlipped: [],
    memoryMatched: 0,
    memoryLocked: false,
    memoryMoves: 0,
    memoryPairsTotal: 0,
    memoryStartedAt: 0,
    memoryTimerInterval: null,
    memoryPreviewTimeout: null,
    memoryResolveTimeout: null,
    memorySessionActive: false,

    wheelImagePath: "assets/minigames/wheel/wheel_base.png",

    getLanguage() {
        return CryptoZoo.lang?.current || "en";
    },

    lt(key, fallback = "") {
        const lang = this.getLanguage();

        const dict = {
            en: {
                spinWheel: "Spin Wheel",
                spinning: "Spinning...",
                nextSpinIn: "Next spin in",
                nextFreeSpinIn: "Next free spin in",
                extraSpinAvailable: "Extra spin available",
                freeSpinReady: "Free spin ready",
                extraShort: "extra",

                startMemory: "Start Memory",
                restartMemory: "Play Again",
                resetMemory: "Reset",
                previewMemory: "Preview cards...",
                findAllPairs: "Find all pairs",
                memoryReadyIn: "Memory ready in",
                memoryCooldown: "Memory CD",
                moves: "Moves",
                time: "Time",
                pairs: "Pairs",
                memoryCompletedTitle: "Completed!",
                memoryCompletedReward: "Reward: 3000 Coins + 1 Gem",
                memoryRewardToast: "Memory reward: 3000 Coins + 1 Gem",
                perfectRun: "Perfect run",
                greatJob: "Great job"
            },
            pl: {
                spinWheel: "Spin Wheel",
                spinning: "Kręcenie...",
                nextSpinIn: "Następny spin za",
                nextFreeSpinIn: "Następny darmowy spin za",
                extraSpinAvailable: "Dostępny extra spin",
                freeSpinReady: "Darmowy spin gotowy",
                extraShort: "extra",

                startMemory: "Start Memory",
                restartMemory: "Zagraj ponownie",
                resetMemory: "Reset",
                previewMemory: "Podgląd kart...",
                findAllPairs: "Znajdź wszystkie pary",
                memoryReadyIn: "Memory gotowe za",
                memoryCooldown: "Memory CD",
                moves: "Ruchy",
                time: "Czas",
                pairs: "Pary",
                memoryCompletedTitle: "Ukończono!",
                memoryCompletedReward: "Nagroda: 3000 Coins + 1 Gem",
                memoryRewardToast: "Nagroda Memory: 3000 Coins + 1 Gem",
                perfectRun: "Perfekcyjna runda",
                greatJob: "Dobra robota"
            }
        };

        return dict[lang]?.[key] || fallback || key;
    },

    init() {
        this.ensureState();
        this.ensureEffects();
        this.bindButtons();
        this.buildWheelVisual();
        this.resetWheelTransform();
        this.ensureMemoryBoardClass();
        this.startCooldownTimer();
        this.renderCooldowns();
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.minigames = CryptoZoo.state.minigames || {};

        CryptoZoo.state.minigames.wheelCooldownUntil = Math.max(
            0,
            Number(CryptoZoo.state.minigames.wheelCooldownUntil) || 0
        );

        CryptoZoo.state.minigames.memoryCooldownUntil = Math.max(
            0,
            Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0
        );

        CryptoZoo.state.minigames.extraWheelSpins = Math.max(
            0,
            Number(CryptoZoo.state.minigames.extraWheelSpins) || 0
        );
    },

    ensureEffects() {
        if (!document.getElementById("wheelWinFlash")) {
            const flash = document.createElement("div");
            flash.id = "wheelWinFlash";
            flash.className = "wheel-win-flash";
            document.body.appendChild(flash);
        }
    },

    ensureMemoryBoardClass() {
        const board = document.getElementById("memoryBoard");
        if (board) {
            board.classList.add("memory-grid-pro");
        }
    },

    triggerWinFlash() {
        const flash = document.getElementById("wheelWinFlash");
        if (!flash) return;

        flash.classList.remove("active");
        void flash.offsetWidth;
        flash.classList.add("active");

        setTimeout(() => {
            flash.classList.remove("active");
        }, 520);
    },

    isMiniGamesVisible() {
        const screen = document.getElementById("screen-minigames");
        return !!(screen && !screen.classList.contains("hidden"));
    },

    getWheelRewards() {
        return [
            { id: "coins_100", label: "100C", type: "coins", value: 100, centerAngle: 22.5 },
            { id: "coins_250", label: "250C", type: "coins", value: 250, centerAngle: 67.5 },
            { id: "coins_500", label: "500C", type: "coins", value: 500, centerAngle: 112.5 },
            { id: "coins_1000", label: "1000C", type: "coins", value: 1000, centerAngle: 157.5 },
            { id: "gems_1", label: "1G", type: "gems", value: 1, centerAngle: 202.5 },
            { id: "gems_2", label: "2G", type: "gems", value: 2, centerAngle: 247.5 },
            { id: "coins_1500", label: "1500C", type: "coins", value: 1500, centerAngle: 292.5 },
            { id: "coins_2500", label: "2500C", type: "coins", value: 2500, centerAngle: 337.5 }
        ];
    },

    buildWheelVisual() {
        const wheel = document.getElementById("wheel");
        const pointer = document.getElementById("wheelPointer");

        if (!wheel) return;

        wheel.innerHTML = "";
        wheel.style.position = "relative";
        wheel.style.overflow = "hidden";
        wheel.style.backgroundImage = `url("${this.wheelImagePath}")`;
        wheel.style.backgroundRepeat = "no-repeat";
        wheel.style.backgroundPosition = "center";
        wheel.style.backgroundSize = "118%";

        if (pointer) {
            pointer.textContent = "";
        }

        const rewards = this.getWheelRewards();

        rewards.forEach((reward) => {
            const label = document.createElement("div");
            label.className = "wheel-label";
            label.dataset.rewardId = reward.id;
            label.textContent = reward.label;

            label.style.position = "absolute";
            label.style.left = "50%";
            label.style.top = "50%";
            label.style.width = "68px";
            label.style.textAlign = "center";
            label.style.fontWeight = "900";
            label.style.fontSize = "14px";
            label.style.lineHeight = "1";
            label.style.color = "#fff7cf";
            label.style.pointerEvents = "none";
            label.style.zIndex = "4";
            label.style.letterSpacing = "0.2px";
            label.style.userSelect = "none";
            label.style.textShadow =
                "0 2px 8px rgba(0,0,0,0.48), 0 0 10px rgba(255,220,120,0.14)";
            label.style.transformOrigin = "center center";

            const angle = reward.centerAngle;
            label.style.transform =
                `translate(-50%, -50%) rotate(${angle}deg) translateY(-74px) rotate(90deg)`;

            wheel.appendChild(label);
        });

        this.wheelBuilt = true;
    },

    resetWheelTransform() {
        const wheel = document.getElementById("wheel");
        if (!wheel) return;

        const normalized = ((Number(this.wheelRotation) || 0) % 360 + 360) % 360;
        this.wheelRotation = normalized;
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

    getExtraWheelSpins() {
        this.ensureState();
        return Math.max(0, Number(CryptoZoo.state.minigames.extraWheelSpins) || 0);
    },

    hasExtraWheelSpin() {
        return this.getExtraWheelSpins() > 0;
    },

    isWheelReady() {
        return !this.wheelSpinning && (this.hasExtraWheelSpin() || this.getWheelCooldownLeft() <= 0);
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

    consumeExtraWheelSpin() {
        this.ensureState();
        CryptoZoo.state.minigames.extraWheelSpins = Math.max(
            0,
            this.getExtraWheelSpins() - 1
        );
    },

    formatCooldown(seconds) {
        return CryptoZoo.ui?.formatTimeLeft?.(seconds) || "00:00:00";
    },

    setWheelHighlight(rewardId = "") {
        this.activeWheelRewardId = rewardId;

        const labels = document.querySelectorAll(".wheel-label");
        labels.forEach((label) => {
            if (label.dataset.rewardId === rewardId) {
                label.classList.add("wheel-label-active");
            } else {
                label.classList.remove("wheel-label-active");
            }
        });
    },

    setSpinVisualState(isActive) {
        const wheel = document.getElementById("wheel");
        const pointer = document.getElementById("wheelPointer");
        const container = document.querySelector(".wheel-container");

        if (wheel) {
            wheel.classList.toggle("wheel-spinning", !!isActive);
        }

        if (pointer) {
            pointer.classList.toggle("wheel-pointer-spinning", !!isActive);
        }

        if (container) {
            container.classList.toggle("wheel-container-spinning", !!isActive);
        }
    },

    renderCooldowns() {
        const spinBtn = document.getElementById("spinWheelBtn");
        const wheelStatus = document.getElementById("wheelRewardText");
        const memoryBtn = document.getElementById("startMemoryBtn");
        const memoryStatus = document.getElementById("memoryStatus");

        const wheelLeft = this.getWheelCooldownLeft();
        const memoryLeft = this.getMemoryCooldownLeft();
        const extraSpins = this.getExtraWheelSpins();

        if (spinBtn) {
            if (this.wheelSpinning) {
                spinBtn.disabled = true;
                spinBtn.textContent = this.lt("spinning", "Spinning...");
                spinBtn.style.opacity = "0.84";
                spinBtn.style.cursor = "not-allowed";
            } else if (extraSpins > 0) {
                spinBtn.disabled = false;
                spinBtn.textContent = `${this.lt("spinWheel", "Spin Wheel")} (${extraSpins} ${this.lt("extraShort", "extra")})`;
                spinBtn.style.opacity = "1";
                spinBtn.style.cursor = "pointer";
            } else if (wheelLeft > 0) {
                spinBtn.disabled = true;
                spinBtn.textContent = `${this.lt("nextSpinIn", "Next spin in")} ${this.formatCooldown(wheelLeft)}`;
                spinBtn.style.opacity = "0.84";
                spinBtn.style.cursor = "not-allowed";
            } else {
                spinBtn.disabled = false;
                spinBtn.textContent = this.lt("spinWheel", "Spin Wheel");
                spinBtn.style.opacity = "1";
                spinBtn.style.cursor = "pointer";
            }
        }

        if (wheelStatus && !this.wheelSpinning) {
            if (wheelStatus.dataset.rewardLocked === "1") {
                wheelStatus.textContent = `🎲 ${this.lt("spinning", "Spinning...")}`;
            } else if (wheelStatus.dataset.rewardText) {
                wheelStatus.textContent = wheelStatus.dataset.rewardText;
            } else if (extraSpins > 0) {
                wheelStatus.textContent = `🎁 ${this.lt("extraSpinAvailable", "Extra spin available")} (${extraSpins})`;
            } else if (wheelLeft <= 0) {
                wheelStatus.textContent = `🎁 ${this.lt("freeSpinReady", "Free spin ready")}`;
            } else {
                wheelStatus.textContent = "";
            }
        }

        if (memoryBtn) {
            if (this.memorySessionActive) {
                memoryBtn.disabled = false;
                memoryBtn.textContent = this.lt("restartMemory", "Play Again");
                memoryBtn.style.opacity = "1";
                memoryBtn.style.cursor = "pointer";
            } else if (memoryLeft > 0) {
                memoryBtn.disabled = true;
                memoryBtn.textContent = `${this.lt("memoryCooldown", "Memory CD")} ${this.formatCooldown(memoryLeft)}`;
                memoryBtn.style.opacity = "0.72";
                memoryBtn.style.cursor = "not-allowed";
            } else {
                memoryBtn.disabled = false;
                memoryBtn.textContent = this.lt("startMemory", "Start Memory");
                memoryBtn.style.opacity = "1";
                memoryBtn.style.cursor = "pointer";
            }
        }

        if (memoryStatus && this.memoryCards.length === 0) {
            if (memoryLeft > 0) {
                memoryStatus.textContent = `${this.lt("memoryReadyIn", "Memory ready in")} ${this.formatCooldown(memoryLeft)}`;
            } else {
                memoryStatus.textContent = this.lt("findAllPairs", "Find all pairs");
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
    },

    spinWheel() {
        if (!this.isMiniGamesVisible()) return;
        if (this.wheelSpinning) return;

        const hasExtraSpin = this.hasExtraWheelSpin();
        const wheelLeft = this.getWheelCooldownLeft();

        if (!hasExtraSpin && wheelLeft > 0) {
            CryptoZoo.ui?.showToast?.(`${this.lt("nextFreeSpinIn", "Next free spin in")} ${this.formatCooldown(wheelLeft)}`);
            this.renderCooldowns();
            return;
        }

        const wheel = document.getElementById("wheel");
        const wheelStatus = document.getElementById("wheelRewardText");

        if (!wheel) return;

        this.buildWheelVisual();

        const rewards = this.getWheelRewards();
        const reward = rewards[Math.floor(Math.random() * rewards.length)];

        if (hasExtraSpin) {
            this.consumeExtraWheelSpin();
        }

        this.wheelSpinning = true;
        this.setWheelHighlight("");
        this.setSpinVisualState(true);
        CryptoZoo.audio?.play?.("spin");

        if (wheelStatus) {
            wheelStatus.textContent = `🎲 ${this.lt("spinning", "Spinning...")}`;
            wheelStatus.dataset.rewardLocked = "1";
            wheelStatus.dataset.rewardText = "";
        }

        const fullSpins = 8 + Math.floor(Math.random() * 4);
        const currentRotation = ((Number(this.wheelRotation) || 0) % 360 + 360) % 360;

        const targetRotation = 270 - reward.centerAngle;
        const finalRotation = currentRotation + fullSpins * 360 + targetRotation;
        const overshootRotation = finalRotation + 8;

        wheel.style.transition = "none";
        wheel.style.transform = `rotate(${currentRotation}deg)`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                wheel.style.transition = "transform 6.4s cubic-bezier(0.08, 0.82, 0.16, 1)";
                wheel.style.transform = `rotate(${overshootRotation}deg)`;
            });
        });

        this.renderCooldowns();

        setTimeout(() => {
            wheel.style.transition = "transform 0.26s cubic-bezier(0.2, 0.9, 0.25, 1)";
            wheel.style.transform = `rotate(${finalRotation}deg)`;
        }, 6400);

        setTimeout(() => {
            this.applyWheelReward(reward);

            if (!hasExtraSpin) {
                this.startWheelCooldown();
            }

            const normalized = ((finalRotation % 360) + 360) % 360;
            this.wheelRotation = normalized;

            wheel.style.transition = "none";
            wheel.style.transform = `rotate(${normalized}deg)`;

            this.setWheelHighlight(reward.id);
            this.setSpinVisualState(false);
            this.triggerWinFlash();

            if (wheelStatus) {
                wheelStatus.textContent = `🎉 +${reward.label}`;
                wheelStatus.dataset.rewardLocked = "";
                wheelStatus.dataset.rewardText = `🎉 +${reward.label}`;
            }

            CryptoZoo.dailyMissions?.recordSpinWheel?.(1);

            CryptoZoo.audio?.play?.("win");
            CryptoZoo.ui?.showToast?.(`🎉 +${reward.label}`);
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();

            this.wheelSpinning = false;
            this.renderCooldowns();
        }, 6760);
    },

    createMemoryDeck() {
        const animals = ["🐵", "🐼", "🦁", "🐯", "🐘", "🦒"];
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

    clearMemoryTimers() {
        clearInterval(this.memoryTimerInterval);
        clearTimeout(this.memoryPreviewTimeout);
        clearTimeout(this.memoryResolveTimeout);
        this.memoryTimerInterval = null;
        this.memoryPreviewTimeout = null;
        this.memoryResolveTimeout = null;
    },

    getMemoryElapsedSeconds() {
        if (!this.memoryStartedAt) return 0;
        return Math.max(0, Math.floor((Date.now() - this.memoryStartedAt) / 1000));
    },

    formatMemoryTime(totalSeconds) {
        const safe = Math.max(0, Number(totalSeconds) || 0);
        const minutes = Math.floor(safe / 60);
        const seconds = safe % 60;

        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    },

    renderMemoryHud() {
        const board = document.getElementById("memoryBoard");
        if (!board) return;

        const elapsed = this.formatMemoryTime(this.getMemoryElapsedSeconds());
        const pairsDone = Math.floor(this.memoryMatched / 2);
        const pairsTotal = this.memoryPairsTotal;

        let hud = board.previousElementSibling;
        if (!hud || !hud.classList.contains("memory-hud")) {
            hud = document.createElement("div");
            hud.className = "memory-hud";
            board.parentNode.insertBefore(hud, board);
        }

        hud.innerHTML = `
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("moves", "Moves")}</span>
                <span class="memory-stat-value">${CryptoZoo.formatNumber(this.memoryMoves)}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("time", "Time")}</span>
                <span class="memory-stat-value">${elapsed}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("pairs", "Pairs")}</span>
                <span class="memory-stat-value">${pairsDone}/${pairsTotal}</span>
            </div>
        `;
    },

    renderMemory() {
        if (!this.isMiniGamesVisible()) return;

        const board = document.getElementById("memoryBoard");
        if (!board) return;

        this.ensureMemoryBoardClass();
        this.renderMemoryHud();

        board.innerHTML = "";

        this.memoryCards.forEach((card) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "memory-card-pro";
            btn.setAttribute("aria-label", "memory-card");
            btn.disabled = !!card.matched;

            if (card.flipped || card.matched) {
                btn.classList.add("is-flipped");
            }

            if (card.matched) {
                btn.classList.add("is-matched");
            }

            btn.innerHTML = `
                <span class="memory-card-inner">
                    <span class="memory-card-face memory-card-front">?</span>
                    <span class="memory-card-face memory-card-back">${card.animal}</span>
                </span>
            `;

            btn.onclick = () => this.flipMemoryCard(card.id);
            board.appendChild(btn);
        });
    },

    setMemoryStatus(text) {
        const status = document.getElementById("memoryStatus");
        if (status) {
            status.textContent = text;
        }
    },

    resetMemoryBoard(silent = false) {
        this.clearMemoryTimers();
        this.memoryCards = [];
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = false;
        this.memoryMoves = 0;
        this.memoryPairsTotal = 0;
        this.memoryStartedAt = 0;
        this.memorySessionActive = false;

        const board = document.getElementById("memoryBoard");
        if (board) {
            board.innerHTML = "";
        }

        const hud = board?.previousElementSibling;
        if (hud && hud.classList.contains("memory-hud")) {
            hud.remove();
        }

        if (!silent) {
            this.setMemoryStatus(this.isMemoryReady()
                ? this.lt("findAllPairs", "Find all pairs")
                : `${this.lt("memoryReadyIn", "Memory ready in")} ${this.formatCooldown(this.getMemoryCooldownLeft())}`);
        }

        this.renderCooldowns();
    },

    startMemoryTimer() {
        clearInterval(this.memoryTimerInterval);
        this.memoryTimerInterval = setInterval(() => {
            if (!this.memorySessionActive) return;
            this.renderMemoryHud();
        }, 1000);
    },

    startMemory() {
        if (!this.isMiniGamesVisible()) return;

        const memoryLeft = this.getMemoryCooldownLeft();
        if (memoryLeft > 0) {
            CryptoZoo.ui?.showToast?.(`${this.lt("memoryReadyIn", "Memory ready in")} ${this.formatCooldown(memoryLeft)}`);
            this.renderCooldowns();
            return;
        }

        this.clearMemoryTimers();
        this.memoryCards = this.createMemoryDeck();
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = true;
        this.memoryMoves = 0;
        this.memoryPairsTotal = this.memoryCards.length / 2;
        this.memoryStartedAt = Date.now();
        this.memorySessionActive = true;

        this.memoryCards.forEach((card) => {
            card.flipped = true;
            card.matched = false;
        });

        this.renderMemory();
        this.renderCooldowns();
        this.setMemoryStatus(this.lt("previewMemory", "Preview cards..."));

        this.memoryPreviewTimeout = setTimeout(() => {
            this.memoryCards.forEach((card) => {
                card.flipped = false;
            });

            this.memoryLocked = false;
            this.renderMemory();
            this.renderMemoryHud();
            this.startMemoryTimer();
            this.setMemoryStatus(this.lt("findAllPairs", "Find all pairs"));
        }, 2200);
    },

    finishMemoryGame() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + 3000;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + 1;

        this.memoryLocked = true;
        this.memorySessionActive = false;
        this.startMemoryCooldown();
        this.clearMemoryTimers();
        this.renderMemoryHud();

        const elapsed = this.getMemoryElapsedSeconds();
        const summaryPrefix = this.memoryMoves <= this.memoryPairsTotal * 2
            ? this.lt("perfectRun", "Perfect run")
            : this.lt("greatJob", "Great job");

        this.setMemoryStatus(
            `${this.lt("memoryCompletedTitle", "Completed!")} • ${summaryPrefix} • ${this.formatMemoryTime(elapsed)}`
        );

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(this.lt("memoryRewardToast", "Memory reward: 3000 Coins + 1 Gem"));
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        this.memoryPreviewTimeout = setTimeout(() => {
            this.resetMemoryBoard(true);
        }, 1800);
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
        this.memoryMoves += 1;
        this.renderMemoryHud();

        const [first, second] = this.memoryFlipped;

        if (first.animal === second.animal) {
            this.memoryResolveTimeout = setTimeout(() => {
                first.matched = true;
                second.matched = true;
                this.memoryMatched += 2;
                this.memoryFlipped = [];
                this.memoryLocked = false;
                CryptoZoo.audio?.play?.("match");
                this.renderMemory();
                this.renderMemoryHud();

                if (this.memoryMatched === this.memoryCards.length) {
                    this.finishMemoryGame();
                }
            }, 320);
        } else {
            this.memoryResolveTimeout = setTimeout(() => {
                first.flipped = false;
                second.flipped = false;
                this.memoryFlipped = [];
                this.memoryLocked = false;
                this.renderMemory();
                this.renderMemoryHud();
            }, 780);
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

                if (this.memorySessionActive || this.memoryCards.length > 0) {
                    this.resetMemoryBoard(true);
                }

                this.startMemory();
            };
        }
    },

    startCooldownTimer() {
        if (this.cooldownTimerStarted) return;
        this.cooldownTimerStarted = true;

        setInterval(() => {
            this.renderCooldowns();
            if (this.memorySessionActive) {
                this.renderMemoryHud();
            }
        }, 1000);
    }
};
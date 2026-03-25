window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {
    wheelSpinning: false,
    wheelCooldownSeconds: 2 * 60 * 60,
    memoryCooldownSeconds: 15 * 60,
    memoryFailCooldownSeconds: 5 * 60,
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
    memoryCurrentCombo: 0,
    memoryMaxCombo: 0,
    memoryDifficulty: "medium",
    memoryMoveLimit: 0,
    memoryCurrentConfig: null,

    wheelImagePath: "assets/minigames/wheel/wheel_base.png",
    memoryDifficultyStorageKey: "cryptozoo_memory_difficulty",

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
                previewMemory: "Preview cards...",
                findAllPairs: "Find all pairs",
                memoryReadyIn: "Memory ready in",
                memoryCooldown: "Memory CD",

                moves: "Moves",
                time: "Time",
                pairs: "Pairs",
                combo: "Combo",
                bestCombo: "Best combo",
                mode: "Mode",

                easy: "Easy",
                medium: "Medium",
                hard: "Hard",

                memoryCompletedTitle: "Completed!",
                memoryRewardToast: "Memory reward",
                perfectRun: "Perfect run",
                greatJob: "Great job",
                timeBonus: "Time bonus",
                comboBonus: "Combo bonus",
                noMovesLeft: "No moves left",
                memoryFailed: "Memory failed",
                gemWon: "Gem won"
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
                previewMemory: "Podgląd kart...",
                findAllPairs: "Znajdź wszystkie pary",
                memoryReadyIn: "Memory gotowe za",
                memoryCooldown: "Memory CD",

                moves: "Ruchy",
                time: "Czas",
                pairs: "Pary",
                combo: "Combo",
                bestCombo: "Najlepsze combo",
                mode: "Tryb",

                easy: "Łatwy",
                medium: "Średni",
                hard: "Trudny",

                memoryCompletedTitle: "Ukończono!",
                memoryRewardToast: "Nagroda Memory",
                perfectRun: "Perfekcyjna runda",
                greatJob: "Dobra robota",
                timeBonus: "Bonus czasu",
                comboBonus: "Bonus combo",
                noMovesLeft: "Brak ruchów",
                memoryFailed: "Memory przegrane",
                gemWon: "Wygrany gem"
            }
        };

        return dict[lang]?.[key] || fallback || key;
    },

    init() {
        this.ensureState();
        this.loadMemoryDifficulty();
        this.ensureEffects();
        this.bindButtons();
        this.buildWheelVisual();
        this.resetWheelTransform();
        this.ensureMemoryBoardClass();
        this.renderMemoryDifficultyBar();
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

    loadMemoryDifficulty() {
        const saved = localStorage.getItem(this.memoryDifficultyStorageKey);
        const available = this.getMemoryDifficultyConfigs();

        if (saved && available[saved]) {
            this.memoryDifficulty = saved;
        } else {
            this.memoryDifficulty = "medium";
        }
    },

    saveMemoryDifficulty() {
        localStorage.setItem(this.memoryDifficultyStorageKey, this.memoryDifficulty);
    },

    getMemoryDifficultyConfigs() {
        return {
            easy: {
                id: "easy",
                pairs: 4,
                moveLimit: 18,
                previewMs: 2400,
                coinsReward: 2200,
                gemChance: 0.08,
                targetTimeSeconds: 28,
                timeBonusCoins: 300,
                comboBonusPerStep: 90
            },
            medium: {
                id: "medium",
                pairs: 5,
                moveLimit: 16,
                previewMs: 2100,
                coinsReward: 3000,
                gemChance: 0.18,
                targetTimeSeconds: 40,
                timeBonusCoins: 500,
                comboBonusPerStep: 130
            },
            hard: {
                id: "hard",
                pairs: 6,
                moveLimit: 14,
                previewMs: 1800,
                coinsReward: 4200,
                gemChance: 0.30,
                targetTimeSeconds: 55,
                timeBonusCoins: 800,
                comboBonusPerStep: 180
            }
        };
    },

    getCurrentMemoryConfig() {
        const configs = this.getMemoryDifficultyConfigs();
        return configs[this.memoryDifficulty] || configs.medium;
    },

    setMemoryDifficulty(difficultyId) {
        const configs = this.getMemoryDifficultyConfigs();
        if (!configs[difficultyId]) return;
        if (this.memorySessionActive) return;

        this.memoryDifficulty = difficultyId;
        this.saveMemoryDifficulty();
        this.renderMemoryDifficultyBar();
        this.renderCooldowns();
        this.setMemoryStatus(
            this.isMemoryReady()
                ? this.lt("findAllPairs", "Find all pairs")
                : `${this.lt("memoryReadyIn", "Memory ready in")} ${this.formatCooldown(this.getMemoryCooldownLeft())}`
        );
    },

    getMemoryModeMount() {
        const board = document.getElementById("memoryBoard");
        if (!board || !board.parentNode) return null;

        let mount = document.getElementById("memoryModeMount");
        if (!mount) {
            mount = document.createElement("div");
            mount.id = "memoryModeMount";
            board.parentNode.insertBefore(mount, board);
        }

        return mount;
    },

    renderMemoryDifficultyBar() {
        const mount = this.getMemoryModeMount();
        if (!mount) return;

        const configs = this.getMemoryDifficultyConfigs();
        const current = this.memoryDifficulty;

        mount.className = "memory-mode-bar";
        mount.innerHTML = `
            <div class="memory-mode-label">${this.lt("mode", "Mode")}</div>
            <div class="memory-mode-buttons">
                ${Object.keys(configs).map((key) => `
                    <button
                        type="button"
                        class="memory-mode-btn ${current === key ? "is-active" : ""}"
                        data-memory-mode="${key}"
                        ${this.memorySessionActive ? "disabled" : ""}
                    >
                        ${this.lt(key, key)}
                    </button>
                `).join("")}
            </div>
        `;

        const buttons = mount.querySelectorAll("[data-memory-mode]");
        buttons.forEach((btn) => {
            btn.onclick = () => {
                const mode = btn.dataset.memoryMode;
                this.setMemoryDifficulty(mode);
                CryptoZoo.audio?.play?.("click");
            };
        });
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

    startMemoryCooldown(customSeconds = null) {
        this.ensureState();

        const duration = Math.max(
            1,
            Number(customSeconds) || this.memoryCooldownSeconds
        );

        CryptoZoo.state.minigames.memoryCooldownUntil =
            Date.now() + duration * 1000;
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

    createMemoryDeck(pairCount) {
        const allAnimals = ["🐵", "🐼", "🦁", "🐯", "🐘", "🦒", "🦓", "🐺"];
        const selected = allAnimals.slice(0, Math.max(2, pairCount));
        const deck = [...selected, ...selected];

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

    getMemoryHudMount() {
        const board = document.getElementById("memoryBoard");
        if (!board || !board.parentNode) return null;

        let hud = document.getElementById("memoryHud");
        if (!hud) {
            hud = document.createElement("div");
            hud.id = "memoryHud";
            board.parentNode.insertBefore(hud, board);
        }

        return hud;
    },

    renderMemoryHud() {
        const hud = this.getMemoryHudMount();
        if (!hud) return;

        const elapsed = this.formatMemoryTime(this.getMemoryElapsedSeconds());
        const pairsDone = Math.floor(this.memoryMatched / 2);
        const pairsTotal = this.memoryPairsTotal;
        const comboText = `${this.memoryCurrentCombo}x / ${this.memoryMaxCombo}x`;

        hud.className = "memory-hud";
        hud.innerHTML = `
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("moves", "Moves")}</span>
                <span class="memory-stat-value">${CryptoZoo.formatNumber(this.memoryMoves)}/${CryptoZoo.formatNumber(this.memoryMoveLimit)}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("time", "Time")}</span>
                <span class="memory-stat-value">${elapsed}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("pairs", "Pairs")}</span>
                <span class="memory-stat-value">${pairsDone}/${pairsTotal}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("combo", "Combo")}</span>
                <span class="memory-stat-value">${comboText}</span>
            </div>
        `;
    },

    renderMemory() {
        if (!this.isMiniGamesVisible()) return;

        const board = document.getElementById("memoryBoard");
        if (!board) return;

        this.ensureMemoryBoardClass();
        this.renderMemoryDifficultyBar();
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
        this.memoryCurrentCombo = 0;
        this.memoryMaxCombo = 0;
        this.memoryMoveLimit = 0;
        this.memoryCurrentConfig = null;

        const board = document.getElementById("memoryBoard");
        if (board) {
            board.innerHTML = "";
        }

        const hud = document.getElementById("memoryHud");
        if (hud) {
            hud.innerHTML = "";
        }

        this.renderMemoryDifficultyBar();

        if (!silent) {
            this.setMemoryStatus(
                this.isMemoryReady()
                    ? this.lt("findAllPairs", "Find all pairs")
                    : `${this.lt("memoryReadyIn", "Memory ready in")} ${this.formatCooldown(this.getMemoryCooldownLeft())}`
            );
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

        const config = this.getCurrentMemoryConfig();

        this.clearMemoryTimers();
        this.memoryCards = this.createMemoryDeck(config.pairs);
        this.memoryFlipped = [];
        this.memoryMatched = 0;
        this.memoryLocked = true;
        this.memoryMoves = 0;
        this.memoryPairsTotal = config.pairs;
        this.memoryStartedAt = Date.now();
        this.memorySessionActive = true;
        this.memoryCurrentCombo = 0;
        this.memoryMaxCombo = 0;
        this.memoryMoveLimit = config.moveLimit;
        this.memoryCurrentConfig = config;

        this.memoryCards.forEach((card) => {
            card.flipped = true;
            card.matched = false;
        });

        this.renderMemory();
        this.renderCooldowns();
        this.setMemoryStatus(`${this.lt("previewMemory", "Preview cards...")} • ${this.lt(config.id, config.id)}`);

        this.memoryPreviewTimeout = setTimeout(() => {
            this.memoryCards.forEach((card) => {
                card.flipped = false;
            });

            this.memoryLocked = false;
            this.renderMemory();
            this.renderMemoryHud();
            this.startMemoryTimer();
            this.setMemoryStatus(this.lt("findAllPairs", "Find all pairs"));
        }, config.previewMs);
    },

    failMemoryGame() {
        this.memoryLocked = true;
        this.memorySessionActive = false;
        this.startMemoryCooldown(this.memoryFailCooldownSeconds);
        this.clearMemoryTimers();
        this.renderMemoryHud();
        this.setMemoryStatus(`${this.lt("memoryFailed", "Memory failed")} • ${this.lt("noMovesLeft", "No moves left")}`);

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.ui?.showToast?.(`❌ ${this.lt("noMovesLeft", "No moves left")}`);

        this.memoryPreviewTimeout = setTimeout(() => {
            this.resetMemoryBoard(true);
        }, 1500);
    },

    finishMemoryGame() {
        CryptoZoo.state = CryptoZoo.state || {};

        const config = this.memoryCurrentConfig || this.getCurrentMemoryConfig();
        const elapsed = this.getMemoryElapsedSeconds();

        let totalCoins = Math.max(0, Number(config.coinsReward) || 0);

        let timeBonus = 0;
        if (elapsed <= Math.max(1, Number(config.targetTimeSeconds) || 9999)) {
            timeBonus = Math.max(0, Number(config.timeBonusCoins) || 0);
            totalCoins += timeBonus;
        }

        let comboBonus = 0;
        if (this.memoryMaxCombo > 1) {
            comboBonus = (this.memoryMaxCombo - 1) * Math.max(0, Number(config.comboBonusPerStep) || 0);
            totalCoins += comboBonus;
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + totalCoins;

        let gemWon = false;
        const gemChance = Math.max(0, Number(config.gemChance) || 0);
        if (Math.random() < gemChance) {
            CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + 1;
            gemWon = true;
        }

        this.memoryLocked = true;
        this.memorySessionActive = false;
        this.startMemoryCooldown(this.memoryCooldownSeconds);
        this.clearMemoryTimers();
        this.renderMemoryHud();

        const summaryPrefix = this.memoryMoves <= this.memoryPairsTotal * 2
            ? this.lt("perfectRun", "Perfect run")
            : this.lt("greatJob", "Great job");

        const bonusParts = [];
        if (timeBonus > 0) {
            bonusParts.push(`${this.lt("timeBonus", "Time bonus")} +${CryptoZoo.formatNumber(timeBonus)}`);
        }
        if (comboBonus > 0) {
            bonusParts.push(`${this.lt("comboBonus", "Combo bonus")} +${CryptoZoo.formatNumber(comboBonus)}`);
        }
        if (gemWon) {
            bonusParts.push(this.lt("gemWon", "Gem won"));
        }

        this.setMemoryStatus(
            bonusParts.length > 0
                ? `${this.lt("memoryCompletedTitle", "Completed!")} • ${summaryPrefix} • ${bonusParts.join(" • ")}`
                : `${this.lt("memoryCompletedTitle", "Completed!")} • ${summaryPrefix}`
        );

        const toastParts = [`+${CryptoZoo.formatNumber(totalCoins)} Coins`];
        if (gemWon) {
            toastParts.push("+1 Gem");
        }

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(`🎉 ${this.lt("memoryRewardToast", "Memory reward")}: ${toastParts.join(" • ")}`);
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
                this.memoryCurrentCombo += 1;
                this.memoryMaxCombo = Math.max(this.memoryMaxCombo, this.memoryCurrentCombo);

                CryptoZoo.audio?.play?.("match");
                this.renderMemory();
                this.renderMemoryHud();

                if (this.memoryMatched === this.memoryCards.length) {
                    this.finishMemoryGame();
                    return;
                }

                if (this.memoryMoves >= this.memoryMoveLimit) {
                    this.failMemoryGame();
                    return;
                }

                this.setMemoryStatus(`${this.lt("combo", "Combo")} x${this.memoryCurrentCombo}`);
            }, 320);
        } else {
            this.memoryResolveTimeout = setTimeout(() => {
                first.flipped = false;
                second.flipped = false;
                this.memoryFlipped = [];
                this.memoryLocked = false;
                this.memoryCurrentCombo = 0;
                this.renderMemory();
                this.renderMemoryHud();

                if (this.memoryMoves >= this.memoryMoveLimit) {
                    this.failMemoryGame();
                    return;
                }

                this.setMemoryStatus(this.lt("findAllPairs", "Find all pairs"));
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
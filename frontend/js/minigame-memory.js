window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.minigames = CryptoZoo.minigames || {};

Object.assign(CryptoZoo.minigames, {
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

    getMemoryCooldownLeft() {
        this.ensureState();

        return Math.max(
            0,
            Math.ceil(
                ((Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    isMemoryReady() {
        return this.getMemoryCooldownLeft() <= 0;
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
    }
});
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
                coinsReward: 1200,
                gemChance: 0.04,
                targetTimeSeconds: 28,
                timeBonusCoins: 180,
                comboBonusPerStep: 45
            },
            medium: {
                id: "medium",
                pairs: 5,
                moveLimit: 16,
                previewMs: 2100,
                coinsReward: 1800,
                gemChance: 0.08,
                targetTimeSeconds: 40,
                timeBonusCoins: 260,
                comboBonusPerStep: 60
            },
            hard: {
                id: "hard",
                pairs: 6,
                moveLimit: 14,
                previewMs: 1800,
                coinsReward: 2600,
                gemChance: 0.14,
                targetTimeSeconds: 55,
                timeBonusCoins: 420,
                comboBonusPerStep: 85
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
        if (!this.isUnlocked("memory")) return;

        this.memoryDifficulty = difficultyId;
        this.saveMemoryDifficulty();
        this.renderMemoryDifficultyBar();
        this.renderCooldowns();
        this.setMemoryStatus("");
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
        const unlocked = this.isUnlocked("memory");

        mount.className = "memory-mode-bar";
        mount.innerHTML = `
            <div class="memory-mode-label">${this.lt("mode", "Tryb")}</div>
            <div class="memory-mode-buttons">
                ${Object.keys(configs).map((key) => `
                    <button
                        type="button"
                        class="memory-mode-btn ${current === key ? "is-active" : ""}"
                        data-memory-mode="${key}"
                        ${this.memorySessionActive || !unlocked ? "disabled" : ""}
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

        CryptoZoo.api?.savePlayer?.();
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
                <span class="memory-stat-label">${this.lt("moves", "Ruchy")}</span>
                <span class="memory-stat-value">${CryptoZoo.formatNumber(this.memoryMoves)}/${CryptoZoo.formatNumber(this.memoryMoveLimit)}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("time", "Czas")}</span>
                <span class="memory-stat-value">${elapsed}</span>
            </div>
            <div class="memory-stat-chip">
                <span class="memory-stat-label">${this.lt("pairs", "Pary")}</span>
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
            const safeText = String(text || "").trim();
            status.textContent = safeText;
            status.style.display = safeText ? "block" : "none";
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
            this.setMemoryStatus("");
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

        if (!this.isUnlocked("memory")) {
            this.showLockedToast("memory");
            return;
        }

        const memoryLeft = this.getMemoryCooldownLeft();
        if (memoryLeft > 0) {
            CryptoZoo.ui?.showToast?.(`${this.lt("memoryReadyIn", "Memory gotowe za")} ${this.formatCooldown(memoryLeft)}`);
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
        this.setMemoryStatus("");

        this.memoryPreviewTimeout = setTimeout(() => {
            this.memoryCards.forEach((card) => {
                card.flipped = false;
            });

            this.memoryLocked = false;
            this.renderMemory();
            this.renderMemoryHud();
            this.startMemoryTimer();
            this.setMemoryStatus("");
        }, config.previewMs);
    },

    failMemoryGame() {
        this.memoryLocked = true;
        this.memorySessionActive = false;
        this.startMemoryCooldown(this.memoryFailCooldownSeconds);
        this.clearMemoryTimers();
        this.renderMemoryHud();
        this.setMemoryStatus(`${this.lt("memoryFailed", "Memory przegrane")} • ${this.lt("noMovesLeft", "Brak ruchów")}`);

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.ui?.showToast?.(`❌ ${this.lt("noMovesLeft", "Brak ruchów")}`);

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
            ? this.lt("perfectRun", "Perfekcyjna runda")
            : this.lt("greatJob", "Dobra robota");

        const bonusParts = [];
        if (timeBonus > 0) {
            bonusParts.push(`${this.lt("timeBonus", "Bonus czasu")} +${CryptoZoo.formatNumber(timeBonus)}`);
        }
        if (comboBonus > 0) {
            bonusParts.push(`${this.lt("comboBonus", "Bonus combo")} +${CryptoZoo.formatNumber(comboBonus)}`);
        }
        if (gemWon) {
            bonusParts.push(this.lt("gemWon", "Wygrany gem"));
        }

        this.setMemoryStatus(
            bonusParts.length > 0
                ? `${this.lt("memoryCompletedTitle", "Ukończono!")} • ${summaryPrefix} • ${bonusParts.join(" • ")}`
                : `${this.lt("memoryCompletedTitle", "Ukończono!")} • ${summaryPrefix}`
        );

        const toastParts = [`+${CryptoZoo.formatNumber(totalCoins)} Coins`];
        if (gemWon) {
            toastParts.push("+1 Gem");
        }

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(`🎉 ${this.lt("memoryRewardToast", "Nagroda Memory")}: ${toastParts.join(" • ")}`);
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        this.memoryPreviewTimeout = setTimeout(() => {
            this.resetMemoryBoard(true);
        }, 1800);
    },

    flipMemoryCard(cardId) {
        if (!this.isMiniGamesVisible()) return;
        if (!this.isUnlocked("memory")) return;
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

                this.setMemoryStatus("");
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

                this.setMemoryStatus("");
            }, 780);
        }
    },

    renderCooldowns() {
        const memoryBtn = document.getElementById("startMemoryBtn");
        const memoryStatus = document.getElementById("memoryStatus");

        const memoryLeft = this.getMemoryCooldownLeft?.() || 0;
        const memoryUnlocked = this.isUnlocked("memory");

        if (memoryBtn) {
            if (!memoryUnlocked) {
                memoryBtn.disabled = true;
                memoryBtn.textContent = `${this.lt("unlockAtLevel", "Odblokowanie na poziomie")} ${this.getUnlockLevel("memory")}`;
                memoryBtn.style.opacity = "0.72";
                memoryBtn.style.cursor = "not-allowed";
            } else if (this.memorySessionActive) {
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
            if (!memoryUnlocked) {
                memoryStatus.textContent = "";
                memoryStatus.style.display = "none";
            } else if (memoryLeft > 0) {
                memoryStatus.textContent = `${this.lt("memoryReadyIn", "Memory ready in")} ${this.formatCooldown(memoryLeft)}`;
                memoryStatus.style.display = "block";
            } else {
                memoryStatus.textContent = this.lt("findAllPairs", "Find all pairs");
                memoryStatus.style.display = "block";
            }
        }

        this.renderTapChallenge?.();
        this.renderAnimalHunt?.();
    },

    bindButtons() {
        const memoryBtn = document.getElementById("startMemoryBtn");

        if (memoryBtn && !memoryBtn.dataset.bound) {
            memoryBtn.dataset.bound = "1";
            memoryBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");

                if (!this.isUnlocked("memory")) {
                    this.showLockedToast("memory");
                    return;
                }

                if (this.memorySessionActive || this.memoryCards.length > 0) {
                    this.resetMemoryBoard?.(true);
                }

                this.startMemory?.();
            };
        }

        const tapBtn = document.getElementById("tapChallengeTapBtn");
        if (tapBtn && !tapBtn.dataset.bound) {
            tapBtn.dataset.bound = "1";

            tapBtn.onclick = (e) => {
                e.preventDefault();

                if (!this.isUnlocked("tapChallenge")) {
                    this.showLockedToast("tapChallenge");
                    return;
                }

                this.registerTapChallengePress?.(1);
            };

            tapBtn.addEventListener("touchstart", (e) => {
                const amount = Math.max(
                    1,
                    Math.min(
                        this.getTapChallengeMaxBurst?.() || 3,
                        Array.from(e.changedTouches || []).length || 1
                    )
                );

                e.preventDefault();

                if (!this.isUnlocked("tapChallenge")) {
                    this.showLockedToast("tapChallenge");
                    return;
                }

                this.registerTapChallengePress?.(amount);
            }, { passive: false });
        }

        const claimBtn = document.getElementById("tapChallengeClaimBtn");
        if (claimBtn && !claimBtn.dataset.bound) {
            claimBtn.dataset.bound = "1";
            claimBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.claimTapChallengeReward?.();
            };
        }

        const animalHuntStartBtn = document.getElementById("animalHuntStartBtn");
        if (animalHuntStartBtn && !animalHuntStartBtn.dataset.bound) {
            animalHuntStartBtn.dataset.bound = "1";
            animalHuntStartBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");

                if (!this.isUnlocked("animalHunt")) {
                    this.showLockedToast("animalHunt");
                    return;
                }

                this.startAnimalHunt?.();
            };
        }

        const animalHuntClaimBtn = document.getElementById("animalHuntClaimBtn");
        if (animalHuntClaimBtn && !animalHuntClaimBtn.dataset.bound) {
            animalHuntClaimBtn.dataset.bound = "1";
            animalHuntClaimBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.claimAnimalHuntReward?.();
            };
        }
    }
});
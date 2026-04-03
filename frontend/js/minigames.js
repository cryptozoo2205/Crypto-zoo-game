window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.minigames = {
    memoryCooldownSeconds: 15 * 60,
    memoryFailCooldownSeconds: 5 * 60,
    tapChallengeCooldownSeconds: 45 * 60,
    tapChallengeDurationSeconds: 5,
    cooldownTimerStarted: false,

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

    tapChallengeSessionActive: false,
    tapChallengeLocked: false,
    tapChallengeStartedAt: 0,
    tapChallengeEndsAt: 0,
    tapChallengeClicks: 0,
    tapChallengeAcceptedEvents: [],
    tapChallengeLastTapAt: 0,
    tapChallengeTimerInterval: null,
    tapChallengeResult: null,

    memoryDifficultyStorageKey: "cryptozoo_memory_difficulty",

    getLanguage() {
        return CryptoZoo.lang?.current || "en";
    },

    lt(key, fallback = "") {
        const lang = this.getLanguage();

        const dict = {
            en: {
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
                gemWon: "Gem won",
                wheelRemoved: "Wheel removed",

                tapChallengeTitle: "Tap Challenge",
                tapChallengeSubtitle: "Tap as fast as you can in 5 seconds",
                startTapChallenge: "Start Tap Challenge",
                tapChallengeCooldown: "Tap Challenge CD",
                tapChallengeReadyIn: "Tap Challenge ready in",
                tapChallengeTapNow: "TAP NOW!",
                tapChallengeResultTitle: "Result",
                tapChallengeClaim: "Claim reward",
                tapChallengeTryAgain: "Play later",
                taps: "Taps",
                target: "Target",
                reward: "Reward",
                active: "Active",
                finished: "Finished",
                challengeRunning: "Challenge in progress",
                antiClickLimited: "Too fast taps ignored"
            },
            pl: {
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
                gemWon: "Wygrany gem",
                wheelRemoved: "Koło usunięte",

                tapChallengeTitle: "Tap Challenge",
                tapChallengeSubtitle: "Klikaj jak najszybciej przez 5 sekund",
                startTapChallenge: "Start Tap Challenge",
                tapChallengeCooldown: "Tap Challenge CD",
                tapChallengeReadyIn: "Tap Challenge gotowe za",
                tapChallengeTapNow: "KLIKAJ!",
                tapChallengeResultTitle: "Wynik",
                tapChallengeClaim: "Odbierz nagrodę",
                tapChallengeTryAgain: "Zagraj później",
                taps: "Tapy",
                target: "Cel",
                reward: "Nagroda",
                active: "Aktywny",
                finished: "Koniec",
                challengeRunning: "Challenge trwa",
                antiClickLimited: "Za szybkie tapy pominięte"
            }
        };

        return dict[lang]?.[key] || fallback || key;
    },

    init() {
        this.ensureState();
        this.loadMemoryDifficulty();
        this.ensureMemoryBoardClass();
        this.hideWheelGame();
        this.ensureTapChallengeCard();
        this.bindButtons();
        this.renderMemoryDifficultyBar();
        this.renderTapChallenge();
        this.startCooldownTimer();
        this.renderCooldowns();
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.minigames = CryptoZoo.state.minigames || {};

        CryptoZoo.state.minigames.memoryCooldownUntil = Math.max(
            0,
            Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0
        );

        CryptoZoo.state.minigames.tapChallengeCooldownUntil = Math.max(
            0,
            Number(CryptoZoo.state.minigames.tapChallengeCooldownUntil) || 0
        );

        CryptoZoo.state.minigames.extraWheelSpins = 0;
        CryptoZoo.state.minigames.wheelCooldownUntil = 0;
    },

    hideWheelGame() {
        const wheelGame = document.getElementById("wheelGame");
        if (wheelGame) {
            wheelGame.style.display = "none";
        }

        const wheelBtn = document.getElementById("spinWheelBtn");
        if (wheelBtn) {
            wheelBtn.disabled = true;
        }

        const wheelStatus = document.getElementById("wheelRewardText");
        if (wheelStatus) {
            wheelStatus.textContent = this.lt("wheelRemoved", "Wheel removed");
        }
    },

    ensureMemoryBoardClass() {
        const board = document.getElementById("memoryBoard");
        if (board) {
            board.classList.add("memory-grid-pro");
        }
    },

    ensureTapChallengeCard() {
        const wrap = document.getElementById("minigamesWrap");
        if (!wrap) return;

        let card = document.getElementById("tapChallengeGame");
        if (card) return;

        card = document.createElement("div");
        card.id = "tapChallengeGame";
        card.className = "minigame-box";
        card.style.marginTop = "14px";

        card.innerHTML = `
            <div class="minigame-box-header">
                <div class="minigame-name" id="tapChallengeTitle">${this.lt("tapChallengeTitle", "Tap Challenge")}</div>
                <div class="minigame-desc" id="tapChallengeDesc">${this.lt("tapChallengeSubtitle", "Tap as fast as you can in 5 seconds")}</div>
            </div>

            <div
                id="tapChallengeHud"
                style="
                    display:grid;
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                    gap:10px;
                    margin-top:12px;
                    margin-bottom:12px;
                "
            >
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("time", "Time")}</div>
                    <div id="tapChallengeTimeText" style="font-size:18px; font-weight:900;">05.0</div>
                </div>
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("taps", "Taps")}</div>
                    <div id="tapChallengeTapsText" style="font-size:18px; font-weight:900;">0</div>
                </div>
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("target", "Target")}</div>
                    <div id="tapChallengeTargetText" style="font-size:18px; font-weight:900;">120+</div>
                </div>
            </div>

            <button
                id="tapChallengeTapBtn"
                type="button"
                style="
                    width:100%;
                    min-height:132px;
                    border:none;
                    border-radius:24px;
                    background:linear-gradient(180deg, rgba(255, 211, 73, 0.95) 0%, rgba(240, 185, 11, 0.95) 100%);
                    color:#1c1c1c;
                    font-size:26px;
                    font-weight:900;
                    box-shadow:0 16px 36px rgba(240, 185, 11, 0.20);
                    margin-top:4px;
                "
            >${this.lt("startTapChallenge", "Start Tap Challenge")}</button>

            <div
                id="tapChallengeStatus"
                class="minigame-status"
                style="margin-top:12px;"
            >${this.lt("tapChallengeSubtitle", "Tap as fast as you can in 5 seconds")}</div>

            <div
                id="tapChallengeResultBox"
                style="
                    display:none;
                    margin-top:12px;
                    padding:12px;
                    border-radius:16px;
                    background:rgba(255,255,255,0.04);
                    border:1px solid rgba(255,255,255,0.08);
                "
            >
                <div style="font-size:16px; font-weight:900; margin-bottom:8px;">${this.lt("tapChallengeResultTitle", "Result")}</div>
                <div id="tapChallengeResultText" style="font-size:13px; line-height:1.5;"></div>
                <button
                    id="tapChallengeClaimBtn"
                    type="button"
                    style="margin-top:12px; width:100%;"
                >${this.lt("tapChallengeClaim", "Claim reward")}</button>
            </div>
        `;

        wrap.appendChild(card);
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

    getTapChallengeCooldownLeft() {
        this.ensureState();

        return Math.max(
            0,
            Math.ceil(
                ((Number(CryptoZoo.state.minigames.tapChallengeCooldownUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    isTapChallengeReady() {
        return this.getTapChallengeCooldownLeft() <= 0;
    },

    startTapChallengeCooldown(customSeconds = null) {
        this.ensureState();

        const duration = Math.max(
            1,
            Number(customSeconds) || this.tapChallengeCooldownSeconds
        );

        CryptoZoo.state.minigames.tapChallengeCooldownUntil =
            Date.now() + duration * 1000;
    },

    formatCooldown(seconds) {
        return CryptoZoo.ui?.formatTimeLeft?.(seconds) || "00:00:00";
    },

    renderCooldowns() {
        const memoryBtn = document.getElementById("startMemoryBtn");
        const memoryStatus = document.getElementById("memoryStatus");

        const memoryLeft = this.getMemoryCooldownLeft();

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

        this.renderTapChallenge();
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

    clearTapChallengeTimers() {
        clearInterval(this.tapChallengeTimerInterval);
        this.tapChallengeTimerInterval = null;
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

    // ================= TAP CHALLENGE =================

    getTapChallengeTarget() {
        return 120;
    },

    getTapChallengeMaxTapsPerSecond() {
        return 16;
    },

    getTapChallengeMaxBurst() {
        return 3;
    },

    getTapChallengeMinIntervalMs() {
        return 18;
    },

    pruneTapChallengeHistory(now = Date.now()) {
        this.tapChallengeAcceptedEvents = (this.tapChallengeAcceptedEvents || []).filter((entry) => {
            return entry && Number(entry.time || 0) >= now - 1000;
        });
    },

    getTapChallengeAcceptedInLastSecond(now = Date.now()) {
        this.pruneTapChallengeHistory(now);

        return this.tapChallengeAcceptedEvents.reduce((sum, entry) => {
            return sum + Math.max(0, Number(entry?.amount) || 0);
        }, 0);
    },

    getTapChallengeAllowedAmount(requestedAmount = 1) {
        const now = Date.now();
        let safeRequestedAmount = Math.max(1, Math.floor(Number(requestedAmount) || 1));

        safeRequestedAmount = Math.min(safeRequestedAmount, this.getTapChallengeMaxBurst());

        const timeSinceLast = this.tapChallengeLastTapAt > 0
            ? now - this.tapChallengeLastTapAt
            : 999999;

        if (safeRequestedAmount === 1 && timeSinceLast > 0 && timeSinceLast < this.getTapChallengeMinIntervalMs()) {
            return 0;
        }

        const used = this.getTapChallengeAcceptedInLastSecond(now);
        const remaining = Math.max(0, this.getTapChallengeMaxTapsPerSecond() - used);

        if (remaining <= 0) {
            return 0;
        }

        const allowed = Math.max(0, Math.min(safeRequestedAmount, remaining));

        if (allowed > 0) {
            this.tapChallengeAcceptedEvents.push({
                time: now,
                amount: allowed
            });
            this.tapChallengeLastTapAt = now;
        }

        return allowed;
    },

    renderTapChallenge() {
        const btn = document.getElementById("tapChallengeTapBtn");
        const status = document.getElementById("tapChallengeStatus");
        const timeText = document.getElementById("tapChallengeTimeText");
        const tapsText = document.getElementById("tapChallengeTapsText");
        const targetText = document.getElementById("tapChallengeTargetText");
        const resultBox = document.getElementById("tapChallengeResultBox");
        const resultText = document.getElementById("tapChallengeResultText");
        const claimBtn = document.getElementById("tapChallengeClaimBtn");

        if (targetText) {
            targetText.textContent = `${this.getTapChallengeTarget()}+`;
        }

        if (tapsText) {
            tapsText.textContent = CryptoZoo.formatNumber(this.tapChallengeClicks);
        }

        if (timeText) {
            if (this.tapChallengeSessionActive) {
                const leftMs = Math.max(0, this.tapChallengeEndsAt - Date.now());
                timeText.textContent = (leftMs / 1000).toFixed(1);
            } else {
                timeText.textContent = `${this.tapChallengeDurationSeconds.toFixed(1)}`;
            }
        }

        if (resultBox) {
            resultBox.style.display = this.tapChallengeResult ? "block" : "none";
        }

        if (resultText && this.tapChallengeResult) {
            const result = this.tapChallengeResult;
            const lines = [
                `${this.lt("taps", "Taps")}: ${CryptoZoo.formatNumber(result.taps)}`,
                `${this.lt("reward", "Reward")}: +${CryptoZoo.formatNumber(result.coins)} coins${result.gems > 0 ? ` • +${CryptoZoo.formatNumber(result.gems)} gem` : ""}`
            ];

            if (result.gradeText) {
                lines.unshift(result.gradeText);
            }

            resultText.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
        }

        if (claimBtn) {
            claimBtn.disabled = !this.tapChallengeResult;
            claimBtn.style.opacity = this.tapChallengeResult ? "1" : "0.65";
        }

        if (!btn || !status) return;

        const cooldownLeft = this.getTapChallengeCooldownLeft();

        if (this.tapChallengeSessionActive) {
            btn.disabled = false;
            btn.textContent = this.lt("tapChallengeTapNow", "TAP NOW!");
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            status.textContent = `${this.lt("challengeRunning", "Challenge in progress")} • ${this.lt("taps", "Taps")}: ${CryptoZoo.formatNumber(this.tapChallengeClicks)}`;
            return;
        }

        if (this.tapChallengeResult) {
            btn.disabled = true;
            btn.textContent = this.lt("finished", "Finished");
            btn.style.opacity = "0.72";
            btn.style.cursor = "not-allowed";
            status.textContent = this.lt("tapChallengeResultTitle", "Result");
            return;
        }

        if (cooldownLeft > 0) {
            btn.disabled = true;
            btn.textContent = `${this.lt("tapChallengeCooldown", "Tap Challenge CD")} ${this.formatCooldown(cooldownLeft)}`;
            btn.style.opacity = "0.72";
            btn.style.cursor = "not-allowed";
            status.textContent = `${this.lt("tapChallengeReadyIn", "Tap Challenge ready in")} ${this.formatCooldown(cooldownLeft)}`;
            return;
        }

        btn.disabled = false;
        btn.textContent = this.lt("startTapChallenge", "Start Tap Challenge");
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        status.textContent = this.lt("tapChallengeSubtitle", "Tap as fast as you can in 5 seconds");
    },

    startTapChallenge() {
        if (!this.isMiniGamesVisible()) return;
        if (!this.isTapChallengeReady()) {
            CryptoZoo.ui?.showToast?.(`${this.lt("tapChallengeReadyIn", "Tap Challenge ready in")} ${this.formatCooldown(this.getTapChallengeCooldownLeft())}`);
            return;
        }

        this.clearTapChallengeTimers();
        this.tapChallengeSessionActive = true;
        this.tapChallengeLocked = false;
        this.tapChallengeStartedAt = Date.now();
        this.tapChallengeEndsAt = this.tapChallengeStartedAt + this.tapChallengeDurationSeconds * 1000;
        this.tapChallengeClicks = 0;
        this.tapChallengeAcceptedEvents = [];
        this.tapChallengeLastTapAt = 0;
        this.tapChallengeResult = null;

        this.renderTapChallenge();

        this.tapChallengeTimerInterval = setInterval(() => {
            if (!this.tapChallengeSessionActive) {
                this.clearTapChallengeTimers();
                return;
            }

            if (Date.now() >= this.tapChallengeEndsAt) {
                this.finishTapChallenge();
                return;
            }

            this.renderTapChallenge();
        }, 80);
    },

    registerTapChallengePress(requestedAmount = 1) {
        if (!this.tapChallengeSessionActive) {
            this.startTapChallenge();
            return;
        }

        if (this.tapChallengeLocked) return;

        const allowed = this.getTapChallengeAllowedAmount(requestedAmount);

        if (allowed <= 0) {
            return;
        }

        this.tapChallengeClicks = Math.min(220, this.tapChallengeClicks + allowed);

        CryptoZoo.audio?.play?.("tap");
        this.renderTapChallenge();
    },

    getTapChallengeReward(clicks) {
        const safeClicks = Math.max(0, Math.min(220, Math.floor(Number(clicks) || 0)));
        const effectiveCoinsPerClick = Math.max(
            1,
            Number(CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.() || CryptoZoo.state?.coinsPerClick || 1)
        );

        let coins = safeClicks * effectiveCoinsPerClick * 3;

        if (safeClicks >= 80) {
            coins += 1200;
        }

        if (safeClicks >= 120) {
            coins += 2400;
        }

        if (safeClicks >= 160) {
            coins += 4200;
        }

        coins = Math.min(60000, Math.max(0, Math.floor(coins)));

        let gems = 0;
        if (safeClicks >= 100 && Math.random() < 0.05) gems = 1;
        if (safeClicks >= 140 && Math.random() < 0.08) gems = 1;
        if (safeClicks >= 180 && Math.random() < 0.12) gems = 2;

        let gradeText = "";
        if (safeClicks >= 180) {
            gradeText = "🔥 Master";
        } else if (safeClicks >= 140) {
            gradeText = "⚡ Great";
        } else if (safeClicks >= 100) {
            gradeText = "✅ Good";
        } else {
            gradeText = "🎯 Nice try";
        }

        return {
            taps: safeClicks,
            coins,
            gems,
            gradeText
        };
    },

    finishTapChallenge() {
        if (!this.tapChallengeSessionActive) return;

        this.tapChallengeSessionActive = false;
        this.tapChallengeLocked = true;
        this.clearTapChallengeTimers();
        this.startTapChallengeCooldown(this.tapChallengeCooldownSeconds);
        this.tapChallengeResult = this.getTapChallengeReward(this.tapChallengeClicks);

        this.renderTapChallenge();
    },

    claimTapChallengeReward() {
        if (!this.tapChallengeResult) return false;

        CryptoZoo.state = CryptoZoo.state || {};

        const result = this.tapChallengeResult;
        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + Math.max(0, Number(result.coins) || 0);
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + Math.max(0, Number(result.gems) || 0);
        CryptoZoo.state.lastLogin = Date.now();

        const toastParts = [
            `+${CryptoZoo.formatNumber(result.coins)} coins`
        ];

        if (result.gems > 0) {
            toastParts.push(`+${CryptoZoo.formatNumber(result.gems)} gem`);
        }

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(`🎮 ${this.lt("tapChallengeTitle", "Tap Challenge")}: ${toastParts.join(" • ")}`);

        this.tapChallengeResult = null;
        this.tapChallengeClicks = 0;
        this.tapChallengeAcceptedEvents = [];
        this.tapChallengeLastTapAt = 0;

        this.renderTapChallenge();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        return true;
    },

    bindButtons() {
        const memoryBtn = document.getElementById("startMemoryBtn");

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

        const tapBtn = document.getElementById("tapChallengeTapBtn");
        if (tapBtn && !tapBtn.dataset.bound) {
            tapBtn.dataset.bound = "1";

            tapBtn.onclick = (e) => {
                e.preventDefault();
                this.registerTapChallengePress(1);
            };

            tapBtn.addEventListener("touchstart", (e) => {
                const amount = Math.max(
                    1,
                    Math.min(
                        this.getTapChallengeMaxBurst(),
                        Array.from(e.changedTouches || []).length || 1
                    )
                );

                e.preventDefault();
                this.registerTapChallengePress(amount);
            }, { passive: false });
        }

        const claimBtn = document.getElementById("tapChallengeClaimBtn");
        if (claimBtn && !claimBtn.dataset.bound) {
            claimBtn.dataset.bound = "1";
            claimBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.claimTapChallengeReward();
            };
        }

        const spinBtn = document.getElementById("spinWheelBtn");
        if (spinBtn) {
            spinBtn.onclick = null;
            spinBtn.disabled = true;
        }
    },

    isMiniGamesVisible() {
        const screen = document.getElementById("screen-minigames");
        return !!(screen && !screen.classList.contains("hidden"));
    },

    startCooldownTimer() {
        if (this.cooldownTimerStarted) return;
        this.cooldownTimerStarted = true;

        setInterval(() => {
            this.renderCooldowns();

            if (this.memorySessionActive) {
                this.renderMemoryHud();
            }

            if (this.tapChallengeSessionActive) {
                if (Date.now() >= this.tapChallengeEndsAt) {
                    this.finishTapChallenge();
                } else {
                    this.renderTapChallenge();
                }
            }
        }, 1000);
    }
};
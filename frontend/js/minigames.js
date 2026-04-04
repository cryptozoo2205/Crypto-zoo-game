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
        this.loadMemoryDifficulty?.();
        this.ensureMemoryBoardClass();
        this.hideWheelGame();
        this.ensureTapChallengeCard?.();
        this.bindButtons();
        this.renderMemoryDifficultyBar?.();
        this.renderTapChallenge?.();
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
            wheelBtn.onclick = null;
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

    formatCooldown(seconds) {
        return CryptoZoo.ui?.formatTimeLeft?.(seconds) || "00:00:00";
    },

    isMiniGamesVisible() {
        const screen = document.getElementById("screen-minigames");
        return !!(screen && !screen.classList.contains("hidden"));
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

    startCooldownTimer() {
        if (this.cooldownTimerStarted) return;
        this.cooldownTimerStarted = true;

        setInterval(() => {
            this.renderCooldowns();

            if (this.memorySessionActive) {
                this.renderMemoryHud?.();
            }

            if (this.tapChallengeSessionActive) {
                if (Date.now() >= this.tapChallengeEndsAt) {
                    this.finishTapChallenge?.();
                } else {
                    this.renderTapChallenge?.();
                }
            }
        }, 1000);
    },

    renderCooldowns() {
        const memoryBtn = document.getElementById("startMemoryBtn");
        const memoryStatus = document.getElementById("memoryStatus");

        const memoryLeft = this.getMemoryCooldownLeft?.() || 0;

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

        this.renderTapChallenge?.();
    },

    bindButtons() {
        const memoryBtn = document.getElementById("startMemoryBtn");

        if (memoryBtn && !memoryBtn.dataset.bound) {
            memoryBtn.dataset.bound = "1";
            memoryBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");

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
    }
};
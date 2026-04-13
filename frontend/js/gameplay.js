window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchBurstActive: false,
    touchReleaseTimer: null,

    maxOfflineSeconds: 15 * 60,
    baseOfflineHours: 6,
    maxOfflineHoursWithoutAds: 4,
    maxOfflineBoostHoursFromShop: 0,
    maxOfflineAdsHours: 6,

    dailyRewardCooldownMs: 24 * 60 * 60 * 1000,
    dailyRewardMaxStreak: 7,
    tapTouchIds: null,
    tapAreaPadding: 28,

    tapSaveTimer: null,
    tapSaveDelayMs: 1200,
    tapSaveInFlight: false,
    tapSaveQueued: false,

    renderTimer: null,
    renderDelayMs: 120,
    renderQueued: false,
    lastRenderAt: 0,
    minRenderGapMs: 120,

    enableTapEffects: true,

    tapAntiCheatEnabled: true,
    maxAcceptedTapsPerSecond: 18,
    maxAcceptedTapBurst: 3,
    minHumanTapIntervalMs: 22,
    suspiciousTapStrikeLimit: 6,
    suspiciousTapStrikeWindowMs: 2500,
    temporaryTapBlockMs: 1500,
    antiCheatToastCooldownMs: 2500,
    tapEventHistory: [],
    tapStrikeTimestamps: [],
    lastAcceptedTapAt: 0,
    tapBlockUntil: 0,
    antiCheatToastAt: 0,

    init() {
        this.ensureState();
        this.resetTapAntiCheat();
        this.recalculateProgress();
        this.applyOfflineEarnings();

        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();
        this.bindDailyRewardButton();
        this.bindAnimalButtons();
        this.bindShopButtons();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen, true);
        this.requestRender(true);

        this.startIncomeTimer();
        this.startExpeditionTimer();
        this.startBoostTimer();

        CryptoZoo.dailyReward?.startTimer?.();
    },

    resetTapAntiCheat() {
        this.tapEventHistory = [];
        this.tapStrikeTimestamps = [];
        this.lastAcceptedTapAt = 0;
        this.tapBlockUntil = 0;
        this.antiCheatToastAt = 0;
    },

    pruneTapEventHistory(now = Date.now()) {
        const cutoff = now - 1000;
        this.tapEventHistory = (this.tapEventHistory || []).filter((entry) => {
            return entry && Number(entry.time || 0) >= cutoff;
        });
    },

    pruneTapStrikes(now = Date.now()) {
        const cutoff = now - this.suspiciousTapStrikeWindowMs;
        this.tapStrikeTimestamps = (this.tapStrikeTimestamps || []).filter((value) => {
            return Number(value || 0) >= cutoff;
        });
    },

    getAcceptedTapCountLastSecond(now = Date.now()) {
        this.pruneTapEventHistory(now);

        return this.tapEventHistory.reduce((sum, entry) => {
            return sum + Math.max(0, Number(entry?.amount) || 0);
        }, 0);
    },

    addTapStrike(now = Date.now()) {
        this.tapStrikeTimestamps.push(now);
        this.pruneTapStrikes(now);

        if (this.tapStrikeTimestamps.length >= this.suspiciousTapStrikeLimit) {
            this.tapBlockUntil = now + this.temporaryTapBlockMs;
            this.tapStrikeTimestamps = [];
            return true;
        }

        return false;
    },

    showTapAntiCheatToast(message = "Zbyt szybkie klikanie") {
        const now = Date.now();

        if (now - this.antiCheatToastAt < this.antiCheatToastCooldownMs) {
            return;
        }

        this.antiCheatToastAt = now;
        CryptoZoo.ui?.showToast?.(message);
    },

    getAllowedTapAmount(requestedAmount = 1) {
        if (!this.tapAntiCheatEnabled) {
            return Math.max(1, Math.floor(Number(requestedAmount) || 1));
        }

        const now = Date.now();

        if (now < this.tapBlockUntil) {
            this.showTapAntiCheatToast("Klikasz zbyt szybko");
            return 0;
        }

        let safeRequestedAmount = Math.max(1, Math.floor(Number(requestedAmount) || 1));
        safeRequestedAmount = Math.min(safeRequestedAmount, this.maxAcceptedTapBurst);

        this.pruneTapEventHistory(now);
        this.pruneTapStrikes(now);

        const usedLastSecond = this.getAcceptedTapCountLastSecond(now);
        const remainingThisSecond = Math.max(0, this.maxAcceptedTapsPerSecond - usedLastSecond);

        if (remainingThisSecond <= 0) {
            this.showTapAntiCheatToast("Limit klików / sek");
            return 0;
        }

        const timeSinceLastAcceptedTap = this.lastAcceptedTapAt > 0
            ? now - this.lastAcceptedTapAt
            : 999999;

        if (
            safeRequestedAmount === 1 &&
            timeSinceLastAcceptedTap > 0 &&
            timeSinceLastAcceptedTap < this.minHumanTapIntervalMs
        ) {
            const blocked = this.addTapStrike(now);

            if (blocked) {
                this.showTapAntiCheatToast("Auto click zablokowany");
                return 0;
            }
        }

        const allowedAmount = Math.max(0, Math.min(safeRequestedAmount, remainingThisSecond));

        if (allowedAmount <= 0) {
            this.showTapAntiCheatToast("Limit klików / sek");
            return 0;
        }

        this.tapEventHistory.push({
            time: now,
            amount: allowedAmount
        });

        this.lastAcceptedTapAt = now;
        return allowedAmount;
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.animals = CryptoZoo.state.animals || {};
        CryptoZoo.state.boxes = CryptoZoo.state.boxes || {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };
        CryptoZoo.state.shopPurchases = CryptoZoo.state.shopPurchases || {};
        CryptoZoo.state.minigames = CryptoZoo.state.minigames || {
            memoryCooldownUntil: 0
        };

        const animals = CryptoZoo.config?.animals || {};
        const maxOwnedPerAnimal = Math.max(
            1,
            Math.floor(Number(CryptoZoo.config?.limits?.maxOwnedPerAnimal) || 20)
        );
        const maxLevelPerAnimal = Math.max(
            1,
            Math.floor(Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 25)
        );

        Object.keys(animals).forEach((type) => {
            if (!CryptoZoo.state.animals[type] || typeof CryptoZoo.state.animals[type] !== "object") {
                CryptoZoo.state.animals[type] = { count: 0, level: 1 };
            }

            CryptoZoo.state.animals[type].count = Math.max(
                0,
                Math.min(
                    maxOwnedPerAnimal,
                    Math.floor(Number(CryptoZoo.state.animals[type].count) || 0)
                )
            );

            CryptoZoo.state.animals[type].level = Math.max(
                1,
                Math.min(
                    maxLevelPerAnimal,
                    Math.floor(Number(CryptoZoo.state.animals[type].level) || 1)
                )
            );

            if (CryptoZoo.state.animals[type].count <= 0) {
                CryptoZoo.state.animals[type].level = 1;
            }
        });

        const defaults = {
            coins: 0,
            gems: 0,
            rewardBalance: 0,
            rewardWallet: 0,
            withdrawPending: 0,
            level: 1,
            coinsPerClick: 1,
            zooIncome: 0,
            expeditionBoost: 0,
            expeditionBoostActiveUntil: 0,
            offlineMaxSeconds: this.maxOfflineSeconds,
            offlineBoostMultiplier: 0.25,
            offlineBoostActiveUntil: 0,
            offlineBoost: 1,
            offlineBaseHours: this.baseOfflineHours,
            offlineBoostHours: 0,
            offlineAdsHours: 0,
            xp: 0,
            boost2xActiveUntil: 0,
            lastLogin: Date.now(),
            lastDailyRewardAt: 0,
            dailyRewardStreak: 0,
            playTimeSeconds: 0,
            lastAwardedLevel: 1,
            offlineAdsResetAt: 0
        };

        Object.keys(defaults).forEach((key) => {
            if (typeof CryptoZoo.state[key] !== "number") {
                CryptoZoo.state[key] = Number(CryptoZoo.state[key]) || defaults[key];
            }
        });

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = String(
                CryptoZoo.state.dailyRewardClaimDayKey || ""
            );
        }

        CryptoZoo.state.coins = Math.max(0, Number(CryptoZoo.state.coins) || 0);
        CryptoZoo.state.gems = Math.max(0, Number(CryptoZoo.state.gems) || 0);
        CryptoZoo.state.rewardBalance = Number(
            (Math.max(0, Number(CryptoZoo.state.rewardBalance) || 0)).toFixed(3)
        );
        CryptoZoo.state.rewardWallet = Number(
            (Math.max(0, Number(CryptoZoo.state.rewardWallet) || 0)).toFixed(3)
        );
        CryptoZoo.state.withdrawPending = Number(
            (Math.max(0, Number(CryptoZoo.state.withdrawPending) || 0)).toFixed(3)
        );

        CryptoZoo.state.level = Math.max(1, Math.floor(Number(CryptoZoo.state.level) || 1));
        CryptoZoo.state.xp = Math.max(0, Math.floor(Number(CryptoZoo.state.xp) || 0));
        CryptoZoo.state.coinsPerClick = Math.max(
            1,
            Math.floor(
                Number(CryptoZoo.state.coinsPerClick) ||
                Number(CryptoZoo.config?.clickValue) ||
                1
            )
        );
        CryptoZoo.state.zooIncome = Math.max(0, Number(CryptoZoo.state.zooIncome) || 0);
        CryptoZoo.state.expeditionBoost = Math.max(0, Number(CryptoZoo.state.expeditionBoost) || 0);
        CryptoZoo.state.expeditionBoostActiveUntil = Math.max(
            0,
            Number(CryptoZoo.state.expeditionBoostActiveUntil) || 0
        );

        CryptoZoo.state.offlineBaseHours = Math.max(
            0.25,
            Math.min(
                this.maxOfflineHoursWithoutAds,
                Number(CryptoZoo.state.offlineBaseHours) || this.baseOfflineHours
            )
        );

        CryptoZoo.state.offlineBoostHours = 0;

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(
                this.getMaxOfflineAdsHours(),
                Number(CryptoZoo.state.offlineAdsHours) || 0
            )
        );

        CryptoZoo.state.offlineAdsResetAt = Math.max(
            0,
            Number(CryptoZoo.state.offlineAdsResetAt) || 0
        );

        CryptoZoo.state.offlineBoostMultiplier = Math.max(
            1,
            Number(CryptoZoo.state.offlineBoostMultiplier) || 1
        );
        CryptoZoo.state.offlineBoost = Math.max(1, Number(CryptoZoo.state.offlineBoost) || 1);
        CryptoZoo.state.lastLogin = Math.max(0, Number(CryptoZoo.state.lastLogin) || Date.now());
        CryptoZoo.state.lastDailyRewardAt = Math.max(
            0,
            Number(CryptoZoo.state.lastDailyRewardAt) || 0
        );
        CryptoZoo.state.dailyRewardStreak = Math.max(
            0,
            Math.min(
                this.dailyRewardMaxStreak,
                Math.floor(Number(CryptoZoo.state.dailyRewardStreak) || 0)
            )
        );
        CryptoZoo.state.playTimeSeconds = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state.playTimeSeconds) || 0)
        );
        CryptoZoo.state.lastAwardedLevel = Math.max(
            1,
            Math.floor(Number(CryptoZoo.state.lastAwardedLevel) || CryptoZoo.state.level || 1)
        );

        CryptoZoo.state.minigames.memoryCooldownUntil = Math.max(
            0,
            Number(CryptoZoo.state.minigames.memoryCooldownUntil) || 0
        );

        delete CryptoZoo.state.minigames.wheelCooldownUntil;
        delete CryptoZoo.state.minigames.extraWheelSpins;

        CryptoZoo.expeditions?.ensureExpeditionStats?.();
        CryptoZoo.expeditions?.ensureActiveExpeditionShape?.();
        CryptoZoo.offlineAds?.ensureState?.();

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(
                this.getMaxOfflineAdsHours(),
                Number(CryptoZoo.offlineAds?.getCurrentHours?.() || 0)
            )
        );

        CryptoZoo.state.offlineAdsResetAt = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getNextResetAt?.() || CryptoZoo.state.offlineAdsResetAt || 0)
        );

        this.normalizeProgressionState();

        CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();

        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
    },

    requestRender(force = false) {
        const now = Date.now();

        if (force) {
            clearTimeout(this.renderTimer);
            this.renderTimer = null;
            this.renderQueued = false;
            this.lastRenderAt = now;
            CryptoZoo.ui?.render?.();
            return;
        }

        this.renderQueued = true;

        if (this.renderTimer) {
            return;
        }

        const sinceLast = now - this.lastRenderAt;
        const waitMs = Math.max(this.renderDelayMs, this.minRenderGapMs - sinceLast, 0);

        this.renderTimer = setTimeout(() => {
            this.renderTimer = null;

            if (!this.renderQueued) {
                return;
            }

            this.renderQueued = false;
            this.lastRenderAt = Date.now();
            CryptoZoo.ui?.render?.();
        }, waitMs);
    },

    getOfflineBaseHours() {
        return Math.max(
            0.25,
            Math.min(
                this.maxOfflineHoursWithoutAds,
                Number(CryptoZoo.state?.offlineBaseHours) || this.baseOfflineHours
            )
        );
    },

    getOfflineBoostHours() {
        return 0;
    },

    getMaxOfflineAdsHours() {
        return Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getMaxHours?.() || this.maxOfflineAdsHours)
        );
    },

    getOfflineAdsHours() {
        CryptoZoo.offlineAds?.ensureState?.();

        const currentHours = Number(CryptoZoo.offlineAds?.getCurrentHours?.() || 0);
        const safeHours = Math.max(0, Math.min(this.getMaxOfflineAdsHours(), currentHours));

        CryptoZoo.state.offlineAdsHours = safeHours;
        CryptoZoo.state.offlineAdsResetAt = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getNextResetAt?.() || 0)
        );

        return safeHours;
    },

    getOfflineHoursWithoutAds() {
        return Math.max(0, this.getOfflineBaseHours());
    },

    getOfflineHoursTotal() {
        return Math.max(0.25, this.getOfflineHoursWithoutAds() + this.getOfflineAdsHours());
    },

    getOfflineMaxSeconds() {
        return Math.floor(this.getOfflineHoursTotal() * 60 * 60);
    },

    addOfflineHourBoost(hours = 1) {
        return false;
    },

    addOfflineAdHours(hours = 1) {
        const added = CryptoZoo.offlineAds?.addHours?.(hours);

        if (!added) {
            return false;
        }

        CryptoZoo.state.offlineAdsHours = this.getOfflineAdsHours();
        CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();
        return true;
    },

    grantOfflineAdReward() {
        const granted = CryptoZoo.offlineAds?.grantAdReward?.() || false;

        if (granted) {
            CryptoZoo.state.offlineAdsHours = this.getOfflineAdsHours();
            CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();
        }

        return granted;
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) return 0;
        if (safeValue < 1000000000000) safeValue *= 1000;

        return safeValue;
    },

    normalizeBoostState() {
        CryptoZoo.state.boost2xActiveUntil = this.normalizeBoostTimestamp(
            CryptoZoo.state?.boost2xActiveUntil
        );

        if (
            CryptoZoo.state.boost2xActiveUntil > 0 &&
            CryptoZoo.state.boost2xActiveUntil <= Date.now()
        ) {
            CryptoZoo.state.boost2xActiveUntil = 0;
        }
    },

    normalizeOfflineBoostState() {
        return CryptoZoo.offline?.normalizeState?.() || false;
    },

    getLevelRequirement(level) {
        const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
        return Math.floor(100 * Math.pow(safeLevel, 1.35));
    },

    getTotalXpRequiredForLevel(level) {
        const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
        let total = 0;

        for (let currentLevel = 1; currentLevel < safeLevel; currentLevel += 1) {
            total += this.getLevelRequirement(currentLevel);
        }

        return Math.floor(total);
    },

    getLevelProgressDataForXp(xpValue) {
        const xp = Math.max(0, Math.floor(Number(xpValue) || 0));

        let level = 1;
        let req = this.getLevelRequirement(level);
        let used = 0;

        while (xp >= used + req) {
            used += req;
            level += 1;
            req = this.getLevelRequirement(level);
        }

        return {
            level,
            currentXp: Math.max(0, xp - used),
            requiredXp: req,
            totalUsedXp: used
        };
    },

    normalizeProgressionState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const savedLevel = Math.max(1, Math.floor(Number(CryptoZoo.state.level) || 1));
        const savedXp = Math.max(0, Math.floor(Number(CryptoZoo.state.xp) || 0));
        const progressFromXp = this.getLevelProgressDataForXp(savedXp);

        if (savedLevel > progressFromXp.level) {
            CryptoZoo.state.xp = this.getTotalXpRequiredForLevel(savedLevel);
            CryptoZoo.state.level = savedLevel;
            CryptoZoo.state.lastAwardedLevel = Math.max(
                1,
                Math.floor(Number(CryptoZoo.state.lastAwardedLevel) || savedLevel)
            );
            return;
        }

        CryptoZoo.state.xp = Math.floor(savedXp * 0.6);
        CryptoZoo.state.level = progressFromXp.level;

        if ((Number(CryptoZoo.state.lastAwardedLevel) || 1) > CryptoZoo.state.level) {
            CryptoZoo.state.lastAwardedLevel = CryptoZoo.state.level;
        }
    },

    isAnyBlockingModalOpen() {
        const blockingIds = [
            "profileModal",
            "settingsModal",
            "dailyRewardModal",
            "depositPaymentModal"
        ];

        return blockingIds.some((id) => {
            const el = document.getElementById(id);
            return !!(el && !el.classList.contains("hidden"));
        });
    },

    isInteractiveBlocked(target) {
        if (this.activeScreen !== "game") {
            return true;
        }

        if (this.isAnyBlockingModalOpen()) {
            return true;
        }

        const targetElement = target instanceof Element ? target : null;
        if (!targetElement) {
            return false;
        }

        if (
            targetElement.closest("#profileModal") ||
            targetElement.closest("#settingsModal") ||
            targetElement.closest("#dailyRewardModal") ||
            targetElement.closest("#depositPaymentModal") ||
            targetElement.closest(".profile-modal") ||
            targetElement.closest(".profile-card") ||
            targetElement.closest(".profile-backdrop")
        ) {
            return true;
        }

        if (targetElement.closest("a, input, textarea, select, label")) {
            return true;
        }

        const closestButton = targetElement.closest("button");
        if (
            closestButton &&
            closestButton.id !== "tapButton" &&
            !closestButton.closest(".tap-area")
        ) {
            return true;
        }

        return false;
    },

    isPointInsideTapZone(clientX, clientY, tapButton) {
        if (!tapButton) return false;

        const rect = tapButton.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return false;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const baseRadius = Math.min(rect.width, rect.height) / 2;
        const extraPadding = Math.max(0, Number(this.tapAreaPadding) || 0);
        const hitRadius = baseRadius + extraPadding;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        return (dx * dx + dy * dy) <= (hitRadius * hitRadius);
    },

    getValidTapTouches(touches, tapButton) {
        return Array.from(touches || []).filter((touch) => {
            return this.isPointInsideTapZone(touch.clientX, touch.clientY, tapButton);
        });
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        const tapArea = document.querySelector(".tap-area");

        if (!tapButton || !tapArea || tapArea.dataset.tapBound === "1") return;

        tapArea.dataset.tapBound = "1";
        tapButton.dataset.tapBound = "1";
        this.tapTouchIds = new Set();

        tapArea.style.touchAction = "manipulation";
        tapButton.style.touchAction = "manipulation";
        tapArea.style.webkitTapHighlightColor = "transparent";
        tapButton.style.webkitTapHighlightColor = "transparent";
        tapArea.style.userSelect = "none";
        tapButton.style.userSelect = "none";

        const triggerTap = (amount = 1) => {
            if (this.isAnyBlockingModalOpen()) return false;
            if (this.activeScreen !== "game") return false;
            if (Date.now() < this.suppressClickUntil) return false;

            const allowedAmount = this.getAllowedTapAmount(amount);
            if (allowedAmount <= 0) {
                return false;
            }

            this.suppressClickUntil = Date.now() + 90;
            this.handleTap(allowedAmount);
            return true;
        };

        tapButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const pointX = typeof e.clientX === "number" ? e.clientX : null;
            const pointY = typeof e.clientY === "number" ? e.clientY : null;

            if (
                pointX !== null &&
                pointY !== null &&
                !this.isPointInsideTapZone(pointX, pointY, tapButton)
            ) {
                return;
            }

            triggerTap(1);
        };

        tapArea.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isInteractiveBlocked(e.target)) return;
            if (!this.isPointInsideTapZone(e.clientX, e.clientY, tapButton)) return;

            triggerTap(1);
        };

        tapArea.addEventListener("touchstart", (e) => {
            if (this.isInteractiveBlocked(e.target)) return;

            const validTouches = this.getValidTapTouches(e.changedTouches, tapButton);
            if (!validTouches.length) return;

            let newTapCount = 0;

            validTouches.forEach((touch) => {
                const touchId = String(touch.identifier);

                if (this.tapTouchIds.has(touchId)) return;
                this.tapTouchIds.add(touchId);
                newTapCount += 1;
            });

            if (newTapCount <= 0) return;

            clearTimeout(this.touchReleaseTimer);
            this.touchBurstActive = true;

            e.preventDefault();
            e.stopPropagation();

            triggerTap(newTapCount);
        }, { passive: false });

        const releaseTouches = (e) => {
            const changedTouches = Array.from(e.changedTouches || []);

            changedTouches.forEach((touch) => {
                this.tapTouchIds.delete(String(touch.identifier));
            });

            if (this.tapTouchIds.size > 0) return;

            clearTimeout(this.touchReleaseTimer);
            this.touchReleaseTimer = setTimeout(() => {
                this.touchBurstActive = false;
            }, 40);
        };

        tapArea.addEventListener("touchend", releaseTouches, { passive: true });
        tapArea.addEventListener("touchcancel", releaseTouches, { passive: true });
    },

    scheduleTapSave() {
        clearTimeout(this.tapSaveTimer);

        this.tapSaveTimer = setTimeout(() => {
            this.flushTapSave();
        }, this.tapSaveDelayMs);
    },

    async flushTapSave() {
        if (this.tapSaveInFlight) {
            this.tapSaveQueued = true;
            return;
        }

        this.tapSaveInFlight = true;
        this.tapSaveQueued = false;

        try {
            await CryptoZoo.api?.savePlayer?.();
        } catch (error) {
            console.error("Tap save failed:", error);
        } finally {
            this.tapSaveInFlight = false;

            if (this.tapSaveQueued) {
                this.tapSaveQueued = false;
                this.flushTapSave();
            }
        }
    },

    getTapXpGain(amount = 1) {
        const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
        const multiplier = Math.max(1, Number(this.getBoost2xMultiplier()) || 1);
        return safeAmount * 0.5 * multiplier;
    },

    handleTap(amount = 1) {
        const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
        const valuePerTap = this.getEffectiveCoinsPerClick();
        const totalCoins = valuePerTap * safeAmount;
        const totalXp = this.getTapXpGain(safeAmount);

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + totalCoins;
        CryptoZoo.state.xp = Math.max(0, Number(CryptoZoo.state.xp) || 0) + totalXp;
        

        this.recalculateLevel();

        CryptoZoo.dailyMissions?.recordTap?.(safeAmount);

        CryptoZoo.audio?.play?.("tap");

        if (this.enableTapEffects) {
            CryptoZoo.ui?.animateCoin?.(safeAmount);
        }

        this.requestRender();
        this.scheduleTapSave();
    },

    getBaseCoinsPerClick() {
        return Math.max(
            1,
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1
        );
    },

    getEffectiveCoinsPerClick() {
        return this.getBaseCoinsPerClick() * this.getBoost2xMultiplier();
    },

    getEffectiveZooIncome() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        return baseIncome * this.getBoost2xMultiplier();
    },

    bindNavigation() {
        return CryptoZoo.navigation?.bind?.();
    },

    showScreen(screenName, force = false) {
        const targetName = String(screenName || "game");

        if (this.activeScreen === targetName && !force) {
            return true;
        }

        this.activeScreen = targetName;

        if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("cryptozoo_last_screen", targetName);
        }

        const result = CryptoZoo.navigation?.show?.(targetName);

        this.requestRender(true);

        return result;
    },

    startIncomeTimer() {
        return CryptoZoo.incomeSystem?.start?.();
    },

    bindBoostShopButton() {
        return CryptoZoo.boostSystem?.bindShopButton?.();
    },

    isBoost2xActive() {
        return CryptoZoo.boostSystem?.isActive?.();
    },

    getBoost2xMultiplier() {
        return CryptoZoo.boostSystem?.getMultiplier?.() || 1;
    },

    getBoost2xTimeLeft() {
        return CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
    },

    activateBoost2x() {
        return CryptoZoo.boostSystem?.activate?.();
    },

    bindAnimalButtons() {
        return CryptoZoo.animalsSystem?.bindButtons?.();
    },

    bindShopButtons() {
        return CryptoZoo.shopSystem?.bindButtons?.();
    },

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (btn) {
            btn.onclick = () => CryptoZoo.dailyReward?.claim?.();
        }
    },

    applyOfflineEarnings() {
        return CryptoZoo.offline?.applyEarnings?.();
    },

    getAnimalIncomeMultiplier(level = 1) {
        const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
        return 1 + ((safeLevel - 1) * 0.025);
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        const maxOwnedPerAnimal = Math.max(
            1,
            Number(CryptoZoo.config?.limits?.maxOwnedPerAnimal) || 20
        );
        const maxLevelPerAnimal = Math.max(
            1,
            Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 25
        );

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const animalState = CryptoZoo.state.animals[type] || { count: 0, level: 1 };
            const count = Math.max(
                0,
                Math.min(maxOwnedPerAnimal, Math.floor(Number(animalState.count) || 0))
            );
            let level = Math.max(
                1,
                Math.min(maxLevelPerAnimal, Math.floor(Number(animalState.level) || 1))
            );
            const baseIncome = Math.max(0, Number(animals[type]?.baseIncome) || 0);

            if (count <= 0) {
                level = 1;
            }

            CryptoZoo.state.animals[type].count = count;
            CryptoZoo.state.animals[type].level = level;

            total += count * baseIncome * Math.pow(1.08, level);
        });

        if (total > 1e9) {
            total *= 0.5;
        }

        CryptoZoo.state.zooIncome = Math.max(0, Math.floor(total));
        return CryptoZoo.state.zooIncome;
    },

    getLevelProgressData() {
        return this.getLevelProgressDataForXp(CryptoZoo.state?.xp);
    },

    getLevelReward(level) {
        const safeLevel = Math.max(1, Number(level) || 1);

        const rewardTable = {
            2: { coins: 20, gems: 0 },
            3: { coins: 35, gems: 0 },
            4: { coins: 55, gems: 0 },
            5: { coins: 80, gems: 0 },
            6: { coins: 110, gems: 0 },
            7: { coins: 145, gems: 0 },
            8: { coins: 185, gems: 0 },
            9: { coins: 230, gems: 0 },
            10: { coins: 280, gems: 1 }
        };

        if (rewardTable[safeLevel]) {
            return rewardTable[safeLevel];
        }

        return {
            coins: Math.floor(28 * Math.pow(safeLevel, 1.22)),
            gems: safeLevel % 15 === 0 ? 1 : 0
        };
    },

    awardPendingLevelRewards() {
        CryptoZoo.state = CryptoZoo.state || {};

        const currentLevel = Math.max(1, Number(CryptoZoo.state.level) || 1);
        let lastAwardedLevel = Math.max(
            1,
            Number(CryptoZoo.state.lastAwardedLevel) || 1
        );

        if (lastAwardedLevel >= currentLevel) {
            return false;
        }

        let totalCoins = 0;
        let totalGems = 0;

        for (let level = lastAwardedLevel + 1; level <= currentLevel; level += 1) {
            const reward = this.getLevelReward(level);
            totalCoins += Math.max(0, Number(reward.coins) || 0);
            totalGems += Math.max(0, Number(reward.gems) || 0);
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + totalCoins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + totalGems;
        CryptoZoo.state.lastAwardedLevel = currentLevel;

        const rewardText = [
            `Lvl ${CryptoZoo.formatNumber(currentLevel)}`,
            `+${CryptoZoo.formatNumber(totalCoins)} coins`,
            totalGems > 0 ? `+${CryptoZoo.formatNumber(totalGems)} gem` : ""
        ].filter(Boolean).join(" • ");

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(`🎉 ${rewardText}`);
        return true;
    },

    recalculateLevel() {
        const previousLevel = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const progress = this.getLevelProgressData();
        const nextLevel = Math.max(previousLevel, progress.level);

        CryptoZoo.state.level = nextLevel;

        if (nextLevel > previousLevel) {
            this.awardPendingLevelRewards();
        }

        return nextLevel;
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
        CryptoZoo.state.offlineBoostHours = 0;

        CryptoZoo.offlineAds?.ensureState?.();
        CryptoZoo.state.offlineAdsHours = this.getOfflineAdsHours();
        CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();

        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
        CryptoZoo.expeditions?.ensureExpeditionStats?.();
        CryptoZoo.expeditions?.ensureActiveExpeditionShape?.();
        CryptoZoo.offlineAds?.ensureState?.();
    },

    persistAndRender() {
        this.recalculateProgress();
        
        this.requestRender();
        CryptoZoo.api?.savePlayer?.();
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            this.normalizeBoostState();
            this.normalizeOfflineBoostState();

            if (this.activeScreen === "game" || this.activeScreen === "shop") {
                CryptoZoo.ui?.renderBoostStatus?.();
            }

            if (this.activeScreen === "game") {
                CryptoZoo.ui?.renderDailyRewardStatus?.();
                CryptoZoo.ui?.renderOfflineInfo?.();
            }
        }, 1000);
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (this.activeScreen === "missions") {
                const updated = CryptoZoo.ui?.updateActiveExpeditionTimerOnly?.();

                if (!updated) {
                    CryptoZoo.ui?.renderExpeditions?.();
                }
            }
        }, 1000);
    }
};
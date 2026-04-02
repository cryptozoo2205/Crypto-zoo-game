window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchBurstActive: false,
    touchReleaseTimer: null,

    maxOfflineSeconds: 1 * 60 * 60,
    baseOfflineHours: 1,
    maxOfflineHoursWithoutAds: 4,
    maxOfflineBoostHoursFromShop: 3,

    dailyRewardCooldownMs: 24 * 60 * 60 * 1000,
    dailyRewardMaxStreak: 7,
    tapTouchIds: null,
    tapAreaPadding: 55,

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

    init() {
        this.ensureState();
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
        Object.keys(animals).forEach((type) => {
            if (!CryptoZoo.state.animals[type] || typeof CryptoZoo.state.animals[type] !== "object") {
                CryptoZoo.state.animals[type] = { count: 0, level: 1 };
            }

            CryptoZoo.state.animals[type].count = Math.max(
                0,
                Math.floor(Number(CryptoZoo.state.animals[type].count) || 0)
            );

            CryptoZoo.state.animals[type].level = Math.max(
                1,
                Math.floor(Number(CryptoZoo.state.animals[type].level) || 1)
            );
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
            offlineMaxSeconds: this.maxOfflineSeconds,
            offlineBoostMultiplier: 1,
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
            lastAwardedLevel: 1
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

        CryptoZoo.state.offlineBaseHours = Math.max(
            1,
            Math.floor(Number(CryptoZoo.state.offlineBaseHours) || this.baseOfflineHours)
        );

        CryptoZoo.state.offlineBoostHours = Math.max(
            0,
            Math.min(
                this.maxOfflineBoostHoursFromShop,
                Math.floor(Number(CryptoZoo.state.offlineBoostHours) || 0)
            )
        );

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state.offlineAdsHours) || 0)
        );

        CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();

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
        return Math.max(1, Math.floor(Number(CryptoZoo.state?.offlineBaseHours) || this.baseOfflineHours));
    },

    getOfflineBoostHours() {
        return Math.max(
            0,
            Math.min(
                this.maxOfflineBoostHoursFromShop,
                Math.floor(Number(CryptoZoo.state?.offlineBoostHours) || 0)
            )
        );
    },

    getOfflineAdsHours() {
        return Math.max(0, Math.floor(Number(CryptoZoo.state?.offlineAdsHours) || 0));
    },

    getOfflineHoursWithoutAds() {
        return Math.max(1, this.getOfflineBaseHours() + this.getOfflineBoostHours());
    },

    getOfflineHoursTotal() {
        return Math.max(1, this.getOfflineHoursWithoutAds() + this.getOfflineAdsHours());
    },

    getOfflineMaxSeconds() {
        return this.getOfflineHoursTotal() * 60 * 60;
    },

    addOfflineHourBoost(hours = 1) {
        const safeHours = Math.max(1, Math.floor(Number(hours) || 1));
        const current = this.getOfflineBoostHours();

        if (current >= this.maxOfflineBoostHoursFromShop) {
            return false;
        }

        const next = Math.min(
            this.maxOfflineBoostHoursFromShop,
            current + safeHours
        );

        if (next === current) {
            return false;
        }

        CryptoZoo.state.offlineBoostHours = next;
        CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();
        return true;
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

    isAnyBlockingModalOpen() {
        const blockingIds = [
            "profileModal",
            "settingsModal",
            "dailyRewardModal",
            "depositPaymentModal"
        ];

        return blockingIds.some((id) => {
            const el = document.getElementById(id);
            return el && !el.classList.contains("hidden");
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

            this.suppressClickUntil = Date.now() + 90;
            this.handleTap(amount);
            return true;
        };

        tapButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerTap(1);
        };

        tapArea.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isInteractiveBlocked(e.target)) return;
            triggerTap(1);
        };

        tapArea.addEventListener("touchstart", (e) => {
            if (this.isInteractiveBlocked(e.target)) return;

            const changedTouches = Array.from(e.changedTouches || []);
            if (!changedTouches.length) return;

            let newTapCount = 0;

            changedTouches.forEach((touch) => {
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

    handleTap(amount = 1) {
        const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
        const valuePerTap = this.getEffectiveCoinsPerClick();
        const totalCoins = valuePerTap * safeAmount;

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + totalCoins;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + safeAmount;
        CryptoZoo.state.lastLogin = Date.now();

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

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        const maxOwnedPerAnimal = Math.max(
            1,
            Number(CryptoZoo.config?.limits?.maxOwnedPerAnimal) || 50
        );
        const maxLevelPerAnimal = Math.max(
            1,
            Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 100
        );

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const animalState = CryptoZoo.state.animals[type] || { count: 0, level: 1 };
            const count = Math.max(
                0,
                Math.min(maxOwnedPerAnimal, Math.floor(Number(animalState.count) || 0))
            );
            const level = Math.max(
                1,
                Math.min(maxLevelPerAnimal, Math.floor(Number(animalState.level) || 1))
            );
            const baseIncome = Math.max(0, Number(animals[type]?.baseIncome) || 0);

            CryptoZoo.state.animals[type].count = count;
            CryptoZoo.state.animals[type].level = level;

            total += count * level * baseIncome;
        });

        CryptoZoo.state.zooIncome = Math.max(0, Math.floor(total));
        return CryptoZoo.state.zooIncome;
    },

    getLevelRequirement(level) {
        const safeLevel = Math.max(1, Number(level) || 1);

        if (safeLevel <= 5) {
            return 55 + safeLevel * 30;
        }

        return Math.floor(95 * Math.pow(safeLevel, 1.24));
    },

    getLevelProgressData() {
        const xp = Math.max(0, Number(CryptoZoo.state?.xp) || 0);

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

    getLevelReward(level) {
        const safeLevel = Math.max(1, Number(level) || 1);

        const rewardTable = {
            2: { coins: 25, gems: 0 },
            3: { coins: 45, gems: 0 },
            4: { coins: 70, gems: 0 },
            5: { coins: 100, gems: 0 },
            6: { coins: 140, gems: 0 },
            7: { coins: 190, gems: 0 },
            8: { coins: 250, gems: 0 },
            9: { coins: 320, gems: 0 },
            10: { coins: 400, gems: 1 }
        };

        if (rewardTable[safeLevel]) {
            return rewardTable[safeLevel];
        }

        return {
            coins: Math.floor(40 * Math.pow(safeLevel, 1.35)),
            gems: safeLevel % 10 === 0 ? 1 : 0
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
        CryptoZoo.state.offlineMaxSeconds = this.getOfflineMaxSeconds();
        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
        CryptoZoo.expeditions?.ensureExpeditionStats?.();
        CryptoZoo.expeditions?.ensureActiveExpeditionShape?.();
    },

    persistAndRender() {
        this.recalculateProgress();
        CryptoZoo.state.lastLogin = Date.now();
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
// ================= DEBUG PANEL =================

window.CryptoZooDebug = {
    visible: false,

    init() {
        this.createToggle();
        this.createPanel();
        this.loadLocalBackup();
    },

    createToggle() {
        const toggle = document.createElement("div");
        toggle.style.position = "fixed";
        toggle.style.top = "10px";
        toggle.style.left = "10px";
        toggle.style.width = "30px";
        toggle.style.height = "30px";
        toggle.style.zIndex = "99999";
        toggle.style.opacity = "0.05";

        toggle.onclick = () => {
            this.visible = !this.visible;
            document.getElementById("debugPanel").style.display = this.visible ? "block" : "none";
        };

        document.body.appendChild(toggle);
    },

    createPanel() {
        const panel = document.createElement("div");
        panel.id = "debugPanel";

        panel.style.position = "fixed";
        panel.style.top = "60px";
        panel.style.right = "10px";
        panel.style.zIndex = "99999";
        panel.style.background = "#111";
        panel.style.padding = "12px";
        panel.style.borderRadius = "12px";
        panel.style.display = "none";
        panel.style.width = "160px";

        panel.innerHTML = `
            <div style="font-weight:900; margin-bottom:8px;">DEBUG</div>

            <button id="dbgGems">💎 +1000</button>
            <button id="dbgCoins">🪙 +1M</button>
            <button id="dbgLvl">🚀 +1 LVL</button>
            <button id="dbgSave">💾 SAVE</button>
            <button id="dbgReset">❌ RESET</button>
        `;

        document.body.appendChild(panel);

        document.getElementById("dbgGems").onclick = () => {
            CryptoZoo.state.gems += 1000;
            this.render();
        };

        document.getElementById("dbgCoins").onclick = () => {
            CryptoZoo.state.coins += 1000000;
            this.render();
        };

        document.getElementById("dbgLvl").onclick = () => {
            CryptoZoo.state.level += 1;
            this.render();
        };

        document.getElementById("dbgSave").onclick = () => {
            this.saveLocal();
        };

        document.getElementById("dbgReset").onclick = () => {
            localStorage.removeItem("cryptozoo_save_backup");
            location.reload();
        };
    },

    render() {
        CryptoZoo.gameplay?.requestRender?.();
        this.saveLocal();
    },

    saveLocal() {
        localStorage.setItem("cryptozoo_save_backup", JSON.stringify(CryptoZoo.state));
        CryptoZoo.ui?.showToast?.("💾 Saved locally");
    },

    loadLocalBackup() {
        const backup = localStorage.getItem("cryptozoo_save_backup");

        if (backup) {
            try {
                CryptoZoo.state = JSON.parse(backup);
                console.log("Loaded local save");
            } catch (e) {
                console.error("Backup load error", e);
            }
        }
    }
};

// auto start
setTimeout(() => {
    window.CryptoZooDebug.init();
}, 500);

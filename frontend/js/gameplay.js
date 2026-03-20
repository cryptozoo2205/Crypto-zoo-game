window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    incomeTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchTapLock: false,
    maxOfflineSeconds: 4 * 60 * 60,
    dailyRewardCooldownMs: 24 * 60 * 60 * 1000,
    dailyRewardCoins: 500,
    dailyRewardGems: 1,

    init() {
        this.ensureState();
        this.recalculateProgress();
        this.applyOfflineEarnings();
        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();
        this.bindDailyRewardButton();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

        this.bindAnimalButtons();
        this.bindShopButtons();

        this.startIncomeTimer();
        this.startExpeditionTimer();
        this.startBoostTimer();

        CryptoZoo.ui?.render?.();
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

        const animals = CryptoZoo.config?.animals || {};
        Object.keys(animals).forEach((type) => {
            if (!CryptoZoo.state.animals[type]) {
                CryptoZoo.state.animals[type] = { count: 0, level: 1 };
            }
        });

        if (typeof CryptoZoo.state.coins !== "number") {
            CryptoZoo.state.coins = Number(CryptoZoo.state.coins) || 0;
        }

        if (typeof CryptoZoo.state.gems !== "number") {
            CryptoZoo.state.gems = Number(CryptoZoo.state.gems) || 0;
        }

        if (typeof CryptoZoo.state.rewardBalance !== "number") {
            CryptoZoo.state.rewardBalance = Number(CryptoZoo.state.rewardBalance) || 0;
        }

        if (typeof CryptoZoo.state.level !== "number") {
            CryptoZoo.state.level = Number(CryptoZoo.state.level) || 1;
        }

        if (typeof CryptoZoo.state.coinsPerClick !== "number") {
            CryptoZoo.state.coinsPerClick = Math.max(1, Number(CryptoZoo.state.coinsPerClick) || 1);
        }

        if (typeof CryptoZoo.state.zooIncome !== "number") {
            CryptoZoo.state.zooIncome = Number(CryptoZoo.state.zooIncome) || 0;
        }

        if (typeof CryptoZoo.state.expeditionBoost !== "number") {
            CryptoZoo.state.expeditionBoost = Number(CryptoZoo.state.expeditionBoost) || 0;
        }

        if (typeof CryptoZoo.state.offlineBoost !== "number") {
            CryptoZoo.state.offlineBoost = Number(CryptoZoo.state.offlineBoost) || 1;
        }

        if (typeof CryptoZoo.state.xp !== "number") {
            CryptoZoo.state.xp = Number(CryptoZoo.state.xp) || 0;
        }

        if (typeof CryptoZoo.state.boost2xActiveUntil !== "number") {
            CryptoZoo.state.boost2xActiveUntil = Number(CryptoZoo.state.boost2xActiveUntil) || 0;
        }

        if (typeof CryptoZoo.state.lastLogin !== "number") {
            CryptoZoo.state.lastLogin = Number(CryptoZoo.state.lastLogin) || Date.now();
        }

        if (typeof CryptoZoo.state.lastDailyRewardAt !== "number") {
            CryptoZoo.state.lastDailyRewardAt = Number(CryptoZoo.state.lastDailyRewardAt) || 0;
        }

        CryptoZoo.state.boost2xActiveUntil = this.normalizeBoostTimestamp(
            CryptoZoo.state.boost2xActiveUntil
        );
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) {
            return 0;
        }

        if (safeValue < 1000000000000) {
            safeValue *= 1000;
        }

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

    isBoost2xActive() {
        this.normalizeBoostState();
        return (Number(CryptoZoo.state?.boost2xActiveUntil) || 0) > Date.now();
    },

    getBoost2xMultiplier() {
        return this.isBoost2xActive() ? 2 : 1;
    },

    getBoost2xTimeLeft() {
        this.normalizeBoostState();

        return Math.max(
            0,
            Math.floor(
                ((Number(CryptoZoo.state?.boost2xActiveUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    getTapCountFromTouches(touchCount) {
        const safeCount = Number(touchCount) || 1;
        return Math.max(1, Math.min(3, safeCount));
    },

    getBaseCoinsPerClick() {
        return Math.max(
            0,
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1
        );
    },

    getEffectiveCoinsPerClick(tapCount = 1) {
        const touches = this.getTapCountFromTouches(tapCount);
        const base = this.getBaseCoinsPerClick() * this.getBoost2xMultiplier();

        return base * touches;
    },

    getBaseZooIncome() {
        this.recalculateZooIncome();
        return Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
    },

    getEffectiveZooIncome() {
        return this.getBaseZooIncome() * this.getBoost2xMultiplier();
    },

    getOfflineIncomePerSecond() {
        const baseIncome = this.getBaseZooIncome();
        const offlineBoost = Math.max(1, Number(CryptoZoo.state?.offlineBoost) || 1);

        return baseIncome * offlineBoost;
    },

    getDailyRewardCoinsAmount() {
        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);

        if (level >= 25) {
            return 5000;
        }

        if (level >= 15) {
            return 3500;
        }

        if (level >= 10) {
            return 2000;
        }

        if (level >= 5) {
            return 1000;
        }

        return 500;
    },

    getDailyRewardGemsAmount() {
        return this.dailyRewardGems;
    },

    formatOfflineDuration(totalSeconds) {
        const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h`;
        }

        if (minutes > 0) {
            return `${minutes}m`;
        }

        return `${safeSeconds}s`;
    },

    applyOfflineEarnings() {
        const now = Date.now();
        const lastLogin = Math.max(0, Number(CryptoZoo.state?.lastLogin) || now);
        const elapsedSeconds = Math.max(0, Math.floor((now - lastLogin) / 1000));
        const cappedSeconds = Math.min(elapsedSeconds, this.maxOfflineSeconds);
        const wasCapped = elapsedSeconds > this.maxOfflineSeconds;

        if (cappedSeconds <= 0) {
            CryptoZoo.state.lastLogin = now;
            return;
        }

        this.recalculateZooIncome();

        const offlineIncomePerSecond = this.getOfflineIncomePerSecond();
        const offlineCoins = Math.floor(offlineIncomePerSecond * cappedSeconds);

        CryptoZoo.state.lastLogin = now;

        if (offlineCoins <= 0) {
            return;
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + offlineCoins;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + Math.max(1, Math.floor(cappedSeconds / 60));

        this.recalculateLevel();

        const timeLabel = this.formatOfflineDuration(cappedSeconds);
        const capLabel = wasCapped ? " • limit 4h" : "";

        CryptoZoo.ui?.showToast?.(
            `Offline: ${timeLabel} • +${CryptoZoo.formatNumber(offlineCoins)} coins${capLabel}`
        );

        CryptoZoo.api?.savePlayer?.();
    },

    getDailyRewardTimeLeftMs() {
        const lastClaimAt = Math.max(0, Number(CryptoZoo.state?.lastDailyRewardAt) || 0);

        if (lastClaimAt <= 0) {
            return 0;
        }

        const nextClaimAt = lastClaimAt + this.dailyRewardCooldownMs;
        return Math.max(0, nextClaimAt - Date.now());
    },

    canClaimDailyReward() {
        return this.getDailyRewardTimeLeftMs() <= 0;
    },

    claimDailyReward() {
        if (!this.canClaimDailyReward()) {
            const timeLeftSeconds = Math.ceil(this.getDailyRewardTimeLeftMs() / 1000);

            CryptoZoo.ui?.showToast?.(
                `Daily Reward za: ${CryptoZoo.ui?.formatTimeLeft?.(timeLeftSeconds) || "00:00:00"}`
            );
            return false;
        }

        const rewardCoins = this.getDailyRewardCoinsAmount();
        const rewardGems = this.getDailyRewardGemsAmount();

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + rewardCoins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + rewardGems;
        CryptoZoo.state.lastDailyRewardAt = Date.now();
        CryptoZoo.state.lastLogin = Date.now();

        this.recalculateProgress();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(
            `Daily Reward: +${CryptoZoo.formatNumber(rewardCoins)} coins +${CryptoZoo.formatNumber(rewardGems)} gem`
        );

        return true;
    },

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (!btn) return;

        btn.dataset.bound = "1";
        btn.onclick = () => {
            this.claimDailyReward();
        };
    },

    persistAndRender() {
        this.normalizeBoostState();
        this.recalculateProgress();
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    activateBoost2x() {
        const boostCostGems = 1;
        const boostDurationMs = 10 * 60 * 1000;

        if (this.isBoost2xActive()) {
            CryptoZoo.ui?.showToast?.(
                `Boost już aktywny: ${CryptoZoo.ui?.formatTimeLeft?.(this.getBoost2xTimeLeft()) || "00:00:00"}`
            );
            CryptoZoo.ui?.render?.();
            return true;
        }

        if ((Number(CryptoZoo.state.gems) || 0) < boostCostGems) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return false;
        }

        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) - boostCostGems;
        CryptoZoo.state.boost2xActiveUntil = Date.now() + boostDurationMs;

        this.persistAndRender();
        CryptoZoo.ui?.showToast?.("X2 Boost aktywowany");

        return true;
    },

    bindBoostShopButton() {
        const btn = document.getElementById("buyBoostBtn");
        if (!btn) return;

        btn.onclick = () => {
            const activated = this.activateBoost2x();

            if (activated) {
                this.showScreen("game");
            }
        };
    },

    bindNavigation() {
        const navButtons = document.querySelectorAll("[data-nav]");

        navButtons.forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const screenName = button.getAttribute("data-nav");
                this.showScreen(screenName);
            };
        });
    },

    showScreen(screenName) {
        const screens = document.querySelectorAll('main section[id^="screen-"]');
        const navButtons = document.querySelectorAll("[data-nav]");

        screens.forEach((screen) => {
            screen.classList.add("hidden");
            screen.classList.remove("active-screen");
        });

        navButtons.forEach((button) => {
            button.classList.remove("active-nav");
        });

        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.remove("hidden");
            targetScreen.classList.add("active-screen");
        }

        const activeButton = document.querySelector(`[data-nav="${screenName}"]`);
        if (activeButton) {
            activeButton.classList.add("active-nav");
        }

        this.activeScreen = screenName;
        sessionStorage.setItem("cryptozoo_last_screen", screenName);

        if (screenName === "ranking") {
            CryptoZoo.uiRanking?.renderRanking?.();
        }

        if (screenName === "missions") {
            CryptoZoo.ui?.renderExpeditions?.();
        }

        if (screenName === "shop") {
            this.bindBoostShopButton();
        }

        CryptoZoo.ui?.render?.();
    },

    handleTap(tapCount = 1) {
        const safeTapCount = this.getTapCountFromTouches(tapCount);
        const clickValue = this.getEffectiveCoinsPerClick(safeTapCount);

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + clickValue;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + safeTapCount;

        this.recalculateLevel();

        CryptoZoo.ui?.animateCoin?.(safeTapCount);
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = (event) => {
            if (event) {
                event.preventDefault();
            }

            if (Date.now() < this.suppressClickUntil) {
                return;
            }

            this.handleTap(1);
        };

        tapButton.addEventListener(
            "touchstart",
            (event) => {
                if (this.touchTapLock) {
                    event.preventDefault();
                    return;
                }

                const touches = this.getTapCountFromTouches(event.touches?.length || 1);

                this.touchTapLock = true;
                this.suppressClickUntil = Date.now() + 700;
                event.preventDefault();
                this.handleTap(touches);
            },
            { passive: false }
        );

        const unlockTouchTap = () => {
            this.touchTapLock = false;
        };

        tapButton.addEventListener("touchend", unlockTouchTap, { passive: true });
        tapButton.addEventListener("touchcancel", unlockTouchTap, { passive: true });
    },

    bindAnimalButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach((type) => {
            const buyBtn = document.getElementById(`buy-${type}-btn`);
            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);

            if (buyBtn) {
                buyBtn.onclick = () => this.buyAnimal(type);
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = () => this.upgradeAnimal(type);
            }
        });
    },

    bindShopButtons() {
        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const btn = document.getElementById(`buy-shop-${item.id}`);
            if (btn) {
                btn.onclick = () => this.buyShopItem(item.id);
            }
        });
    },

    applyLevelDropBySpend(spentAmount, coinsBeforeSpend) {
        const spent = Number(spentAmount) || 0;
        const before = Number(coinsBeforeSpend) || 0;

        if (spent <= 0 || before <= 0) return;

        const spendRatio = spent / before;
        let levelLoss = 0;

        if (spendRatio > 0.60) {
            levelLoss = 3;
        } else if (spendRatio > 0.30) {
            levelLoss = 2;
        } else if (spendRatio > 0.10) {
            levelLoss = 1;
        }

        if (levelLoss > 0) {
            CryptoZoo.state.level = Math.max(
                1,
                (Number(CryptoZoo.state.level) || 1) - levelLoss
            );
        }

        CryptoZoo.state.xp = Math.floor((Number(CryptoZoo.state.xp) || 0) * 0.7);
    },

    buyShopItem(itemId) {
        const item = (CryptoZoo.config?.shopItems || []).find((x) => x.id === itemId);
        if (!item) return;

        const price = Number(item.price || 0);
        const coinsBeforeSpend = Number(CryptoZoo.state.coins) || 0;

        if (coinsBeforeSpend < price) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= price;

        if (item.type === "click") {
            CryptoZoo.state.coinsPerClick = (Number(CryptoZoo.state.coinsPerClick) || 1) + 1;
        }

        if (item.type === "income") {
            const currentIncome = Number(CryptoZoo.state.zooIncome) || 0;
            CryptoZoo.state.zooIncome = Math.max(1, Math.floor(currentIncome * 1.25));
        }

        if (item.type === "expedition") {
            CryptoZoo.state.expeditionBoost = (Number(CryptoZoo.state.expeditionBoost) || 0) + 0.2;
        }

        if (item.type === "offline") {
            CryptoZoo.state.offlineBoost = 2;
        }

        this.applyLevelDropBySpend(price, coinsBeforeSpend);
        this.persistAndRender();
        CryptoZoo.ui?.showToast?.(`Kupiono ${item.name}`);
    },

    buyAnimal(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return;

        const buyCost = Number(config.buyCost || 0);
        const coinsBeforeSpend = Number(CryptoZoo.state?.coins) || 0;

        if (coinsBeforeSpend < buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        if (!CryptoZoo.state.animals[type]) {
            CryptoZoo.state.animals[type] = { count: 0, level: 1 };
        }

        CryptoZoo.state.coins -= buyCost;
        CryptoZoo.state.animals[type].count += 1;

        this.applyLevelDropBySpend(buyCost, coinsBeforeSpend);
        this.persistAndRender();
        CryptoZoo.ui?.showToast?.(`Kupiono ${config.name}`);
    },

    getAnimalUpgradeCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = CryptoZoo.state?.animals?.[type];

        if (!config || !animal) return 0;

        const level = Number(animal.level) || 1;
        return Math.floor((Number(config.buyCost) || 0) * level * 0.7);
    },

    upgradeAnimal(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = CryptoZoo.state?.animals?.[type];

        if (!config || !animal) return;

        const cost = this.getAnimalUpgradeCost(type);
        const coinsBeforeSpend = Number(CryptoZoo.state.coins) || 0;

        if (coinsBeforeSpend < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        animal.level += 1;

        this.applyLevelDropBySpend(cost, coinsBeforeSpend);
        this.persistAndRender();
        CryptoZoo.ui?.showToast?.(`Ulepszono ${config.name}`);
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        const stateAnimals = CryptoZoo.state?.animals || {};

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const config = animals[type];
            const animal = stateAnimals[type] || { count: 0, level: 1 };

            total +=
                (Number(animal.count) || 0) *
                (Number(animal.level) || 1) *
                (Number(config.baseIncome) || 0);
        });

        CryptoZoo.state.zooIncome = total;
    },

    recalculateLevel() {
        const xp = Number(CryptoZoo.state.xp) || 0;

        let level = 1;
        let requiredXp = 100;
        let spentXp = 0;

        while (xp >= spentXp + requiredXp) {
            spentXp += requiredXp;
            level += 1;
            requiredXp += 100;
        }

        CryptoZoo.state.level = Math.max(Number(CryptoZoo.state.level) || 1, level);
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
        this.normalizeBoostState();
    },

    startIncomeTimer() {
        if (this.incomeTimerStarted) return;
        this.incomeTimerStarted = true;

        setInterval(() => {
            this.recalculateProgress();

            const baseIncome = Number(CryptoZoo.state?.zooIncome) || 0;
            if (baseIncome <= 0) {
                CryptoZoo.state.lastLogin = Date.now();
                CryptoZoo.ui?.renderHome?.();
                return;
            }

            const income = baseIncome * this.getBoost2xMultiplier();

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + income;
            CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 1;
            CryptoZoo.state.lastLogin = Date.now();

            this.recalculateLevel();

            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            const previousBoostValue = Number(CryptoZoo.state?.boost2xActiveUntil) || 0;

            this.normalizeBoostState();
            CryptoZoo.state.lastLogin = Date.now();

            const currentBoostValue = Number(CryptoZoo.state?.boost2xActiveUntil) || 0;

            if (previousBoostValue > 0 && currentBoostValue === 0) {
                CryptoZoo.api?.savePlayer?.();
            }

            CryptoZoo.ui?.render?.();
        }, 1000);
    },

    startExpedition(id) {
        const expedition = (CryptoZoo.config?.expeditions || []).find((e) => e.id === id);
        if (!expedition) return;

        if (CryptoZoo.state.expedition) {
            CryptoZoo.ui?.showToast?.("Ekspedycja już trwa");
            return;
        }

        const now = Date.now();
        const rareRoll = Math.random();
        const epicRoll = Math.random();

        let rewardRarity = "common";
        let coinsMultiplier = 1;
        let gemsMultiplier = 1;

        if (epicRoll < expedition.epicChance) {
            rewardRarity = "epic";
            coinsMultiplier = 2.2;
            gemsMultiplier = 2;
        } else if (rareRoll < expedition.rareChance) {
            rewardRarity = "rare";
            coinsMultiplier = 1.5;
            gemsMultiplier = 1.5;
        }

        const bonus = 1 + (Number(CryptoZoo.state.expeditionBoost) || 0);

        CryptoZoo.state.expedition = {
            id: expedition.id,
            name: expedition.name,
            startTime: now,
            endTime: now + expedition.duration * 1000,
            rewardRarity,
            rewardCoins: Math.floor(
                (Number(expedition.baseCoins) || 0) * coinsMultiplier * bonus
            ),
            rewardGems: Math.floor(
                (Number(expedition.baseGems) || 0) * gemsMultiplier * bonus
            )
        };

        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("Ekspedycja rozpoczęta");
    },

    collectExpedition() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return;
        }

        if (Date.now() < expedition.endTime) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jeszcze trwa");
            return;
        }

        CryptoZoo.state.coins =
            (Number(CryptoZoo.state.coins) || 0) + (Number(expedition.rewardCoins) || 0);
        CryptoZoo.state.gems =
            (Number(CryptoZoo.state.gems) || 0) + (Number(expedition.rewardGems) || 0);
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 5;

        CryptoZoo.state.expedition = null;
        CryptoZoo.state.lastLogin = Date.now();

        this.recalculateLevel();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("Odebrano nagrodę z ekspedycji");
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (!CryptoZoo.state?.expedition) return;
            if (this.activeScreen !== "missions") return;

            CryptoZoo.state.lastLogin = Date.now();
            CryptoZoo.ui?.renderExpeditions?.();
        }, 1000);
    },

    openBox(type) {
        CryptoZoo.boxes?.open?.(type);
    }
};
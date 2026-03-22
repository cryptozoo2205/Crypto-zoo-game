window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    testResetMode: false,

    getApiBase() {
        const fromStorage = localStorage.getItem("cryptozoo_api_base");
        if (fromStorage) {
            return String(fromStorage).replace(/\/+$/, "");
        }

        const fromConfig =
            window.CryptoZoo?.config?.apiBase ||
            window.CryptoZoo?.config?.API_BASE ||
            window.CryptoZoo?.config?.backendUrl ||
            window.CRYPTOZOO_API_BASE ||
            "";

        if (fromConfig) {
            return String(fromConfig).replace(/\/+$/, "");
        }

        return "/api";
    },

    setApiBase(value) {
        const safeValue = String(value || "").trim().replace(/\/+$/, "");

        if (!safeValue) {
            localStorage.removeItem("cryptozoo_api_base");
            return;
        }

        localStorage.setItem("cryptozoo_api_base", safeValue);
    },

    getPlayerId() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        if (tgUser && tgUser.id) {
            localStorage.setItem("telegramId", String(tgUser.id));

            if (tgUser.username) {
                localStorage.setItem("telegramUsername", tgUser.username);
            }

            if (tgUser.first_name) {
                localStorage.setItem("telegramFirstName", tgUser.first_name);
            }

            return String(tgUser.id);
        }

        let localId = localStorage.getItem("telegramId");

        if (!localId) {
            localId = "local-player";
            localStorage.setItem("telegramId", localId);
        }

        return localId;
    },

    getUsername() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        if (tgUser) {
            if (tgUser.username) {
                localStorage.setItem("telegramUsername", tgUser.username);
                return tgUser.username;
            }

            const fallbackName =
                [tgUser.first_name, tgUser.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || "Gracz";

            localStorage.setItem("telegramFirstName", fallbackName);
            return fallbackName;
        }

        return (
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramFirstName") ||
            "Gracz"
        );
    },

    getDefaultState() {
        return {
            coins: 0,
            gems: 0,
            rewardBalance: 0,
            rewardWallet: 0,
            withdrawPending: 0,
            level: 1,
            xp: 0,
            coinsPerClick: 1,
            upgradeCost: 50,
            zooIncome: 0,
            expeditionBoost: 0,
            offlineBoost: 1,
            lastLogin: Date.now(),
            lastDailyRewardAt: 0,
            dailyRewardStreak: 0,
            dailyRewardClaimDayKey: "",
            boost2xActiveUntil: 0,
            animals: {
                monkey: { count: 0, level: 1 },
                panda: { count: 0, level: 1 },
                lion: { count: 0, level: 1 },
                tiger: { count: 0, level: 1 },
                elephant: { count: 0, level: 1 },
                giraffe: { count: 0, level: 1 },
                zebra: { count: 0, level: 1 },
                hippo: { count: 0, level: 1 },
                penguin: { count: 0, level: 1 },
                bear: { count: 0, level: 1 },
                crocodile: { count: 0, level: 1 },
                kangaroo: { count: 0, level: 1 },
                wolf: { count: 0, level: 1 }
            },
            boxes: {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            },
            expedition: null,
            minigames: {
                wheelCooldownUntil: 0,
                memoryCooldownUntil: 0,
                extraWheelSpins: 0
            },
            shopPurchases: {}
        };
    },

    normalizeAnimals(rawAnimals) {
        const baseAnimals = this.getDefaultState().animals;
        const result = {};

        Object.keys(baseAnimals).forEach((type) => {
            const raw = rawAnimals && rawAnimals[type] ? rawAnimals[type] : baseAnimals[type];

            result[type] = {
                count: Math.max(0, Number(raw.count) || 0),
                level: Math.max(1, Number(raw.level) || 1)
            };
        });

        return result;
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) {
            return 0;
        }

        if (safeValue < 1000000000000) {
            safeValue *= 1000;
        }

        if (safeValue <= Date.now()) {
            return 0;
        }

        return safeValue;
    },

    normalizeExpedition(rawExpedition) {
        if (!rawExpedition || typeof rawExpedition !== "object") {
            return null;
        }

        return {
            id: rawExpedition.id || "",
            name: rawExpedition.name || "Expedition",
            startTime: Number(rawExpedition.startTime) || Date.now(),
            endTime: Number(rawExpedition.endTime) || 0,
            rewardRarity: rawExpedition.rewardRarity || "common",
            rewardCoins: Math.max(0, Number(rawExpedition.rewardCoins) || 0),
            rewardGems: Math.max(0, Number(rawExpedition.rewardGems) || 0)
        };
    },

    normalizeMinigames(rawMinigames) {
        return {
            wheelCooldownUntil: Math.max(0, Number(rawMinigames?.wheelCooldownUntil) || 0),
            memoryCooldownUntil: Math.max(0, Number(rawMinigames?.memoryCooldownUntil) || 0),
            extraWheelSpins: Math.max(0, Number(rawMinigames?.extraWheelSpins) || 0)
        };
    },

    normalizeShopPurchases(rawShopPurchases) {
        const result = {};
        const source =
            rawShopPurchases && typeof rawShopPurchases === "object"
                ? rawShopPurchases
                : {};

        Object.keys(source).forEach((key) => {
            result[key] = Math.max(0, Number(source[key]) || 0);
        });

        return result;
    },

    recalculateZooIncomeFromAnimals(animals) {
        const configAnimals = CryptoZoo.config?.animals || {};
        const safeAnimals = animals || {};
        let total = 0;

        Object.keys(configAnimals).forEach((type) => {
            const config = configAnimals[type];
            const animal = safeAnimals[type] || { count: 0, level: 1 };

            total +=
                Math.max(0, Number(animal.count) || 0) *
                Math.max(1, Number(animal.level) || 1) *
                Math.max(0, Number(config.baseIncome) || 0);
        });

        return total;
    },

    normalizeState(raw) {
        const base = this.getDefaultState();
        const data = raw || {};
        const animals = this.normalizeAnimals(data.animals || {});
        const boost2xActiveUntil = this.normalizeBoostTimestamp(
            data.boost2xActiveUntil ?? base.boost2xActiveUntil
        );
        const derivedZooIncome = this.recalculateZooIncomeFromAnimals(animals);

        return {
            ...base,
            ...data,
            coins: Math.max(0, Number(data.coins ?? base.coins) || 0),
            gems: Math.max(0, Number(data.gems ?? base.gems) || 0),
            rewardBalance: Number((Math.max(0, Number(data.rewardBalance ?? base.rewardBalance) || 0)).toFixed(3)),
            rewardWallet: Number((Math.max(0, Number(data.rewardWallet ?? base.rewardWallet) || 0)).toFixed(3)),
            withdrawPending: Number((Math.max(0, Number(data.withdrawPending ?? base.withdrawPending) || 0)).toFixed(3)),
            level: Math.max(1, Number(data.level ?? base.level) || 1),
            xp: Math.max(0, Number(data.xp ?? base.xp) || 0),
            coinsPerClick: Math.max(1, Number(data.coinsPerClick ?? base.coinsPerClick) || 1),
            upgradeCost: Math.max(0, Number(data.upgradeCost ?? base.upgradeCost) || 50),
            zooIncome: Math.max(0, Number(data.zooIncome)) || derivedZooIncome,
            expeditionBoost: Math.max(0, Number(data.expeditionBoost ?? base.expeditionBoost) || 0),
            offlineBoost: Math.max(1, Number(data.offlineBoost ?? base.offlineBoost) || 1),
            lastLogin: Number(data.lastLogin ?? base.lastLogin) || Date.now(),
            lastDailyRewardAt: Math.max(0, Number(data.lastDailyRewardAt ?? base.lastDailyRewardAt) || 0),
            dailyRewardStreak: Math.max(0, Number(data.dailyRewardStreak ?? base.dailyRewardStreak) || 0),
            dailyRewardClaimDayKey: String(data.dailyRewardClaimDayKey ?? base.dailyRewardClaimDayKey ?? ""),
            boost2xActiveUntil,
            animals,
            boxes: {
                common: Math.max(0, Number(data.boxes?.common) || 0),
                rare: Math.max(0, Number(data.boxes?.rare) || 0),
                epic: Math.max(0, Number(data.boxes?.epic) || 0),
                legendary: Math.max(0, Number(data.boxes?.legendary) || 0)
            },
            expedition: this.normalizeExpedition(data.expedition),
            minigames: this.normalizeMinigames(data.minigames),
            shopPurchases: this.normalizeShopPurchases(data.shopPurchases)
        };
    },

    normalizeRankingRow(rawRow, index) {
        return {
            rank: Math.max(1, Number(rawRow.rank) || index + 1),
            telegramId: String(rawRow.telegramId || rawRow.playerId || ""),
            username: rawRow.username || rawRow.name || "Gracz",
            coins: Math.max(0, Number(rawRow.coins) || 0),
            level: Math.max(1, Number(rawRow.level) || 1),
            isCurrentPlayer: false
        };
    },

    getSavePayload() {
        const state = this.normalizeState(CryptoZoo.state || {});

        return {
            telegramId: this.getPlayerId(),
            username: this.getUsername(),
            coins: state.coins,
            gems: state.gems,
            rewardBalance: state.rewardBalance,
            rewardWallet: state.rewardWallet,
            withdrawPending: state.withdrawPending,
            level: state.level,
            xp: state.xp,
            coinsPerClick: state.coinsPerClick,
            upgradeCost: state.upgradeCost,
            zooIncome: state.zooIncome,
            expeditionBoost: state.expeditionBoost,
            offlineBoost: state.offlineBoost,
            lastLogin: Date.now(),
            lastDailyRewardAt: state.lastDailyRewardAt,
            dailyRewardStreak: state.dailyRewardStreak,
            dailyRewardClaimDayKey: state.dailyRewardClaimDayKey,
            boost2xActiveUntil: state.boost2xActiveUntil,
            animals: state.animals,
            boxes: state.boxes,
            expedition: state.expedition,
            minigames: state.minigames,
            shopPurchases: state.shopPurchases
        };
    },

    async request(path, options = {}) {
        const apiBase = this.getApiBase();
        const finalUrl = `${apiBase}${path}`;

        const response = await fetch(finalUrl, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status} for ${finalUrl}`;

            try {
                const errorJson = await response.json();
                if (errorJson?.error) {
                    errorMessage = errorJson.error;
                }
            } catch (error) {
                // ignore parse error
            }

            throw new Error(errorMessage);
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return response.json();
        }

        return response.text();
    },

    async loadPlayerFromBackend() {
        const telegramId = this.getPlayerId();

        const result = await this.request(`/player/${encodeURIComponent(telegramId)}`, {
            method: "GET"
        });

        const payload =
            result?.player ||
            result?.data ||
            result ||
            {};

        return this.normalizeState(payload);
    },

    async savePlayerToBackend(payload) {
        const result = await this.request("/player/save", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const payloadFromApi =
            result?.player ||
            result?.data ||
            payload;

        return this.normalizeState(payloadFromApi);
    },

    async loadPlayer() {
        let loaded = null;

        if (this.testResetMode) {
            loaded = this.normalizeState(this.getDefaultState());
            CryptoZoo.state = loaded;

            if (CryptoZoo.gameplay?.recalculateProgress) {
                CryptoZoo.gameplay.recalculateProgress();
            }

            return CryptoZoo.state;
        }

        try {
            loaded = await this.loadPlayerFromBackend();
        } catch (error) {
            console.warn("Backend load failed, fallback to local save:", error);

            const localSave = localStorage.getItem("cryptozoo_save");

            if (localSave) {
                try {
                    loaded = this.normalizeState(JSON.parse(localSave));
                } catch (parseError) {
                    console.error("Local load error:", parseError);
                    loaded = this.normalizeState(CryptoZoo.state);
                }
            } else {
                loaded = this.normalizeState(CryptoZoo.state);
            }
        }

        CryptoZoo.state = loaded;

        if (CryptoZoo.gameplay?.recalculateProgress) {
            CryptoZoo.gameplay.recalculateProgress();
        }

        localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));
        return CryptoZoo.state;
    },

    async savePlayer() {
        const payload = this.getSavePayload();

        if (this.testResetMode) {
            CryptoZoo.state = this.normalizeState(payload);

            if (CryptoZoo.gameplay?.recalculateProgress) {
                CryptoZoo.gameplay.recalculateProgress();
            }

            return CryptoZoo.state;
        }

        try {
            CryptoZoo.state = await this.savePlayerToBackend(payload);
        } catch (error) {
            console.warn("Backend save failed, fallback to local save:", error);
            CryptoZoo.state = this.normalizeState(payload);
        }

        if (CryptoZoo.gameplay?.recalculateProgress) {
            CryptoZoo.gameplay.recalculateProgress();
        }

        localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));
        return CryptoZoo.state;
    },

    async loadRanking() {
        const currentId = this.getPlayerId();

        try {
            const result = await this.request("/ranking?limit=50", {
                method: "GET"
            });

            const rows =
                result?.ranking ||
                result?.players ||
                result?.data ||
                [];

            const safeRows = Array.isArray(rows)
                ? rows.map((row, index) => this.normalizeRankingRow(row, index))
                : [];

            safeRows.forEach((row, index) => {
                row.rank = row.rank || index + 1;
                row.isCurrentPlayer = row.telegramId === currentId;
            });

            localStorage.setItem("cryptozoo_ranking_cache", JSON.stringify(safeRows));

            if (!safeRows.some((row) => row.isCurrentPlayer)) {
                safeRows.push({
                    rank: safeRows.length + 1,
                    telegramId: currentId,
                    username: this.getUsername(),
                    coins: Math.max(0, Number(CryptoZoo.state?.coins) || 0),
                    level: Math.max(1, Number(CryptoZoo.state?.level) || 1),
                    isCurrentPlayer: true
                });
            }

            return safeRows;
        } catch (error) {
            console.warn("Backend ranking failed, fallback to cached/local ranking:", error);

            const cached = localStorage.getItem("cryptozoo_ranking_cache");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length) {
                        return parsed.map((row, index) => ({
                            ...this.normalizeRankingRow(row, index),
                            isCurrentPlayer:
                                String(row.telegramId || row.playerId || "") === currentId
                        }));
                    }
                } catch (parseError) {
                    console.error("Ranking cache parse error:", parseError);
                }
            }

            return [
                {
                    rank: 1,
                    telegramId: currentId,
                    username: this.getUsername(),
                    coins: Math.max(0, Number(CryptoZoo.state?.coins) || 0),
                    level: Math.max(1, Number(CryptoZoo.state?.level) || 1),
                    isCurrentPlayer: true
                }
            ];
        }
    },

    async createWithdrawRequest(amount) {
        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        const result = await this.request("/withdraw/request", {
            method: "POST",
            body: JSON.stringify({
                telegramId: this.getPlayerId(),
                username: this.getUsername(),
                amount: safeAmount
            })
        });

        const playerPayload =
            result?.player ||
            result?.data?.player ||
            null;

        if (playerPayload) {
            CryptoZoo.state = this.normalizeState({
                ...(CryptoZoo.state || {}),
                ...playerPayload
            });

            if (CryptoZoo.gameplay?.recalculateProgress) {
                CryptoZoo.gameplay.recalculateProgress();
            }

            localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));
        }

        return result;
    },

    async loadWithdrawRequests() {
        const telegramId = this.getPlayerId();

        const result = await this.request(`/withdraw/${encodeURIComponent(telegramId)}`, {
            method: "GET"
        });

        return Array.isArray(result?.requests) ? result.requests : [];
    },

    async loadWithdrawHistory() {
        const telegramId = this.getPlayerId();

        try {
            const result = await this.request(`/withdraw/${encodeURIComponent(telegramId)}`, {
                method: "GET"
            });

            const list = result?.requests || result?.history || result?.data || [];
            return Array.isArray(list) ? list : [];
        } catch (error) {
            console.warn("Withdraw history load failed:", error);
            return [];
        }
    }
};
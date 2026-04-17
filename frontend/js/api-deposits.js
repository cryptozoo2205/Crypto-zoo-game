window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    isGithubLikeHost() {
        const host = String(window.location?.hostname || "").toLowerCase();
        return (
            host.includes("github.io") ||
            host === "localhost" ||
            host === "127.0.0.1"
        );
    },

    getTestDepositStorageKey(playerId = "") {
        const safePlayerId = String(playerId || "local-player").trim() || "local-player";
        return `cryptozoo_test_deposits_${safePlayerId}`;
    },

    readTestDeposits(playerId = "") {
        try {
            const key = this.getTestDepositStorageKey(playerId);
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            return this.normalizeDepositsList(parsed);
        } catch (error) {
            console.warn("readTestDeposits failed:", error);
            return [];
        }
    },

    writeTestDeposits(playerId = "", deposits = []) {
        try {
            const key = this.getTestDepositStorageKey(playerId);
            const safeDeposits = this.normalizeDepositsList(deposits);
            localStorage.setItem(key, JSON.stringify(safeDeposits));
            return true;
        } catch (error) {
            console.warn("writeTestDeposits failed:", error);
            return false;
        }
    },

    buildTestDepositId() {
        return `testdep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    buildTestDepositBonusMeta(amount) {
        const safeAmount = Math.max(0, Number(amount) || 0);

        if (safeAmount >= 10) {
            return { gemsAmount: 120, expeditionBoostAmount: 0.30, expeditionBoostDurationMs: 7 * 24 * 60 * 60 * 1000 };
        }

        if (safeAmount >= 5) {
            return { gemsAmount: 60, expeditionBoostAmount: 0.20, expeditionBoostDurationMs: 5 * 24 * 60 * 60 * 1000 };
        }

        if (safeAmount >= 3) {
            return { gemsAmount: 30, expeditionBoostAmount: 0.10, expeditionBoostDurationMs: 3 * 24 * 60 * 60 * 1000 };
        }

        return { gemsAmount: 10, expeditionBoostAmount: 0.05, expeditionBoostDurationMs: 1 * 24 * 60 * 60 * 1000 };
    },

    async createTestDepositWithPayment(amount) {
        const telegramUser = await this.getTelegramUser();
        const telegramId = String(telegramUser?.id || "local-player").trim() || "local-player";
        const username = String(
            telegramUser?.username ||
            telegramUser?.first_name ||
            CryptoZoo.state?.telegramUser?.username ||
            CryptoZoo.state?.telegramUser?.first_name ||
            "Gracz"
        );

        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));
        if (safeAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

        const now = Date.now();
        const depositId = this.buildTestDepositId();
        const bonusMeta = this.buildTestDepositBonusMeta(safeAmount);

        const deposit = this.normalizeDepositItem({
            id: depositId,
            depositId,
            telegramId,
            username,
            amount: safeAmount,
            gemsAmount: bonusMeta.gemsAmount,
            expeditionBoostAmount: bonusMeta.expeditionBoostAmount,
            expeditionBoostDurationMs: bonusMeta.expeditionBoostDurationMs,
            walletAddress: "UQTESTDEPOSITWALLET1234567890CRYPT0Z00",
            paymentComment: "",
            source: "ton-test",
            asset: "TON",
            currency: "TON",
            network: "TON",
            status: "created",
            createdAt: now,
            updatedAt: now,
            expiresAt: now + 30 * 60 * 1000
        });

        const allDeposits = this.readTestDeposits(telegramId);
        const merged = this.mergeDeposits([deposit], allDeposits);
        this.writeTestDeposits(telegramId, merged);

        const currentState = this.normalizeState(CryptoZoo.state || {});
        currentState.deposits = this.mergeDeposits([deposit], currentState.deposits);
        currentState.depositHistory = this.mergeDeposits([deposit], currentState.depositHistory);
        currentState.updatedAt = now;

        CryptoZoo.state = this.normalizeState(currentState);
        CryptoZoo.state.telegramUser = telegramUser;
        this.writeLocalState(CryptoZoo.state, telegramId);

        return {
            ok: true,
            deposit,
            payment: {
                depositId,
                receiverAddress: deposit.walletAddress,
                amount: safeAmount,
                gemsAmount: bonusMeta.gemsAmount,
                expeditionBoostAmount: bonusMeta.expeditionBoostAmount,
                expeditionBoostDurationMs: bonusMeta.expeditionBoostDurationMs,
                network: "TON",
                source: "ton-test"
            },
            testMode: true
        };
    },

    async verifyTestDepositById(depositId) {
        const safeDepositId = String(depositId || "").trim();
        if (!safeDepositId) {
            throw new Error("Missing depositId");
        }

        const telegramUser = await this.getTelegramUser();
        const telegramId = String(telegramUser?.id || "local-player").trim() || "local-player";

        const deposits = this.readTestDeposits(telegramId);
        const target = deposits.find((item) => String(item.depositId || item.id || "").trim() === safeDepositId);

        if (!target) {
            throw new Error("Deposit not found");
        }

        const now = Date.now();
        const status = String(target.status || "").toLowerCase();

        if (status === "approved") {
            return {
                ok: true,
                alreadyProcessed: true,
                matched: true,
                deposit: target,
                player: CryptoZoo.state || {}
            };
        }

        if (target.expiresAt && Number(target.expiresAt) > 0 && Number(target.expiresAt) < now) {
            const expiredDeposit = this.normalizeDepositItem({
                ...target,
                status: "expired",
                updatedAt: now
            });

            const updatedDeposits = this.mergeDeposits(
                deposits.map((item) => {
                    const itemId = String(item.depositId || item.id || "").trim();
                    return itemId === safeDepositId ? expiredDeposit : item;
                }),
                []
            );

            this.writeTestDeposits(telegramId, updatedDeposits);

            const currentState = this.normalizeState(CryptoZoo.state || {});
            currentState.deposits = this.mergeDeposits(updatedDeposits, currentState.deposits);
            currentState.depositHistory = this.mergeDeposits(updatedDeposits, currentState.depositHistory);
            currentState.updatedAt = now;

            CryptoZoo.state = this.normalizeState(currentState);
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramId);

            return {
                ok: true,
                expired: true,
                matched: false,
                deposit: expiredDeposit,
                player: CryptoZoo.state
            };
        }

        const approvedDeposit = this.normalizeDepositItem({
            ...target,
            status: "approved",
            approvedAt: now,
            updatedAt: now
        });

        const updatedDeposits = this.mergeDeposits(
            deposits.map((item) => {
                const itemId = String(item.depositId || item.id || "").trim();
                return itemId === safeDepositId ? approvedDeposit : item;
            }),
            []
        );

        this.writeTestDeposits(telegramId, updatedDeposits);

        const currentState = this.normalizeState(CryptoZoo.state || {});
        currentState.gems = Math.max(0, Number(currentState.gems || 0)) + Math.max(0, Number(approvedDeposit.gemsAmount || 0));
        currentState.expeditionBoost = Math.max(
            Number(currentState.expeditionBoost || 0),
            Number(approvedDeposit.expeditionBoostAmount || 0)
        );
        currentState.deposits = this.mergeDeposits(updatedDeposits, currentState.deposits);
        currentState.depositHistory = this.mergeDeposits(updatedDeposits, currentState.depositHistory);
        currentState.updatedAt = now;

        CryptoZoo.state = this.normalizeState(currentState);
        CryptoZoo.state.telegramUser = telegramUser;
        this.writeLocalState(CryptoZoo.state, telegramId);

        return {
            ok: true,
            matched: true,
            deposit: approvedDeposit,
            player: CryptoZoo.state
        };
    },

    async verifyTestPendingDepositsForPlayer() {
        const telegramUser = await this.getTelegramUser();
        const telegramId = String(telegramUser?.id || "local-player").trim() || "local-player";
        const deposits = this.readTestDeposits(telegramId);

        const pending = deposits.find((item) => {
            const status = String(item.status || "").toLowerCase();
            return status === "created" || status === "pending";
        });

        if (!pending) {
            return {
                ok: true,
                matched: false,
                player: CryptoZoo.state || {}
            };
        }

        return this.verifyTestDepositById(pending.depositId || pending.id);
    },

    async getTestPlayerDeposits() {
        const telegramUser = await this.getTelegramUser();
        const telegramId = String(telegramUser?.id || "local-player").trim() || "local-player";
        const deposits = this.readTestDeposits(telegramId);

        return {
            ok: true,
            deposits
        };
    },

    async createDepositWithPayment(amount) {
        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        if (safeAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

        try {
            await this.ensurePlayerPersistedOnBackend();

            const response = await this.request("/deposit/create", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: await this.getPlayerId(),
                    username: await this.getUsername(),
                    amount: safeAmount,
                    source: "ton"
                }),
                timeoutMs: 5000,
                retryCount: 1
            });

            const createdDeposit = this.normalizeDepositItem(response?.deposit || {});
            const currentState = this.normalizeState(CryptoZoo.state || {});

            if (createdDeposit.id) {
                currentState.deposits = this.mergeDeposits(
                    [createdDeposit],
                    currentState.deposits
                );

                const historyEntry = {
                    ...createdDeposit,
                    depositId: createdDeposit.depositId || createdDeposit.id
                };

                currentState.depositHistory = this.mergeDeposits(
                    [historyEntry],
                    currentState.depositHistory
                );

                currentState.updatedAt = Date.now();
                CryptoZoo.state = this.normalizeState(currentState);

                const telegramUser = await this.getTelegramUser();
                CryptoZoo.state.telegramUser = telegramUser;
                this.writeLocalState(CryptoZoo.state, telegramUser.id);
            }

            return response;
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                throw error;
            }

            console.warn("createDepositWithPayment backend failed on GitHub/local, using test fallback:", error);
            return this.createTestDepositWithPayment(safeAmount);
        }
    },

    async verifyDepositById(depositId) {
        const safeDepositId = String(depositId || "").trim();

        if (!safeDepositId) {
            throw new Error("Missing depositId");
        }

        try {
            const response = await this.request("/deposit/verify", {
                method: "POST",
                body: JSON.stringify({
                    depositId: safeDepositId
                }),
                timeoutMs: 12000,
                retryCount: 1
            });

            return this.syncPlayerFromResponse(response);
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                throw error;
            }

            console.warn("verifyDepositById backend failed on GitHub/local, using test fallback:", error);
            return this.verifyTestDepositById(safeDepositId);
        }
    },

    async verifyPendingDepositsForPlayer() {
        try {
            await this.ensurePlayerPersistedOnBackend();

            const response = await this.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: await this.getPlayerId()
                }),
                timeoutMs: 12000,
                retryCount: 1
            });

            return this.syncPlayerFromResponse(response);
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                throw error;
            }

            console.warn("verifyPendingDepositsForPlayer backend failed on GitHub/local, using test fallback:", error);
            return this.verifyTestPendingDepositsForPlayer();
        }
    },

    async getPlayerDeposits() {
        try {
            await this.ensurePlayerPersistedOnBackend();

            return this.request(`/deposit/${await this.getPlayerId()}`, {
                method: "GET",
                timeoutMs: 5000,
                retryCount: 1
            });
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                throw error;
            }

            console.warn("getPlayerDeposits backend failed on GitHub/local, using test fallback:", error);
            return this.getTestPlayerDeposits();
        }
    },

    async loadDepositsHistory() {
        const response = await this.getPlayerDeposits();
        const deposits = this.normalizeDepositsList(response?.deposits);

        if (deposits.length) {
            const currentState = this.normalizeState(CryptoZoo.state || {});
            currentState.deposits = this.mergeDeposits(
                deposits,
                currentState.deposits
            );
            currentState.depositHistory = this.mergeDeposits(
                deposits,
                currentState.depositHistory
            );
            currentState.updatedAt = Date.now();
            CryptoZoo.state = this.normalizeState(currentState);

            const telegramUser = await this.getTelegramUser();
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);
        }

        return deposits;
    },

    async syncPendingDeposits(forceReload = false) {
        if (this.testResetMode) {
            const telegramUser = await this.getTelegramUser();
            return this.normalizeState(
                CryptoZoo.state ||
                this.readLocalState(telegramUser.id) ||
                this.getDefaultState(telegramUser)
            );
        }

        try {
            await this.ensurePlayerPersistedOnBackend();

            const response = await this.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: await this.getPlayerId()
                }),
                timeoutMs: 3000,
                retryCount: 1
            });

            const playerPart = this.unwrapPlayerResponse(response);

            if (playerPart && typeof playerPart === "object") {
                await this.syncPlayerFromResponse(response);
            }

            const depositsResponse = await this.getPlayerDeposits();
            const deposits = this.normalizeDepositsList(depositsResponse?.deposits);

            const currentState = this.normalizeState(CryptoZoo.state || {});
            currentState.deposits = this.mergeDeposits(
                deposits,
                currentState.deposits
            );
            currentState.depositHistory = this.mergeDeposits(
                deposits,
                currentState.depositHistory
            );

            CryptoZoo.state = this.normalizeState(currentState);

            const telegramUser = await this.getTelegramUser();
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);

            if (forceReload) {
                await this.loadPlayer();
            }

            return CryptoZoo.state;
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                console.warn("Deposit sync failed", error);

                const telegramUser = await this.getTelegramUser();
                return this.normalizeState(
                    CryptoZoo.state ||
                    this.readLocalState(telegramUser.id) ||
                    this.getDefaultState(telegramUser)
                );
            }

            console.warn("syncPendingDeposits backend failed on GitHub/local, using test fallback:", error);

            const depositsResponse = await this.getTestPlayerDeposits();
            const deposits = this.normalizeDepositsList(depositsResponse?.deposits);

            const telegramUser = await this.getTelegramUser();
            const currentState = this.normalizeState(
                CryptoZoo.state ||
                this.readLocalState(telegramUser.id) ||
                this.getDefaultState(telegramUser)
            );

            currentState.deposits = this.mergeDeposits(
                deposits,
                currentState.deposits
            );
            currentState.depositHistory = this.mergeDeposits(
                deposits,
                currentState.depositHistory
            );
            currentState.updatedAt = Date.now();

            CryptoZoo.state = this.normalizeState(currentState);
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);

            return CryptoZoo.state;
        }
    }
});
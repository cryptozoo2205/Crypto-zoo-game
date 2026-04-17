window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async createDepositWithPayment(amount) {
        await this.ensurePlayerPersistedOnBackend();

        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        if (safeAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

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
    },

    async verifyDepositById(depositId) {
        const safeDepositId = String(depositId || "").trim();

        if (!safeDepositId) {
            throw new Error("Missing depositId");
        }

        const response = await this.request("/deposit/verify", {
            method: "POST",
            body: JSON.stringify({
                depositId: safeDepositId
            }),
            timeoutMs: 12000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async verifyPendingDepositsForPlayer() {
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
    },

    async getPlayerDeposits() {
        await this.ensurePlayerPersistedOnBackend();

        return this.request(`/deposit/${await this.getPlayerId()}`, {
            method: "GET",
            timeoutMs: 5000,
            retryCount: 1
        });
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
            console.warn("Deposit sync failed", error);

            const telegramUser = await this.getTelegramUser();
            return this.normalizeState(
                CryptoZoo.state ||
                this.readLocalState(telegramUser.id) ||
                this.getDefaultState(telegramUser)
            );
        }
    }
});
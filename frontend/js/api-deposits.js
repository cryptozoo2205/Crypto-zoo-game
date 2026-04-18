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

    roundDepositTon(value, digits = 3) {
        return Number((Number(value) || 0).toFixed(digits));
    },

    randomUniqueFraction() {
        const value = Math.floor(Math.random() * 899) + 101;
        return this.roundDepositTon(value / 1000, 3);
    },

    buildExpectedDepositAmount(baseAmount, uniqueFraction) {
        return this.roundDepositTon(
            this.roundDepositTon(baseAmount, 3) + this.roundDepositTon(uniqueFraction, 3),
            3
        );
    },

    normalizeDepositAmounts(raw = {}) {
        const payment = raw && typeof raw.payment === "object" ? raw.payment : {};
        const deposit = raw && typeof raw.deposit === "object" ? raw.deposit : {};

        const baseAmount = this.roundDepositTon(
            raw.baseAmount ??
            deposit.baseAmount ??
            payment.baseAmount ??
            raw.requestedAmount ??
            deposit.requestedAmount ??
            payment.requestedAmount ??
            raw.amount ??
            deposit.amount ??
            payment.amount ??
            raw.tonAmount ??
            deposit.tonAmount ??
            payment.tonAmount ??
            0,
            3
        );

        let uniqueFraction = raw.uniqueFraction ??
            deposit.uniqueFraction ??
            payment.uniqueFraction;

        if (uniqueFraction === undefined || uniqueFraction === null || uniqueFraction === "") {
            const maybeExpectedAmount = this.roundDepositTon(
                raw.expectedAmount ??
                deposit.expectedAmount ??
                payment.expectedAmount ??
                raw.amount ??
                deposit.amount ??
                payment.amount ??
                raw.tonAmount ??
                deposit.tonAmount ??
                payment.tonAmount ??
                baseAmount,
                3
            );

            uniqueFraction = this.roundDepositTon(maybeExpectedAmount - baseAmount, 3);
        }

        uniqueFraction = this.roundDepositTon(uniqueFraction, 3);
        if (uniqueFraction < 0) uniqueFraction = 0;

        const expectedAmount = this.roundDepositTon(
            raw.expectedAmount ??
            deposit.expectedAmount ??
            payment.expectedAmount ??
            this.buildExpectedDepositAmount(baseAmount, uniqueFraction),
            3
        );

        return {
            baseAmount,
            expectedAmount,
            uniqueFraction
        };
    },

    normalizeDepositItem(raw = {}) {
        const normalizedBase = typeof this.normalizeDepositItemBase === "function"
            ? this.normalizeDepositItemBase(raw)
            : { ...(raw || {}) };

        const amounts = this.normalizeDepositAmounts({
            ...raw,
            ...normalizedBase
        });

        const payment = raw && typeof raw.payment === "object" ? raw.payment : {};
        const deposit = raw && typeof raw.deposit === "object" ? raw.deposit : {};

        const normalized = {
            ...normalizedBase,
            ...raw,
            amount: amounts.expectedAmount,
            tonAmount: amounts.expectedAmount,
            baseAmount: amounts.baseAmount,
            expectedAmount: amounts.expectedAmount,
            uniqueFraction: amounts.uniqueFraction,
            paymentComment: "",
            comment: "",
            memo: "",
            payment: {
                ...payment,
                amount: amounts.expectedAmount,
                tonAmount: amounts.expectedAmount,
                baseAmount: amounts.baseAmount,
                expectedAmount: amounts.expectedAmount,
                uniqueFraction: amounts.uniqueFraction,
                comment: "",
                memo: "",
                receiverAddress: payment.receiverAddress || payment.address || raw.receiverAddress || raw.walletAddress || "",
                address: payment.address || payment.receiverAddress || raw.walletAddress || raw.receiverAddress || "",
                walletAddress: payment.walletAddress || payment.receiverAddress || payment.address || raw.walletAddress || raw.receiverAddress || ""
            },
            deposit: {
                ...deposit,
                id: deposit.id || raw.depositId || raw.id || "",
                depositId: deposit.depositId || raw.depositId || raw.id || "",
                amount: amounts.expectedAmount,
                tonAmount: amounts.expectedAmount,
                baseAmount: amounts.baseAmount,
                expectedAmount: amounts.expectedAmount,
                uniqueFraction: amounts.uniqueFraction,
                walletAddress: deposit.walletAddress || raw.walletAddress || "",
                receiverAddress: deposit.receiverAddress || raw.receiverAddress || raw.walletAddress || ""
            }
        };

        if (!normalized.depositId && normalized.id) {
            normalized.depositId = normalized.id;
        }

        if (!normalized.id && normalized.depositId) {
            normalized.id = normalized.depositId;
        }

        if (!normalized.walletAddress) {
            normalized.walletAddress =
                normalized.payment?.walletAddress ||
                normalized.payment?.receiverAddress ||
                normalized.payment?.address ||
                normalized.deposit?.walletAddress ||
                normalized.deposit?.receiverAddress ||
                "";
        }

        normalized.receiverAddress =
            normalized.receiverAddress ||
            normalized.payment?.receiverAddress ||
            normalized.payment?.address ||
            normalized.walletAddress ||
            "";

        return normalized;
    },

    normalizeDepositsList(list) {
        if (!Array.isArray(list)) return [];
        return list
            .map((item) => this.normalizeDepositItem(item || {}))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    },

    mergeDeposits(primary = [], secondary = []) {
        const mergedMap = new Map();
        const all = [
            ...(Array.isArray(secondary) ? secondary : []),
            ...(Array.isArray(primary) ? primary : [])
        ];

        for (const entry of all) {
            const normalized = this.normalizeDepositItem(entry || {});
            const key = String(normalized.depositId || normalized.id || "").trim();
            if (!key) continue;
            mergedMap.set(key, normalized);
        }

        return Array.from(mergedMap.values()).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    },

    unwrapDepositResponse(response) {
        if (!response || typeof response !== "object") return {};
        return response.deposit || response.data?.deposit || response.data || response;
    },

    buildDepositPaymentResponse(deposit) {
        const normalized = this.normalizeDepositItem(deposit || {});
        return {
            ok: true,
            deposit: normalized,
            payment: {
                depositId: normalized.depositId || normalized.id,
                receiverAddress: normalized.receiverAddress || normalized.walletAddress || "",
                address: normalized.receiverAddress || normalized.walletAddress || "",
                walletAddress: normalized.walletAddress || normalized.receiverAddress || "",
                amount: normalized.expectedAmount,
                tonAmount: normalized.expectedAmount,
                baseAmount: normalized.baseAmount,
                expectedAmount: normalized.expectedAmount,
                uniqueFraction: normalized.uniqueFraction,
                gemsAmount: Math.max(0, Number(normalized.gemsAmount || 0)),
                expeditionBoostAmount: Math.max(0, Number(normalized.expeditionBoostAmount || 0)),
                expeditionBoostDurationMs: Math.max(0, Number(normalized.expeditionBoostDurationMs || 0)),
                network: normalized.network || "TON",
                source: normalized.source || "ton",
                comment: "",
                memo: ""
            }
        };
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

        const safeBaseAmount = this.roundDepositTon(Math.max(0, Number(amount) || 0), 3);
        if (safeBaseAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

        const now = Date.now();
        const depositId = this.buildTestDepositId();
        const bonusMeta = this.buildTestDepositBonusMeta(safeBaseAmount);
        const uniqueFraction = this.randomUniqueFraction();
        const expectedAmount = this.buildExpectedDepositAmount(safeBaseAmount, uniqueFraction);

        const deposit = this.normalizeDepositItem({
            id: depositId,
            depositId,
            telegramId,
            username,
            amount: expectedAmount,
            tonAmount: expectedAmount,
            baseAmount: safeBaseAmount,
            expectedAmount,
            uniqueFraction,
            gemsAmount: bonusMeta.gemsAmount,
            expeditionBoostAmount: bonusMeta.expeditionBoostAmount,
            expeditionBoostDurationMs: bonusMeta.expeditionBoostDurationMs,
            walletAddress: "UQTESTDEPOSITWALLET1234567890CRYPT0Z00",
            paymentComment: "",
            comment: "",
            memo: "",
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
            ...this.buildDepositPaymentResponse(deposit),
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
            const approvedDeposit = this.normalizeDepositItem(target);

            const approvedGemsAmount = Math.max(
                0,
                Number(
                    approvedDeposit.gemsAmount ??
                    approvedDeposit.payment?.gemsAmount ??
                    approvedDeposit.deposit?.gemsAmount ??
                    0
                ) || 0
            );

            const approvedExpeditionBoostAmount = Math.max(
                0,
                Number(
                    approvedDeposit.expeditionBoostAmount ??
                    approvedDeposit.payment?.expeditionBoostAmount ??
                    approvedDeposit.deposit?.expeditionBoostAmount ??
                    0
                ) || 0
            );

            const approvedExpeditionBoostDurationMs = Math.max(
                0,
                Number(
                    approvedDeposit.expeditionBoostDurationMs ??
                    approvedDeposit.payment?.expeditionBoostDurationMs ??
                    approvedDeposit.deposit?.expeditionBoostDurationMs ??
                    0
                ) || 0
            );

            const approvedAtBase = Math.max(
                0,
                Number(approvedDeposit.approvedAt || approvedDeposit.updatedAt || approvedDeposit.createdAt || 0)
            );

            const currentState = this.normalizeState(CryptoZoo.state || {});
            currentState.gems = Math.max(
                Number(currentState.gems || 0),
                approvedGemsAmount
            );
            currentState.expeditionBoost = Math.max(
                Number(currentState.expeditionBoost || 0),
                approvedExpeditionBoostAmount
            );

            if (approvedExpeditionBoostAmount > 0 && approvedExpeditionBoostDurationMs > 0) {
                currentState.expeditionBoostActiveUntil = Math.max(
                    Number(currentState.expeditionBoostActiveUntil || 0),
                    approvedAtBase + approvedExpeditionBoostDurationMs
                );
            }

            currentState.deposits = this.mergeDeposits([approvedDeposit], currentState.deposits);
            currentState.depositHistory = this.mergeDeposits([approvedDeposit], currentState.depositHistory);
            currentState.updatedAt = Date.now();

            CryptoZoo.state = this.normalizeState(currentState);
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramId);

            return {
                ok: true,
                alreadyProcessed: true,
                matched: true,
                deposit: approvedDeposit,
                player: CryptoZoo.state
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

        const approvedGemsAmount = Math.max(
            0,
            Number(
                approvedDeposit.gemsAmount ??
                approvedDeposit.payment?.gemsAmount ??
                approvedDeposit.deposit?.gemsAmount ??
                0
            ) || 0
        );

        const approvedExpeditionBoostAmount = Math.max(
            0,
            Number(
                approvedDeposit.expeditionBoostAmount ??
                approvedDeposit.payment?.expeditionBoostAmount ??
                approvedDeposit.deposit?.expeditionBoostAmount ??
                0
            ) || 0
        );

        const approvedExpeditionBoostDurationMs = Math.max(
            0,
            Number(
                approvedDeposit.expeditionBoostDurationMs ??
                approvedDeposit.payment?.expeditionBoostDurationMs ??
                approvedDeposit.deposit?.expeditionBoostDurationMs ??
                0
            ) || 0
        );

        const approvedAtBase = Math.max(
            0,
            Number(approvedDeposit.approvedAt || approvedDeposit.updatedAt || approvedDeposit.createdAt || now)
        );

        const currentState = this.normalizeState(CryptoZoo.state || {});
        currentState.gems = Math.max(0, Number(currentState.gems || 0)) + approvedGemsAmount;
        currentState.expeditionBoost = Math.max(
            0,
            Math.max(
                Number(currentState.expeditionBoost || 0),
                approvedExpeditionBoostAmount
            )
        );

        if (approvedExpeditionBoostAmount > 0 && approvedExpeditionBoostDurationMs > 0) {
            currentState.expeditionBoostActiveUntil = Math.max(
                Number(currentState.expeditionBoostActiveUntil || 0),
                approvedAtBase + approvedExpeditionBoostDurationMs
            );
        }

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
        const safeBaseAmount = this.roundDepositTon(Math.max(0, Number(amount) || 0), 3);

        if (safeBaseAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

        try {
            await this.ensurePlayerPersistedOnBackend();

            const response = await this.request("/deposit/create", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: await this.getPlayerId(),
                    username: await this.getUsername(),
                    amount: safeBaseAmount,
                    baseAmount: safeBaseAmount,
                    source: "ton"
                }),
                timeoutMs: 5000,
                retryCount: 1
            });

            const createdDeposit = this.normalizeDepositItem(this.unwrapDepositResponse(response));
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

            return {
                ...response,
                ...this.buildDepositPaymentResponse(createdDeposit)
            };
        } catch (error) {
            if (!this.isGithubLikeHost()) {
                throw error;
            }

            console.warn("createDepositWithPayment backend failed on GitHub/local, using test fallback:", error);
            return this.createTestDepositWithPayment(safeBaseAmount);
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

            const synced = await this.syncPlayerFromResponse(response);

            if (response && typeof response === "object") {
                const normalizedDeposit = this.normalizeDepositItem(this.unwrapDepositResponse(response));

                if (normalizedDeposit.id) {
                    const currentState = this.normalizeState(CryptoZoo.state || {});
                    currentState.deposits = this.mergeDeposits([normalizedDeposit], currentState.deposits);
                    currentState.depositHistory = this.mergeDeposits([normalizedDeposit], currentState.depositHistory);
                    currentState.updatedAt = Date.now();

                    CryptoZoo.state = this.normalizeState(currentState);

                    const telegramUser = await this.getTelegramUser();
                    CryptoZoo.state.telegramUser = telegramUser;
                    this.writeLocalState(CryptoZoo.state, telegramUser.id);
                }
            }

            return synced;
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

            const response = await this.request(`/deposit/${await this.getPlayerId()}`, {
                method: "GET",
                timeoutMs: 5000,
                retryCount: 1
            });

            const deposits = this.normalizeDepositsList(response?.deposits || response?.data?.deposits || []);
            return {
                ...response,
                deposits
            };
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
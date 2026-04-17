window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async setWithdrawWallet(tonAddress) {
        await this.ensurePlayerPersistedOnBackend();

        const safeAddress = String(tonAddress || "").trim();

        if (!safeAddress) {
            throw new Error("Missing TON wallet address");
        }

        const response = await this.request("/withdraw/set-wallet", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                tonAddress: safeAddress
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async getWithdrawWallet() {
        await this.ensurePlayerPersistedOnBackend();

        return this.request(`/withdraw/wallet/${await this.getPlayerId()}`, {
            method: "GET",
            timeoutMs: 5000,
            retryCount: 1
        });
    },

    async createWithdrawRequest(amount) {
        await this.ensurePlayerPersistedOnBackend();

        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        if (safeAmount <= 0) {
            throw new Error("Invalid withdraw amount");
        }

        const response = await this.request("/withdraw/request", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                amount: safeAmount
            }),
            timeoutMs: 8000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async loadWithdrawHistory() {
        await this.ensurePlayerPersistedOnBackend();

        const response = await this.request(`/withdraw/${await this.getPlayerId()}`, {
            method: "GET",
            timeoutMs: 5000,
            retryCount: 1
        });

        return Array.isArray(response?.requests) ? response.requests : [];
    }
});
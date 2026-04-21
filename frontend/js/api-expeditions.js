window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async expeditionStart(expeditionId) {
        const response = await this.request("/expedition/start", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                expeditionId
            }),
            timeoutMs: 4000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async expeditionCollect() {
        const response = await this.request("/expedition/collect", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername()
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async expeditionUseTimeReduction(seconds = 0) {
        const response = await this.request("/expedition/time-boost", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                seconds: Math.max(0, Number(seconds) || 0)
            }),
            timeoutMs: 4000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    }
});
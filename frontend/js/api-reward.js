window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async transferRewardToWallet() {
        await this.ensurePlayerPersistedOnBackend();

        const response = await this.request("/reward/transfer-to-wallet", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername()
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    }
});
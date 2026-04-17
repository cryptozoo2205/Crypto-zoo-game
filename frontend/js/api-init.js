window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async init() {
        if (this.initialized) {
            this.bindLifecycleSave();
            return CryptoZoo.state;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                await this.loadPlayer();

                if (!this.testResetMode) {
                    this.syncPendingDeposits(false).catch((error) => {
                        console.warn("Background deposit sync failed:", error);
                    });
                }
            } catch (error) {
                console.error("API init load failed:", error);

                const telegramUser = await this.getTelegramUser();
                const localState = this.readLocalState(telegramUser.id);

                CryptoZoo.state = this.normalizeState(
                    localState ||
                    CryptoZoo.state ||
                    this.getDefaultState(telegramUser)
                );

                CryptoZoo.state.telegramUser = telegramUser;
                CryptoZoo.state.updatedAt = Date.now();

                this.writeLocalState(CryptoZoo.state, telegramUser.id);

                try {
                    const payload = await this.getSavePayload();

                    this.lastSavedSnapshot =
                        this.getSaveFingerprintFromPayload(payload);

                    this.pendingDirty = false;
                } catch (snapshotError) {
                    console.warn(
                        "Snapshot init after fallback failed:",
                        snapshotError
                    );
                }
            }

            this.bindLifecycleSave();
            this.initialized = true;

            return CryptoZoo.state;
        })();

        try {
            return await this.initPromise;
        } finally {
            this.initPromise = null;
        }
    }
});
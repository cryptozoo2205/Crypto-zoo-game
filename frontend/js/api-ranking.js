window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async loadRanking(limit = 50) {
        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));

        let telegramId = "";

        try {
            telegramId = await this.getPlayerId();
        } catch (error) {
            telegramId = String(
                CryptoZoo.state?.telegramUser?.id ||
                CryptoZoo.state?.telegramId ||
                ""
            ).trim();
        }

        const query = new URLSearchParams({
            limit: String(safeLimit)
        });

        if (telegramId) {
            query.set("telegramId", telegramId);
        }

        try {
            const response = await this.request(`/ranking?${query.toString()}`, {
                method: "GET",
                timeoutMs: 5000,
                retryCount: 1
            });

            if (Array.isArray(response?.ranking)) {
                return response.ranking;
            }

            return [];
        } catch (error) {
            console.warn("loadRanking failed:", error);

            if (
                String(window.location?.hostname || "").includes("github.io") ||
                window.location?.hostname === "localhost" ||
                window.location?.hostname === "127.0.0.1"
            ) {
                const currentId = String(
                    telegramId ||
                    CryptoZoo.state?.telegramUser?.id ||
                    ""
                ).trim();

                const fallbackRow = {
                    rank: 1,
                    telegramId: currentId || "local-player",
                    username: String(
                        CryptoZoo.state?.telegramUser?.username ||
                        CryptoZoo.state?.telegramUser?.first_name ||
                        "Gracz"
                    ),
                    coins: Number(CryptoZoo.state?.coins) || 0,
                    level: Number(CryptoZoo.state?.level) || 1,
                    isCurrentPlayer: true
                };

                return [fallbackRow];
            }

            throw error;
        }
    }
});
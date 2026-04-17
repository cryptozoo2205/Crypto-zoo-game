window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    async loadRanking(type = "overall", limit = 50) {
        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
        const safeType = ["overall", "ref", "daily", "weekly"].includes(String(type || "").toLowerCase())
            ? String(type).toLowerCase()
            : "overall";

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
            limit: String(safeLimit),
            type: safeType
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
                return {
                    type: response?.type || safeType,
                    rows: response.ranking
                };
            }

            return {
                type: safeType,
                rows: []
            };
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

                const state = CryptoZoo.state || {};

                const fallbackMetricValue =
                    safeType === "ref"
                        ? Number(state.referralsCount) || 0
                        : safeType === "daily"
                            ? Number(state.dailyCoins || state.stats?.dailyCoins || 0)
                            : safeType === "weekly"
                                ? Number(state.weeklyCoins || state.stats?.weeklyCoins || 0)
                                : Number(state.coins) || 0;

                return {
                    type: safeType,
                    rows: [
                        {
                            rank: 1,
                            telegramId: currentId || "local-player",
                            username: String(
                                state.telegramUser?.username ||
                                state.telegramUser?.first_name ||
                                "Gracz"
                            ),
                            coins: Number(state.coins) || 0,
                            level: Number(state.level) || 1,
                            referralsCount: Number(state.referralsCount) || 0,
                            dailyValue: Number(state.dailyCoins || state.stats?.dailyCoins || 0),
                            weeklyValue: Number(state.weeklyCoins || state.stats?.weeklyCoins || 0),
                            metricType: safeType,
                            metricValue: fallbackMetricValue,
                            isCurrentPlayer: true
                        }
                    ]
                };
            }

            throw error;
        }
    }
});
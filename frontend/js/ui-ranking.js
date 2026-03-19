window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiRanking = {
    renderRankingRows(rows) {
        const rankingList = document.getElementById("rankingList");
        if (!rankingList) return;

        const safeRanking = Array.isArray(rows) ? rows : [];

        if (!safeRanking.length) {
            rankingList.innerHTML = "<li>Brak danych rankingu</li>";
            return;
        }

        rankingList.innerHTML = safeRanking.map((row, index) => {
            const rank = Number(row.rank) || index + 1;
            const username = row.username || row.name || "Gracz";
            const coins = CryptoZoo.formatNumber(row.coins || 0);
            const level = CryptoZoo.formatNumber(row.level || 1);
            const currentClass = row.isCurrentPlayer ? " ranking-me" : "";
            const badge =
                rank === 1 ? "🥇" :
                rank === 2 ? "🥈" :
                rank === 3 ? "🥉" :
                `#${rank}`;

            return `
                <li class="ranking-row${currentClass}">
                    <div class="ranking-left">
                        <div class="ranking-badge">${badge}</div>
                        <div class="ranking-meta">
                            <div class="ranking-name">${username}${row.isCurrentPlayer ? ' <span class="me-badge">TY</span>' : ""}</div>
                            <div class="ranking-sub">Lvl ${level}</div>
                        </div>
                    </div>
                    <div class="ranking-score">${coins}</div>
                </li>
            `;
        }).join("");
    },

    async renderRanking(forceRefresh = false) {
        const ui = CryptoZoo.ui || {};
        const rankingList = document.getElementById("rankingList");
        if (!rankingList) return;

        const now = Date.now();
        const cacheFresh =
            ui.rankingCache &&
            (now - (ui.rankingLastFetchAt || 0)) < (ui.rankingCacheTtl || 15000);

        if (!forceRefresh && cacheFresh) {
            this.renderRankingRows(ui.rankingCache);
            return;
        }

        if (ui.rankingLoading) {
            if (ui.rankingCache) {
                this.renderRankingRows(ui.rankingCache);
            }
            return;
        }

        ui.rankingLoading = true;

        if (!ui.rankingCache) {
            rankingList.innerHTML = "<li>Ładowanie rankingu...</li>";
        }

        try {
            const ranking = await CryptoZoo.api?.loadRanking?.();
            const safeRanking = Array.isArray(ranking) ? ranking : [];

            ui.rankingCache = safeRanking;
            ui.rankingLastFetchAt = Date.now();

            this.renderRankingRows(safeRanking);
        } catch (error) {
            console.error("Ranking render error:", error);

            if (ui.rankingCache) {
                this.renderRankingRows(ui.rankingCache);
            } else {
                rankingList.innerHTML = "<li>Błąd ładowania rankingu</li>";
            }
        } finally {
            ui.rankingLoading = false;
        }
    },

    invalidateRankingCache() {
        const ui = CryptoZoo.ui || {};
        ui.rankingCache = null;
        ui.rankingLastFetchAt = 0;
    }
};
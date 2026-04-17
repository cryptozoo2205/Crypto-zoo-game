window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiRanking = {
    getAllowedTypes() {
        return ["overall", "daily", "weekly", "ref"];
    },

    normalizeType(type) {
        const safeType = String(type || "").trim().toLowerCase();
        return this.getAllowedTypes().includes(safeType) ? safeType : "overall";
    },

    getActiveType() {
        CryptoZoo.ui = CryptoZoo.ui || {};
        return this.normalizeType(CryptoZoo.ui.rankingActiveType || "overall");
    },

    setActiveType(type) {
        CryptoZoo.ui = CryptoZoo.ui || {};
        CryptoZoo.ui.rankingActiveType = this.normalizeType(type);
        this.updateTabsUi();
        this.updateSubtitle();
    },

    getRankingTypeLabel(type) {
        switch (this.normalizeType(type)) {
            case "daily":
                return "Dzienny";
            case "weekly":
                return "Tygodniowy";
            case "ref":
                return "Ref";
            case "overall":
            default:
                return "Ogólny";
        }
    },

    getSubtitleText(type) {
        switch (this.normalizeType(type)) {
            case "daily":
                return "Dzisiejszy ranking graczy";
            case "weekly":
                return "Tygodniowy ranking graczy";
            case "ref":
                return "Najlepsi polecający gracze";
            case "overall":
            default:
                return "Najlepsi gracze Crypto Zoo";
        }
    },

    getMetricLabel(type) {
        switch (this.normalizeType(type)) {
            case "daily":
                return "Dziś";
            case "weekly":
                return "Tydzień";
            case "ref":
                return "Ref";
            case "overall":
            default:
                return "Coins";
        }
    },

    getMetricValue(row, type) {
        const safeType = this.normalizeType(type);

        if (safeType === "ref") {
            return Math.max(0, Number(row?.referralsCount ?? row?.metricValue ?? 0) || 0);
        }

        if (safeType === "daily") {
            return Math.max(0, Number(row?.dailyValue ?? row?.metricValue ?? 0) || 0);
        }

        if (safeType === "weekly") {
            return Math.max(0, Number(row?.weeklyValue ?? row?.metricValue ?? 0) || 0);
        }

        return Math.max(0, Number(row?.coins ?? row?.metricValue ?? 0) || 0);
    },

    formatMetricValue(value, type) {
        const safeValue = Math.max(0, Number(value) || 0);
        if (this.normalizeType(type) === "ref") {
            return String(safeValue);
        }
        return CryptoZoo.formatNumber(safeValue);
    },

    ensureRankingShell() {
        const screen = document.getElementById("screen-ranking");
        if (!screen) return null;

        const panel = screen.querySelector(".panel.card");
        if (!panel) return null;

        screen.classList.add("ranking-screen-ready");
        panel.classList.add("ranking-panel");

        if (!panel.querySelector("#rankingProWrap")) {
            panel.innerHTML = `
                <div class="ranking-pro-wrap" id="rankingProWrap">
                    <div class="ranking-pro-head">
                        <h2 id="langScreenRankingTitle" class="ranking-pro-title">🏆 Ranking</h2>
                        <div class="ranking-pro-subtitle" id="rankingProSubtitle">Najlepsi gracze Crypto Zoo</div>
                    </div>

                    <div class="ranking-tabs" id="rankingTabs">
                        <button class="ranking-tab-btn" data-ranking-type="overall" type="button">Ogólny</button>
                        <button class="ranking-tab-btn" data-ranking-type="daily" type="button">Dzienny</button>
                        <button class="ranking-tab-btn" data-ranking-type="weekly" type="button">Tygodniowy</button>
                        <button class="ranking-tab-btn" data-ranking-type="ref" type="button">Ref</button>
                    </div>

                    <div class="ranking-top3" id="rankingTop3"></div>
                    <ul id="rankingList" class="ranking-modern-list"></ul>
                </div>
            `;
        }

        this.bindTabButtons();
        this.updateTabsUi();
        this.updateSubtitle();

        return {
            screen,
            panel,
            rankingList: document.getElementById("rankingList"),
            rankingTop3: document.getElementById("rankingTop3"),
            rankingSubtitle: document.getElementById("rankingProSubtitle")
        };
    },

    updateTabsUi() {
        const activeType = this.getActiveType();
        const buttons = document.querySelectorAll("#rankingTabs [data-ranking-type]");

        buttons.forEach((btn) => {
            btn.classList.toggle(
                "active",
                this.normalizeType(btn.dataset.rankingType) === activeType
            );
        });
    },

    updateSubtitle() {
        const subtitle = document.getElementById("rankingProSubtitle");
        if (!subtitle) return;
        subtitle.textContent = this.getSubtitleText(this.getActiveType());
    },

    bindTabButtons() {
        const wrap = document.getElementById("rankingTabs");
        if (!wrap || wrap.dataset.bound === "1") return;

        wrap.dataset.bound = "1";

        wrap.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-ranking-type]");
            if (!btn) return;

            const nextType = this.normalizeType(btn.dataset.rankingType);
            const currentType = this.getActiveType();

            if (nextType === currentType) return;

            this.setActiveType(nextType);
            this.renderRanking(true);
        });
    },

    renderTop3(rows, type) {
        const mount = document.getElementById("rankingTop3");
        if (!mount) return;

        const safeRows = Array.isArray(rows) ? rows.slice(0, 3) : [];

        if (!safeRows.length) {
            mount.innerHTML = "";
            return;
        }

        const rankMap = new Map();
        safeRows.forEach((row) => {
            rankMap.set(Number(row.rank) || 0, row);
        });

        const ordered = [2, 1, 3]
            .map((rank) => rankMap.get(rank))
            .filter(Boolean);

        mount.innerHTML = ordered.map((row) => {
            const rank = Number(row.rank) || 0;
            const username = row.username || row.name || "Gracz";
            const level = CryptoZoo.formatNumber(row.level || 1);
            const score = this.formatMetricValue(this.getMetricValue(row, type), type);

            let placeClass = "third";
            let icon = "🥉";

            if (rank === 1) {
                placeClass = "first";
                icon = "🥇";
            } else if (rank === 2) {
                placeClass = "second";
                icon = "🥈";
            }

            return `
                <div class="ranking-podium-card ${placeClass}">
                    <div class="ranking-podium-place">${icon}</div>
                    <div class="ranking-podium-name">${username}</div>
                    <div class="ranking-podium-level">Lvl ${level}</div>
                    <div class="ranking-podium-score">${score}</div>
                </div>
            `;
        }).join("");
    },

    renderRankingRows(rows, type) {
        const shell = this.ensureRankingShell();
        if (!shell?.rankingList) return;

        const rankingList = shell.rankingList;
        const safeRows = Array.isArray(rows) ? rows : [];
        const safeType = this.normalizeType(type);

        this.setActiveType(safeType);
        this.renderTop3(safeRows, safeType);

        if (!safeRows.length) {
            rankingList.innerHTML = `<li class="ranking-empty-card">Brak danych rankingu</li>`;
            return;
        }

        rankingList.innerHTML = safeRows.map((row, index) => {
            const rank = Number(row.rank) || index + 1;
            const username = row.username || row.name || "Gracz";
            const level = CryptoZoo.formatNumber(row.level || 1);
            const isMe = !!row.isCurrentPlayer;
            const metricValue = this.formatMetricValue(this.getMetricValue(row, safeType), safeType);

            const badge =
                rank === 1 ? "🥇" :
                rank === 2 ? "🥈" :
                rank === 3 ? "🥉" :
                `#${rank}`;

            return `
                <li class="ranking-row${isMe ? " ranking-me" : ""}">
                    <div class="ranking-left">
                        <div class="ranking-badge">${badge}</div>
                        <div class="ranking-meta">
                            <div class="ranking-name">
                                ${username}
                                ${isMe ? '<span class="me-badge">TY</span>' : ""}
                            </div>
                            <div class="ranking-sub">Lvl ${level} • ${this.getMetricLabel(safeType)}</div>
                        </div>
                    </div>
                    <div class="ranking-score">${metricValue}</div>
                </li>
            `;
        }).join("");
    },

    getCacheKey(type) {
        return `rankingCache_${this.normalizeType(type)}`;
    },

    getFetchKey(type) {
        return `rankingLastFetchAt_${this.normalizeType(type)}`;
    },

    getLoadingKey(type) {
        return `rankingLoading_${this.normalizeType(type)}`;
    },

    async renderRanking(forceRefresh = false) {
        const shell = this.ensureRankingShell();
        if (!shell?.rankingList) return;

        CryptoZoo.ui = CryptoZoo.ui || {};
        const ui = CryptoZoo.ui;
        const type = this.getActiveType();

        const cacheKey = this.getCacheKey(type);
        const fetchKey = this.getFetchKey(type);
        const loadingKey = this.getLoadingKey(type);

        const now = Date.now();
        const ttl = ui.rankingCacheTtl || 15000;

        const cacheFresh =
            Array.isArray(ui[cacheKey]) &&
            (now - (ui[fetchKey] || 0)) < ttl;

        if (!forceRefresh && cacheFresh) {
            this.renderRankingRows(ui[cacheKey], type);
            return;
        }

        if (ui[loadingKey]) {
            if (Array.isArray(ui[cacheKey])) {
                this.renderRankingRows(ui[cacheKey], type);
            } else {
                shell.rankingList.innerHTML = `<li class="ranking-empty-card">Ładowanie rankingu...</li>`;
            }
            return;
        }

        ui[loadingKey] = true;

        if (!Array.isArray(ui[cacheKey])) {
            shell.rankingList.innerHTML = `<li class="ranking-empty-card">Ładowanie rankingu...</li>`;
        }

        try {
            const response = await CryptoZoo.api?.loadRanking?.(type, 50);
            const responseType = this.normalizeType(response?.type || type);
            const rows = Array.isArray(response?.rows) ? response.rows : [];

            ui[this.getCacheKey(responseType)] = rows;
            ui[this.getFetchKey(responseType)] = Date.now();

            if (this.getActiveType() !== responseType) {
                return;
            }

            this.renderRankingRows(rows, responseType);
        } catch (error) {
            console.error("Ranking render error:", error);

            if (Array.isArray(ui[cacheKey])) {
                this.renderRankingRows(ui[cacheKey], type);
            } else {
                shell.rankingList.innerHTML = `<li class="ranking-empty-card">Błąd ładowania rankingu</li>`;
            }
        } finally {
            ui[loadingKey] = false;
        }
    },

    invalidateRankingCache() {
        CryptoZoo.ui = CryptoZoo.ui || {};
        const ui = CryptoZoo.ui;

        this.getAllowedTypes().forEach((type) => {
            ui[this.getCacheKey(type)] = null;
            ui[this.getFetchKey(type)] = 0;
            ui[this.getLoadingKey(type)] = false;
        });
    }
};
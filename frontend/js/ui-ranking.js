window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiRanking = {
    getRankingTypeLabel(type) {
        switch (type) {
            case "ref":
                return "Ref";
            case "daily":
                return "Dzienny";
            case "weekly":
                return "Tygodniowy";
            case "overall":
            default:
                return "Ogólny";
        }
    },

    getMetricLabel(type) {
        switch (type) {
            case "ref":
                return "Ref";
            case "daily":
                return "Dziś";
            case "weekly":
                return "Tydzień";
            case "overall":
            default:
                return "Coins";
        }
    },

    getMetricValue(row, type) {
        switch (type) {
            case "ref":
                return Number(row.referralsCount ?? row.metricValue ?? 0) || 0;
            case "daily":
                return Number(row.dailyValue ?? row.metricValue ?? 0) || 0;
            case "weekly":
                return Number(row.weeklyValue ?? row.metricValue ?? 0) || 0;
            case "overall":
            default:
                return Number(row.coins ?? row.metricValue ?? 0) || 0;
        }
    },

    formatMetricValue(value, type) {
        if (type === "ref") {
            return String(Math.max(0, Number(value) || 0));
        }

        return CryptoZoo.formatNumber(Math.max(0, Number(value) || 0));
    },

    ensureRankingShell() {
        const screen = document.getElementById("screen-ranking");
        if (!screen) return null;

        const panel = screen.querySelector(".panel.card");
        if (!panel) return null;

        screen.style.backgroundImage = "url('assets/backgrounds/jungle-bg.png')";
        screen.style.backgroundSize = "cover";
        screen.style.backgroundPosition = "center";
        screen.style.backgroundRepeat = "no-repeat";
        screen.style.minHeight = "100vh";

        panel.style.background = "transparent";
        panel.style.boxShadow = "none";
        panel.style.border = "none";
        panel.style.padding = "14px 12px 110px";

        panel.innerHTML = `
            <div class="ranking-pro-wrap" id="rankingProWrap">
                <div class="ranking-pro-head">
                    <div class="ranking-pro-title">🏆 Ranking</div>
                    <div class="ranking-pro-subtitle" id="rankingProSubtitle">Najlepsi gracze</div>
                </div>

                <div class="ranking-tabs" id="rankingTabs">
                    <button class="ranking-tab-btn active" data-ranking-type="overall" type="button">Ogólny</button>
                    <button class="ranking-tab-btn" data-ranking-type="daily" type="button">Dzienny</button>
                    <button class="ranking-tab-btn" data-ranking-type="weekly" type="button">Tygodniowy</button>
                    <button class="ranking-tab-btn" data-ranking-type="ref" type="button">Ref</button>
                </div>

                <div class="ranking-top3" id="rankingTop3"></div>
                <ul class="ranking-modern-list" id="rankingList"></ul>
            </div>
        `;

        this.injectStyles();
        this.bindTabButtons();

        return {
            screen,
            panel,
            rankingList: document.getElementById("rankingList"),
            rankingTop3: document.getElementById("rankingTop3"),
            rankingSubtitle: document.getElementById("rankingProSubtitle")
        };
    },

    injectStyles() {
        if (document.getElementById("rankingProUiStyles")) return;

        const style = document.createElement("style");
        style.id = "rankingProUiStyles";
        style.textContent = `
            .ranking-pro-wrap {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .ranking-pro-head {
                padding: 18px 18px 14px;
                border-radius: 24px;
                background: linear-gradient(180deg, rgba(10, 24, 63, 0.78) 0%, rgba(8, 18, 44, 0.72) 100%);
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow: 0 14px 34px rgba(0,0,0,0.24);
                backdrop-filter: blur(8px);
                text-align: center;
            }

            .ranking-pro-title {
                font-size: 18px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 0.02em;
            }

            .ranking-pro-subtitle {
                margin-top: 6px;
                font-size: 13px;
                font-weight: 700;
                color: rgba(255,255,255,0.72);
            }

            .ranking-tabs {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 8px;
            }

            .ranking-tab-btn {
                min-height: 42px;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 14px;
                background: rgba(8, 16, 44, 0.78);
                color: rgba(255,255,255,0.86);
                font-size: 12px;
                font-weight: 900;
                cursor: pointer;
                box-shadow: 0 8px 20px rgba(0,0,0,0.16);
            }

            .ranking-tab-btn.active {
                background: linear-gradient(180deg, #ffd94d 0%, #f0b90b 100%);
                color: #1f1f1f;
                border-color: rgba(255,217,77,0.6);
            }

            .ranking-top3 {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
            }

            .ranking-podium-card {
                position: relative;
                overflow: hidden;
                border-radius: 22px;
                padding: 16px 12px 14px;
                background: linear-gradient(180deg, rgba(9, 22, 58, 0.82) 0%, rgba(8, 17, 42, 0.76) 100%);
                border: 1px solid rgba(255,255,255,0.08);
                backdrop-filter: blur(8px);
                box-shadow: 0 14px 28px rgba(0,0,0,0.18);
                text-align: center;
            }

            .ranking-podium-card.first {
                border-color: rgba(255, 217, 77, 0.55);
                box-shadow: 0 16px 34px rgba(240,185,11,0.18);
            }

            .ranking-podium-card.second {
                border-color: rgba(207, 217, 222, 0.32);
            }

            .ranking-podium-card.third {
                border-color: rgba(205, 127, 50, 0.32);
            }

            .ranking-podium-place {
                font-size: 24px;
                margin-bottom: 8px;
            }

            .ranking-podium-name {
                font-size: 14px;
                font-weight: 900;
                color: #fff;
                line-height: 1.2;
                word-break: break-word;
            }

            .ranking-podium-level {
                margin-top: 6px;
                font-size: 12px;
                color: rgba(255,255,255,0.68);
                font-weight: 700;
            }

            .ranking-podium-score {
                margin-top: 10px;
                font-size: 16px;
                font-weight: 900;
                color: #4fc3ff;
            }

            .ranking-modern-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ranking-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 14px;
                border-radius: 22px;
                background: linear-gradient(180deg, rgba(9, 22, 58, 0.82) 0%, rgba(8, 17, 42, 0.76) 100%);
                border: 1px solid rgba(255,255,255,0.08);
                backdrop-filter: blur(8px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.16);
            }

            .ranking-row.ranking-me {
                border-color: rgba(36, 210, 103, 0.75);
                box-shadow: 0 0 0 2px rgba(36,210,103,0.10), 0 14px 30px rgba(36,210,103,0.16);
            }

            .ranking-left {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 0;
                flex: 1;
            }

            .ranking-badge {
                min-width: 52px;
                height: 52px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.05);
                color: #fff;
                font-size: 20px;
                font-weight: 900;
                flex-shrink: 0;
            }

            .ranking-meta {
                min-width: 0;
                flex: 1;
            }

            .ranking-name {
                font-size: 16px;
                font-weight: 900;
                color: #ffffff;
                line-height: 1.2;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                word-break: break-word;
            }

            .ranking-sub {
                margin-top: 4px;
                font-size: 12px;
                color: rgba(255,255,255,0.68);
                font-weight: 700;
            }

            .me-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 22px;
                padding: 0 10px;
                border-radius: 999px;
                background: linear-gradient(180deg, #3ee07d 0%, #19b85c 100%);
                color: #ffffff;
                font-size: 11px;
                font-weight: 900;
                box-shadow: 0 8px 18px rgba(25,184,92,0.22);
            }

            .ranking-score {
                flex-shrink: 0;
                font-size: 18px;
                font-weight: 900;
                color: #4fc3ff;
                text-align: right;
                min-width: 74px;
            }

            .ranking-empty-card {
                padding: 18px;
                border-radius: 22px;
                background: linear-gradient(180deg, rgba(9, 22, 58, 0.82) 0%, rgba(8, 17, 42, 0.76) 100%);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.86);
                font-size: 14px;
                font-weight: 800;
                text-align: center;
            }
        `;

        document.head.appendChild(style);
    },

    bindTabButtons() {
        const wrap = document.getElementById("rankingTabs");
        if (!wrap || wrap.dataset.bound === "1") return;

        wrap.dataset.bound = "1";

        wrap.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-ranking-type]");
            if (!btn) return;

            const type = String(btn.dataset.rankingType || "overall");
            this.setActiveType(type);
            this.renderRanking(true);
        });
    },

    getActiveType() {
        const current = String(CryptoZoo.ui?.rankingActiveType || "overall").toLowerCase();
        return ["overall", "ref", "daily", "weekly"].includes(current) ? current : "overall";
    },

    setActiveType(type) {
        const safeType = ["overall", "ref", "daily", "weekly"].includes(String(type || "").toLowerCase())
            ? String(type).toLowerCase()
            : "overall";

        CryptoZoo.ui = CryptoZoo.ui || {};
        CryptoZoo.ui.rankingActiveType = safeType;

        const buttons = document.querySelectorAll("[data-ranking-type]");
        buttons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.rankingType === safeType);
        });

        const subtitle = document.getElementById("rankingProSubtitle");
        if (subtitle) {
            subtitle.textContent =
                safeType === "ref"
                    ? "Najlepsi polecający gracze"
                    : safeType === "daily"
                        ? "Dzisiejszy ranking graczy"
                        : safeType === "weekly"
                            ? "Tygodniowy ranking graczy"
                            : "Najlepsi gracze ogółem";
        }
    },

    renderTop3(rows, type) {
        const mount = document.getElementById("rankingTop3");
        if (!mount) return;

        const safeRows = Array.isArray(rows) ? rows.slice(0, 3) : [];

        if (!safeRows.length) {
            mount.innerHTML = "";
            return;
        }

        const order = [1, 0, 2]
            .map((index) => safeRows[index])
            .filter(Boolean);

        mount.innerHTML = order.map((row) => {
            const rank = Number(row.rank) || 0;
            const placeClass =
                rank === 1 ? "first" :
                rank === 2 ? "second" :
                "third";

            const icon =
                rank === 1 ? "🥇" :
                rank === 2 ? "🥈" :
                "🥉";

            return `
                <div class="ranking-podium-card ${placeClass}">
                    <div class="ranking-podium-place">${icon}</div>
                    <div class="ranking-podium-name">${row.username || "Gracz"}</div>
                    <div class="ranking-podium-level">Lvl ${CryptoZoo.formatNumber(row.level || 1)}</div>
                    <div class="ranking-podium-score">${this.formatMetricValue(this.getMetricValue(row, type), type)}</div>
                </div>
            `;
        }).join("");
    },

    renderRankingRows(rows, type) {
        const shell = this.ensureRankingShell();
        if (!shell?.rankingList) return;

        const rankingList = shell.rankingList;
        const safeRanking = Array.isArray(rows) ? rows : [];
        const safeType = ["overall", "ref", "daily", "weekly"].includes(String(type || "").toLowerCase())
            ? String(type).toLowerCase()
            : "overall";

        this.setActiveType(safeType);
        this.renderTop3(safeRanking, safeType);

        if (!safeRanking.length) {
            rankingList.innerHTML = `<li class="ranking-empty-card">Brak danych rankingu</li>`;
            return;
        }

        rankingList.innerHTML = safeRanking.map((row, index) => {
            const rank = Number(row.rank) || index + 1;
            const username = row.username || row.name || "Gracz";
            const level = CryptoZoo.formatNumber(row.level || 1);
            const currentClass = row.isCurrentPlayer ? " ranking-me" : "";
            const badge =
                rank === 1 ? "🥇" :
                rank === 2 ? "🥈" :
                rank === 3 ? "🥉" :
                `#${rank}`;

            const metricValue = this.formatMetricValue(this.getMetricValue(row, safeType), safeType);

            return `
                <li class="ranking-row${currentClass}">
                    <div class="ranking-left">
                        <div class="ranking-badge">${badge}</div>
                        <div class="ranking-meta">
                            <div class="ranking-name">
                                ${username}
                                ${row.isCurrentPlayer ? '<span class="me-badge">TY</span>' : ""}
                            </div>
                            <div class="ranking-sub">Lvl ${level} • ${this.getMetricLabel(safeType)}</div>
                        </div>
                    </div>
                    <div class="ranking-score">${metricValue}</div>
                </li>
            `;
        }).join("");
    },

    async renderRanking(forceRefresh = false) {
        const ui = CryptoZoo.ui || {};
        const type = this.getActiveType();
        const cacheKey = `rankingCache_${type}`;
        const fetchKey = `rankingLastFetchAt_${type}`;

        const shell = this.ensureRankingShell();
        if (!shell?.rankingList) return;

        const now = Date.now();
        const cacheFresh =
            ui[cacheKey] &&
            (now - (ui[fetchKey] || 0)) < (ui.rankingCacheTtl || 15000);

        if (!forceRefresh && cacheFresh) {
            this.renderRankingRows(ui[cacheKey], type);
            return;
        }

        if (ui.rankingLoading) {
            if (ui[cacheKey]) {
                this.renderRankingRows(ui[cacheKey], type);
            }
            return;
        }

        ui.rankingLoading = true;

        if (!ui[cacheKey]) {
            shell.rankingList.innerHTML = `<li class="ranking-empty-card">Ładowanie rankingu...</li>`;
        }

        try {
            const response = await CryptoZoo.api?.loadRanking?.(type, 50);
            const safeRows = Array.isArray(response?.rows) ? response.rows : [];
            const safeType = response?.type || type;

            ui[cacheKey] = safeRows;
            ui[fetchKey] = Date.now();

            this.renderRankingRows(safeRows, safeType);
        } catch (error) {
            console.error("Ranking render error:", error);

            if (ui[cacheKey]) {
                this.renderRankingRows(ui[cacheKey], type);
            } else {
                shell.rankingList.innerHTML = `<li class="ranking-empty-card">Błąd ładowania rankingu</li>`;
            }
        } finally {
            ui.rankingLoading = false;
        }
    },

    invalidateRankingCache() {
        const ui = CryptoZoo.ui || {};
        ["overall", "ref", "daily", "weekly"].forEach((type) => {
            ui[`rankingCache_${type}`] = null;
            ui[`rankingLastFetchAt_${type}`] = 0;
        });
    }
};
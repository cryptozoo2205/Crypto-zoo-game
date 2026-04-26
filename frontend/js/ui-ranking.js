window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiRanking = {
    entries: [],
    currentUserEntry: null,
    loading: false,
    initialized: false,
    activeTab: "global",

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.bindTabButtons();
        this.renderLoading(this.t("Ładowanie rankingu...", "Loading ranking..."));
        this.loadGlobalRanking();
    },

    t(pl, en) {
        const lang = String(
            CryptoZoo.state?.lang ||
            CryptoZoo.lang?.current ||
            "pl"
        ).toLowerCase();

        return lang === "pl" ? pl : en;
    },

    getApiBase() {
        return String(
            CryptoZoo.config?.apiBase || "/api"
        ).replace(/\/+$/, "");
    },

    getRankingUrl() {
        return this.getApiBase() + "/ranking/ranking?type=overall";
    },

    getMount() {
        return document.getElementById("rankingContent")
            || document.getElementById("rankingList")
            || document.getElementById("screen-ranking");
    },

    getTabButtons() {
        return Array.from(document.querySelectorAll("[data-ranking-tab]"));
    },

    bindTabButtons() {
        const buttons = this.getTabButtons();

        buttons.forEach((btn) => {
            const tab = String(btn.getAttribute("data-ranking-tab") || "").trim().toLowerCase();

            if (tab !== "global" && tab !== "ogolny" && tab !== "overall") {
                btn.style.display = "none";
                btn.disabled = true;
                return;
            }

            btn.onclick = () => {
                this.activeTab = "global";
                this.loadGlobalRanking();
            };
        });
    },

    getTelegramId() {
        return String(
            CryptoZoo.telegram?.user?.id ||
            CryptoZoo.state?.telegramId ||
            window.Telegram?.WebApp?.initDataUnsafe?.user?.id ||
            ""
        ).trim();
    },

    formatNumber(value) {
        const num = Number(value) || 0;

        if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
        if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
        if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";

        return String(Math.floor(num));
    },

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    },

    getInitials(name) {
        const safe = String(name || "").trim();
        if (!safe) return "CZ";

        const parts = safe.split(/\s+/).filter(Boolean).slice(0, 2);
        if (!parts.length) return "CZ";

        return parts.map((part) => part.charAt(0)).join("").toUpperCase().slice(0, 2);
    },

    getAvatarStyle(rank, isMe) {
        if (isMe) {
            return `
                background: linear-gradient(180deg, rgba(110,255,208,.98) 0%, rgba(41,192,149,.98) 100%);
                color:#05281f;
                box-shadow:0 8px 24px rgba(41,192,149,.30);
            `;
        }

        if (rank === 1) {
            return `
                background: linear-gradient(180deg, rgba(255,235,146,.98) 0%, rgba(255,194,43,.98) 100%);
                color:#2b1a00;
                box-shadow:0 10px 26px rgba(255,194,43,.35);
            `;
        }

        if (rank === 2) {
            return `
                background: linear-gradient(180deg, rgba(242,247,255,.98) 0%, rgba(191,204,230,.98) 100%);
                color:#15223d;
                box-shadow:0 10px 24px rgba(191,204,230,.26);
            `;
        }

        if (rank === 3) {
            return `
                background: linear-gradient(180deg, rgba(255,216,178,.98) 0%, rgba(213,134,72,.98) 100%);
                color:#311700;
                box-shadow:0 10px 24px rgba(213,134,72,.26);
            `;
        }

        return `
            background: linear-gradient(180deg, rgba(39,86,175,.96) 0%, rgba(10,28,66,.98) 100%);
            color:#eef5ff;
            box-shadow:0 8px 22px rgba(20,63,148,.22);
        `;
    },

    getRankBadgeStyle(rank, isMe) {
        if (isMe) {
            return `
                background: linear-gradient(180deg, rgba(101,255,201,1) 0%, rgba(27,198,150,1) 100%);
                color:#06261e;
                box-shadow:0 8px 20px rgba(27,198,150,.26);
            `;
        }

        if (rank === 1) {
            return `
                background: linear-gradient(180deg, #ffe88f 0%, #ffc72b 100%);
                color:#362000;
                box-shadow:0 8px 24px rgba(255,199,43,.34);
            `;
        }

        if (rank === 2) {
            return `
                background: linear-gradient(180deg, #f6f9ff 0%, #c2d0ef 100%);
                color:#192845;
                box-shadow:0 8px 24px rgba(194,208,239,.26);
            `;
        }

        if (rank === 3) {
            return `
                background: linear-gradient(180deg, #ffd9b2 0%, #d88c4d 100%);
                color:#311800;
                box-shadow:0 8px 24px rgba(216,140,77,.26);
            `;
        }

        return `
            background: linear-gradient(180deg, rgba(25,59,124,1) 0%, rgba(9,24,58,1) 100%);
            color:#dceaff;
            box-shadow:0 8px 18px rgba(22,58,125,.20);
        `;
    },

    getCardGlow(rank, isMe) {
        if (isMe) return "0 0 0 1px rgba(70,255,193,.18), 0 16px 36px rgba(20,130,100,.20)";
        if (rank === 1) return "0 0 0 1px rgba(255,214,84,.18), 0 16px 36px rgba(255,194,43,.18)";
        if (rank === 2) return "0 0 0 1px rgba(214,224,245,.16), 0 16px 34px rgba(180,196,229,.16)";
        if (rank === 3) return "0 0 0 1px rgba(236,174,109,.16), 0 16px 34px rgba(216,140,77,.15)";
        return "0 0 0 1px rgba(92,150,255,.10), 0 14px 30px rgba(0,0,0,.20)";
    },

    getCrown(rank) {
        if (rank === 1) return "👑";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return "#" + rank;
    },

    getUsername(entry) {
        return String(entry?.username || entry?.name || "Player").trim() || "Player";
    },

    normalizeEntry(raw, index) {
        const telegramId = String(
            raw?.telegramId ||
            raw?.telegram_id ||
            raw?.userId ||
            raw?.user_id ||
            ""
        ).trim();

        return {
            rank: Number(raw?.rank) || index + 1,
            telegramId,
            username: this.getUsername(raw),
            level: Number(raw?.level) || 0,
            coins: Number(raw?.coins) || 0,
            isMe: !!telegramId && telegramId === this.getTelegramId()
        };
    },

    findCurrentUserEntry(list, responseData) {
        const currentTelegramId = this.getTelegramId();
        if (!currentTelegramId) return null;

        const fromList = Array.isArray(list)
            ? list.find((entry) => String(entry.telegramId || "").trim() === currentTelegramId)
            : null;

        if (fromList) return fromList;

        const fromResponse = responseData?.currentUser || responseData?.me || null;
        if (fromResponse) {
            return this.normalizeEntry(fromResponse, 0);
        }

        return null;
    },
    renderLoading(text) {
        const mount = this.getMount();
        if (!mount) return;

        mount.innerHTML = `
            <div style="padding:14px 12px 26px 12px;">
                <div style="
                    border-radius:28px;
                    padding:30px 18px;
                    text-align:center;
                    color:#ffffff;
                    background:
                        radial-gradient(circle at top, rgba(63,111,225,.30) 0%, rgba(63,111,225,0) 42%),
                        linear-gradient(180deg, rgba(15,40,96,.96) 0%, rgba(6,18,47,.98) 100%);
                    border:1px solid rgba(120,172,255,.18);
                    box-shadow:0 16px 42px rgba(0,0,0,.30);
                ">
                    <div style="font-size:34px; margin-bottom:10px;">🏆</div>
                    <div style="font-size:24px; font-weight:900; margin-bottom:7px;">
                        ${this.escapeHtml(this.t("Ranking ogólny", "Global ranking"))}
                    </div>
                    <div style="font-size:14px; font-weight:800; color:rgba(255,255,255,.82);">
                        ${this.escapeHtml(text)}
                    </div>
                </div>
            </div>
        `;
    },

    renderError(text) {
        const mount = this.getMount();
        if (!mount) return;

        mount.innerHTML = `
            <div style="padding:14px 12px 26px 12px;">
                <div style="
                    border-radius:28px;
                    padding:28px 18px;
                    text-align:center;
                    color:#ffffff;
                    background:
                        radial-gradient(circle at top, rgba(63,111,225,.20) 0%, rgba(63,111,225,0) 42%),
                        linear-gradient(180deg, rgba(15,40,96,.96) 0%, rgba(6,18,47,.98) 100%);
                    border:1px solid rgba(120,172,255,.18);
                    box-shadow:0 16px 42px rgba(0,0,0,.30);
                ">
                    <div style="font-size:34px; margin-bottom:10px;">⚠️</div>
                    <div style="font-size:22px; font-weight:900; margin-bottom:7px;">
                        ${this.escapeHtml(this.t("Brak danych rankingu", "No ranking data"))}
                    </div>
                    <div style="font-size:14px; font-weight:800; color:rgba(255,255,255,.82);">
                        ${this.escapeHtml(text)}
                    </div>
                </div>
            </div>
        `;
    },

    renderEmpty() {
        const mount = this.getMount();
        if (!mount) return;

        mount.innerHTML = `
            <div style="padding:14px 12px 26px 12px;">
                <div style="
                    border-radius:28px;
                    padding:28px 18px;
                    text-align:center;
                    color:#ffffff;
                    background:
                        radial-gradient(circle at top, rgba(63,111,225,.20) 0%, rgba(63,111,225,0) 42%),
                        linear-gradient(180deg, rgba(15,40,96,.96) 0%, rgba(6,18,47,.98) 100%);
                    border:1px solid rgba(120,172,255,.18);
                    box-shadow:0 16px 42px rgba(0,0,0,.30);
                ">
                    <div style="font-size:34px; margin-bottom:10px;">🏆</div>
                    <div style="font-size:22px; font-weight:900; margin-bottom:7px;">
                        ${this.escapeHtml(this.t("Ranking ogólny", "Global ranking"))}
                    </div>
                    <div style="font-size:14px; font-weight:800; color:rgba(255,255,255,.82);">
                        ${this.escapeHtml(this.t("Brak danych rankingu", "No ranking data"))}
                    </div>
                </div>
            </div>
        `;
    },

    renderHeroCard() {
        return `
            <div style="
                border-radius:30px;
                padding:18px 14px 16px 14px;
                background:
                    radial-gradient(circle at top, rgba(84,141,255,.30) 0%, rgba(84,141,255,0) 40%),
                    linear-gradient(180deg, rgba(16,42,98,.96) 0%, rgba(7,18,46,.98) 100%);
                border:1px solid rgba(121,173,255,.18);
                box-shadow:0 16px 40px rgba(0,0,0,.30);
                margin-bottom:14px;
                text-align:center;
            ">
                <div style="font-size:36px; line-height:1; margin-bottom:7px;">🏆</div>

                <div style="
                    font-size:28px;
                    line-height:1.05;
                    font-weight:900;
                    color:#ffffff;
                    margin-bottom:10px;
                    letter-spacing:.2px;
                ">
                    ${this.escapeHtml(this.t("Ranking ogólny", "Global ranking"))}
                </div>

                <div style="
                    font-size:13px;
                    font-weight:800;
                    color:rgba(255,255,255,.76);
                    margin-bottom:14px;
                ">
                    ${this.escapeHtml(this.t("Najlepsi gracze Crypto Zoo", "Best Crypto Zoo players"))}
                </div>

                <div style="
                    display:flex;
                    gap:10px;
                    justify-content:center;
                    flex-wrap:wrap;
                ">
                    <div style="
                        min-width:92px;
                        padding:10px 12px;
                        border-radius:16px;
                        background:rgba(255,255,255,.05);
                        border:1px solid rgba(255,255,255,.08);
                    ">
                        <div style="font-size:11px;font-weight:800;color:rgba(255,255,255,.64);margin-bottom:4px;">
                            ${this.escapeHtml(this.t("Tryb", "Mode"))}
                        </div>
                        <div style="font-size:14px;font-weight:900;color:#ffffff;">
                            ${this.escapeHtml(this.t("Ogólny", "Overall"))}
                        </div>
                    </div>

                    <div style="
                        min-width:92px;
                        padding:10px 12px;
                        border-radius:16px;
                        background:rgba(255,255,255,.05);
                        border:1px solid rgba(255,255,255,.08);
                    ">
                        <div style="font-size:11px;font-weight:800;color:rgba(255,255,255,.64);margin-bottom:4px;">
                            ${this.escapeHtml(this.t("Graczy", "Players"))}
                        </div>
                        <div style="font-size:14px;font-weight:900;color:#ffffff;">
                            ${this.entries.length}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPodiumCard(entry) {
        const rank = Number(entry.rank) || 0;
        const isMe = !!entry.isMe;
        const isFirst = rank === 1;

        return `
            <div style="
                flex:1;
                min-width:0;
                margin-top:${isFirst ? "0" : "18px"};
                min-height:${isFirst ? "190px" : "172px"};
                border-radius:24px;
                padding:14px 12px 14px 12px;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:flex-start;
                text-align:center;
                background:linear-gradient(180deg, rgba(10,29,70,.96) 0%, rgba(7,18,43,.98) 100%);
                border:1px solid ${isMe ? "rgba(77,255,193,.18)" : "rgba(255,255,255,.08)"};
                box-shadow:${isMe
                    ? "0 0 0 1px rgba(70,255,193,.18), 0 16px 34px rgba(20,130,100,.18)"
                    : rank === 1
                        ? "0 0 0 1px rgba(255,214,84,.18), 0 16px 34px rgba(255,194,43,.18)"
                        : rank === 2
                            ? "0 0 0 1px rgba(214,224,245,.14), 0 14px 30px rgba(180,196,229,.14)"
                            : "0 0 0 1px rgba(236,174,109,.14), 0 14px 30px rgba(216,140,77,.14)"};
            ">
                <div style="
                    width:34px;
                    height:34px;
                    border-radius:999px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:16px;
                    font-weight:900;
                    margin-bottom:10px;
                    background:${rank === 1
                        ? "linear-gradient(180deg,#ffe88f 0%,#ffc72b 100%)"
                        : rank === 2
                            ? "linear-gradient(180deg,#f6f9ff 0%,#c2d0ef 100%)"
                            : "linear-gradient(180deg,#ffd9b2 0%,#d88c4d 100%)"};
                    color:${rank === 1 ? "#362000" : rank === 2 ? "#192845" : "#311800"};
                ">#${rank}</div>

                <div style="
                    color:#ffffff;
                    font-size:${isFirst ? "15px" : "14px"};
                    font-weight:900;
                    line-height:1.15;
                    text-align:center;
                    word-break:break-word;
                    overflow-wrap:anywhere;
                    margin-bottom:8px;
                    min-height:${isFirst ? "36px" : "34px"};
                    display:flex;
                    align-items:center;
                    justify-content:center;
                ">${this.escapeHtml(entry.username)}</div>

                <div style="
                    color:rgba(255,255,255,.74);
                    font-size:12px;
                    font-weight:800;
                    margin-bottom:10px;
                ">${this.escapeHtml(this.t("Poziom", "Level"))} ${this.formatNumber(entry.level)}</div>

                <div style="
                    margin-top:auto;
                    width:100%;
                    box-sizing:border-box;
                    padding:8px 10px;
                    border-radius:14px;
                    font-size:${isFirst ? "13px" : "12px"};
                    font-weight:900;
                    color:${isMe ? "#9bffda" : "#ffe08a"};
                    background:${isMe ? "rgba(77,255,193,.08)" : "rgba(255,196,64,.08)"};
                    border:1px solid ${isMe ? "rgba(77,255,193,.12)" : "rgba(255,196,64,.12)"};
                ">🪙 ${this.formatNumber(entry.coins)}</div>

                ${isMe ? `
                    <div style="
                        margin-top:8px;
                        padding:4px 10px;
                        border-radius:999px;
                        font-size:11px;
                        font-weight:900;
                        color:#04251c;
                        background:linear-gradient(180deg, rgba(101,255,201,1) 0%, rgba(27,198,150,1) 100%);
                    ">${this.escapeHtml(this.t("Ty", "You"))}</div>
                ` : ""}
            </div>
        `;
    },
    renderListRow(entry) {
        const isMe = !!entry.isMe;
        const rank = Number(entry.rank) || 0;

        return `
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                padding:12px;
                margin-bottom:10px;
                border-radius:22px;
                background:
                    linear-gradient(180deg, rgba(10,28,69,.92) 0%, rgba(7,18,43,.98) 100%);
                border:1px solid ${isMe ? "rgba(77,255,193,.18)" : "rgba(105,160,255,.12)"};
                box-shadow:${this.getCardGlow(rank, isMe)};
            ">
                <div style="
                    width:46px;
                    min-width:46px;
                    height:46px;
                    border-radius:15px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:14px;
                    font-weight:900;
                    ${this.getRankBadgeStyle(rank, isMe)}
                ">#${rank}</div>

                <div style="flex:1;min-width:0;">
                    <div style="
                        display:flex;
                        align-items:center;
                        gap:6px;
                        margin-bottom:4px;
                        min-width:0;
                    ">
                        <div style="
                            color:#ffffff;
                            font-size:14px;
                            font-weight:900;
                            line-height:1.15;
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            min-width:0;
                            max-width:100%;
                        ">${this.escapeHtml(entry.username)}</div>

                        ${isMe ? `
                            <div style="
                                padding:3px 8px;
                                border-radius:999px;
                                font-size:10px;
                                font-weight:900;
                                color:#04251c;
                                background:linear-gradient(180deg, rgba(101,255,201,1) 0%, rgba(27,198,150,1) 100%);
                                flex:none;
                            ">${this.escapeHtml(this.t("Ty", "You"))}</div>
                        ` : ""}
                    </div>

                    <div style="
                        color:rgba(255,255,255,.72);
                        font-size:12px;
                        font-weight:800;
                    ">
                        ${this.escapeHtml(this.t("Poziom", "Level"))}: ${this.formatNumber(entry.level)}
                    </div>
                </div>

                <div style="
                    min-width:92px;
                    text-align:right;
                ">
                    <div style="
                        color:${isMe ? "#9bffda" : "#ffe083"};
                        font-size:14px;
                        font-weight:900;
                        line-height:1.1;
                        margin-bottom:4px;
                    ">🪙 ${this.formatNumber(entry.coins)}</div>
                    <div style="
                        color:rgba(255,255,255,.54);
                        font-size:10px;
                        font-weight:800;
                        letter-spacing:.2px;
                    ">${this.escapeHtml(this.t("Wynik", "Score"))}</div>
                </div>
            </div>
        `;
    },

    renderCurrentUserCard() {
        if (!this.currentUserEntry) return "";

        const entry = this.currentUserEntry;

        return `
            <div style="
                margin-top:14px;
                border-radius:28px;
                padding:14px;
                background:
                    radial-gradient(circle at top, rgba(77,255,193,.12) 0%, rgba(77,255,193,0) 42%),
                    linear-gradient(180deg, rgba(10,28,69,.96) 0%, rgba(7,18,43,.98) 100%);
                border:1px solid rgba(77,255,193,.16);
                box-shadow:0 16px 36px rgba(0,0,0,.24);
            ">
                <div style="
                    font-size:14px;
                    font-weight:900;
                    color:#a8ffd8;
                    margin-bottom:12px;
                    padding:0 2px;
                ">${this.escapeHtml(this.t("Twoja pozycja", "Your position"))}</div>

                ${this.renderListRow({
                    rank: entry.rank,
                    username: entry.username,
                    level: entry.level,
                    coins: entry.coins,
                    isMe: true
                })}
            </div>
        `;
    },

    render() {
        const mount = this.getMount();
        if (!mount) return;

        if (!Array.isArray(this.entries) || !this.entries.length) {
            this.renderEmpty();
            return;
        }

        const podiumEntries = this.entries.slice(0, 3);
        const listEntries = this.entries.slice(3);

        mount.innerHTML = `
            <div style="padding:14px 12px 26px 12px;">
                ${this.renderHeroCard()}

                <div style="
                    display:flex;
                    gap:10px;
                    align-items:flex-end;
                    margin-bottom:14px;
                ">
                    ${podiumEntries.map((entry) => this.renderPodiumCard(entry)).join("")}
                </div>

                <div style="
                    border-radius:28px;
                    padding:12px;
                    background:
                        linear-gradient(180deg, rgba(10,28,69,.90) 0%, rgba(7,17,41,.96) 100%);
                    border:1px solid rgba(92,150,255,.14);
                    box-shadow:0 14px 34px rgba(0,0,0,.24);
                ">
                    <div style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:8px;
                        margin-bottom:12px;
                        padding:0 2px;
                    ">
                        <div style="
                            font-size:14px;
                            font-weight:900;
                            color:#dfeaff;
                        ">${this.escapeHtml(this.t("Pozostali gracze", "Other players"))}</div>

                        <div style="
                            font-size:11px;
                            font-weight:900;
                            color:rgba(255,255,255,.54);
                        ">
                            TOP ${this.entries.length}
                        </div>
                    </div>

                    ${listEntries.length
                        ? listEntries.map((entry) => this.renderListRow(entry)).join("")
                        : `
                            <div style="
                                padding:16px 10px;
                                text-align:center;
                                color:rgba(255,255,255,.78);
                                font-size:14px;
                                font-weight:800;
                            ">
                                ${this.escapeHtml(this.t("Brak kolejnych graczy", "No more players"))}
                            </div>
                        `
                    }
                </div>

                ${this.renderCurrentUserCard()}
            </div>
        `;
    },

    async loadGlobalRanking() {
        if (this.loading) return;
        this.loading = true;

        this.renderLoading(this.t("Ładowanie rankingu...", "Loading ranking..."));

        try {
            const res = await fetch(this.getRankingUrl(), {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error("HTTP_" + res.status);
            }

            const data = await res.json();

            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.ranking)
                    ? data.ranking
                    : [];

            this.entries = list.map((item, index) => this.normalizeEntry(item, index));
            this.currentUserEntry = this.findCurrentUserEntry(this.entries, data);

            this.render();
        } catch (error) {
            console.error("[ui-ranking] loadGlobalRanking error:", error);
            this.entries = [];
            this.currentUserEntry = null;
            this.renderError(this.t(
                "Nie udało się pobrać rankingu.",
                "Failed to load ranking."
            ));
        }

        this.loading = false;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (CryptoZoo.uiRanking && typeof CryptoZoo.uiRanking.init === "function") {
        CryptoZoo.uiRanking.init();
    }
});

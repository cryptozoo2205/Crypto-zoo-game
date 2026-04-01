window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    initialized: false,
    eventsBound: false,
    refreshTimer: null,
    lastAppliedIdentityKey: "",
    lastRefreshAt: 0,

    init() {
        if (this.initialized) {
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
            return;
        }

        this.initialized = true;

        const tg = this.getWebApp();

        if (!tg) {
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
            return;
        }

        try {
            tg.ready();
        } catch (error) {
            console.warn("tg.ready failed:", error);
        }

        try {
            if (typeof tg.expand === "function") {
                tg.expand();
            }
        } catch (error) {
            console.warn("tg.expand failed:", error);
        }

        this.setupPlayerIdentity();
        this.applyTelegramTheme();
        this.bindTelegramEvents();
        this.applyIdentityToUi();
    },

    getWebApp() {
        return window.Telegram && window.Telegram.WebApp
            ? window.Telegram.WebApp
            : null;
    },

    getTelegramUser() {
        const tg = this.getWebApp();
        const user = tg?.initDataUnsafe?.user;

        if (!user || !user.id) {
            return null;
        }

        return {
            id: String(user.id),
            username: String(user.username || ""),
            first_name: String(user.first_name || "Gracz"),
            last_name: String(user.last_name || ""),
            photo_url: String(user.photo_url || "")
        };
    },

    getDisplayNameFromUser(user) {
        if (!user) {
            return (
                localStorage.getItem("telegramUsername") ||
                localStorage.getItem("telegramDisplayName") ||
                localStorage.getItem("telegramFirstName") ||
                "Crypto Zoo"
            );
        }

        return (
            user.username ||
            [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
            "Gracz"
        );
    },

    setupPlayerIdentity() {
        const user = this.getTelegramUser();
        if (!user) {
            return null;
        }

        const displayName = this.getDisplayNameFromUser(user);

        try {
            localStorage.setItem("telegramId", user.id);
            localStorage.setItem("telegramUsername", user.username);
            localStorage.setItem("telegramFirstName", user.first_name);
            localStorage.setItem("telegramDisplayName", displayName);
            localStorage.setItem("telegramPhotoUrl", user.photo_url || "");
            localStorage.setItem("playerId", user.id);
        } catch (error) {
            console.warn("telegram localStorage save failed:", error);
        }

        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.telegramUser = {
            ...(CryptoZoo.state.telegramUser || {}),
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_url
        };

        CryptoZoo.state.playerId = user.id;
        CryptoZoo.state.telegramId = user.id;

        return user;
    },

    applyTelegramTheme() {
        const tg = this.getWebApp();
        if (!tg) return;

        try {
            if (typeof tg.setHeaderColor === "function") {
                tg.setHeaderColor("#0b1220");
            }
        } catch (error) {
            console.warn("setHeaderColor failed:", error);
        }

        try {
            if (typeof tg.setBackgroundColor === "function") {
                tg.setBackgroundColor("#0b1220");
            }
        } catch (error) {
            console.warn("setBackgroundColor failed:", error);
        }

        try {
            if (typeof tg.disableVerticalSwipes === "function") {
                tg.disableVerticalSwipes();
            }
        } catch (error) {
            console.warn("disableVerticalSwipes failed:", error);
        }
    },

    forceFullscreen() {
        const tg = this.getWebApp();
        if (!tg) return;

        try {
            if (typeof tg.expand === "function") {
                tg.expand();
            }
        } catch (error) {
            console.warn("tg.expand failed:", error);
        }
    },

    applyViewportFix() {
        /* celowo puste */
    },

    scheduleRefresh(delay = 80) {
        clearTimeout(this.refreshTimer);

        this.refreshTimer = setTimeout(() => {
            this.refreshTimer = null;
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
        }, Math.max(0, Number(delay) || 0));
    },

    bindTelegramEvents() {
        const tg = this.getWebApp();

        if (!tg || typeof tg.onEvent !== "function" || this.eventsBound) {
            return;
        }

        this.eventsBound = true;

        const refreshSoon = () => {
            const now = Date.now();

            if (now - this.lastRefreshAt < 1000) {
                return;
            }

            this.lastRefreshAt = now;
            this.scheduleRefresh(80);
        };

        try {
            tg.onEvent("viewportChanged", refreshSoon);
        } catch (error) {
            console.warn("viewportChanged bind failed:", error);
        }

        try {
            tg.onEvent("safeAreaChanged", refreshSoon);
        } catch (error) {
            console.warn("safeAreaChanged bind failed:", error);
        }

        try {
            tg.onEvent("contentSafeAreaChanged", refreshSoon);
        } catch (error) {
            console.warn("contentSafeAreaChanged bind failed:", error);
        }

        let resizeTimer = null;

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const now = Date.now();

                if (now - this.lastRefreshAt < 1000) {
                    return;
                }

                this.lastRefreshAt = now;
                this.scheduleRefresh(60);
            }, 160);
        }, { passive: true });

        window.addEventListener("orientationchange", () => {
            const now = Date.now();

            if (now - this.lastRefreshAt < 1000) {
                return;
            }

            this.lastRefreshAt = now;
            this.scheduleRefresh(220);
        }, { passive: true });
    },

    applyIdentityToUi() {
        const tg = this.getWebApp();
        const user = this.getTelegramUser();

        const displayName = this.getDisplayNameFromUser(user);
        const statusText =
            tg && user && user.id
                ? "● Telegram Online"
                : tg
                    ? "● Telegram WebApp"
                    : "● Local Mode";

        const photoUrl =
            (user && user.photo_url) ||
            localStorage.getItem("telegramPhotoUrl") ||
            "";

        const identityKey = `${displayName}|${statusText}|${photoUrl}`;
        if (identityKey === this.lastAppliedIdentityKey) {
            return;
        }

        this.lastAppliedIdentityKey = identityKey;

        const topUserName = document.getElementById("topPlayerName");
        const topUserStatus = document.getElementById("topPlayerStatus");

        if (topUserName && topUserName.textContent !== displayName) {
            topUserName.textContent = displayName;
        }

        if (topUserStatus && topUserStatus.textContent !== statusText) {
            topUserStatus.textContent = statusText;
        }

        CryptoZoo.uiProfile?.renderAvatarImages?.();

        if (CryptoZoo.ui?.isProfileModalOpen?.()) {
            CryptoZoo.uiProfile?.refreshProfileModalData?.();
        }
    }
};
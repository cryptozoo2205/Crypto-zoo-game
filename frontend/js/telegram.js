window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    initialized: false,
    eventsBound: false,

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

    setupPlayerIdentity() {
        const user = this.getTelegramUser();
        if (!user) {
            return;
        }

        const displayName =
            user.username ||
            [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
            "Gracz";

        localStorage.setItem("telegramId", user.id);
        localStorage.setItem("telegramUsername", user.username);
        localStorage.setItem("telegramFirstName", user.first_name);
        localStorage.setItem("telegramDisplayName", displayName);
        localStorage.setItem("telegramPhotoUrl", user.photo_url || "");

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.telegramUser = {
            ...(CryptoZoo.state.telegramUser || {}),
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_url
        };
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
        // celowo puste
        // nic tutaj nie ruszamy, bo właśnie to najpewniej blokowało kliki w Telegramie
    },

    bindTelegramEvents() {
        const tg = this.getWebApp();

        if (!tg || typeof tg.onEvent !== "function" || this.eventsBound) {
            return;
        }

        this.eventsBound = true;

        const refresh = () => {
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
        };

        try {
            tg.onEvent("viewportChanged", refresh);
        } catch (error) {
            console.warn("viewportChanged bind failed:", error);
        }

        try {
            tg.onEvent("safeAreaChanged", refresh);
        } catch (error) {
            console.warn("safeAreaChanged bind failed:", error);
        }

        try {
            tg.onEvent("contentSafeAreaChanged", refresh);
        } catch (error) {
            console.warn("contentSafeAreaChanged bind failed:", error);
        }

        window.addEventListener("resize", refresh, { passive: true });
        window.addEventListener("orientationchange", refresh, { passive: true });
    },

    applyIdentityToUi() {
        const tg = this.getWebApp();
        const user = this.getTelegramUser();

        const displayName =
            (user && (user.username || user.first_name)) ||
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramDisplayName") ||
            localStorage.getItem("telegramFirstName") ||
            "Crypto Zoo";

        const topUserName = document.getElementById("topPlayerName");
        const topUserStatus = document.getElementById("topPlayerStatus");

        if (topUserName) {
            topUserName.textContent = displayName;
        }

        if (topUserStatus) {
            if (tg && user && user.id) {
                topUserStatus.textContent = "● Telegram Online";
            } else if (tg) {
                topUserStatus.textContent = "● Telegram WebApp";
            } else {
                topUserStatus.textContent = "● Local Mode";
            }
        }

        CryptoZoo.uiProfile?.renderAvatarImages?.();
        CryptoZoo.uiProfile?.refreshProfileModalData?.();
    }
};
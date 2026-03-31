window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    initialized: false,
    eventsBound: false,

    init() {
        if (this.initialized) {
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
            this.applyTelegramTheme();
            this.applyViewportFix();
            return;
        }

        this.initialized = true;

        const tg = this.getWebApp();

        if (!tg) {
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
            this.applyViewportFix();
            return;
        }

        try {
            tg.ready();
        } catch (error) {
            console.warn("tg.ready failed:", error);
        }

        this.setupPlayerIdentity();
        this.applyTelegramTheme();
        this.bindTelegramEvents();

        try {
            if (typeof tg.expand === "function") {
                tg.expand();
            }
        } catch (error) {
            console.warn("tg.expand failed:", error);
        }

        this.applyViewportFix();
        this.applyIdentityToUi();

        setTimeout(() => this.applyViewportFix(), 100);
        setTimeout(() => this.applyViewportFix(), 300);
        setTimeout(() => this.applyViewportFix(), 700);
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

        this.applyViewportFix();
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
            this.applyViewportFix();
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

    getSafeAreaValues() {
        const tg = this.getWebApp();

        const fallback = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };

        if (!tg) {
            return fallback;
        }

        const inset = tg.safeAreaInset || {};
        const contentInset = tg.contentSafeAreaInset || {};

        return {
            top: Number(contentInset.top ?? inset.top ?? 0) || 0,
            bottom: Number(contentInset.bottom ?? inset.bottom ?? 0) || 0,
            left: Number(contentInset.left ?? inset.left ?? 0) || 0,
            right: Number(contentInset.right ?? inset.right ?? 0) || 0
        };
    },

    getViewportHeight() {
        const tg = this.getWebApp();

        const candidates = [
            Number(tg?.viewportStableHeight) || 0,
            Number(tg?.viewportHeight) || 0,
            window.innerHeight || 0,
            document.documentElement?.clientHeight || 0
        ].filter((value) => value > 0);

        return candidates.length ? Math.max(...candidates) : (window.innerHeight || 0);
    },

    applyViewportFix() {
        const root = document.documentElement;
        const body = document.body;
        const app = document.getElementById("app");
        const topBar = document.querySelector(".top-bar");
        const menu = document.querySelector(".menu");

        const safe = this.getSafeAreaValues();
        const viewportHeight = this.getViewportHeight();

        if (root) {
            root.style.setProperty("--tg-safe-top", `${safe.top}px`);
            root.style.setProperty("--tg-safe-bottom", `${safe.bottom}px`);
            root.style.setProperty("--tg-safe-left", `${safe.left}px`);
            root.style.setProperty("--tg-safe-right", `${safe.right}px`);
            root.style.setProperty("--tg-viewport-height", `${viewportHeight}px`);
            root.style.background = "#0b1220";
        }

        if (body) {
            body.classList.add("telegram-webapp");
            body.style.background = "#0b1220";
        }

        if (app && viewportHeight > 0) {
            app.style.height = `${viewportHeight}px`;
            app.style.minHeight = `${viewportHeight}px`;
            app.style.maxHeight = `${viewportHeight}px`;
        }

        if (topBar) {
            topBar.style.paddingTop = `${safe.top}px`;
            topBar.style.paddingLeft = `${safe.left}px`;
            topBar.style.paddingRight = `${safe.right}px`;
            topBar.style.boxSizing = "border-box";
        }

        if (menu) {
            menu.style.paddingLeft = `${safe.left}px`;
            menu.style.paddingRight = `${safe.right}px`;
            menu.style.paddingBottom = `${Math.max(10, safe.bottom)}px`;
            menu.style.boxSizing = "border-box";
        }
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
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    initialized: false,
    safeAreaBound: false,
    fullscreenRequested: false,

    init() {
        if (this.initialized) {
            this.applyIdentityToUi();
            this.applyViewportFix();
            return;
        }

        this.initialized = true;

        const tg = this.getWebApp();

        if (!tg) {
            this.applyIdentityToUi();
            this.applyViewportFix();
            return;
        }

        try {
            tg.ready();

            this.setupPlayerIdentity();
            this.applyTelegramTheme();
            this.bindTelegramEvents();
            this.forceFullscreen();
            this.applyViewportFix();
            this.applyIdentityToUi();

            setTimeout(() => this.applyViewportFix(), 120);
            setTimeout(() => this.applyViewportFix(), 300);
            setTimeout(() => this.applyViewportFix(), 700);
            setTimeout(() => this.applyViewportFix(), 1200);
        } catch (error) {
            console.error("TELEGRAM INIT ERROR:", error);
            this.applyIdentityToUi();
            this.applyViewportFix();
        }
    },

    getWebApp() {
        return window.Telegram && window.Telegram.WebApp
            ? window.Telegram.WebApp
            : null;
    },

    getTelegramUser() {
        const tg = this.getWebApp();
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            return null;
        }

        const user = tg.initDataUnsafe.user;
        if (!user.id) {
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
        if (!tg) {
            return;
        }

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

        try {
            if (typeof tg.enableClosingConfirmation === "function") {
                tg.enableClosingConfirmation();
            }
        } catch (error) {
            console.warn("enableClosingConfirmation failed:", error);
        }
    },

    forceFullscreen() {
        const tg = this.getWebApp();
        if (!tg) {
            return;
        }

        const runFullscreen = () => {
            try {
                if (typeof tg.expand === "function") {
                    tg.expand();
                }
            } catch (error) {
                console.warn("expand failed:", error);
            }

            if (!this.fullscreenRequested) {
                try {
                    if (typeof tg.requestFullscreen === "function") {
                        tg.requestFullscreen();
                    }
                } catch (error) {
                    console.warn("requestFullscreen failed:", error);
                }

                this.fullscreenRequested = true;
            }

            this.applyViewportFix();
        };

        runFullscreen();

        setTimeout(runFullscreen, 120);
        setTimeout(runFullscreen, 320);
        setTimeout(runFullscreen, 700);
    },

    bindTelegramEvents() {
        const tg = this.getWebApp();
        if (!tg || typeof tg.onEvent !== "function" || this.safeAreaBound) {
            return;
        }

        this.safeAreaBound = true;

        const refresh = () => {
            this.applyViewportFix();
            this.setupPlayerIdentity();
            this.applyIdentityToUi();
        };

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

        try {
            tg.onEvent("fullscreenChanged", refresh);
        } catch (error) {
            console.warn("fullscreenChanged bind failed:", error);
        }

        try {
            tg.onEvent("activated", refresh);
        } catch (error) {
            console.warn("activated bind failed:", error);
        }

        try {
            tg.onEvent("viewportChanged", refresh);
        } catch (error) {
            console.warn("viewportChanged bind failed:", error);
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
            document.documentElement?.clientHeight || 0,
            screen?.height || 0
        ].filter((value) => value > 0);

        if (!candidates.length) {
            return 0;
        }

        return Math.max(...candidates);
    },

    applyViewportFix() {
        const root = document.documentElement;
        const body = document.body;
        const app = document.getElementById("app");
        const game = document.getElementById("game");
        const menu = document.querySelector(".menu");
        const topBar = document.querySelector(".top-bar");
        const safe = this.getSafeAreaValues();
        const viewportHeight = this.getViewportHeight();

        if (root) {
            root.style.margin = "0";
            root.style.padding = "0";
            root.style.width = "100%";
            root.style.height = "100%";
            root.style.minHeight = "100%";
            root.style.overflow = "hidden";
            root.style.background = "#0b1220";
            root.style.setProperty("--tg-safe-top", `${safe.top}px`);
            root.style.setProperty("--tg-safe-bottom", `${safe.bottom}px`);
            root.style.setProperty("--tg-safe-left", `${safe.left}px`);
            root.style.setProperty("--tg-safe-right", `${safe.right}px`);
            root.style.setProperty("--tg-viewport-height", `${viewportHeight}px`);
        }

        if (body) {
            body.classList.add("telegram-webapp");
            body.style.margin = "0";
            body.style.padding = "0";
            body.style.width = "100%";
            body.style.height = "100%";
            body.style.minHeight = "100%";
            body.style.overflow = "hidden";
            body.style.background = "#0b1220";
            body.style.position = "relative";
            body.style.inset = "";
        }

        if (app) {
            app.style.width = "100%";
            app.style.height = `${viewportHeight}px`;
            app.style.minHeight = `${viewportHeight}px`;
            app.style.maxHeight = `${viewportHeight}px`;
            app.style.overflow = "hidden";
            app.style.background = "#0b1220";
            app.style.position = "relative";
        }

        if (topBar) {
            topBar.style.paddingTop = `${safe.top}px`;
            topBar.style.paddingLeft = `${safe.left}px`;
            topBar.style.paddingRight = `${safe.right}px`;
            topBar.style.boxSizing = "border-box";
        }

        if (menu) {
            menu.style.paddingBottom = `${Math.max(10, safe.bottom)}px`;
            menu.style.paddingLeft = `${safe.left}px`;
            menu.style.paddingRight = `${safe.right}px`;
            menu.style.boxSizing = "border-box";
        }

        if (game) {
            game.style.height = `calc(${viewportHeight}px - ${topBar ? topBar.offsetHeight : 0}px - ${menu ? menu.offsetHeight : 0}px)`;
            game.style.minHeight = `calc(${viewportHeight}px - ${topBar ? topBar.offsetHeight : 0}px - ${menu ? menu.offsetHeight : 0}px)`;
            game.style.maxHeight = `calc(${viewportHeight}px - ${topBar ? topBar.offsetHeight : 0}px - ${menu ? menu.offsetHeight : 0}px)`;
            game.style.overflowY = "auto";
            game.style.overflowX = "hidden";
            game.style.WebkitOverflowScrolling = "touch";
            game.style.paddingLeft = `${safe.left}px`;
            game.style.paddingRight = `${safe.right}px`;
            game.style.boxSizing = "border-box";
            game.style.position = "relative";
            game.style.pointerEvents = "auto";
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
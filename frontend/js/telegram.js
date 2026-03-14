
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    getTelegramUser() {
        if (!window.Telegram || !window.Telegram.WebApp) {
            return null;
        }

        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const unsafeUser =
            tg.initDataUnsafe && tg.initDataUnsafe.user
                ? tg.initDataUnsafe.user
                : null;

        if (!unsafeUser || !unsafeUser.id) {
            return null;
        }

        return {
            id: String(unsafeUser.id),
            username: unsafeUser.username || unsafeUser.first_name || "TelegramUser"
        };
    },

    setupPlayerIdentity() {
        const state = CryptoZoo.state;

        state.telegramUser = this.getTelegramUser();

        state.telegramId = state.telegramUser
            ? state.telegramUser.id
            : (localStorage.getItem("telegramId") || String(Date.now()));

        state.playerUsername = state.telegramUser
            ? state.telegramUser.username
            : `Gracz_${state.telegramId}`;

        localStorage.setItem("telegramId", state.telegramId);
    }
};
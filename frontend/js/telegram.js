window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {

    init() {

        if (!window.Telegram || !Telegram.WebApp) return;

        const tg = Telegram.WebApp;

        tg.ready();

        // pełny ekran
        tg.expand();

        // kolor tła
        tg.setBackgroundColor("#0f172a");

        // kolor nagłówka
        tg.setHeaderColor("#0f172a");

        // blokada scrolla
        document.body.style.overflow = "hidden";

    },

    setupPlayerIdentity() {

        if (!window.Telegram || !Telegram.WebApp) return;

        const user = Telegram.WebApp.initDataUnsafe.user;

        if (!user) return;

        localStorage.setItem("telegramId", user.id);

        if (user.username) {
            localStorage.setItem("telegramUsername", user.username);
        }

    }

};
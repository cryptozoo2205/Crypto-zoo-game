window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    setupPlayerIdentity() {
        if (!window.CryptoZoo.state) {
            window.CryptoZoo.state = {
                coins: 0,
                gems: 0,
                level: 1,
                coinsPerClick: 1,
                upgradeCost: 50,
                zooIncome: 0,
                animals: {
                    monkey: { count: 0, level: 1 },
                    panda: { count: 0, level: 1 },
                    lion: { count: 0, level: 1 }
                }
            };
        }

        try {
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;

                tg.ready();
                tg.expand();

                const user = tg.initDataUnsafe && tg.initDataUnsafe.user;

                if (user) {
                    window.CryptoZoo.state.telegramUser = {
                        id: String(user.id),
                        username: user.username || "Gracz"
                    };

                    localStorage.setItem("telegramId", String(user.id));
                    localStorage.setItem("telegramUsername", user.username || "Gracz");
                    return;
                }
            }
        } catch (error) {
            console.log("Telegram init skipped:", error);
        }

        let localId = localStorage.getItem("telegramId");
        if (!localId) {
            localId = "local-player";
            localStorage.setItem("telegramId", localId);
        }

        window.CryptoZoo.state.telegramUser = {
            id: localId,
            username: localStorage.getItem("telegramUsername") || "Gracz"
        };
    }
};
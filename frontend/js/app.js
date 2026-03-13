window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.app = {
    updateLevel() {
        const state = window.CryptoZoo.state;
        state.level = Math.floor(state.coins / 25) + 1;
    },

    async applyOfflineIncome(user) {
        const state = window.CryptoZoo.state;
        const ui = window.CryptoZoo.ui;
        const zoo = window.CryptoZoo.zoo;
        const maxOfflineSeconds = window.CryptoZoo.config.maxOfflineSeconds;

        if (!user || !user.lastLogin) return;

        const last = new Date(user.lastLogin).getTime();
        const now = Date.now();

        let secondsOffline = Math.floor((now - last) / 1000);

        if (secondsOffline > maxOfflineSeconds) {
            secondsOffline = maxOfflineSeconds;
        }

        const offlineCoins = secondsOffline * state.zooIncome;

        if (offlineCoins > 0) {
            state.coins += offlineCoins;
            this.updateLevel();
            zoo.updateZooIncome();
            ui.render();
            ui.showToast(`Zarobiłeś offline: ${offlineCoins} monet`);
        }
    },

    bindNavigation() {
        const ui = window.CryptoZoo.ui;
        const ranking = window.CryptoZoo.ranking;

        ui.els.navButtons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                const screenId = btn.dataset.screen;
                ui.showScreen(screenId);

                if (screenId === "ranking") {
                    ranking.renderRanking();
                }
            });
        });
    },

    bindActions() {
        const state = window.CryptoZoo.state;
        const ui = window.CryptoZoo.ui;
        const zoo = window.CryptoZoo.zoo;
        const api = window.CryptoZoo.api;

        if (ui.els.tapBtn) {
            ui.els.tapBtn.addEventListener("click", async function () {
                state.coins += state.coinsPerClick;
                window.CryptoZoo.app.updateLevel();
                ui.render();
                ui.animateCoinsBurst();
                await api.savePlayer();
            });
        }

        if (ui.els.buyUpgradeBtn) {
            ui.els.buyUpgradeBtn.addEventListener("click", async function () {
                if (state.coins < state.upgradeCost) {
                    ui.showToast("Za mało monet na ulepszenie.");
                    return;
                }

                state.coins -= state.upgradeCost;
                state.coinsPerClick += 1;
                state.upgradeCost = Math.floor(state.upgradeCost * 1.8);

                window.CryptoZoo.app.updateLevel();
                ui.render();
                await api.savePlayer();
                ui.showToast("Kupiono ulepszenie kliknięcia.");
            });
        }

        if (ui.els.buyMonkeyBtn) {
            ui.els.buyMonkeyBtn.addEventListener("click", async function () {
                await zoo.buyAnimal("monkey");
            });
        }

        if (ui.els.buyPandaBtn) {
            ui.els.buyPandaBtn.addEventListener("click", async function () {
                await zoo.buyAnimal("panda");
            });
        }

        if (ui.els.buyLionBtn) {
            ui.els.buyLionBtn.addEventListener("click", async function () {
                await zoo.buyAnimal("lion");
            });
        }

        if (ui.els.upgradeMonkeyBtn) {
            ui.els.upgradeMonkeyBtn.addEventListener("click", async function () {
                await zoo.upgradeAnimal("monkey");
            });
        }

        if (ui.els.upgradePandaBtn) {
            ui.els.upgradePandaBtn.addEventListener("click", async function () {
                await zoo.upgradeAnimal("panda");
            });
        }

        if (ui.els.upgradeLionBtn) {
            ui.els.upgradeLionBtn.addEventListener("click", async function () {
                await zoo.upgradeAnimal("lion");
            });
        }
    },

    startPassiveIncome() {
        const state = window.CryptoZoo.state;
        const ui = window.CryptoZoo.ui;
        const api = window.CryptoZoo.api;
        const zoo = window.CryptoZoo.zoo;

        setInterval(async function () {
            if (state.zooIncome > 0) {
                state.coins += state.zooIncome;
                window.CryptoZoo.app.updateLevel();
                zoo.updateZooIncome();
                ui.render();
                await api.savePlayer();
            }
        }, 1000);
    },

    async init() {
        const state = window.CryptoZoo.state;
        const api = window.CryptoZoo.api;
        const ui = window.CryptoZoo.ui;
        const zoo = window.CryptoZoo.zoo;
        const ranking = window.CryptoZoo.ranking;

        ui.cacheElements();

        const user = await api.loadPlayer();

        if (user) {
            state.coins = user.coins || 0;
            state.level = user.level || 1;
            state.coinsPerClick = user.coinsPerClick || 1;
            state.upgradeCost = user.upgradeCost || 50;
            state.animals = user.animals || {
                monkey: { count: 0, level: 1 },
                panda: { count: 0, level: 1 },
                lion: { count: 0, level: 1 }
            };
        }

        zoo.normalizeAnimals();
        zoo.updateZooIncome();
        this.updateLevel();
        ui.render();

        this.bindNavigation();
        this.bindActions();

        await this.applyOfflineIncome(user);
        ui.render();

        await api.savePlayer();
        await ranking.renderRanking();

        ui.showScreen("game");
        this.startPassiveIncome();
    }
};

document.addEventListener("DOMContentLoaded", function () {
    window.CryptoZoo.app.init();
});
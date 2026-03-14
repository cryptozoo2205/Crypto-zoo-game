lwindow.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {
    getEl(id) {
        return document.getElementById(id);
    },

    showToast(message) {
        const toast = this.getEl("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(window.cryptoZooToastTimeout);

        window.cryptoZooToastTimeout = setTimeout(function () {
            toast.style.display = "none";
        }, 2000);
    },

    showScreen(screenId) {
        const screens = document.querySelectorAll(".screen");
        const navButtons = document.querySelectorAll(".nav-btn");

        screens.forEach(function (screen) {
            screen.classList.remove("active-screen");
        });

        navButtons.forEach(function (btn) {
            btn.classList.remove("active-nav");
        });

        const target = this.getEl(screenId);
        if (target) {
            target.classList.add("active-screen");
        }

        navButtons.forEach(function (btn) {
            if (btn.getAttribute("data-screen") === screenId) {
                btn.classList.add("active-nav");
            }
        });
    },

    animateCoinsBurst() {
        const container = this.getEl("coin-animation-container");
        if (!container) return;

        for (let i = 0; i < 8; i++) {
            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.floor(Math.random() * 220) - 110) + "px";
            const moveY = (-70 - Math.floor(Math.random() * 140)) + "px";

            coin.style.left = "114px";
            coin.style.top = "114px";
            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            container.appendChild(coin);

            setTimeout(function () {
                coin.remove();
            }, 900);
        }
    },

    updateText(id, value) {
        const el = this.getEl(id);
        if (el) {
            el.textContent = value;
        }
    },

    updateCollectionCard(cardId, statusId, discovered) {
        const card = this.getEl(cardId);
        const statusEl = this.getEl(statusId);

        if (!card || !statusEl) return;

        if (discovered) {
            card.classList.remove("locked");
            card.classList.add("discovered");
            statusEl.textContent = "Odkryte";
            statusEl.classList.remove("locked-status");
            statusEl.classList.add("discovered-status");
        } else {
            card.classList.remove("discovered");
            card.classList.add("locked");
            statusEl.textContent = "Nieodkryte";
            statusEl.classList.remove("discovered-status");
            statusEl.classList.add("locked-status");
        }
    },

    render() {
        const state = CryptoZoo.state || {};
        const animals = state.animals || {};
        const animalsConfig = CryptoZoo.config.animals || {};

        this.updateText("coins-count", CryptoZoo.formatNumber(state.coins ?? 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level ?? 1));
        this.updateText("coins-per-click", CryptoZoo.formatNumber(state.coinsPerClick ?? 1));
        this.updateText("upgrade-cost", CryptoZoo.formatNumber(state.upgradeCost ?? 50));
        this.updateText("zoo-income", CryptoZoo.formatNumber(state.zooIncome ?? 0));

        let animalsTotal = 0;
        let foundCount = 0;

        const rarityCounts = {
            common: { found: 0, total: 0 },
            rare: { found: 0, total: 0 },
            epic: { found: 0, total: 0 }
        };

        Object.keys(animalsConfig).forEach((type) => {
            const animalState = animals[type] || { count: 0, level: 1 };
            const animalConfig = animalsConfig[type];

            animalsTotal += animalState.count;

            this.updateText(`${type}-count`, CryptoZoo.formatNumber(animalState.count));
            this.updateText(`${type}-level`, CryptoZoo.formatNumber(animalState.level));

            const upgradeBtn = this.getEl(`upgrade-${type}-btn`);
            if (upgradeBtn && CryptoZoo.gameplay && CryptoZoo.gameplay.getAnimalUpgradeCost) {
                upgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost(type))})`;
            }

            const discovered = animalState.count > 0;

            if (discovered) {
                foundCount += 1;
            }

            if (rarityCounts[animalConfig.rarity]) {
                rarityCounts[animalConfig.rarity].total += 1;
                if (discovered) {
                    rarityCounts[animalConfig.rarity].found += 1;
                }
            }

            this.updateCollectionCard(`collection-${type}`, `collection-${type}-status`, discovered);
        });

        this.updateText("animals-total", CryptoZoo.formatNumber(animalsTotal));
        this.updateText("collection-found", foundCount);
        this.updateText("collection-total", Object.keys(animalsConfig).length);

        this.updateText("common-found", `${rarityCounts.common.found}/${rarityCounts.common.total}`);
        this.updateText("rare-found", `${rarityCounts.rare.found}/${rarityCounts.rare.total}`);
        this.updateText("epic-found", `${rarityCounts.epic.found}/${rarityCounts.epic.total}`);
    }
};
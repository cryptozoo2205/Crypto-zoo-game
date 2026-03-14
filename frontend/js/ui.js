window.CryptoZoo = window.CryptoZoo || {};

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
        const animals = state.animals || {
            monkey: { count: 0, level: 1 },
            panda: { count: 0, level: 1 },
            lion: { count: 0, level: 1 }
        };

        const monkeyCount = animals.monkey?.count || 0;
        const pandaCount = animals.panda?.count || 0;
        const lionCount = animals.lion?.count || 0;

        const monkeyLevel = animals.monkey?.level || 1;
        const pandaLevel = animals.panda?.level || 1;
        const lionLevel = animals.lion?.level || 1;

        this.updateText("coins-count", CryptoZoo.formatNumber(state.coins ?? 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level ?? 1));
        this.updateText("coins-per-click", CryptoZoo.formatNumber(state.coinsPerClick ?? 1));
        this.updateText("upgrade-cost", CryptoZoo.formatNumber(state.upgradeCost ?? 50));
        this.updateText("zoo-income", CryptoZoo.formatNumber(state.zooIncome ?? 0));

        const animalsTotal = monkeyCount + pandaCount + lionCount;
        this.updateText("animals-total", CryptoZoo.formatNumber(animalsTotal));

        this.updateText("monkey-count", CryptoZoo.formatNumber(monkeyCount));
        this.updateText("panda-count", CryptoZoo.formatNumber(pandaCount));
        this.updateText("lion-count", CryptoZoo.formatNumber(lionCount));

        this.updateText("monkey-level", CryptoZoo.formatNumber(monkeyLevel));
        this.updateText("panda-level", CryptoZoo.formatNumber(pandaLevel));
        this.updateText("lion-level", CryptoZoo.formatNumber(lionLevel));

        const monkeyUpgradeBtn = this.getEl("upgrade-monkey-btn");
        const pandaUpgradeBtn = this.getEl("upgrade-panda-btn");
        const lionUpgradeBtn = this.getEl("upgrade-lion-btn");

        if (monkeyUpgradeBtn && CryptoZoo.gameplay && CryptoZoo.gameplay.getAnimalUpgradeCost) {
            monkeyUpgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost("monkey"))})`;
        }

        if (pandaUpgradeBtn && CryptoZoo.gameplay && CryptoZoo.gameplay.getAnimalUpgradeCost) {
            pandaUpgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost("panda"))})`;
        }

        if (lionUpgradeBtn && CryptoZoo.gameplay && CryptoZoo.gameplay.getAnimalUpgradeCost) {
            lionUpgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost("lion"))})`;
        }

        const monkeyDiscovered = monkeyCount > 0;
        const pandaDiscovered = pandaCount > 0;
        const lionDiscovered = lionCount > 0;

        const foundCount =
            (monkeyDiscovered ? 1 : 0) +
            (pandaDiscovered ? 1 : 0) +
            (lionDiscovered ? 1 : 0);

        this.updateText("collection-found", foundCount);
        this.updateText("collection-total", 3);
        this.updateText("common-found", `${monkeyDiscovered ? 1 : 0}/1`);
        this.updateText("rare-found", `${pandaDiscovered ? 1 : 0}/1`);
        this.updateText("epic-found", `${lionDiscovered ? 1 : 0}/1`);

        this.updateCollectionCard("collection-monkey", "collection-monkey-status", monkeyDiscovered);
        this.updateCollectionCard("collection-panda", "collection-panda-status", pandaDiscovered);
        this.updateCollectionCard("collection-lion", "collection-lion-status", lionDiscovered);
    }
};
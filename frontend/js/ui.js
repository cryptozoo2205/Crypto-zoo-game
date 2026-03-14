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

        const target = document.getElementById(screenId);
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
        const container = document.getElementById("coin-animation-container");
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
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    getRarityBadgeClass(rarity) {
        if (rarity === "rare") return "rarity-rare";
        if (rarity === "epic") return "rarity-epic";
        return "rarity-common";
    },

    renderZooList() {
        const zooList = document.getElementById("zoo-list");
        if (!zooList) return;

        const animalsConfig = CryptoZoo.config.animals || {};
        const animalsState = CryptoZoo.state.animals || {};

        zooList.innerHTML = "";

        Object.keys(animalsConfig).forEach((type) => {
            const config = animalsConfig[type];
            const state = animalsState[type] || { count: 0, level: 1 };

            const row = document.createElement("div");
            row.className = "animal-row";

            row.innerHTML = `
                <div class="animal-left">
                    <div class="animal-icon">${config.icon || "🐾"}</div>
                    <div class="animal-text">
                        <div class="animal-topline">
                            <div class="animal-name">${config.name}</div>
                            <span class="rarity-badge ${this.getRarityBadgeClass(config.rarity)}">${config.rarity}</span>
                        </div>
                        <div class="animal-desc">Dochód ${config.baseIncome}/sek • Koszt ${CryptoZoo.formatNumber(config.buyCost)}</div>
                        <div class="animal-owned">
                            Posiadasz: <span id="${type}-count">${CryptoZoo.formatNumber(state.count)}</span>
                            • Poziom: <span id="${type}-level">${CryptoZoo.formatNumber(state.level)}</span>
                        </div>
                    </div>
                </div>
                <div class="animal-actions">
                    <button id="buy-${type}-btn" type="button">Kup</button>
                    <button id="upgrade-${type}-btn" type="button">Lvl Up</button>
                </div>
            `;

            zooList.appendChild(row);
        });
    },

    render() {
        const state = CryptoZoo.state || {};
        const animals = state.animals || {};
        const animalsConfig = CryptoZoo.config.animals || {};

        this.updateText("coins-count", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems-count", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("coins-per-click", CryptoZoo.formatNumber(state.coinsPerClick || 1));
        this.updateText("upgrade-cost", CryptoZoo.formatNumber(state.upgradeCost || 50));
        this.updateText("zoo-income", CryptoZoo.formatNumber(state.zooIncome || 0));

        let totalAnimals = 0;

        Object.keys(animalsConfig).forEach((type) => {
            const animal = animals[type] || { count: 0, level: 1 };
            totalAnimals += Number(animal.count) || 0;
        });

        this.updateText("animals-total", CryptoZoo.formatNumber(totalAnimals));
        this.renderZooList();

        Object.keys(animalsConfig).forEach((type) => {
            const animal = animals[type] || { count: 0, level: 1 };

            this.updateText(`${type}-count`, CryptoZoo.formatNumber(animal.count));
            this.updateText(`${type}-level`, CryptoZoo.formatNumber(animal.level));

            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);
            if (upgradeBtn && CryptoZoo.gameplay) {
                upgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost(type))})`;
            }
        });
    }
};
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {
    getEl(id) {
        return document.getElementById(id);
    },

    showToast(message) {
        let toast = this.getEl("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            document.body.appendChild(toast);
        }

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

        for (let i = 0; i < 10; i++) {
            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.random() * 200 - 100) + "px";
            const moveY = (-80 - Math.random() * 120) + "px";

            coin.style.left = "120px";
            coin.style.top = "120px";
            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            container.appendChild(coin);

            setTimeout(function () {
                coin.remove();
            }, 800);
        }
    },

    updateText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
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
                    <div class="animal-icon">
                        <img src="assets/animals/${config.asset}.png" alt="${config.name}">
                    </div>
                    <div class="animal-text">
                        <div class="animal-name">${config.name}</div>
                        <div class="animal-desc">
                            Dochód ${CryptoZoo.formatNumber(config.baseIncome)}/sek • Koszt ${CryptoZoo.formatNumber(config.buyCost)}
                        </div>
                        <div class="animal-owned">
                            Posiadasz: <span id="${type}-count">${CryptoZoo.formatNumber(state.count)}</span>
                            •
                            Poziom: <span id="${type}-level">${CryptoZoo.formatNumber(state.level)}</span>
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

    renderExpeditions() {
        const container = document.getElementById("expeditions-list");
        if (!container) return;

        container.innerHTML = "";

        const expedition = CryptoZoo.state.expedition;

        if (expedition) {
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - Date.now()) / 1000));

            container.innerHTML = `
                <div class="expedition-card">
                    <h3>Aktywna ekspedycja</h3>
                    <div>Pozostało: ${timeLeft}s</div>
                    <button id="collect-expedition-btn" type="button">Odbierz</button>
                </div>
            `;

            const collectBtn = document.getElementById("collect-expedition-btn");
            if (collectBtn) {
                collectBtn.onclick = function () {
                    CryptoZoo.gameplay.collectExpedition();
                };
            }

            return;
        }

        const expeditions = CryptoZoo.config.expeditions || [];

        expeditions.forEach((exp) => {
            const card = document.createElement("div");
            card.className = "expedition-card";

            card.innerHTML = `
                <h3>${exp.name}</h3>
                <div>Czas: ${exp.duration}s</div>
                <div>Nagroda: ${CryptoZoo.formatNumber(exp.rewardCoins)} coins + ${CryptoZoo.formatNumber(exp.rewardGems)} gems</div>
                <button id="start-expedition-${exp.id}" type="button">Start</button>
            `;

            container.appendChild(card);
        });

        expeditions.forEach((exp) => {
            const btn = document.getElementById(`start-expedition-${exp.id}`);
            if (btn) {
                btn.onclick = function () {
                    CryptoZoo.gameplay.startExpedition(exp.id);
                };
            }
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
        this.renderExpeditions();

        Object.keys(animalsConfig).forEach((type) => {
            const animal = animals[type] || { count: 0, level: 1 };

            this.updateText(`${type}-count`, CryptoZoo.formatNumber(animal.count));
            this.updateText(`${type}-level`, CryptoZoo.formatNumber(animal.level));

            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);
            if (upgradeBtn && CryptoZoo.gameplay) {
                upgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost(type))})`;
            }
        });

        if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.bindAnimalButtons === "function") {
            CryptoZoo.gameplay.bindAnimalButtons();
        }
    }
};
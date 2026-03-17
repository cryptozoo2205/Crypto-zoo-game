window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {
    showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.style.display = "none";
        }, 1800);
    },

    animateCoin() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        const coin = document.createElement("div");
        coin.textContent = "🪙";
        coin.style.position = "absolute";
        coin.style.left = "50%";
        coin.style.top = "50%";
        coin.style.transform = "translate(-50%, -50%)";
        coin.style.fontSize = "28px";
        coin.style.pointerEvents = "none";
        coin.style.zIndex = "20";
        coin.style.transition = "all 0.8s ease";
        coin.style.opacity = "1";

        tapButton.parentElement.style.position = "relative";
        tapButton.parentElement.appendChild(coin);

        requestAnimationFrame(() => {
            coin.style.top = "10%";
            coin.style.opacity = "0";
        });

        setTimeout(() => {
            coin.remove();
        }, 850);
    },

    updateText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    formatTimeLeft(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const hours = Math.floor(safe / 3600);
        const minutes = Math.floor((safe % 3600) / 60);
        const secs = safe % 60;

        const hh = String(hours).padStart(2, "0");
        const mm = String(minutes).padStart(2, "0");
        const ss = String(secs).padStart(2, "0");

        return `${hh}:${mm}:${ss}`;
    },

    renderZooList() {
        const zooList = document.getElementById("zooList");
        if (!zooList) return;

        const animalsConfig = CryptoZoo.config?.animals || {};
        const animalsState = CryptoZoo.state?.animals || {};

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

        if (CryptoZoo.gameplay && typeof CryptoZoo.gameplay.bindAnimalButtons === "function") {
            CryptoZoo.gameplay.bindAnimalButtons();
        }
    },

    renderExpeditions() {
        const container = document.getElementById("missionsList");
        if (!container) return;

        container.innerHTML = "";

        const expedition = CryptoZoo.state?.expedition;

        if (expedition) {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
            const canCollect = timeLeft <= 0;

            const rarityLabel =
                expedition.rewardRarity === "epic"
                    ? "Epicka"
                    : expedition.rewardRarity === "rare"
                    ? "Rzadka"
                    : "Zwykła";

            container.innerHTML = `
                <div class="expedition-card">
                    <h3>Aktywna ekspedycja: ${expedition.name}</h3>
                    <div>Pozostało: ${this.formatTimeLeft(timeLeft)}</div>
                    <div>Jakość nagrody: ${rarityLabel}</div>
                    <div>
                        Przewidywana nagroda:
                        ${CryptoZoo.formatNumber(expedition.rewardCoins)} coins
                        +
                        ${CryptoZoo.formatNumber(expedition.rewardGems)} gems
                    </div>
                    <button id="collect-expedition-btn" type="button" ${canCollect ? "" : "disabled"}>
                        ${canCollect ? "Odbierz nagrodę" : "Trwa ekspedycja"}
                    </button>
                </div>
            `;

            const collectBtn = document.getElementById("collect-expedition-btn");
            if (collectBtn) {
                collectBtn.onclick = function () {
                    CryptoZoo.gameplay?.collectExpedition?.();
                };
            }

            return;
        }

        const expeditions = CryptoZoo.config?.expeditions || [];

        expeditions.forEach((exp) => {
            const card = document.createElement("div");
            card.className = "expedition-card";

            card.innerHTML = `
                <h3>${exp.name}</h3>
                <div>Czas: ${this.formatTimeLeft(exp.duration)}</div>
                <div>
                    Nagroda bazowa:
                    ${CryptoZoo.formatNumber(exp.baseCoins)} coins
                    +
                    ${CryptoZoo.formatNumber(exp.baseGems)} gems
                </div>
                <div>
                    Szansa na bonus:
                    Rare ${(exp.rareChance * 100).toFixed(0)}%
                    /
                    Epic ${(exp.epicChance * 100).toFixed(0)}%
                </div>
                <button id="start-expedition-${exp.id}" type="button">Start</button>
            `;

            container.appendChild(card);
        });

        expeditions.forEach((exp) => {
            const btn = document.getElementById(`start-expedition-${exp.id}`);
            if (btn) {
                btn.onclick = function () {
                    CryptoZoo.gameplay?.startExpedition?.(exp.id);
                };
            }
        });
    },

    render() {
        const state = CryptoZoo.state || {};

        this.updateText("coins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("rewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));

        this.renderZooList();
        this.renderExpeditions();
    }
};
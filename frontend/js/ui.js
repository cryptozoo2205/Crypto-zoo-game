window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {
    toastTimeout: null,

    showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.style.position = "fixed";
            toast.style.left = "50%";
            toast.style.bottom = "96px";
            toast.style.transform = "translateX(-50%)";
            toast.style.background = "rgba(10, 18, 35, 0.92)";
            toast.style.color = "#ffffff";
            toast.style.padding = "12px 18px";
            toast.style.borderRadius = "14px";
            toast.style.zIndex = "2000";
            toast.style.display = "none";
            toast.style.boxShadow = "0 8px 28px rgba(0, 0, 0, 0.28)";
            toast.style.border = "1px solid rgba(255,255,255,0.08)";
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
        if (!tapButton || !tapButton.parentElement) return;

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
                            Posiadasz: ${CryptoZoo.formatNumber(state.count)} • Poziom: ${CryptoZoo.formatNumber(state.level)}
                        </div>
                    </div>
                </div>

                <div class="animal-actions">
                    <button id="buy-${type}-btn" type="button">Kup</button>
                    <button id="upgrade-${type}-btn" type="button">Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay?.getAnimalUpgradeCost?.(type) || 0)})</button>
                </div>
            `;

            zooList.appendChild(row);
        });

        CryptoZoo.gameplay?.bindAnimalButtons?.();
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
                        ${CryptoZoo.formatNumber(expedition.rewardCoins)} coins +
                        ${CryptoZoo.formatNumber(expedition.rewardGems)} gems
                    </div>
                    <button id="collect-expedition-btn" type="button" ${canCollect ? "" : "disabled"}>
                        ${canCollect ? "Odbierz nagrodę" : "Trwa ekspedycja"}
                    </button>
                </div>
            `;

            document.getElementById("collect-expedition-btn")?.addEventListener("click", () => {
                CryptoZoo.gameplay?.collectExpedition?.();
            });

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
                    ${CryptoZoo.formatNumber(exp.baseCoins)} coins +
                    ${CryptoZoo.formatNumber(exp.baseGems)} gems
                </div>
                <div>
                    Szansa na bonus:
                    Rare ${(exp.rareChance * 100).toFixed(0)}% /
                    Epic ${(exp.epicChance * 100).toFixed(0)}%
                </div>
                <button id="start-expedition-${exp.id}" type="button">Start</button>
            `;

            container.appendChild(card);
        });

        expeditions.forEach((exp) => {
            document.getElementById(`start-expedition-${exp.id}`)?.addEventListener("click", () => {
                CryptoZoo.gameplay?.startExpedition?.(exp.id);
            });
        });
    },

    renderShopItems() {
        const shopList = document.getElementById("shopList");
        if (!shopList) return;

        shopList.innerHTML = "";

        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "shop-item";

            card.innerHTML = `
                <h3>${item.name}</h3>
                <div>${item.desc}</div>
                <div>Koszt: ${CryptoZoo.formatNumber(item.price)} coins</div>
                <button id="buy-shop-${item.id}" type="button">Kup</button>
            `;

            shopList.appendChild(card);
        });

        CryptoZoo.gameplay?.bindShopButtons?.();
    },

    renderBoxes() {
        const container = document.getElementById("boxesList");
        if (!container) return;

        const boxes = CryptoZoo.state?.boxes || {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };

        container.innerHTML = `
            <div class="shop-item">
                <h3>Common Box</h3>
                <div>Posiadasz: ${CryptoZoo.formatNumber(boxes.common || 0)}</div>
                <button id="open-box-common" type="button">Otwórz</button>
            </div>

            <div class="shop-item">
                <h3>Rare Box</h3>
                <div>Posiadasz: ${CryptoZoo.formatNumber(boxes.rare || 0)}</div>
                <button id="open-box-rare" type="button">Otwórz</button>
            </div>

            <div class="shop-item">
                <h3>Epic Box</h3>
                <div>Posiadasz: ${CryptoZoo.formatNumber(boxes.epic || 0)}</div>
                <button id="open-box-epic" type="button">Otwórz</button>
            </div>

            <div class="shop-item">
                <h3>Legendary Box</h3>
                <div>Posiadasz: ${CryptoZoo.formatNumber(boxes.legendary || 0)}</div>
                <button id="open-box-legendary" type="button">Otwórz</button>
            </div>
        `;

        document.getElementById("open-box-common")?.addEventListener("click", () => CryptoZoo.boxes?.open?.("common"));
        document.getElementById("open-box-rare")?.addEventListener("click", () => CryptoZoo.boxes?.open?.("rare"));
        document.getElementById("open-box-epic")?.addEventListener("click", () => CryptoZoo.boxes?.open?.("epic"));
        document.getElementById("open-box-legendary")?.addEventListener("click", () => CryptoZoo.boxes?.open?.("legendary"));
    },

    async renderRanking() {
        const rankingList = document.getElementById("rankingList");
        if (!rankingList) return;

        rankingList.innerHTML = "<li>Ładowanie rankingu...</li>";

        try {
            const ranking = await CryptoZoo.api?.loadRanking?.();
            rankingList.innerHTML = "";

            const safeRanking = Array.isArray(ranking) ? ranking : [];

            if (!safeRanking.length) {
                rankingList.innerHTML = "<li>Brak danych rankingu</li>";
                return;
            }

            safeRanking.forEach((row, index) => {
                const li = document.createElement("li");
                li.textContent = `${index + 1}. ${row.username || row.name || "Gracz"} — ${CryptoZoo.formatNumber(row.coins || 0)} coins`;
                rankingList.appendChild(li);
            });
        } catch (error) {
            console.error("Ranking render error:", error);
            rankingList.innerHTML = "<li>Błąd ładowania rankingu</li>";
        }
    },

    render() {
        const state = CryptoZoo.state || {};

        this.updateText("coins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("rewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("coinsPerClick", CryptoZoo.formatNumber(state.coinsPerClick || 1));
        this.updateText("zooIncome", CryptoZoo.formatNumber(state.zooIncome || 0));

        this.renderZooList();
        this.renderExpeditions();
        this.renderShopItems();
        this.renderBoxes();
        this.renderRanking();
    }
};
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

        const area = tapButton.parentElement;
        area.style.position = "relative";

        const clickValue =
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1;

        const pop = document.createElement("div");
        pop.className = "coin-pop";
        pop.textContent = "+" + CryptoZoo.formatNumber(clickValue);

        const offsetX = Math.floor(Math.random() * 80) - 40;
        const offsetY = -90 - Math.floor(Math.random() * 30);

        pop.style.left = "50%";
        pop.style.top = "50%";
        pop.style.setProperty("--moveX", offsetX + "px");
        pop.style.setProperty("--moveY", offsetY + "px");

        area.appendChild(pop);

        requestAnimationFrame(() => {
            pop.classList.add("animate");
        });

        setTimeout(() => {
            pop.remove();
        }, 900);
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

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    },

    bindClick(id, handler) {
        document.getElementById(id)?.addEventListener("click", handler);
    },

    bindHomeButtons() {
        const boostBtn = document.getElementById("homeBoostBtn");
        if (boostBtn && !boostBtn.dataset.bound) {
            boostBtn.dataset.bound = "1";
            boostBtn.addEventListener("click", () => {
                const shopButton = document.querySelector('[data-nav="shop"]');
                if (shopButton) {
                    shopButton.click();
                    return;
                }

                if (CryptoZoo.gameplay?.showScreen) {
                    CryptoZoo.gameplay.showScreen("shop");
                }
            });
        }

        const zooPreviewBtn = document.getElementById("homeZooPreviewBtn");
        if (zooPreviewBtn && !zooPreviewBtn.dataset.bound) {
            zooPreviewBtn.dataset.bound = "1";
            zooPreviewBtn.addEventListener("click", () => {
                const zooButton = document.querySelector('[data-nav="zoo"]');
                if (zooButton) {
                    zooButton.click();
                    return;
                }

                if (CryptoZoo.gameplay?.showScreen) {
                    CryptoZoo.gameplay.showScreen("zoo");
                }
            });
        }
    },

    renderHomeOverview() {
        const state = CryptoZoo.state || {};
        const animals = state.animals || {};

        this.updateText("coins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("rewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("coinsPerClick", CryptoZoo.formatNumber(state.coinsPerClick || 1));
        this.updateText("zooIncome", CryptoZoo.formatNumber(state.zooIncome || 0));

        this.updateText("homeCoins", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("homeGems", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("homeRewardBalance", CryptoZoo.formatNumber(state.rewardBalance || 0));
        this.updateText("homeLevel", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("homeCoinsPerClick", CryptoZoo.formatNumber(state.coinsPerClick || 1));
        this.updateText("homeZooIncome", CryptoZoo.formatNumber(state.zooIncome || 0));
        this.updateText("homeIncomeStripValue", CryptoZoo.formatNumber(state.zooIncome || 0));

        this.updateText("homeMonkeyCount", CryptoZoo.formatNumber(animals.monkey?.count || 0));
        this.updateText("homeMonkeyLevel", CryptoZoo.formatNumber(animals.monkey?.level || 1));

        this.updateText("homePandaCount", CryptoZoo.formatNumber(animals.panda?.count || 0));
        this.updateText("homePandaLevel", CryptoZoo.formatNumber(animals.panda?.level || 1));

        this.updateText("homeLionCount", CryptoZoo.formatNumber(animals.lion?.count || 0));
        this.updateText("homeLionLevel", CryptoZoo.formatNumber(animals.lion?.level || 1));

        this.bindHomeButtons();
    },

    renderZooList() {
        const zooList = document.getElementById("zooList");
        if (!zooList) return;

        const animalsConfig = CryptoZoo.config?.animals || {};
        const animalsState = CryptoZoo.state?.animals || {};

        zooList.innerHTML = Object.keys(animalsConfig).map((type) => {
            const config = animalsConfig[type];
            const state = animalsState[type] || { count: 0, level: 1 };
            const upgradeCost = CryptoZoo.gameplay?.getAnimalUpgradeCost?.(type) || 0;

            return `
                <div class="animal-row">
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
                        <button id="upgrade-${type}-btn" type="button">Lvl Up (${CryptoZoo.formatNumber(upgradeCost)})</button>
                    </div>
                </div>
            `;
        }).join("");

        CryptoZoo.gameplay?.bindAnimalButtons?.();
    },

    renderExpeditions() {
        const container = document.getElementById("missionsList");
        if (!container) return;

        const expedition = CryptoZoo.state?.expedition;

        if (expedition) {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
            const canCollect = timeLeft <= 0;

            const rarityMap = {
                common: "Zwykła",
                rare: "Rzadka",
                epic: "Epicka"
            };

            container.innerHTML = `
                <div class="expedition-card">
                    <h3>Aktywna ekspedycja: ${expedition.name}</h3>
                    <div>Pozostało: ${this.formatTimeLeft(timeLeft)}</div>
                    <div>Jakość nagrody: ${rarityMap[expedition.rewardRarity] || "Zwykła"}</div>
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

            this.bindClick("collect-expedition-btn", () => {
                CryptoZoo.gameplay?.collectExpedition?.();
            });

            return;
        }

        const expeditions = CryptoZoo.config?.expeditions || [];

        container.innerHTML = expeditions.map((exp) => `
            <div class="expedition-card">
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
            </div>
        `).join("");

        expeditions.forEach((exp) => {
            this.bindClick(`start-expedition-${exp.id}`, () => {
                CryptoZoo.gameplay?.startExpedition?.(exp.id);
            });
        });
    },

    renderShopItems() {
        const shopList = document.getElementById("shopList");
        if (!shopList) return;

        const items = CryptoZoo.config?.shopItems || [];

        shopList.innerHTML = items.map((item) => `
            <div class="shop-item">
                <h3>${item.name}</h3>
                <div>${item.desc}</div>
                <div>Koszt: ${CryptoZoo.formatNumber(item.price)} coins</div>
                <button id="buy-shop-${item.id}" type="button">Kup</button>
            </div>
        `).join("");

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

        const types = [
            { key: "common", label: "Common Box" },
            { key: "rare", label: "Rare Box" },
            { key: "epic", label: "Epic Box" },
            { key: "legendary", label: "Legendary Box" }
        ];

        container.innerHTML = types.map((box) => `
            <div class="shop-item">
                <h3>${box.label}</h3>
                <div>Posiadasz: ${CryptoZoo.formatNumber(boxes[box.key] || 0)}</div>
                <button id="open-box-${box.key}" type="button">Otwórz</button>
            </div>
        `).join("");

        types.forEach((box) => {
            this.bindClick(`open-box-${box.key}`, () => {
                CryptoZoo.boxes?.open?.(box.key);
            });
        });
    },

    async renderRanking() {
        const rankingList = document.getElementById("rankingList");
        if (!rankingList) return;

        rankingList.innerHTML = "<li>Ładowanie rankingu...</li>";

        try {
            const ranking = await CryptoZoo.api?.loadRanking?.();
            const safeRanking = Array.isArray(ranking) ? ranking : [];

            if (!safeRanking.length) {
                rankingList.innerHTML = "<li>Brak danych rankingu</li>";
                return;
            }

            rankingList.innerHTML = safeRanking.map((row, index) => `
                <li>${index + 1}. ${row.username || row.name || "Gracz"} — ${CryptoZoo.formatNumber(row.coins || 0)} coins</li>
            `).join("");
        } catch (error) {
            console.error("Ranking render error:", error);
            rankingList.innerHTML = "<li>Błąd ładowania rankingu</li>";
        }
    },

    render() {
        this.renderHomeOverview();
        this.renderZooList();
        this.renderExpeditions();
        this.renderShopItems();
        this.renderBoxes();
        this.renderRanking();
    }
};
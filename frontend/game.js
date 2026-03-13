document.addEventListener("DOMContentLoaded", function () {
    let coins = 0;
    let level = 1;
    let coinsPerClick = 1;
    let upgradeCost = 50;
    let zooIncome = 0;

    let animals = {
        monkey: { count: 0, level: 1 },
        panda: { count: 0, level: 1 },
        lion: { count: 0, level: 1 }
    };

    const ANIMAL_CONFIG = {
        monkey: {
            buyName: "małpę",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150,
            rarityMultiplier: 1.0
        },
        panda: {
            buyName: "pandę",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600,
            rarityMultiplier: 1.5
        },
        lion: {
            buyName: "lwa",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800,
            rarityMultiplier: 2.5
        }
    };

    const telegramId = localStorage.getItem("telegramId") || String(Date.now());
    localStorage.setItem("telegramId", telegramId);

    const coinsCount = document.getElementById("coins-count");
    const levelSpan = document.getElementById("level");
    const coinsPerClickSpan = document.getElementById("coins-per-click");
    const upgradeCostSpan = document.getElementById("upgrade-cost");
    const zooIncomeSpan = document.getElementById("zoo-income");
    const animalsTotalSpan = document.getElementById("animals-total");

    const monkeyCountSpan = document.getElementById("monkey-count");
    const pandaCountSpan = document.getElementById("panda-count");
    const lionCountSpan = document.getElementById("lion-count");

    const monkeyLevelSpan = document.getElementById("monkey-level");
    const pandaLevelSpan = document.getElementById("panda-level");
    const lionLevelSpan = document.getElementById("lion-level");

    const collectionFoundSpan = document.getElementById("collection-found");
    const collectionTotalSpan = document.getElementById("collection-total");
    const commonFoundSpan = document.getElementById("common-found");
    const rareFoundSpan = document.getElementById("rare-found");
    const epicFoundSpan = document.getElementById("epic-found");

    const collectionMonkeyCard = document.getElementById("collection-monkey");
    const collectionPandaCard = document.getElementById("collection-panda");
    const collectionLionCard = document.getElementById("collection-lion");

    const collectionMonkeyStatus = document.getElementById("collection-monkey-status");
    const collectionPandaStatus = document.getElementById("collection-panda-status");
    const collectionLionStatus = document.getElementById("collection-lion-status");

    const tapBtn = document.getElementById("tap-btn");
    const buyUpgradeBtn = document.getElementById("buy-upgrade-btn");
    const buyMonkeyBtn = document.getElementById("buy-monkey-btn");
    const buyPandaBtn = document.getElementById("buy-panda-btn");
    const buyLionBtn = document.getElementById("buy-lion-btn");

    const upgradeMonkeyBtn = document.getElementById("upgrade-monkey-btn");
    const upgradePandaBtn = document.getElementById("upgrade-panda-btn");
    const upgradeLionBtn = document.getElementById("upgrade-lion-btn");

    const navButtons = document.querySelectorAll(".nav-btn");
    const screens = document.querySelectorAll(".screen");
    const rankingList = document.getElementById("ranking-list");
    const coinAnimationContainer = document.getElementById("coin-animation-container");
    const toast = document.getElementById("toast");

    function normalizeAnimal(value) {
        if (typeof value === "number") {
            return { count: value, level: 1 };
        }

        return {
            count: Number(value && value.count) || 0,
            level: Number(value && value.level) || 1
        };
    }

    function normalizeAnimals() {
        animals = {
            monkey: normalizeAnimal(animals.monkey),
            panda: normalizeAnimal(animals.panda),
            lion: normalizeAnimal(animals.lion)
        };
    }

    function showToast(message) {
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(function () {
            toast.style.display = "none";
        }, 2200);
    }

    function showScreen(screenId) {
        screens.forEach(function (screen) {
            screen.classList.remove("active-screen");
        });

        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add("active-screen");
        }
    }

    function animateCoinsBurst() {
        if (!coinAnimationContainer) return;

        for (let i = 0; i < 8; i++) {
            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.floor(Math.random() * 220) - 110) + "px";
            const moveY = (-70 - Math.floor(Math.random() * 140)) + "px";

            coin.style.left = "129px";
            coin.style.top = "85px";
            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            coinAnimationContainer.appendChild(coin);

            setTimeout(function () {
                coin.remove();
            }, 900);
        }
    }

    function updateLevel() {
        level = Math.floor(coins / 25) + 1;
    }

    function getAnimalIncome(animalKey) {
        const animal = animals[animalKey];
        const config = ANIMAL_CONFIG[animalKey];
        return animal.count * animal.level * config.baseIncome * config.rarityMultiplier;
    }

    function updateZooIncome() {
        zooIncome =
            getAnimalIncome("monkey") +
            getAnimalIncome("panda") +
            getAnimalIncome("lion");

        zooIncome = Math.floor(zooIncome);
    }

    function getAnimalsTotal() {
        return animals.monkey.count + animals.panda.count + animals.lion.count;
    }

    function getCollectionFoundCount() {
        let found = 0;
        if (animals.monkey.count > 0) found += 1;
        if (animals.panda.count > 0) found += 1;
        if (animals.lion.count > 0) found += 1;
        return found;
    }

    function getAnimalUpgradeCost(animalKey) {
        return ANIMAL_CONFIG[animalKey].upgradeBaseCost * animals[animalKey].level;
    }

    function updateCollectionCard(card, statusEl, discovered) {
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
    }

    function updateCollectionUI() {
        const monkeyDiscovered = animals.monkey.count > 0;
        const pandaDiscovered = animals.panda.count > 0;
        const lionDiscovered = animals.lion.count > 0;

        if (collectionFoundSpan) collectionFoundSpan.textContent = getCollectionFoundCount();
        if (collectionTotalSpan) collectionTotalSpan.textContent = 3;
        if (commonFoundSpan) commonFoundSpan.textContent = `${monkeyDiscovered ? 1 : 0}/1`;
        if (rareFoundSpan) rareFoundSpan.textContent = `${pandaDiscovered ? 1 : 0}/1`;
        if (epicFoundSpan) epicFoundSpan.textContent = `${lionDiscovered ? 1 : 0}/1`;

        updateCollectionCard(collectionMonkeyCard, collectionMonkeyStatus, monkeyDiscovered);
        updateCollectionCard(collectionPandaCard, collectionPandaStatus, pandaDiscovered);
        updateCollectionCard(collectionLionCard, collectionLionStatus, lionDiscovered);
    }

    function updateUI() {
        if (coinsCount) coinsCount.textContent = coins;
        if (levelSpan) levelSpan.textContent = level;
        if (coinsPerClickSpan) coinsPerClickSpan.textContent = coinsPerClick;
        if (upgradeCostSpan) upgradeCostSpan.textContent = upgradeCost;
        if (zooIncomeSpan) zooIncomeSpan.textContent = zooIncome;
        if (animalsTotalSpan) animalsTotalSpan.textContent = getAnimalsTotal();

        if (monkeyCountSpan) monkeyCountSpan.textContent = animals.monkey.count;
        if (pandaCountSpan) pandaCountSpan.textContent = animals.panda.count;
        if (lionCountSpan) lionCountSpan.textContent = animals.lion.count;

        if (monkeyLevelSpan) monkeyLevelSpan.textContent = animals.monkey.level;
        if (pandaLevelSpan) pandaLevelSpan.textContent = animals.panda.level;
        if (lionLevelSpan) lionLevelSpan.textContent = animals.lion.level;

        if (upgradeMonkeyBtn) {
            upgradeMonkeyBtn.textContent = `Lvl Up (${getAnimalUpgradeCost("monkey")})`;
        }
        if (upgradePandaBtn) {
            upgradePandaBtn.textContent = `Lvl Up (${getAnimalUpgradeCost("panda")})`;
        }
        if (upgradeLionBtn) {
            upgradeLionBtn.textContent = `Lvl Up (${getAnimalUpgradeCost("lion")})`;
        }

        updateCollectionUI();
    }

    async function savePlayer() {
        try {
            await fetch("/player/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telegramId: telegramId,
                    username: `Gracz_${telegramId}`,
                    coins: coins,
                    level: level,
                    coinsPerClick: coinsPerClick,
                    upgradeCost: upgradeCost,
                    animals: animals,
                    lastLogin: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error("Błąd zapisu gracza:", error);
        }
    }

    async function loadPlayer() {
        try {
            const response = await fetch(`/player/${telegramId}`);
            const user = await response.json();

            coins = Number(user.coins) || 0;
            level = Number(user.level) || 1;
            coinsPerClick = Number(user.coinsPerClick) || 1;
            upgradeCost = Number(user.upgradeCost) || 50;
            animals = user.animals || {
                monkey: { count: 0, level: 1 },
                panda: { count: 0, level: 1 },
                lion: { count: 0, level: 1 }
            };

            normalizeAnimals();
            updateZooIncome();

            if (user.lastLogin) {
                const last = new Date(user.lastLogin).getTime();
                const now = Date.now();

                let secondsOffline = Math.floor((now - last) / 1000);
                const maxOfflineSeconds = 86400;

                if (secondsOffline > maxOfflineSeconds) {
                    secondsOffline = maxOfflineSeconds;
                }

                const offlineCoins = secondsOffline * zooIncome;

                if (offlineCoins > 0) {
                    coins += offlineCoins;
                    showToast(`Zarobiłeś offline: ${offlineCoins} monet`);
                }
            }

            updateLevel();
            updateUI();
            await savePlayer();
        } catch (error) {
            console.error("Błąd pobierania gracza:", error);
        }
    }

    async function loadRanking() {
        try {
            const response = await fetch("/ranking");
            const ranking = await response.json();

            if (!rankingList) return;

            rankingList.innerHTML = "";

            ranking.forEach(function (player, index) {
                const li = document.createElement("li");
                li.textContent = `${index + 1}. ${player.username} — ${player.coins} monet`;
                rankingList.appendChild(li);
            });
        } catch (error) {
            console.error("Błąd pobierania rankingu:", error);
        }
    }

    async function buyAnimal(animalKey) {
        const config = ANIMAL_CONFIG[animalKey];

        if (coins < config.buyCost) {
            showToast(`Za mało monet na ${config.buyName}.`);
            return;
        }

        coins -= config.buyCost;
        animals[animalKey].count += 1;

        updateZooIncome();
        updateLevel();
        updateUI();
        await savePlayer();
        showToast(`Kupiono ${config.buyName}.`);
    }

    async function upgradeAnimal(animalKey) {
        const cost = getAnimalUpgradeCost(animalKey);

        if (animals[animalKey].count <= 0) {
            showToast("Najpierw musisz kupić to zwierzę.");
            return;
        }

        if (coins < cost) {
            showToast("Za mało monet na ulepszenie zwierzęcia.");
            return;
        }

        coins -= cost;
        animals[animalKey].level += 1;

        updateZooIncome();
        updateLevel();
        updateUI();
        await savePlayer();
        showToast("Ulepszono zwierzę.");
    }

    navButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const screenId = btn.dataset.screen;
            showScreen(screenId);

            if (screenId === "ranking") {
                loadRanking();
            }
        });
    });

    if (tapBtn) {
        tapBtn.addEventListener("click", async function () {
            coins += coinsPerClick;
            updateLevel();
            updateUI();
            animateCoinsBurst();
            await savePlayer();
        });
    }

    if (buyUpgradeBtn) {
        buyUpgradeBtn.addEventListener("click", async function () {
            if (coins < upgradeCost) {
                showToast("Za mało monet na ulepszenie.");
                return;
            }

            coins -= upgradeCost;
            coinsPerClick += 1;
            upgradeCost = Math.floor(upgradeCost * 1.8);

            updateLevel();
            updateUI();
            await savePlayer();
            showToast("Kupiono ulepszenie kliknięcia.");
        });
    }

    if (buyMonkeyBtn) {
        buyMonkeyBtn.addEventListener("click", async function () {
            await buyAnimal("monkey");
        });
    }

    if (buyPandaBtn) {
        buyPandaBtn.addEventListener("click", async function () {
            await buyAnimal("panda");
        });
    }

    if (buyLionBtn) {
        buyLionBtn.addEventListener("click", async function () {
            await buyAnimal("lion");
        });
    }

    if (upgradeMonkeyBtn) {
        upgradeMonkeyBtn.addEventListener("click", async function () {
            await upgradeAnimal("monkey");
        });
    }

    if (upgradePandaBtn) {
        upgradePandaBtn.addEventListener("click", async function () {
            await upgradeAnimal("panda");
        });
    }

    if (upgradeLionBtn) {
        upgradeLionBtn.addEventListener("click", async function () {
            await upgradeAnimal("lion");
        });
    }

    setInterval(async function () {
        if (zooIncome > 0) {
            coins += zooIncome;
            updateLevel();
            updateUI();
            await savePlayer();
        }
    }, 1000);

    async function initGame() {
        await loadPlayer();
        await loadRanking();
        showScreen("game");
    }

    initGame();
});
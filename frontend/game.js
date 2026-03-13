document.addEventListener("DOMContentLoaded", function () {
    let coins = 0;
    let level = 1;
    let coinsPerClick = 1;
    let upgradeCost = 50;

    let animals = {
        monkey: 0,
        panda: 0,
        lion: 0
    };

    let zooIncome = 0;

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

    const tapBtn = document.getElementById("tap-btn");
    const buyUpgradeBtn = document.getElementById("buy-upgrade-btn");
    const buyMonkeyBtn = document.getElementById("buy-monkey-btn");
    const buyPandaBtn = document.getElementById("buy-panda-btn");
    const buyLionBtn = document.getElementById("buy-lion-btn");

    const navButtons = document.querySelectorAll(".nav-btn");
    const screens = document.querySelectorAll(".screen");
    const rankingList = document.getElementById("ranking-list");
    const coinAnimationContainer = document.getElementById("coin-animation-container");
    const toast = document.getElementById("toast");

    function showToast(message) {
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(function () {
            toast.style.display = "none";
        }, 1800);
    }

    function updateZooIncome() {
        zooIncome = (animals.monkey * 1) + (animals.panda * 3) + (animals.lion * 8);
    }

    function getAnimalsTotal() {
        return (animals.monkey || 0) + (animals.panda || 0) + (animals.lion || 0);
    }

    function updateLevel() {
        level = Math.floor(coins / 25) + 1;
    }

    function updateUI() {
        if (coinsCount) coinsCount.textContent = coins;
        if (levelSpan) levelSpan.textContent = level;
        if (coinsPerClickSpan) coinsPerClickSpan.textContent = coinsPerClick;
        if (upgradeCostSpan) upgradeCostSpan.textContent = upgradeCost;
        if (zooIncomeSpan) zooIncomeSpan.textContent = zooIncome;
        if (animalsTotalSpan) animalsTotalSpan.textContent = getAnimalsTotal();

        if (monkeyCountSpan) monkeyCountSpan.textContent = animals.monkey || 0;
        if (pandaCountSpan) pandaCountSpan.textContent = animals.panda || 0;
        if (lionCountSpan) lionCountSpan.textContent = animals.lion || 0;
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

    async function savePlayer() {
        try {
            await fetch("/player/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    telegramId,
                    username: `Gracz_${telegramId}`,
                    coins,
                    level,
                    coinsPerClick,
                    upgradeCost,
                    animals
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

            coins = user.coins || 0;
            level = user.level || 1;
            coinsPerClick = user.coinsPerClick || 1;
            upgradeCost = user.upgradeCost || 50;
            animals = user.animals || { monkey: 0, panda: 0, lion: 0 };

            updateZooIncome();
            updateUI();
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
            if (coins < 100) {
                showToast("Za mało monet na małpę.");
                return;
            }

            coins -= 100;
            animals.monkey += 1;
            updateZooIncome();
            updateLevel();
            updateUI();
            await savePlayer();
            showToast("Kupiono małpę.");
        });
    }

    if (buyPandaBtn) {
        buyPandaBtn.addEventListener("click", async function () {
            if (coins < 400) {
                showToast("Za mało monet na pandę.");
                return;
            }

            coins -= 400;
            animals.panda += 1;
            updateZooIncome();
            updateLevel();
            updateUI();
            await savePlayer();
            showToast("Kupiono pandę.");
        });
    }

    if (buyLionBtn) {
        buyLionBtn.addEventListener("click", async function () {
            if (coins < 1200) {
                showToast("Za mało monet na lwa.");
                return;
            }

            coins -= 1200;
            animals.lion += 1;
            updateZooIncome();
            updateLevel();
            updateUI();
            await savePlayer();
            showToast("Kupiono lwa.");
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
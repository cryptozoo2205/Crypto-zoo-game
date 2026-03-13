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

    const coinsCount = document.getElementById("coins-count");
    const levelSpan = document.getElementById("level");
    const coinsPerClickSpan = document.getElementById("coins-per-click");
    const upgradeCostSpan = document.getElementById("upgrade-cost");
    const zooIncomeSpan = document.getElementById("zoo-income");

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

    function updateLevel() {
        level = Math.floor(coins / 25) + 1;
    }

    function updateUI() {
        if (coinsCount) coinsCount.textContent = coins;
        if (levelSpan) levelSpan.textContent = level;
        if (coinsPerClickSpan) coinsPerClickSpan.textContent = coinsPerClick;
        if (upgradeCostSpan) upgradeCostSpan.textContent = upgradeCost;
        if (zooIncomeSpan) zooIncomeSpan.textContent = zooIncome;
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

    navButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const screenId = btn.dataset.screen;
            showScreen(screenId);
        });
    });

    if (tapBtn) {
        tapBtn.addEventListener("click", function () {
            coins += coinsPerClick;
            updateLevel();
            updateUI();
            animateCoinsBurst();
        });
    }

    if (buyUpgradeBtn) {
        buyUpgradeBtn.addEventListener("click", function () {
            if (coins < upgradeCost) {
                showToast("Za mało monet na ulepszenie.");
                return;
            }

            coins -= upgradeCost;
            coinsPerClick += 1;
            upgradeCost = Math.floor(upgradeCost * 1.8);

            updateLevel();
            updateUI();
            showToast("Kupiono ulepszenie kliknięcia.");
        });
    }

    if (buyMonkeyBtn) {
        buyMonkeyBtn.addEventListener("click", function () {
            if (coins < 100) {
                showToast("Za mało monet na małpę.");
                return;
            }

            coins -= 100;
            animals.monkey += 1;
            updateZooIncome();
            updateLevel();
            updateUI();
            showToast("Kupiono małpę.");
        });
    }

    if (buyPandaBtn) {
        buyPandaBtn.addEventListener("click", function () {
            if (coins < 400) {
                showToast("Za mało monet na pandę.");
                return;
            }

            coins -= 400;
            animals.panda += 1;
            updateZooIncome();
            updateLevel();
            updateUI();
            showToast("Kupiono pandę.");
        });
    }

    if (buyLionBtn) {
        buyLionBtn.addEventListener("click", function () {
            if (coins < 1200) {
                showToast("Za mało monet na lwa.");
                return;
            }

            coins -= 1200;
            animals.lion += 1;
            updateZooIncome();
            updateLevel();
            updateUI();
            showToast("Kupiono lwa.");
        });
    }

    setInterval(function () {
        if (zooIncome > 0) {
            coins += zooIncome;
            updateLevel();
            updateUI();
        }
    }, 1000);

    function updateRanking() {
        if (!rankingList) return;

        rankingList.innerHTML =
            "<li>🥇 Gracz 1 — 500 monet</li>" +
            "<li>🥈 Gracz 2 — 350 monet</li>" +
            "<li>🥉 Gracz 3 — 200 monet</li>";
    }

    updateZooIncome();
    updateLevel();
    updateUI();
    updateRanking();
    showScreen("game");
});
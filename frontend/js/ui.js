
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {
    showLoading() {
        const loadingScreen = CryptoZoo.state.els.loadingScreen;
        if (!loadingScreen) return;

        loadingScreen.style.display = "flex";
        loadingScreen.classList.remove("hide-loading");
        CryptoZoo.state.loadingVisible = true;
    },

    hideLoading() {
        const loadingScreen = CryptoZoo.state.els.loadingScreen;
        if (!loadingScreen) return;

        setTimeout(function () {
            loadingScreen.classList.add("hide-loading");
        }, CryptoZoo.config.loadingFadeStartMs);

        setTimeout(function () {
            loadingScreen.style.display = "none";
            CryptoZoo.state.loadingVisible = false;
        }, CryptoZoo.config.loadingHideMs);
    },

    showToast(message) {
        const toast = CryptoZoo.state.els.toast;
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(function () {
            toast.style.display = "none";
        }, 2200);
    },

    showScreen(screenId) {
        CryptoZoo.state.els.screens.forEach(function (screen) {
            screen.classList.remove("active-screen");
        });

        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add("active-screen");
        }
    },

    animateCoinsBurst() {
        const container = CryptoZoo.state.els.coinAnimationContainer;
        if (!container) return;

        for (let i = 0; i < 8; i++) {
            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.floor(Math.random() * 220) - 110) + "px";
            const moveY = (-70 - Math.floor(Math.random() * 140)) + "px";

            coin.style.left = "129px";
            coin.style.top = "85px";
            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            container.appendChild(coin);

            setTimeout(function () {
                coin.remove();
            }, 900);
        }
    },

    updateCollectionCard(card, statusEl, discovered) {
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
        const state = CryptoZoo.state;
        const els = state.els;
        const gameplay = CryptoZoo.gameplay;

        els.coinsCount.textContent = state.coins;
        els.level.textContent = state.level;
        els.coinsPerClick.textContent = state.coinsPerClick;
        els.upgradeCost.textContent = state.upgradeCost;
        els.zooIncome.textContent = state.zooIncome;
        els.animalsTotal.textContent = gameplay.getAnimalsTotal();

        els.monkeyCount.textContent = state.animals.monkey.count;
        els.pandaCount.textContent = state.animals.panda.count;
        els.lionCount.textContent = state.animals.lion.count;

        els.monkeyLevel.textContent = state.animals.monkey.level;
        els.pandaLevel.textContent = state.animals.panda.level;
        els.lionLevel.textContent = state.animals.lion.level;

        els.upgradeMonkeyBtn.textContent = `Lvl Up (${gameplay.getAnimalUpgradeCost("monkey")})`;
        els.upgradePandaBtn.textContent = `Lvl Up (${gameplay.getAnimalUpgradeCost("panda")})`;
        els.upgradeLionBtn.textContent = `Lvl Up (${gameplay.getAnimalUpgradeCost("lion")})`;

        const monkeyDiscovered = state.animals.monkey.count > 0;
        const pandaDiscovered = state.animals.panda.count > 0;
        const lionDiscovered = state.animals.lion.count > 0;

        els.collectionFound.textContent = gameplay.getCollectionFoundCount();
        els.collectionTotal.textContent = 3;
        els.commonFound.textContent = `${monkeyDiscovered ? 1 : 0}/1`;
        els.rareFound.textContent = `${pandaDiscovered ? 1 : 0}/1`;
        els.epicFound.textContent = `${lionDiscovered ? 1 : 0}/1`;

        this.updateCollectionCard(els.collectionMonkeyCard, els.collectionMonkeyStatus, monkeyDiscovered);
        this.updateCollectionCard(els.collectionPandaCard, els.collectionPandaStatus, pandaDiscovered);
        this.updateCollectionCard(els.collectionLionCard, els.collectionLionStatus, lionDiscovered);
    }
};
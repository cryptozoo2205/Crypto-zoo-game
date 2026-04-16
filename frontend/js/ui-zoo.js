window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    renderZooList() {
        const zooList = document.getElementById("zooList");
        if (!zooList) return;

        const animalsConfig = CryptoZoo.config?.animals || {};
        const animalsState = CryptoZoo.state?.animals || {};

        zooList.innerHTML = Object.keys(animalsConfig).map((type) => {
            const config = animalsConfig[type];
            const state = animalsState[type] || { count: 0, level: 1 };
            const count = Math.max(0, Number(state.count) || 0);
            const displayLevel = count > 0 ? Math.max(1, Number(state.level) || 1) : 0;
            const upgradeCost = CryptoZoo.animalsSystem?.getUpgradeCost?.(type) || 0;
            const buyCost = CryptoZoo.animalsSystem?.getBuyCost?.(type) || Number(config.buyCost) || 0;
            const localizedName = this.getLocalizedAnimalName(type, config);

            return `
                <div class="animal-row">
                    <div class="animal-left">
                        <div class="animal-icon">
                            <img src="assets/animals/${config.asset}.png" alt="${localizedName}">
                        </div>

                        <div class="animal-text">
                            <div class="animal-name">${localizedName}</div>
                            <div class="animal-desc">
                                ${this.t("incomePerSec", "Dochód")} ${CryptoZoo.formatNumber(config.baseIncome)}/${this.t("secShort", "sek")} • ${this.t("cost", "Koszt")} ${CryptoZoo.formatNumber(buyCost)}
                            </div>
                            <div class="animal-owned">
                                ${this.t("owned", "Posiadane")}: ${CryptoZoo.formatNumber(count)} • ${this.t("level", "Poziom")}: ${CryptoZoo.formatNumber(displayLevel)}
                            </div>
                        </div>
                    </div>

                    <div class="animal-actions">
                        <button id="buy-${type}-btn" type="button">${this.t("buy", "Kup")} (${CryptoZoo.formatNumber(buyCost)})</button>
                        <button id="upgrade-${type}-btn" type="button">${this.t("lvlUp", "Lvl Up")} (${CryptoZoo.formatNumber(upgradeCost)})</button>
                    </div>
                </div>
            `;
        }).join("");

        CryptoZoo.animalsSystem?.bindButtons?.();
    }
});
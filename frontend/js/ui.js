window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    renderCurrentScreen() {
        const activeScreen = CryptoZoo.gameplay?.activeScreen || "game";

        if (activeScreen === "zoo") {
            this.renderZooList();
            return;
        }

        if (activeScreen === "shop") {
            this.renderShopItems();
            return;
        }

        if (activeScreen === "missions") {
            this.renderExpeditions();
            return;
        }

        if (activeScreen === "ranking") {
            CryptoZoo.uiRanking?.renderRanking?.(false);
        }
    },

    renderOpenModalsOnly() {
        if (this.isProfileModalOpen()) {
            CryptoZoo.uiProfile?.refreshProfileModalData?.();
        }

        if (this.isSettingsModalOpen()) {
            CryptoZoo.uiSettings?.refreshSettingsModalData?.();
        }
    },

    render() {
        this.renderTopHiddenStats();

        if ((CryptoZoo.gameplay?.activeScreen || "game") === "game") {
            this.renderHome();
        }

        this.renderCurrentScreen();
        this.renderOpenModalsOnly();
    }
});
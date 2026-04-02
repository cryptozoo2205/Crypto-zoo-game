window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.htmlLoader = {
    async load(id, path) {
        try {
            const res = await fetch(path, { cache: "no-store" });
            const html = await res.text();

            const mount = document.getElementById(id);
            if (!mount) {
                console.error("HTML mount not found:", id);
                return;
            }

            mount.innerHTML = html;
            this.cleanupDuplicateOfflineUi();
        } catch (e) {
            console.error("HTML load error:", path, e);
        }
    },

    cleanupDuplicateOfflineUi() {
        const offlinePanels = Array.from(document.querySelectorAll(".home-offline-strip"));
        if (offlinePanels.length > 1) {
            for (let i = 0; i < offlinePanels.length - 1; i += 1) {
                try {
                    offlinePanels[i].remove();
                } catch (error) {
                    console.warn("Failed to remove duplicate offline panel:", error);
                }
            }
        }

        const offlineMainTexts = Array.from(document.querySelectorAll("#homeOfflineMainText"));
        if (offlineMainTexts.length > 1) {
            for (let i = 0; i < offlineMainTexts.length - 1; i += 1) {
                try {
                    offlineMainTexts[i].remove();
                } catch (error) {
                    console.warn("Failed to remove duplicate offline main text:", error);
                }
            }
        }

        const offlineSubTexts = Array.from(document.querySelectorAll("#homeOfflineSubText"));
        if (offlineSubTexts.length > 1) {
            for (let i = 0; i < offlineSubTexts.length - 1; i += 1) {
                try {
                    offlineSubTexts[i].remove();
                } catch (error) {
                    console.warn("Failed to remove duplicate offline sub text:", error);
                }
            }
        }

        const adButtons = Array.from(document.querySelectorAll("#watchOfflineAdBtn"));
        if (adButtons.length > 1) {
            for (let i = 0; i < adButtons.length - 1; i += 1) {
                try {
                    adButtons[i].remove();
                } catch (error) {
                    console.warn("Failed to remove duplicate ad button:", error);
                }
            }
        }
    },

    async init() {
        await this.load("game", "./partials/home.html");

        setTimeout(() => {
            this.cleanupDuplicateOfflineUi();
        }, 100);

        setTimeout(() => {
            this.cleanupDuplicateOfflineUi();
        }, 300);

        setTimeout(() => {
            this.cleanupDuplicateOfflineUi();
        }, 700);
    }
};
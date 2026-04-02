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
            this.removeDuplicateOfflinePanels();
        } catch (e) {
            console.error("HTML load error:", path, e);
        }
    },

    removeDuplicateOfflinePanels() {
        const panels = Array.from(document.querySelectorAll(".home-offline-strip"));

        if (panels.length <= 1) return;

        // Zostaw ostatni panel (ten z partiala), usuń resztę
        for (let i = 0; i < panels.length - 1; i += 1) {
            try {
                panels[i].remove();
            } catch (error) {
                console.warn("Duplicate offline panel remove failed:", error);
            }
        }
    },

    async init() {
        await this.load("game", "./partials/home.html");

        // dodatkowy cleanup po chwili, gdyby coś jeszcze dorysował inny skrypt
        setTimeout(() => {
            this.removeDuplicateOfflinePanels();
        }, 150);

        setTimeout(() => {
            this.removeDuplicateOfflinePanels();
        }, 500);
    }
};
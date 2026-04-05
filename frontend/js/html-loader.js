window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.htmlLoader = {
    async fetchHtml(paths) {
        const safePaths = Array.isArray(paths) ? paths : [paths];

        for (const path of safePaths) {
            try {
                const res = await fetch(path, { cache: "no-store" });

                if (!res.ok) {
                    console.warn("HTML fetch failed:", path, res.status);
                    continue;
                }

                const html = await res.text();
                if (html && html.trim()) {
                    return html;
                }
            } catch (error) {
                console.warn("HTML load error:", path, error);
            }
        }

        return "";
    },

    async load(id, paths) {
        const mount = document.getElementById(id);
        if (!mount) {
            console.error("HTML mount not found:", id);
            return false;
        }

        const html = await this.fetchHtml(paths);
        if (!html) {
            console.error("HTML content empty for:", paths);
            return false;
        }

        mount.innerHTML = html;
        return true;
    },

    async init() {
        const loaded = await this.load("homeMount", [
            "./partials/home.html",
            "partials/home.html",
            "./frontend/partials/home.html",
            "frontend/partials/home.html"
        ]);

        if (!loaded) {
            return;
        }

        const screenGame = document.getElementById("screen-game");
        if (screenGame) {
            screenGame.classList.remove("hidden");
        }
    }
};
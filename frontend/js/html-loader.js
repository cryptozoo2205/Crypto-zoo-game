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

    async load(id, paths, options = {}) {
        const mount = document.getElementById(id);

        if (!mount) {
            if (!options.optional) {
                console.error("HTML mount not found:", id);
            }
            return false;
        }

        const html = await this.fetchHtml(paths);

        if (!html) {
            if (!options.optional) {
                console.error("HTML content empty for:", paths);
            }
            return false;
        }

        mount.innerHTML = html;
        return true;
    },

    async loadOptional(id, paths) {
        return this.load(id, paths, { optional: true });
    },

    async init() {
        await this.load("homeMount", [
            "./partials/home.html",
            "partials/home.html",
            "./frontend/partials/home.html",
            "frontend/partials/home.html"
        ]);

        await this.loadOptional("zooMount", [
            "./partials/zoo-screen.html",
            "partials/zoo-screen.html",
            "./frontend/partials/zoo-screen.html",
            "frontend/partials/zoo-screen.html"
        ]);

        await this.loadOptional("shopMount", [
            "./partials/shop-screen.html",
            "partials/shop-screen.html",
            "./frontend/partials/shop-screen.html",
            "frontend/partials/shop-screen.html"
        ]);

        await this.loadOptional("missionsMount", [
            "./partials/missions-screen.html",
            "partials/missions-screen.html",
            "./frontend/partials/missions-screen.html",
            "frontend/partials/missions-screen.html"
        ]);

        await this.loadOptional("minigamesMount", [
            "./partials/minigames-screen.html",
            "partials/minigames-screen.html",
            "./frontend/partials/minigames-screen.html",
            "frontend/partials/minigames-screen.html"
        ]);

        await this.loadOptional("rankingMount", [
            "./partials/ranking-screen.html",
            "partials/ranking-screen.html",
            "./frontend/partials/ranking-screen.html",
            "frontend/partials/ranking-screen.html"
        ]);

        await this.loadOptional("profileModalMount", [
            "./partials/profile-modal.html",
            "partials/profile-modal.html",
            "./frontend/partials/profile-modal.html",
            "frontend/partials/profile-modal.html"
        ]);

        await this.loadOptional("settingsModalMount", [
            "./partials/settings-modal.html",
            "partials/settings-modal.html",
            "./frontend/partials/settings-modal.html",
            "frontend/partials/settings-modal.html"
        ]);

        await this.loadOptional("withdrawModalMount", [
            "./partials/withdraw-modal.html",
            "partials/withdraw-modal.html",
            "./frontend/partials/withdraw-modal.html",
            "frontend/partials/withdraw-modal.html"
        ]);

        await this.loadOptional("dailyRewardModalMount", [
            "./partials/daily-reward-modal.html",
            "partials/daily-reward-modal.html",
            "./frontend/partials/daily-reward-modal.html",
            "frontend/partials/daily-reward-modal.html"
        ]);
    }
};
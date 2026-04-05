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
        } catch (error) {
            console.error("HTML load error:", path, error);
        }
    },

    async init() {
        await this.load("homeMount", "./partials/home.html");
    }
};
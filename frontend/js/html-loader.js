window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.htmlLoader = {
    async load(id, path) {
        try {
            const res = await fetch(path);
            const html = await res.text();
            document.getElementById(id).innerHTML = html;
        } catch (e) {
            console.error("HTML load error:", path, e);
        }
    },

    async init() {
        await this.load("game", "./partials/home.html");
    }
};
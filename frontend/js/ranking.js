window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ranking = {
    async renderRanking() {
        const api = window.CryptoZoo.api;
        const ui = window.CryptoZoo.ui;
        const ranking = await api.loadRanking();

        if (!ui.els.rankingList) return;

        ui.els.rankingList.innerHTML = "";

        ranking.forEach(function (player, index) {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${player.username} — ${player.coins} monet`;
            ui.els.rankingList.appendChild(li);
        });
    }
}
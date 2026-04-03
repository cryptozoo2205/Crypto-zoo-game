window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiRoadmap = {
    init() {
        this.createButton();
        this.createModal();
    },

    createButton() {
        // znajdź kontener z przyciskami (settings/events)
        const topBar = document.querySelector(".top-bar-actions");
        if (!topBar) return;

        // unikaj duplikacji
        if (document.getElementById("roadmap-btn")) return;

        const btn = document.createElement("button");
        btn.id = "roadmap-btn";
        btn.className = "top-btn";
        btn.innerHTML = "🚀";

        btn.onclick = () => {
            this.open();
        };

        topBar.appendChild(btn);
    },

    createModal() {
        if (document.getElementById("roadmap-modal")) return;

        const modal = document.createElement("div");
        modal.id = "roadmap-modal";
        modal.className = "modal hidden";

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span>🚀 Wkrótce w Crypto Zoo</span>
                    <button id="roadmap-close">✖</button>
                </div>

                <div class="modal-body roadmap-content">
                    <h3>🎉 Eventy i bonusy</h3>
                    <p>Weekendowe eventy i limitowane nagrody.</p>

                    <h3>🎯 Nowe sposoby zarabiania</h3>
                    <p>Więcej rewardów, gemów i bonusów.</p>

                    <h3>📦 Skrzynki</h3>
                    <p>Losowe nagrody, rzadkie dropy i boosty.</p>

                    <h3>🏆 Ranking graczy</h3>
                    <p>Rywalizacja i nagrody dla najlepszych.</p>

                    <h3>👥 System poleceń</h3>
                    <p>Bonusy za zapraszanie znajomych.</p>

                    <h3>⚡ Boosty</h3>
                    <p>Nowe ulepszenia przyspieszające progres.</p>

                    <h3>🎮 Więcej zawartości</h3>
                    <p>Nowe funkcje i regularne aktualizacje.</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("roadmap-close").onclick = () => {
            this.close();
        };

        modal.addEventListener("click", (e) => {
            if (e.target.id === "roadmap-modal") {
                this.close();
            }
        });
    },

    open() {
        const modal = document.getElementById("roadmap-modal");
        if (modal) modal.classList.remove("hidden");
    },

    close() {
        const modal = document.getElementById("roadmap-modal");
        if (modal) modal.classList.add("hidden");
    }
};

// auto init po załadowaniu
document.addEventListener("DOMContentLoaded", () => {
    if (CryptoZoo.uiRoadmap) {
        CryptoZoo.uiRoadmap.init();
    }
});
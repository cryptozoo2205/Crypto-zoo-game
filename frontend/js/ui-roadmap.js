window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiRoadmap = {
    initAttempts: 0,
    maxInitAttempts: 40,

    init() {
        this.createModal();
        this.tryMountButton();
    },

    tryMountButton() {
        if (document.getElementById("roadmap-btn")) {
            return;
        }

        const actionContainer = this.findActionContainer();

        if (actionContainer) {
            this.createButton(actionContainer);
            return;
        }

        this.initAttempts += 1;

        if (this.initAttempts < this.maxInitAttempts) {
            setTimeout(() => this.tryMountButton(), 250);
        }
    },

    findActionContainer() {
        const selectors = [
            ".top-bar-actions",
            ".top-actions",
            ".header-actions",
            ".game-header-actions",
            ".topbar-actions",
            ".top-bar-right",
            ".header-right"
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                return el;
            }
        }

        const settingsBtn =
            document.querySelector("#settings-btn") ||
            document.querySelector(".settings-btn") ||
            document.querySelector("[data-action='settings']") ||
            this.findButtonByText("⚙️") ||
            this.findButtonByText("⚙");

        if (settingsBtn && settingsBtn.parentElement) {
            return settingsBtn.parentElement;
        }

        const topBar =
            document.querySelector(".top-bar") ||
            document.querySelector(".topbar") ||
            document.querySelector(".game-header") ||
            document.querySelector(".header");

        if (topBar) {
            let fallbackContainer = document.getElementById("roadmap-top-actions");
            if (!fallbackContainer) {
                fallbackContainer = document.createElement("div");
                fallbackContainer.id = "roadmap-top-actions";
                fallbackContainer.style.display = "flex";
                fallbackContainer.style.alignItems = "center";
                fallbackContainer.style.gap = "8px";
                fallbackContainer.style.marginLeft = "auto";
                topBar.appendChild(fallbackContainer);
            }
            return fallbackContainer;
        }

        return null;
    },

    findButtonByText(text) {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.find((btn) => (btn.textContent || "").trim() === text) || null;
    },

    createButton(container) {
        if (!container || document.getElementById("roadmap-btn")) {
            return;
        }

        const btn = document.createElement("button");
        btn.id = "roadmap-btn";
        btn.type = "button";
        btn.className = "top-btn roadmap-btn";
        btn.setAttribute("aria-label", "Wkrótce");
        btn.innerHTML = "🚀";

        btn.style.width = "42px";
        btn.style.height = "42px";
        btn.style.borderRadius = "50%";
        btn.style.border = "none";
        btn.style.cursor = "pointer";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.fontSize = "18px";
        btn.style.flexShrink = "0";

        if (!btn.style.background) {
            btn.style.background = "rgba(255,255,255,0.12)";
        }
        if (!btn.style.color) {
            btn.style.color = "#ffffff";
        }

        btn.addEventListener("click", () => this.open());

        container.appendChild(btn);
    },

    createModal() {
        if (document.getElementById("roadmap-modal")) {
            return;
        }

        const modal = document.createElement("div");
        modal.id = "roadmap-modal";
        modal.style.position = "fixed";
        modal.style.inset = "0";
        modal.style.background = "rgba(0,0,0,0.65)";
        modal.style.display = "none";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.padding = "16px";
        modal.style.zIndex = "9999";

        modal.innerHTML = `
            <div id="roadmap-modal-card" style="
                width: 100%;
                max-width: 420px;
                max-height: 85vh;
                overflow-y: auto;
                background: #111827;
                color: #ffffff;
                border-radius: 18px;
                padding: 18px;
                box-sizing: border-box;
                box-shadow: 0 10px 30px rgba(0,0,0,0.35);
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                ">
                    <div style="font-size: 20px; font-weight: 700;">🚀 Wkrótce</div>
                    <button id="roadmap-close-btn" type="button" style="
                        width: 36px;
                        height: 36px;
                        border: none;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.12);
                        color: #ffffff;
                        font-size: 18px;
                        cursor: pointer;
                    ">✕</button>
                </div>

                <div style="display: grid; gap: 14px; font-size: 14px; line-height: 1.45;">
                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">🎉 Eventy i bonusy</div>
                        <div>Weekendowe eventy, specjalne bonusy i limitowane nagrody za aktywność.</div>
                    </div>

                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">🎯 Nowe sposoby zarabiania</div>
                        <div>Więcej okazji do zdobywania rewardów, gemów i dodatkowych bonusów.</div>
                    </div>

                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">📦 Skrzynki i nagrody</div>
                        <div>Skrzynki z losowymi nagrodami, rzadkimi dropami i specjalnymi bonusami.</div>
                    </div>

                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">🏆 Ranking graczy</div>
                        <div>Rywalizacja z innymi graczami, tabela najlepszych wyników i nagrody za top miejsca.</div>
                    </div>

                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">👥 System poleceń v2</div>
                        <div>Zapraszaj znajomych i odbieraj bonusy za rozwój swojej społeczności.</div>
                    </div>

                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">⚡ Boosty i ulepszenia</div>
                        <div>Nowe boosty, lepsze bonusy i dodatkowe ulepszenia przyspieszające progres.</div>
                    </div>

                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">🎮 Więcej zawartości</div>
                        <div>Nowe funkcje, więcej aktywności i regularne aktualizacje rozwijające Crypto Zoo.</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = document.getElementById("roadmap-close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.close());
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    },

    open() {
        const modal = document.getElementById("roadmap-modal");
        if (modal) {
            modal.style.display = "flex";
        }
    },

    close() {
        const modal = document.getElementById("roadmap-modal");
        if (modal) {
            modal.style.display = "none";
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.uiRoadmap.init();
});
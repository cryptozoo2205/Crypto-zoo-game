window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.animalPagination = {
    pageSize: 5,
    currentPage: 1,
    observer: null,
    initialized: false,
    containerSelectors: [
        "#animalsList",
        "#animalsGrid",
        "#zooAnimalsList",
        "#shopAnimalsList",
        ".animals-list",
        ".animals-grid",
        ".zoo-animals-list",
        ".shop-animals-list"
    ],

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.injectStyles();
        this.patchUiRender();
        this.waitAndBind();
    },

    injectStyles() {
        if (document.getElementById("cz-animal-pagination-styles")) return;

        const style = document.createElement("style");
        style.id = "cz-animal-pagination-styles";
        style.textContent = `
            .cz-animal-pagination-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                flex-wrap: wrap;
                margin: 10px 0 14px;
                padding: 0 8px;
            }

            .cz-animal-pagination-btn {
                min-width: 42px;
                height: 42px;
                border: none;
                border-radius: 12px;
                padding: 0 12px;
                background: rgba(255,255,255,0.08);
                color: #fff;
                font-weight: 700;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.12s ease, opacity 0.12s ease, background 0.12s ease;
            }

            .cz-animal-pagination-btn:active {
                transform: scale(0.96);
            }

            .cz-animal-pagination-btn:hover {
                background: rgba(255,255,255,0.14);
            }

            .cz-animal-pagination-btn.is-active {
                background: linear-gradient(180deg, #ffd54a 0%, #ffb300 100%);
                color: #1b1b1b;
                box-shadow: 0 6px 16px rgba(255, 191, 0, 0.25);
            }

            .cz-animal-pagination-btn.is-disabled {
                opacity: 0.45;
                pointer-events: none;
            }

            .cz-animal-pagination-hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    },

    patchUiRender() {
        const ui = CryptoZoo.ui;
        if (!ui || ui.__animalPaginationPatched) return;

        ui.__animalPaginationPatched = true;

        const wrapMethod = (methodName) => {
            if (typeof ui[methodName] !== "function") return;

            const original = ui[methodName].bind(ui);

            ui[methodName] = (...args) => {
                const result = original(...args);

                setTimeout(() => {
                    this.refresh();
                }, 0);

                return result;
            };
        };

        wrapMethod("render");
        wrapMethod("renderAnimals");
        wrapMethod("renderShopAnimals");
        wrapMethod("renderZoo");
        wrapMethod("renderPanels");
    },

    waitAndBind() {
        const tryBind = () => {
            const container = this.findContainer();
            if (!container) {
                setTimeout(tryBind, 500);
                return;
            }

            this.bindObserver(container);
            this.refresh();
        };

        tryBind();
    },

    bindObserver(container) {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.observer = new MutationObserver(() => {
            this.refresh();
        });

        this.observer.observe(container, {
            childList: true,
            subtree: false
        });
    },

    findContainer() {
        for (const selector of this.containerSelectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return null;
    },

    getAnimalCards(container) {
        if (!container) return [];

        return Array.from(container.children).filter((child) => {
            if (!child) return false;
            if (child.classList?.contains("cz-animal-pagination-wrap")) return false;
            return true;
        });
    },

    getPageCount(totalItems) {
        return Math.max(1, Math.ceil(totalItems / this.pageSize));
    },

    clampPage(totalItems) {
        const pageCount = this.getPageCount(totalItems);
        if (this.currentPage > pageCount) this.currentPage = pageCount;
        if (this.currentPage < 1) this.currentPage = 1;
    },

    refresh() {
        const container = this.findContainer();
        if (!container) return;

        const cards = this.getAnimalCards(container);
        const totalItems = cards.length;

        if (!totalItems) {
            this.removePager(container);
            return;
        }

        this.clampPage(totalItems);
        this.applyPagination(cards);
        this.renderPager(container, totalItems);
    },

    applyPagination(cards) {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;

        cards.forEach((card, index) => {
            if (index >= start && index < end) {
                card.classList.remove("cz-animal-pagination-hidden");
            } else {
                card.classList.add("cz-animal-pagination-hidden");
            }
        });
    },

    removePager(container) {
        const existing = this.getPager(container);
        if (existing) existing.remove();
    },

    getPager(container) {
        if (!container || !container.parentNode) return null;
        return container.parentNode.querySelector(".cz-animal-pagination-wrap");
    },

    renderPager(container, totalItems) {
        const pageCount = this.getPageCount(totalItems);
        const existing = this.getPager(container);

        if (pageCount <= 1) {
            if (existing) existing.remove();
            return;
        }

        let pager = existing;

        if (!pager) {
            pager = document.createElement("div");
            pager.className = "cz-animal-pagination-wrap";
            container.parentNode.insertBefore(pager, container);
        }

        pager.innerHTML = "";

        const prevBtn = this.createButton("‹", () => {
            if (this.currentPage > 1) {
                this.currentPage -= 1;
                this.refresh();
            }
        });
        if (this.currentPage <= 1) {
            prevBtn.classList.add("is-disabled");
        }
        pager.appendChild(prevBtn);

        for (let page = 1; page <= pageCount; page += 1) {
            const btn = this.createButton(String(page), () => {
                this.currentPage = page;
                this.refresh();
            });

            if (page === this.currentPage) {
                btn.classList.add("is-active");
            }

            pager.appendChild(btn);
        }

        const nextBtn = this.createButton("›", () => {
            if (this.currentPage < pageCount) {
                this.currentPage += 1;
                this.refresh();
            }
        });
        if (this.currentPage >= pageCount) {
            nextBtn.classList.add("is-disabled");
        }
        pager.appendChild(nextBtn);
    },

    createButton(label, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cz-animal-pagination-btn";
        button.textContent = label;
        button.addEventListener("click", onClick);
        return button;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    CryptoZoo.animalPagination.init();
});
window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.minigames = CryptoZoo.minigames || {};

Object.assign(CryptoZoo.minigames, {
    ensureAnimalHuntCard() {
        const wrap = document.getElementById("minigamesWrap");
        if (!wrap) return;

        let card = document.getElementById("animalHuntGame");
        if (card) return;

        card = document.createElement("div");
        card.id = "animalHuntGame";
        card.className = "minigame-box";
        card.style.marginTop = "14px";

        card.innerHTML = `
            <div class="minigame-box-header">
                <div class="minigame-name" id="animalHuntTitle">${this.lt("animalHuntTitle", "Animal Hunt")}</div>
                <div class="minigame-desc" id="animalHuntDesc">${this.lt("animalHuntSubtitle", "Catch animals before they disappear")}</div>
            </div>

            <div
                id="animalHuntHud"
                style="
                    display:grid;
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                    gap:10px;
                    margin-top:12px;
                    margin-bottom:12px;
                "
            >
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("time", "Time")}</div>
                    <div id="animalHuntTimeText" style="font-size:18px; font-weight:900;">10.0</div>
                </div>
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("score", "Score")}</div>
                    <div id="animalHuntScoreText" style="font-size:18px; font-weight:900;">0</div>
                </div>
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("combo", "Combo")}</div>
                    <div id="animalHuntComboText" style="font-size:18px; font-weight:900;">0x</div>
                </div>
            </div>

            <div
                id="animalHuntBoard"
                style="
                    display:grid;
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                    gap:10px;
                    margin-top:4px;
                "
            ></div>

            <button
                id="animalHuntStartBtn"
                type="button"
                style="margin-top:12px; width:100%;"
            >${this.lt("startAnimalHunt", "Start Animal Hunt")}</button>

            <div
                id="animalHuntStatus"
                class="minigame-status"
                style="margin-top:12px;"
            >${this.lt("animalHuntSubtitle", "Catch animals before they disappear")}</div>

            <div
                id="animalHuntResultBox"
                style="
                    display:none;
                    margin-top:12px;
                    padding:12px;
                    border-radius:16px;
                    background:rgba(255,255,255,0.04);
                    border:1px solid rgba(255,255,255,0.08);
                "
            >
                <div style="font-size:16px; font-weight:900; margin-bottom:8px;">${this.lt("animalHuntResultTitle", "Hunt Result")}</div>
                <div id="animalHuntResultText" style="font-size:13px; line-height:1.5;"></div>
                <button
                    id="animalHuntClaimBtn"
                    type="button"
                    style="margin-top:12px; width:100%;"
                >${this.lt("animalHuntClaim", "Claim reward")}</button>
            </div>
        `;

        wrap.appendChild(card);

        this.animalHuntCells = Array.from({ length: this.animalHuntBoardSize }, (_, index) => ({
            index,
            type: "empty",
            expiresAt: 0,
            clicked: false
        }));

        this.renderAnimalHuntBoard();
    },

    getAnimalHuntCooldownLeft() {
        this.ensureState();

        return Math.max(
            0,
            Math.ceil(
                ((Number(CryptoZoo.state.minigames.animalHuntCooldownUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    isAnimalHuntReady() {
        return this.getAnimalHuntCooldownLeft() <= 0;
    },

    startAnimalHuntCooldown(customSeconds = null) {
        this.ensureState();

        const duration = Math.max(
            1,
            Number(customSeconds) || this.animalHuntCooldownSeconds
        );

        CryptoZoo.state.minigames.animalHuntCooldownUntil =
            Date.now() + duration * 1000;
    },

    getAnimalHuntTargetScore() {
        return 22;
    },

    resetAnimalHuntBoardState() {
        this.animalHuntCells = Array.from({ length: this.animalHuntBoardSize }, (_, index) => ({
            index,
            type: "empty",
            expiresAt: 0,
            clicked: false
        }));
    },

    renderAnimalHuntBoard() {
        const board = document.getElementById("animalHuntBoard");
        if (!board) return;

        if (!Array.isArray(this.animalHuntCells) || this.animalHuntCells.length !== this.animalHuntBoardSize) {
            this.resetAnimalHuntBoardState();
        }

        board.innerHTML = "";

        this.animalHuntCells.forEach((cell, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.cellIndex = String(index);

            let emoji = "";
            let background = "rgba(255,255,255,0.04)";
            let border = "1px solid rgba(255,255,255,0.10)";
            let shadow = "none";

            if (cell.type === "normal") {
                emoji = "🐾";
                background = "linear-gradient(180deg, rgba(79, 172, 254, 0.25) 0%, rgba(0, 242, 254, 0.12) 100%)";
                border = "1px solid rgba(79, 172, 254, 0.38)";
                shadow = "0 10px 22px rgba(79, 172, 254, 0.16)";
            } else if (cell.type === "gold") {
                emoji = "✨";
                background = "linear-gradient(180deg, rgba(255, 214, 80, 0.28) 0%, rgba(240, 185, 11, 0.14) 100%)";
                border = "1px solid rgba(255, 214, 80, 0.46)";
                shadow = "0 10px 22px rgba(240, 185, 11, 0.18)";
            } else if (cell.type === "bomb") {
                emoji = "💣";
                background = "linear-gradient(180deg, rgba(255, 110, 110, 0.28) 0%, rgba(255, 70, 70, 0.12) 100%)";
                border = "1px solid rgba(255, 110, 110, 0.42)";
                shadow = "0 10px 22px rgba(255, 80, 80, 0.16)";
            }

            button.innerHTML = emoji;
            button.style.minHeight = "86px";
            button.style.borderRadius = "18px";
            button.style.border = border;
            button.style.background = background;
            button.style.color = "#ffffff";
            button.style.fontSize = "30px";
            button.style.fontWeight = "900";
            button.style.boxShadow = shadow;
            button.style.transition = "transform 0.12s ease, opacity 0.12s ease";
            button.style.opacity = cell.type === "empty" ? "0.65" : "1";
            button.style.transform = cell.type === "empty" ? "scale(1)" : "scale(1.03)";

            button.onclick = () => {
                this.hitAnimalHuntCell(index);
            };

            board.appendChild(button);
        });
    },

    setAnimalHuntStatus(text) {
        this.animalHuntStatusMessage = String(text || "");
        const status = document.getElementById("animalHuntStatus");
        if (status) {
            status.textContent = this.animalHuntStatusMessage;
        }
    },

    renderAnimalHunt() {
        const startBtn = document.getElementById("animalHuntStartBtn");
        const timeText = document.getElementById("animalHuntTimeText");
        const scoreText = document.getElementById("animalHuntScoreText");
        const comboText = document.getElementById("animalHuntComboText");
        const resultBox = document.getElementById("animalHuntResultBox");
        const resultText = document.getElementById("animalHuntResultText");
        const claimBtn = document.getElementById("animalHuntClaimBtn");

        if (timeText) {
            if (this.animalHuntSessionActive) {
                const leftMs = Math.max(0, this.animalHuntEndsAt - Date.now());
                timeText.textContent = (leftMs / 1000).toFixed(1);
            } else {
                timeText.textContent = `${this.animalHuntDurationSeconds.toFixed(1)}`;
            }
        }

        if (scoreText) {
            scoreText.textContent = CryptoZoo.formatNumber(this.animalHuntScore);
        }

        if (comboText) {
            comboText.textContent = `${CryptoZoo.formatNumber(this.animalHuntCombo)}x`;
        }

        if (resultBox) {
            resultBox.style.display = this.animalHuntResult ? "block" : "none";
        }

        if (resultText && this.animalHuntResult) {
            const result = this.animalHuntResult;
            const lines = [
                `<div>${this.lt("score", "Score")}: ${CryptoZoo.formatNumber(result.score)}</div>`,
                `<div>${this.lt("bestCombo", "Best combo")}: ${CryptoZoo.formatNumber(result.bestCombo)}x</div>`,
                `<div>${this.lt("reward", "Reward")}: +${CryptoZoo.formatNumber(result.coins)} coins${result.gems > 0 ? ` • +${CryptoZoo.formatNumber(result.gems)} gem` : ""}</div>`
            ];

            if (result.title) {
                lines.unshift(`<div style="font-weight:900; margin-bottom:6px;">${result.title}</div>`);
            }

            resultText.innerHTML = lines.join("");
        }

        if (claimBtn) {
            claimBtn.disabled = !this.animalHuntResult;
            claimBtn.style.opacity = this.animalHuntResult ? "1" : "0.65";
        }

        if (startBtn) {
            const cooldownLeft = this.getAnimalHuntCooldownLeft();

            if (this.animalHuntSessionActive) {
                startBtn.disabled = true;
                startBtn.textContent = this.lt("animalHuntRunning", "Catch as many animals as you can");
                startBtn.style.opacity = "0.9";
                startBtn.style.cursor = "default";
            } else if (this.animalHuntResult) {
                startBtn.disabled = true;
                startBtn.textContent = this.lt("finished", "Finished");
                startBtn.style.opacity = "0.72";
                startBtn.style.cursor = "not-allowed";
            } else if (cooldownLeft > 0) {
                startBtn.disabled = true;
                startBtn.textContent = `${this.lt("animalHuntCooldown", "Animal Hunt CD")} ${this.formatCooldown(cooldownLeft)}`;
                startBtn.style.opacity = "0.72";
                startBtn.style.cursor = "not-allowed";
            } else {
                startBtn.disabled = false;
                startBtn.textContent = this.lt("startAnimalHunt", "Start Animal Hunt");
                startBtn.style.opacity = "1";
                startBtn.style.cursor = "pointer";
            }
        }

        if (!this.animalHuntStatusMessage) {
            if (this.animalHuntSessionActive) {
                this.setAnimalHuntStatus(this.lt("animalHuntRunning", "Catch as many animals as you can"));
            } else if (this.getAnimalHuntCooldownLeft() > 0) {
                this.setAnimalHuntStatus(`${this.lt("animalHuntReadyIn", "Animal Hunt ready in")} ${this.formatCooldown(this.getAnimalHuntCooldownLeft())}`);
            } else {
                this.setAnimalHuntStatus(this.lt("animalHuntSubtitle", "Catch animals before they disappear"));
            }
        }

        this.renderAnimalHuntBoard();
    },

    getAnimalHuntRandomType() {
        const roll = Math.random();

        if (roll < 0.12) return "bomb";
        if (roll < 0.32) return "gold";
        return "normal";
    },

    spawnAnimalHuntCell() {
        if (!this.animalHuntSessionActive) return;

        const now = Date.now();

        this.animalHuntCells = this.animalHuntCells.map((cell) => {
            if (cell.type !== "empty" && now >= Number(cell.expiresAt || 0)) {
                if (!cell.clicked && (cell.type === "normal" || cell.type === "gold")) {
                    this.animalHuntCombo = 0;
                    this.setAnimalHuntStatus(this.lt("animalHuntMissed", "Missed animal"));
                }

                return {
                    ...cell,
                    type: "empty",
                    expiresAt: 0,
                    clicked: false
                };
            }

            return cell;
        });

        const freeIndexes = this.animalHuntCells
            .map((cell, index) => ({ cell, index }))
            .filter((entry) => entry.cell.type === "empty")
            .map((entry) => entry.index);

        if (!freeIndexes.length) {
            this.renderAnimalHunt();
            return;
        }

        const chosenIndex = freeIndexes[Math.floor(Math.random() * freeIndexes.length)];
        const type = this.getAnimalHuntRandomType();
        const durationMs = type === "gold" ? 650 : type === "bomb" ? 850 : 900;

        this.animalHuntCells[chosenIndex] = {
            index: chosenIndex,
            type,
            expiresAt: now + durationMs,
            clicked: false
        };

        this.renderAnimalHunt();
    },

    startAnimalHunt() {
        if (!this.isMiniGamesVisible()) return;

        const cooldownLeft = this.getAnimalHuntCooldownLeft();
        if (cooldownLeft > 0) {
            CryptoZoo.ui?.showToast?.(`${this.lt("animalHuntReadyIn", "Animal Hunt ready in")} ${this.formatCooldown(cooldownLeft)}`);
            return;
        }

        this.clearAnimalHuntTimers();
        this.resetAnimalHuntBoardState();

        this.animalHuntSessionActive = true;
        this.animalHuntLocked = false;
        this.animalHuntStartedAt = Date.now();
        this.animalHuntEndsAt = this.animalHuntStartedAt + this.animalHuntDurationSeconds * 1000;
        this.animalHuntScore = 0;
        this.animalHuntCombo = 0;
        this.animalHuntBestCombo = 0;
        this.animalHuntResult = null;
        this.animalHuntStatusMessage = "";

        this.setAnimalHuntStatus(this.lt("animalHuntRunning", "Catch as many animals as you can"));
        this.renderAnimalHunt();

        this.spawnAnimalHuntCell();

        this.animalHuntSpawnInterval = setInterval(() => {
            if (!this.animalHuntSessionActive) return;
            this.spawnAnimalHuntCell();
        }, 420);

        this.animalHuntTickInterval = setInterval(() => {
            if (!this.animalHuntSessionActive) return;

            if (Date.now() >= this.animalHuntEndsAt) {
                this.finishAnimalHunt();
                return;
            }

            this.spawnAnimalHuntCell();
            this.renderAnimalHunt();
        }, 120);
    },

    hitAnimalHuntCell(index) {
        if (!this.animalHuntSessionActive) return;
        if (this.animalHuntLocked) return;

        const cell = this.animalHuntCells[index];
        if (!cell || cell.type === "empty" || cell.clicked) return;

        cell.clicked = true;

        if (cell.type === "normal") {
            this.animalHuntScore += 1;
            this.animalHuntCombo += 1;
            this.animalHuntBestCombo = Math.max(this.animalHuntBestCombo, this.animalHuntCombo);
            this.setAnimalHuntStatus(this.lt("animalHuntRunning", "Catch as many animals as you can"));
            CryptoZoo.audio?.play?.("tap");
        } else if (cell.type === "gold") {
            this.animalHuntScore += 3;
            this.animalHuntCombo += 1;
            this.animalHuntBestCombo = Math.max(this.animalHuntBestCombo, this.animalHuntCombo);
            this.setAnimalHuntStatus(`${this.lt("animalHuntGolden", "Golden animal")} +3`);
            CryptoZoo.audio?.play?.("win");
        } else if (cell.type === "bomb") {
            this.animalHuntScore = Math.max(0, this.animalHuntScore - 2);
            this.animalHuntCombo = 0;
            this.setAnimalHuntStatus(`${this.lt("animalHuntBomb", "Bomb")} -2`);
            CryptoZoo.audio?.play?.("click");
        }

        this.animalHuntCells[index] = {
            index,
            type: "empty",
            expiresAt: 0,
            clicked: false
        };

        this.renderAnimalHunt();
    },

    getAnimalHuntReward(score, bestCombo) {
        const safeScore = Math.max(0, Math.floor(Number(score) || 0));
        const safeBestCombo = Math.max(0, Math.floor(Number(bestCombo) || 0));

        const effectiveCoinsPerClick = Math.max(
            1,
            Number(CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.() || CryptoZoo.state?.coinsPerClick || 1)
        );

        let coins = safeScore * effectiveCoinsPerClick * 42;
        coins += safeBestCombo * 80;

        if (safeScore >= 12) coins += 900;
        if (safeScore >= 18) coins += 1800;
        if (safeScore >= 24) coins += 3200;
        if (safeScore >= 30) coins += 4800;

        coins = Math.max(0, Math.min(70000, Math.floor(coins)));

        let gems = 0;
        if (safeScore >= 16 && Math.random() < 0.07) gems = 1;
        if (safeScore >= 24 && Math.random() < 0.12) gems = 1;
        if (safeScore >= 32 && Math.random() < 0.16) gems = 2;

        let title = this.lt("animalHuntNice", "Nice run");
        if (safeScore >= 28) {
            title = this.lt("animalHuntMaster", "Master hunter");
        } else if (safeScore >= 18) {
            title = this.lt("animalHuntGreat", "Great hunt");
        }

        return {
            score: safeScore,
            bestCombo: safeBestCombo,
            coins,
            gems,
            title
        };
    },

    finishAnimalHunt() {
        if (!this.animalHuntSessionActive) return;

        this.animalHuntSessionActive = false;
        this.animalHuntLocked = true;
        this.clearAnimalHuntTimers();
        this.startAnimalHuntCooldown(this.animalHuntCooldownSeconds);
        this.animalHuntResult = this.getAnimalHuntReward(
            this.animalHuntScore,
            this.animalHuntBestCombo
        );

        this.resetAnimalHuntBoardState();
        this.setAnimalHuntStatus(this.lt("animalHuntResultTitle", "Hunt Result"));
        this.renderAnimalHunt();
    },

    claimAnimalHuntReward() {
        if (!this.animalHuntResult) return false;

        CryptoZoo.state = CryptoZoo.state || {};

        const result = this.animalHuntResult;

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + Math.max(0, Number(result.coins) || 0);
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + Math.max(0, Number(result.gems) || 0);
        CryptoZoo.state.lastLogin = Date.now();

        const toastParts = [
            `+${CryptoZoo.formatNumber(result.coins)} coins`
        ];

        if (result.gems > 0) {
            toastParts.push(`+${CryptoZoo.formatNumber(result.gems)} gem`);
        }

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(`🎯 ${this.lt("animalHuntRewardToast", "Animal Hunt reward")}: ${toastParts.join(" • ")}`);

        this.animalHuntResult = null;
        this.animalHuntScore = 0;
        this.animalHuntCombo = 0;
        this.animalHuntBestCombo = 0;
        this.animalHuntStatusMessage = "";

        this.renderAnimalHunt();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        return true;
    }
});
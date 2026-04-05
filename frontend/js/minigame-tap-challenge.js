window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.minigames = CryptoZoo.minigames || {};

Object.assign(CryptoZoo.minigames, {
    ensureTapChallengeCard() {
        const wrap = document.getElementById("minigamesWrap");
        if (!wrap) return;

        let card = document.getElementById("tapChallengeGame");
        if (card) return;

        card = document.createElement("div");
        card.id = "tapChallengeGame";
        card.className = "minigame-box";
        card.style.marginTop = "14px";

        card.innerHTML = `
            <div class="minigame-box-header">
                <div class="minigame-name" id="tapChallengeTitle">${this.lt("tapChallengeTitle", "Tap Challenge")}</div>
                <div class="minigame-desc" id="tapChallengeDesc">${this.lt("tapChallengeSubtitle", "Klikaj jak najszybciej przez 5 sekund")}</div>
            </div>

            <div
                id="tapChallengeHud"
                style="
                    display:grid;
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                    gap:10px;
                    margin-top:12px;
                    margin-bottom:12px;
                "
            >
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("time", "Czas")}</div>
                    <div id="tapChallengeTimeText" style="font-size:18px; font-weight:900;">05.0</div>
                </div>
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("taps", "Tapy")}</div>
                    <div id="tapChallengeTapsText" style="font-size:18px; font-weight:900;">0</div>
                </div>
                <div style="padding:10px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.65);">${this.lt("target", "Cel")}</div>
                    <div id="tapChallengeTargetText" style="font-size:18px; font-weight:900;">90+</div>
                </div>
            </div>

            <button
                id="tapChallengeTapBtn"
                type="button"
                style="
                    width:100%;
                    min-height:132px;
                    border:none;
                    border-radius:24px;
                    background:linear-gradient(180deg, rgba(255, 211, 73, 0.95) 0%, rgba(240, 185, 11, 0.95) 100%);
                    color:#1c1c1c;
                    font-size:26px;
                    font-weight:900;
                    box-shadow:0 16px 36px rgba(240, 185, 11, 0.20);
                    margin-top:4px;
                "
            >${this.lt("startTapChallenge", "Start Tap Challenge")}</button>

            <div
                id="tapChallengeStatus"
                class="minigame-status"
                style="margin-top:12px; display:none;"
            ></div>

            <div
                id="tapChallengeResultBox"
                style="
                    display:none;
                    margin-top:12px;
                    padding:12px;
                    border-radius:16px;
                    background:rgba(255,255,255,0.04);
                    border:1px solid rgba(255,255,255,0.08);
                "
            >
                <div style="font-size:16px; font-weight:900; margin-bottom:8px;">${this.lt("tapChallengeResultTitle", "Wynik")}</div>
                <div id="tapChallengeResultText" style="font-size:13px; line-height:1.5;"></div>
                <button
                    id="tapChallengeClaimBtn"
                    type="button"
                    style="margin-top:12px; width:100%;"
                >${this.lt("tapChallengeClaim", "Odbierz nagrodę")}</button>
            </div>
        `;

        wrap.appendChild(card);
    },

    getTapChallengeCooldownLeft() {
        this.ensureState();

        return Math.max(
            0,
            Math.ceil(
                ((Number(CryptoZoo.state.minigames.tapChallengeCooldownUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    isTapChallengeReady() {
        return this.getTapChallengeCooldownLeft() <= 0;
    },

    startTapChallengeCooldown(customSeconds = null) {
        this.ensureState();

        const duration = Math.max(
            1,
            Number(customSeconds) || this.tapChallengeCooldownSeconds
        );

        CryptoZoo.state.minigames.tapChallengeCooldownUntil =
            Date.now() + duration * 1000;

        CryptoZoo.api?.savePlayer?.();
    },

    getTapChallengeTarget() {
        return 90;
    },

    getTapChallengeMaxTapsPerSecond() {
        return 14;
    },

    getTapChallengeMaxBurst() {
        return 3;
    },

    getTapChallengeMinIntervalMs() {
        return 20;
    },

    pruneTapChallengeHistory(now = Date.now()) {
        this.tapChallengeAcceptedEvents = (this.tapChallengeAcceptedEvents || []).filter((entry) => {
            return entry && Number(entry.time || 0) >= now - 1000;
        });
    },

    getTapChallengeAcceptedInLastSecond(now = Date.now()) {
        this.pruneTapChallengeHistory(now);

        return this.tapChallengeAcceptedEvents.reduce((sum, entry) => {
            return sum + Math.max(0, Number(entry?.amount) || 0);
        }, 0);
    },

    getTapChallengeAllowedAmount(requestedAmount = 1) {
        const now = Date.now();
        let safeRequestedAmount = Math.max(1, Math.floor(Number(requestedAmount) || 1));

        safeRequestedAmount = Math.min(safeRequestedAmount, this.getTapChallengeMaxBurst());

        const timeSinceLast = this.tapChallengeLastTapAt > 0
            ? now - this.tapChallengeLastTapAt
            : 999999;

        if (safeRequestedAmount === 1 && timeSinceLast > 0 && timeSinceLast < this.getTapChallengeMinIntervalMs()) {
            return 0;
        }

        const used = this.getTapChallengeAcceptedInLastSecond(now);
        const remaining = Math.max(0, this.getTapChallengeMaxTapsPerSecond() - used);

        if (remaining <= 0) {
            return 0;
        }

        const allowed = Math.max(0, Math.min(safeRequestedAmount, remaining));

        if (allowed > 0) {
            this.tapChallengeAcceptedEvents.push({
                time: now,
                amount: allowed
            });
            this.tapChallengeLastTapAt = now;
        }

        return allowed;
    },

    renderTapChallenge() {
        const btn = document.getElementById("tapChallengeTapBtn");
        const status = document.getElementById("tapChallengeStatus");
        const timeText = document.getElementById("tapChallengeTimeText");
        const tapsText = document.getElementById("tapChallengeTapsText");
        const targetText = document.getElementById("tapChallengeTargetText");
        const resultBox = document.getElementById("tapChallengeResultBox");
        const resultText = document.getElementById("tapChallengeResultText");
        const claimBtn = document.getElementById("tapChallengeClaimBtn");

        const unlocked = this.isUnlocked("tapChallenge");

        if (targetText) {
            targetText.textContent = `${this.getTapChallengeTarget()}+`;
        }

        if (tapsText) {
            tapsText.textContent = CryptoZoo.formatNumber(this.tapChallengeClicks);
        }

        if (timeText) {
            if (this.tapChallengeSessionActive) {
                const leftMs = Math.max(0, this.tapChallengeEndsAt - Date.now());
                timeText.textContent = (leftMs / 1000).toFixed(1);
            } else {
                timeText.textContent = `${this.tapChallengeDurationSeconds.toFixed(1)}`;
            }
        }

        if (resultBox) {
            resultBox.style.display = this.tapChallengeResult ? "block" : "none";
        }

        if (resultText && this.tapChallengeResult) {
            const result = this.tapChallengeResult;
            const lines = [
                `${this.lt("taps", "Tapy")}: ${CryptoZoo.formatNumber(result.taps)}`,
                `${this.lt("reward", "Nagroda")}: +${CryptoZoo.formatNumber(result.coins)} coins${result.gems > 0 ? ` • +${CryptoZoo.formatNumber(result.gems)} gem` : ""}`
            ];

            if (result.gradeText) {
                lines.unshift(result.gradeText);
            }

            resultText.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
        }

        if (claimBtn) {
            claimBtn.disabled = !this.tapChallengeResult;
            claimBtn.style.opacity = this.tapChallengeResult ? "1" : "0.65";
        }

        if (status) {
            status.textContent = "";
            status.style.display = "none";
        }

        if (!btn) return;

        const cooldownLeft = this.getTapChallengeCooldownLeft();

        if (!unlocked) {
            btn.disabled = true;
            btn.textContent = `${this.lt("unlockAtLevel", "Odblokowanie na poziomie")} ${this.getUnlockLevel("tapChallenge")}`;
            btn.style.opacity = "0.72";
            btn.style.cursor = "not-allowed";
            return;
        }

        if (this.tapChallengeSessionActive) {
            btn.disabled = false;
            btn.textContent = this.lt("tapChallengeTapNow", "KLIKAJ!");
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            return;
        }

        if (this.tapChallengeResult) {
            btn.disabled = true;
            btn.textContent = this.lt("finished", "Koniec");
            btn.style.opacity = "0.72";
            btn.style.cursor = "not-allowed";
            return;
        }

        if (cooldownLeft > 0) {
            btn.disabled = true;
            btn.textContent = `${this.lt("tapChallengeCooldown", "Tap Challenge CD")} ${this.formatCooldown(cooldownLeft)}`;
            btn.style.opacity = "0.72";
            btn.style.cursor = "not-allowed";
            return;
        }

        btn.disabled = false;
        btn.textContent = this.lt("startTapChallenge", "Start Tap Challenge");
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    },

    startTapChallenge() {
        if (!this.isMiniGamesVisible()) return;

        if (!this.isUnlocked("tapChallenge")) {
            this.showLockedToast("tapChallenge");
            return;
        }

        if (!this.isTapChallengeReady()) {
            CryptoZoo.ui?.showToast?.(`${this.lt("tapChallengeReadyIn", "Tap Challenge gotowe za")} ${this.formatCooldown(this.getTapChallengeCooldownLeft())}`);
            return;
        }

        this.clearTapChallengeTimers();
        this.tapChallengeSessionActive = true;
        this.tapChallengeLocked = false;
        this.tapChallengeStartedAt = Date.now();
        this.tapChallengeEndsAt = this.tapChallengeStartedAt + this.tapChallengeDurationSeconds * 1000;
        this.tapChallengeClicks = 0;
        this.tapChallengeAcceptedEvents = [];
        this.tapChallengeLastTapAt = 0;
        this.tapChallengeResult = null;

        this.renderTapChallenge();

        this.tapChallengeTimerInterval = setInterval(() => {
            if (!this.tapChallengeSessionActive) {
                this.clearTapChallengeTimers();
                return;
            }

            if (Date.now() >= this.tapChallengeEndsAt) {
                this.finishTapChallenge();
                return;
            }

            this.renderTapChallenge();
        }, 80);
    },

    registerTapChallengePress(requestedAmount = 1) {
        if (!this.isUnlocked("tapChallenge")) {
            this.showLockedToast("tapChallenge");
            return;
        }

        if (!this.tapChallengeSessionActive) {
            this.startTapChallenge();
            return;
        }

        if (this.tapChallengeLocked) return;

        const allowed = this.getTapChallengeAllowedAmount(requestedAmount);

        if (allowed <= 0) {
            return;
        }

        this.tapChallengeClicks = Math.min(180, this.tapChallengeClicks + allowed);

        CryptoZoo.audio?.play?.("tap");
        this.renderTapChallenge();
    },

    getTapChallengeReward(clicks) {
        const safeClicks = Math.max(0, Math.min(180, Math.floor(Number(clicks) || 0)));
        const effectiveCoinsPerClick = Math.max(
            1,
            Number(CryptoZoo.gameplay?.getEffectiveCoinsPerClick?.() || CryptoZoo.state?.coinsPerClick || 1)
        );

        let coins = safeClicks * effectiveCoinsPerClick * 2;

        if (safeClicks >= 60) {
            coins += 300;
        }

        if (safeClicks >= 90) {
            coins += 700;
        }

        if (safeClicks >= 120) {
            coins += 1400;
        }

        if (safeClicks >= 150) {
            coins += 2200;
        }

        coins = Math.min(18000, Math.max(0, Math.floor(coins)));

        let gems = 0;
        if (safeClicks >= 90 && Math.random() < 0.04) gems = 1;
        if (safeClicks >= 130 && Math.random() < 0.08) gems = 1;

        let gradeText = "";
        if (safeClicks >= 150) {
            gradeText = "🔥 Master";
        } else if (safeClicks >= 120) {
            gradeText = "⚡ Great";
        } else if (safeClicks >= 90) {
            gradeText = "✅ Good";
        } else {
            gradeText = "🎯 Nice try";
        }

        return {
            taps: safeClicks,
            coins,
            gems,
            gradeText
        };
    },

    finishTapChallenge() {
        if (!this.tapChallengeSessionActive) return;

        this.tapChallengeSessionActive = false;
        this.tapChallengeLocked = true;
        this.clearTapChallengeTimers();
        this.startTapChallengeCooldown(this.tapChallengeCooldownSeconds);
        this.tapChallengeResult = this.getTapChallengeReward(this.tapChallengeClicks);

        this.renderTapChallenge();
    },

    claimTapChallengeReward() {
        if (!this.tapChallengeResult) return false;

        CryptoZoo.state = CryptoZoo.state || {};

        const result = this.tapChallengeResult;
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
        CryptoZoo.ui?.showToast?.(`🎮 ${this.lt("tapChallengeTitle", "Tap Challenge")}: ${toastParts.join(" • ")}`);

        this.tapChallengeResult = null;
        this.tapChallengeClicks = 0;
        this.tapChallengeAcceptedEvents = [];
        this.tapChallengeLastTapAt = 0;

        this.renderTapChallenge();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        return true;
    }
});
window.CryptoZoo = window.CryptoZoo || {};
CryptoZoo.ui = CryptoZoo.ui || {};

Object.assign(CryptoZoo.ui, {
    renderDailyMissionsSection() {
        const allMissions = CryptoZoo.dailyMissions?.getAll?.() || [];
        const visibleMission =
            CryptoZoo.dailyMissions?.getVisibleMission?.() ||
            allMissions.find((mission) => !mission.claimed) ||
            allMissions[allMissions.length - 1] ||
            null;

        const completedCount = allMissions.filter((mission) => !!mission.claimed).length;
        const totalCount = allMissions.length;
        const remainingCount = Math.max(0, totalCount - completedCount);

        let missionCardHtml = `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>🎯 ${this.t("dailyMission", "Daily Mission")}</h3>
                <div style="color:rgba(255,255,255,0.72);">${this.t("noMissionsToday", "Brak misji na dzisiaj")}</div>
            </div>
        `;

        if (visibleMission) {
            const target = Math.max(1, Number(visibleMission.target) || 1);
            const progress = Math.max(0, Number(visibleMission.progress) || 0);
            const safeProgress = Math.min(progress, target);
            const percent = Math.max(0, Math.min(100, (safeProgress / target) * 100));
            const isCompleted = !!CryptoZoo.dailyMissions?.isCompleted?.(visibleMission);
            const isClaimed = !!visibleMission.claimed;
            const isAllClaimed = totalCount > 0 && completedCount >= totalCount;

            let statusText = this.t("inProgress", "In progress");
            if (isClaimed) statusText = this.t("claimed", "Claimed");
            else if (isCompleted) statusText = this.t("ready", "Ready");

            let buttonLabel = this.t("inProgress", "In progress");
            let buttonDisabled = true;

            if (isClaimed) {
                buttonLabel = this.t("claimed", "Claimed");
                buttonDisabled = true;
            } else if (isCompleted) {
                buttonLabel = this.t("claim", "Claim");
                buttonDisabled = false;
            }

            const rewardText = visibleMission.rewardGems > 0
                ? `+${CryptoZoo.formatNumber(visibleMission.rewardCoins)} ${this.t("coins", "coins")} • +${CryptoZoo.formatNumber(visibleMission.rewardGems)} ${this.t("gem", "gem")}`
                : `+${CryptoZoo.formatNumber(visibleMission.rewardCoins)} ${this.t("coins", "coins")}`;

            const queueText = isAllClaimed
                ? this.t("allDailyMissionsCompleted", "All daily missions completed")
                : remainingCount > 1
                    ? `${this.t("nextMissionsLocked", "Next missions locked")}: ${CryptoZoo.formatNumber(Math.max(0, remainingCount - 1))}`
                    : this.t("lastMissionToday", "This is the last mission today");

            missionCardHtml = `
                <div class="expedition-card" style="margin-bottom:12px;">
                    <h3>🎯 ${this.t("dailyMission", "Daily Mission")}</h3>
                    <div style="font-size:15px; font-weight:900; margin-top:6px;">${visibleMission.title}</div>
                    <div style="margin-top:8px;">${this.t("status", "Status")}: ${statusText}</div>
                    <div>${this.t("progress", "Progress")}: ${CryptoZoo.formatNumber(safeProgress)} / ${CryptoZoo.formatNumber(target)}</div>
                    <div style="margin-top:8px; width:100%; height:10px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden;">
                        <div style="width:${percent}%; height:100%; border-radius:999px; background:linear-gradient(90deg,#4facfe 0%, #00f2fe 100%);"></div>
                    </div>
                    <div style="margin-top:8px;">${this.t("reward", "Reward")}: ${rewardText}</div>
                    <div style="margin-top:8px; font-size:12px; color:rgba(255,255,255,0.68);">${queueText}</div>
                    <button
                        id="claim-mission-${visibleMission.id}"
                        type="button"
                        ${buttonDisabled ? "disabled" : ""}
                        style="${buttonDisabled ? "opacity:0.72; cursor:not-allowed;" : ""} margin-top:10px;"
                    >${buttonLabel}</button>
                </div>
            `;
        }

        return `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>📅 ${this.t("dailyMissions", "Daily Missions")}</h3>
                <div>${this.t("completed", "Completed")}: ${CryptoZoo.formatNumber(completedCount)} / ${CryptoZoo.formatNumber(totalCount)}</div>
            </div>
            ${missionCardHtml}
        `;
    },

    bindDailyMissionButtons() {
        const mission =
            CryptoZoo.dailyMissions?.getVisibleMission?.() ||
            null;

        if (!mission) return;

        const isCompleted = !!CryptoZoo.dailyMissions?.isCompleted?.(mission);
        if (!isCompleted || mission.claimed) return;

        this.bindClick(`claim-mission-${mission.id}`, () => {
            CryptoZoo.dailyMissions?.claimMission?.(mission.id);
        });
    },

    getExpeditionTimeBoostOptions() {
        const rawOptions =
            CryptoZoo.expeditions?.getAvailableTimeBoostOptions?.() ||
            [];

        if (Array.isArray(rawOptions) && rawOptions.length) {
            return rawOptions
                .map((option) => ({
                    seconds: Math.max(0, Number(option?.seconds) || 0),
                    count: Math.max(0, Number(option?.count) || 0)
                }))
                .filter((option) => option.seconds > 0 && option.count > 0)
                .sort((a, b) => a.seconds - b.seconds);
        }

        const rawCharges = CryptoZoo.expeditions?.getTimeBoostCharges?.() || [];
        if (!Array.isArray(rawCharges) || !rawCharges.length) {
            return [];
        }

        const grouped = new Map();

        rawCharges.forEach((value) => {
            const seconds = Math.max(0, Number(value) || 0);
            if (seconds <= 0) return;

            grouped.set(seconds, (grouped.get(seconds) || 0) + 1);
        });

        return Array.from(grouped.entries())
            .map(([seconds, count]) => ({
                seconds: Math.max(0, Number(seconds) || 0),
                count: Math.max(0, Number(count) || 0)
            }))
            .filter((option) => option.seconds > 0 && option.count > 0)
            .sort((a, b) => a.seconds - b.seconds);
    },

    getExpeditionTimeBoostSummaryText() {
        const options = this.getExpeditionTimeBoostOptions();

        if (!options.length) {
            return "0";
        }

        return options
            .map((option) => {
                const label = this.formatDurationLabel(option.seconds);
                return `${label} x${CryptoZoo.formatNumber(option.count)}`;
            })
            .join(" • ");
    },

    renderExpeditionTimeBoostButtons() {
        const options = this.getExpeditionTimeBoostOptions();

        if (!options.length) {
            return `
                <button id="collect-expedition-btn" type="button" disabled>
                    ${this.t("expeditionInProgress", "Trwa ekspedycja")}
                </button>
            `;
        }

        return `
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                <div style="font-size:12px; color:rgba(255,255,255,0.72);">
                    ${this.t("chooseTimeReduction", "Wybierz skrócenie czasu")}
                </div>
                ${options.map((option) => {
                    const buttonId = `use-expedition-time-boost-${option.seconds}`;
                    return `
                        <button id="${buttonId}" type="button">
                            ⏩ ${this.formatDurationLabel(option.seconds)} (${CryptoZoo.formatNumber(option.count)})
                        </button>
                    `;
                }).join("")}
            </div>
        `;
    },

    bindExpeditionTimeBoostButtons() {
        const options = this.getExpeditionTimeBoostOptions();
        if (!options.length) return;

        options.forEach((option) => {
            const buttonId = `use-expedition-time-boost-${option.seconds}`;

            this.bindClick(buttonId, () => {
                if (typeof CryptoZoo.expeditions?.useSpecificTimeBoostOnActiveExpedition === "function") {
                    CryptoZoo.expeditions.useSpecificTimeBoostOnActiveExpedition(option.seconds);
                    return;
                }

                if (typeof CryptoZoo.expeditions?.useTimeBoostOnActiveExpedition === "function") {
                    CryptoZoo.expeditions.useTimeBoostOnActiveExpedition(option.seconds);
                }
            });
        });
    },

    updateActiveExpeditionTimerOnly() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) return false;

        const timerEl = document.getElementById("activeExpeditionTimeLeft");
        const actionWrap = document.getElementById("activeExpeditionActionWrap");
        if (!timerEl || !actionWrap) return false;

        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
        const canCollect = timeLeft <= 0;
        const timeBoostOptions = this.getExpeditionTimeBoostOptions();

        timerEl.textContent = this.formatTimeLeft(timeLeft);

        const currentMode = actionWrap.dataset.mode || "";

        let nextMode = "progress";
        if (canCollect) {
            nextMode = "collect";
        } else if (timeBoostOptions.length > 0) {
            nextMode = "boost";
        }

        if (currentMode !== nextMode) {
            this.renderExpeditions();
            return true;
        }

        if (nextMode === "boost") {
            const summaryEl = document.getElementById("activeExpeditionBoostSummary");
            const nextSummary = this.getExpeditionTimeBoostSummaryText();

            if (summaryEl && summaryEl.textContent !== nextSummary) {
                summaryEl.textContent = nextSummary;
            }

            const currentButtons = Array.from(
                actionWrap.querySelectorAll("[id^='use-expedition-time-boost-']")
            );

            if (currentButtons.length !== timeBoostOptions.length) {
                this.renderExpeditions();
                return true;
            }

            let needsFullRender = false;

            timeBoostOptions.forEach((option) => {
                const btn = document.getElementById(`use-expedition-time-boost-${option.seconds}`);
                const expectedText = `⏩ ${this.formatDurationLabel(option.seconds)} (${CryptoZoo.formatNumber(option.count)})`;

                if (!btn || btn.textContent !== expectedText) {
                    needsFullRender = true;
                }
            });

            if (needsFullRender) {
                this.renderExpeditions();
                return true;
            }
        }

        return true;
    },

    renderExpeditionCardsIntoMount(mountId, expeditions) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const safeExpeditions = Array.isArray(expeditions) ? expeditions : [];

        mount.innerHTML = safeExpeditions.map((exp) => {
            const rewardRangeText = this.getExpeditionRewardRangeText(exp);
            const isUnlocked = CryptoZoo.expeditions?.isUnlocked?.(exp) || false;
            const canAfford = CryptoZoo.expeditions?.canAffordStart?.(exp) || false;
            const requiredLevel = CryptoZoo.expeditions?.getUnlockRequirement?.(exp) || 1;
            const startCostCoins = CryptoZoo.expeditions?.getStartCostCoins?.(exp) || 0;

            let buttonLabel = this.t("start", "Start");
            let buttonDisabled = false;

            if (!isUnlocked) {
                buttonLabel = `${this.t("lvl", "Lvl")} ${CryptoZoo.formatNumber(requiredLevel)}`;
                buttonDisabled = true;
            } else if (!canAfford) {
                buttonLabel = `${this.t("cost", "Koszt")}: ${CryptoZoo.formatNumber(startCostCoins)}`;
                buttonDisabled = true;
            }

            const effectiveDuration =
                CryptoZoo.expeditions?.getEffectiveDurationSeconds?.(exp) ||
                Number(exp.duration || 0);

            const effectiveRareChance =
                CryptoZoo.expeditions?.getEffectiveRareChance?.(exp) ||
                Number(exp.rareChance || 0);

            const effectiveEpicChance =
                CryptoZoo.expeditions?.getEffectiveEpicChance?.(exp) ||
                Number(exp.epicChance || 0);

            const expeditionName = this.getLocalizedExpeditionName(exp);

            return `
                <div class="expedition-card">
                    <h3>${expeditionName}</h3>
                    <div>${this.t("time", "Czas")}: ${this.formatTimeLeft(effectiveDuration)}</div>
                    <div>
                        ${this.t("cost", "Koszt")} startu:
                        ${CryptoZoo.formatNumber(startCostCoins)} ${this.t("coins", "coins")}
                    </div>
                    <div>
                        ${this.t("baseReward", "Nagroda bazowa")}:
                        ${CryptoZoo.formatNumber(exp.baseCoins)} ${this.t("coins", "coins")}
                    </div>
                    <div>
                        ${this.t("rewardWallet", "Reward Wallet")}: ${rewardRangeText}
                    </div>
                    <div>
                        ${this.t("requiredLevel", "Wymagany poziom")}: ${CryptoZoo.formatNumber(requiredLevel)}
                    </div>
                    <div>
                        ${this.t("bonusChance", "Szansa na bonus")}:
                        ${this.t("rare", "Rare")} ${(effectiveRareChance * 100).toFixed(0)}% /
                        ${this.t("epic", "Epic")} ${(effectiveEpicChance * 100).toFixed(0)}%
                    </div>
                    <button
                        id="start-expedition-${exp.id}"
                        type="button"
                        ${buttonDisabled ? "disabled" : ""}
                        style="${buttonDisabled ? "opacity:0.65; cursor:not-allowed;" : ""}"
                    >${buttonLabel}</button>
                </div>
            `;
        }).join("");

        safeExpeditions.forEach((exp) => {
            if (
                CryptoZoo.expeditions?.isUnlocked?.(exp) &&
                CryptoZoo.expeditions?.canAffordStart?.(exp)
            ) {
                this.bindClick(`start-expedition-${exp.id}`, () => {
                    CryptoZoo.expeditions?.start?.(exp.id, []);
                });
            }
        });
    },

    renderExpeditions() {
        const container = document.getElementById("missionsList");
        if (!container) return;

        const dailyMissionsHtml = this.renderDailyMissionsSection();
        const expedition = CryptoZoo.state?.expedition;
        const isLocalTestMode = !!CryptoZoo.expeditions?.canUseLocalFallback?.();

        const testModeBadge = isLocalTestMode
            ? `
                <div class="expedition-card" style="margin-bottom:12px; border:1px solid rgba(79,172,254,0.35); background:linear-gradient(180deg, rgba(24,40,82,0.96) 0%, rgba(11,21,50,0.96) 100%);">
                    <h3>🧪 ${this.t("testMode", "Tryb testowy")}</h3>
                    <div style="color:rgba(255,255,255,0.78);">
                        ${this.t("githubTestModeExpeditions", "Ekspedycje działają lokalnie na GitHub / localhost. To tryb testowy bez VPS.")}
                    </div>
                </div>
            `
            : "";

        let activeExpeditionHtml = "";

        if (expedition) {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
            const canCollect = timeLeft <= 0;
            const rewardBalanceAmount = Math.max(
                0,
                Number(CryptoZoo.expeditions?.getRewardBalanceAmount?.(expedition)) || 0
            );

            const expeditionConfig = CryptoZoo.expeditions?.getById?.(expedition.id);
            const expeditionName = expeditionConfig
                ? this.getLocalizedExpeditionName(expeditionConfig)
                : (expedition.name || this.t("activeExpedition", "Aktywna ekspedycja"));

            const rarityMap = {
                common: this.t("common", "Common"),
                rare: this.t("rare", "Rare"),
                epic: this.t("epic", "Epic")
            };

            const timeBoostOptions = this.getExpeditionTimeBoostOptions();
            const timeBoostSummary = this.getExpeditionTimeBoostSummaryText();

            let actionMode = "progress";
            let actionHtml = `
                <button id="collect-expedition-btn" type="button" disabled>
                    ${this.t("expeditionInProgress", "Trwa ekspedycja")}
                </button>
            `;

            if (canCollect) {
                actionMode = "collect";
                actionHtml = `
                    <button id="collect-expedition-btn" type="button">
                        ${this.t("collectReward", "Odbierz nagrodę")}
                    </button>
                `;
            } else if (timeBoostOptions.length > 0) {
                actionMode = "boost";
                actionHtml = `
                    <div style="margin-top:10px;">
                        <div
                            style="font-size:12px; color:rgba(255,255,255,0.72); margin-bottom:8px;"
                        >
                            ${this.t("availableTimeBoosts", "Dostępne skrócenia czasu")}:
                            <span id="activeExpeditionBoostSummary">${timeBoostSummary}</span>
                        </div>
                        ${this.renderExpeditionTimeBoostButtons()}
                    </div>
                `;
            }

            const selectedAnimalsLabel = this.getSelectedAnimalsLabel(expedition.selectedAnimals);

            activeExpeditionHtml = `
                <div class="expedition-card" style="margin-bottom:12px;">
                    <h3>${this.t("activeExpedition", "Aktywna ekspedycja")}: ${expeditionName}</h3>
                    <div>${this.t("timeLeft", "Pozostało")}: <span id="activeExpeditionTimeLeft">${this.formatTimeLeft(timeLeft)}</span></div>
                    ${
                        selectedAnimalsLabel
                            ? `<div>${this.t("selectedAnimals", "Wybrane zwierzęta")}: ${selectedAnimalsLabel}</div>`
                            : ``
                    }
                    <div>${this.t("rewardQuality", "Jakość nagrody")}: ${rarityMap[expedition.rewardRarity] || this.t("common", "Common")}</div>
                    <div>
                        ${this.t("expectedReward", "Przewidywana nagroda")}:
                        ${CryptoZoo.formatNumber(expedition.rewardCoins)} ${this.t("coins", "coins")}
                        ${Number(expedition.rewardGems) > 0 ? ` + ${CryptoZoo.formatNumber(expedition.rewardGems)} ${this.t("gems", "gems")}` : ""}
                    </div>
                    <div>
                        ${this.t("rewardWallet", "Reward Wallet")}:
                        ${rewardBalanceAmount.toFixed(3)} ${this.t("rewardWord", "reward")}
                    </div>
                    <div id="activeExpeditionActionWrap" data-mode="${actionMode}">
                        ${actionHtml}
                    </div>
                </div>
            `;
        }

        const rareBonus = Math.max(
            0,
            Number(CryptoZoo.expeditions?.getRareChanceBonus?.() || 0)
        );
        const epicBonus = Math.max(
            0,
            Number(CryptoZoo.expeditions?.getEpicChanceBonus?.() || 0)
        );

        const timeBoostSummaryText = this.getExpeditionTimeBoostSummaryText();

        const depositBoostMultiplier = Math.max(
            1,
            Number(CryptoZoo.expeditions?.getExpeditionBoostMultiplier?.() || 1)
        );
        const depositBoostPercent = Math.max(
            0,
            Math.round((depositBoostMultiplier - 1) * 100)
        );
        const depositBoostActiveUntil = Math.max(
            0,
            Number(CryptoZoo.state?.expeditionBoostActiveUntil) || 0
        );
        const depositBoostActive = depositBoostActiveUntil > Date.now();

        let depositBoostText = this.t("inactive", "Nieaktywny");
        if (depositBoostActive && depositBoostPercent > 0) {
            depositBoostText = `+${CryptoZoo.formatNumber(depositBoostPercent)}%`;
        }

        let depositBoostTimeText = this.t("inactive", "Nieaktywny");
        if (depositBoostActive) {
            const remainingSeconds = Math.max(
                0,
                Math.floor((depositBoostActiveUntil - Date.now()) / 1000)
            );
            depositBoostTimeText = this.formatTimeLeft(remainingSeconds);
        }

        const expeditionInfoCard = `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>🧭 ${this.t("expeditionUpgrades", "Expedition Upgrades")}</h3>
                <div>${this.t("rareBonus", "Rare bonus")}: +${(rareBonus * 100).toFixed(0)}%</div>
                <div>${this.t("epicBonus", "Epic bonus")}: +${(epicBonus * 100).toFixed(0)}%</div>
                <div>${this.t("timeBoostsAvailable", "Dostępne skrócenia czasu")}: ${timeBoostSummaryText}</div>
                <div>Bonus depozytu: ${depositBoostText}</div>
                <div>Boost depozytu czas: ${depositBoostTimeText}</div>
            </div>
        `;

        container.innerHTML = `
            ${dailyMissionsHtml}
            ${testModeBadge}
            ${activeExpeditionHtml}
            ${expeditionInfoCard}
            <div id="expeditionRegionsMount"></div>
        `;

        this.bindDailyMissionButtons();

        if (expedition) {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
            const canCollect = timeLeft <= 0;
            const timeBoostOptionsActive = this.getExpeditionTimeBoostOptions();

            if (canCollect) {
                this.bindClick("collect-expedition-btn", () => {
                    CryptoZoo.expeditions?.collect?.();
                });
            }

            if (!canCollect && timeBoostOptionsActive.length > 0) {
                this.bindExpeditionTimeBoostButtons();
            }
        }

        CryptoZoo.expeditionRegionsUi?.render?.();
    }
});
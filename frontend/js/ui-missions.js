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

    updateActiveExpeditionTimerOnly() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) return false;

        const timerEl = document.getElementById("activeExpeditionTimeLeft");
        const actionWrap = document.getElementById("activeExpeditionActionWrap");
        if (!timerEl || !actionWrap) return false;

        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((expedition.endTime - now) / 1000));
        const canCollect = timeLeft <= 0;

        timerEl.textContent = this.formatTimeLeft(timeLeft);

        const timeBoostChargesCount =
            CryptoZoo.expeditions?.getTimeBoostChargesCount?.() ||
            CryptoZoo.state?.expeditionStats?.timeBoostCharges?.length ||
            0;

        const currentMode = actionWrap.dataset.mode || "";

        let nextMode = "progress";
        if (canCollect) {
            nextMode = "collect";
        } else if (timeBoostChargesCount > 0) {
            nextMode = "boost";
        }

        if (currentMode !== nextMode) {
            this.renderExpeditions();
            return true;
        }

        if (nextMode === "boost") {
            const btn = document.getElementById("use-expedition-time-boost-btn");
            if (btn) {
                btn.textContent = `⏩ ${this.t("useTimeReduction", "Użyj skracania czasu")} (${CryptoZoo.formatNumber(timeBoostChargesCount)})`;
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

            const timeBoostChargesCount =
                CryptoZoo.expeditions?.getTimeBoostChargesCount?.() ||
                CryptoZoo.state?.expeditionStats?.timeBoostCharges?.length ||
                0;

            const selectedAnimalsLabel = this.getSelectedAnimalsLabel(expedition.selectedAnimals);

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
            } else if (timeBoostChargesCount > 0) {
                actionMode = "boost";
                actionHtml = `
                    <button id="use-expedition-time-boost-btn" type="button">
                        ⏩ ${this.t("useTimeReduction", "Użyj skracania czasu")} (${CryptoZoo.formatNumber(timeBoostChargesCount)})
                    </button>
                `;
            }

            container.innerHTML = `
                ${dailyMissionsHtml}
                ${testModeBadge}
                <div class="expedition-card">
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

            this.bindDailyMissionButtons();

            if (canCollect) {
                this.bindClick("collect-expedition-btn", () => {
                    CryptoZoo.expeditions?.collect?.();
                });
            }

            if (!canCollect && timeBoostChargesCount > 0) {
                this.bindClick("use-expedition-time-boost-btn", () => {
                    CryptoZoo.expeditions?.useTimeBoostOnActiveExpedition?.();
                });
            }

            return;
        }

        const rareBonus = Math.max(
            0,
            Number(CryptoZoo.expeditions?.getRareChanceBonus?.() || 0)
        );
        const epicBonus = Math.max(
            0,
            Number(CryptoZoo.expeditions?.getEpicChanceBonus?.() || 0)
        );
        const timeBoostChargesCount =
            CryptoZoo.expeditions?.getTimeBoostChargesCount?.() ||
            CryptoZoo.state?.expeditionStats?.timeBoostCharges?.length ||
            0;

        const expeditionInfoCard = `
            <div class="expedition-card" style="margin-bottom:12px;">
                <h3>🧭 ${this.t("expeditionUpgrades", "Expedition Upgrades")}</h3>
                <div>${this.t("rareBonus", "Rare bonus")}: +${(rareBonus * 100).toFixed(0)}%</div>
                <div>${this.t("epicBonus", "Epic bonus")}: +${(epicBonus * 100).toFixed(0)}%</div>
                <div>${this.t("timeBoostsAvailable", "Time boosts available")}: ${CryptoZoo.formatNumber(timeBoostChargesCount)}</div>
            </div>
        `;

        container.innerHTML = `
            ${dailyMissionsHtml}
            ${testModeBadge}
            ${expeditionInfoCard}
            <div id="expeditionRegionsMount"></div>
        `;

        this.bindDailyMissionButtons();
        CryptoZoo.expeditionRegionsUi?.render?.();
    }
});
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiUpdates = {
    t(key, fallback) {
        return CryptoZoo.lang?.t?.(key) || fallback || key;
    },

    getUpdates() {
        return [
            this.t("updateDailyMissions", "🐾 Daily Missions (zadania dzienne)"),
            this.t("updateAchievements", "🏆 System osiągnięć"),
            this.t("updateWeeklyEvents", "🎉 Eventy tygodniowe"),
            this.t("updateNewBoosts", "💎 Nowe boosty i ulepszenia"),
            this.t("updateBetterEconomy", "📈 Lepszy balans economy"),
            this.t("updateReferral", "🤝 System poleceń (referral)"),
            this.t("updateWithdrawUpgrade", "🏦 Withdraw system upgrade"),
            this.t("updateMonthlyReward", "🎁 Monthly reward system")
        ];
    },

    render() {
        const container = document.getElementById("settingsUpdatesMount");
        if (!container) return;

        const updates = this.getUpdates();

        container.innerHTML = `
            <div class="profile-boost-row" style="margin-top:14px;">
                <div class="profile-boost-left" style="width:100%;">
                    <div class="profile-boost-label">${this.t("comingSoon", "🚀 Wkrótce")}</div>

                    <div style="
                        margin-top:10px;
                        display:flex;
                        flex-direction:column;
                        gap:6px;
                        font-size:13px;
                        color:rgba(255,255,255,0.8);
                        font-weight:700;
                    ">
                        ${updates.map((u) => `<div>• ${u}</div>`).join("")}
                    </div>
                </div>
            </div>
        `;
    }
};
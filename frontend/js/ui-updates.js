window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiUpdates = {
    getUpdates() {
        return [
            "🐾 Daily Missions (zadania dzienne)",
            "🏆 System osiągnięć",
            "🎉 Eventy tygodniowe",
            "💎 Nowe boosty i ulepszenia",
            "📈 Lepszy balans economy",
            "🤝 System poleceń (referral)",
            "🏦 Withdraw system upgrade",
            "🎁 Monthly reward system"
        ];
    },

    render() {
        const container = document.getElementById("settingsUpdatesMount");
        if (!container) return;

        const updates = this.getUpdates();

        container.innerHTML = `
            <div class="profile-boost-row" style="margin-top:14px;">
                <div class="profile-boost-left" style="width:100%;">
                    <div class="profile-boost-label">🚀 Wkrótce</div>

                    <div style="
                        margin-top:10px;
                        display:flex;
                        flex-direction:column;
                        gap:6px;
                        font-size:13px;
                        color:rgba(255,255,255,0.8);
                        font-weight:700;
                    ">
                        ${updates.map(u => `<div>• ${u}</div>`).join("")}
                    </div>
                </div>
            </div>
        `;
    }
};
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiUpdates = {
    getUpdates() {
        return [
            {
                icon: "🎮",
                title: "Nowe minigry",
                desc: "Tap Challenge, Lucky Box, ulepszony Memory"
            },
            {
                icon: "🎡",
                title: "Wheel Rework",
                desc: "Nowy wygląd + lepsze nagrody"
            },
            {
                icon: "🏆",
                title: "Achievements",
                desc: "System osiągnięć i milestone rewards"
            },
            {
                icon: "🎉",
                title: "Eventy",
                desc: "Tygodniowe i sezonowe eventy"
            },
            {
                icon: "💎",
                title: "Boosty",
                desc: "Nowe boosty i ulepszenia"
            },
            {
                icon: "📈",
                title: "Balans",
                desc: "Lepsza economy i progresja"
            },
            {
                icon: "🤝",
                title: "Referral",
                desc: "System poleceń + nagrody"
            },
            {
                icon: "🏦",
                title: "Withdraw v2",
                desc: "Ulepszony system wypłat"
            },
            {
                icon: "🎁",
                title: "Monthly Rewards",
                desc: "Streak + nagrody miesięczne"
            },
            {
                icon: "🧑‍🌾",
                title: "Zoo Expansion",
                desc: "Nowe zwierzęta i poziomy"
            },
            {
                icon: "⚙️",
                title: "Settings v2",
                desc: "Statystyki i ustawienia"
            },
            {
                icon: "🛡️",
                title: "Anti-cheat",
                desc: "Zabezpieczenia i system ochrony"
            }
        ];
    },

    render() {
        const container = document.getElementById("settingsUpdatesMount");
        if (!container) return;

        const updates = this.getUpdates();

        container.innerHTML = `
            <div class="profile-boost-row" style="margin-top:14px;">
                <div class="profile-boost-left" style="width:100%;">
                    
                    <div class="profile-boost-label" style="margin-bottom:10px;">
                        🚀 Wkrótce
                    </div>

                    <div style="
                        display:grid;
                        grid-template-columns:1fr;
                        gap:10px;
                    ">
                        ${updates.map(item => `
                            <div style="
                                padding:14px;
                                border-radius:18px;
                                background:linear-gradient(180deg, rgba(18,28,48,0.95) 0%, rgba(10,17,31,0.95) 100%);
                                border:1px solid rgba(255,255,255,0.08);
                                box-shadow:0 6px 20px rgba(0,0,0,0.25);
                                display:flex;
                                align-items:flex-start;
                                gap:12px;
                            ">

                                <div style="
                                    font-size:20px;
                                    line-height:1;
                                ">
                                    ${item.icon}
                                </div>

                                <div style="flex:1;">
                                    <div style="
                                        font-size:14px;
                                        font-weight:900;
                                        color:#ffffff;
                                        margin-bottom:4px;
                                    ">
                                        ${item.title}
                                    </div>

                                    <div style="
                                        font-size:12px;
                                        color:rgba(255,255,255,0.72);
                                        font-weight:600;
                                        line-height:1.4;
                                    ">
                                        ${item.desc}
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>

                </div>
            </div>
        `;
    }
};
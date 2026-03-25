window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiUpdates = {
    stylesInjected: false,

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

    injectStyles() {
        if (this.stylesInjected || document.getElementById("cz-updates-styles")) {
            this.stylesInjected = true;
            return;
        }

        const style = document.createElement("style");
        style.id = "cz-updates-styles";
        style.textContent = `
            .cz-updates-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
            }

            .cz-update-card {
                position: relative;
                overflow: hidden;
                padding: 14px;
                border-radius: 18px;
                background:
                    linear-gradient(180deg, rgba(18,28,48,0.96) 0%, rgba(10,17,31,0.96) 100%);
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow:
                    0 10px 24px rgba(0,0,0,0.26),
                    inset 0 1px 0 rgba(255,255,255,0.04);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                transform: translateY(0) scale(1);
                transition:
                    transform 0.22s ease,
                    box-shadow 0.22s ease,
                    border-color 0.22s ease,
                    background 0.22s ease;
                animation: czUpdatePulse 3.8s ease-in-out infinite;
            }

            .cz-update-card::before {
                content: "";
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(
                        120deg,
                        rgba(255,255,255,0) 0%,
                        rgba(255,255,255,0.035) 35%,
                        rgba(255,255,255,0.09) 50%,
                        rgba(255,255,255,0.035) 65%,
                        rgba(255,255,255,0) 100%
                    );
                transform: translateX(-140%);
                animation: czUpdateShine 5.2s linear infinite;
                pointer-events: none;
            }

            .cz-update-card::after {
                content: "";
                position: absolute;
                inset: -1px;
                border-radius: 18px;
                pointer-events: none;
                box-shadow:
                    0 0 0 1px rgba(255,255,255,0.02),
                    0 0 20px rgba(79, 172, 254, 0.06);
                opacity: 0.9;
            }

            .cz-update-card:hover {
                transform: translateY(-2px) scale(1.012);
                border-color: rgba(255,255,255,0.14);
                box-shadow:
                    0 14px 30px rgba(0,0,0,0.34),
                    0 0 18px rgba(79,172,254,0.10),
                    inset 0 1px 0 rgba(255,255,255,0.05);
            }

            .cz-update-icon-wrap {
                position: relative;
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow:
                    0 0 12px rgba(255,255,255,0.03),
                    inset 0 1px 0 rgba(255,255,255,0.05);
                animation: czIconGlow 2.8s ease-in-out infinite;
            }

            .cz-update-icon {
                font-size: 20px;
                line-height: 1;
                transform-origin: center;
                animation: czIconFloat 2.8s ease-in-out infinite;
            }

            .cz-update-body {
                flex: 1;
                min-width: 0;
            }

            .cz-update-title {
                font-size: 14px;
                font-weight: 900;
                color: #ffffff;
                margin-bottom: 4px;
                letter-spacing: 0.01em;
            }

            .cz-update-desc {
                font-size: 12px;
                color: rgba(255,255,255,0.74);
                font-weight: 700;
                line-height: 1.42;
            }

            .cz-updates-header {
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .cz-updates-badge {
                padding: 4px 9px;
                border-radius: 999px;
                background: rgba(255,191,0,0.10);
                border: 1px solid rgba(255,191,0,0.16);
                color: rgba(255,231,163,0.96);
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 0.02em;
                box-shadow: 0 0 12px rgba(255,191,0,0.06);
                animation: czBadgePulse 2.4s ease-in-out infinite;
            }

            @keyframes czUpdatePulse {
                0%, 100% {
                    box-shadow:
                        0 10px 24px rgba(0,0,0,0.26),
                        0 0 0 rgba(79,172,254,0),
                        inset 0 1px 0 rgba(255,255,255,0.04);
                }
                50% {
                    box-shadow:
                        0 12px 28px rgba(0,0,0,0.28),
                        0 0 16px rgba(79,172,254,0.08),
                        inset 0 1px 0 rgba(255,255,255,0.04);
                }
            }

            @keyframes czUpdateShine {
                0% {
                    transform: translateX(-140%);
                }
                100% {
                    transform: translateX(160%);
                }
            }

            @keyframes czIconGlow {
                0%, 100% {
                    box-shadow:
                        0 0 10px rgba(79,172,254,0.06),
                        inset 0 1px 0 rgba(255,255,255,0.05);
                }
                50% {
                    box-shadow:
                        0 0 18px rgba(79,172,254,0.14),
                        inset 0 1px 0 rgba(255,255,255,0.06);
                }
            }

            @keyframes czIconFloat {
                0%, 100% {
                    transform: translateY(0) scale(1);
                }
                50% {
                    transform: translateY(-1px) scale(1.06);
                }
            }

            @keyframes czBadgePulse {
                0%, 100% {
                    box-shadow: 0 0 12px rgba(255,191,0,0.05);
                }
                50% {
                    box-shadow: 0 0 18px rgba(255,191,0,0.11);
                }
            }
        `;

        document.head.appendChild(style);
        this.stylesInjected = true;
    },

    render() {
        const container = document.getElementById("settingsUpdatesMount");
        if (!container) return;

        this.injectStyles();

        const updates = this.getUpdates();

        container.innerHTML = `
            <div class="profile-boost-row" style="margin-top:14px;">
                <div class="profile-boost-left" style="width:100%;">
                    <div class="cz-updates-header">
                        <div class="profile-boost-label">🚀 Wkrótce</div>
                        <div class="cz-updates-badge">PREMIUM ROADMAP</div>
                    </div>

                    <div class="cz-updates-grid">
                        ${updates.map((item) => `
                            <div class="cz-update-card">
                                <div class="cz-update-icon-wrap">
                                    <div class="cz-update-icon">${item.icon}</div>
                                </div>

                                <div class="cz-update-body">
                                    <div class="cz-update-title">${item.title}</div>
                                    <div class="cz-update-desc">${item.desc}</div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    }
};
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiFaq = {
    isOpen: false,

    getLanguage() {
        return CryptoZoo.lang?.current || "en";
    },

    t(key, fallback = "") {
        const translated = CryptoZoo.lang?.t?.(key);
        if (translated && translated !== key) {
            return translated;
        }
        return fallback || key;
    },

    getFaqItems() {
        return [
            {
                id: "what-is-game",
                q: this.t("faqWhatIsGameQ", "🐾 What is Crypto Zoo?"),
                a: this.t("faqWhatIsGameA", "Crypto Zoo is a clicker + idle Telegram WebApp game where you build your own zoo, earn coins, buy animals, upgrade income, and unlock more game systems.")
            },
            {
                id: "how-earn-coins",
                q: this.t("faqHowEarnCoinsQ", "🪙 How do I earn coins?"),
                a: this.t("faqHowEarnCoinsA", "You earn coins by tapping the main button, from passive zoo income, daily reward, daily missions, memory, and expeditions.")
            },
            {
                id: "gems",
                q: this.t("faqGemsQ", "💎 What are Gems?"),
                a: this.t("faqGemsA", "Gems are premium currency used for special features such as X2 Boost and future premium systems.")
            },
            {
                id: "reward",
                q: this.t("faqRewardQ", "🎯 What is Reward?"),
                a: this.t("faqRewardA", "Reward is a special earning currency. It first goes to Reward Balance, then you can transfer it to Wallet and use it for withdraw.")
            },
            {
                id: "daily-reward",
                q: this.t("faqDailyRewardQ", "🎁 How does Daily Reward work?"),
                a: this.t("faqDailyRewardA", "Daily Reward can be claimed every 24 hours. The system includes a 7-day streak for better rewards.")
            },
            {
                id: "daily-missions",
                q: this.t("faqDailyMissionsQ", "📋 How do Daily Missions work?"),
                a: this.t("faqDailyMissionsA", "Each day you get missions. They unlock one by one after claiming the previous one.")
            },
            {
                id: "memory",
                q: this.t("faqMemoryQ", "🧠 How does Memory work?"),
                a: this.t("faqMemoryA", "Match all pairs to win. After completion you receive coins and gems, then cooldown starts.")
            },
            {
                id: "expeditions",
                q: this.t("faqExpeditionsQ", "🚀 How do expeditions work?"),
                a: this.t("faqExpeditionsA", "Send animals on expeditions. After time you receive coins and additional rewards based on expedition quality.")
            },
            {
                id: "boost",
                q: this.t("faqBoostQ", "⚡ How does X2 Boost work?"),
                a: this.t("faqBoostA", "X2 Boost doubles tap income and zoo income for 10 minutes.")
            },
            {
                id: "animals",
                q: this.t("faqAnimalsQ", "🦁 How do animals work?"),
                a: this.t("faqAnimalsA", "Each animal generates income. More animals and higher levels increase zoo income.")
            },
            {
                id: "wallet",
                q: this.t("faqWalletQ", "🏦 How does Reward Wallet work?"),
                a: this.t("faqWalletA", "You can transfer Reward Balance to Wallet. Wallet is used for withdrawals.")
            },
            {
                id: "withdraw",
                q: this.t("faqWithdrawQ", "📤 How does withdraw work?"),
                a: this.t("faqWithdrawA", "After reaching minimum amount you can create a withdraw request and track its status.")
            },
            {
                id: "ref",
                q: this.t("faqRefQ", "🤝 How does referral work?"),
                a: this.t("faqRefA", "Invite players using your link and earn bonuses based on their activity.")
            }
        ];
    },

    render() {
        const mount = document.getElementById("settingsFaqMount");
        if (!mount) return;

        if (!this.isOpen) {
            mount.innerHTML = "";
            return;
        }

        const title = this.t("faqHelp", "FAQ / Help");
        const items = this.getFaqItems();

        mount.innerHTML = `
            <div class="profile-boost-row" style="margin-top:14px;">
                <div class="profile-boost-left" style="width:100%;">
                    <div class="profile-boost-label">${title}</div>
                    <div style="margin-top:10px;">
                        ${items.map(item => `
                            <div style="padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.08);">
                                <div style="font-weight:900; color:#ffffff; line-height:1.35;">
                                    ${item.q}
                                </div>
                                <div style="opacity:0.84; font-size:13px; margin-top:6px; line-height:1.55; color:rgba(255,255,255,0.88);">
                                    ${item.a}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    },

    open() {
        this.isOpen = true;
        this.render();
    },

    close() {
        this.isOpen = false;
        this.render();
    },

    toggle() {
        this.isOpen = !this.isOpen;
        this.render();
    }
};
window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiFaq = {
    isOpen: false,

    getLanguage() {
        return CryptoZoo.lang?.current || "en";
    },

    getFaqItems() {
        const lang = this.getLanguage();

        if (lang === "pl") {
            return [
                {
                    id: "what-is-game",
                    q: "🐾 Czym jest Crypto Zoo?",
                    a: "Crypto Zoo to gra clicker + idle, w której rozwijasz swoje zoo, zdobywasz coins, wykonujesz misje, grasz w minigry i zarządzasz rozwojem."
                },
                {
                    id: "how-earn-coins",
                    q: "🪙 Jak zdobywać coins?",
                    a: "Coins zdobywasz klikając, z pasywnego dochodu zoo, ulepszając zwierzęta, wykonując misje dzienne, grając w minigry i robiąc ekspedycje."
                },
                {
                    id: "gems",
                    q: "💎 Czym są Gems?",
                    a: "Gems to waluta premium używana do specjalnych akcji jak X2 Boost, dodatkowe spiny oraz skracanie czasu ekspedycji."
                },
                {
                    id: "reward",
                    q: "🎯 Czym jest Reward?",
                    a: "Reward to specjalna waluta zarobkowa. Trafia najpierw do Reward Balance, potem możesz ją przenieść do Wallet i wypłacić."
                },
                {
                    id: "daily-reward",
                    q: "🎁 Jak działa Daily Reward?",
                    a: "Daily Reward można odebrać co 24 godziny. System posiada streak do 7 dni, który zwiększa nagrody."
                },
                {
                    id: "daily-missions",
                    q: "📋 Jak działają Daily Missions?",
                    a: "Każdego dnia dostajesz zestaw misji. Wykonujesz je po kolei — kolejna odblokowuje się dopiero po odebraniu poprzedniej."
                },
                {
                    id: "wheel",
                    q: "🎡 Jak działa Wheel?",
                    a: "Darmowy spin jest dostępny co 2 godziny. Możesz też używać dodatkowych spinów. Nagrody to coins i gems."
                },
                {
                    id: "memory",
                    q: "🧠 Jak działa Memory?",
                    a: "Znajdź wszystkie pary kart. Po ukończeniu dostajesz coins i gems. Następnie uruchamia się cooldown."
                },
                {
                    id: "expeditions",
                    q: "🚀 Jak działają ekspedycje?",
                    a: "Wysyłasz zwierzęta na ekspedycje. Po czasie dostajesz coins oraz dodatkowe nagrody zależne od jakości ekspedycji."
                },
                {
                    id: "boost",
                    q: "⚡ Jak działa X2 Boost?",
                    a: "X2 Boost podwaja dochód z kliknięć oraz zoo na 10 minut."
                },
                {
                    id: "animals",
                    q: "🦁 Jak działają zwierzęta?",
                    a: "Każde zwierzę generuje dochód. Im więcej zwierząt i wyższy poziom, tym większy zoo income."
                },
                {
                    id: "wallet",
                    q: "🏦 Jak działa Reward Wallet?",
                    a: "Reward Balance możesz przenieść do Wallet. Wallet służy do tworzenia wypłat."
                },
                {
                    id: "withdraw",
                    q: "📤 Jak działa withdraw?",
                    a: "Po osiągnięciu minimalnej wartości możesz utworzyć withdraw request. Status możesz sprawdzić w historii."
                },
                {
                    id: "ref",
                    q: "🤝 Jak działa referral?",
                    a: "Zapraszaj graczy swoim linkiem. Otrzymujesz bonusy za aktywność zaproszonych użytkowników."
                }
            ];
        }

        return [
            {
                id: "what-is-game",
                q: "🐾 What is Crypto Zoo?",
                a: "Crypto Zoo is a clicker + idle game where you build your zoo, earn coins, complete missions, play mini games, and manage progression."
            },
            {
                id: "how-earn-coins",
                q: "🪙 How do I earn coins?",
                a: "You earn coins by tapping, passive zoo income, upgrading animals, completing daily missions, mini games, and expeditions."
            },
            {
                id: "gems",
                q: "💎 What are Gems?",
                a: "Gems are premium currency used for X2 Boost, extra spins, and expedition time reduction."
            },
            {
                id: "reward",
                q: "🎯 What is Reward?",
                a: "Reward is a special earning currency. It goes to Reward Balance, then can be transferred to Wallet and withdrawn."
            },
            {
                id: "daily-reward",
                q: "🎁 How does Daily Reward work?",
                a: "Daily Reward can be claimed every 24 hours. The system includes a 7-day streak for better rewards."
            },
            {
                id: "daily-missions",
                q: "📋 How do Daily Missions work?",
                a: "Each day you get missions. They unlock one by one after claiming the previous one."
            },
            {
                id: "wheel",
                q: "🎡 How does the Wheel work?",
                a: "You get a free spin every 2 hours. You can also use extra spins. Rewards include coins and gems."
            },
            {
                id: "memory",
                q: "🧠 How does Memory work?",
                a: "Match all pairs to win. After completion you receive coins and gems, then cooldown starts."
            },
            {
                id: "expeditions",
                q: "🚀 How do expeditions work?",
                a: "Send animals on expeditions. After time you receive coins and additional rewards based on expedition quality."
            },
            {
                id: "boost",
                q: "⚡ How does X2 Boost work?",
                a: "X2 Boost doubles tap income and zoo income for 10 minutes."
            },
            {
                id: "animals",
                q: "🦁 How do animals work?",
                a: "Each animal generates income. More animals and higher levels increase zoo income."
            },
            {
                id: "wallet",
                q: "🏦 How does Reward Wallet work?",
                a: "You can transfer Reward Balance to Wallet. Wallet is used for withdrawals."
            },
            {
                id: "withdraw",
                q: "📤 How does withdraw work?",
                a: "After reaching minimum amount you can create a withdraw request and track its status."
            },
            {
                id: "ref",
                q: "🤝 How does referral work?",
                a: "Invite players using your link and earn bonuses based on their activity."
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

        const items = this.getFaqItems();

        mount.innerHTML = `
            <div style="margin-top:14px;">
                ${items.map(item => `
                    <div style="margin-bottom:10px;">
                        <div style="font-weight:900;">${item.q}</div>
                        <div style="opacity:0.8; font-size:13px; margin-top:4px;">
                            ${item.a}
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    },

    toggle() {
        this.isOpen = !this.isOpen;
        this.render();
    }
};
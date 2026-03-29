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
                    a: "Crypto Zoo to gra clicker + idle w Telegram WebApp, w której rozwijasz własne zoo, zbierasz coins, kupujesz zwierzęta, ulepszasz dochód i odblokowujesz kolejne systemy gry."
                },
                {
                    id: "how-earn-coins",
                    q: "🪙 Jak zdobywać coins?",
                    a: "Coins zdobywasz klikając w główny przycisk, z pasywnego dochodu zoo, z daily reward, daily missions, memory oraz ekspedycji."
                },
                {
                    id: "zoo-income",
                    q: "🏞 Jak działa dochód zoo / sek?",
                    a: "Dochód zoo to pasywny income generowany automatycznie przez posiadane zwierzęta. Im więcej zwierząt i wyższe ich levele, tym większy dochód na sekundę."
                },
                {
                    id: "animals",
                    q: "🦁 Jak działają zwierzęta?",
                    a: "Każde zwierzę zwiększa dochód Twojego zoo. Możesz kupować kolejne sztuki oraz ulepszać level zwierząt, żeby zwiększać ich wartość."
                },
                {
                    id: "level",
                    q: "📈 Jak działa level i XP?",
                    a: "Za aktywność w grze zdobywasz XP. Po zapełnieniu paska awansujesz na kolejny level, co pokazuje rozwój konta."
                },
                {
                    id: "gems",
                    q: "💎 Czym są Gems?",
                    a: "Gems to waluta premium używana do specjalnych funkcji, takich jak X2 Boost i inne przyszłe systemy premium."
                },
                {
                    id: "boost",
                    q: "⚡ Jak działa X2 Boost?",
                    a: "X2 Boost podwaja dochód z klikania i dochód zoo przez ograniczony czas. Po aktywacji przycisk i status boosta pokazują aktywny efekt."
                },
                {
                    id: "reward",
                    q: "🎯 Czym jest Reward?",
                    a: "Reward to specjalna waluta zarobkowa. Najpierw trafia do Reward Balance, potem możesz ją przenieść do Wallet i użyć do withdraw."
                },
                {
                    id: "wallet",
                    q: "🏦 Czym jest Reward Wallet?",
                    a: "Reward Wallet to saldo gotowe do wypłaty. Najpierw zbierasz Reward Balance, a potem przenosisz je do Wallet."
                },
                {
                    id: "withdraw",
                    q: "📤 Jak działa withdraw?",
                    a: "Po osiągnięciu minimalnej wartości w Reward Wallet możesz utworzyć withdraw request. Jego status sprawdzisz w historii wypłat."
                },
                {
                    id: "deposit",
                    q: "💸 Jak działa deposit?",
                    a: "W settings możesz wybrać kwotę depozytu i utworzyć deposit. Historia wpłat pokazuje później status każdej transakcji."
                },
                {
                    id: "daily-reward",
                    q: "🎁 Jak działa Daily Reward?",
                    a: "Daily Reward można odebrać co 24 godziny. System działa na cooldownie i jest częścią codziennego progresu."
                },
                {
                    id: "daily-missions",
                    q: "📋 Jak działają Daily Missions?",
                    a: "Codziennie dostajesz zestaw misji. Misje są wykonywane po kolei i pomagają zdobywać dodatkowe coins oraz inne nagrody."
                },
                {
                    id: "memory",
                    q: "🧠 Jak działa Memory?",
                    a: "Memory to minigra polegająca na odnajdywaniu par. Po ukończeniu dostajesz nagrody, a potem uruchamia się cooldown."
                },
                {
                    id: "expeditions",
                    q: "🚀 Jak działają ekspedycje?",
                    a: "Wysyłasz zwierzęta na ekspedycje i po czasie odbierasz nagrody. To dodatkowy system rozwoju poza klikaniem."
                },
                {
                    id: "referral",
                    q: "🤝 Jak działa referral?",
                    a: "Możesz zapraszać znajomych własnym linkiem referral. System referral służy do rozwijania gry i przyszłych bonusów za aktywnych graczy."
                },
                {
                    id: "telegram",
                    q: "📱 Czy gra działa tylko w Telegram?",
                    a: "Tak, aktualnie Crypto Zoo jest przygotowywane pod Telegram WebApp i tam ma działać docelowo."
                },
                {
                    id: "saving",
                    q: "💾 Czy postęp zapisuje się automatycznie?",
                    a: "Tak, gra zapisuje postęp gracza automatycznie. Jeśli backend chwilowo nie odpowiada, część danych może tymczasowo używać lokalnego zapisu."
                }
            ];
        }

        return [
            {
                id: "what-is-game",
                q: "🐾 What is Crypto Zoo?",
                a: "Crypto Zoo is a clicker + idle Telegram WebApp game where you build your own zoo, earn coins, buy animals, upgrade income, and unlock more game systems."
            },
            {
                id: "how-earn-coins",
                q: "🪙 How do I earn coins?",
                a: "You earn coins by tapping the main button, from passive zoo income, daily reward, daily missions, memory, and expeditions."
            },
            {
                id: "zoo-income",
                q: "🏞 How does zoo income / sec work?",
                a: "Zoo income is passive income generated automatically by your animals. More animals and higher levels mean more income per second."
            },
            {
                id: "animals",
                q: "🦁 How do animals work?",
                a: "Each animal increases your zoo income. You can buy more animals and upgrade their levels to improve value."
            },
            {
                id: "level",
                q: "📈 How do level and XP work?",
                a: "You gain XP from activity in the game. When the XP bar fills up, you level up and improve your account progression."
            },
            {
                id: "gems",
                q: "💎 What are Gems?",
                a: "Gems are premium currency used for special features such as X2 Boost and future premium systems."
            },
            {
                id: "boost",
                q: "⚡ How does X2 Boost work?",
                a: "X2 Boost doubles tap income and zoo income for a limited time. After activation the boost button and status show the active effect."
            },
            {
                id: "reward",
                q: "🎯 What is Reward?",
                a: "Reward is a special earning currency. It first goes to Reward Balance, then you can transfer it to Wallet and use it for withdraw."
            },
            {
                id: "wallet",
                q: "🏦 What is Reward Wallet?",
                a: "Reward Wallet is the balance ready for withdrawal. First you collect Reward Balance, then transfer it to Wallet."
            },
            {
                id: "withdraw",
                q: "📤 How does withdraw work?",
                a: "After reaching the minimum value in Reward Wallet, you can create a withdraw request. Its status can be checked in withdraw history."
            },
            {
                id: "deposit",
                q: "💸 How does deposit work?",
                a: "In settings you can choose a deposit amount and create a deposit. Deposit history later shows the status of each transaction."
            },
            {
                id: "daily-reward",
                q: "🎁 How does Daily Reward work?",
                a: "Daily Reward can be claimed every 24 hours. It works on a cooldown and is part of your daily progression."
            },
            {
                id: "daily-missions",
                q: "📋 How do Daily Missions work?",
                a: "Each day you get a set of missions. Missions are completed one by one and help you earn extra coins and rewards."
            },
            {
                id: "memory",
                q: "🧠 How does Memory work?",
                a: "Memory is a mini game where you match pairs. After finishing it, you get rewards and then a cooldown starts."
            },
            {
                id: "expeditions",
                q: "🚀 How do expeditions work?",
                a: "You send animals on expeditions and collect rewards after time passes. It is an extra progression system beyond tapping."
            },
            {
                id: "referral",
                q: "🤝 How does referral work?",
                a: "You can invite friends using your referral link. The referral system is meant for game growth and future bonuses for active invited players."
            },
            {
                id: "telegram",
                q: "📱 Does the game work only in Telegram?",
                a: "Yes, Crypto Zoo is currently being prepared for Telegram WebApp and that is the intended main platform."
            },
            {
                id: "saving",
                q: "💾 Is progress saved automatically?",
                a: "Yes, player progress is saved automatically. If the backend is temporarily unavailable, some data may temporarily use local save fallback."
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

        const title =
            this.getLanguage() === "pl"
                ? "FAQ / Pomoc"
                : "FAQ / Help";

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
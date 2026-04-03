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
        const lang = this.getLanguage();

        if (lang === "pl") {
            return [
                {
                    id: "what-is-game",
                    q: "🐾 Czym jest Crypto Zoo?",
                    a: "Crypto Zoo to gra klikana w Telegramie, w której rozwijasz swoje zoo, wysyłasz zwierzęta na ekspedycje i zdobywasz nagrody."
                },
                {
                    id: "how-earn-coins",
                    q: "🪙 Jak zdobywać coins?",
                    a: "Coins zdobywasz przez klikanie, pasywny dochód zoo, ekspedycje, misje dzienne oraz system poleceń."
                },
                {
                    id: "gems",
                    q: "💎 Do czego służą gemy?",
                    a: "Gemy są rzadką walutą używaną do specjalnych boostów, przyspieszeń i przyszłych funkcji premium."
                },
                {
                    id: "reward",
                    q: "🎁 Co to jest reward?",
                    a: "Reward to specjalna waluta zdobywana głównie z ekspedycji. Możesz przenieść ją do wallet i później użyć do wypłaty, jeśli spełniasz warunki."
                },
                {
                    id: "expeditions",
                    q: "🌍 Jak działają ekspedycje?",
                    a: "Wybierasz ekspedycję, płacisz coins za start, czekasz określony czas i odbierasz nagrody w postaci coins, gems oraz reward."
                },
                {
                    id: "expedition-collect",
                    q: "⏳ Dlaczego nie mogę odebrać nagrody z ekspedycji?",
                    a: "Nagrody nie odbierzesz, jeśli ekspedycja jeszcze trwa, została już odebrana albo backend jest chwilowo niedostępny w trybie testowym."
                },
                {
                    id: "daily-missions",
                    q: "🎯 Czym są misje dzienne?",
                    a: "To zadania resetujące się codziennie. Dają dodatkowe nagrody i pomagają szybciej rozwijać konto."
                },
                {
                    id: "daily-reward",
                    q: "📅 Jak działa daily reward?",
                    a: "Pierwsza nagroda odblokowuje się po czasie, a kolejne możesz odbierać co 24 godziny. Streak zwiększa wartość nagród."
                },
                {
                    id: "referral",
                    q: "👥 Jak działa system poleceń?",
                    a: "Zapraszasz graczy swoim linkiem. Otrzymują bonus na start, a po osiągnięciu poziomu 3 nagrodę dostają zarówno oni, jak i Ty."
                },
                {
                    id: "save",
                    q: "💾 Czy gra zapisuje postęp?",
                    a: "Tak, postęp zapisuje się automatycznie. W trybie testowym bez backendu niektóre elementy mogą działać tymczasowo lub lokalnie."
                },
                
                {
                    id: "withdraw",
                    q: "💸 Jak wypłacić reward?",
                    a: "Aby wypłacić reward, musisz osiągnąć wymagany poziom, uzbierać minimalną ilość reward i spełnić warunki bezpieczeństwa systemu."
                },
                {
                    id: "security",
                    q: "🔒 Czy gra ma zabezpieczenia?",
                    a: "Tak. Gra posiada limity progresu, walidację nagród i systemy anti-cheat chroniące przed nadużyciami."
                }
            ];
        }

        return [
            {
                id: "what-is-game",
                q: "🐾 What is Crypto Zoo?",
                a: "Crypto Zoo is a Telegram clicker game where you build your zoo, send animals on expeditions, and earn rewards."
            },
            {
                id: "how-earn-coins",
                q: "🪙 How do I earn coins?",
                a: "You can earn coins by tapping, zoo passive income, expeditions, daily missions, and the referral system."
            },
            {
                id: "gems",
                q: "💎 What are gems used for?",
                a: "Gems are a rare currency used for special boosts, time reductions, and future premium features."
            },
            {
                id: "reward",
                q: "🎁 What is reward?",
                a: "Reward is a special currency earned mainly from expeditions. You can move it to your wallet and later use it for withdrawal if you meet the conditions."
            },
            {
                id: "expeditions",
                q: "🌍 How do expeditions work?",
                a: "You choose an expedition, pay coins to start it, wait for the timer, and collect rewards such as coins, gems, and reward."
            },
            {
                id: "expedition-collect",
                q: "⏳ Why can’t I collect expedition rewards?",
                a: "You cannot collect rewards if the expedition is still running, the reward was already claimed, or the backend is temporarily unavailable in test mode."
            },
            {
                id: "daily-missions",
                q: "🎯 What are daily missions?",
                a: "These are tasks that reset every day. They give extra rewards and help you progress faster."
            },
            {
                id: "daily-reward",
                q: "📅 How does daily reward work?",
                a: "The first reward unlocks after a timer, and the next ones can be claimed every 24 hours. Your streak increases reward value."
            },
            {
                id: "referral",
                q: "👥 How does the referral system work?",
                a: "You invite players using your link. They get a starting bonus, and after reaching level 3 both they and you receive rewards."
            },
            {
                id: "save",
                q: "💾 Does the game save progress?",
                a: "Yes, progress is saved automatically. In test mode without backend, some parts may work temporarily or locally."
            },
            
            {
                id: "withdraw",
                q: "💸 How do I withdraw reward?",
                a: "To withdraw reward, you must reach the required level, collect the minimum reward amount, and meet the security conditions."
            },
            {
                id: "security",
                q: "🔒 Does the game have security systems?",
                a: "Yes. The game has progress limits, reward validation, and anti-cheat systems to reduce abuse."
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
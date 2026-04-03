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
                    q: "🐾 O co chodzi w grze?",
                    a: "Budujesz swoje Zoo, rozwijasz zwierzęta i wysyłasz ekspedycje, które zarabiają dla Ciebie nawet gdy nie grasz."
                },
                {
                    q: "🪙 Jak zarabiać szybciej?",
                    a: "Klikaj, ulepszaj zoo i odblokowuj nowe ekspedycje. Im wyższy poziom, tym większe zyski."
                },
                {
                    q: "🌍 Ekspedycje — dlaczego są ważne?",
                    a: "To główne źródło reward. Im dłuższa i lepsza ekspedycja, tym większa nagroda."
                },
                {
                    q: "🎁 Czym jest reward?",
                    a: "To najcenniejsza waluta w grze — zdobywasz ją i możesz wypłacić."
                },
                {
                    q: "💎 Gemy — po co są?",
                    a: "Dają przewagę — przyspieszają progres i odblokowują mocniejsze opcje."
                },
                {
                    q: "⚡ Jak przyspieszyć progres?",
                    a: "Kupuj zwierzęta, używaj boostów i regularnie odbieraj nagrody."
                },
                {
                    q: "📅 Daily reward?",
                    a: "Wracaj codziennie — streak zwiększa nagrody i tempo rozwoju."
                },
                {
                    q: "🎯 Misje?",
                    a: "Dodatkowy boost — szybkie zadania = szybkie nagrody."
                },
                {
                    q: "👥 Zaproszenia?",
                    a: "Zapraszaj znajomych i zarabiaj razem z nimi."
                },
                {
                    q: "💸 Wypłaty?",
                    a: "Odblokuj wymagania i wypłacaj reward."
                }
            ];
        }

        return [
            {
                q: "🐾 What is this game about?",
                a: "Build your Zoo, upgrade animals, and send expeditions that earn even while you're offline."
            },
            {
                q: "🪙 How to earn faster?",
                a: "Tap, upgrade your zoo, and unlock better expeditions. Higher level = higher profits."
            },
            {
                q: "🌍 Why are expeditions important?",
                a: "They are the main source of reward. Longer and better expeditions give more."
            },
            {
                q: "🎁 What is reward?",
                a: "The most valuable currency in the game — you can earn and withdraw it."
            },
            {
                q: "💎 What are gems for?",
                a: "They give advantage — speed up progress and unlock stronger options."
            },
            {
                q: "⚡ How to progress faster?",
                a: "Buy animals, use boosts, and collect rewards regularly."
            },
            {
                q: "📅 Daily reward?",
                a: "Come back daily — streak increases rewards and growth speed."
            },
            {
                q: "🎯 Missions?",
                a: "Extra boost — quick tasks = quick rewards."
            },
            {
                q: "👥 Referrals?",
                a: "Invite friends and earn together."
            },
            {
                q: "💸 Withdraw?",
                a: "Unlock requirements and withdraw your reward."
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
            <div style="margin-top:16px; display:flex; flex-direction:column; gap:10px;">
                ${items.map(item => `
                    <div style="
                        padding:14px;
                        border-radius:16px;
                        background:linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
                        border:1px solid rgba(255,255,255,0.08);
                        box-shadow:0 6px 18px rgba(0,0,0,0.25);
                    ">
                        <div style="
                            font-weight:900;
                            font-size:14px;
                            color:#ffffff;
                        ">
                            ${item.q}
                        </div>

                        <div style="
                            margin-top:6px;
                            font-size:13px;
                            line-height:1.5;
                            color:rgba(255,255,255,0.85);
                        ">
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
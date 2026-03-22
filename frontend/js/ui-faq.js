window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.uiFaq = {
    isOpen: false,

    getContent() {
        return `
        <div style="
            margin-top:12px;
            padding:14px;
            border-radius:16px;
            background:linear-gradient(180deg, rgba(18,28,48,0.96) 0%, rgba(10,17,31,0.96) 100%);
            border:1px solid rgba(255,255,255,0.08);
            color:#ffffff;
            font-size:14px;
            line-height:1.5;
            font-weight:700;
        ">

            <div style="font-size:16px; font-weight:900; margin-bottom:12px;">
                📘 FAQ – Crypto Zoo
            </div>

            <div style="margin-bottom:12px;">
                <strong>🎮 O co chodzi w grze?</strong><br>
                Budujesz swoje zoo, zdobywasz coins i rozwijasz dochód pasywny. Klikanie przyspiesza progres.
            </div>

            <div style="margin-bottom:12px;">
                <strong>👆 Klikanie (Tap)</strong><br>
                Każdy klik daje coins i XP. Możesz używać kilku palców – system optymalizuje to dla balansu gry.
            </div>

            <div style="margin-bottom:12px;">
                <strong>🐾 Zwierzęta</strong><br>
                Zwierzęta generują coins automatycznie co sekundę (dochód pasywny).
            </div>

            <div style="margin-bottom:12px;">
                <strong>⬆ Ulepszenia (Lvl Up)</strong><br>
                Zwiększają efektywność wszystkich posiadanych zwierząt danego typu.
            </div>

            <div style="margin-bottom:12px;">
                <strong>💰 Dochód zoo</strong><br>
                Twój zoo income działa cały czas – nawet bez klikania.
            </div>

            <div style="margin-bottom:12px;">
                <strong>📊 Poziom gracza</strong><br>
                Zdobywasz XP i awansujesz na kolejne poziomy. Odblokowują one nowe funkcje i ekspedycje.
            </div>

            <div style="margin-bottom:12px;">
                <strong>🎁 Daily Reward</strong><br>
                Codzienna nagroda dostępna co 24h. Streak zwiększa jej wartość.
            </div>

            <div style="margin-bottom:12px;">
                <strong>🌍 Expeditions</strong><br>
                Wysyłasz ekspedycje, które po czasie dają coins, gems i reward.
            </div>

            <div style="margin-bottom:12px;">
                <strong>⚡ Boost X2</strong><br>
                Tymczasowo podwaja klik i dochód zoo.
            </div>

            <div style="margin-bottom:12px;">
                <strong>💎 Gems</strong><br>
                Rzadka waluta używana do boostów i specjalnych zakupów.
            </div>

            <div style="margin-bottom:12px;">
                <strong>💠 Reward</strong><br>
                Specjalny zasób zdobywany głównie z ekspedycji.
            </div>

            <div style="margin-bottom:12px;">
                <strong>🏦 Wallet</strong><br>
                Miejsce przechowywania rewardów (przygotowane pod przyszłe funkcje wypłat).
            </div>

            <div style="margin-bottom:12px;">
                <strong>💤 Offline Earnings</strong><br>
                Gra zarabia coins nawet gdy jesteś offline (do określonego limitu czasu).
            </div>

            <button id="faqCloseBtn" style="
                margin-top:14px;
                width:100%;
                padding:12px;
                border-radius:12px;
                border:none;
                font-weight:900;
                background:linear-gradient(180deg,#2a344c,#1a2236);
                color:#fff;
            ">
                Zamknij FAQ
            </button>

        </div>
        `;
    },

    open() {
        const mount = document.getElementById("settingsFaqMount");
        if (!mount) return;

        mount.innerHTML = this.getContent();
        this.isOpen = true;

        const btn = document.getElementById("faqCloseBtn");
        if (btn) btn.onclick = () => this.close();
    },

    close() {
        const mount = document.getElementById("settingsFaqMount");
        if (!mount) return;

        mount.innerHTML = "";
        this.isOpen = false;
    }
};
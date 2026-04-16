<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    >
    <meta name="theme-color" content="#0b1220">
    <title>Crypto Zoo</title>

    <script src='//libtl.com/sdk.js' data-zone='10822070' data-sdk='show_10822070'></script>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"></script>

    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/game.css">
    <link rel="stylesheet" href="css/zoo.css">
    <link rel="stylesheet" href="css/shop.css">
    <link rel="stylesheet" href="css/expeditions.css">
    <link rel="stylesheet" href="css/ranking.css">
    <link rel="stylesheet" href="css/menu.css">
    <link rel="stylesheet" href="css/minigames-ui.css">
    <link rel="stylesheet" href="css/responsive.css">

    <style>
        :root {
            --menu-height: 78px;
        }

        html,
        body {
            width: 100%;
            height: 100%;
            min-height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #0b1220;
        }

        body.telegram-webapp {
            overscroll-behavior: none;
            touch-action: manipulation;
        }

        #app {
            width: 100%;
            height: 100%;
            min-height: 100%;
            overflow: hidden;
            background: #0b1220;
        }

        #game {
            width: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            box-sizing: border-box;
        }

        .top-bar {
            padding-top: env(safe-area-inset-top, 0px);
            box-sizing: border-box;
        }

        .menu {
            bottom: 0;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            box-sizing: border-box;
        }

        #loading-screen {
            position: fixed;
            inset: 0;
            z-index: 9999;
        }

        .home-offline-strip {
            margin-top: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 18px;
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(15, 28, 74, 0.96) 0%, rgba(7, 17, 49, 0.96) 100%);
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
        }

        .home-offline-left {
            min-width: 0;
            flex: 1;
        }

        .home-offline-title {
            font-size: 15px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 6px;
        }

        .home-offline-main {
            font-size: 14px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.92);
            line-height: 1.4;
        }

        .home-offline-sub {
            margin-top: 6px;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.68);
            line-height: 1.4;
        }

        .home-offline-right {
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }

        .home-offline-ad-btn {
            min-width: 124px;
            min-height: 48px;
            padding: 0 16px;
            border: none;
            border-radius: 16px;
            background: linear-gradient(180deg, #ffd94d 0%, #f0b90b 100%);
            color: #1f1f1f;
            font-size: 15px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(240, 185, 11, 0.22);
        }

        .home-offline-ad-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            box-shadow: none;
        }

        .withdraw-modal-summary {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 12px;
        }

        .withdraw-modal-box {
            padding: 12px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
        }

        .withdraw-modal-box-label {
            font-size: 12px;
            color: rgba(255,255,255,0.66);
            margin-bottom: 6px;
        }

        .withdraw-modal-box-value {
            font-size: 18px;
            font-weight: 900;
            color: #fff;
        }

        .withdraw-wallet-input {
            width: 100%;
            min-height: 50px;
            padding: 12px 14px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.04);
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            box-sizing: border-box;
            outline: none;
        }

        .withdraw-wallet-input::placeholder {
            color: rgba(255,255,255,0.42);
        }

        .withdraw-help-box {
            margin-top: 12px;
            padding: 12px;
            border-radius: 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.78);
            font-size: 12px;
            line-height: 1.5;
        }

        .profile-box-subvalue {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 700;
            color: rgba(255,255,255,0.68);
            line-height: 1.2;
            min-height: 14px;
        }
    </style>

    <style>
        .home-offline-strip,
        .home-offline-strip * {
            pointer-events: none !important;
        }
    </style>
</head>
<body>
    <div id="loading-screen">
        <div class="loading-visual">
            <div class="loading-image-wrap">
                <img
                    src="assets/loading/loading_main.png"
                    alt=""
                    class="loading-image"
                    onerror="this.style.display='none';"
                >
                <div class="loading-progress-overlay">
                    <div class="loading-progress-bar">
                        <div class="loading-progress-fill" id="loadingBarFill"></div>
                    </div>
                    <div class="loading-progress-text" id="loadingPercent">0%</div>
                </div>
            </div>
        </div>
    </div>

    <div id="app">
        <header class="top-bar">
            <div class="top-bar-shell">
                <div class="top-bar-main">
                    <div class="top-bar-left">
                        <button class="top-profile-trigger" type="button" id="topProfileBtn" aria-label="Profil gracza">
                            <div class="top-avatar"></div>
                            <span class="top-profile-ring"></span>
                        </button>

                        <div class="top-user-meta">
                            <div class="top-user-name" id="topPlayerName">Crypto Zoo</div>
                            <div class="top-user-status" id="topPlayerStatus">● Online</div>
                        </div>
                    </div>

                    <div class="top-bar-overlay-actions">
                        <button class="top-icon-chip top-icon-chip-star" type="button" id="topEventsBtn" aria-label="Events">✦</button>
                        <button class="top-icon-chip top-icon-chip-settings" type="button" id="topSettingsBtn" aria-label="Settings">⚙</button>
                    </div>
                </div>
            </div>
        </header>

        <main id="game">
            <section id="screen-game" class="screen">
                <div id="homeMount"></div>
            </section>

            <section id="screen-zoo" class="screen hidden">
                <div class="panel card">
                    <h2 id="langScreenZooTitle">🐾 Zoo</h2>
                    <div id="zooList"></div>
                </div>
            </section>

            <section id="screen-shop" class="screen hidden">
                <div class="panel card">
                    <h2 id="langScreenShopTitle">🛒 Shop</h2>

                    <div class="shop-item boost-shop-card" id="boostShopCard">
                        <h3 id="langBoostShopCardTitle">⚡ X2 Boost</h3>
                        <div id="langBoostShopCardDesc">Podwaja klik i dochód zoo przez 10 minut.</div>
                        <div style="margin-top:6px;" id="langBoostShopCardCostWrap">Koszt: <strong>1 gem</strong></div>
                        <div id="boostShopStatus" style="margin-top:6px;">Nieaktywny</div>
                        <button id="buyBoostBtn" type="button" style="margin-top:10px;">Kup X2 Boost</button>
                    </div>

                    <div id="shopList"></div>
                </div>
            </section>

            <section id="screen-missions" class="screen hidden">
                <div class="panel card">
                    <h2 id="langScreenExpeditionsTitle">🌍 Expeditions</h2>
                    <div id="missionsList"></div>
                </div>
            </section>

            <div id="minigamesMount"></div>

            <section id="screen-ranking" class="screen hidden">
                <div class="panel card">
                    <h2 id="langScreenRankingTitle">🏆 Ranking</h2>
                    <ul id="rankingList"></ul>
                </div>
            </section>
        </main>

        <footer class="menu">
            <button class="menu-btn active-nav" data-nav="game" type="button">
                <img src="assets/menu/game.png" alt="Game" class="menu-icon">
            </button>

            <button class="menu-btn" data-nav="zoo" type="button">
                <img src="assets/menu/zoo.png" alt="Zoo" class="menu-icon">
            </button>

            <button class="menu-btn" data-nav="shop" type="button">
                <img src="assets/menu/shop.png" alt="Shop" class="menu-icon">
            </button>

            <button class="menu-btn" data-nav="missions" type="button">
                <img src="assets/menu/missions.png" alt="Missions" class="menu-icon">
            </button>

            <button class="menu-btn" data-nav="minigames" type="button">
                <img src="assets/menu/minigames.png" alt="Mini Games" class="menu-icon">
            </button>

            <button class="menu-btn" data-nav="ranking" type="button">
                <img src="assets/menu/ranking.png" alt="Ranking" class="menu-icon">
            </button>
        </footer>
    </div>

    <div id="profileModalMount"></div>
    <div id="settingsModalMount"></div>
    <div id="withdrawModalMount"></div>
    <div id="dailyRewardModalMount"></div>

    <script src="./js/config.js"></script>
    <script src="./js/state.js"></script>
    <script src="./js/dom.js"></script>

    <script src="./js/ui-profile.js"></script>
    <script src="./js/ui-settings.js"></script>
    <script src="./js/ui-withdraw.js"></script>
    <script src="./js/ui-ranking.js"></script>
    <script src="./js/ui-faq.js"></script>

    <script src="./js/ui-core.js"></script>
    <script src="./js/ui-home.js"></script>
    <script src="./js/ui-zoo.js"></script>
    <script src="./js/ui-missions.js"></script>
    <script src="./js/ui-shop.js"></script>
    <script src="./js/ui.js"></script>

    <script src="./js/navigation-system.js"></script>
    <script src="./js/daily-missions-system.js"></script>
    <script src="./js/boost-system.js"></script>
    <script src="./js/daily-reward-system.js"></script>
    <script src="./js/animal-system.js"></script>
    <script src="./js/expedition-system.js"></script>
    <script src="./js/income-system.js"></script>
    <script src="./js/offline-system.js"></script>
    <script src="./js/shop-purchase-system.js"></script>
    <script src="./js/expedition-time-boost-selector.js"></script>
    <script src="./js/api.js"></script>
    <script src="./js/deposit-ui.js"></script>
    <script src="./js/deposit-ui-bind.js"></script>
    <script src="./js/telegram.js"></script>
    <script src="./js/audio.js"></script>
    <script src="./js/shop.js"></script>
    <script src="./js/minigames.js"></script>
    <script src="./js/minigame-memory.js"></script>
    <script src="./js/minigame-tap-challenge.js"></script>
    <script src="./js/minigame-animal-hunt.js"></script>
    <script src="./js/offline-ads-system.js"></script>
    <script src="./js/ads-provider.js"></script>
    <script src="./js/gameplay.js"></script>
    <script src="./js/lang.js"></script>
    <script src="./js/deposit-verify-ui.js"></script>
    <script src="./js/html-loader.js"></script>
    <script src="./js/ui-roadmap.js"></script>
    <script src="./js/init.js"></script>
</body>
</html>
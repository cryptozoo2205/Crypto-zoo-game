window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = window.CryptoZoo.api || {
    testResetMode: false,

    localSaveKeyPrefix: "cryptozoo_save_",
    legacyLocalSaveKey: "cryptozoo_save",

    testLocalSaveKeyPrefix: "cryptozoo_test_save_",
    legacyTestLocalSaveKey: "cryptozoo_test_save",

    initialized: false,
    initPromise: null,
    lifecycleBound: false,
    ensurePlayerPromise: null,

    saveInProgress: false,
    saveQueued: false,
    saveTimer: null,
    lastSaveStartedAt: 0,
    lastSavedSnapshot: "",
    pendingDirty: false,

    requestTimeoutMs: 8000,
    minSaveIntervalMs: 30000,
    saveDebounceMs: 4000,
    saveFailCooldownMs: 15000
};
(function () {
    var DB_NAME = 'vvg-ai-cache';
    var DB_VERSION = 1;
    var STORE_NAME = 'models';

    window.ModelCache = {
        DB_NAME: DB_NAME,
        DB_VERSION: DB_VERSION,
        STORE_NAME: STORE_NAME,
        db: null,

        init: function () {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    var request = indexedDB.open(DB_NAME, DB_VERSION);
                    request.onupgradeneeded = function (event) {
                        var db = event.target.result;
                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            db.createObjectStore(STORE_NAME);
                        }
                    };
                    request.onsuccess = function (event) {
                        self.db = event.target.result;
                        console.log('[ModelCache] Initialized successfully');
                        resolve(true);
                    };
                    request.onerror = function (event) {
                        console.log('[ModelCache] Failed to open database:', event.target.error);
                        resolve(false);
                    };
                } catch (e) {
                    console.log('[ModelCache] IndexedDB unavailable:', e.message);
                    resolve(false);
                }
            });
        },

        get: function (key) {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve(null); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.get(key);
                    request.onsuccess = function () {
                        console.log('[ModelCache] GET', key, request.result ? 'hit' : 'miss');
                        resolve(request.result || null);
                    };
                    request.onerror = function () {
                        console.log('[ModelCache] GET error:', key, request.error);
                        resolve(null);
                    };
                } catch (e) {
                    console.log('[ModelCache] GET exception:', e.message);
                    resolve(null);
                }
            });
        },

        set: function (key, buffer) {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve(false); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.put(buffer, key);
                    request.onsuccess = function () {
                        console.log('[ModelCache] SET', key, '(' + buffer.byteLength + ' bytes)');
                        resolve(true);
                    };
                    request.onerror = function () {
                        console.log('[ModelCache] SET error:', key, request.error);
                        resolve(false);
                    };
                } catch (e) {
                    console.log('[ModelCache] SET exception:', e.message);
                    resolve(false);
                }
            });
        },

        has: function (key) {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve(false); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.count(key);
                    request.onsuccess = function () {
                        resolve(request.result > 0);
                    };
                    request.onerror = function () {
                        resolve(false);
                    };
                } catch (e) {
                    console.log('[ModelCache] HAS exception:', e.message);
                    resolve(false);
                }
            });
        },

        delete: function (key) {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve(false); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.delete(key);
                    request.onsuccess = function () {
                        console.log('[ModelCache] DELETE', key);
                        resolve(true);
                    };
                    request.onerror = function () {
                        console.log('[ModelCache] DELETE error:', key, request.error);
                        resolve(false);
                    };
                } catch (e) {
                    console.log('[ModelCache] DELETE exception:', e.message);
                    resolve(false);
                }
            });
        },

        getSize: function (key) {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve(0); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.get(key);
                    request.onsuccess = function () {
                        if (request.result && request.result.byteLength !== undefined) {
                            resolve(request.result.byteLength);
                        } else {
                            resolve(0);
                        }
                    };
                    request.onerror = function () {
                        resolve(0);
                    };
                } catch (e) {
                    console.log('[ModelCache] getSize exception:', e.message);
                    resolve(0);
                }
            });
        },

        clear: function () {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve(false); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.clear();
                    request.onsuccess = function () {
                        console.log('[ModelCache] CLEAR complete');
                        resolve(true);
                    };
                    request.onerror = function () {
                        console.log('[ModelCache] CLEAR error:', request.error);
                        resolve(false);
                    };
                } catch (e) {
                    console.log('[ModelCache] CLEAR exception:', e.message);
                    resolve(false);
                }
            });
        },

        getAllKeys: function () {
            var self = this;
            return new Promise(function (resolve) {
                try {
                    if (!self.db) { resolve([]); return; }
                    var tx = self.db.transaction(STORE_NAME, 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var request = store.getAllKeys();
                    request.onsuccess = function () {
                        resolve(request.result || []);
                    };
                    request.onerror = function () {
                        resolve([]);
                    };
                } catch (e) {
                    console.log('[ModelCache] getAllKeys exception:', e.message);
                    resolve([]);
                }
            });
        }
    };
})();

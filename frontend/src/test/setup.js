// Guarantee a working localStorage in the test environment, independent of
// the jsdom version's Storage implementation.
class MemoryStorage {
  constructor() { this.store = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined' ||
    typeof globalThis.localStorage.clear !== 'function') {
  globalThis.localStorage = new MemoryStorage();
}

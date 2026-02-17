const PREFIX = 'quicklist_';

export function load(uuid) {
    try {
        const raw = localStorage.getItem(PREFIX + uuid);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export function save(uuid, items) {
    localStorage.setItem(PREFIX + uuid, JSON.stringify(items));
}

export function remove(uuid) {
    localStorage.removeItem(PREFIX + uuid);
}

const TITLE_PREFIX = 'quicklist_title_';

export function loadTitle(uuid) {
    return localStorage.getItem(TITLE_PREFIX + uuid) || 'My List';
}

export function saveTitle(uuid, title) {
    localStorage.setItem(TITLE_PREFIX + uuid, title);
}

/**
 * Listen for storage changes made by other tabs/windows.
 * Calls callback(uuid, items) when a quicklist key is modified externally.
 */
export function onStorageChange(callback) {
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(PREFIX)) {
            const uuid = e.key.slice(PREFIX.length);
            callback(uuid, load(uuid));
        }
    });
}

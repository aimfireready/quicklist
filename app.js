import * as storage from './storage/localStorage.js';

const { createApp, ref, computed, onMounted, nextTick } = Vue;

/**
 * Extract a UUID from the URL hash.  Expected format: #/<uuid>
 * Returns null if the hash doesn't contain a valid-looking id.
 */
function getIdFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#/') && hash.length > 2) {
        return hash.slice(2);
    }
    return null;
}

// ── Vue application ──────────────────────────────────────────────────────────

createApp({
    setup() {
        // ── Reactive state ───────────────────────────────────────────────
        const listId       = ref(getIdFromHash());
        const items        = ref([]);
        const newItemText  = ref('');
        const editingId    = ref(null);
        const editingText  = ref('');
        const copied       = ref(false);
        let   sortableInstance = null;

        // If no list id in the URL, generate one and update the hash.
        if (!listId.value) {
            listId.value = crypto.randomUUID();
            window.location.hash = '#/' + listId.value;
        }

        const listUrl = computed(() =>
            window.location.origin + window.location.pathname + '#/' + listId.value
        );

        const itemCount = computed(() => items.value.length);

        // ── Storage helpers ──────────────────────────────────────────────
        function loadItems() {
            items.value = storage.load(listId.value);
        }

        function saveItems() {
            storage.save(listId.value, items.value);
        }

        // ── CRUD ─────────────────────────────────────────────────────────
        function addItem() {
            const text = newItemText.value.trim();
            if (!text) return;

            items.value.push({
                id:   crypto.randomUUID(),
                text: text,
            });

            newItemText.value = '';
            saveItems();

            // Reset the "add" textarea height after clearing it.
            nextTick(() => {
                const ta = document.getElementById('new-item-textarea');
                if (ta) ta.style.height = 'auto';
            });
        }

        function deleteItem(id) {
            if (!confirm('Delete this item?')) return;
            items.value = items.value.filter(i => i.id !== id);
            saveItems();
        }

        function startEdit(item) {
            editingId.value   = item.id;
            editingText.value = item.text;

            nextTick(() => {
                const ta = document.querySelector('.edit-textarea');
                if (ta) {
                    ta.focus();
                    ta.style.height = 'auto';
                    ta.style.height = ta.scrollHeight + 'px';
                }
            });
        }

        function saveEdit(item) {
            const text = editingText.value.trim();
            if (text) {
                item.text = text;
                saveItems();
            }
            cancelEdit();
        }

        function cancelEdit() {
            editingId.value   = null;
            editingText.value = '';
        }

        // ── List management ──────────────────────────────────────────────
        function newList() {
            listId.value = crypto.randomUUID();
            window.location.hash = '#/' + listId.value;
            items.value      = [];
            editingId.value  = null;
            newItemText.value = '';
        }

        function copyLink() {
            navigator.clipboard.writeText(listUrl.value).then(() => {
                copied.value = true;
                setTimeout(() => { copied.value = false; }, 2000);
            });
        }

        // ── Textarea auto-resize ─────────────────────────────────────────
        function autoResize(event) {
            const el = event.target;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }

        // ── SortableJS ──────────────────────────────────────────────────
        function initSortable() {
            nextTick(() => {
                const el = document.getElementById('item-list');
                if (!el) return;
                if (sortableInstance) sortableInstance.destroy();

                sortableInstance = new Sortable(el, {
                    handle:     '.drag-handle',
                    animation:  150,
                    ghostClass: 'sortable-ghost',
                    onEnd(evt) {
                        const moved = items.value.splice(evt.oldIndex, 1)[0];
                        items.value.splice(evt.newIndex, 0, moved);
                        saveItems();
                    },
                });
            });
        }

        // ── Hash-change navigation (browser back / forward) ─────────────
        window.addEventListener('hashchange', () => {
            const newId = getIdFromHash();
            if (newId && newId !== listId.value) {
                listId.value    = newId;
                editingId.value = null;
                loadItems();
                initSortable();
            }
        });

        // ── Cross-tab synchronisation via localStorage events ───────────
        storage.onStorageChange((changedId, newItems) => {
            if (changedId === listId.value) {
                items.value = newItems;
            }
        });

        // ── Lifecycle ────────────────────────────────────────────────────
        onMounted(() => {
            loadItems();
            initSortable();
        });

        // ── Public API (template bindings) ───────────────────────────────
        return {
            listId, items, newItemText, editingId, editingText,
            listUrl, copied, itemCount,
            addItem, deleteItem, startEdit, saveEdit, cancelEdit,
            newList, copyLink, autoResize,
        };
    },
}).mount('#app');

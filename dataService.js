// dataService.js

const DataService = {
    /**
     * L�dt den kompletten App-State von Azure Function /api/state
     */
    async load() {
        const response = await fetch('/api/state', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load state: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Speichert den kompletten App-State nach /api/state (PUT)
     * @param {object} stateObj - Serialisierbares State-Objekt
     */
    async save(stateObj) {
        const response = await fetch('/api/state', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(stateObj)
        });

        if (!response.ok) {
            throw new Error(`Failed to save state: ${response.status} ${response.statusText}`);
        }

        return await response.json().catch(() => ({}));
    }
};

// global verf�gbar machen f�r AppState
window.DataService = DataService;

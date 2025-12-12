	// ============================================================
	// GLOBAL AUTH HANDLING FOR FETCH (401 LOGIN)
	// ============================================================
	
	const originalFetch = window.fetch;
	
	window.fetch = async (...args) => {
	    const response = await originalFetch(...args);
	
	    if (response.status === 401 && response.url.includes('/api/state')) {
	        console.warn("Nicht eingeloggt ⛔ Redirect zu Microsoft Login...");
	        window.location.href = '/.auth/login/aad';
	        throw new Error('Unauthorized ⛔ redirecting to login');
	    }
	
	    return response;
	};

    // ============================================================
    // INITIALIZATION
    // ============================================================
    
    // Make AppState and UI globally available
    window.AppState = AppState;
    window.UI = UI;
    
    document.addEventListener('DOMContentLoaded', async () => {
        let unauthorized = false;

        try {
            // 1) State laden (hier kommen 401, 500, etc. rein)
            await AppState.load();

            // 2) UI initialisieren
            UI.init();

            // 3) Deep-Linking: Direkt ein Projekt öffnen, wenn im Hash übergeben
            const hash = window.location.hash;
            if (hash && hash.startsWith('#project/')) {
                const projectId = hash.replace('#project/', '');
                if (AppState.getProject(projectId)) {
                    UI.showProjectDetails(projectId);
                }
            }

        } catch (err) {
            console.error("Init-Fehler:", err);

            // Spezieller Fall: 401 → Redirect zu Microsoft Login
            // preload bleibt aktiv → Loader bleibt sichtbar, App bleibt verborgen
            if (err && typeof err.message === 'string' && err.message.includes('Unauthorized')) {
                unauthorized = true;
                return;
            }

            // Alle anderen Fehler: preload entfernen, damit du die App + Banner siehst
            document.documentElement.classList.remove('preload');

            // Fehlerbanner oben in der App
            const appRoot = document.getElementById('app-root');
            const errorBannerId = 'global-init-error';
            let banner = document.getElementById(errorBannerId);

            if (!banner && appRoot) {
                banner = document.createElement('div');
                banner.id = errorBannerId;
                banner.style.padding = '0.75rem 1rem';
                banner.style.background = '#fee2e2';
                banner.style.color = '#b91c1c';
                banner.style.fontFamily = 'system-ui, sans-serif';
                banner.style.fontSize = '0.9rem';
                banner.textContent =
                    'Fehler beim Initialisieren von ProjectHub. Details in der Browser-Konsole (F12 → Console).';
                appRoot.prepend(banner);
            }

            return;

        } finally {
            // Nur wenn wir NICHT im 401/Redirect-Fall sind:
            if (!unauthorized) {
                // EINZIGE “Show App”-Aktion: preload entfernen
                document.documentElement.classList.remove('preload');
            }
        }
    });


        // ============================================================
    // DEMO-DATEN LOADER
    // ============================================================
    (function() {
        function loadComprehensiveDemoData() {
            const AppState = window.AppState;
            if (!AppState) return;

            // WICHTIG: Nur ausführen, wenn noch keine Buchungen vorhanden
            // Wenn bereits Demo-Daten existieren, nicht nochmal laden
            if (AppState.resourceBookings.length > 0) {
                console.log('ℹ️ Demo-Daten bereits vorhanden (' + AppState.resourceBookings.length + ' Buchungen)');
                return;
            }

            console.log('ℹ️ Loading comprehensive demo data...');

            const projects = AppState.projects;
            const members = AppState.members;

            if (projects.length === 0 || members.length === 0) return;

            // Helper function to find projects
            const findProject = (name) => projects.find(p => p.name.includes(name));
            const findMember = (name) => members.find(m => m.name === name);

            // (Hier könntest du später noch Logik einfügen, die auf
            //  findProject/findMember basiert, aktuell ist die Funktion leer.)
        } // <<< WICHTIG: Ende von loadComprehensiveDemoData

        // Globale Funktion: Demo-Daten aus hochgeladener JSON-Datei laden
        window.loadDemoDataFromJson = async function(file) {
            const AppState = window.AppState;
            if (!AppState) {
                console.error('⚠️ AppState nicht verfügbar');
                return false;
            }

            try {
                console.log('⏳ Lade Demo-Daten aus hochgeladener Datei...');

                // Lese die hochgeladene Datei
                const fileContent = await file.text();
                const demoData = JSON.parse(fileContent);

                // Validierung
                if (!demoData.members || !demoData.projects) {
                    throw new Error('Ungültige Demo-Daten: members oder projects fehlen');
                }

                // Lösche alle vorhandenen Daten
                AppState.members = [];
                AppState.projects = [];
                AppState.projectTeamMembers = [];
                AppState.resourceBookings = [];
                AppState.milestones = [];
                AppState.tasks = [];
                AppState.risks = [];
                AppState.costs = [];

                // Importiere in korrekter Reihenfolge
                console.log('  1⏳ Importiere Ressourcen (members)...');
                AppState.members = demoData.members || [];

                console.log('  2⏳ Importiere Projekte...');
                AppState.projects = demoData.projects || [];

                console.log('  3⏳ Importiere Projekt-Teammitglieder...');
                AppState.projectTeamMembers = demoData.projectTeamMembers || [];

                console.log('  4⏳ Importiere Ressourcen-Buchungen...');
                AppState.resourceBookings = demoData.resourceBookings || [];

                console.log('  5⏳ Importiere Meilensteine...');
                AppState.milestones = demoData.milestones || [];

                console.log('  6⏳ Importiere Aufgaben...');
                AppState.tasks = demoData.tasks || [];

                console.log('  7⏳ Importiere Risiken...');
                AppState.risks = demoData.risks || [];

                console.log('  8⏳ Importiere Kosten...');
                AppState.costs = demoData.costs || [];

                // Synchronisiere SOP aus Milestones
                console.log('  9⏳ Synchronisiere SOP-Daten aus Milestones...');
                AppState.projects.forEach(project => {
                    // Finde SOP Milestone für dieses Projekt
                    const sopMs = AppState.milestones.find(
                        m => m.projectId === project.id && m.name && m.name.includes('SOP')
                    );

                    // Wenn SOP Milestone gefunden und Projekt hat noch keine SOP-Daten
                    if (sopMs && !project.sopCurrentDate) {
                        project.sopBaselineDate = sopMs.date;
                        project.sopCurrentDate = sopMs.date;
                        project.sopChangeComment = project.sopChangeComment || '';
                    }

                    // Stelle sicher, dass SOP-Felder existieren (für Abwärtskompatibilität)
                    if (!project.hasOwnProperty('sopBaselineDate')) {
                        project.sopBaselineDate = null;
                    }
                    if (!project.hasOwnProperty('sopCurrentDate')) {
                        project.sopCurrentDate = null;
                    }
                    if (!project.hasOwnProperty('sopChangeComment')) {
                        project.sopChangeComment = '';
                    }
                });

                // Speichere in localStorage
                AppState.save();

                console.log(`✅ Demo-Daten erfolgreich geladen!`);
                console.log(`   ${AppState.members.length} Ressourcen`);
                console.log(`   ${AppState.projects.length} Projekte`);
                console.log(`   ${AppState.projectTeamMembers.length} Teammitglieder`);
                console.log(`   ${AppState.resourceBookings.length} Buchungen`);

                // UI vollständig aktualisieren
                console.log('⏳ Aktualisiere UI...');
                if (window.UI) {
                    window.UI.showView('project-list');
                    window.UI.renderProjectList();

                    // Success-Meldung
                    const successDiv = document.createElement('div');
                    successDiv.style.cssText =
                        'position: fixed; top: 20px; right: 20px; z-index: 10000; background: #059669; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out;';
                    successDiv.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">✅</span>
                            <div>
                                <strong>Demo-Daten erfolgreich geladen!</strong>
                                <div style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.25rem;">
                                    ${AppState.projects.length} Projekte, ${AppState.members.length} Ressourcen, ${AppState.resourceBookings.length} Buchungen
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(successDiv);

                    setTimeout(() => {
                        successDiv.style.opacity = '0';
                        successDiv.style.transition = 'opacity 0.3s';
                        setTimeout(() => successDiv.remove(), 300);
                    }, 4000);
                }

                return true;

            } catch (error) {
                console.error('⚠️ Fehler beim Laden der Demo-Daten:', error);

                const errorDiv = document.createElement('div');
                errorDiv.style.cssText =
                    'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 500px;';
                errorDiv.innerHTML = `
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Fehler beim Laden der Demo-Daten</h3>
                    <p style="margin-bottom: 1rem;">${error.message}</p>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem;">
                        Bitte überprüfen Sie, dass die hochgeladene Datei eine gültige JSON-Datei ist.
                    </p>
                    <button onclick="this.parentElement.remove()" style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Schließen
                    </button>
                `;
                document.body.appendChild(errorDiv);

                return false;
            }
        };

        // Legacy-Funktion für Kompatibilität
        window.reloadDemoData = function() {
            const AppState = window.AppState;
            if (!AppState) {
                console.error('AppState nicht verfügbar');
                return;
            }

            // Lösche alle projektbezogenen Daten
            AppState.projectTeamMembers = [];
            AppState.resourceBookings = [];
            AppState.milestones = [];
            AppState.tasks = [];
            AppState.risks = [];
            AppState.costs = [];

            // Lade Demo-Daten neu
            loadComprehensiveDemoData();

            // Trigger UI-Update
            if (window.UI && window.UI.currentView === 'projects') {
                window.UI.showProjectList();
            }

            console.log('🔄 Demo-Daten wurden neu geladen! Seite wird aktualisiert...');
            setTimeout(() => location.reload(), 1000);
        };
    })();

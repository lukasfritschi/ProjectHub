	// ============================================================
	// GLOBAL AUTH HANDLING FOR FETCH (401 ? LOGIN)
	// ============================================================
	
	const originalFetch = window.fetch;
	
	window.fetch = async (...args) => {
	    const response = await originalFetch(...args);
	
	    if (response.status === 401 && response.url.includes('/api/state')) {
	        console.warn("Nicht eingeloggt ? Redirect zu Microsoft Login...");
	        window.location.href = '/.auth/login/aad';
	        throw new Error('Unauthorized ? redirecting to login');
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
	    const appRoot = document.getElementById('app-root');
	    let unauthorized = false;
	
	    try {
	        // State laden ? hier kommen 401, 500, etc. rein
	        await AppState.load();
	
	        // UI initialisieren
	        UI.init();
	
	        // Deep-Linking
	        const hash = window.location.hash;
	        if (hash.startsWith('#project/')) {
	            const projectId = hash.replace('#project/', '');
	            if (AppState.getProject(projectId)) {
	                UI.showProjectDetails(projectId);
	            }
	        }
	
	    } catch (err) {
	        console.error("Init-Fehler:", err);
	
	        // Spezieller Fall: 401 ? Redirect auf Login, UI bleibt versteckt
	        if (err && typeof err.message === 'string' && err.message.includes('Unauthorized')) {
	            unauthorized = true;
	        } else {
	            // Alle anderen Fehler: App trotzdem anzeigen,
	            // damit du siehst, was los ist
	            if (appRoot) {
	                appRoot.style.visibility = 'visible';
	            }
	
	            // Optional: schlichter Fehlerbanner oben in der App
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
	                banner.textContent = 'Fehler beim Initialisieren von ProjectHub. Details in der Browser-Konsole (F12 ? Console).';
	                appRoot.prepend(banner);
	            }
	        }
	
	    } finally {
	        // Nur wenn wir NICHT im 401/Redirect-Fall sind:
	        if (appRoot && !unauthorized) {
	            appRoot.style.visibility = 'visible';
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

            // WICHTIG: Nur ausf�hren, wenn noch keine Buchungen vorhanden
            // Wenn bereits Demo-Daten existieren, nicht nochmal laden
            if (AppState.resourceBookings.length > 0) {
                console.log('?? Demo-Daten bereits vorhanden (' + AppState.resourceBookings.length + ' Buchungen)');
                return;
            }

            console.log('?? Loading comprehensive demo data...');

            const projects = AppState.projects;
            const members = AppState.members;

            if (projects.length === 0 || members.length === 0) return;

            // Helper function to find projects
            const findProject = (name) => projects.find(p => p.name.includes(name));
            const findMember = (name) => members.find(m => m.name === name);

            // Projekt 1: Hochdruck-Sensorsystem HP-500
            const p1 = findProject('HP-500');
            if (p1) {
                const team1 = [findMember('Thomas Meier'), findMember('Andreas Hofmann'), findMember('Stefan Weber'), findMember('Robert Huber'), findMember('Daniel Schmidt'), findMember('Sarah Fischer')].filter(m => m);
                team1.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p1.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-04-01' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p1.id, memberId: team1[0].id, startDate: '2024-04-01', endDate: '2025-02-28', capacityPercent: 70, description: 'Mechanik-Lead' },
                    { id: AppState.generateId(), projectId: p1.id, memberId: team1[1].id, startDate: '2024-04-01', endDate: '2025-01-31', capacityPercent: 60, description: 'Konstruktion' },
                    { id: AppState.generateId(), projectId: p1.id, memberId: team1[2].id, startDate: '2024-12-01', endDate: '2025-06-30', capacityPercent: 75, description: 'Elektronik-Design' },
                    { id: AppState.generateId(), projectId: p1.id, memberId: team1[3].id, startDate: '2025-02-01', endDate: '2025-06-30', capacityPercent: 85, description: 'Industrialisierung' },
                    { id: AppState.generateId(), projectId: p1.id, memberId: team1[4].id, startDate: '2025-01-15', endDate: '2025-05-31', capacityPercent: 80, description: 'Testing & Validation' },
                    { id: AppState.generateId(), projectId: p1.id, memberId: team1[5].id, startDate: '2025-04-01', endDate: '2025-06-30', capacityPercent: 60, description: 'Dokumentation' }
                );
                [
                    { name: 'Gate 1 ? Projekt-Vorbereitung', date: '2025-02-01', status: 'completed', description: 'Projektfreigabe' },
                    { name: 'Gate 2 ? Definition/Konzept', date: '2025-04-30', status: 'completed', description: 'Konzeptfreigabe' },
                    { name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2025-08-31', status: 'pending', description: 'Design Freeze' },
                    { name: 'Gate 4 ? Industrialisierung/Qualifikation', date: '2026-02-28', status: 'pending', description: 'Prozessqualifikation' },
                    { name: 'Gate 5 ? Markteinf�hrung/Serie', date: '2026-07-31', status: 'pending', description: 'Produktionsfreigabe' },
                    { name: 'SOP (Start of Production)', date: '2026-09-30', status: 'pending', description: 'Serienproduktion startet' }
                ].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p1.id, name: ms.name, date: ms.date, status: ms.status, description: ms.description }));
                [
                    { name: 'Druckkammer-Design finalisieren', status: 'done', startDate: '2025-02-01', endDate: '2025-04-15', progress: 100, responsible: team1[0].id, priority: 'high', duration: 73 },
                    { name: 'EMV-Tests durchf�hren', status: 'in_progress', startDate: '2025-04-15', endDate: '2025-06-30', progress: 65, responsible: team1[4].id, priority: 'high', duration: 76 },
                    { name: 'Lieferantenauswahl Dichtungen', status: 'done', startDate: '2025-02-15', endDate: '2025-04-30', progress: 100, responsible: team1[1].id, priority: 'medium', duration: 74 },
                    { name: 'Kalibrier-Protokoll erstellen', status: 'in_progress', startDate: '2025-05-01', endDate: '2025-07-15', progress: 50, responsible: team1[4].id, priority: 'high', duration: 75 },
                    { name: 'Produktionslinie-Layout', status: 'open', startDate: '2025-08-01', endDate: '2026-01-31', progress: 0, responsible: team1[3].id, priority: 'medium', duration: 183 },
                    { name: 'Technische Dokumentation', status: 'open', startDate: '2026-02-01', endDate: '2026-09-15', progress: 0, responsible: team1[5].id, priority: 'medium', duration: 227 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p1.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2024-04-01', dependencies: [] }));
                [
                    { title: 'Lieferverz�gerung Spezial-Stahl', probability: 'medium', impact: 'high', category: 'Lieferant', status: 'open', mitigation: 'Alternative Lieferanten evaluiert' },
                    { title: 'EMV-Anforderungen nicht erreicht', probability: 'low', impact: 'high', category: 'Technisch', status: 'mitigated', mitigation: 'Zus�tzliche Schirmung implementiert' },
                    { title: 'Kosten�berschreitung Werkzeugbau', probability: 'high', impact: 'medium', category: 'Budget', status: 'open', mitigation: 'Alternate supplier sourcing' }
                ].forEach(r => AppState.risks.push({ id: AppState.generateId(), projectId: p1.id, title: r.title, description: r.mitigation, probability: r.probability, impact: r.impact, category: r.category, status: r.status, mitigation: r.mitigation, owner: team1[0].id }));
                AppState.costs.push(
                    { id: AppState.generateId(), projectId: p1.id, date: '2024-05-15', type: 'internal_hours', category: 'Entwicklung', amount: 35000, description: 'Entwicklungsstunden Q2' },
                    { id: AppState.generateId(), projectId: p1.id, date: '2024-08-20', type: 'internal_hours', category: 'Entwicklung', amount: 45000, description: 'Entwicklungsstunden Q3' },
                    { id: AppState.generateId(), projectId: p1.id, date: '2024-11-10', type: 'internal_hours', category: 'Entwicklung', amount: 52000, description: 'Entwicklungsstunden Q4' },
                    { id: AppState.generateId(), projectId: p1.id, date: '2024-09-05', type: 'external_service', category: 'Extern', amount: 18000, description: 'FEM-Analyse extern' },
                    { id: AppState.generateId(), projectId: p1.id, date: '2024-10-12', type: 'investment', category: 'Investitionen', amount: 78000, description: 'Pr�fstand Hochdruckbereich' }
                );
            }

            // Projekt 2: Miniatur-Drucksensor MDS-100
            const p2 = findProject('MDS-100');
            if (p2) {
                const team2 = [findMember('Julia Schneider'), findMember('Petra Wagner'), findMember('Anna Graf'), findMember('Christina M�ller')].filter(m => m);
                team2.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p2.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-09-15' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p2.id, memberId: team2[0].id, startDate: '2024-09-15', endDate: '2025-01-15', capacityPercent: 65, description: 'Mechanik-Design' },
                    { id: AppState.generateId(), projectId: p2.id, memberId: team2[1].id, startDate: '2024-12-01', endDate: '2025-04-30', capacityPercent: 70, description: 'PCB-Layout' },
                    { id: AppState.generateId(), projectId: p2.id, memberId: team2[2].id, startDate: '2025-02-15', endDate: '2025-04-30', capacityPercent: 80, description: 'Validierung' },
                    { id: AppState.generateId(), projectId: p2.id, memberId: team2[3].id, startDate: '2025-03-01', endDate: '2025-04-30', capacityPercent: 70, description: 'Prozessplanung' }
                );
                [
                    { name: 'Gate 1 ? Projekt-Vorbereitung', date: '2025-02-15', status: 'completed' },
                    { name: 'Gate 2 ? Definition/Konzept', date: '2025-05-31', status: 'completed' },
                    { name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2025-09-30', status: 'pending' },
                    { name: 'Gate 4 ? Industrialisierung/Qualifikation', date: '2026-01-31', status: 'pending' },
                    { name: 'SOP (Start of Production)', date: '2026-03-31', status: 'pending' }
                ].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p2.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Biokompatibilit�ts-Tests', status: 'in_progress', startDate: '2025-03-01', endDate: '2025-05-31', progress: 70, responsible: team2[2].id, priority: 'critical', duration: 91 },
                    { name: 'Miniaturisierung Sensorchip', status: 'in_progress', startDate: '2025-02-15', endDate: '2025-06-30', progress: 55, responsible: team2[1].id, priority: 'high', duration: 135 },
                    { name: 'Geh�use-Prototypen', status: 'open', startDate: '2025-07-01', endDate: '2025-11-30', progress: 20, responsible: team2[0].id, priority: 'medium', duration: 152 },
                    { name: 'Zulassungsdokumentation', status: 'open', startDate: '2025-12-01', endDate: '2026-03-15', progress: 0, responsible: team2[0].id, priority: 'high', duration: 104 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p2.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-02-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p2.id, title: 'Zulassungsverfahren verz�gert', probability: 'medium', impact: 'high', category: 'Regulatorisch', status: 'open', mitigation: 'Fr�hzeitige Abstimmung mit Beh�rden', owner: team2[0].id },
                    { id: AppState.generateId(), projectId: p2.id, title: 'Miniaturisierung technisch nicht machbar', probability: 'low', impact: 'critical', category: 'Technisch', status: 'mitigated', mitigation: 'Alternative Chip-Technologie identifiziert', owner: team2[1].id }
                );
                AppState.costs.push(
                    { id: AppState.generateId(), projectId: p2.id, date: '2024-10-20', type: 'internal_hours', amount: 12000, description: 'Entwicklungskosten Q4' },
                    { id: AppState.generateId(), projectId: p2.id, date: '2024-11-15', type: 'external_service', amount: 8500, description: 'Biokompatibilit�tstests extern' }
                );
            }

            // Projekt 3-10 (kompakte Version f�r Dateigr��e)
            const p3 = findProject('IGW-2024');
            if (p3) {
                const team3 = [findMember('Stefan Weber'), findMember('Martin Schulz'), findMember('Petra Wagner'), findMember('Benjamin Koch'), findMember('Sarah Fischer')].filter(m => m);
                team3.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p3.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-07-01' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p3.id, memberId: team3[0].id, startDate: '2024-07-01', endDate: '2025-03-31', capacityPercent: 75, description: 'System-Architektur' },
                    { id: AppState.generateId(), projectId: p3.id, memberId: team3[1].id, startDate: '2024-11-01', endDate: '2025-08-31', capacityPercent: 80, description: 'Firmware-Entwicklung' },
                    { id: AppState.generateId(), projectId: p3.id, memberId: team3[2].id, startDate: '2024-07-15', endDate: '2025-01-31', capacityPercent: 60, description: 'PCB-Design' },
                    { id: AppState.generateId(), projectId: p3.id, memberId: team3[3].id, startDate: '2025-02-15', endDate: '2025-08-31', capacityPercent: 90, description: 'System-Integration' },
                    { id: AppState.generateId(), projectId: p3.id, memberId: team3[4].id, startDate: '2025-05-01', endDate: '2025-08-31', capacityPercent: 65, description: 'Dokumentation' }
                );
                [{ name: 'Gate 2 ? Definition/Konzept', date: '2025-04-30', status: 'completed' }, { name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2025-10-31', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2026-06-30', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p3.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Cloud-API Implementation', status: 'in_progress', startDate: '2025-04-01', endDate: '2025-07-31', progress: 60, responsible: team3[1].id, priority: 'high', duration: 121 },
                    { name: 'Funkzulassung (CE, FCC)', status: 'open', startDate: '2025-11-01', endDate: '2026-02-28', progress: 0, responsible: team3[3].id, priority: 'critical', duration: 119 },
                    { name: 'LoRa-Modul Integration', status: 'in_progress', startDate: '2025-05-01', endDate: '2025-09-30', progress: 45, responsible: team3[0].id, priority: 'high', duration: 152 },
                    { name: 'Feldtests', status: 'open', startDate: '2026-03-01', endDate: '2026-06-15', progress: 0, responsible: team3[2].id, priority: 'medium', duration: 106 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p3.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-03-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p3.id, title: 'Funkzulassung verz�gert sich', probability: 'medium', impact: 'high', category: 'Regulatorisch', status: 'open', mitigation: 'Externe Zulassungsberatung beauftragt', owner: team3[3].id },
                    { id: AppState.generateId(), projectId: p3.id, title: 'LoRa-Reichweite unter Erwartung', probability: 'low', impact: 'medium', category: 'Technisch', status: 'open', mitigation: 'Alternative Antennen-Design evaluieren', owner: team3[0].id },
                    { id: AppState.generateId(), projectId: p3.id, title: 'Cloud-Provider Abh�ngigkeit', probability: 'low', impact: 'medium', category: 'Extern', status: 'mitigated', mitigation: 'Multi-Cloud-Strategie implementiert', owner: team3[1].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p3.id, date: '2024-09-10', type: 'internal_hours', amount: 18000, description: 'Entwicklung Q3' }, { id: AppState.generateId(), projectId: p3.id, date: '2024-12-05', type: 'internal_hours', amount: 28000, description: 'Entwicklung Q4' });
            }

            const p4 = findProject('PL-Gen4');
            if (p4) {
                const team4 = [findMember('Robert Huber'), findMember('Andreas Hofmann'), findMember('Stefan Weber'), findMember('Oliver Richter'), findMember('Daniel Schmidt'), findMember('Michael Berger')].filter(m => m);
                team4.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p4.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-10-15' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p4.id, memberId: team4[0].id, startDate: '2024-10-15', endDate: '2026-03-31', capacityPercent: 80, description: 'Projekt-Lead' },
                    { id: AppState.generateId(), projectId: p4.id, memberId: team4[1].id, startDate: '2024-11-01', endDate: '2026-01-31', capacityPercent: 70, description: 'Mechanik Lead' },
                    { id: AppState.generateId(), projectId: p4.id, memberId: team4[2].id, startDate: '2024-11-15', endDate: '2026-02-28', capacityPercent: 65, description: 'Elektronik' },
                    { id: AppState.generateId(), projectId: p4.id, memberId: team4[3].id, startDate: '2025-06-01', endDate: '2026-03-31', capacityPercent: 75, description: 'Industrialisierung' },
                    { id: AppState.generateId(), projectId: p4.id, memberId: team4[4].id, startDate: '2024-12-01', endDate: '2025-12-31', capacityPercent: 50, description: 'Testing' },
                    { id: AppState.generateId(), projectId: p4.id, memberId: team4[5].id, startDate: '2025-01-01', endDate: '2025-09-30', capacityPercent: 40, description: 'Support' }
                );
                [{ name: 'Gate 2 ? Definition/Konzept', date: '2025-06-30', status: 'pending' }, { name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2026-03-31', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2027-06-30', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p4.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Anforderungskatalog finalisieren', status: 'in_progress', startDate: '2025-01-15', endDate: '2025-05-31', progress: 75, responsible: team4[0].id, priority: 'critical', duration: 136 },
                    { name: 'Konzept-Review', status: 'open', startDate: '2025-06-01', endDate: '2025-09-30', progress: 0, responsible: team4[1].id, priority: 'high', duration: 121 },
                    { name: 'Prototyp-Entwicklung', status: 'open', startDate: '2025-10-01', endDate: '2026-08-31', progress: 0, responsible: team4[2].id, priority: 'high', duration: 334 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p4.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-01-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p4.id, title: 'Technologie-Reife nicht ausreichend', probability: 'high', impact: 'critical', category: 'Technisch', status: 'open', mitigation: 'Prototyp-Tests im Q1/2025 geplant', owner: team4[0].id },
                    { id: AppState.generateId(), projectId: p4.id, title: 'Budget-�berschreitung wahrscheinlich', probability: 'medium', impact: 'high', category: 'Budget', status: 'open', mitigation: 'Monatliches Controlling etabliert', owner: team4[0].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p4.id, date: '2024-11-25', type: 'internal_hours', amount: 25000, description: 'Konzeptphase Q4' });
            }

            const p5 = findProject('Kalibrierstation');
            if (p5) {
                const team5 = [findMember('Oliver Richter'), findMember('Sabine Lehmann'), findMember('Martin Schulz'), findMember('Benjamin Koch')].filter(m => m);
                team5.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p5.id, memberId: m.id, roleInProject: m.role, addedDate: '2023-11-01' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p5.id, memberId: team5[0].id, startDate: '2023-11-01', endDate: '2025-01-31', capacityPercent: 40, description: 'Prozess-Engineering' },
                    { id: AppState.generateId(), projectId: p5.id, memberId: team5[2].id, startDate: '2024-01-15', endDate: '2024-12-31', capacityPercent: 45, description: 'Software KI-Modul' },
                    { id: AppState.generateId(), projectId: p5.id, memberId: team5[3].id, startDate: '2024-09-01', endDate: '2025-01-31', capacityPercent: 55, description: 'Validierung' }
                );
                [{ name: 'Gate 5 ? Markteinf�hrung/Serie', date: '2026-08-31', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2026-10-31', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p5.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Produktions-Freigabe-Tests', status: 'in_progress', startDate: '2025-08-01', endDate: '2026-01-31', progress: 80, responsible: team5[3].id, priority: 'critical', duration: 183 },
                    { name: 'KI-Modul Training', status: 'done', startDate: '2025-04-15', endDate: '2025-08-31', progress: 100, responsible: team5[2].id, priority: 'high', duration: 138 },
                    { name: 'Produktionslinie Setup', status: 'in_progress', startDate: '2026-02-01', endDate: '2026-10-15', progress: 65, responsible: team5[0].id, priority: 'high', duration: 256 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p5.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-04-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p5.id, title: 'SOP-Verz�gerung (Gate 5 delayed)', probability: 'high', impact: 'medium', category: 'Terminplan', status: 'open', mitigation: 'Zus�tzliche Ressourcen f�r Freigabe-Tests', owner: team5[0].id },
                    { id: AppState.generateId(), projectId: p5.id, title: 'KI-Modell Genauigkeit unter Ziel', probability: 'low', impact: 'high', category: 'Technisch', status: 'mitigated', mitigation: 'Erweiterte Trainingsdaten integriert', owner: team5[2].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p5.id, date: '2024-06-15', type: 'internal_hours', amount: 32000, description: 'Entwicklung Q2' }, { id: AppState.generateId(), projectId: p5.id, date: '2024-07-12', type: 'investment', amount: 68000, description: 'Kalibrierausr�stung' });
            }

            const p6 = findProject('TCM-X');
            if (p6) {
                const team6 = [findMember('Martin Schulz'), findMember('Anna Graf')].filter(m => m);
                team6.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p6.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-11-01' }));
                AppState.resourceBookings.push({ id: AppState.generateId(), projectId: p6.id, memberId: team6[0].id, startDate: '2024-11-01', endDate: '2025-05-31', capacityPercent: 40, description: 'Elektronik-Design' });
                [{ name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2025-11-30', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2026-02-28', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p6.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Temperatur-Sensor Kalibrierung', status: 'in_progress', startDate: '2025-05-15', endDate: '2025-09-30', progress: 40, responsible: team6[0].id, priority: 'high', duration: 138 },
                    { name: 'Extrem-Tests (-40�C bis +150�C)', status: 'open', startDate: '2025-10-01', endDate: '2026-02-15', progress: 0, responsible: team6[1].id, priority: 'critical', duration: 137 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p6.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-05-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p6.id, title: 'Extremtemperatur-Tests schlagen fehl', probability: 'medium', impact: 'critical', category: 'Technisch', status: 'open', mitigation: 'Material-Alternativen in Evaluation', owner: team6[0].id },
                    { id: AppState.generateId(), projectId: p6.id, title: 'Kleines Team - Ressourcenknappheit', probability: 'medium', impact: 'medium', category: 'Ressourcen', status: 'open', mitigation: 'Backup-Ressourcen aus anderen Teams definiert', owner: team6[0].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p6.id, date: '2024-12-05', type: 'internal_hours', amount: 8000, description: 'Entwicklung Q4' });
            }

            const p7 = findProject('DiagPro');
            if (p7) {
                const team7 = [findMember('Stefan Weber'), findMember('Martin Schulz'), findMember('Michael Berger')].filter(m => m);
                team7.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p7.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-05-15' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p7.id, memberId: team7[0].id, startDate: '2024-05-15', endDate: '2025-07-31', capacityPercent: 35, description: 'Software-Architektur' },
                    { id: AppState.generateId(), projectId: p7.id, memberId: team7[1].id, startDate: '2024-06-01', endDate: '2025-07-31', capacityPercent: 50, description: 'Backend-Development' }
                );
                [{ name: 'Gate 4 ? Industrialisierung/Qualifikation', date: '2026-10-31', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2026-12-31', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p7.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Backend API Entwicklung', status: 'done', startDate: '2025-06-15', endDate: '2025-10-31', progress: 100, responsible: team7[1].id, priority: 'high', duration: 138 },
                    { name: 'Predictive Maintenance Algorithmus', status: 'in_progress', startDate: '2025-07-01', endDate: '2026-02-28', progress: 70, responsible: team7[0].id, priority: 'high', duration: 242 },
                    { name: 'Cloud-Integration', status: 'in_progress', startDate: '2025-11-01', endDate: '2026-05-31', progress: 50, responsible: team7[1].id, priority: 'high', duration: 211 },
                    { name: 'Beta-Testing', status: 'open', startDate: '2026-06-01', endDate: '2026-12-15', progress: 0, responsible: team7[2].id, priority: 'medium', duration: 197 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p7.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-06-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p7.id, title: 'Cloud-Integration Komplexit�t untersch�tzt', probability: 'medium', impact: 'medium', category: 'Technisch', status: 'open', mitigation: 'Externe Cloud-Expertise zugezogen', owner: team7[1].id },
                    { id: AppState.generateId(), projectId: p7.id, title: 'Predictive Maintenance Algorithmus Genauigkeit', probability: 'low', impact: 'high', category: 'Technisch', status: 'mitigated', mitigation: 'Umfangreiche Feldtests geplant', owner: team7[0].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p7.id, date: '2024-08-20', type: 'internal_hours', amount: 22000, description: 'Entwicklung Q3' });
            }

            const p8 = findProject('KGF-2025');
            if (p8) {
                const team8 = [findMember('Nina Bauer'), findMember('Christina M�ller')].filter(m => m);
                team8.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p8.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-12-01' }));
                AppState.resourceBookings.push({ id: AppState.generateId(), projectId: p8.id, memberId: team8[0].id, startDate: '2024-12-01', endDate: '2025-09-30', capacityPercent: 35, description: 'Geh�use-Design' });
                [{ name: 'Gate 2 ? Definition/Konzept', date: '2025-10-31', status: 'pending' }, { name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2026-03-31', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p8.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Material-Studie Recycling-Kunststoffe', status: 'in_progress', startDate: '2025-07-15', endDate: '2025-10-15', progress: 60, responsible: team8[0].id, priority: 'high', duration: 92 },
                    { name: 'Spritzguss-Werkzeug Design', status: 'open', startDate: '2025-11-01', endDate: '2026-02-28', progress: 0, responsible: team8[0].id, priority: 'high', duration: 119 },
                    { name: 'Montage-Konzept', status: 'open', startDate: '2026-03-01', endDate: '2026-05-15', progress: 0, responsible: team8[1].id, priority: 'medium', duration: 75 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p8.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2025-07-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p8.id, title: 'Recycling-Material Verf�gbarkeit unsicher', probability: 'high', impact: 'medium', category: 'Lieferant', status: 'open', mitigation: 'Alternative Lieferanten qualifiziert', owner: team8[0].id },
                    { id: AppState.generateId(), projectId: p8.id, title: 'Werkzeugkosten h�her als geplant', probability: 'medium', impact: 'medium', category: 'Budget', status: 'open', mitigation: 'Budget-Reserve eingeplant', owner: team8[0].id }
                );
            }

            const p9 = findProject('AS-300');
            if (p9) {
                const team9 = [findMember('Thomas Meier'), findMember('Nina Bauer'), findMember('Petra Wagner'), findMember('Daniel Schmidt'), findMember('Robert Huber')].filter(m => m);
                team9.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p9.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-06-01' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p9.id, memberId: team9[0].id, startDate: '2024-06-01', endDate: '2026-02-28', capacityPercent: 55, description: 'Mechanik Lead & Safety' },
                    { id: AppState.generateId(), projectId: p9.id, memberId: team9[1].id, startDate: '2024-07-01', endDate: '2026-02-28', capacityPercent: 45, description: 'Geh�use-Design' },
                    { id: AppState.generateId(), projectId: p9.id, memberId: team9[3].id, startDate: '2025-06-01', endDate: '2026-02-28', capacityPercent: 65, description: 'ISO 26262 Validierung' }
                );
                [{ name: 'Gate 3 ? Entwicklung/Konstruktion', date: '2025-06-30', status: 'pending' }, { name: 'Gate 4 ? Industrialisierung/Qualifikation', date: '2026-09-30', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2027-03-31', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p9.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'ASIL-B Sicherheitskonzept', status: 'in_progress', startDate: '2025-03-01', endDate: '2025-08-31', progress: 65, responsible: team9[0].id, priority: 'critical', duration: 183 },
                    { name: 'ISO 26262 Dokumentation', status: 'in_progress', startDate: '2025-04-01', endDate: '2025-10-31', progress: 50, responsible: team9[3].id, priority: 'high', duration: 213 },
                    { name: 'ABS/ESP Integration Tests', status: 'open', startDate: '2025-09-01', endDate: '2026-03-31', progress: 0, responsible: team9[1].id, priority: 'high', duration: 211 },
                    { name: 'Automotive-Zulassung', status: 'open', startDate: '2026-04-01', endDate: '2027-02-28', progress: 0, responsible: team9[0].id, priority: 'critical', duration: 334 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p9.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2024-06-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p9.id, title: 'ISO 26262 Zertifizierung verz�gert', probability: 'medium', impact: 'critical', category: 'Regulatorisch', status: 'open', mitigation: 'Externe ISO 26262 Auditoren beauftragt', owner: team9[3].id },
                    { id: AppState.generateId(), projectId: p9.id, title: 'ASIL-B Anforderungen nicht erf�llbar', probability: 'low', impact: 'critical', category: 'Technisch', status: 'mitigated', mitigation: 'Redundante Sicherheitsarchitektur implementiert', owner: team9[0].id },
                    { id: AppState.generateId(), projectId: p9.id, title: 'OEM Anforderungs�nderungen', probability: 'high', impact: 'high', category: 'Kunde', status: 'open', mitigation: 'Agile Entwicklung mit 2-Wochen-Sprints', owner: team9[0].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p9.id, date: '2024-08-15', type: 'internal_hours', amount: 38000, description: 'Entwicklung Q3' }, { id: AppState.generateId(), projectId: p9.id, date: '2024-10-15', type: 'investment', amount: 95000, description: 'Automotive Test Equipment' });
            }

            const p10 = findProject('STS-Pro');
            if (p10) {
                const team10 = [findMember('Laura Zimmermann'), findMember('Martin Schulz'), findMember('David Keller')].filter(m => m);
                team10.forEach(m => AppState.projectTeamMembers.push({ id: AppState.generateId(), projectId: p10.id, memberId: m.id, roleInProject: m.role, addedDate: '2024-08-01' }));
                AppState.resourceBookings.push(
                    { id: AppState.generateId(), projectId: p10.id, memberId: team10[0].id, startDate: '2024-08-01', endDate: '2025-03-31', capacityPercent: 50, description: 'Projekt-Lead' },
                    { id: AppState.generateId(), projectId: p10.id, memberId: team10[1].id, startDate: '2024-08-15', endDate: '2025-03-31', capacityPercent: 55, description: 'Software-Entwicklung' }
                );
                [{ name: 'Gate 4 ? Industrialisierung/Qualifikation', date: '2026-05-31', status: 'pending' }, { name: 'SOP (Start of Production)', date: '2026-08-31', status: 'pending' }].forEach(ms => AppState.milestones.push({ id: AppState.generateId(), projectId: p10.id, name: ms.name, date: ms.date, status: ms.status, description: '' }));
                [
                    { name: 'Ferndiagnose-Modul', status: 'done', startDate: '2025-08-15', endDate: '2025-12-31', progress: 100, responsible: team10[1].id, priority: 'high', duration: 138 },
                    { name: 'Konfigurationstool UI', status: 'in_progress', startDate: '2025-09-01', endDate: '2026-02-28', progress: 75, responsible: team10[1].id, priority: 'high', duration: 180 },
                    { name: 'Report-Generator', status: 'in_progress', startDate: '2026-01-01', endDate: '2026-05-15', progress: 40, responsible: team10[0].id, priority: 'medium', duration: 134 }
                ].forEach(t => AppState.tasks.push({ id: AppState.generateId(), projectId: p10.id, name: t.name, description: '', status: t.status, startDate: t.startDate, endDate: t.endDate, dueDate: t.endDate, progress: t.progress, responsible: t.responsible, priority: t.priority, duration: t.duration, createdDate: '2024-08-01', dependencies: [] }));
                AppState.risks.push(
                    { id: AppState.generateId(), projectId: p10.id, title: 'Konfigurationstool UX nicht intuitiv', probability: 'medium', impact: 'medium', category: 'Kunde', status: 'open', mitigation: 'User Testing mit Pilotprojekten geplant', owner: team10[1].id },
                    { id: AppState.generateId(), projectId: p10.id, title: 'Datenvolumen Report-Generator zu hoch', probability: 'low', impact: 'low', category: 'Technisch', status: 'mitigated', mitigation: 'Datenkompression implementiert', owner: team10[0].id }
                );
                AppState.costs.push({ id: AppState.generateId(), projectId: p10.id, date: '2024-10-10', type: 'internal_hours', amount: 15000, description: 'Entwicklung Q4' });
            }

            AppState.save();
            console.log('? Demo-Daten erfolgreich geladen!');
            console.log(`   ${projects.length} Projekte | ${members.length} Ressourcen | ${AppState.resourceBookings.length} Buchungen`);
        }

        // Auto-load DISABLED - Demo data is now loaded manually via button
        // if (document.readyState === 'loading') {
        //     document.addEventListener('DOMContentLoaded', () => setTimeout(loadComprehensiveDemoData, 500));
        // } else {
        //     setTimeout(loadComprehensiveDemoData, 500);
        // }

        // Globale Funktion zum manuellen Neuladen der Demo-Daten
        // Neue Funktion: Demo-Daten aus hochgeladener JSON-Datei laden
        window.loadDemoDataFromJson = async function(file) {
            const AppState = window.AppState;
            if (!AppState) {
                console.error('? AppState nicht verf�gbar');
                return false;
            }

            try {
                console.log('?? Lade Demo-Daten aus hochgeladener Datei...');

                // Lese die hochgeladene Datei
                const fileContent = await file.text();
                const demoData = JSON.parse(fileContent);

                // Validierung
                if (!demoData.members || !demoData.projects) {
                    throw new Error('Ung�ltige Demo-Daten: members oder projects fehlen');
                }

                // L�sche alle vorhandenen Daten
                AppState.members = [];
                AppState.projects = [];
                AppState.projectTeamMembers = [];
                AppState.resourceBookings = [];
                AppState.milestones = [];
                AppState.tasks = [];
                AppState.risks = [];
                AppState.costs = [];

                // Importiere in korrekter Reihenfolge
                console.log('  1?? Importiere Ressourcen (members)...');
                AppState.members = demoData.members || [];

                console.log('  2?? Importiere Projekte...');
                AppState.projects = demoData.projects || [];

                console.log('  3?? Importiere Projekt-Teammitglieder...');
                AppState.projectTeamMembers = demoData.projectTeamMembers || [];

                console.log('  4?? Importiere Ressourcen-Buchungen...');
                AppState.resourceBookings = demoData.resourceBookings || [];

                console.log('  5?? Importiere Meilensteine...');
                AppState.milestones = demoData.milestones || [];

                console.log('  6?? Importiere Aufgaben...');
                AppState.tasks = demoData.tasks || [];

                console.log('  7?? Importiere Risiken...');
                AppState.risks = demoData.risks || [];

                console.log('  8?? Importiere Kosten...');
                AppState.costs = demoData.costs || [];

                // Synchronisiere SOP aus Milestones
                console.log('  9?? Synchronisiere SOP-Daten aus Milestones...');
                AppState.projects.forEach(project => {
                    // Finde SOP Milestone f�r dieses Projekt
                    const sopMs = AppState.milestones.find(
                        m => m.projectId === project.id && m.name && m.name.includes('SOP')
                    );

                    // Wenn SOP Milestone gefunden und Projekt hat noch keine SOP-Daten
                    if (sopMs && !project.sopCurrentDate) {
                        project.sopBaselineDate = sopMs.date;
                        project.sopCurrentDate = sopMs.date;
                        project.sopChangeComment = project.sopChangeComment || '';
                    }

                    // Stelle sicher, dass SOP-Felder existieren (f�r Abw�rtskompatibilit�t)
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

                console.log(`? Demo-Daten erfolgreich geladen!`);
                console.log(`   ${AppState.members.length} Ressourcen`);
                console.log(`   ${AppState.projects.length} Projekte`);
                console.log(`   ${AppState.projectTeamMembers.length} Teammitglieder`);
                console.log(`   ${AppState.resourceBookings.length} Buchungen`);

                // UI vollst�ndig aktualisieren (ohne Reload, da localStorage nicht verf�gbar)
                console.log('?? Aktualisiere UI...');
                if (window.UI) {
                    // Zeige Projektliste an
                    window.UI.showView('project-list');
                    window.UI.renderProjectList();

                    // Success-Meldung anzeigen
                    const successDiv = document.createElement('div');
                    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; background: #059669; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out;';
                    successDiv.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">?</span>
                            <div>
                                <strong>Demo-Daten erfolgreich geladen!</strong>
                                <div style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.25rem;">
                                    ${AppState.projects.length} Projekte, ${AppState.members.length} Ressourcen, ${AppState.resourceBookings.length} Buchungen
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(successDiv);

                    // Success-Meldung nach 4 Sekunden ausblenden
                    setTimeout(() => {
                        successDiv.style.opacity = '0';
                        successDiv.style.transition = 'opacity 0.3s';
                        setTimeout(() => successDiv.remove(), 300);
                    }, 4000);
                }

                return true;

            } catch (error) {
                console.error('? Fehler beim Laden der Demo-Daten:', error);

                // Erstelle eine Fehler-Anzeige im UI
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 500px;';
                errorDiv.innerHTML = `
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">? Fehler beim Laden der Demo-Daten</h3>
                    <p style="margin-bottom: 1rem;">${error.message}</p>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem;">Bitte �berpr�fen Sie, dass die hochgeladene Datei eine g�ltige JSON-Datei ist.</p>
                    <button onclick="this.parentElement.remove()" style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">Schlie�en</button>
                `;
                document.body.appendChild(errorDiv);

                return false;
            }
        };

        // Legacy-Funktion f�r Kompatibilit�t
        window.reloadDemoData = function() {
            const AppState = window.AppState;
            if (!AppState) {
                console.error('AppState nicht verf�gbar');
                return;
            }

            // L�sche alle projektbezogenen Daten
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

            console.log('? Demo-Daten wurden neu geladen! Seite wird aktualisiert...');
            setTimeout(() => location.reload(), 1000);
        };
    })();
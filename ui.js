		// ============================================================
        // UI CONTROLLER
        // ============================================================

        const UI = {
            // -----------------------------
            // UI-State: Kosten Filter & Suche
            // -----------------------------
            costsFilters : { q: '', type: '', status: '' },
            _costsSearchTimer : null,

            currentTab: 'overview',

            init() {
                this.setupEventListeners();
                this.setupTheme();
                this.renderProjectList();
            },

            setupEventListeners() {
                // Theme toggle
                document.getElementById('theme-toggle').addEventListener('click', () => {
                    document.documentElement.classList.toggle('dark');
                    const icon = document.getElementById('theme-icon');
                    icon.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
                    try {
                        window.localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                    } catch (e) {
                        // Ignore storage errors
                    }
                });

                // New project button
                document.getElementById('btn-new-project').addEventListener('click', () => {
                    this.showNewProjectModal();
                });

                // Export All Projects PDF button
                document.getElementById('btn-export-all-projects-pdf').addEventListener('click', () => {
                    this.showManagementCommentsModal();
                });

                // Demo-Daten laden Button - öffnet Datei-Dialog (nur wenn Button vorhanden ist)
                const demoButton = document.getElementById('btn-load-demo-data');
                if (demoButton) {
                    demoButton.addEventListener('click', () => {
                        // Erstelle einen versteckten File-Input
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = '.json,application/json';
                        fileInput.style.display = 'none';

                        fileInput.addEventListener('change', async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            // Bestätigungsdialog erstellen
                            const confirmDiv = document.createElement('div');
                            confirmDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';
                            confirmDiv.innerHTML = `
                                <div style="background: white; padding: 2rem; border-radius: 0.5rem; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                                    <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">Demo-Daten laden?</h3>
                                    <p style="margin-bottom: 0.5rem; color: #6b7280;">
                                        Datei: <strong>${file.name}</strong>
                                    </p>
                                    <p style="margin-bottom: 1.5rem; color: #6b7280;">
                                        Alle vorhandenen Daten (Projekte, Ressourcen, Buchungen, etc.) werden gelöscht und durch die Daten aus dieser Datei ersetzt.
                                        <br><br>
                                        <strong>Diese Aktion kann nicht rückgängig gemacht werden!</strong>
                                    </p>
                                    <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                                        <button id="demo-cancel" style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white; cursor: pointer;">Abbrechen</button>
                                        <button id="demo-confirm" style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #059669; color: white; cursor: pointer;">Ja, Daten laden</button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(confirmDiv);

                            // Event-Listener für Buttons
                            confirmDiv.querySelector('#demo-cancel').addEventListener('click', () => {
                                confirmDiv.remove();
                                fileInput.remove();
                            });

                            confirmDiv.querySelector('#demo-confirm').addEventListener('click', async () => {
                                confirmDiv.remove();
                                await window.loadDemoDataFromJson(file);
                                fileInput.remove();
                            });
                        });

                        document.body.appendChild(fileInput);
                        fileInput.click();
                    });
                }


                // Back to list
                document.getElementById('btn-back-to-list').addEventListener('click', () => {
                    this.showView('project-list');
                });

                // Tab switching
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.switchTab(e.target.dataset.tab);
                    });
                });

                // Filters
                document.getElementById('filter-lead').addEventListener('change', () => this.renderProjectList());
                document.getElementById('filter-status').addEventListener('change', () => this.renderProjectList());
                document.getElementById('filter-phase').addEventListener('change', () => this.renderProjectList());

                // Generate onepager
                // Add cost button
                document.getElementById('btn-add-cost').addEventListener('click', () => {
                    this.showAddCostModal();
                });

                // Add milestone button
                document.getElementById('btn-add-milestone').addEventListener('click', () => {
                    this.showAddMilestoneModal();
                });

                // Add risk button
                document.getElementById('btn-add-risk').addEventListener('click', () => {
                    this.showAddRiskModal();
                });

                // Add task button
                document.getElementById('btn-add-task').addEventListener('click', () => {
                    this.showAddTaskModal();
                });

                // Edit project
                document.getElementById('btn-edit-project').addEventListener('click', () => {
                    this.showEditProjectModal();
                });

                // NEW: Archive project button
                document.getElementById('btn-archive-project').addEventListener('click', () => {
                    this.archiveProject();
                });
            },

            setupTheme() {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                    document.getElementById('theme-icon').textContent = '☀️';
                }

                try {
                    const savedTheme = window.localStorage.getItem('theme');
                    if (savedTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                        document.getElementById('theme-icon').textContent = '☀️';
                    }
                } catch (e) {
                    // Ignore storage errors
                }

                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                    if (event.matches) {
                        document.documentElement.classList.add('dark');
                        document.getElementById('theme-icon').textContent = '☀️';
                    } else {
                        document.documentElement.classList.remove('dark');
                        document.getElementById('theme-icon').textContent = '🌙';
                    }
                });
            },

            showView(viewName) {
                document.getElementById('view-project-list').classList.add('hidden');
                document.getElementById('view-project-details').classList.add('hidden');
                document.getElementById('view-' + viewName).classList.remove('hidden');

                if (viewName === 'project-list') {
                    this.renderProjectList();
                }
            },

            switchTab(tabName) {
                // Update tab buttons
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

                // Update tab contents
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById('tab-' + tabName).classList.remove('hidden');

                this.currentTab = tabName;

                // Render content for specific tabs
                if (tabName === 'gantt') {
                    this.renderGanttTab();
                } else if (tabName === 'team') {
                    // If we're viewing a project, render project team tab, otherwise render global team tab
                    if (AppState.currentProjectId) {
                        this.renderProjectTeamTab();
                    } else {
                        this.renderTeamTab();
                    }
                } else if (tabName === 'resources') {
                    this.renderResourcesTab();
                } else if (tabName === 'costs') {
                    this.renderCostsTab();
                }
            },

            renderProjectList() {
                const container = document.getElementById('project-cards-container');
                const filterLead = document.getElementById('filter-lead').value;
                const filterStatus = document.getElementById('filter-status').value;
                const filterPhase = document.getElementById('filter-phase').value;

                let projects = AppState.projects;

                // Apply filters
                if (filterLead) {
                    projects = projects.filter(p => p.projectLead === filterLead);
                }
                if (filterStatus) {
                    projects = projects.filter(p => AppState.calculateProjectStatus(p.id) === filterStatus);
                }
                if (filterPhase) {
                    projects = projects.filter(p => p.phase === filterPhase);
                }

                // NEW: Sort by priority (1 = highest), then by name
                projects.sort((a, b) => {
                    const prioA = a.priority || 3;
                    const prioB = b.priority || 3;
                    if (prioA !== prioB) {
                        return prioA - prioB;  // Lower number = higher priority
                    }
                    return a.name.localeCompare(b.name);  // Secondary sort by name
                });

                // Update filter options
                this.updateFilterOptions();

                if (projects.length === 0) {
                    container.innerHTML = '<div class="card"><p style="color: var(--text-secondary);">Keine Projekte gefunden. Erstellen Sie Ihr erstes Projekt!</p></div>';
                    return;
                }

                container.innerHTML = projects.map(project => {
                    const statusLight = AppState.calculateProjectStatus(project.id);
                    const costs = AppState.getProjectCosts(project.id);
                    const costsByCategory = AppState.getProjectCostsByCategory(project.id);
                    const totalBudget = project.budget ? project.budget.total : 0;
                    const totalActual = costsByCategory.intern.actual + costsByCategory.extern.actual + costsByCategory.investitionen.actual;
                    const totalForecast = costsByCategory.intern.forecast + costsByCategory.extern.forecast + costsByCategory.investitionen.forecast;
                    const burnrate = AppState.calculateBurnrate(project.id);
                    const variance = totalForecast - totalBudget;
                    const pnDisplay = project.projectNumber ? ('Projekt Nr.: ' + this.escapeHtml(project.projectNumber) + ' · ') : '';

                    const priorityLabels = {1: 'Sehr hoch', 2: 'Hoch', 3: 'Mittel', 4: 'Niedrig', 5: 'Sehr niedrig'};
                    const priority = project.priority || 3;
                    const priorityColors = {1: '#dc2626', 2: '#ea580c', 3: '#6b7280', 4: '#9ca3af', 5: '#d1d5db'};

                    return `
                        <div class="card" style="cursor: pointer;" onclick="UI.showProjectDetails('${project.id}')">
                            <div class="flex" style="justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <div class="flex" style="align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <h3 class="font-semibold text-lg" style="margin: 0;">${this.escapeHtml(project.name)}</h3>
                                        <span class="status-light ${statusLight}"></span>
                                        <span style="padding: 0.25rem 0.5rem; background: ${priorityColors[priority]}; color: white; border-radius: 0.25rem; font-size: 0.75rem; font-weight: bold;">
                                            P${priority}
                                        </span>
                                    </div>
                                    <p class="text-sm" style="color: var(--text-secondary);">${pnDisplay}${this.escapeHtml(project.projectLead)}</p>
                                </div>
                            </div>
                            <p class="text-sm mb-4" style="color: var(--text-secondary);">${this.escapeHtml(project.description.substring(0, 100))}...</p>
                            <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                    <span style="color: var(--text-secondary);">Phase:</span><br>
                                    <strong>${this.escapeHtml(project.phase)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Fortschritt:</span><br>
                                    <strong>${project.progress}%</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">SOP:</span><br>
                                    ${this.renderSOPWithColor(project)}
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Budget:</span><br>
                                    <strong class="font-mono">${this.formatCurrency(totalBudget, project.currency)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Ist-Kosten:</span><br>
                                    <strong class="font-mono">${this.formatCurrency(totalActual, project.currency)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Forecast:</span><br>
                                    <strong class="font-mono">${this.formatCurrency(totalForecast, project.currency)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Abweichung (Forecast zu Budget):</span><br>
                                    <strong class="font-mono">
                                    ${this.getBudgetVarianceHTML(totalForecast, totalBudget, project.currency)}
                                    </strong>
                                </div>
                            </div>
                            <div class="p-2" style="background: var(--bg-tertiary); border-radius: 0.375rem;">
                                <span class="text-sm" style="color: var(--text-secondary);">Burnrate (intern):</span>
                                <strong class="font-mono ml-2">🔥 ${this.formatCurrency(burnrate, project.currency)}/Monat</strong>
                            </div>
                        </div>
                    `;
                }).join('');
            },

            updateFilterOptions() {
                // Update project lead filter
                const leads = [...new Set(AppState.projects.map(p => p.projectLead))];
                const leadFilter = document.getElementById('filter-lead');
                const currentLead = leadFilter.value;
                leadFilter.innerHTML = '<option value="">Alle</option>' +
                    leads.map(lead => `<option value="${this.escapeHtml(lead)}" ${currentLead === lead ? 'selected' : ''}>${this.escapeHtml(lead)}</option>`).join('');

                // Update phase filter
                const phases = [...new Set(AppState.projects.map(p => p.phase))];
                const phaseFilter = document.getElementById('filter-phase');
                const currentPhase = phaseFilter.value;
                phaseFilter.innerHTML = '<option value="">Alle</option>' +
                    phases.map(phase => `<option value="${this.escapeHtml(phase)}" ${currentPhase === phase ? 'selected' : ''}>${this.escapeHtml(phase)}</option>`).join('');
            },

            // NEW: Global View Switching
            switchGlobalView(viewName) {
                // Update navigation buttons
                document.querySelectorAll('.nav-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

                // Hide all views
                document.getElementById('view-project-list').classList.add('hidden');
                document.getElementById('view-global-team').classList.add('hidden');
                document.getElementById('view-portfolio-gantt').classList.add('hidden');
                document.getElementById('view-project-details').classList.add('hidden');

                // Show selected view
                if (viewName === 'projects') {
                    document.getElementById('view-project-list').classList.remove('hidden');
                    this.renderProjectList();
                } else if (viewName === 'portfolio') {
                    document.getElementById('view-portfolio-gantt').classList.remove('hidden');
                    this.renderPortfolioGantt();
                } else if (viewName === 'team') {
                    document.getElementById('view-global-team').classList.remove('hidden');
                    this.renderGlobalTeam();
                }
            },

            // NEW: Render Global Team View
            renderGlobalTeam() {
                const members = AppState.members;
                const tableBody = document.querySelector('#global-team-table tbody');
                const capacityOverview = document.getElementById('global-capacity-overview');

                if (!tableBody) return;

                // Render team members table
                if (members.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                Keine Teammitglieder vorhanden. Klicken Sie "+ Neues Teammitglied", um ein Mitglied anzulegen.
                            </td>
                        </tr>
                    `;
                } else {
                    tableBody.innerHTML = members.map(member => {
                        const isActive = member.active !== false;
                        const globalUtil = AppState.getGlobalResourceUtilization(member.id);
                        const utilizationPercent = globalUtil ? globalUtil.totalUtilization : 0;
                        const isOverbooked = globalUtil ? globalUtil.isOverbooked : false;

                        return `
                            <tr style="${!isActive ? 'opacity: 0.6;' : ''}">
                                <td><strong>${this.escapeHtml(member.name)}</strong></td>
                                <td>${this.escapeHtml(member.role)}</td>
                                <td><span style="color: var(--text-secondary);">${this.escapeHtml(member.competencyGroup || 'Nicht zugewiesen')}</span></td>
                                <td class="font-mono">${member.hourlyRateInternal ?? 0} CHF/h</td>
                                <td class="font-mono">${member.employmentLevel || 100}%</td>
                                <td class="font-mono" style="color: var(--primary);">
                                    <strong>${member.availableCapacity || 80}%</strong>
                                </td>
                                <td class="font-mono" style="color: ${isOverbooked ? 'var(--danger)' : 'var(--success)'};">
                                    <strong>${utilizationPercent}%</strong>
                                    ${isOverbooked ? ' ⚠ ÜBERBUCHT!' : ''}
                                </td>
                                <td>
                                    <span style="color: ${isActive ? 'var(--success)' : 'var(--text-secondary)'};">
                                        ${isActive ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;"
                                            onclick="UI.showEditMemberModal('${member.id}')">
                                        Bearbeiten
                                    </button>
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                            onclick="UI.toggleMemberStatus('${member.id}')">
                                        ${isActive ? 'Deaktivieren' : 'Aktivieren'}
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }

                // Render global capacity overview
                if (capacityOverview) {
                    const activeMembers = members.filter(m => m.active !== false);
                    const overbookedMembers = activeMembers.filter(m => {
                        const util = AppState.getGlobalResourceUtilization(m.id);
                        return util && util.isOverbooked;
                    });

                    capacityOverview.innerHTML = `
                        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                            <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                                <div class="text-sm" style="color: var(--text-secondary);">Aktive Mitglieder</div>
                                <div class="text-2xl font-bold font-mono mt-1">${activeMembers.length}</div>
                            </div>
                            <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                                <div class="text-sm" style="color: var(--text-secondary);">überbuchte Ressourcen</div>
                                <div class="text-2xl font-bold font-mono mt-1" style="color: ${overbookedMembers.length > 0 ? 'var(--danger)' : 'var(--success)'}">
                                    ${overbookedMembers.length}
                                </div>
                            </div>
                        </div>

                        ${overbookedMembers.length > 0 ? `
                            <div class="mt-4 p-4" style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid var(--danger); border-radius: 0.5rem;">
                                <h5 class="font-semibold mb-2" style="color: var(--danger);">⚠ KRITISCHE ÜBERBUCHUNG</h5>
                                ${overbookedMembers.map(member => {
                                    const util = AppState.getGlobalResourceUtilization(member.id);
                                    return `
                                        <div style="margin-bottom: 1rem;">
                                            <strong>${this.escapeHtml(member.name)}</strong>:
                                            ${util.totalUtilization}% ausgelastet (verfügbar: ${member.availableCapacity}%)
                                            <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                                                Projekte: ${util.byProject.filter(p => p.projectStatus === 'active').map(p =>
                                                    `${p.projectName} (${p.totalCapacity}%)`
                                                ).join(', ')}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                    `;
                }

                // Render competency group utilization
                const competencyOverview = document.getElementById('competency-group-overview');
                if (competencyOverview) {
                    const groupUtilization = AppState.getCompetencyGroupUtilization();

                    if (groupUtilization.length === 0) {
                        competencyOverview.innerHTML = `
                            <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                                Keine Kompetenzgruppen vorhanden. Weisen Sie Teammitgliedern Kompetenzgruppen zu.
                            </p>
                        `;
                    } else {
                        const overloadedGroups = groupUtilization.filter(g => g.isOverloaded);

                        competencyOverview.innerHTML = `
                            ${overloadedGroups.length > 0 ? `
                                <div class="mb-4 p-4" style="background: rgba(234, 88, 12, 0.1); border-left: 4px solid var(--warning); border-radius: 0.5rem;">
                                    <h5 class="font-semibold mb-2" style="color: var(--warning);">
                                        ⚠ ${overloadedGroups.length} Kompetenzgruppe${overloadedGroups.length > 1 ? 'n' : ''} überlastet
                                    </h5>
                                    ${overloadedGroups.map(g => `
                                        <div style="margin-bottom: 0.5rem;">
                                            <strong>${this.escapeHtml(g.name)}</strong>: ${g.utilizationPercent}% Auslastung
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            <table>
                                <thead>
                                    <tr>
                                        <th>Kompetenzgruppe</th>
                                        <th>Mitglieder</th>
                                        <th>Gesamt-Kapazität (FTE)</th>
                                        <th>Gebuchte FTE</th>
                                        <th>Auslastung</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupUtilization.map(group => {
                                        const statusColor = group.isOverloaded ? 'var(--danger)' :
                                            (group.utilizationPercent > 80 ? 'var(--warning)' : 'var(--success)');
                                        const statusText = group.isOverloaded ? '⚠ Überlastet' :
                                            (group.utilizationPercent > 80 ? '⚡ Hoch' : '✓ Normal');

                                        return `
                                            <tr>
                                                <td><strong>${this.escapeHtml(group.name)}</strong></td>
                                                <td>${group.memberCount}</td>
                                                <td class="font-mono">${group.totalCapacity} FTE</td>
                                                <td class="font-mono">${group.bookedFTE} FTE</td>
                                                <td>
                                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                        <div style="flex: 1; background: var(--bg-tertiary); border-radius: 0.25rem; height: 1.5rem; overflow: hidden;">
                                                            <div style="background: ${statusColor}; height: 100%; width: ${Math.min(group.utilizationPercent, 100)}%; transition: width 0.3s;"></div>
                                                        </div>
                                                        <span class="font-mono font-bold" style="color: ${statusColor}; min-width: 3rem;">
                                                            ${group.utilizationPercent}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style="color: ${statusColor};">
                                                    <strong>${statusText}</strong>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        `;
                    }
                }
            },

            // NEW: Render Portfolio Gantt View
            renderPortfolioGantt() {
                const activeProjects = AppState.getActiveProjects();
                const totalAvailableFTE = AppState.getTotalAvailableFTE();
                const fteTimeline = AppState.calculateFTETimeline();

                // Update KPIs
                document.getElementById('portfolio-active-projects').textContent = activeProjects.length;

                const totalAllocatedFTE = activeProjects.reduce((sum, p) => {
                    return sum + AppState.calculateProjectFTE(p.id);
                }, 0);
                document.getElementById('portfolio-total-fte').textContent = Math.round(totalAllocatedFTE * 10) / 10;
                document.getElementById('portfolio-available-fte').textContent = totalAvailableFTE;

                const overloadedPeriods = fteTimeline.filter(p => p.isOverloaded).length;
                document.getElementById('portfolio-overload-periods').textContent = overloadedPeriods;

                // Render Gantt Chart (simplified visualization)
                this.renderPortfolioGanttChart(activeProjects, fteTimeline);

                // Render Project Details Table
                this.renderPortfolioProjectsTable(activeProjects, fteTimeline);
            },

            renderPortfolioGanttChart(projects, timeline) {
                const container = document.getElementById('portfolio-gantt-container');
                if (!container || projects.length === 0) {
                    if (container) {
                        container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">Keine aktiven Projekte vorhanden</p>';
                    }
                    return;
                }

                // OPTIMIZED: Find actual project date range (earliest start to latest end)
                const allStartDates = projects.map(p => new Date(p.startDate));
                const allEndDates = projects.map(p => new Date(p.endDate || p.plannedEndDate));
                const minProjectStart = new Date(Math.min(...allStartDates));
                const maxProjectEnd = new Date(Math.max(...allEndDates));

                // Calculate quarters based on actual project range
                const startQuarter = Math.floor(minProjectStart.getMonth() / 3);
                const startYear = minProjectStart.getFullYear();
                const endQuarter = Math.floor(maxProjectEnd.getMonth() / 3);
                const endYear = maxProjectEnd.getFullYear();

                // Generate quarters array
                const quarters = [];
                let q = startQuarter;
                let y = startYear;
                while (y < endYear || (y === endYear && q <= endQuarter)) {
                    quarters.push({
                        year: y,
                        quarter: q,
                        label: `Q${q + 1} ${y}`,
                        startDate: new Date(y, q * 3, 1),
                        endDate: new Date(y, (q + 1) * 3, 0)
                    });
                    q++;
                    if (q > 3) {
                        q = 0;
                        y++;
                    }
                }

                // Calculate timeline boundaries
                const timelineStart = new Date(startYear, startQuarter * 3, 1);
                const timelineEnd = new Date(endYear, (endQuarter + 1) * 3, 0);
                const totalDays = Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24));

                // Calculate today line position
                const today = new Date();
                const todayDays = (today - timelineStart) / (1000 * 60 * 60 * 24);
                const todayPosition = totalDays > 0 ? (todayDays / totalDays * 100) : -1;
                const showTodayLine = todayPosition >= 0 && todayPosition <= 100;

                // REMOVED min-width to allow full viewport usage without scrolling
                let html = '<div style="width: 100%; font-size: 0.875rem;">';

                // Legend
                html += `
                    <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 0.5rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 40px; height: 16px; background: #1f2937; border: 2px solid #000; border-radius: 0.25rem;"></div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">Aktiv (P1 - höchste Priorität)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 40px; height: 16px; background: #4b5563; border: 2px solid #000; border-radius: 0.25rem;"></div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">Aktiv (P3 - mittlere Priorität)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 40px; height: 16px; background: #9ca3af; border: 2px solid #000; border-radius: 0.25rem;"></div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">Aktiv (P5 - niedrigste Priorität)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 40px; height: 16px; background: #e5e7eb; border: 2px dashed #9ca3af; border-radius: 0.25rem;"></div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">Abgeschlossen / Archiviert</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 16px; height: 16px; background: #dc2626; border-radius: 50%;"></div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">⚠ Ressourcen-Überlastung</span>
                        </div>
                    </div>
                `;

                // Header with quarters
                html += '<div style="display: flex; border-bottom: 2px solid #000; padding-bottom: 0.5rem; margin-bottom: 1rem; background: white;">';
                html += '<div style="width: 220px; font-weight: bold; color: #000; padding-right: 0.5rem;">Projekt</div>';
                html += '<div style="flex: 1; display: flex; min-width: 0;">';

                quarters.forEach((quarter, idx) => {
                    html += `<div style="flex: 1; text-align: center; font-weight: bold; font-size: 0.75rem; color: #000; border-left: ${idx > 0 ? '1px solid #ccc' : 'none'}; padding: 0.25rem 0.125rem; min-width: 0; overflow: hidden;">${quarter.label}</div>`;
                });

                html += '</div></div>';

                // Project bars - sorted by priority
                const sortedProjects = [...projects].sort((a, b) => {
                    const prioA = a.priority || 3;
                    const prioB = b.priority || 3;
                    if (prioA !== prioB) return prioA - prioB;
                    return a.name.localeCompare(b.name);
                });

                sortedProjects.forEach(project => {
                    const projectStart = new Date(project.startDate);
                    const projectEnd = new Date(project.endDate || project.plannedEndDate);

                    // Calculate offset and width as percentages
                    const startDays = Math.max(0, (projectStart - timelineStart) / (1000 * 60 * 60 * 24));
                    const durationDays = Math.max(1, (projectEnd - projectStart) / (1000 * 60 * 60 * 24));
                    const startOffset = totalDays > 0 ? (startDays / totalDays * 100) : 0;
                    const width = totalDays > 0 ? Math.max(0.8, durationDays / totalDays * 100) : 2;

                    const projectFTE = AppState.calculateProjectFTE(project.id);
                    const projectStatus = project.projectStatus || 'active';

                    // Check for resource overload
                    const hasOverload = timeline && timeline.some(period => {
                        const periodStart = new Date(period.startDate);
                        const periodEnd = new Date(period.endDate);
                        return period.isOverloaded &&
                               projectStart <= periodEnd && projectEnd >= periodStart &&
                               period.projects && period.projects.some(p => p.projectId === project.id);
                    });

                    // Determine bar style based on status and priority
                    let barStyle, textColor;
                    if (projectStatus === 'archived' || projectStatus === 'completed') {
                        // Completed/archived: light gray with dashed border
                        barStyle = 'background: #e5e7eb; border: 2px dashed #9ca3af;';
                        textColor = '#6b7280';
                    } else {
                        // Active projects: solid dark bars with varying darkness based on priority
                        const priority = project.priority || 3;
                        const grayLevels = {
                            1: '#1f2937',  // Very dark gray (highest priority)
                            2: '#374151',  // Dark gray
                            3: '#4b5563',  // Medium gray
                            4: '#6b7280',  // Light gray
                            5: '#9ca3af'   // Very light gray (lowest priority)
                        };
                        barStyle = `background: ${grayLevels[priority]}; border: 2px solid #000;`;
                        textColor = 'white';
                    }

                    // Create alternating quarter backgrounds for better readability
                    const quarterBgs = quarters.map((_, i) => i % 2 === 0 ? '#f9fafb' : '#ffffff').join(',');

                    html += `
                        <div style="display: flex; margin-bottom: 0.6rem; align-items: center;">
                            <div style="width: 220px; font-weight: 500; font-size: 0.8rem; color: #000; padding-right: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(project.name)}">
                                ${this.escapeHtml(project.name)}
                                ${hasOverload ? '<span style="color: #dc2626; font-weight: bold;" title="Ressourcen-Überlastung">⚠</span>' : ''}
                            </div>
                            <div style="flex: 1; position: relative; height: 30px; background: #f9fafb; border-radius: 0.25rem; min-width: 0;">
                                ${quarters.map((quarter, idx) => {
                                    const qStartDays = (quarter.startDate - timelineStart) / (1000 * 60 * 60 * 24);
                                    const qPos = (qStartDays / totalDays * 100);
                                    return idx > 0 ? `<div style="position: absolute; left: ${qPos.toFixed(2)}%; top: 0; bottom: 0; width: 1px; background: #d1d5db;"></div>` : '';
                                }).join('')}
                                ${showTodayLine ? `<div style="position: absolute; left: ${todayPosition.toFixed(2)}%; top: 0; bottom: 0; width: 2px; background: #dc2626; z-index: 5;" title="Heute"></div>` : ''}
                                <div style="position: absolute; left: ${startOffset.toFixed(2)}%; width: ${width.toFixed(2)}%; height: 100%; ${barStyle} border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; color: ${textColor}; font-size: 0.65rem; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.25);" title="${this.escapeHtml(project.name)}: ${this.formatDate(project.startDate)} - ${this.formatDate(project.endDate || project.plannedEndDate)} | ${projectFTE} FTE | P${project.priority || 3} | ${projectStatus}">
                                    ${width > 6 ? `${projectFTE} FTE` : ''}
                                    ${hasOverload ? '<span style="position: absolute; left: -8px; top: -8px; width: 16px; height: 16px; background: #dc2626; border-radius: 50%; border: 2px solid white;"></span>' : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
                container.innerHTML = html;
            },

            renderFTETimeline(timeline, totalAvailableFTE) {
                const container = document.getElementById('portfolio-fte-timeline');
                if (!container || timeline.length === 0) {
                    if (container) {
                        container.innerHTML = '<p style="color: var(--text-secondary);">Keine Zeitdaten verfügbar</p>';
                    }
                    return;
                }

                // Find current week index for "Heute"-Linie
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                let currentWeekIndex = -1;
                timeline.forEach((period, index) => {
                    if (todayStr >= period.startDate && todayStr <= period.endDate) {
                        currentWeekIndex = index;
                    }
                });

                // Simple bar chart visualization
                let html = '<div style="overflow-x: auto;"><div style="position: relative; display: flex; gap: 0.5rem; min-width: 600px;">';

                timeline.forEach((period, index) => {
                    const heightPercent = Math.min(100, (period.totalFTE / totalAvailableFTE) * 100);
                    const barColor = period.isOverloaded ? 'var(--danger)' : heightPercent > 80 ? 'var(--warning)' : 'var(--success)';
                    const isCurrentWeek = index === currentWeekIndex;

                    html += `
                        <div style="flex: 1; min-width: 60px; position: relative;">
                            <div style="height: 200px; display: flex; flex-direction: column; justify-content: flex-end; border: 1px solid var(--border-color); border-radius: 0.25rem; padding: 0.25rem; background: ${isCurrentWeek ? 'rgba(255, 200, 0, 0.05)' : 'var(--bg-tertiary)'};">
                                <div style="background: ${barColor}; height: ${heightPercent}%; border-radius: 0.25rem; position: relative;" title="${period.startDate}: ${period.totalFTE} FTE${period.isOverloaded ? ' (ÜBERLAST!)' : ''}">
                                    <div style="position: absolute; top: -20px; left: 0; right: 0; text-align: center; font-size: 0.75rem; font-weight: bold; color: ${barColor};">
                                        ${period.totalFTE}
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top: 0.5rem; text-align: center; font-size: 0.625rem; color: var(--text-secondary); ${isCurrentWeek ? 'font-weight: bold;' : ''}">
                                KW ${Math.ceil((new Date(period.startDate) - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}${isCurrentWeek ? ' ?' : ''}
                            </div>
                        </div>
                    `;
                });

                // Add capacity line reference
                html += '</div>';
                html += `<div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 0.5rem;">`;
                html += `<strong>Legende:</strong> `;
                html += `<span style="display: inline-block; width: 12px; height: 12px; background: var(--success); border-radius: 2px; margin: 0 0.25rem;"></span> Normal `;
                html += `<span style="display: inline-block; width: 12px; height: 12px; background: var(--warning); border-radius: 2px; margin: 0 0.25rem;"></span> Hoch (&gt;80%) `;
                html += `<span style="display: inline-block; width: 12px; height: 12px; background: var(--danger); border-radius: 2px; margin: 0 0.25rem;"></span> Überlast (&gt;${totalAvailableFTE} FTE)`;
                html += `</div></div>`;

                container.innerHTML = html;
            },

            renderPortfolioProjectsTable(projects, timeline) {
                const tbody = document.querySelector('#portfolio-projects-table tbody');
                if (!tbody) return;

                if (projects.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">Keine aktiven Projekte vorhanden</td></tr>';
                    return;
                }

                tbody.innerHTML = projects.map(project => {
                    const projectFTE = AppState.calculateProjectFTE(project.id);
                    const statusLight = AppState.calculateProjectStatus(project.id);
                    const startDate = new Date(project.startDate);
                    // FIXED: Handle both endDate and plannedEndDate
                    const endDate = new Date(project.endDate || project.plannedEndDate);
                    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

                    // Check for overload warnings
                    const overloadPeriods = timeline.filter(period => {
                        const periodStart = new Date(period.startDate);
                        const periodEnd = new Date(period.endDate);
                        return period.isOverloaded &&
                               startDate <= periodEnd && endDate >= periodStart &&
                               period.projects.some(p => p.projectId === project.id);
                    });

                    const warnings = [];
                    if (overloadPeriods.length > 0) {
                        warnings.push(`⚠️ Überlast in ${overloadPeriods.length} Zeitraum(en)`);
                    }

                    return `
                        <tr>
                            <td>
                                <strong>${this.escapeHtml(project.name)}</strong>
                                <span class="status-light ${statusLight}" style="margin-left: 0.5rem;"></span>
                            </td>
                            <td>${this.escapeHtml(project.projectLead)}</td>
                            <td class="font-mono">${this.formatDate(project.startDate)}</td>
                            <td class="font-mono">${this.formatDate(project.endDate)}</td>
                            <td class="font-mono">${duration} Tage</td>
                            <td class="font-mono"><strong>${projectFTE}</strong> FTE</td>
                            <td>${this.escapeHtml(project.phase)}</td>
                            <td style="color: ${warnings.length > 0 ? 'var(--danger)' : 'var(--text-secondary)'};">
                                ${warnings.length > 0 ? warnings.join('<br>') : '-'}
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            showProjectDetails(projectId) {
                AppState.currentProjectId = projectId;
                const project = AppState.getProject(projectId);

                if (!project) return;

                // Update URL hash for direct linking
                window.location.hash = `project/${projectId}`;

                // Render project header
                const statusLight = AppState.calculateProjectStatus(projectId);
                document.getElementById('project-header').innerHTML = `
                    <div class="flex" style="justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div class="flex" style="align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                <h2 class="text-2xl font-bold">${this.escapeHtml(project.name)}</h2>
                                <span class="status-light ${statusLight}"></span>
                            </div>
                            <p style="color: var(--text-secondary); margin-bottom: 1rem;">${this.escapeHtml(project.description)}</p>
                            <div class="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span style="color: var(--text-secondary);">Projektleiter:</span><br>
                                    <strong>${this.escapeHtml(project.projectLead)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Sponsor:</span><br>
                                    <strong>${this.escapeHtml(project.sponsor)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Projektnummer:</span><br>
                                    <strong>${this.escapeHtml(project.projectNumber || '-')}</strong>
                                </div>

                                <div>
                                    <span style="color: var(--text-secondary);">Phase:</span><br>
                                    <strong>${this.escapeHtml(project.phase)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Start:</span><br>
                                    <strong>${this.formatDate(project.startDate)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Projektende:</span><br>
                                    <strong>${this.formatDate(project.endDate || project.plannedEndDate)}</strong>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary);">Fortschritt:</span><br>
                                    <strong>${project.progress}%</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Render tabs
                this.renderOverviewTab();
                this.renderCostsTab();
                this.renderMilestonesTab();
                this.renderRisksTab();
                this.renderTasksTab();

                // Show view
                this.showView('project-details');
                this.switchTab('overview');
            },

            renderOverviewTab() {
                const project = AppState.getProject(AppState.currentProjectId);
                const costs = AppState.getProjectCosts(AppState.currentProjectId);
                const costsByCategory = AppState.getProjectCostsByCategory(AppState.currentProjectId);
                const totalBudget = project.budget ? project.budget.total : 0;
                const totalActual = costs.reduce((sum, c) => sum + (c.amount ?? 0), 0);
                const totalForecast = costsByCategory.intern.forecast + costsByCategory.extern.forecast + costsByCategory.investitionen.forecast;

                const milestones = AppState.getProjectMilestones(AppState.currentProjectId);
                const risks = AppState.getProjectRisks(AppState.currentProjectId);
                const tasks = AppState.getProjectTasks(AppState.currentProjectId);

                document.getElementById('project-kpis').innerHTML = `
                    <div class="grid gap-4">
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Gates</span>
                            <div class="text-2xl font-bold font-mono">${milestones.length}</div>
                        </div>
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Aktive Risiken</span>
                            <div class="text-2xl font-bold font-mono">${risks.length}</div>
                        </div>
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Offene Aufgaben</span>
                            <div class="text-2xl font-bold font-mono">${tasks.filter(t => t.status !== 'done').length}</div>
                        </div>
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Projektfortschritt</span>
                            <div class="text-2xl font-bold font-mono">${project.progress}%</div>
                        </div>
                    </div>
                `;

                // Budget chart
                this.renderBudgetChart(totalBudget, totalActual, totalForecast, project.currency);
            },

            renderBudgetChart(budget, actual, forecast, currency) {
                const ctx = document.getElementById('budget-chart');
                if (!ctx) return;

                if (window.budgetChart) {
                    window.budgetChart.destroy();
                }

                window.budgetChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Budget (Soll)', 'Ist', 'Forecast'],
                        datasets: [{
                            label: currency,
                            data: [budget, actual, forecast],
                            backgroundColor: [
                                'rgba(37, 99, 235, 0.8)',
                                'rgba(22, 163, 74, 0.8)',
                                'rgba(234, 88, 12, 0.8)'
                            ],
                            borderColor: [
                                'rgba(37, 99, 235, 1)',
                                'rgba(22, 163, 74, 1)',
                                'rgba(234, 88, 12, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grace: '10%',
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('de-CH');
                                    }
                                }
                            }
                        },
                        layout: {
                            padding: {
                                top: 20
                            }
                        }
                    }
                });
            },

            renderCostsTab() {
                const costs = AppState.getProjectCosts(AppState.currentProjectId);
                const tbody = document.querySelector('#costs-table tbody');
                if (!tbody) return;
                // ------------------------------------------------------------
                // Filter & Suche initialisieren (einmalig binden)
                // ------------------------------------------------------------
                // Filter Controls holen (müssen im statischen HTML stehen!)
                const searchEl = document.getElementById('costs-search');
                const typeEl = document.getElementById('costs-filter-type');
                const statusEl = document.getElementById('costs-filter-status');
                const resetEl = document.getElementById('costs-filter-reset');
                const countEl = document.getElementById('costs-filter-count');

                // Controls mit gespeichertem State befüllen
                if (searchEl) searchEl.value = this.costsFilters.q || '';
                if (typeEl) typeEl.value = this.costsFilters.type || '';
                if (statusEl) statusEl.value = this.costsFilters.status || '';

                // Debounce Timer (lokal über UI-Objekt)
                if (this._costsSearchTimer === undefined) this._costsSearchTimer = null;

                // Handler jedes Mal setzen (robust gegen DOM-Rebuild)
                if (searchEl) {
                  searchEl.oninput = () => {
                    clearTimeout(this._costsSearchTimer);
                    this._costsSearchTimer = setTimeout(() => {
                      this.costsFilters.q = (searchEl.value || '').trim();
                      this.renderCostsTab();
                    }, 150);
                  };
                }

                if (typeEl) {
                  typeEl.onchange = () => {
                    this.costsFilters.type = typeEl.value || '';
                    this.renderCostsTab();
                  };
                }

                if (statusEl) {
                  statusEl.onchange = () => {
                    this.costsFilters.status = statusEl.value || '';
                    this.renderCostsTab();
                  };
                }

                if (resetEl) {
                  resetEl.onclick = () => {
                    this.costsFilters = { q: '', type: '', status: '' };
                    if (searchEl) searchEl.value = '';
                    if (typeEl) typeEl.value = '';
                    if (statusEl) statusEl.value = '';
                    this.renderCostsTab();
                  };
                }


                // ------------------------------------------------------------
                // Filter anwenden
                // ------------------------------------------------------------
                const totalCount = costs.length;

                let filteredCosts = [...costs];

                // Kostenart
                if (this.costsFilters.type) {
                  filteredCosts = filteredCosts.filter(c => c.type === this.costsFilters.type);
                }

                // Status
                if (this.costsFilters.status) {
                  if (this.costsFilters.status === '__none__') {
                    filteredCosts = filteredCosts.filter(c => !c.status);
                  } else {
                    filteredCosts = filteredCosts.filter(c => (c.status || '') === this.costsFilters.status);
                  }
                }

                // Suche (Beschreibung, Datum, Betrag, Statuslabel, Typ)
                const q = (this.costsFilters.q || '').toLowerCase();
                if (q) {
                  filteredCosts = filteredCosts.filter(c => {
                    const amountStr = String(c.amount ?? '').toLowerCase();
                    const dateStr = String(c.date ?? '').toLowerCase();
                    const descStr = String(c.description ?? '').toLowerCase();
                    const typeStr = String(this.getCostTypeLabel(c.type) ?? '').toLowerCase();
                    const statusStr = String(c.status ?? '').toLowerCase();
                    const refStr = String(c.referenceNo ?? '').toLowerCase();

                    return (
                      descStr.includes(q) ||
                      refStr.includes(q) ||
                      dateStr.includes(q) ||
                      amountStr.includes(q) ||
                      typeStr.includes(q) ||
                      statusStr.includes(q)
                    );
                  });
                }

                // Trefferanzeige
                if (countEl) {
                  countEl.textContent = `${filteredCosts.length} / ${totalCount}`;
                }

                const project = AppState.getProject(AppState.currentProjectId);
                const costsByCategory = AppState.getProjectCostsByCategory(AppState.currentProjectId);
                const burnrate = AppState.calculateBurnrate(AppState.currentProjectId);

                // Calculate totals
                const totalBudget = project.budget ? project.budget.total : 0;
                const totalActual = costsByCategory.intern.actual + costsByCategory.extern.actual + costsByCategory.investitionen.actual;
                const totalForecast = costsByCategory.intern.forecast + costsByCategory.extern.forecast + costsByCategory.investitionen.forecast;
                const totalVariance = totalForecast - totalBudget;
                const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

                // Render budget overview
                const budgetContainer = document.getElementById('budget-overview-container');
                if (budgetContainer) {
                    budgetContainer.innerHTML = `
                        <div class="card mb-6">
                            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h3 class="font-semibold">Projektbudget Übersicht</h3>
                                <button class="btn" onclick="UI.showEditBudgetModal()">✏️ Budget bearbeiten</button>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Kostenart</th>
                                        <th>Budget</th>
                                        <th>Ist</th>
                                        <th>Forecast</th>
                                        <th>Abweichung (Forecast zu Budget)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Intern</strong></td>
                                        <td>${this.formatCurrency(project.budget ? project.budget.intern : 0, project.currency)}</td>
                                        <td>${this.formatCurrency(costsByCategory.intern.actual, project.currency)}</td>
                                        <td>${this.formatCurrency(costsByCategory.intern.forecast, project.currency)}</td>
                                        <td>${this.getBudgetVarianceHTML(costsByCategory.intern.forecast, project.budget ? project.budget.intern : 0, project.currency)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Extern</strong></td>
                                        <td>${this.formatCurrency(project.budget ? project.budget.extern : 0, project.currency)}</td>
                                        <td>${this.formatCurrency(costsByCategory.extern.actual, project.currency)}</td>
                                        <td>${this.formatCurrency(costsByCategory.extern.forecast, project.currency)}</td>
                                        <td>${this.getBudgetVarianceHTML(costsByCategory.extern.forecast, project.budget ? project.budget.extern : 0, project.currency)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Investitionen</strong></td>
                                        <td>${this.formatCurrency(project.budget ? project.budget.investitionen : 0, project.currency)}</td>
                                        <td>${this.formatCurrency(costsByCategory.investitionen.actual, project.currency)}</td>
                                        <td>${this.formatCurrency(costsByCategory.investitionen.forecast, project.currency)}</td>
                                        <td>${this.getBudgetVarianceHTML(costsByCategory.investitionen.forecast, project.budget ? project.budget.investitionen : 0, project.currency)}</td>
                                    </tr>
                                    <tr style="border-top: 2px solid var(--border-color); font-weight: bold;">
                                        <td><strong>TOTAL</strong></td>
                                        <td>${this.formatCurrency(totalBudget, project.currency)}</td>
                                        <td>${this.formatCurrency(totalActual, project.currency)}</td>
                                        <td>${this.formatCurrency(totalForecast, project.currency)}</td>
                                        <td>${this.getBudgetVarianceHTML(totalForecast, totalBudget, project.currency)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="grid grid-cols-2 gap-4 mt-4 p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                                <div>
                                    <span class="text-sm" style="color: var(--text-secondary);">Burnrate (intern)</span>
                                    <div class="text-xl font-bold font-mono">⚡ ${this.formatCurrency(burnrate, project.currency)}/Monat</div>
                                </div>
                                <div>
                                    <span class="text-sm" style="color: var(--text-secondary);">Abweichung (Forecast zu Budget)</span>
                                    <div class="text-xl font-bold font-mono">
                                    ${this.getBudgetVarianceHTML(totalForecast, totalBudget, project.currency)}
                                    </div>
                                </div>

                            </div>
                        </div>
                    `;
                }

                if (costs.length === 0) {
                  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">Keine Kosten erfasst</td></tr>';
                  if (countEl) countEl.textContent = `0 / 0`;
                  return;
                }

                if (filteredCosts.length === 0) {
                  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">Keine Kosten gefunden</td></tr>';
                  return;
                }

                tbody.innerHTML = filteredCosts.map(cost => {
                    let statusHtml = '';
                    let hasPartialPayments = false;

                    if (cost.status) {
                        let statusColor = '';
                        let statusLabel = cost.status;

                        if (cost.status === 'teilzahlung_visiert') {
                            statusColor = 'var(--warning)';
                            statusLabel = 'Teilzahlung visiert';
                            hasPartialPayments = cost.partialPayments && cost.partialPayments.length > 0;
                        } else if (cost.status === 'vollzahlung_visiert') {
                            statusColor = 'var(--success)';
                            statusLabel = 'Vollzahlung visiert';
                        } else if (cost.status === 'bestellt') {
                            statusLabel = 'Bestellt';
                        }

                        statusHtml = `<span style="color: ${statusColor}; font-weight: 500;">${this.escapeHtml(statusLabel)}</span>`;
                    } else {
                        statusHtml = '-';
                    }

                    let mainRow = `
                        <tr>
                            <td>${this.formatDate(cost.date)}</td>
                            <td>${this.escapeHtml(cost.description)}</td>
                            <td>${this.escapeHtml(cost.referenceNo || '-')}</td>
                            <td>${this.getCostTypeLabel(cost.type)}</td>
                            <td>${statusHtml}</td>
                            <td class="font-mono font-semibold">${this.formatCurrency(cost.amount ?? 0, project.currency)}</td>
                            <td>
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.showEditCostModal('${cost.id}')">Bearbeiten</button>
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.deleteCost('${cost.id}')">Löschen</button>
                            </td>
                        </tr>
                    `;

                    // Add collapsible partial payments section if applicable
                    if (hasPartialPayments && cost.status === 'teilzahlung_visiert' && (cost.type === 'external_service' || cost.type === 'investment')) {
                        const collapsibleId = `partial-payments-${cost.id}`;
                        mainRow += `
                            <tr>
                                <td colspan="7" style="padding: 0; border-top: none;">
                                    <div style="background: var(--bg-secondary); border-left: 3px solid var(--warning); margin: 0.5rem 0;">
                                        <div style="padding: 0.5rem 1rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between;" onclick="UI.togglePartialPaymentsSection('${collapsibleId}')">
                                            <span style="font-weight: 500; font-size: 0.875rem;">
                                                <span id="${collapsibleId}-arrow" style="display: inline-block; transition: transform 0.2s;">▸</span>
                                                Teilzahlungen
                                            </span>
                                        </div>
                                        <div id="${collapsibleId}" style="display: none; padding: 0 1rem 1rem 1rem;">
                                            ${this.renderPartialPaymentsList(cost, project)}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }

                    return mainRow;
                }).join('');
            },

            renderMilestonesTab() {
                const milestones = AppState.getProjectMilestones(AppState.currentProjectId);
                const container = document.getElementById('milestones-container');

                if (milestones.length === 0) {
                    container.innerHTML = '<div class="card"><p style="color: var(--text-secondary);">Keine Gates definiert</p></div>';
                    return;
                }

                // Sort milestones chronologically by date (ascending)
                const sortedMilestones = milestones.sort((a, b) => {
                    const dateA = new Date(a.date || a.plannedDate);
                    const dateB = new Date(b.date || b.plannedDate);
                    return dateA - dateB;
                });

                container.innerHTML = sortedMilestones.map(m => `
                    <div class="card">
                        <div class="flex" style="justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <h4 class="font-semibold mb-2">${this.escapeHtml(m.name)}</h4>
                                <p class="text-sm mb-2" style="color: var(--text-secondary);">${this.escapeHtml(m.description || '')}</p>
                                <div class="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span style="color: var(--text-secondary);">Status:</span><br>
                                        <strong>${this.escapeHtml(m.status || 'pending')}</strong>
                                    </div>
                                    <div>
                                        <span style="color: var(--text-secondary);">Geplant:</span><br>
                                        <strong>${this.formatDate(m.date || m.plannedDate)}</strong>
                                    </div>
                                    <div>
                                        <span style="color: var(--text-secondary);">Phase:</span><br>
                                        <strong>${this.escapeHtml(m.phase || m.name.split('?')[0]?.trim() || 'N/A')}</strong>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.editMilestone('${m.id}')">Bearbeiten</button>
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.deleteMilestone('${m.id}')">Löschen</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            },

            renderRisksTab() {
                const risks = AppState.getProjectRisks(AppState.currentProjectId);
                const container = document.getElementById('risks-container');

                if (risks.length === 0) {
                    container.innerHTML = '<div class="card"><p style="color: var(--text-secondary);">Keine Risiken erfasst</p></div>';
                    return;
                }

                container.innerHTML = risks.map(r => {
                    // Determine priority color based on impact
                    const impactColor = r.impact === 'critical' || r.impact === 'high' ? 'var(--danger)' : r.impact === 'medium' ? 'var(--warning)' : 'var(--success)';
                    return `
                        <div class="card">
                            <div class="flex" style="justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div class="flex" style="align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                        <h4 class="font-semibold">${this.escapeHtml(r.title || r.description || 'Risiko')}</h4>
                                        <span class="text-sm font-mono" style="color: ${impactColor}; background: ${impactColor}22; padding: 0.125rem 0.5rem; border-radius: 0.25rem;">${(r.impact || 'medium').toUpperCase()}</span>
                                    </div>
                                    <div class="text-sm mb-2">
                                        <p><strong>Beschreibung:</strong> ${this.escapeHtml(r.description || r.mitigation || '')}</p>
                                        ${r.mitigation ? `<p><strong>Mitigation:</strong> ${this.escapeHtml(r.mitigation)}</p>` : ''}
                                    </div>
                                    <div class="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span style="color: var(--text-secondary);">Wahrscheinlichkeit:</span><br>
                                            <strong>${this.escapeHtml(r.probability || 'N/A')}</strong>
                                        </div>
                                        <div>
                                            <span style="color: var(--text-secondary);">Impact:</span><br>
                                            <strong>${this.escapeHtml(r.impact || 'N/A')}</strong>
                                        </div>
                                        <div>
                                            <span style="color: var(--text-secondary);">Status:</span><br>
                                            <strong>${this.escapeHtml(r.status || 'open')}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.editRisk('${r.id}')">Bearbeiten</button>
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.deleteRisk('${r.id}')">Löschen</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            },

            renderTasksTab() {
                const tasks = AppState.getProjectTasks(AppState.currentProjectId);
                const tbody = document.querySelector('#tasks-table tbody');

                if (tasks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Keine Aufgaben vorhanden</td></tr>';
                    return;
                }

                tbody.innerHTML = tasks.map(t => {
                    const statusLabel = this.getTaskStatusLabel(t.status);
                    const priorityColor = t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--warning)' : 'var(--success)';
                    const responsible = t.responsible ? (AppState.members.find(m => m.id === t.responsible)?.name || t.responsible) : 'Nicht zugewiesen';
                    return `
                        <tr>
                            <td>${this.escapeHtml(t.name || t.description)}</td>
                            <td>${this.escapeHtml(responsible)}</td>
                            <td>${this.formatDate(t.dueDate)}</td>
                            <td>${statusLabel}</td>
                            <td><span style="color: ${priorityColor};">●</span> ${t.priority}</td>
                            <td>
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.editTask('${t.id}')">Bearbeiten</button>
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.deleteTask('${t.id}')">Löschen</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            renderGanttTab() {
                const tasks = AppState.getProjectTasks(AppState.currentProjectId);
                const project = AppState.getProject(AppState.currentProjectId);

                if (!project) return;

                // Calculate critical path
                const cpData = AppState.calculateCriticalPath(AppState.currentProjectId);

                // Render critical path info
                this.renderCriticalPathInfo(cpData);

                // Populate responsible filter - NEW: Only show project team members
                const responsibleSelect = document.getElementById('gantt-filter-responsible');
                if (responsibleSelect) {
                    const projectTeamMembers = AppState.getProjectTeamMembers(AppState.currentProjectId);
                    const teamMembers = projectTeamMembers
                        .map(ptm => AppState.members.find(m => m.id === ptm.memberId))
                        .filter(m => m); // Filter out any undefined members

                    responsibleSelect.innerHTML = '<option value="">Alle</option>' +
                        teamMembers.map(m => `<option value="${m.id}">${this.escapeHtml(m.name)}</option>`).join('');
                }

                // Render Gantt chart
                this.renderFrappeGantt(tasks, cpData);

                // Render task details table
                this.renderGanttTasksTable(tasks, cpData);

                // Setup event listeners
                this.setupGanttEventListeners();
            },

            renderCriticalPathInfo(cpData) {
                const container = document.getElementById('critical-path-info');
                if (!container) return;

                const project = AppState.getProject(AppState.currentProjectId);
                const tasks = AppState.getProjectTasks(AppState.currentProjectId);
                const criticalTasks = cpData && cpData.criticalPath ? tasks.filter(t => cpData.criticalPath.includes(t.id)) : [];

                const criticalPathLength = cpData && cpData.criticalPath ? cpData.criticalPath.length : 0;
                const projectDuration = cpData && cpData.projectCompletionTime ? cpData.projectCompletionTime : 0;

                container.innerHTML = `
                    <h4 class="font-semibold mb-3">Kritischer Pfad-Analyse</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Projektdauer (berechnet)</span>
                            <div class="text-2xl font-bold font-mono">${projectDuration} Tage</div>
                        </div>
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Kritische Aufgaben</span>
                            <div class="text-2xl font-bold font-mono" style="color: var(--danger);">${criticalPathLength} / ${tasks.length}</div>
                        </div>
                        <div>
                            <span class="text-sm" style="color: var(--text-secondary);">Verzögerungsrisiko</span>
                            <div class="text-2xl font-bold font-mono" style="color: ${criticalPathLength / tasks.length > 0.5 ? 'var(--danger)' : 'var(--warning)'}">
                                ${criticalPathLength > 0 ? 'HOCH' : 'NIEDRIG'}
                            </div>
                        </div>
                    </div>
                    ${criticalTasks.length > 0 ? `
                        <div class="mt-4 p-3" style="background: var(--bg-tertiary); border-radius: 0.5rem; border-left: 4px solid var(--danger);">
                            <strong>Kritischer Pfad:</strong>
                            <span class="font-mono ml-2">${criticalTasks.map(t => t.name).join(' ? ')}</span>
                        </div>
                    ` : ''}
                `;
            },

            validateTasksForGantt(tasks) {
                const errors = [];
                const validTasks = [];

                tasks.forEach((task, index) => {
                    // Validate required fields
                    if (!task.id) {
                        errors.push(`Task ${index + 1}: Fehlende ID`);
                        return;
                    }
                    if (!task.name && !task.description) {
                        errors.push(`Task ${task.id}: Fehlender Name/Beschreibung`);
                        return;
                    }
                    if (!task.startDate) {
                        errors.push(`Task ${task.name || task.id}: Fehlendes Startdatum`);
                        return;
                    }
                    if (!task.endDate) {
                        errors.push(`Task ${task.name || task.id}: Fehlendes Enddatum`);
                        return;
                    }

                    // Validate dates
                    const start = new Date(task.startDate);
                    const end = new Date(task.endDate);
                    if (isNaN(start.getTime())) {
                        errors.push(`Task ${task.name || task.id}: Ungültiges Startdatum`);
                        return;
                    }
                    if (isNaN(end.getTime())) {
                        errors.push(`Task ${task.name || task.id}: Ungültiges Enddatum`);
                        return;
                    }
                    if (end < start) {
                        errors.push(`Task ${task.name || task.id}: Enddatum liegt vor Startdatum`);
                        return;
                    }

                    // Validate dependencies
                    if (task.dependencies && Array.isArray(task.dependencies)) {
                        const taskIds = tasks.map(t => t.id);
                        const invalidDeps = task.dependencies.filter(dep => !taskIds.includes(dep.task));
                        if (invalidDeps.length > 0) {
                            errors.push(`Task ${task.name || task.id}: Ungültige Abhängigkeiten zu ${invalidDeps.map(d => d.task).join(', ')}`);
                        }
                    }

                    validTasks.push(task);
                });

                return { validTasks, errors };
            },

            renderFrappeGantt(tasks, cpData) {
                const container = document.getElementById('gantt-chart-container');
                if (!container) return;

                // Check if tasks exist
                if (!tasks || tasks.length === 0) {
                    container.innerHTML = `
                        <div style="padding: 3rem; text-align: center;">
                            <h4 class="font-semibold mb-3" style="color: var(--text-secondary);">Keine Aufgaben vorhanden</h4>
                            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Für dieses Projekt sind noch keine Aufgaben oder Gates erfasst.</p>
                            <button class="btn btn-primary" onclick="UI.showAddTaskModal()">+ Erste Aufgabe anlegen</button>
                        </div>
                    `;
                    return;
                }

                // Validate tasks before rendering
                const validation = this.validateTasksForGantt(tasks);

                if (validation.errors.length > 0) {
                    container.innerHTML = `
                        <div style="padding: 2rem; border: 2px solid var(--warning); border-radius: 0.5rem; background: rgba(234, 88, 12, 0.05);">
                            <h4 class="font-semibold mb-3" style="color: var(--warning);">⚠ Probleme mit Task-Daten gefunden</h4>
                            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Das Gantt-Chart kann nicht angezeigt werden. Bitte korrigieren Sie folgende Probleme:</p>
                            <ul style="list-style: disc; margin-left: 1.5rem; color: var(--text-secondary);">
                                ${validation.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                            </ul>
                            <div style="margin-top: 1.5rem;">
                                <button class="btn" onclick="UI.renderTasksTab()">Zur Aufgabenverwaltung</button>
                            </div>
                        </div>
                    `;
                    return;
                }

                if (validation.validTasks.length === 0) {
                    container.innerHTML = `
                        <div style="padding: 3rem; text-align: center;">
                            <p style="color: var(--text-secondary);">Keine gültigen Aufgaben für Gantt-Darstellung vorhanden.</p>
                        </div>
                    `;
                    return;
                }

                // Prepare tasks for Frappe Gantt
                const parseDate = (dateStr) => {
                    const parts = dateStr.split('-');
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                };

                const ganttTasks = validation.validTasks.map(task => {
                    const isCritical = cpData && cpData.criticalPath && cpData.criticalPath.includes(task.id);

                    // Convert dependencies to Frappe Gantt format
                    let dependencies = '';
                    if (task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0) {
                        dependencies = task.dependencies.map(d => d.task).join(', ');
                    }

                    return {
                        id: task.id,
                        name: task.name || task.description || 'Unnamed Task',
                        start: parseDate(task.startDate),
                        end: parseDate(task.endDate),
                        progress: Math.min(100, Math.max(0, task.progress ?? 0)),
                        dependencies: dependencies,
                        custom_class: isCritical ? 'gantt-critical-path' : ''
                    };
                });

                // Add milestones to Gantt (as tasks with same start/end date)
                const milestones = AppState.getProjectMilestones(AppState.currentProjectId);
                milestones.forEach(ms => {
                    const msDate = parseDate(ms.date || ms.plannedDate);
                    ganttTasks.push({
                        id: ms.id,
                        name: '◆ ' + (ms.name || 'Gate'),
                        start: msDate,
                        end: msDate,
                        progress: ms.status === 'completed' ? 100 : 0,
                        dependencies: '',
                        custom_class: 'gantt-milestone',
                        isMilestone: true
                    });
                });

                // Sort ganttTasks by start date
                ganttTasks.sort((a, b) => a.start.getTime() - b.start.getTime());

                // Get selected view mode from dropdown
                const viewModeSelect = document.getElementById('gantt-view-mode');
                const selectedViewMode = viewModeSelect ? viewModeSelect.value : 'Month';

                // Clear container
                container.innerHTML = '';

                // Render based on selected view mode
                try {
                    if (selectedViewMode === 'Quarter') {
                        // Custom quarter view with MONTH columns
                        this.renderCustomQuarterGantt(container, ganttTasks, cpData);
                    } else {
                        // Custom week view with WEEK columns
                        this.renderCustomWeekGantt(container, ganttTasks, cpData);
                    }
                } catch (e) {
                    console.log('Gantt rendering error:', e);
                    console.log('Stack trace:', e.stack);
                    container.innerHTML = `
                        <div style="padding: 2rem; border: 2px solid var(--danger); border-radius: 0.5rem; background: rgba(220, 38, 38, 0.05);">
                            <h4 class="font-semibold mb-3" style="color: var(--danger);">Fehler beim Laden des Gantt-Charts</h4>
                            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Ein technischer Fehler ist aufgetreten. Details:</p>
                            <pre style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.75rem;">${this.escapeHtml(e.toString())}\n\n${e.stack ? this.escapeHtml(e.stack) : ''}</pre>
                            <div style="margin-top: 1.5rem;">
                                <button class="btn" onclick="UI.renderTasksTab()">Zur Aufgabenverwaltung</button>
                                <button class="btn" onclick="UI.renderGanttTab()" style="margin-left: 0.5rem;">Erneut versuchen</button>
                            </div>
                        </div>
                    `;
                }
            },

            // ========================================
            // CUSTOM WEEK GANTT WITH WEEK COLUMNS
            // ========================================

            renderCustomWeekGantt(container, ganttTasks, cpData) {
                const WEEK_WIDTH = 60;
                const ROW_HEIGHT = 40;
                const LEFT_PADDING = 200;
                const HEADER_HEIGHT = 90;

                // Calculate week range from tasks
                const { weeks, yearMonthStructure } = this.calculateWeekRange(ganttTasks);

                if (weeks.length === 0) {
                    container.innerHTML = '<p>Keine Daten für Wochenansicht vorhanden</p>';
                    return;
                }

                // Create SVG container
                const svgWidth = LEFT_PADDING + (weeks.length * WEEK_WIDTH);
                const svgHeight = HEADER_HEIGHT + (ganttTasks.length * ROW_HEIGHT);

                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', svgWidth);
                svg.setAttribute('height', svgHeight);
                svg.style.border = '1px solid #e5e7eb';
                svg.style.background = '#ffffff';

                // Draw 3-level header (Year ? Month ? Week/KW)
                this.drawWeekGanttHeader(svg, weeks, yearMonthStructure, LEFT_PADDING, WEEK_WIDTH);

                // Draw grid
                this.drawWeekGanttGrid(svg, weeks, LEFT_PADDING, WEEK_WIDTH, ROW_HEIGHT, HEADER_HEIGHT, ganttTasks.length);

                // Draw tasks
                this.drawWeekGanttTasks(svg, ganttTasks, weeks, cpData, LEFT_PADDING, WEEK_WIDTH, ROW_HEIGHT, HEADER_HEIGHT);

                // Draw today week highlight
                this.drawTodayWeekHighlight(svg, weeks, LEFT_PADDING, WEEK_WIDTH, HEADER_HEIGHT, svgHeight);

                container.appendChild(svg);
            },

            calculateWeekRange(tasks) {
                if (!tasks || tasks.length === 0) {
                    return { weeks: [], yearMonthStructure: [] };
                }

                // Find earliest and latest dates
                let minDate = new Date(tasks[0].start);
                let maxDate = new Date(tasks[0].end);

                tasks.forEach(task => {
                    const taskStart = new Date(task.start);
                    const taskEnd = new Date(task.end);
                    if (taskStart < minDate) minDate = taskStart;
                    if (taskEnd > maxDate) maxDate = taskEnd;
                });

                // Round to week boundaries (Monday)
                const getMondayOfWeek = (date) => {
                    const d = new Date(date);
                    const day = d.getDay();
                    const diff = (day === 0 ? -6 : 1) - day;
                    d.setDate(d.getDate() + diff);
                    d.setHours(0, 0, 0, 0);
                    return d;
                };

                const getSundayOfWeek = (monday) => {
                    const sunday = new Date(monday);
                    sunday.setDate(sunday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);
                    return sunday;
                };

                const getISOWeek = (date) => {
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                    return weekNo;
                };

                const startWeek = getMondayOfWeek(minDate);
                const endWeek = getMondayOfWeek(maxDate);

                // Generate weeks array
                const weeks = [];
                const current = new Date(startWeek);

                while (current.getTime() <= endWeek.getTime()) {
                    const monday = new Date(current);
                    const sunday = getSundayOfWeek(monday);
                    const weekNum = getISOWeek(monday);
                    const year = monday.getFullYear();
                    const month = monday.getMonth();

                    weeks.push({
                        monday: monday,
                        sunday: sunday,
                        weekNum: weekNum,
                        year: year,
                        month: month
                    });

                    current.setDate(current.getDate() + 7);
                }

                // Build year/month structure for header
                const yearMonthStructure = [];
                weeks.forEach(week => {
                    let year = yearMonthStructure.find(y => y.year === week.year);
                    if (!year) {
                        year = { year: week.year, months: [] };
                        yearMonthStructure.push(year);
                    }

                    let month = year.months.find(m => m.monthIndex === week.month);
                    if (!month) {
                        month = {
                            monthIndex: week.month,
                            weeks: [],
                            label: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][week.month]
                        };
                        year.months.push(month);
                    }

                    month.weeks.push(week);
                });

                return { weeks, yearMonthStructure };
            },

            drawWeekGanttHeader(svg, weeks, yearMonthStructure, leftPadding, weekWidth) {
                // Get current week for highlighting
                const today = new Date();
                const getCurrentWeekMonday = (date) => {
                    const d = new Date(date);
                    const day = d.getDay();
                    const diff = (day === 0 ? -6 : 1) - day;
                    d.setDate(d.getDate() + diff);
                    d.setHours(0, 0, 0, 0);
                    return d;
                };
                const currentWeekMonday = getCurrentWeekMonday(today);

                // Level 1: Years
                let weekIndex = 0;
                yearMonthStructure.forEach(year => {
                    const yearWeekCount = year.months.reduce((sum, m) => sum + m.weeks.length, 0);
                    const xStart = leftPadding + (weekIndex * weekWidth);
                    const width = yearWeekCount * weekWidth;

                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', xStart);
                    rect.setAttribute('y', '0');
                    rect.setAttribute('width', width);
                    rect.setAttribute('height', '30');
                    rect.setAttribute('fill', '#f3f4f6');
                    rect.setAttribute('stroke', '#000');
                    rect.setAttribute('stroke-width', '2');
                    svg.appendChild(rect);

                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', xStart + width / 2);
                    text.setAttribute('y', '20');
                    text.setAttribute('font-size', '14');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('fill', '#000');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = year.year;
                    svg.appendChild(text);

                    weekIndex += yearWeekCount;
                });

                // Level 2: Months
                weekIndex = 0;
                yearMonthStructure.forEach(year => {
                    year.months.forEach(month => {
                        const monthWeekCount = month.weeks.length;
                        const xStart = leftPadding + (weekIndex * weekWidth);
                        const width = monthWeekCount * weekWidth;

                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', xStart);
                        rect.setAttribute('y', '30');
                        rect.setAttribute('width', width);
                        rect.setAttribute('height', '30');
                        rect.setAttribute('fill', '#e5e7eb');
                        rect.setAttribute('stroke', '#000');
                        rect.setAttribute('stroke-width', '1');
                        svg.appendChild(rect);

                        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        text.setAttribute('x', xStart + width / 2);
                        text.setAttribute('y', '50');
                        text.setAttribute('font-size', '12');
                        text.setAttribute('font-weight', '600');
                        text.setAttribute('fill', '#000');
                        text.setAttribute('text-anchor', 'middle');
                        text.textContent = month.label;
                        svg.appendChild(text);

                        weekIndex += monthWeekCount;
                    });
                });

                // Level 3: Weeks (KW)
                weeks.forEach((week, idx) => {
                    const xStart = leftPadding + (idx * weekWidth);

                    // Check if this is the current week
                    const isCurrentWeek = (week.monday.getTime() === currentWeekMonday.getTime());

                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', xStart);
                    rect.setAttribute('y', '60');
                    rect.setAttribute('width', weekWidth);
                    rect.setAttribute('height', '30');
                    rect.setAttribute('fill', isCurrentWeek ? '#fecaca' : '#ffffff');
                    rect.setAttribute('stroke', '#9ca3af');
                    rect.setAttribute('stroke-width', '1');
                    svg.appendChild(rect);

                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', xStart + weekWidth / 2);
                    text.setAttribute('y', '80');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('fill', '#374151');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = `KW ${week.weekNum}`;
                    svg.appendChild(text);
                });

                // Task name header
                const nameRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                nameRect.setAttribute('x', '0');
                nameRect.setAttribute('y', '60');
                nameRect.setAttribute('width', leftPadding);
                nameRect.setAttribute('height', '30');
                nameRect.setAttribute('fill', '#f3f4f6');
                nameRect.setAttribute('stroke', '#000');
                nameRect.setAttribute('stroke-width', '1');
                svg.appendChild(nameRect);

                const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                nameText.setAttribute('x', '10');
                nameText.setAttribute('y', '80');
                nameText.setAttribute('font-size', '12');
                nameText.setAttribute('font-weight', 'bold');
                nameText.setAttribute('fill', '#000');
                nameText.textContent = 'Aufgabe';
                svg.appendChild(nameText);
            },

            drawWeekGanttGrid(svg, weeks, leftPadding, weekWidth, rowHeight, headerHeight, taskCount) {
                // Vertical week lines
                weeks.forEach((week, idx) => {
                    const x = leftPadding + (idx * weekWidth);
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x);
                    line.setAttribute('x2', x);
                    line.setAttribute('y1', headerHeight);
                    line.setAttribute('y2', headerHeight + (taskCount * rowHeight));
                    line.setAttribute('stroke', '#e5e7eb');
                    line.setAttribute('stroke-width', '1');
                    svg.appendChild(line);
                });

                // Horizontal task lines
                for (let i = 0; i <= taskCount; i++) {
                    const y = headerHeight + (i * rowHeight);
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', '0');
                    line.setAttribute('x2', leftPadding + (weeks.length * weekWidth));
                    line.setAttribute('y1', y);
                    line.setAttribute('y2', y);
                    line.setAttribute('stroke', '#d1d5db');
                    line.setAttribute('stroke-width', '1');
                    svg.appendChild(line);
                }
            },

            drawWeekGanttTasks(svg, tasks, weeks, cpData, leftPadding, weekWidth, rowHeight, headerHeight) {
                tasks.forEach((task, taskIndex) => {
                    const taskStart = new Date(task.start);
                    const taskEnd = new Date(task.end);
                    const isCritical = cpData && cpData.criticalPath && cpData.criticalPath.includes(task.id);

                    // Find start and end week indices using range checks
                    let startWeekIndex = weeks.findIndex(week => {
                        return taskStart >= week.monday && taskStart <= week.sunday;
                    });

                    let endWeekIndex = weeks.findIndex(week => {
                        return taskEnd >= week.monday && taskEnd <= week.sunday;
                    });

                    // Clamping: if task extends beyond visible range
                    if (startWeekIndex === -1 && endWeekIndex === -1) {
                        const firstWeekStart = weeks[0].monday;
                        const lastWeekEnd = weeks[weeks.length - 1].sunday;
                        if (taskStart <= firstWeekStart && taskEnd >= lastWeekEnd) {
                            // Task spans entire visible range
                            startWeekIndex = 0;
                            endWeekIndex = weeks.length - 1;
                        } else {
                            // Task completely outside range
                            startWeekIndex = -1;
                            endWeekIndex = -1;
                        }
                    } else {
                        // Clamp to visible range
                        if (startWeekIndex === -1) startWeekIndex = 0;
                        if (endWeekIndex === -1) endWeekIndex = weeks.length - 1;
                    }

                    if (startWeekIndex === -1 || endWeekIndex === -1) {
                        // Skip tasks completely outside visible range
                        return;
                    }

                    // Calculate bar position and width
                    let x = leftPadding + (startWeekIndex * weekWidth);

                    // For milestones, calculate exact position within the week
                    if (task.isMilestone) {
                        const week = weeks[startWeekIndex];
                        const daysDiff = Math.floor((taskStart - week.monday) / (1000 * 60 * 60 * 24));
                        const dayWidth = weekWidth / 7;
                        x = leftPadding + (startWeekIndex * weekWidth) + (daysDiff * dayWidth);
                    }

                    const width = ((endWeekIndex - startWeekIndex + 1) * weekWidth) - 4;
                    const y = headerHeight + (taskIndex * rowHeight) + 8;
                    const height = task.isMilestone ? 20 : 24;

                    // Draw task bar or milestone diamond
                    if (task.isMilestone) {
                        // Draw diamond for milestone
                        const centerX = x + 10;
                        const centerY = y + height / 2;
                        const size = 8;

                        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const points = `${centerX},${centerY - size} ${centerX + size},${centerY} ${centerX},${centerY + size} ${centerX - size},${centerY}`;
                        diamond.setAttribute('points', points);
                        diamond.setAttribute('fill', task.progress === 100 ? '#10b981' : '#f59e0b');
                        diamond.setAttribute('stroke', '#000');
                        diamond.setAttribute('stroke-width', '2');
                        diamond.style.cursor = 'pointer';

                        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                        title.textContent = `${task.name}\n${this.formatDate(taskStart.toISOString().split('T')[0])}`;
                        diamond.appendChild(title);

                        diamond.addEventListener('click', () => {
                            const fullMilestone = AppState.milestones.find(m => m.id === task.id);
                            if (fullMilestone) {
                                UI.showEditMilestoneModal(fullMilestone);
                            }
                        });

                        svg.appendChild(diamond);
                    } else {
                        // Draw regular task bar
                        const barColor = isCritical ? '#dc2626' : '#3b82f6';

                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', x + 2);
                        rect.setAttribute('y', y);
                        rect.setAttribute('width', Math.max(2, width));
                        rect.setAttribute('height', height);
                        rect.setAttribute('fill', barColor);
                        rect.setAttribute('rx', '4');
                        rect.style.cursor = 'pointer';

                        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                        title.textContent = `${task.name}\n${this.formatDate(taskStart.toISOString().split('T')[0])} - ${this.formatDate(taskEnd.toISOString().split('T')[0])}\nFortschritt: ${task.progress}%`;
                        rect.appendChild(title);

                        rect.addEventListener('click', () => {
                            const fullTask = AppState.tasks.find(t => t.id === task.id);
                            if (fullTask) {
                                UI.showEditTaskModal(fullTask);
                            }
                        });

                        svg.appendChild(rect);

                        // Draw progress bar
                        if (task.progress > 0) {
                            const progressWidth = Math.max(2, width * (task.progress / 100));
                            const progressRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            progressRect.setAttribute('x', x + 2);
                            progressRect.setAttribute('y', y);
                            progressRect.setAttribute('width', progressWidth);
                            progressRect.setAttribute('height', height);
                            progressRect.setAttribute('fill', isCritical ? '#991b1b' : '#1e40af');
                            progressRect.setAttribute('rx', '4');
                            progressRect.style.pointerEvents = 'none';
                            svg.appendChild(progressRect);
                        }
                    }

                    // Draw task name on the left
                    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    nameText.setAttribute('x', '10');
                    nameText.setAttribute('y', headerHeight + (taskIndex * rowHeight) + (rowHeight / 2) + 5);
                    nameText.setAttribute('font-size', '12');
                    nameText.setAttribute('fill', '#000');
                    nameText.textContent = task.name.length > 25 ? task.name.substring(0, 25) + '...' : task.name;
                    svg.appendChild(nameText);
                });
            },

            drawTodayWeekHighlight(svg, weeks, leftPadding, weekWidth, headerHeight, svgHeight) {
                const today = new Date();
                const getCurrentWeekMonday = (date) => {
                    const d = new Date(date);
                    const day = d.getDay();
                    const diff = (day === 0 ? -6 : 1) - day;
                    d.setDate(d.getDate() + diff);
                    d.setHours(0, 0, 0, 0);
                    return d;
                };
                const currentWeekMonday = getCurrentWeekMonday(today);

                // Find current week index
                const currentWeekIndex = weeks.findIndex(week =>
                    week.monday.getTime() === currentWeekMonday.getTime()
                );

                if (currentWeekIndex === -1) return;

                // Draw vertical lines at week boundaries (red)
                const x1 = leftPadding + (currentWeekIndex * weekWidth);
                const x2 = leftPadding + ((currentWeekIndex + 1) * weekWidth);

                // Left boundary
                const leftLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                leftLine.setAttribute('x1', x1);
                leftLine.setAttribute('x2', x1);
                leftLine.setAttribute('y1', headerHeight);
                leftLine.setAttribute('y2', svgHeight);
                leftLine.setAttribute('stroke', '#dc2626');
                leftLine.setAttribute('stroke-width', '2');
                leftLine.setAttribute('opacity', '0.6');
                svg.appendChild(leftLine);

                // Right boundary
                const rightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                rightLine.setAttribute('x1', x2);
                rightLine.setAttribute('x2', x2);
                rightLine.setAttribute('y1', headerHeight);
                rightLine.setAttribute('y2', svgHeight);
                rightLine.setAttribute('stroke', '#dc2626');
                rightLine.setAttribute('stroke-width', '2');
                rightLine.setAttribute('opacity', '0.6');
                svg.appendChild(rightLine);
            },

            // ========================================
            // CUSTOM QUARTER GANTT WITH MONTH COLUMNS
            // ========================================

            renderCustomQuarterGantt(container, ganttTasks, cpData) {
                const MONTH_WIDTH = 80;
                const ROW_HEIGHT = 40;
                const LEFT_PADDING = 200;
                const HEADER_HEIGHT = 90;

                // Calculate month range from tasks
                const { months, yearQuarterStructure } = this.calculateMonthRange(ganttTasks);

                if (months.length === 0) {
                    container.innerHTML = '<p>Keine Daten für Quartalsansicht vorhanden</p>';
                    return;
                }

                // Create SVG container
                const svgWidth = LEFT_PADDING + (months.length * MONTH_WIDTH);
                const svgHeight = HEADER_HEIGHT + (ganttTasks.length * ROW_HEIGHT);

                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', svgWidth);
                svg.setAttribute('height', svgHeight);
                svg.style.border = '1px solid #e5e7eb';
                svg.style.background = '#ffffff';

                // Draw 3-level header (Year ? Quarter ? Month)
                this.drawQuarterGanttHeader(svg, months, yearQuarterStructure, LEFT_PADDING, MONTH_WIDTH);

                // Draw grid
                this.drawQuarterGanttGrid(svg, months, LEFT_PADDING, MONTH_WIDTH, ROW_HEIGHT, HEADER_HEIGHT, ganttTasks.length);

                // Draw tasks
                this.drawQuarterGanttTasks(svg, ganttTasks, months, cpData, LEFT_PADDING, MONTH_WIDTH, ROW_HEIGHT, HEADER_HEIGHT);

                // Draw today quarter highlight
                this.drawTodayQuarterHighlight(svg, months, LEFT_PADDING, MONTH_WIDTH, HEADER_HEIGHT, svgHeight);

                container.appendChild(svg);
            },

            calculateMonthRange(tasks) {
                if (!tasks || tasks.length === 0) {
                    return { months: [], yearQuarterStructure: [] };
                }

                // Find earliest and latest dates
                let minDate = new Date(tasks[0].start);
                let maxDate = new Date(tasks[0].end);

                tasks.forEach(task => {
                    const taskStart = new Date(task.start);
                    const taskEnd = new Date(task.end);
                    if (taskStart < minDate) minDate = taskStart;
                    if (taskEnd > maxDate) maxDate = taskEnd;
                });

                // Round to month boundaries
                const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
                const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

                // Generate months array
                const months = [];
                const current = new Date(startMonth);

                while (current.getTime() <= endMonth.getTime()) {
                    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
                    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
                    const quarter = Math.floor(current.getMonth() / 3);

                    months.push({
                        year: current.getFullYear(),
                        monthIndex: current.getMonth(),
                        quarter: quarter,
                        monthStart: monthStart,
                        monthEnd: monthEnd,
                        label: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][current.getMonth()]
                    });

                    current.setMonth(current.getMonth() + 1);
                }

                // Build year/quarter structure for header
                const yearQuarterStructure = [];
                months.forEach(month => {
                    let year = yearQuarterStructure.find(y => y.year === month.year);
                    if (!year) {
                        year = { year: month.year, quarters: [] };
                        yearQuarterStructure.push(year);
                    }

                    let quarter = year.quarters.find(q => q.quarter === month.quarter);
                    if (!quarter) {
                        quarter = { quarter: month.quarter, months: [], label: `Q${month.quarter + 1}` };
                        year.quarters.push(quarter);
                    }

                    quarter.months.push(month);
                });

                return { months, yearQuarterStructure };
            },

            drawQuarterGanttHeader(svg, months, yearQuarterStructure, leftPadding, monthWidth) {
                const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

                // Get current month for highlighting (not quarter!)
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonthIndex = today.getMonth(); // 0-11

                // Level 1: Years
                let monthIndex = 0;
                yearQuarterStructure.forEach(year => {
                    const yearMonthCount = year.quarters.reduce((sum, q) => sum + q.months.length, 0);
                    const xStart = leftPadding + (monthIndex * monthWidth);
                    const width = yearMonthCount * monthWidth;

                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', xStart);
                    rect.setAttribute('y', '0');
                    rect.setAttribute('width', width);
                    rect.setAttribute('height', '30');
                    rect.setAttribute('fill', '#f3f4f6');
                    rect.setAttribute('stroke', '#000');
                    rect.setAttribute('stroke-width', '2');
                    svg.appendChild(rect);

                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', xStart + width / 2);
                    text.setAttribute('y', '20');
                    text.setAttribute('font-size', '14');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('fill', '#000');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = year.year;
                    svg.appendChild(text);

                    monthIndex += yearMonthCount;
                });

                // Level 2: Quarters (no highlighting)
                monthIndex = 0;
                yearQuarterStructure.forEach(year => {
                    year.quarters.forEach(quarter => {
                        const quarterMonthCount = quarter.months.length;
                        const xStart = leftPadding + (monthIndex * monthWidth);
                        const width = quarterMonthCount * monthWidth;

                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', xStart);
                        rect.setAttribute('y', '30');
                        rect.setAttribute('width', width);
                        rect.setAttribute('height', '30');
                        rect.setAttribute('fill', '#e5e7eb');
                        rect.setAttribute('stroke', '#000');
                        rect.setAttribute('stroke-width', '1');
                        svg.appendChild(rect);

                        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        text.setAttribute('x', xStart + width / 2);
                        text.setAttribute('y', '50');
                        text.setAttribute('font-size', '12');
                        text.setAttribute('font-weight', '600');
                        text.setAttribute('fill', '#000');
                        text.setAttribute('text-anchor', 'middle');
                        text.textContent = quarter.label;
                        svg.appendChild(text);

                        monthIndex += quarterMonthCount;
                    });
                });

                // Level 3: Months - only highlight current month
                months.forEach((month, idx) => {
                    const xStart = leftPadding + (idx * monthWidth);

                    // Check if this is the current month
                    const isCurrentMonth = (month.year === currentYear && month.monthIndex === currentMonthIndex);

                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', xStart);
                    rect.setAttribute('y', '60');
                    rect.setAttribute('width', monthWidth);
                    rect.setAttribute('height', '30');
                    rect.setAttribute('fill', isCurrentMonth ? '#fecaca' : '#ffffff');
                    rect.setAttribute('stroke', '#9ca3af');
                    rect.setAttribute('stroke-width', '1');
                    svg.appendChild(rect);

                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', xStart + monthWidth / 2);
                    text.setAttribute('y', '80');
                    text.setAttribute('font-size', '11');
                    text.setAttribute('fill', '#374151');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = monthNames[month.monthIndex];
                    svg.appendChild(text);
                });

                // Task name header
                const nameRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                nameRect.setAttribute('x', '0');
                nameRect.setAttribute('y', '60');
                nameRect.setAttribute('width', leftPadding);
                nameRect.setAttribute('height', '30');
                nameRect.setAttribute('fill', '#f3f4f6');
                nameRect.setAttribute('stroke', '#000');
                nameRect.setAttribute('stroke-width', '1');
                svg.appendChild(nameRect);

                const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                nameText.setAttribute('x', '10');
                nameText.setAttribute('y', '80');
                nameText.setAttribute('font-size', '12');
                nameText.setAttribute('font-weight', 'bold');
                nameText.setAttribute('fill', '#000');
                nameText.textContent = 'Aufgabe';
                svg.appendChild(nameText);
            },

            drawQuarterGanttGrid(svg, months, leftPadding, monthWidth, rowHeight, headerHeight, taskCount) {
                // Vertical month lines
                months.forEach((month, idx) => {
                    const x = leftPadding + (idx * monthWidth);
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x);
                    line.setAttribute('x2', x);
                    line.setAttribute('y1', headerHeight);
                    line.setAttribute('y2', headerHeight + (taskCount * rowHeight));
                    line.setAttribute('stroke', '#e5e7eb');
                    line.setAttribute('stroke-width', '1');
                    svg.appendChild(line);
                });

                // Horizontal task lines
                for (let i = 0; i <= taskCount; i++) {
                    const y = headerHeight + (i * rowHeight);
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', '0');
                    line.setAttribute('x2', leftPadding + (months.length * monthWidth));
                    line.setAttribute('y1', y);
                    line.setAttribute('y2', y);
                    line.setAttribute('stroke', '#d1d5db');
                    line.setAttribute('stroke-width', '1');
                    svg.appendChild(line);
                }
            },

            drawQuarterGanttTasks(svg, tasks, months, cpData, leftPadding, monthWidth, rowHeight, headerHeight) {
                tasks.forEach((task, taskIndex) => {
                    const taskStart = new Date(task.start);
                    const taskEnd = new Date(task.end);
                    const isCritical = cpData && cpData.criticalPath && cpData.criticalPath.includes(task.id);

                    // Find start and end month indices using range checks
                    let startMonthIndex = months.findIndex(month => {
                        return taskStart >= month.monthStart && taskStart <= month.monthEnd;
                    });

                    let endMonthIndex = months.findIndex(month => {
                        return taskEnd >= month.monthStart && taskEnd <= month.monthEnd;
                    });

                    // Clamping: if task extends beyond visible range
                    if (startMonthIndex === -1 && endMonthIndex === -1) {
                        const firstMonthStart = months[0].monthStart;
                        const lastMonthEnd = months[months.length - 1].monthEnd;
                        if (taskStart <= firstMonthStart && taskEnd >= lastMonthEnd) {
                            // Task spans entire visible range
                            startMonthIndex = 0;
                            endMonthIndex = months.length - 1;
                        } else {
                            // Task completely outside range
                            startMonthIndex = -1;
                            endMonthIndex = -1;
                        }
                    } else {
                        // Clamp to visible range
                        if (startMonthIndex === -1) startMonthIndex = 0;
                        if (endMonthIndex === -1) endMonthIndex = months.length - 1;
                    }

                    if (startMonthIndex === -1 || endMonthIndex === -1) {
                        // Skip tasks completely outside visible range
                        return;
                    }

                    // Calculate bar position and width
                    let x = leftPadding + (startMonthIndex * monthWidth);

                    // For milestones, calculate exact position within the month
                    if (task.isMilestone) {
                        const month = months[startMonthIndex];
                        const daysDiff = Math.floor((taskStart - month.monthStart) / (1000 * 60 * 60 * 24));
                        const daysInMonth = Math.floor((month.monthEnd - month.monthStart) / (1000 * 60 * 60 * 24)) + 1;
                        const dayWidth = monthWidth / daysInMonth;
                        x = leftPadding + (startMonthIndex * monthWidth) + (daysDiff * dayWidth);
                    }

                    const width = ((endMonthIndex - startMonthIndex + 1) * monthWidth) - 4;
                    const y = headerHeight + (taskIndex * rowHeight) + 8;
                    const height = task.isMilestone ? 20 : 24;

                    // Draw task bar or milestone diamond
                    if (task.isMilestone) {
                        // Draw diamond for milestone
                        const centerX = x + 10;
                        const centerY = y + height / 2;
                        const size = 8;

                        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const points = `${centerX},${centerY - size} ${centerX + size},${centerY} ${centerX},${centerY + size} ${centerX - size},${centerY}`;
                        diamond.setAttribute('points', points);
                        diamond.setAttribute('fill', task.progress === 100 ? '#10b981' : '#f59e0b');
                        diamond.setAttribute('stroke', '#000');
                        diamond.setAttribute('stroke-width', '2');
                        diamond.style.cursor = 'pointer';

                        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                        title.textContent = `${task.name}\n${this.formatDate(taskStart.toISOString().split('T')[0])}`;
                        diamond.appendChild(title);

                        diamond.addEventListener('click', () => {
                            const fullMilestone = AppState.milestones.find(m => m.id === task.id);
                            if (fullMilestone) {
                                UI.showEditMilestoneModal(fullMilestone);
                            }
                        });

                        svg.appendChild(diamond);
                    } else {
                        // Draw regular task bar
                        const barColor = isCritical ? '#dc2626' : '#3b82f6';

                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', x + 2);
                        rect.setAttribute('y', y);
                        rect.setAttribute('width', Math.max(2, width));
                        rect.setAttribute('height', height);
                        rect.setAttribute('fill', barColor);
                        rect.setAttribute('rx', '4');
                        rect.style.cursor = 'pointer';

                        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                        title.textContent = `${task.name}\n${this.formatDate(taskStart.toISOString().split('T')[0])} - ${this.formatDate(taskEnd.toISOString().split('T')[0])}\nFortschritt: ${task.progress}%`;
                        rect.appendChild(title);

                        rect.addEventListener('click', () => {
                            const fullTask = AppState.tasks.find(t => t.id === task.id);
                            if (fullTask) {
                                UI.showEditTaskModal(fullTask);
                            }
                        });

                        svg.appendChild(rect);

                        // Draw progress bar
                        if (task.progress > 0) {
                            const progressWidth = Math.max(2, width * (task.progress / 100));
                            const progressRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            progressRect.setAttribute('x', x + 2);
                            progressRect.setAttribute('y', y);
                            progressRect.setAttribute('width', progressWidth);
                            progressRect.setAttribute('height', height);
                            progressRect.setAttribute('fill', isCritical ? '#991b1b' : '#1e40af');
                            progressRect.setAttribute('rx', '4');
                            progressRect.style.pointerEvents = 'none';
                            svg.appendChild(progressRect);
                        }
                    }

                    // Draw task name on the left
                    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    nameText.setAttribute('x', '10');
                    nameText.setAttribute('y', headerHeight + (taskIndex * rowHeight) + (rowHeight / 2) + 5);
                    nameText.setAttribute('font-size', '12');
                    nameText.setAttribute('fill', '#000');
                    nameText.textContent = task.name.length > 25 ? task.name.substring(0, 25) + '...' : task.name;
                    svg.appendChild(nameText);
                });
            },

            drawTodayQuarterHighlight(svg, months, leftPadding, monthWidth, headerHeight, svgHeight) {
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonthIndex = today.getMonth(); // 0-11

                // Find current month in the months array
                const currentMonthIdx = months.findIndex(month =>
                    month.year === currentYear && month.monthIndex === currentMonthIndex
                );

                if (currentMonthIdx === -1) return;

                // Draw vertical lines at current month boundaries (red)
                const x1 = leftPadding + (currentMonthIdx * monthWidth);
                const x2 = leftPadding + ((currentMonthIdx + 1) * monthWidth);

                // Left boundary
                const leftLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                leftLine.setAttribute('x1', x1);
                leftLine.setAttribute('x2', x1);
                leftLine.setAttribute('y1', headerHeight);
                leftLine.setAttribute('y2', svgHeight);
                leftLine.setAttribute('stroke', '#dc2626');
                leftLine.setAttribute('stroke-width', '2');
                leftLine.setAttribute('opacity', '0.6');
                svg.appendChild(leftLine);

                // Right boundary
                const rightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                rightLine.setAttribute('x1', x2);
                rightLine.setAttribute('x2', x2);
                rightLine.setAttribute('y1', headerHeight);
                rightLine.setAttribute('y2', svgHeight);
                rightLine.setAttribute('stroke', '#dc2626');
                rightLine.setAttribute('stroke-width', '2');
                rightLine.setAttribute('opacity', '0.6');
                svg.appendChild(rightLine);
            },

            renderGanttTasksTable(tasks, cpData) {
                const tbody = document.querySelector('#gantt-tasks-table tbody');
                if (!tbody) return;

                if (tasks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-secondary);">Keine Aufgaben vorhanden</td></tr>';
                    return;
                }

                tbody.innerHTML = tasks.map(task => {
                    const taskData = (cpData && cpData.taskData && cpData.taskData[task.id]) || {};
                    const isCritical = cpData && cpData.criticalPath && cpData.criticalPath.includes(task.id);
                    const slack = taskData.slack ?? 0;

                    // NEW: Get member name instead of ID
                    let responsibleDisplay = '-';
                    if (task.responsible) {
                        const member = AppState.members.find(m => m.id === task.responsible);
                        responsibleDisplay = member ? member.name : task.responsible;
                    }

                    return `
                        <tr style="${isCritical ? 'background: rgba(220, 38, 38, 0.05); border-left: 3px solid var(--danger);' : ''}">
                            <td>
                                <strong>${this.escapeHtml(task.name || task.description)}</strong>
                                ${isCritical ? '<span style="color: var(--danger); margin-left: 0.5rem; font-size: 0.75rem;">⚠ KRITISCH</span>' : ''}
                            </td>
                            <td>${this.escapeHtml(responsibleDisplay)}</td>
                            <td class="font-mono">${this.formatDate(task.startDate)}</td>
                            <td class="font-mono">${this.formatDate(task.endDate)}</td>
                            <td class="font-mono">${taskData.duration || '-'} Tage</td>
                            <td class="font-mono" style="color: ${slack === 0 ? 'var(--danger)' : slack < 3 ? 'var(--warning)' : 'var(--success)'};">
                                ${slack} Tage
                            </td>
                            <td>${this.getStatusBadge(task.status)}</td>
                            <td>${this.getPriorityBadge(task.priority)}</td>
                            <td>
                                <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.editTask('${task.id}')">Bearbeiten</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            // ========================================
            // NEU: Gantt Helper-Funktionen (komplett neu aufgesetzt)
            // ========================================

            // NEU: ISO-Kalenderwochen-Berechnung
            getISOWeek(date) {
                const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                const dayNum = d.getUTCDay() || 7;
                d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                return weekNo;
            },

            // NEU: Monatsheader über der Wochenzeile
            addMonthHeaders(ganttInstance, svg) {
                if (!svg || !ganttInstance || !ganttInstance.gantt_start || !ganttInstance.gantt_end) return;

                const ganttStart = new Date(ganttInstance.gantt_start);
                const ganttEnd = new Date(ganttInstance.gantt_end);
                const padding = ganttInstance.options.padding || 18;
                const columnWidth = ganttInstance.options.column_width || 30;

                // Monatsnamen (kurz, deutsch)
                const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                                   'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

                // Alle Monate im Zeitraum durchgehen
                let currentDate = new Date(ganttStart.getFullYear(), ganttStart.getMonth(), 1);
                const endDate = new Date(ganttEnd.getFullYear(), ganttEnd.getMonth(), 1);

                while (currentDate <= endDate) {
                    const monthStart = new Date(currentDate);
                    const monthIndex = monthStart.getMonth();

                    // Letzter Tag des Monats
                    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

                    // Prüfe, ob Monat im sichtbaren Bereich liegt
                    const visibleStart = monthStart < ganttStart ? ganttStart : monthStart;
                    const visibleEnd = monthEnd > ganttEnd ? ganttEnd : monthEnd;

                    // Berechne Tage vom Gantt-Start
                    const startDays = (visibleStart - ganttStart) / (1000 * 60 * 60 * 24);
                    const endDays = (visibleEnd - ganttStart) / (1000 * 60 * 60 * 24);

                    // X-Position: Mitte des Monatsbereichs
                    const xCenter = padding + ((startDays + endDays) / 2) * columnWidth;

                    if (!isNaN(xCenter)) {
                        // Monatslabel erzeugen
                        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        text.setAttribute('x', xCenter);
                        text.setAttribute('y', '25'); // Obere Zeile
                        text.setAttribute('font-size', '12');
                        text.setAttribute('font-weight', '600');
                        text.setAttribute('fill', '#374151');
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('class', 'custom-month-header');
                        text.textContent = monthNames[monthIndex];
                        svg.appendChild(text);
                    }

                    // Nächster Monat
                    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                }
            },

            // NEU: Wochenraster und KW-Labels
            addWeekGridAndHeaders(ganttInstance, svg) {
                if (!svg || !ganttInstance || !ganttInstance.gantt_start || !ganttInstance.gantt_end) return;

                const ganttStart = new Date(ganttInstance.gantt_start);
                ganttStart.setHours(0, 0, 0, 0);
                const ganttEnd = new Date(ganttInstance.gantt_end);
                ganttEnd.setHours(0, 0, 0, 0);

                const padding = ganttInstance.options.padding || 18;
                const columnWidth = ganttInstance.options.column_width || 30;

                // Alle Wochenanfänge (Montag) im Zeitraum bestimmen
                let current = new Date(ganttStart);

                // Zum Montag der Woche springen
                const dayOfWeek = current.getDay();
                const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
                current.setDate(current.getDate() + diff);

                while (current <= ganttEnd) {
                    const weekStart = new Date(current);
                    const weekEnd = new Date(current);
                    weekEnd.setDate(weekEnd.getDate() + 6); // Sonntag

                    // KW-Nummer berechnen
                    const weekNum = this.getISOWeek(weekStart);

                    // Nur anzeigen, wenn Woche im sichtbaren Bereich liegt
                    if (weekEnd >= ganttStart && weekStart <= ganttEnd) {
                        // Sichtbarer Bereich der Woche
                        const visibleStart = weekStart < ganttStart ? ganttStart : weekStart;
                        const visibleEnd = weekEnd > ganttEnd ? ganttEnd : weekEnd;

                        // Tage vom Gantt-Start
                        const weekStartDays = (visibleStart - ganttStart) / (1000 * 60 * 60 * 24);
                        const weekEndDays = (visibleEnd - ganttStart) / (1000 * 60 * 60 * 24);

                        // X-Position: Mitte der Woche
                        const xCenter = padding + ((weekStartDays + weekEndDays) / 2) * columnWidth;

                        if (!isNaN(xCenter)) {
                            // KW-Label
                            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            text.setAttribute('x', xCenter);
                            text.setAttribute('y', '45'); // Unter Monatszeile
                            text.setAttribute('font-size', '10');
                            text.setAttribute('font-weight', '400');
                            text.setAttribute('fill', '#6b7280');
                            text.setAttribute('text-anchor', 'middle');
                            text.setAttribute('class', 'custom-week-header');
                            text.textContent = `KW ${weekNum}`;
                            svg.appendChild(text);

                            // Optional: Vertikale Linie am Wochenanfang (Grid)
                            const xWeekStart = padding + weekStartDays * columnWidth;
                            if (!isNaN(xWeekStart) && xWeekStart >= padding) {
                                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                line.setAttribute('x1', xWeekStart);
                                line.setAttribute('x2', xWeekStart);
                                line.setAttribute('y1', '0');
                                line.setAttribute('y2', svg.getAttribute('height') || '600');
                                line.setAttribute('stroke', '#e5e7eb');
                                line.setAttribute('stroke-width', '1');
                                line.setAttribute('class', 'custom-week-header');
                                line.setAttribute('style', 'pointer-events: none;');
                                svg.appendChild(line);
                            }
                        }
                    }

                    // Nächste Woche
                    current = new Date(current.getTime() + (7 * 24 * 60 * 60 * 1000));
                }
            },

            // NEU: Rote Heute-Linie (aktuelle Woche)
            addTodayLine(ganttInstance, svg) {
                if (!svg || !ganttInstance || !ganttInstance.gantt_start || !ganttInstance.gantt_end) return;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const ganttStart = new Date(ganttInstance.gantt_start);
                ganttStart.setHours(0, 0, 0, 0);
                const ganttEnd = new Date(ganttInstance.gantt_end);
                ganttEnd.setHours(0, 0, 0, 0);

                // Nur zeichnen, wenn heute im Zeitraum liegt
                if (today < ganttStart || today > ganttEnd) {
                    return;
                }

                const padding = ganttInstance.options.padding || 18;
                const columnWidth = ganttInstance.options.column_width || 30;

                // Tage vom Gantt-Start
                const daysFromStart = (today - ganttStart) / (1000 * 60 * 60 * 24);

                // X-Position berechnen
                const x = padding + daysFromStart * columnWidth;

                if (isNaN(x) || x < 0) {
                    return;
                }

                // Rote vertikale Linie erzeugen
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x);
                line.setAttribute('x2', x);
                line.setAttribute('y1', '0');
                line.setAttribute('y2', svg.getAttribute('height') || svg.getBBox()?.height || 600);
                line.setAttribute('stroke', '#dc2626');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('class', 'today-line-custom');
                line.setAttribute('style', 'pointer-events: none;');

                // Tooltip
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = 'Heute';
                line.appendChild(title);

                svg.appendChild(line);
            },

            setupGanttEventListeners() {
                // View mode change
                const viewModeSelect = document.getElementById('gantt-view-mode');
                if (viewModeSelect) {
                    viewModeSelect.addEventListener('change', () => {
                        this.renderGanttTab();
                    });
                }

                // Filter change
                const filterSelect = document.getElementById('gantt-filter');
                if (filterSelect) {
                    filterSelect.addEventListener('change', () => {
                        this.applyGanttFilters();
                    });
                }

                // Responsible filter
                const responsibleSelect = document.getElementById('gantt-filter-responsible');
                if (responsibleSelect) {
                    responsibleSelect.addEventListener('change', () => {
                        this.applyGanttFilters();
                    });
                }

                // Timeline analysis button
                const analyzeBtn = document.getElementById('btn-analyze-timeline');
                if (analyzeBtn) {
                    analyzeBtn.addEventListener('click', () => {
                        this.analyzeTimeline();
                    });
                }

                // Export button
                const exportBtn = document.getElementById('btn-export-timeline');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        this.exportTimeline();
                    });
                }
            },

            applyGanttFilters() {
                const filterValue = document.getElementById('gantt-filter')?.value || 'all';
                const responsibleValue = document.getElementById('gantt-filter-responsible')?.value || '';

                let tasks = AppState.getProjectTasks(AppState.currentProjectId);

                // Apply status filter
                if (filterValue === 'critical') {
                    const cpData = AppState.calculateCriticalPath(AppState.currentProjectId);
                    tasks = tasks.filter(t => cpData.criticalPath.includes(t.id));
                } else if (filterValue === 'delayed') {
                    const today = new Date();
                    tasks = tasks.filter(t => new Date(t.endDate) < today && t.status !== 'done');
                } else if (filterValue === 'in_progress') {
                    tasks = tasks.filter(t => t.status === 'in_progress');
                }

                // Apply responsible filter
                if (responsibleValue) {
                    tasks = tasks.filter(t => t.responsible === responsibleValue);
                }

                // Re-render with filtered tasks
                const cpData = AppState.calculateCriticalPath(AppState.currentProjectId);
                this.renderFrappeGantt(tasks, cpData);
                this.renderGanttTasksTable(tasks, cpData);
            },

            getStatusBadge(status) {
                const statusMap = {
                    'open': { label: 'Offen', color: 'var(--text-secondary)' },
                    'in_progress': { label: 'In Arbeit', color: 'var(--info)' },
                    'done': { label: 'Erledigt', color: 'var(--success)' },
                    'blocked': { label: 'Blockiert', color: 'var(--danger)' }
                };
                const s = statusMap[status] || statusMap['open'];
                return `<span style="color: ${s.color}; font-weight: 500;">${s.label}</span>`;
            },

            getPriorityBadge(priority) {
                const priorityMap = {
                    'low': { label: 'Niedrig', color: 'var(--text-secondary)' },
                    'medium': { label: 'Mittel', color: 'var(--warning)' },
                    'high': { label: 'Hoch', color: 'var(--danger)' }
                };
                const p = priorityMap[priority] || priorityMap['medium'];
                return `<span style="color: ${p.color}; font-weight: 500;">${p.label}</span>`;
            },

            editTask(taskId) {
                const task = AppState.tasks.find(t => t.id === taskId);
                if (!task) return;

                // Show edit modal (reuse add modal logic)
                this.showEditTaskModal(task);
            },

            editMilestone(milestoneId) {
                const milestone = AppState.milestones.find(m => m.id === milestoneId);
                if (!milestone) return;

                this.showEditMilestoneModal(milestone);
            },

            editRisk(riskId) {
                const risk = AppState.risks.find(r => r.id === riskId);
                if (!risk) return;

                this.showEditRiskModal(risk);
            },

            exportTimeline() {
                const project = AppState.getProject(AppState.currentProjectId);
                const tasks = AppState.getProjectTasks(AppState.currentProjectId);
                const cpData = AppState.calculateCriticalPath(AppState.currentProjectId);

                // Export as JSON
                const timelineData = {
                    project: {
                        id: project.id,
                        name: project.name,
                        startDate: project.startDate,
                        endDate: project.endDate || project.plannedEndDate,
                        phase: project.phase
                    },
                    tasks: tasks.map(t => ({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        responsible: t.responsible,
                        startDate: t.startDate,
                        endDate: t.endDate,
                        duration: t.duration,
                        status: t.status,
                        priority: t.priority,
                        dependencies: t.dependencies,
                        progress: t.progress,
                        isCritical: cpData.criticalPath.includes(t.id),
                        slack: cpData.taskData[t.id]?.slack ?? 0
                    })),
                    criticalPath: cpData.criticalPath,
                    projectCompletionTime: cpData.projectCompletionTime
                };

                // Create download
                const dataStr = JSON.stringify(timelineData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `zeitplan-${project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);

                this.showAlert('Zeitplan wurde als JSON exportiert.');
            },

            // NEW: Render Project Team Tab (project-specific)
            renderProjectTeamTab() {
                const projectId = AppState.currentProjectId;
                if (!projectId) return;

                const projectTeamMembers = AppState.getProjectTeamMembers(projectId);
                const tableBody = document.querySelector('#project-team-table tbody');

                if (!tableBody) return;

                if (projectTeamMembers.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                Keine Teammitglieder in diesem Projekt. Klicken Sie "+ Mitglied zum Projektteam hinzufügen", um Ressourcen zuzuweisen.
                            </td>
                        </tr>
                    `;
                } else {
                    tableBody.innerHTML = projectTeamMembers.map(ptm => {
                        const member = AppState.members.find(m => m.id === ptm.memberId);
                        if (!member) return '';

                        // Calculate current booking for this member in this project
                        const projectBookings = AppState.resourceBookings.filter(rb =>
                            rb.projectId === projectId && rb.memberId === member.id
                        );
                        const totalBooked = projectBookings.reduce((sum, b) => sum + (b.capacityPercent ?? 0), 0);

                        return `
                            <tr>
                                <td><strong>${this.escapeHtml(member.name)}</strong></td>
                                <td>${this.escapeHtml(member.role)}</td>
                                <td>
                                    <input
                                        type="text"
                                        value="${this.escapeHtml(ptm.roleInProject ?? '')}"
                                        placeholder="z.B. Teilprojektleiter"
                                        style="padding: 0.25rem 0.5rem; border: 1px solid var(--border-color); border-radius: 0.25rem; width: 100%;"
                                        onchange="UI.updateProjectTeamRole('${ptm.id}', this.value)"
                                    />
                                </td>
                                <td class="font-mono">${member.availableCapacity || 80}%</td>
                                <td class="font-mono" style="color: ${totalBooked > (member.availableCapacity || 80) ? 'var(--danger)' : 'var(--success)'};">
                                    ${totalBooked}%
                                </td>
                                <td>
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--danger); color: white;"
                                            onclick="UI.removeFromProjectTeam('${member.id}')">
                                        Aus Team entfernen
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            },

            // NEW: Show modal to add members from global pool to project team
            showAddProjectTeamMemberModal() {
                const projectId = AppState.currentProjectId;
                if (!projectId) return;

                // Get all global members
                const allMembers = AppState.members.filter(m => m.active !== false);

                // Get members already in project team
                const projectTeamMembers = AppState.getProjectTeamMembers(projectId);
                const teamMemberIds = projectTeamMembers.map(ptm => ptm.memberId);

                // Filter to only show members NOT yet in the project team
                const availableMembers = allMembers.filter(m => !teamMemberIds.includes(m.id));

                if (availableMembers.length === 0) {
                    this.showAlert('Alle verfügbaren Ressourcen sind bereits im Projektteam.');
                    return;
                }

                // NEW: Calculate global utilization for each member
                const membersWithUtilization = availableMembers.map(member => {
                    const utilData = AppState.getGlobalResourceUtilization(member.id);
                    return {
                        ...member,
                        globalUtilization: utilData ? utilData.totalUtilization : 0,
                        remainingCapacity: utilData ? utilData.remainingCapacity : member.availableCapacity,
                        isOverbooked: utilData ? utilData.isOverbooked : false
                    };
                });

                // Sort members: Best available first, then by remaining capacity (descending)
                membersWithUtilization.sort((a, b) => {
                    // Overbooked members last
                    if (a.isOverbooked && !b.isOverbooked) return 1;
                    if (!a.isOverbooked && b.isOverbooked) return -1;

                    // Otherwise sort by remaining capacity (higher = better)
                    return b.remainingCapacity - a.remainingCapacity;
                });

                const content = `
                    <div style="max-height: 500px; overflow-y: auto;">
                        <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                            Wählen Sie ein oder mehrere Teammitglieder aus dem globalen Ressourcenpool aus:
                        </p>
                        <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 0.5rem; border-left: 4px solid var(--primary);">
                            <strong>ℹ️ Hinweis:</strong> Die Auslastung zeigt die aktuelle globale Belegung über alle aktiven Projekte.
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="width: 60px;">Auswahl</th>
                                    <th>Name</th>
                                    <th>Rolle</th>
                                    <th>Max. Kapazität</th>
                                    <th>Aktuelle Auslastung</th>
                                    <th>Verfügbar</th>
                                    <th style="width: 60px;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${membersWithUtilization.map(member => {
                                    const utilizationPercent = member.globalUtilization;
                                    const remainingPercent = member.remainingCapacity;
                                    const availableCapacity = member.availableCapacity || 80;

                                    // Calculate utilization ratio for visual indicator
                                    const utilizationRatio = utilizationPercent / availableCapacity;

                                    // Determine status color and icon
                                    let statusColor, statusIcon, statusText;
                                    if (member.isOverbooked || remainingPercent <= 0) {
                                        statusColor = 'var(--danger)';
                                        statusIcon = '⛔';
                                        statusText = 'Überbucht';
                                    } else if (utilizationRatio >= 0.8) {
                                        statusColor = 'var(--warning)';
                                        statusIcon = '⚠️';
                                        statusText = 'Stark ausgelastet';
                                    } else if (utilizationRatio >= 0.5) {
                                        statusColor = 'var(--warning)';
                                        statusIcon = '◐';
                                        statusText = 'Mässig ausgelastet';
                                    } else {
                                        statusColor = 'var(--success)';
                                        statusIcon = '✅';
                                        statusText = 'Verfügbar';
                                    }

                                    // Determine if selection should be discouraged
                                    const isFullyBooked = remainingPercent <= 0;
                                    const rowStyle = isFullyBooked ? 'opacity: 0.6; background: rgba(220, 38, 38, 0.05);' : '';

                                    return `
                                        <tr style="${rowStyle}">
                                            <td style="text-align: center;">
                                                <input type="checkbox"
                                                       id="add-member-${member.id}"
                                                       value="${member.id}"
                                                       ${isFullyBooked ? 'title="Warnung: Ressource ist voll ausgelastet!"' : ''}
                                                       style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                                            </td>
                                            <td><strong>${this.escapeHtml(member.name)}</strong></td>
                                            <td>${this.escapeHtml(member.role)}</td>
                                            <td class="font-mono">${availableCapacity}%</td>
                                            <td class="font-mono" style="color: ${statusColor};">
                                                <strong>${utilizationPercent}%</strong>
                                            </td>
                                            <td class="font-mono" style="color: ${statusColor};">
                                                <strong>${Math.max(0, remainingPercent)}%</strong>
                                            </td>
                                            <td style="text-align: center; font-size: 1.25rem;" title="${statusText}">
                                                ${statusIcon}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                        ${membersWithUtilization.some(m => m.remainingCapacity <= 0) ? `
                            <div class="mt-3 p-3" style="background: var(--warning-bg, #fff3cd); border-left: 4px solid var(--danger); border-radius: 0.25rem;">
                                <strong>⚠️ Achtung:</strong> Einige Ressourcen sind bereits voll oder überbucht. Sie können diese dennoch zum Team hinzufügen, sollten aber bei der Buchung die verfügbare Kapazität beachten.
                            </div>
                        ` : ''}
                    </div>
                `;

                const modal = this.createModal('Teammitglieder hinzufügen', content, [
                    {
                        label: 'Abbrechen',
                        onClick: () => {
                            this.closeModal();
                        }
                    },
                    {
                        label: 'Hinzufügen',
                        primary: true,
                        onClick: () => {
                            // Get all checked checkboxes
                            const checkedBoxes = availableMembers
                                .map(m => document.getElementById(`add-member-${m.id}`))
                                .filter(checkbox => checkbox && checkbox.checked);

                            if (checkedBoxes.length === 0) {
                                this.showAlert('Bitte wählen Sie mindestens ein Teammitglied aus.');
                                return;
                            }

                            // Add all selected members to project team
                            let addedCount = 0;
                            checkedBoxes.forEach(checkbox => {
                                const memberId = checkbox.value;
                                const success = AppState.addToProjectTeam(projectId, memberId);
                                if (success) addedCount++;
                            });

                            this.closeModal();
                            this.renderProjectTeamTab();
                            this.showAlert(`${addedCount} Teammitglied(er) erfolgreich zum Projekt hinzugefügt.`);
                        }
                    }
                ], { wide: true }); // NEW: Use wide modal for better visibility
            },

            // NEW: Remove member from project team with confirmation
            removeFromProjectTeam(memberId) {
                const projectId = AppState.currentProjectId;
                if (!projectId) return;

                const member = AppState.members.find(m => m.id === memberId);
                if (!member) return;

                // Get bookings for this member in this project
                const projectBookings = AppState.resourceBookings.filter(rb =>
                    rb.projectId === projectId && rb.memberId === memberId
                );

                // Get tasks assigned to this member in this project
                const assignedTasks = AppState.tasks.filter(t =>
                    t.projectId === projectId && t.responsible === memberId
                );

                let warningMessage = '';
                if (projectBookings.length > 0 || assignedTasks.length > 0) {
                    warningMessage = `
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--warning-bg, #fff3cd); border-left: 4px solid var(--warning, #ffc107); border-radius: 0.25rem;">
                            <strong>⚠️ Achtung:</strong>
                            <ul style="margin: 0.5rem 0 0 1.5rem;">
                                ${projectBookings.length > 0 ? `<li>${projectBookings.length} Buchung(en) werden gelöscht</li>` : ''}
                                ${assignedTasks.length > 0 ? `<li>${assignedTasks.length} Aufgabe(n) verlieren ihre Zuweisung</li>` : ''}
                            </ul>
                        </div>
                    `;
                }

                const content = `
                    <p>Möchten Sie <strong>${this.escapeHtml(member.name)}</strong> wirklich aus dem Projektteam entfernen?</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                        Das Teammitglied bleibt im globalen Ressourcenpool erhalten.
                    </p>
                    ${warningMessage}
                `;

                this.createModal('Teammitglied entfernen', content, [
                    {
                        label: 'Abbrechen',
                        onClick: () => {
                            this.closeModal();
                        }
                    },
                    {
                        label: 'Entfernen',
                        primary: true,
                        onClick: () => {
                            const success = AppState.removeFromProjectTeam(projectId, memberId);
                            if (success) {
                                this.closeModal();
                                this.renderProjectTeamTab();
                                this.showAlert(`${member.name} wurde aus dem Projektteam entfernt.`);
                            } else {
                                this.showAlert('Fehler beim Entfernen des Teammitglieds.');
                            }
                        }
                    }
                ]);
            },

            // NEW: Update role in project for a team member
            updateProjectTeamRole(ptmId, newRole) {
                const ptm = AppState.projectTeamMembers.find(p => p.id === ptmId);
                if (!ptm) return;

                ptm.roleInProject = newRole.trim();
                AppState.save();
            },

            renderTeamTab() {
                const members = AppState.members;
                const tableBody = document.querySelector('#team-table tbody');
                const capacityOverview = document.getElementById('team-capacity-overview');

                if (!tableBody) return;

                // Render team members table
                if (members.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                Keine Team-Mitglieder vorhanden. Klicken Sie "+ Mitglied hinzufügen", um ein neues Mitglied anzulegen.
                            </td>
                        </tr>
                    `;
                } else {
                    tableBody.innerHTML = members.map(member => {
                        const isActive = member.active !== false;
                        const statusColor = isActive ? 'var(--success)' : 'var(--text-secondary)';
                        const statusText = isActive ? 'Aktiv' : 'Inaktiv';

                        return `
                            <tr style="${!isActive ? 'opacity: 0.6;' : ''}">
                                <td><strong>${this.escapeHtml(member.name)}</strong></td>
                                <td>${this.escapeHtml(member.role)}</td>
                                <td class="font-mono">${member.hourlyRateInternal ?? 0} CHF/h</td>
                                <td class="font-mono">${member.employmentLevel || 100}%</td>
                                <td class="font-mono" style="color: var(--primary);">
                                    <strong>${member.availableCapacity || 80}%</strong>
                                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                                        (${member.employmentLevel || 100}% × 0.8)
                                    </span>
                                </td>
                                <td>
                                    <span style="color: ${statusColor};">
                                        ${statusText}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;"
                                            onclick="UI.showEditMemberModal('${member.id}')">
                                        Bearbeiten
                                    </button>
                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                            onclick="UI.toggleMemberStatus('${member.id}')">
                                        ${isActive ? 'Deaktivieren' : 'Aktivieren'}
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }

                // Render capacity overview
                if (capacityOverview) {
                    const activeMembers = members.filter(m => m.active !== false);
                    const totalCapacity = activeMembers.reduce((sum, m) => sum + (m.availableCapacity || 80), 0);

                    // Get all bookings to calculate utilization
                    const allBookings = AppState.resourceBookings || [];
                    const now = new Date();
                    const currentBookings = allBookings.filter(b => {
                        const start = new Date(b.startDate);
                        const end = new Date(b.endDate);
                        return start <= now && end >= now;
                    });

                    const memberUtilization = activeMembers.map(member => {
                        const memberBookings = currentBookings.filter(b => b.memberId === member.id);
                        const bookedCapacity = memberBookings.reduce((sum, b) => sum + (b.capacityPercent ?? 0), 0);
                        const utilizationPercent = member.availableCapacity > 0
                            ? Math.round((bookedCapacity / member.availableCapacity) * 100)
                            : 0;
                        const isOverbooked = bookedCapacity > member.availableCapacity;

                        return {
                            member,
                            bookedCapacity,
                            utilizationPercent,
                            isOverbooked
                        };
                    });

                    capacityOverview.innerHTML = `
                        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                            <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                                <div class="text-sm" style="color: var(--text-secondary);">Aktive Mitglieder</div>
                                <div class="text-2xl font-bold font-mono mt-1">${activeMembers.length}</div>
                            </div>
                            <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                                <div class="text-sm" style="color: var(--text-secondary);">Gesamt Verfügbare Kapazität</div>
                                <div class="text-2xl font-bold font-mono mt-1">${totalCapacity}%</div>
                            </div>
                            <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                                <div class="text-sm" style="color: var(--text-secondary);">überbuchte Ressourcen</div>
                                <div class="text-2xl font-bold font-mono mt-1" style="color: ${memberUtilization.filter(m => m.isOverbooked).length > 0 ? 'var(--danger)' : 'var(--success)'}">
                                    ${memberUtilization.filter(m => m.isOverbooked).length}
                                </div>
                            </div>
                        </div>

                        ${memberUtilization.filter(m => m.isOverbooked).length > 0 ? `
                            <div class="mt-4 p-4" style="background: rgba(234, 88, 12, 0.1); border-left: 4px solid var(--warning); border-radius: 0.5rem;">
                                <h5 class="font-semibold mb-2" style="color: var(--warning);">⚠️ Überbuchungswarnung</h5>
                                ${memberUtilization.filter(m => m.isOverbooked).map(({ member, bookedCapacity, utilizationPercent }) => `
                                    <div style="margin-bottom: 0.5rem;">
                                        <strong>${this.escapeHtml(member.name)}</strong>:
                                        ${utilizationPercent}% ausgelastet
                                        (${bookedCapacity}% gebucht / ${member.availableCapacity}% verfügbar)
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${activeMembers.length > 0 ? `
                            <div class="mt-4">
                                <h5 class="font-semibold mb-3">Aktuelle Auslastung pro Mitglied</h5>
                                ${memberUtilization.map(({ member, bookedCapacity, utilizationPercent, isOverbooked }) => `
                                    <div style="margin-bottom: 1rem;">
                                        <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                            <span class="font-medium">${this.escapeHtml(member.name)}</span>
                                            <span class="font-mono" style="color: ${isOverbooked ? 'var(--danger)' : 'var(--text-secondary)'};">
                                                ${bookedCapacity}% / ${member.availableCapacity}%
                                                ${isOverbooked ? ' ⚠️' : ''}
                                            </span>
                                        </div>
                                        <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                            <div style="height: 100%; background: ${isOverbooked ? 'var(--danger)' : 'var(--primary)'}; width: ${Math.min(utilizationPercent, 100)}%;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    `;
                }
            },

            showAddMemberModal() {
                const modal = this.createModal('Neues Team-Mitglied hinzufügen', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Name *</label>
                            <input type="text" id="modal-member-name" placeholder="z.B. Max Mustermann" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Rolle *</label>
                            <input type="text" id="modal-member-role" placeholder="z.B. Senior Entwickler, Projektleiter" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Kompetenzgruppe *</label>
                            <select id="modal-member-competency" required>
                                <option value="">-- Bitte wählen --</option>
                                <option value="Entwicklung Mechanik">Entwicklung Mechanik</option>
                                <option value="Entwicklung Elektronik">Entwicklung Elektronik</option>
                                <option value="Verfahrenstechnik">Verfahrenstechnik</option>
                                <option value="Abteilungs-/Bereichsleiter">Abteilungs-/Bereichsleiter</option>
                                <option value="Labor">Labor</option>
                                <option value="Produktsupport">Produktsupport</option>
                                <option value="Sonstige">Sonstige</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Stundensatz (CHF)</label>
                            <input type="number" id="modal-member-rate-internal" step="0.01" min="0" placeholder="120.00">
                        </div>
                        <div>
                            <label class="text-sm font-medium">Anstellungsgrad (%)*</label>
                            <input type="number" id="modal-member-employment" min="1" max="100" value="100" required>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Verfügbare Kapazität wird automatisch berechnet (Anstellungsgrad × 0.8)
                            </p>
                        </div>
                        <div id="modal-member-capacity-preview" class="p-3" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                            <span style="color: var(--text-secondary);">Verfügbare Kapazität:</span>
                            <span class="font-mono font-bold ml-2" id="capacity-preview-value">80%</span>
                        </div>
                    </div>
                `, [
                    {
                        label: 'Abbrechen',
                        onClick: () => this.closeModal()
                    },
                    {
                        label: 'Mitglied hinzufügen',
                        onClick: () => this.handleAddMember(),
                        primary: true
                    }
                ]);

                // Update capacity preview when employment level changes
                const employmentInput = document.getElementById('modal-member-employment');
                const capacityPreview = document.getElementById('capacity-preview-value');
                if (employmentInput && capacityPreview) {
                    employmentInput.addEventListener('input', () => {
                        const employment = parseInt(employmentInput.value) || 100;
                        const available = Math.round(employment * 0.8);
                        capacityPreview.textContent = `${available}%`;
                    });
                }
            },

            handleAddMember() {
                const name = document.getElementById('modal-member-name').value.trim();
                const role = document.getElementById('modal-member-role').value.trim();
                const competencyGroup = document.getElementById('modal-member-competency').value.trim();
                const rateInternal = parseFloat(document.getElementById('modal-member-rate-internal').value) ?? 0;
                const employment = parseInt(document.getElementById('modal-member-employment').value) || 100;

                if (!name || !role || !competencyGroup) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                // Calculate available capacity (employment × 0.8)
                const availableCapacity = Math.round(employment * 0.8);

                const member = {
                    id: AppState.generateId(),
                    name,
                    role,
                    competencyGroup,
                    hourlyRateInternal: rateInternal,
                    employmentLevel: employment,
                    availableCapacity: availableCapacity,
                    active: true,
                    projectIds: []
                };

                AppState.members.push(member);
                AppState.save();

                this.closeModal();
                this.renderTeamTab();
                this.showAlert(`Mitglied "${name}" wurde erfolgreich hinzugefügt.`);
            },

            showEditMemberModal(memberId) {
                const member = AppState.members.find(m => m.id === memberId);
                if (!member) return;

                const modal = this.createModal('Team-Mitglied bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Name *</label>
                            <input type="text" id="modal-member-name" value="${this.escapeHtml(member.name)}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Rolle *</label>
                            <input type="text" id="modal-member-role" value="${this.escapeHtml(member.role)}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Kompetenzgruppe *</label>
                            <select id="modal-member-competency" required>
                                <option value="">-- Bitte wählen --</option>
                                <option value="Entwicklung Mechanik" ${member.competencyGroup === 'Entwicklung Mechanik' ? 'selected' : ''}>Entwicklung Mechanik</option>
                                <option value="Entwicklung Elektronik" ${member.competencyGroup === 'Entwicklung Elektronik' ? 'selected' : ''}>Entwicklung Elektronik</option>
                                <option value="Verfahrenstechnik" ${member.competencyGroup === 'Verfahrenstechnik' ? 'selected' : ''}>Verfahrenstechnik</option>
                                <option value="Abteilungs-/Bereichsleiter" ${member.competencyGroup === 'Abteilungs-/Bereichsleiter' ? 'selected' : ''}>Abteilungs-/Bereichsleiter</option>
                                <option value="Labor" ${member.competencyGroup === 'Labor' ? 'selected' : ''}>Labor</option>
                                <option value="Produktsupport" ${member.competencyGroup === 'Produktsupport' ? 'selected' : ''}>Produktsupport</option>
                                <option value="Sonstige" ${member.competencyGroup === 'Sonstige' ? 'selected' : ''}>Sonstige</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Stundensatz (CHF)</label>
                            <input type="number" id="modal-member-rate-internal" step="0.01" min="0" value="${member.hourlyRateInternal ?? 0}">
                        </div>
                        <div>
                            <label class="text-sm font-medium">Anstellungsgrad (%)*</label>
                            <input type="number" id="modal-member-employment" min="1" max="100" value="${member.employmentLevel ?? 100}" required>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Verfügbare Kapazität wird automatisch berechnet (Anstellungsgrad × 0.8)
                            </p>
                        </div>
                        <div id="modal-member-capacity-preview" class="p-3" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                            <span style="color: var(--text-secondary);">Verfügbare Kapazität:</span>
                            <span class="font-mono font-bold ml-2" id="capacity-preview-value">${member.availableCapacity || 80}%</span>
                        </div>
                    </div>
                `, [
                    {
                        label: 'Abbrechen',
                        onClick: () => this.closeModal()
                    },
                    {
                        label: 'Änderungen speichern',
                        onClick: () => this.handleEditMember(memberId),
                        primary: true
                    }
                ]);

                // Update capacity preview
                const employmentInput = document.getElementById('modal-member-employment');
                const capacityPreview = document.getElementById('capacity-preview-value');
                if (employmentInput && capacityPreview) {
                    employmentInput.addEventListener('input', () => {
                        const employment = parseInt(employmentInput.value) || 100;
                        const available = Math.round(employment * 0.8);
                        capacityPreview.textContent = `${available}%`;
                    });
                }
            },

            handleEditMember(memberId) {
                const member = AppState.members.find(m => m.id === memberId);
                if (!member) return;

                const name = document.getElementById('modal-member-name').value.trim();
                const role = document.getElementById('modal-member-role').value.trim();
                const competencyGroup = document.getElementById('modal-member-competency').value.trim();
                const rateInternal = parseFloat(document.getElementById('modal-member-rate-internal').value) ?? 0;
                const employment = parseInt(document.getElementById('modal-member-employment').value) || 100;

                if (!name || !role || !competencyGroup) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                // Calculate available capacity
                const availableCapacity = Math.round(employment * 0.8);

                // Update member
                member.name = name;
                member.role = role;
                member.competencyGroup = competencyGroup;
                member.hourlyRateInternal = rateInternal;
                member.employmentLevel = employment;
                member.availableCapacity = availableCapacity;

                AppState.save();

                this.closeModal();
                this.renderTeamTab();
                this.showAlert(`Mitglied "${name}" wurde erfolgreich aktualisiert.`);
            },

            toggleMemberStatus(memberId) {
                const member = AppState.members.find(m => m.id === memberId);
                if (!member) return;

                const isActive = member.active !== false;
                const action = isActive ? 'deaktivieren' : 'aktivieren';

                this.showConfirmDialog(
                    `Möchten Sie das Mitglied "${member.name}" wirklich ${action}?`,
                    () => {
                        member.active = !isActive;
                        AppState.save();
                        this.renderTeamTab();
                        this.showAlert(`Mitglied "${member.name}" wurde ${action}t.`);
                    }
                );
            },

            renderResourcesTab() {
                const bookings = AppState.getProjectResourceBookings(AppState.currentProjectId);
                const container = document.getElementById('resources-bookings-container');

                if (!container) return;

                // Render bookings table
                const html = `
                    <div class="card mb-6">
                        <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 class="font-semibold">Ressourcen-Buchungen</h3>
                            <button class="btn btn-primary" onclick="UI.showAddResourceBookingModal()">+ Ressource buchen</button>
                        </div>
                        ${bookings.length === 0 ? `
                            <p style="color: var(--text-secondary);">Keine Ressourcenbuchungen vorhanden</p>
                        ` : `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ressource</th>
                                        <th>Rolle</th>
                                        <th>Zeitraum</th>
                                        <th>Kapazität</th>
                                        <th>Auslastung</th>
                                        <th>Status</th>
                                        <th>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bookings.map(booking => {
                                        const member = AppState.members.find(m => m.id === booking.memberId);
                                        if (!member) return '';

                                        const utilization = AppState.calculateResourceUtilization(
                                            booking.memberId,
                                            booking.startDate,
                                            booking.endDate
                                        );

                                        const statusColor = utilization.overbookWarning ? 'var(--warning)' : 'var(--success)';
                                        const statusIcon = utilization.overbookWarning ? '⚠️' : '✅';
                                        const statusText = utilization.overbookWarning ? 'Überbucht' : 'OK';

                                        return `
                                            <tr>
                                                <td><strong>${this.escapeHtml(member.name)}</strong></td>
                                                <td>${this.escapeHtml(member.role)}</td>
                                                <td>${this.formatDate(booking.startDate)} - ${this.formatDate(booking.endDate)}</td>
                                                <td>${booking.capacityPercent}%</td>
                                                <td>
                                                    <span class="font-mono">${utilization.utilization}% / ${member.availableCapacity}%</span>
                                                </td>
                                                <td>
                                                    <span style="color: ${statusColor};">
                                                        ${statusIcon} ${statusText}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;"
                                                            onclick="UI.showEditResourceBookingModal('${booking.id}')">
                                                        Bearbeiten
                                                    </button>
                                                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                                            onclick="UI.deleteResourceBooking('${booking.id}')">
                                                        Löschen
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>

                    <!-- Available Resources -->
                    <div class="card mb-6">
                        <h3 class="font-semibold mb-4">Verfügbare Ressourcen</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Rolle</th>
                                    <th>Anstellung</th>
                                    <th>Verfügbar</th>
                                    <th>Stundensatz</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${AppState.members.map(member => `
                                    <tr>
                                        <td><strong>${this.escapeHtml(member.name)}</strong></td>
                                        <td>${this.escapeHtml(member.role)}</td>
                                        <td>${member.employmentLevel}%</td>
                                        <td class="font-mono">${member.availableCapacity}%</td>
                                        <td class="font-mono">CHF ${member.hourlyRateInternal.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

                container.innerHTML = html;
            },

            renderResourcesChart() {
                const ctx = document.getElementById('resources-chart');
                if (!ctx) return;

                if (window.resourcesChart) {
                    window.resourcesChart.destroy();
                }

                // Calculate utilization data for each member
                const today = new Date();
                const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

                const datasets = AppState.members.map((member, index) => {
                    const utilization = AppState.calculateResourceUtilization(
                        member.id,
                        today.toISOString().split('T')[0],
                        nextMonth.toISOString().split('T')[0]
                    );

                    const colors = [
                        'rgba(37, 99, 235, 0.6)',
                        'rgba(22, 163, 74, 0.6)',
                        'rgba(234, 88, 12, 0.6)',
                        'rgba(220, 38, 38, 0.6)'
                    ];

                    return {
                        label: member.name,
                        data: [utilization.utilization],
                        backgroundColor: colors[index % colors.length]
                    };
                });

                window.resourcesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Aktuelle Auslastung (30 Tage)'],
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 120,
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: 'Ressourcenauslastung (%)'
                            },
                            legend: {
                                display: true,
                                position: 'bottom'
                            }
                        }
                    }
                });
            },

            // ============================================================
            // MODALS
            // ============================================================

            showManagementCommentsModal() {
                const projects = AppState.getAllProjects();

                if (projects.length === 0) {
                    this.showAlert('Keine Projekte vorhanden.');
                    return;
                }

                // Build project list with comment fields
                const projectListHTML = projects.map(project => `
                    <div class="mb-4 p-4" style="background: var(--bg-secondary); border-radius: 8px;">
                        <h4 class="font-semibold mb-2">${project.name}</h4>
                        <textarea
                            id="mgmt-comment-${project.id}"
                            rows="3"
                            placeholder="Management-Kommentar für dieses Projekt (optional)..."
                            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);"
                        >${project.managementComment || ''}</textarea>
                    </div>
                `).join('');

                const modal = this.createModal('Management-Report Kommentare', `
                    <div style="max-height: 400px; overflow-y: auto;">
                        <p class="mb-4" style="color: var(--text-secondary);">
                            Fügen Sie optional Kommentare für die einzelnen Projekte hinzu. Diese werden im PDF-Report angezeigt.
                        </p>
                        ${projectListHTML}
                    </div>
                    <div class="flex gap-4 mt-6">
                        <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        <button class="btn btn-primary" onclick="UI.generateManagementReportWithComments()">Report generieren</button>
                    </div>
                `);
            },

            generateManagementReportWithComments() {
                const projects = AppState.getAllProjects();

                // Save comments to each project
                projects.forEach(project => {
                    const commentField = document.getElementById(`mgmt-comment-${project.id}`);
                    if (commentField) {
                        project.managementComment = commentField.value.trim();
                    }
                });

                // Save to localStorage
                AppState.save();

                // Close modal
                this.closeModal();

                // Generate PDF
                this.exportAllProjectsToPDF();
            },

            showNewProjectModal() {
                const modal = this.createModal('Neues Projekt erstellen', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Projektname *</label>
                            <input type="text" id="modal-project-name" placeholder="z.B. Digitalisierung HR" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Projektnummer *</label>
                            <input type="text" id="modal-project-number" placeholder="z.B. 25E123 | 12345" required>
                        </div>

                        <div>
                            <label class="text-sm font-medium">Beschreibung *</label>
                            <textarea id="modal-project-description" rows="3" placeholder="Kurze Projektbeschreibung" required></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Projektleiter *</label>
                                <input type="text" id="modal-project-lead" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Sponsor</label>
                                <input type="text" id="modal-project-sponsor">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Startdatum *</label>
                                <input type="date" id="modal-project-start" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Geplantes Enddatum *</label>
                                <input type="date" id="modal-project-end" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">SOP (Start of Production)</label>
                            <input type="date" id="modal-project-sop">
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Optional: Geplantes Produktionsstartdatum
                            </p>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Phase *</label>
                                <select id="modal-project-phase">
                                    <option value="Vorbereitung">Vorbereitung</option>
                                    <option value="Machbarkeit">Machbarkeit</option>
                                    <option value="Konzept">Konzept</option>
                                    <option value="Entwicklung">Entwicklung</option>
                                    <option value="Industrialisierung">Industrialisierung</option>
                                    <option value="Markteinführung">Markteinführung</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Währung *</label>
                                <select id="modal-project-currency" required>
                                    <option value="CHF">CHF</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Priorität *</label>
                            <select id="modal-project-priority" required>
                                <option value="1">1 - Sehr hoch</option>
                                <option value="2">2 - Hoch</option>
                                <option value="3" selected>3 - Mittel</option>
                                <option value="4">4 - Niedrig</option>
                                <option value="5">5 - Sehr niedrig</option>
                            </select>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Projekte werden standardmässig nach Priorität sortiert (1 = höchste Priorität)
                            </p>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveNewProject()">Projekt erstellen</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveNewProject() {
                const name = document.getElementById('modal-project-name').value;
                const projectNumber = document.getElementById('modal-project-number').value;
                const description = document.getElementById('modal-project-description').value;
                const lead = document.getElementById('modal-project-lead').value;
                const sponsor = document.getElementById('modal-project-sponsor').value;
                const startDate = document.getElementById('modal-project-start').value;
                const endDate = document.getElementById('modal-project-end').value;
                const sopDate = document.getElementById('modal-project-sop').value;
                const phase = document.getElementById('modal-project-phase').value;
                const currency = document.getElementById('modal-project-currency').value;
                const priority = parseInt(document.getElementById('modal-project-priority').value) || 3;

                if (!name || !projectNumber || !description || !lead || !startDate || !endDate) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                const pn = (projectNumber || '').trim().toLowerCase();
                const duplicate = AppState.projects.some(p => {
                  const existing = (p.projectNumber || '').trim().toLowerCase();
                  return existing && existing === pn;
                });
                if (duplicate) {
                  this.showAlert('Diese Projektnummer existiert bereits. Bitte wählen Sie eine eindeutige Nummer.');
                  return;
                }

                const newProject = {
                    id: AppState.generateId(),
                    name,
                    projectNumber: projectNumber.trim(),
                    description,
                    projectLead: lead,
                    sponsor,
                    stakeholders: [],
                    startDate,
                    endDate,  // FIXED: Use endDate instead of plannedEndDate
                    plannedEndDate: endDate,  // Keep for backward compatibility
                    phase,
                    currency,
                    priority,  // NEW: Project priority
                    sopBaselineDate: sopDate || null,
                    sopCurrentDate: sopDate || null,
                    sopChangeComment: '',
                    status: {
                        light: 'green',
                        auto: true,
                        manualOverride: false,
                        comment: ''
                    },
                    progress: 0,
                    projectStatus: 'active'  // FIXED: Set projectStatus to 'active' by default
                };

                AppState.projects.push(newProject);
                AppState.save();

                this.closeModal();
                this.renderProjectList();
                this.showAlert(`Projekt "${name}" wurde erfolgreich erstellt!`);
            },

            // NEW: Archive Project
            archiveProject() {
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) return;

                const currentStatus = project.projectStatus || 'active';

                if (currentStatus === 'archived') {
                    this.showAlert('Dieses Projekt ist bereits archiviert.');
                    return;
                }

                const statusOptions = currentStatus === 'active' ?
                    ['completed', 'archived'] :
                    ['archived'];

                const modal = this.createModal('Projekt abschliessen / archivieren', `
                    <div class="grid gap-4">
                        <div class="p-4" style="background: var(--warning-bg, rgba(234,88,12,0.1)); border-radius: 0.5rem; border-left: 4px solid var(--warning);">
                            <p style="margin-bottom: 0.5rem;"><strong>⚠️ Hinweis:</strong></p>
                            <p style="font-size: 0.875rem; color: var(--text-secondary);">
                                Beim Archivieren oder Abschliessen werden alle Ressourcenbuchungen dieses Projekts
                                freigegeben und stehen anderen Projekten wieder zur Verfügung.
                            </p>
                        </div>

                        <div>
                            <label class="text-sm font-medium">Projekt: <strong>${this.escapeHtml(project.name)}</strong></label>
                        </div>

                        <div>
                            <label class="text-sm font-medium">Neuer Status *</label>
                            <select id="modal-archive-status" required>
                                <option value="">Bitte wählen...</option>
                                ${statusOptions.includes('completed') ? '<option value="completed">🎯 Abgeschlossen (erfolgreich beendet)</option>' : ''}
                                <option value="archived">📦 Archiviert (nur lesend)</option>
                            </select>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                <strong>Abgeschlossen:</strong> Projekt erfolgreich beendet, kann weiter bearbeitet werden<br>
                                <strong>Archiviert:</strong> Projekt nur noch lesend, keine Bearbeitung mehr möglich
                            </p>
                        </div>

                        <div>
                            <label class="text-sm font-medium">Abschlusskommentar (optional)</label>
                            <textarea id="modal-archive-comment" rows="3" placeholder="z.B. Erfolgreich abgeschlossen, alle Ziele erreicht"></textarea>
                        </div>

                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveArchiveProject()">Projekt archivieren</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveArchiveProject() {
                const newStatus = document.getElementById('modal-archive-status').value;
                const comment = document.getElementById('modal-archive-comment').value;

                if (!newStatus) {
                    this.showAlert('Bitte wählen Sie einen Status aus.');
                    return;
                }

                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) return;

                // Set new status
                const success = AppState.setProjectStatus(AppState.currentProjectId, newStatus);

                if (!success) {
                    this.showAlert('Fehler beim Aktualisieren des Projektstatus.');
                    return;
                }

                // Add comment if provided
                if (comment) {
                    if (!project.status) project.status = {};
                    project.status.comment = comment;
                }

                AppState.save();

                this.closeModal();

                // Show success message with info about freed resources
                const bookings = AppState.getProjectResourceBookings(project.id);
                const resourcesFreed = [...new Set(bookings.map(b => {
                    const member = AppState.members.find(m => m.id === b.memberId);
                    return member ? member.name : null;
                }).filter(n => n))];

                let message = `? Projekt "${project.name}" wurde ${newStatus === 'archived' ? 'archiviert' : 'abgeschlossen'}.\n\n`;
                if (resourcesFreed.length > 0) {
                    message += `Folgende Ressourcen wurden freigegeben:\n${resourcesFreed.join(', ')}`;
                }

                this.showAlert(message);

                // Return to project list
                this.switchGlobalView('projects');
            },

            showEditProjectModal() {
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) return;

                const modal = this.createModal('Projekt bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Projektname *</label>
                            <input type="text" id="modal-edit-name" value="${this.escapeHtml(project.name)}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Projektnummer *</label>
                            <input type="text" id="modal-edit-project-number"
                                value="${this.escapeHtml(project.projectNumber || '')}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung *</label>
                            <textarea id="modal-edit-description" rows="3" required>${this.escapeHtml(project.description)}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Projektleiter *</label>
                                <input type="text" id="modal-edit-project-lead" value="${this.escapeHtml(project.projectLead || '')}" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Sponsor</label>
                                <input type="text" id="modal-edit-sponsor" value="${this.escapeHtml(project.sponsor || '')}">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Startdatum *</label>
                                <input type="date" id="modal-edit-start" value="${project.startDate}" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Enddatum *</label>
                                <input type="date" id="modal-edit-end" value="${project.endDate || project.plannedEndDate}" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">SOP (Start of Production)</label>
                            <input type="date" id="modal-edit-sop" value="${project.sopCurrentDate || ''}" data-original-value="${project.sopCurrentDate || ''}">
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Produktionsstartdatum${project.sopBaselineDate ? ' (Baseline: ' + this.formatDate(project.sopBaselineDate) + ')' : ''}
                            </p>
                        </div>
                        <div id="sop-comment-wrapper" style="display: none;">
                            <label class="text-sm font-medium">Begründung für SOP-Änderung *</label>
                            <textarea id="modal-edit-sop-comment" rows="2" placeholder="Bitte begründen Sie die Verschiebung des SOP-Datums"></textarea>
                            <p class="text-sm mt-1" style="color: var(--warning);">⚠️ Eine Begründung ist bei SOP-Änderungen zwingend erforderlich.</p>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Fortschritt (%)</label>
                                <input type="number" id="modal-edit-progress" value="${project.progress}" min="0" max="100">
                            </div>
                            <div>
                                <label class="text-sm font-medium">Phase</label>
                                <select id="modal-edit-phase">
                                    <option value="Vorbereitung" ${project.phase === 'Vorbereitung' ? 'selected' : ''}>Vorbereitung</option>
                                    <option value="Machbarkeit" ${project.phase === 'Machbarkeit' ? 'selected' : ''}>Machbarkeit</option>
                                    <option value="Konzept" ${project.phase === 'Konzept' ? 'selected' : ''}>Konzept</option>
                                    <option value="Entwicklung" ${project.phase === 'Entwicklung' ? 'selected' : ''}>Entwicklung</option>
                                    <option value="Industrialisierung" ${project.phase === 'Industrialisierung' ? 'selected' : ''}>Industrialisierung</option>
                                    <option value="Markteinführung" ${project.phase === 'Markteinführung' ? 'selected' : ''}>Markteinführung</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Priorität</label>
                            <select id="modal-edit-priority">
                                <option value="1" ${(project.priority || 3) === 1 ? 'selected' : ''}>1 - Sehr hoch</option>
                                <option value="2" ${(project.priority || 3) === 2 ? 'selected' : ''}>2 - Hoch</option>
                                <option value="3" ${(project.priority || 3) === 3 ? 'selected' : ''}>3 - Mittel</option>
                                <option value="4" ${(project.priority || 3) === 4 ? 'selected' : ''}>4 - Niedrig</option>
                                <option value="5" ${(project.priority || 3) === 5 ? 'selected' : ''}>5 - Sehr niedrig</option>
                            </select>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditProject()">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);

                // Add event listener to SOP field to show/hide comment field
                const sopInput = document.getElementById('modal-edit-sop');
                const sopCommentWrapper = document.getElementById('sop-comment-wrapper');
                if (sopInput && sopCommentWrapper) {
                    sopInput.addEventListener('change', function() {
                        const originalValue = this.getAttribute('data-original-value');
                        const newValue = this.value;

                        // Show comment field if SOP changed and original SOP exists
                        if (originalValue && newValue !== originalValue) {
                            sopCommentWrapper.style.display = 'block';
                        } else {
                            sopCommentWrapper.style.display = 'none';
                        }
                    });
                }
            },

            saveEditProject() {
                const project = AppState.getProject(AppState.currentProjectId);
                const projectNumber = document.getElementById('modal-edit-project-number').value;
                if (!project) return;

                const pn = (projectNumber || '').trim().toLowerCase();
                const duplicate = AppState.projects.some(p => {
                  if (p.id === project.id) return false;
                  const existing = (p.projectNumber || '').trim().toLowerCase();
                  return existing && existing === pn;
                });
                if (duplicate) {
                  this.showAlert('Diese Projektnummer existiert bereits. Bitte wählen Sie eine eindeutige Nummer.');
                  return;
                }


                const newStartDate = document.getElementById('modal-edit-start').value;
                const newEndDate = document.getElementById('modal-edit-end').value;

                if (!newStartDate || !newEndDate) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                // Handle SOP changes
                const oldSop = project.sopCurrentDate || project.sopBaselineDate || null;
                const newSop = document.getElementById('modal-edit-sop').value || null;

                // Check if SOP changed and comment is required
                if (oldSop && newSop !== oldSop) {
                    const sopComment = document.getElementById('modal-edit-sop-comment').value.trim();
                    if (!sopComment) {
                        this.showAlert('Bitte geben Sie eine Begründung für die SOP-Änderung ein.');
                        return;
                    }
                    project.sopChangeComment = sopComment;
                }

                // Update SOP fields
                if (oldSop === null && newSop) {
                    // First time setting SOP
                    project.sopBaselineDate = newSop;
                    project.sopCurrentDate = newSop;
                    project.sopChangeComment = '';
                } else if (newSop !== null) {
                    // Updating existing SOP
                    project.sopCurrentDate = newSop;
                    if (!project.sopBaselineDate) {
                        project.sopBaselineDate = newSop;
                    }
                } else {
                    // SOP removed
                    project.sopCurrentDate = null;
                }

                // Synchronize with SOP milestone
                const sopMilestone = AppState.milestones.find(
                    m => m.projectId === project.id && m.name && m.name.includes('SOP')
                );
                if (newSop && sopMilestone) {
                    sopMilestone.date = newSop;
                } else if (newSop && !sopMilestone) {
                    // Create SOP milestone if it doesn't exist
                    AppState.milestones.push({
                        id: AppState.generateId(),
                        projectId: project.id,
                        name: 'SOP (Start of Production)',
                        date: newSop,
                        type: 'SOP',
                        status: 'planned'
                    });
                }

                project.name = document.getElementById('modal-edit-name').value;
                project.projectNumber = projectNumber.trim();
                project.description = document.getElementById('modal-edit-description').value;
                project.projectLead = document.getElementById('modal-edit-project-lead').value;
                project.sponsor = document.getElementById('modal-edit-sponsor').value;
                project.startDate = newStartDate;
                project.endDate = newEndDate;
                project.plannedEndDate = newEndDate;  // Keep for backward compatibility
                project.progress = parseInt(document.getElementById('modal-edit-progress').value);
                project.phase = document.getElementById('modal-edit-phase').value;
                project.priority = parseInt(document.getElementById('modal-edit-priority').value) || 3;  // NEW: Save priority

                AppState.save();
                this.closeModal();
                this.showProjectDetails(AppState.currentProjectId);
                this.renderProjectList();  // Re-render list to update sorting
                this.showAlert('Projekt wurde aktualisiert.');
            },

            showAddCostModal() {
                const project = AppState.getProject(AppState.currentProjectId);
                const modal = this.createModal('Kosten erfassen (IST)', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Kostenart *</label>
                            <select id="modal-cost-type" required onchange="UI.toggleCostStatusField()">
                                <option value="internal_hours">Intern</option>
                                <option value="external_service">Extern</option>
                                <option value="investment">Investitionen / Werkzeuge</option>
                            </select>
                        </div>
                        <div id="cost-status-field" style="display: none;">
                            <label class="text-sm font-medium">Status</label>
                            <select id="modal-cost-status" onchange="UI.togglePartialAmountField()">
                                <option value="">-</option>
                                <option value="bestellt">Bestellt</option>
                                <option value="teilzahlung_visiert">Teilzahlung visiert</option>
                                <option value="vollzahlung_visiert">Vollzahlung visiert</option>
                            </select>
                        </div>
                        <div id="partial-payments-field" style="display: none;">
                            <label class="text-sm font-medium">Teilzahlungen (nur informativ)</label>
                            <div id="partial-payments-list" style="margin-bottom: 0.5rem;"></div>
                            <button type="button" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.addPartialPaymentRow()">+ Teilzahlung hinzufügen</button>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Datum *</label>
                            <input type="date" id="modal-cost-date" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung *</label>
                            <input type="text" id="modal-cost-description" placeholder="z.B. Entwicklung Backend-API" required>
                        </div>
                        <div id="cost-reference-field" style="display:none;">
                            <label class="text-sm font-medium">Bestell-/Rechnungsnummer</label>
                            <input type="text" id="modal-cost-reference" placeholder="z.B. PO12345 / RE-98765">
                        </div>
                        <div>
                            <label class="text-sm font-medium">Betrag (${project.currency}) *</label>
                            <input type="number" id="modal-cost-amount" step="0.01" min="0" placeholder="0.00" required>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">Tatsächlich angefallene Kosten (IST)</p>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveAddCost()">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);

                // Trigger initial check
                setTimeout(() => this.toggleCostStatusField(), 0);
            },

            toggleCostStatusField() {
              const typeSelect =
                document.getElementById('modal-cost-type') ||
                document.getElementById('modal-edit-cost-type');

              const statusField = document.getElementById('cost-status-field');
              const refField = document.getElementById('cost-reference-field');

              if (typeSelect) {
                const type = typeSelect.value;
                const isExternal = (type === 'external_service' || type === 'investment');

                if (statusField) statusField.style.display = isExternal ? 'block' : 'none';
                if (refField) refField.style.display = isExternal ? 'block' : 'none';
              }

              this.togglePartialAmountField();
            },

            togglePartialAmountField() {
                const statusSelect = document.getElementById('modal-cost-status');
                const partialPaymentsField = document.getElementById('partial-payments-field');

                if (statusSelect && partialPaymentsField) {
                    const status = statusSelect.value;
                    // Show partial payments only for teilzahlung_visiert
                    if (status === 'teilzahlung_visiert') {
                        partialPaymentsField.style.display = 'block';
                    } else {
                        partialPaymentsField.style.display = 'none';
                    }
                }
            },

            addPartialPaymentRow(date = '', amount = '') {
                const list = document.getElementById('partial-payments-list');
                if (!list) return;

                const rowId = 'partial-payment-' + Date.now();
                const row = document.createElement('div');
                row.id = rowId;
                row.className = 'flex gap-2 items-center';
                row.style.marginBottom = '0.5rem';

                row.innerHTML = `
                    <input type="date" class="partial-payment-date" value="${date}" style="flex: 1; padding: 0.25rem; border: 1px solid var(--border); border-radius: 0.25rem; background: var(--bg-primary); color: var(--text-primary);">
                    <input type="number" class="partial-payment-amount" value="${amount}" step="0.01" min="0" placeholder="Betrag" style="flex: 1; padding: 0.25rem; border: 1px solid var(--border); border-radius: 0.25rem; background: var(--bg-primary); color: var(--text-primary);">
                    <button type="button" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--danger); color: white;" onclick="document.getElementById('${rowId}').remove()">×</button>
                `;

                list.appendChild(row);
            },

            getPartialPaymentsFromForm() {
                const list = document.getElementById('partial-payments-list');
                if (!list) return [];

                const payments = [];
                const rows = list.querySelectorAll('div[id^="partial-payment-"]');

                rows.forEach(row => {
                    const dateInput = row.querySelector('.partial-payment-date');
                    const amountInput = row.querySelector('.partial-payment-amount');

                    if (dateInput && amountInput && dateInput.value && amountInput.value) {
                        const amount = parseFloat(amountInput.value);
                        if (!isNaN(amount) && amount > 0) {
                            payments.push({
                                date: dateInput.value,
                                amount: amount
                            });
                        }
                    }
                });

                return payments;
            },

            togglePartialPaymentsSection(sectionId) {
                const section = document.getElementById(sectionId);
                const arrow = document.getElementById(sectionId + '-arrow');

                if (section && arrow) {
                    if (section.style.display === 'none') {
                        section.style.display = 'block';
                        arrow.style.transform = 'rotate(90deg)';
                    } else {
                        section.style.display = 'none';
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            },

            renderPartialPaymentsList(cost, project) {
                if (!cost.partialPayments || cost.partialPayments.length === 0) {
                    return '<p style="color: var(--text-secondary); font-size: 0.875rem;">Keine Teilzahlungen erfasst</p>';
                }

                const paymentRows = cost.partialPayments.map((payment, index) => `
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 0.25rem; margin-bottom: 0.5rem;">
                        <span style="flex: 1; font-size: 0.875rem;">
                            <strong>${this.formatDate(payment.date)}</strong>
                        </span>
                        <span style="flex: 1; font-size: 0.875rem; font-weight: 600; font-family: monospace;">
                            ${this.formatCurrency(payment.amount, project.currency)}
                        </span>
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="UI.editPartialPayment('${cost.id}', ${index})">✏️</button>
                            <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: var(--danger); color: white;" onclick="UI.deletePartialPayment('${cost.id}', ${index})">×</button>
                        </div>
                    </div>
                `).join('');

                return `
                    ${paymentRows}
                    <button class="btn" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-top: 0.5rem;" onclick="UI.addNewPartialPayment('${cost.id}')">+ Teilzahlung hinzufügen</button>
                `;
            },

            addNewPartialPayment(costId) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost) return;

                const project = AppState.getProject(cost.projectId);
                if (!project) return;

                const modal = this.createModal('Neue Teilzahlung hinzufügen', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Datum *</label>
                            <input type="date" id="new-partial-payment-date" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Betrag (${project.currency}) *</label>
                            <input type="number" id="new-partial-payment-amount" step="0.01" min="0" placeholder="0.00" required>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveNewPartialPayment('${costId}')">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveNewPartialPayment(costId) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost) return;

                const date = document.getElementById('new-partial-payment-date').value;
                const amount = parseFloat(document.getElementById('new-partial-payment-amount').value);

                if (!date || isNaN(amount) || amount <= 0) {
                    this.showAlert('Bitte füllen Sie alle Felder korrekt aus.');
                    return;
                }

                if (!cost.partialPayments) {
                    cost.partialPayments = [];
                }

                cost.partialPayments.push({ date, amount });
                AppState.save();

                this.closeModal();
                this.renderCostsTab();
                this.showAlert('Teilzahlung wurde hinzugefügt.');
            },

            editPartialPayment(costId, paymentIndex) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost || !cost.partialPayments || !cost.partialPayments[paymentIndex]) return;

                const project = AppState.getProject(cost.projectId);
                if (!project) return;

                const payment = cost.partialPayments[paymentIndex];

                const modal = this.createModal('Teilzahlung bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Datum *</label>
                            <input type="date" id="edit-partial-payment-date" value="${payment.date}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Betrag (${project.currency}) *</label>
                            <input type="number" id="edit-partial-payment-amount" value="${payment.amount}" step="0.01" min="0" placeholder="0.00" required>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditedPartialPayment('${costId}', ${paymentIndex})">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveEditedPartialPayment(costId, paymentIndex) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost || !cost.partialPayments || !cost.partialPayments[paymentIndex]) return;

                const date = document.getElementById('edit-partial-payment-date').value;
                const amount = parseFloat(document.getElementById('edit-partial-payment-amount').value);

                if (!date || isNaN(amount) || amount <= 0) {
                    this.showAlert('Bitte füllen Sie alle Felder korrekt aus.');
                    return;
                }

                cost.partialPayments[paymentIndex] = { date, amount };
                AppState.save();

                this.closeModal();
                this.renderCostsTab();
                this.showAlert('Teilzahlung wurde aktualisiert.');
            },

            deletePartialPayment(costId, paymentIndex) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost || !cost.partialPayments || !cost.partialPayments[paymentIndex]) return;

                const modal = this.createModal('Teilzahlung löschen', `
                    <div>
                        <p style="margin-bottom: 1rem;">Möchten Sie diese Teilzahlung wirklich löschen?</p>
                        <div class="flex gap-4">
                            <button class="btn" style="background: var(--danger); color: white;" onclick="UI.confirmDeletePartialPayment('${costId}', ${paymentIndex})">Löschen</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            confirmDeletePartialPayment(costId, paymentIndex) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost || !cost.partialPayments) return;

                cost.partialPayments.splice(paymentIndex, 1);
                AppState.save();

                this.closeModal();
                this.renderCostsTab();
                this.showAlert('Teilzahlung wurde gelöscht.');
            },

            saveAddCost() {
                const description = document.getElementById('modal-cost-description').value;
                const type = document.getElementById('modal-cost-type').value;
                const date = document.getElementById('modal-cost-date').value;
                const amount = parseFloat(document.getElementById('modal-cost-amount').value);
                const statusSelect = document.getElementById('modal-cost-status');
                const status = statusSelect ? statusSelect.value : '';
                const partialPayments = this.getPartialPaymentsFromForm();
                const referenceNo = (document.getElementById('modal-cost-reference')?.value || '').trim();

                if (!description || !date || isNaN(amount) || amount < 0) {
                    this.showAlert('Bitte füllen Sie alle Felder korrekt aus.');
                    return;
                }

                const newCost = {
                  id: AppState.generateId(),
                  projectId: AppState.currentProjectId,
                  type,
                  date,
                  description,
                  amount,
                  status: status || undefined,
                  referenceNo: referenceNo || undefined,
                  partialPayments: partialPayments.length > 0 ? partialPayments : undefined
                };

                AppState.costs.push(newCost);
                AppState.save();

                this.closeModal();
                this.renderCostsTab();
                this.renderOverviewTab();
                this.showAlert('IST-Kosten wurden erfasst.');
            },

            showEditCostModal(costId) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost) return;

                const project = AppState.getProject(cost.projectId);
                if (!project) return;

                const modal = this.createModal('Kosten bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Kostenart *</label>
                            <select id="modal-edit-cost-type" required onchange="UI.toggleCostStatusField()">
                                <option value="internal_hours" ${cost.type === 'internal_hours' ? 'selected' : ''}>Intern</option>
                                <option value="external_service" ${cost.type === 'external_service' ? 'selected' : ''}>Extern</option>
                                <option value="investment" ${cost.type === 'investment' ? 'selected' : ''}>Investitionen / Werkzeuge</option>
                            </select>
                        </div>
                        <div id="cost-status-field" style="display: none;">
                            <label class="text-sm font-medium">Status</label>
                            <select id="modal-cost-status" onchange="UI.togglePartialAmountField()">
                                <option value="">-</option>
                                <option value="bestellt" ${cost.status === 'bestellt' ? 'selected' : ''}>Bestellt</option>
                                <option value="teilzahlung_visiert" ${cost.status === 'teilzahlung_visiert' ? 'selected' : ''}>Teilzahlung visiert</option>
                                <option value="vollzahlung_visiert" ${cost.status === 'vollzahlung_visiert' ? 'selected' : ''}>Vollzahlung visiert</option>
                            </select>
                        </div>
                        <div id="partial-payments-field" style="display: none;">
                            <label class="text-sm font-medium">Teilzahlungen (nur informativ)</label>
                            <div id="partial-payments-list" style="margin-bottom: 0.5rem;"></div>
                            <button type="button" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="UI.addPartialPaymentRow()">+ Teilzahlung hinzufügen</button>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Datum *</label>
                            <input type="date" id="modal-edit-cost-date" value="${cost.date}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung *</label>
                            <input type="text" id="modal-edit-cost-description" value="${this.escapeHtml(cost.description)}" placeholder="z.B. Entwicklung Backend-API" required>
                        </div>
                        <div id="cost-reference-field" style="display:none;">
                            <label class="text-sm font-medium">Bestell-/Rechnungsnummer</label>
                            <input type="text" id="modal-cost-reference"
                                value="${this.escapeHtml(cost.referenceNo || '')}"
                                placeholder="z.B. PO12345 / RE-98765">
                        </div>
                        <div>
                            <label class="text-sm font-medium">Betrag (${project.currency}) *</label>
                            <input type="number" id="modal-edit-cost-amount" step="0.01" min="0" value="${cost.amount}" placeholder="0.00" required>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">Tatsächlich angefallene Kosten (IST)</p>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditCost('${costId}')">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);

                // Trigger initial checks and load existing partial payments
                setTimeout(() => {
                    this.toggleCostStatusField();
                    this.togglePartialAmountField();

                    // Load existing partial payments
                    if (cost.partialPayments && cost.partialPayments.length > 0) {
                        cost.partialPayments.forEach(payment => {
                            this.addPartialPaymentRow(payment.date, payment.amount);
                        });
                    }
                    // Migrate old single partialAmount to array (backward compatibility)
                    else if (cost.partialAmount) {
                        this.addPartialPaymentRow('', cost.partialAmount);
                    }
                }, 0);
            },

            saveEditCost(costId) {
                const cost = AppState.costs.find(c => c.id === costId);
                if (!cost) return;

                const description = document.getElementById('modal-edit-cost-description').value;
                const type = document.getElementById('modal-edit-cost-type').value;
                const date = document.getElementById('modal-edit-cost-date').value;
                const amount = parseFloat(document.getElementById('modal-edit-cost-amount').value);
                const statusSelect = document.getElementById('modal-cost-status');
                const status = statusSelect ? statusSelect.value : '';
                const partialPayments = this.getPartialPaymentsFromForm();
                const referenceNo = (document.getElementById('modal-cost-reference')?.value || '').trim();

                if (!description || !date || isNaN(amount) || amount < 0) {
                    this.showAlert('Bitte füllen Sie alle Felder korrekt aus.');
                    return;
                }

                // Update cost object
                cost.type = type;
                cost.date = date;
                cost.description = description;
                cost.amount = amount;
                cost.status = status || undefined;
                cost.partialPayments = partialPayments.length > 0 ? partialPayments : undefined; // Nur informativ, wird nicht in Berechnungen verwendet
                cost.referenceNo = referenceNo || undefined;
                // Remove old partialAmount field (migration)
                delete cost.partialAmount;

                AppState.save();

                this.closeModal();
                this.renderCostsTab();
                this.renderOverviewTab();
                this.showAlert('Kosten wurden aktualisiert.');
            },

            showAddMilestoneModal() {
                const modal = this.createModal('Gate hinzufügen', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Name *</label>
                            <input type="text" id="modal-milestone-name" placeholder="z.B. MVP Release" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-milestone-description" rows="2"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Phase</label>
                                <select id="modal-project-phase">
                                    <option value="Vorbereitung">Vorbereitung</option>
                                    <option value="Machbarkeit">Machbarkeit</option>
                                    <option value="Konzept">Konzept</option>
                                    <option value="Entwicklung">Entwicklung</option>
                                    <option value="Industrialisierung">Industrialisierung</option>
                                    <option value="Markteinführung">Markteinführung</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Geplantes Datum *</label>
                                <input type="date" id="modal-milestone-date" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Fortschritt (%)</label>
                            <input type="number" id="modal-milestone-progress" value="0" min="0" max="100">
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveAddMilestone()">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveAddMilestone() {
                const name = document.getElementById('modal-milestone-name').value;
                const description = document.getElementById('modal-milestone-description').value;
                const phase = document.getElementById('modal-project-phase').value;
                const plannedDate = document.getElementById('modal-milestone-date').value;
                const progress = parseInt(document.getElementById('modal-milestone-progress').value);

                if (!name || !plannedDate) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                const newMilestone = {
                    id: AppState.generateId(),
                    projectId: AppState.currentProjectId,
                    name,
                    description,
                    plannedDate,
                    progress,
                    responsible: '',
                    phase
                };

                AppState.milestones.push(newMilestone);
                AppState.save();

                this.closeModal();
                this.renderMilestonesTab();
                this.renderOverviewTab();
                this.showAlert('Gate wurde hinzugefügt.');
            },

            showAddRiskModal() {
                const modal = this.createModal('Risiko erfassen', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Beschreibung *</label>
                            <input type="text" id="modal-risk-description" placeholder="z.B. Ressourcenengpass" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Ursache</label>
                            <textarea id="modal-risk-cause" rows="2"></textarea>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Auswirkung</label>
                            <textarea id="modal-risk-impact" rows="2"></textarea>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="text-sm font-medium">Wahrscheinlichkeit</label>
                                <select id="modal-risk-probability">
                                    <option value="Niedrig">Niedrig</option>
                                    <option value="medium">Mittel</option>
                                    <option value="high">Hoch</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Impact</label>
                                <select id="modal-risk-impact-level">
                                    <option value="low">Niedrig</option>
                                    <option value="medium">Mittel</option>
                                    <option value="high">Hoch</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Kategorie</label>
                                <select id="modal-risk-category">
                                    <option value="time">Zeit</option>
                                    <option value="finance">Finanzen</option>
                                    <option value="tech">Technik</option>
                                    <option value="organization">Organisation</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveAddRisk()">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveAddRisk() {
                const description = document.getElementById('modal-risk-description').value;
                const cause = document.getElementById('modal-risk-cause').value;
                const impact = document.getElementById('modal-risk-impact').value;
                const probability = document.getElementById('modal-risk-probability').value;
                const impactLevel = document.getElementById('modal-risk-impact-level').value;
                const category = document.getElementById('modal-risk-category').value;

                if (!description) {
                    this.showAlert('Bitte geben Sie eine Risikobeschreibung ein.');
                    return;
                }

                // Calculate priority
                let priority = 'low';
                if (probability === 'high' && impactLevel === 'high') priority = 'high';
                else if (probability === 'high' || impactLevel === 'high') priority = 'medium';

                const newRisk = {
                    id: AppState.generateId(),
                    projectId: AppState.currentProjectId,
                    description,
                    cause,
                    impact,
                    probability,
                    impactLevel,
                    priority,
                    category,
                    mitigations: []
                };

                AppState.risks.push(newRisk);
                AppState.save();

                this.closeModal();
                this.renderRisksTab();
                this.renderOverviewTab();
                this.showAlert('Risiko wurde erfasst.');
            },

            showAddTaskModal() {
                const tasks = AppState.getProjectTasks(AppState.currentProjectId);
                const tasksOptions = tasks.map(t =>
                    `<option value="${t.id}">${this.escapeHtml(t.name || t.description)}</option>`
                ).join('');

                // NEW: Only show project team members as responsible options
                const projectTeamMembers = AppState.getProjectTeamMembers(AppState.currentProjectId);
                const teamMembers = projectTeamMembers
                    .map(ptm => AppState.members.find(m => m.id === ptm.memberId))
                    .filter(m => m); // Filter out any undefined members

                const responsibleOptions = teamMembers.map(m =>
                    `<option value="${m.id}">${this.escapeHtml(m.name)} (${this.escapeHtml(m.role)})</option>`
                ).join('');

                const modal = this.createModal('Aufgabe erstellen', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Aufgabenname *</label>
                            <input type="text" id="modal-task-name" placeholder="z.B. Backend-Entwicklung" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-task-description" rows="2" placeholder="Details zur Aufgabe..."></textarea>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Verantwortlich</label>
                            <select id="modal-task-responsible">
                                <option value="">Nicht zugewiesen</option>
                                ${responsibleOptions}
                            </select>
                            ${teamMembers.length === 0 ? '<p class="text-sm mt-1" style="color: var(--warning);">⚠️ Fügen Sie zuerst Mitglieder zum Projektteam hinzu</p>' : ''}
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="text-sm font-medium">Startdatum *</label>
                                <input type="date" id="modal-task-start" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Enddatum *</label>
                                <input type="date" id="modal-task-due" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Dauer (Tage)</label>
                                <input type="number" id="modal-task-duration" min="1" placeholder="Auto">
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="text-sm font-medium">Priorität</label>
                                <select id="modal-task-priority">
                                    <option value="low">Niedrig</option>
                                    <option value="medium" selected>Mittel</option>
                                    <option value="high">Hoch</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Status</label>
                                <select id="modal-task-status">
                                    <option value="open" selected>Offen</option>
                                    <option value="in_progress">In Arbeit</option>
                                    <option value="done">Erledigt</option>
                                    <option value="blocked">Blockiert</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Fortschritt</label>
                                <select id="modal-task-progress">
                                    <option value="0" selected>0%</option>
                                    <option value="25">25%</option>
                                    <option value="50">50%</option>
                                    <option value="75">75%</option>
                                    <option value="100">100%</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Abhängigkeiten (Finish-to-Start)</label>
                            <select id="modal-task-dependencies" multiple size="3">
                                ${tasksOptions || '<option disabled>Keine anderen Aufgaben vorhanden</option>'}
                            </select>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">Wählen Sie Aufgaben aus, die vor dieser abgeschlossen sein müssen (Strg/Cmd + Klick für mehrere)</p>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveAddTask()">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveAddTask() {
                const name = document.getElementById('modal-task-name').value;
                const description = document.getElementById('modal-task-description').value;
                const responsible = document.getElementById('modal-task-responsible').value;
                const startDate = document.getElementById('modal-task-start').value;
                const endDate = document.getElementById('modal-task-due').value;
                const duration = document.getElementById('modal-task-duration').value;
                const priority = document.getElementById('modal-task-priority').value;
                const status = document.getElementById('modal-task-status').value;

                if (!name || !startDate || !endDate) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                // Get selected dependencies
                const dependenciesSelect = document.getElementById('modal-task-dependencies');
                const dependencies = Array.from(dependenciesSelect.selectedOptions).map(option => ({
                    task: option.value,
                    type: 'FS' // Finish-to-Start
                }));

                // Get progress - only allow 0, 25, 50, 75, 100
                const progressValue = parseInt(document.getElementById('modal-task-progress').value, 10);
                const progress = [0, 25, 50, 75, 100].includes(progressValue) ? progressValue : 0;

                const newTask = {
                    id: AppState.generateId(),
                    projectId: AppState.currentProjectId,
                    name,
                    description,
                    responsible,
                    startDate,
                    endDate,
                    duration: duration ? parseInt(duration) : AppState.calculateDuration(startDate, endDate),
                    status,
                    priority,
                    dependencies,
                    milestoneId: null,
                    progress
                };

                AppState.tasks.push(newTask);
                AppState.save();

                this.closeModal();
                this.renderTasksTab();
                this.renderOverviewTab();
                this.renderGanttTab();
                this.showAlert('Aufgabe wurde erstellt.');
            },

            showEditTaskModal(task) {
                const tasks = AppState.getProjectTasks(AppState.currentProjectId).filter(t => t.id !== task.id);
                const tasksOptions = tasks.map(t =>
                    `<option value="${t.id}" ${task.dependencies && task.dependencies.some(d => d.task === t.id) ? 'selected' : ''}>${this.escapeHtml(t.name || t.description)}</option>`
                ).join('');

                // NEW: Only show project team members as responsible options
                const projectTeamMembers = AppState.getProjectTeamMembers(AppState.currentProjectId);
                const teamMembers = projectTeamMembers
                    .map(ptm => AppState.members.find(m => m.id === ptm.memberId))
                    .filter(m => m); // Filter out any undefined members

                const responsibleOptions = teamMembers.map(m =>
                    `<option value="${m.id}" ${task.responsible === m.id ? 'selected' : ''}>${this.escapeHtml(m.name)} (${this.escapeHtml(m.role)})</option>`
                ).join('');

                const modal = this.createModal('Aufgabe bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Aufgabenname *</label>
                            <input type="text" id="modal-task-name" value="${this.escapeHtml(task.name || '')}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-task-description" rows="2">${this.escapeHtml(task.description || '')}</textarea>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Verantwortlich</label>
                            <select id="modal-task-responsible">
                                <option value="">Nicht zugewiesen</option>
                                ${responsibleOptions}
                            </select>
                            ${teamMembers.length === 0 ? '<p class="text-sm mt-1" style="color: var(--warning);">⚠️ Fügen Sie zuerst Mitglieder zum Projektteam hinzu</p>' : ''}
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="text-sm font-medium">Startdatum *</label>
                                <input type="date" id="modal-task-start" value="${task.startDate}" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Enddatum *</label>
                                <input type="date" id="modal-task-due" value="${task.endDate}" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Dauer (Tage)</label>
                                <input type="number" id="modal-task-duration" value="${task.duration || ''}" min="1" placeholder="Auto">
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="text-sm font-medium">Priorität</label>
                                <select id="modal-task-priority">
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Niedrig</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Mittel</option>
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Hoch</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Status</label>
                                <select id="modal-task-status">
                                    <option value="open" ${task.status === 'open' ? 'selected' : ''}>Offen</option>
                                    <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Arbeit</option>
                                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Erledigt</option>
                                    <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Blockiert</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Fortschritt</label>
                                <select id="modal-task-progress">
                                    <option value="0" ${task.progress === 0 ? 'selected' : ''}>0%</option>
                                    <option value="25" ${task.progress === 25 ? 'selected' : ''}>25%</option>
                                    <option value="50" ${task.progress === 50 ? 'selected' : ''}>50%</option>
                                    <option value="75" ${task.progress === 75 ? 'selected' : ''}>75%</option>
                                    <option value="100" ${task.progress === 100 ? 'selected' : ''}>100%</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Abhängigkeiten (Finish-to-Start)</label>
                            <select id="modal-task-dependencies" multiple size="3">
                                ${tasksOptions || '<option disabled>Keine anderen Aufgaben vorhanden</option>'}
                            </select>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">Wählen Sie Aufgaben aus, die vor dieser abgeschlossen sein müssen</p>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditTask('${task.id}')">Speichern</button>
                            <button class="btn" onclick="UI.deleteTask('${task.id}')">Löschen</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveEditTask(taskId) {
                const task = AppState.tasks.find(t => t.id === taskId);
                if (!task) return;

                task.name = document.getElementById('modal-task-name').value;
                task.description = document.getElementById('modal-task-description').value;
                task.responsible = document.getElementById('modal-task-responsible').value;
                task.startDate = document.getElementById('modal-task-start').value;
                task.endDate = document.getElementById('modal-task-due').value;
                const duration = document.getElementById('modal-task-duration').value;
                task.duration = duration ? parseInt(duration) : AppState.calculateDuration(task.startDate, task.endDate);
                task.priority = document.getElementById('modal-task-priority').value;
                task.status = document.getElementById('modal-task-status').value;

                // Update progress - only allow 0, 25, 50, 75, 100
                const progressValue = parseInt(document.getElementById('modal-task-progress').value, 10);
                task.progress = [0, 25, 50, 75, 100].includes(progressValue) ? progressValue : 0;

                // Update dependencies
                const dependenciesSelect = document.getElementById('modal-task-dependencies');
                task.dependencies = Array.from(dependenciesSelect.selectedOptions).map(option => ({
                    task: option.value,
                    type: 'FS'
                }));

                AppState.save();
                this.closeModal();
                this.renderTasksTab();
                this.renderGanttTab();
                this.showAlert('Aufgabe wurde aktualisiert.');
            },

            showEditMilestoneModal(milestone) {
                const modal = this.createModal('Gate bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Name *</label>
                            <input type="text" id="modal-milestone-name" value="${this.escapeHtml(milestone.name || '')}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-milestone-description" rows="2">${this.escapeHtml(milestone.description || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Datum *</label>
                                <input type="date" id="modal-milestone-date" value="${milestone.date || milestone.plannedDate || ''}" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Status</label>
                                <select id="modal-milestone-status">
                                    <option value="pending" ${milestone.status === 'pending' ? 'selected' : ''}>Ausstehend</option>
                                    <option value="in_progress" ${milestone.status === 'in_progress' ? 'selected' : ''}>In Arbeit</option>
                                    <option value="completed" ${milestone.status === 'completed' ? 'selected' : ''}>Abgeschlossen</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditMilestone('${milestone.id}')">Speichern</button>
                            <button class="btn" onclick="UI.deleteMilestone('${milestone.id}')">Löschen</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveEditMilestone(milestoneId) {
                const milestone = AppState.milestones.find(m => m.id === milestoneId);
                if (!milestone) return;

                milestone.name = document.getElementById('modal-milestone-name').value;
                milestone.description = document.getElementById('modal-milestone-description').value;
                const date = document.getElementById('modal-milestone-date').value;
                milestone.date = date;
                milestone.plannedDate = date;
                milestone.status = document.getElementById('modal-milestone-status').value;

                AppState.save();
                this.closeModal();
                this.renderMilestonesTab();
                this.renderGanttTab();
                this.showAlert('Gate wurde aktualisiert.');
            },

            showEditRiskModal(risk) {
                const modal = this.createModal('Risiko bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Titel *</label>
                            <input type="text" id="modal-risk-title" value="${this.escapeHtml(risk.title || risk.description || '')}" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-risk-description" rows="2">${this.escapeHtml(risk.description || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Wahrscheinlichkeit</label>
                                <select id="modal-risk-probability">
                                    <option value="low" ${risk.probability === 'low' ? 'selected' : ''}>Niedrig</option>
                                    <option value="medium" ${risk.probability === 'medium' ? 'selected' : ''}>Mittel</option>
                                    <option value="high" ${risk.probability === 'high' ? 'selected' : ''}>Hoch</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Auswirkung</label>
                                <select id="modal-risk-impact">
                                    <option value="low" ${risk.impact === 'low' ? 'selected' : ''}>Niedrig</option>
                                    <option value="medium" ${risk.impact === 'medium' ? 'selected' : ''}>Mittel</option>
                                    <option value="high" ${risk.impact === 'high' ? 'selected' : ''}>Hoch</option>
                                    <option value="critical" ${risk.impact === 'critical' ? 'selected' : ''}>Kritisch</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Massnahmen</label>
                            <textarea id="modal-risk-mitigation" rows="2">${this.escapeHtml(risk.mitigation || '')}</textarea>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Status</label>
                            <select id="modal-risk-status">
                                <option value="open" ${risk.status === 'open' ? 'selected' : ''}>Offen</option>
                                <option value="in_progress" ${risk.status === 'in_progress' ? 'selected' : ''}>In Bearbeitung</option>
                                <option value="mitigated" ${risk.status === 'mitigated' ? 'selected' : ''}>Mitigiert</option>
                                <option value="closed" ${risk.status === 'closed' ? 'selected' : ''}>Geschlossen</option>
                            </select>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditRisk('${risk.id}')">Speichern</button>
                            <button class="btn" onclick="UI.deleteRisk('${risk.id}')">Löschen</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);
            },

            saveEditRisk(riskId) {
                const risk = AppState.risks.find(r => r.id === riskId);
                if (!risk) return;

                risk.title = document.getElementById('modal-risk-title').value;
                risk.description = document.getElementById('modal-risk-description').value;
                risk.probability = document.getElementById('modal-risk-probability').value;
                risk.impact = document.getElementById('modal-risk-impact').value;
                risk.mitigation = document.getElementById('modal-risk-mitigation').value;
                risk.status = document.getElementById('modal-risk-status').value;

                AppState.save();
                this.closeModal();
                this.renderRisksTab();
                this.showAlert('Risiko wurde aktualisiert.');
            },

            showEditBudgetModal() {
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) return;

                const budget = project.budget || {
                    intern: 0, extern: 0, investitionen: 0, total: 0,
                    forecastIntern: 0, forecastExtern: 0, forecastInvestitionen: 0, forecastTotal: 0,
                    forecastHistory: []
                };

                const modal = this.createModal('Projektbudget & Forecast bearbeiten', `
                    <div class="grid gap-4">
                        <h4 class="font-semibold" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Budget (Soll)</h4>
                        <div>
                            <label class="text-sm font-medium">Budget Intern (${project.currency}) *</label>
                            <input type="number" id="modal-budget-intern" value="${budget.intern}" step="1000" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Budget Extern (${project.currency}) *</label>
                            <input type="number" id="modal-budget-extern" value="${budget.extern}" step="1000" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Budget Investitionen (${project.currency}) *</label>
                            <input type="number" id="modal-budget-investitionen" value="${budget.investitionen}" step="1000" required>
                        </div>
                        <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                            <span class="text-sm" style="color: var(--text-secondary);">Total Budget (Soll)</span>
                            <div class="text-xl font-bold font-mono" id="budget-total-display">
                                ${this.formatCurrency(budget.total, project.currency)}
                            </div>
                        </div>

                        <h4 class="font-semibold mt-4" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Forecast</h4>

                        <div>
                            <label class="text-sm font-medium">Forecast Intern (${project.currency}) *</label>
                            <input
                                type="number"
                                id="modal-forecast-intern"
                                value="${(typeof budget.forecastIntern === 'number' ? budget.forecastIntern : budget.intern) ?? 0}"
                                step="1000"
                                required
                            >
                        </div>
                        <div>
                            <label class="text-sm font-medium">Forecast Extern (${project.currency}) *</label>
                            <input type="number" id="modal-forecast-extern" value="${budget.forecastExtern ?? budget.extern ?? 0}" step="1000" required>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Forecast Investitionen (${project.currency}) *</label>
                            <input type="number" id="modal-forecast-investitionen" value="${budget.forecastInvestitionen ?? budget.investitionen ?? 0}" step="1000" required>
                        </div>
                        <div class="p-4" style="background: var(--bg-tertiary); border-radius: 0.5rem;">
                            <span class="text-sm" style="color: var(--text-secondary);">Total Forecast</span>
                            <div class="text-xl font-bold font-mono" id="forecast-total-display">
                                ${this.formatCurrency(budget.forecastTotal ?? budget.total ?? 0, project.currency)}
                            </div>
                        </div>
                        <div id="forecast-comment-container" class="hidden">
                            <label class="text-sm font-medium" style="color: var(--warning);">Kommentar zur Forecast-Änderung *</label>
                            <textarea id="modal-forecast-comment" rows="3" placeholder="Bitte begründen Sie die Änderung des Forecasts..." required></textarea>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">Pflichtfeld bei Änderung des Forecasts</p>
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditBudget()">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);

                // Store original forecast values (Intern is auto-calculated, so only track Extern & Investitionen)
                //const originalForecastExtern = budget.forecastExtern || budget.extern;
                //const originalForecastInvestitionen = budget.forecastInvestitionen || budget.investitionen;

                // Originalwerte inkl. intern
                const originalForecastIntern =
                    budget.forecastIntern != null ? budget.forecastIntern : (budget.intern != null ? budget.intern : 0);
                const originalForecastExtern =
                    budget.forecastExtern != null ? budget.forecastExtern : (budget.extern != null ? budget.extern : 0);
                const originalForecastInvestitionen =
                    budget.forecastInvestitionen != null ? budget.forecastInvestitionen : (budget.investitionen != null ? budget.investitionen : 0);

                const isFirstForecastEntry = !(budget.forecastInitialized === true ||
                    (Array.isArray(budget.forecastHistory) && budget.forecastHistory.length > 0));

                const updateTotals = () => {
                    const biEl = document.getElementById('modal-budget-intern');
                    const beEl = document.getElementById('modal-budget-extern');
                    const bvEl = document.getElementById('modal-budget-investitionen');

                    let intern = (biEl.value === '' ? 0 : parseFloat(biEl.value));
                    let extern = (beEl.value === '' ? 0 : parseFloat(beEl.value));
                    let investitionen = (bvEl.value === '' ? 0 : parseFloat(bvEl.value));

                    if (isNaN(intern)) intern = 0;
                    if (isNaN(extern)) extern = 0;
                    if (isNaN(investitionen)) investitionen = 0;

                    // leere Felder im UI sofort auf 0 setzen
                    if (biEl.value === '') biEl.value = '0';
                    if (beEl.value === '') beEl.value = '0';
                    if (bvEl.value === '') bvEl.value = '0';

                    const total = intern + extern + investitionen;
                    document.getElementById('budget-total-display').textContent =
                        this.formatCurrency(total, project.currency);

                    const fiEl = document.getElementById('modal-forecast-intern');
                    const feEl = document.getElementById('modal-forecast-extern');
                    const fvEl = document.getElementById('modal-forecast-investitionen');

                    let forecastIntern = (fiEl.value === '' ? 0 : parseFloat(fiEl.value));
                    let forecastExtern = (feEl.value === '' ? 0 : parseFloat(feEl.value));
                    let forecastInvestitionen = (fvEl.value === '' ? 0 : parseFloat(fvEl.value));

                    // falls parseFloat trotzdem NaN liefert (z.B. "-"), hart auf 0
                    if (isNaN(forecastIntern)) forecastIntern = 0;
                    if (isNaN(forecastExtern)) forecastExtern = 0;
                    if (isNaN(forecastInvestitionen)) forecastInvestitionen = 0;

                    // leere Felder im UI sofort auf 0 setzen (damit es auch visuell stimmt)
                    if (fiEl.value === '') fiEl.value = '0';
                    if (feEl.value === '') feEl.value = '0';
                    if (fvEl.value === '') fvEl.value = '0';

                    const forecastTotal = forecastIntern + forecastExtern + forecastInvestitionen;
                    document.getElementById('forecast-total-display').textContent =
                      this.formatCurrency(forecastTotal, project.currency);

                    // Forecast-Änderung: jetzt inkl. intern
                    const forecastChanged =
                        forecastIntern !== originalForecastIntern ||
                        forecastExtern !== originalForecastExtern ||
                        forecastInvestitionen !== originalForecastInvestitionen;

                    const commentContainer = document.getElementById('forecast-comment-container');
                    if (forecastChanged && !isFirstForecastEntry) {
                        commentContainer.classList.remove('hidden');
                    } else {
                        commentContainer.classList.add('hidden');
                    }
                };

                document.getElementById('modal-budget-intern').addEventListener('input', updateTotals);
                document.getElementById('modal-budget-extern').addEventListener('input', updateTotals);
                document.getElementById('modal-budget-investitionen').addEventListener('input', updateTotals);
                document.getElementById('modal-forecast-intern').addEventListener('input', updateTotals);   // NEU
                document.getElementById('modal-forecast-extern').addEventListener('input', updateTotals);
                document.getElementById('modal-forecast-investitionen').addEventListener('input', updateTotals);
            },

            saveEditBudget() {
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) return;

                const budget = project.budget || { forecastHistory: [] };

                const budgetInternInput = document.getElementById('modal-budget-intern');
                const budgetExternInput = document.getElementById('modal-budget-extern');
                const budgetInvestitionenInput = document.getElementById('modal-budget-investitionen');

                const forecastInternInput = document.getElementById('modal-forecast-intern');
                const forecastExternInput = document.getElementById('modal-forecast-extern');
                const forecastInvestitionenInput = document.getElementById('modal-forecast-investitionen');

                // ---------- Budget ----------
                let intern = budgetInternInput.value === '' ? 0 : parseFloat(budgetInternInput.value);
                let extern = budgetExternInput.value === '' ? 0 : parseFloat(budgetExternInput.value);
                let investitionen = budgetInvestitionenInput.value === '' ? 0 : parseFloat(budgetInvestitionenInput.value);

                if (isNaN(intern)) intern = 0;
                if (isNaN(extern)) extern = 0;
                if (isNaN(investitionen)) investitionen = 0;

                budgetInternInput.value = String(intern);
                budgetExternInput.value = String(extern);
                budgetInvestitionenInput.value = String(investitionen);

                // ---------- Forecast ----------
                let forecastIntern = forecastInternInput.value === '' ? 0 : parseFloat(forecastInternInput.value);
                let forecastExtern = forecastExternInput.value === '' ? 0 : parseFloat(forecastExternInput.value);
                let forecastInvestitionen = forecastInvestitionenInput.value === '' ? 0 : parseFloat(forecastInvestitionenInput.value);

                if (isNaN(forecastIntern)) forecastIntern = 0;
                if (isNaN(forecastExtern)) forecastExtern = 0;
                if (isNaN(forecastInvestitionen)) forecastInvestitionen = 0;

                forecastInternInput.value = String(forecastIntern);
                forecastExternInput.value = String(forecastExtern);
                forecastInvestitionenInput.value = String(forecastInvestitionen);

                // ORIGINALE Werte (darf es NUR EINMAL geben)
                const originalForecastIntern =
                budget.forecastIntern != null
                    ? budget.forecastIntern
                    : (budget.intern != null ? budget.intern : 0);
                const originalForecastExtern =
                budget.forecastExtern != null
                    ? budget.forecastExtern
                    : (budget.extern != null ? budget.extern : 0);
                const originalForecastInvestitionen =
                budget.forecastInvestitionen != null
                    ? budget.forecastInvestitionen
                    : (budget.investitionen != null ? budget.investitionen : 0);

                let originalForecastInternSafe = originalForecastIntern;
                let originalForecastExternSafe = originalForecastExtern;
                let originalForecastInvestitionenSafe = originalForecastInvestitionen;

                if (isNaN(originalForecastInternSafe)) originalForecastInternSafe = 0;
                if (isNaN(originalForecastExternSafe)) originalForecastExternSafe = 0;
                if (isNaN(originalForecastInvestitionenSafe)) originalForecastInvestitionenSafe = 0;

                const forecastChanged =
                    forecastIntern !== originalForecastIntern ||
                    forecastExtern !== originalForecastExtern ||
                    forecastInvestitionen !== originalForecastInvestitionen;

                const isFirstForecastEntry = !(budget.forecastInitialized === true ||
                    (Array.isArray(budget.forecastHistory) && budget.forecastHistory.length > 0));

                if (forecastChanged) {
                    const comment = (document.getElementById('modal-forecast-comment')?.value || '').trim();
                    if (forecastChanged && isFirstForecastEntry) {
                    budget.forecastInitialized = true; // merkt sich: Forecast wurde schon einmal gesetzt
                    }

                    // Kommentar nur ab der 2. Forecast-Änderung erzwingen
                    if (!isFirstForecastEntry && !comment) {
                        this.showAlert('Bitte geben Sie einen Kommentar zur Forecast-Änderung ein.');
                        return;
                    }

                    // History nur schreiben, wenn Kommentar verlangt wurde (also nicht beim ersten Erfassen)
                    if (!isFirstForecastEntry) {
                        const forecastHistory = budget.forecastHistory || [];
                        const previousForecastIntern = originalForecastIntern;

                        forecastHistory.push({
                            timestamp: new Date().toISOString(),
                            oldForecast: {
                                intern: previousForecastIntern,
                                extern: originalForecastExtern,
                                investitionen: originalForecastInvestitionen,
                                total: previousForecastIntern + originalForecastExtern + originalForecastInvestitionen
                            },
                            newForecast: {
                                intern: forecastIntern,
                                extern: forecastExtern,
                                investitionen: forecastInvestitionen,
                                total: forecastIntern + forecastExtern + forecastInvestitionen
                            },
                            comment
                        });

                        budget.forecastHistory = forecastHistory;
                    }
                }

                project.budget = {
                    intern,
                    extern,
                    investitionen,
                    total: intern + extern + investitionen,
                    forecastIntern,
                    forecastExtern,
                    forecastInvestitionen,
                    forecastTotal: forecastIntern + forecastExtern + forecastInvestitionen,
                    forecastHistory: budget.forecastHistory || [],
                    forecastInitialized: budget.forecastInitialized === true
                };

                AppState.save();
                this.closeModal();
                this.renderCostsTab();
                this.renderOverviewTab();
                this.showAlert('Budget und Forecast wurden aktualisiert.');
            },

            showAddResourceBookingModal() {
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) return;

                // NEW: Only show project team members
                const projectTeamMembers = AppState.getProjectTeamMembers(AppState.currentProjectId);
                const teamMemberIds = projectTeamMembers.map(ptm => ptm.memberId);
                const teamMembers = AppState.members.filter(m => teamMemberIds.includes(m.id));

                if (teamMembers.length === 0) {
                    this.showAlert('Es sind keine Teammitglieder in diesem Projekt vorhanden. Bitte fügen Sie zuerst Mitglieder zum Projektteam hinzu.');
                    return;
                }

                // NEW: Calculate real available capacity for each member (global utilization)
                const membersWithAvailability = teamMembers.map(m => {
                    const utilData = AppState.getGlobalResourceUtilization(m.id);
                    const effectiveCapacity = m.availableCapacity || 80;
                    const currentUtilization = utilData ? utilData.totalUtilization : 0;
                    const remainingCapacity = effectiveCapacity - currentUtilization;

                    // Determine visual indicator
                    let indicator = '🟢';
                    if (remainingCapacity <= 0) {
                        indicator = '🔴';
                    } else if (remainingCapacity < effectiveCapacity * 0.3) {
                        indicator = '🟡';
                    }

                    return {
                        id: m.id,
                        name: m.name,
                        role: m.role,
                        effectiveCapacity,
                        currentUtilization,
                        remainingCapacity: Math.max(0, remainingCapacity),
                        indicator
                    };
                });

                // Sort by remaining capacity (descending)
                membersWithAvailability.sort((a, b) => b.remainingCapacity - a.remainingCapacity);

                const membersOptions = membersWithAvailability.map(m =>
                    `<option value="${m.id}">${m.indicator} ${this.escapeHtml(m.name)} ? ${m.remainingCapacity}% frei (${m.effectiveCapacity}% effektiv)</option>`
                ).join('');

                const modal = this.createModal('Ressource buchen', `
                    <div class="grid gap-4">
                        <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: 0.5rem; border-left: 4px solid var(--primary); margin-bottom: 0.5rem;">
                            <strong>ℹ️ Verfügbarkeit:</strong> Die angezeigten Werte zeigen die aktuelle freie Kapazität nach Abzug aller Buchungen in anderen Projekten.
                        </div>
                        <div>
                            <label class="text-sm font-medium">Ressource *</label>
                            <select id="modal-booking-member" required>
                                <option value="">Bitte wählen...</option>
                                ${membersOptions}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium">Startdatum *</label>
                                <input type="date" id="modal-booking-start" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Enddatum *</label>
                                <input type="date" id="modal-booking-end" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Auslastung in % *</label>
                            <input type="number" id="modal-booking-capacity" min="0" max="100" step="5" placeholder="z.B. 50" required>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Prozent der verfügbaren Kapazität (z.B. 50% einer 80%-Kapazität = 40% Gesamtauslastung)
                            </p>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-booking-description" rows="2" placeholder="z.B. Backend-Entwicklung Phase 2"></textarea>
                        </div>
                        <div id="booking-warning-container" class="hidden p-4" style="background: var(--warning); color: white; border-radius: 0.5rem;">
                            <!-- Warning will be inserted here -->
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveAddResourceBooking()">Buchen</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);

                // Check for overbooking on input change
                const checkOverbooking = () => {
                    const memberId = document.getElementById('modal-booking-member').value;
                    const startDate = document.getElementById('modal-booking-start').value;
                    const endDate = document.getElementById('modal-booking-end').value;
                    const capacityPercent = parseFloat(document.getElementById('modal-booking-capacity').value) ?? 0;

                    if (!memberId || !startDate || !endDate || !capacityPercent) return;

                    const member = AppState.members.find(m => m.id === memberId);
                    if (!member) return;

                    const utilization = AppState.calculateResourceUtilization(memberId, startDate, endDate);
                    const newUtilization = utilization.utilization + capacityPercent;

                    const warningContainer = document.getElementById('booking-warning-container');
                    if (newUtilization > member.availableCapacity) {
                        warningContainer.classList.remove('hidden');
                        warningContainer.innerHTML = `
                            <strong>⚠️ WARNUNG: Überbuchung!</strong><br>
                            Ressource ${this.escapeHtml(member.name)} wird zu ${newUtilization}% verplant
                            (verfügbar: ${member.availableCapacity}%).
                        `;
                    } else {
                        warningContainer.classList.add('hidden');
                    }
                };

                document.getElementById('modal-booking-member').addEventListener('change', checkOverbooking);
                document.getElementById('modal-booking-start').addEventListener('change', checkOverbooking);
                document.getElementById('modal-booking-end').addEventListener('change', checkOverbooking);
                document.getElementById('modal-booking-capacity').addEventListener('input', checkOverbooking);
            },

            saveAddResourceBooking() {
                const memberId = document.getElementById('modal-booking-member').value;
                const startDate = document.getElementById('modal-booking-start').value;
                const endDate = document.getElementById('modal-booking-end').value;
                const capacityPercent = parseFloat(document.getElementById('modal-booking-capacity').value) ?? 0;
                const description = document.getElementById('modal-booking-description').value;

                if (!memberId || !startDate || !endDate || !capacityPercent) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                // NEW: Check if member is in project team
                if (!AppState.isInProjectTeam(AppState.currentProjectId, memberId)) {
                    this.showAlert('Fehler: Nur Mitglieder des Projektteams können gebucht werden.');
                    return;
                }

                // NEW: Validate booking dates against project timeframe
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) {
                    this.showAlert('Fehler: Kein Projekt ausgewählt.');
                    return;
                }

                const projectStart = new Date(project.startDate);
                const projectEnd = new Date(project.endDate || project.plannedEndDate);
                const bookingStart = new Date(startDate);
                const bookingEnd = new Date(endDate);

                if (bookingStart < projectStart || bookingEnd > projectEnd) {
                    this.showAlert(
                        `Die Ressource kann nur innerhalb des Projektzeitraums gebucht werden.\n\n` +
                        `Projekt: ${this.formatDate(project.startDate)} ? ${this.formatDate(project.endDate || project.plannedEndDate)}\n` +
                        `Ihre Buchung: ${this.formatDate(startDate)} ? ${this.formatDate(endDate)}`
                    );
                    return;
                }

                // NEW: Überbuchungsschutz - Blockierung bei Überbuchung
                const member = AppState.members.find(m => m.id === memberId);
                if (!member) {
                    this.showAlert('Fehler: Ressource nicht gefunden.');
                    return;
                }

                const utilization = AppState.calculateResourceUtilization(memberId, startDate, endDate);
                const newUtilization = utilization.utilization + capacityPercent;

                // NEW: Überbuchung erlaubt, aber mit deutlicher Warnung
                let overbookingWarning = '';
                if (newUtilization > member.availableCapacity) {
                    overbookingWarning = `\n\n⚠️ WARNUNG: ÜBERBUCHUNG!\n` +
                        `Ressource "${member.name}" wird zu ${newUtilization}% ausgelastet (verfügbar: ${member.availableCapacity}%).\n` +
                        `Überschreitung: ${newUtilization - member.availableCapacity}%\n` +
                        `Die Buchung wird trotzdem durchgeführt.`;
                }

                const newBooking = {
                    id: AppState.generateId(),
                    projectId: AppState.currentProjectId,
                    memberId,
                    startDate,
                    endDate,
                    capacityPercent,
                    description
                };

                AppState.resourceBookings.push(newBooking);
                AppState.save();

                this.closeModal();
                this.renderResourcesTab();
                this.showAlert(`ℹ️ Ressource "${member.name}" wurde erfolgreich gebucht (${capacityPercent}%).${overbookingWarning}`);
            },

            deleteResourceBooking(id) {
                this.showConfirmDialog('Möchten Sie diese Ressourcenbuchung wirklich löschen?', () => {
                    AppState.resourceBookings = AppState.resourceBookings.filter(b => b.id !== id);
                    AppState.save();
                    this.renderResourcesTab();
                });
            },

            // NEW: Show edit resource booking modal
            showEditResourceBookingModal(bookingId) {
                const booking = AppState.resourceBookings.find(b => b.id === bookingId);
                if (!booking) {
                    this.showAlert('Buchung nicht gefunden.');
                    return;
                }

                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) {
                    this.showAlert('Projekt nicht gefunden.');
                    return;
                }

                const projectTeamMembers = AppState.getProjectTeamMembers(AppState.currentProjectId);

                const modal = this.createModal('Ressourcenbuchung bearbeiten', `
                    <div class="grid gap-4">
                        <div>
                            <label class="text-sm font-medium">Ressource *</label>
                            <select id="modal-edit-booking-member" required>
                                ${projectTeamMembers.map(member => `
                                    <option value="${member.id}" ${member.id === booking.memberId ? 'selected' : ''}>
                                        ${this.escapeHtml(member.name)} (${this.escapeHtml(member.role)})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-sm font-medium">Von *</label>
                                <input type="date" id="modal-edit-booking-start" value="${booking.startDate}" required>
                            </div>
                            <div>
                                <label class="text-sm font-medium">Bis *</label>
                                <input type="date" id="modal-edit-booking-end" value="${booking.endDate}" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Kapazität (%) *</label>
                            <input type="number" id="modal-edit-booking-capacity" min="0" max="100" step="5" value="${booking.capacityPercent}" required>
                            <p class="text-sm mt-1" style="color: var(--text-secondary);">
                                Wie viel Prozent der verfügbaren Kapazität wird gebucht?
                            </p>
                        </div>
                        <div>
                            <label class="text-sm font-medium">Beschreibung</label>
                            <textarea id="modal-edit-booking-description" rows="2" placeholder="Optional: Beschreibung der Tätigkeit">${this.escapeHtml(booking.description || '')}</textarea>
                        </div>
                        <div id="edit-booking-warning-container" class="hidden p-4" style="background: var(--warning); color: white; border-radius: 0.5rem;">
                            <!-- Warning will be inserted here -->
                        </div>
                        <div class="flex gap-4" style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="UI.saveEditResourceBooking('${bookingId}')">Speichern</button>
                            <button class="btn" onclick="UI.closeModal()">Abbrechen</button>
                        </div>
                    </div>
                `);

                // Check for overbooking on input change
                const checkOverbooking = () => {
                    const memberId = document.getElementById('modal-edit-booking-member').value;
                    const startDate = document.getElementById('modal-edit-booking-start').value;
                    const endDate = document.getElementById('modal-edit-booking-end').value;
                    const capacityPercent = parseFloat(document.getElementById('modal-edit-booking-capacity').value) ?? 0;

                    if (!memberId || !startDate || !endDate || !capacityPercent) return;

                    const member = AppState.members.find(m => m.id === memberId);
                    if (!member) return;

                    // Calculate utilization excluding current booking
                    const utilization = AppState.calculateResourceUtilization(memberId, startDate, endDate, bookingId);
                    const newUtilization = utilization.utilization + capacityPercent;

                    const warningContainer = document.getElementById('edit-booking-warning-container');
                    if (newUtilization > member.availableCapacity) {
                        warningContainer.classList.remove('hidden');
                        warningContainer.innerHTML = `
                            <strong>⚠️ WARNUNG: Überbuchung!</strong><br>
                            Ressource ${this.escapeHtml(member.name)} wird zu ${newUtilization}% verplant
                            (verfügbar: ${member.availableCapacity}%).
                        `;
                    } else {
                        warningContainer.classList.add('hidden');
                    }
                };

                document.getElementById('modal-edit-booking-member').addEventListener('change', checkOverbooking);
                document.getElementById('modal-edit-booking-start').addEventListener('change', checkOverbooking);
                document.getElementById('modal-edit-booking-end').addEventListener('change', checkOverbooking);
                document.getElementById('modal-edit-booking-capacity').addEventListener('input', checkOverbooking);

                // Initial check
                checkOverbooking();
            },

            // NEW: Save edited resource booking
            saveEditResourceBooking(bookingId) {
                const booking = AppState.resourceBookings.find(b => b.id === bookingId);
                if (!booking) {
                    this.showAlert('Buchung nicht gefunden.');
                    return;
                }

                const memberId = document.getElementById('modal-edit-booking-member').value;
                const startDate = document.getElementById('modal-edit-booking-start').value;
                const endDate = document.getElementById('modal-edit-booking-end').value;
                const capacityPercent = parseFloat(document.getElementById('modal-edit-booking-capacity').value) ?? 0;
                const description = document.getElementById('modal-edit-booking-description').value;

                if (!memberId || !startDate || !endDate || !capacityPercent) {
                    this.showAlert('Bitte füllen Sie alle Pflichtfelder aus.');
                    return;
                }

                // Check if member is in project team
                if (!AppState.isInProjectTeam(AppState.currentProjectId, memberId)) {
                    this.showAlert('Fehler: Nur Mitglieder des Projektteams können gebucht werden.');
                    return;
                }

                // Validate booking dates against project timeframe
                const project = AppState.getProject(AppState.currentProjectId);
                if (!project) {
                    this.showAlert('Fehler: Kein Projekt ausgewählt.');
                    return;
                }

                const projectStart = new Date(project.startDate);
                const projectEnd = new Date(project.endDate || project.plannedEndDate);
                const bookingStart = new Date(startDate);
                const bookingEnd = new Date(endDate);

                if (bookingStart < projectStart || bookingEnd > projectEnd) {
                    this.showAlert(
                        `Die Ressource kann nur innerhalb des Projektzeitraums gebucht werden.\n\n` +
                        `Projekt: ${this.formatDate(project.startDate)} ? ${this.formatDate(project.endDate || project.plannedEndDate)}\n` +
                        `Ihre Buchung: ${this.formatDate(startDate)} ? ${this.formatDate(endDate)}`
                    );
                    return;
                }

                const member = AppState.members.find(m => m.id === memberId);
                if (!member) {
                    this.showAlert('Fehler: Ressource nicht gefunden.');
                    return;
                }

                // Calculate utilization excluding current booking
                const utilization = AppState.calculateResourceUtilization(memberId, startDate, endDate, bookingId);
                const newUtilization = utilization.utilization + capacityPercent;

                // Overbooking warning
                let overbookingWarning = '';
                if (newUtilization > member.availableCapacity) {
                    overbookingWarning = `\n\n⚠️ WARNUNG: ÜBERBUCHUNG!\n` +
                        `Ressource "${member.name}" wird zu ${newUtilization}% ausgelastet (verfügbar: ${member.availableCapacity}%).\n` +
                        `Überschreitung: ${newUtilization - member.availableCapacity}%\n` +
                        `Die Änderung wird trotzdem gespeichert.`;
                }

                // Update booking
                booking.memberId = memberId;
                booking.startDate = startDate;
                booking.endDate = endDate;
                booking.capacityPercent = capacityPercent;
                booking.description = description;

                AppState.save();

                this.closeModal();
                this.renderResourcesTab();
                this.showAlert(`✅ Buchung für "${member.name}" wurde erfolgreich aktualisiert (${capacityPercent}%).${overbookingWarning}`);
            },

            createModal(title, content, buttons = [], options = {}) {
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.id = 'modal-overlay';

                // Determine modal width class
                const modalClass = options.wide ? 'modal-content-wide' : 'modal-content';

                // Generate buttons HTML
                let buttonsHTML = '';
                if (buttons.length > 0) {
                    buttonsHTML = `
                        <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.75rem; justify-content: flex-end;">
                            ${buttons.map((btn, index) => `
                                <button
                                    id="modal-btn-${index}"
                                    class="btn ${btn.primary ? 'btn-primary' : ''}"
                                    ${btn.disabled ? 'disabled' : ''}
                                >
                                    ${btn.label}
                                </button>
                            `).join('')}
                        </div>
                    `;
                }

                overlay.innerHTML = `
                    <div class="${modalClass}">
                        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
                            <h3 class="font-semibold text-lg">${title}</h3>
                        </div>
                        <div style="padding: 1.5rem;">
                            ${content}
                        </div>
                        ${buttonsHTML}
                    </div>
                `;

                document.body.appendChild(overlay);

                // Attach button event listeners
                buttons.forEach((btn, index) => {
                    const buttonElement = document.getElementById(`modal-btn-${index}`);
                    if (buttonElement && btn.onClick) {
                        buttonElement.addEventListener('click', btn.onClick);
                    }
                });

                // Close on outside press (pointerdown avoids accidental close when text is selected via drag)
                overlay.addEventListener('pointerdown', (e) => {
                  if (e.target === overlay) {
                    this.closeModal();
                  }
                });


                return overlay;
            },

            closeModal() {
                const overlay = document.getElementById('modal-overlay');
                if (overlay) {
                    overlay.remove();
                }
            },

            showAlert(message) {
                const alertDiv = document.createElement('div');
                alertDiv.style.cssText = `
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    padding: 1rem 1.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 30px var(--shadow);
                    z-index: 9999;
                    max-width: 400px;
                `;
                alertDiv.textContent = message;
                document.body.appendChild(alertDiv);

                setTimeout(() => {
                    alertDiv.remove();
                }, 3000);
            },

            showConfirmDialog(message, onConfirm) {
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.style.zIndex = '10000';

                overlay.innerHTML = `
                    <div class="modal-content" style="max-width: 400px;">
                        <div style="padding: 1.5rem;">
                            <p style="margin-bottom: 1.5rem; color: var(--text-primary);">${this.escapeHtml(message)}</p>
                            <div class="flex gap-4" style="justify-content: flex-end;">
                                <button class="btn" id="confirm-cancel">Abbrechen</button>
                                <button class="btn" id="confirm-ok" style="background: var(--danger); color: white; border-color: var(--danger);">Löschen</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(overlay);

                const cancelBtn = overlay.querySelector('#confirm-cancel');
                const okBtn = overlay.querySelector('#confirm-ok');

                cancelBtn.addEventListener('click', () => {
                    overlay.remove();
                });

                okBtn.addEventListener('click', () => {
                    overlay.remove();
                    onConfirm();
                });

                overlay.addEventListener('pointerdown', (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                });

            },

            // ============================================================
            // DELETE FUNCTIONS
            // ============================================================

            deleteCost(id) {
                this.showConfirmDialog('Möchten Sie diese Kostenposition wirklich löschen?', () => {
                    AppState.costs = AppState.costs.filter(c => c.id !== id);
                    AppState.save();
                    this.renderCostsTab();
                    this.renderOverviewTab();
                });
            },

            deleteMilestone(id) {
                this.showConfirmDialog('Möchten Sie diesen Gate wirklich löschen?', () => {
                    AppState.milestones = AppState.milestones.filter(m => m.id !== id);
                    AppState.save();
                    this.renderMilestonesTab();
                    this.renderOverviewTab();
                });
            },

            deleteRisk(id) {
                this.showConfirmDialog('Möchten Sie dieses Risiko wirklich löschen?', () => {
                    AppState.risks = AppState.risks.filter(r => r.id !== id);
                    AppState.save();
                    this.renderRisksTab();
                    this.renderOverviewTab();
                });
            },

            deleteTask(id) {
                this.showConfirmDialog('Möchten Sie diese Aufgabe wirklich löschen?', () => {
                    AppState.tasks = AppState.tasks.filter(t => t.id !== id);
                    AppState.save();
                    this.closeModal();
                    this.renderTasksTab();
                    this.renderOverviewTab();
                    if (this.currentTab === 'gantt') {
                        this.renderGanttTab();
                    }
                });
            },

            // ============================================================
            // HELPER FUNCTIONS
            // ============================================================

            renderSOPWithColor(project) {
                if (!project.sopCurrentDate) {
                    return '<span style="color: var(--text-secondary);">?</span>';
                }

                const sopCurrent = new Date(project.sopCurrentDate);
                const sopBaseline = project.sopBaselineDate ? new Date(project.sopBaselineDate) : null;

                // Format the date
                const formattedDate = this.formatDate(project.sopCurrentDate);

                // Determine color based on comparison with baseline
                let color = 'var(--text-primary)'; // default
                let symbol = '';

                if (sopBaseline) {
                    if (sopCurrent > sopBaseline) {
                        // SOP moved backward (delayed) - red
                        color = 'var(--danger)';
                        symbol = '🔴 ';
                    } else if (sopCurrent < sopBaseline) {
                        // SOP moved forward (earlier) - green
                        color = 'var(--success)';
                        symbol = '🟢 ';
                    }
                }

                return `<strong style="color: ${color};">${symbol}${formattedDate}</strong>`;
            },

            async exportAllProjectsToPDF() {
                const projects = AppState.getAllProjects();

                if (projects.length === 0) {
                    this.showAlert('Keine Projekte vorhanden.');
                    return;
                }

                this.showAlert('Erstelle Management-PDF...');

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                let yPos = 20;

                // Title page
                doc.setFontSize(20);
                doc.text('Projekt Management Snapshot', 105, yPos, { align: 'center' });
                doc.setFontSize(12);
                yPos += 10;
                doc.text(`Erstellt am ${this.formatDateDDMMYYYY(new Date())}`, 105, yPos, { align: 'center' });
                yPos += 15;

                // Loop through all projects
                projects.forEach((project, index) => {
                    if (index > 0) {
                        doc.addPage();
                        yPos = 20;
                    }

                    // Project header
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.text(project.name, 20, yPos);
                    yPos += 8;

                    // Project details
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');

                    const status = AppState.calculateProjectStatus(project.id);
                    const statusColor = status === 'green' ? [34, 197, 94] : status === 'yellow' ? [251, 191, 36] : [239, 68, 68];
                    doc.setTextColor(...statusColor);
                    doc.text(`Status: ${status.toUpperCase()}`, 20, yPos);
                    doc.setTextColor(0, 0, 0);
                    yPos += 6;

                    // Priorität
                    doc.text(`Prio: ${project.priority || '-'}`, 20, yPos);
                    yPos += 6;

                    doc.text(`Phase: ${project.phase || '-'}`, 20, yPos);
                    yPos += 6;
                    doc.text(`Fortschritt: ${project.progress ?? 0}%`, 20, yPos);
                    yPos += 6;
                    doc.text(`Projektleiter: ${project.projectLead || '-'}`, 20, yPos);
                    yPos += 6;
                    doc.text(`Start: ${this.formatDate(project.startDate)} | Ende: ${this.formatDate(project.endDate || project.plannedEndDate)}`, 20, yPos);
                    yPos += 6;

                    // SOP
                    if (project.sopCurrentDate) {
                        const sopCurrent = new Date(project.sopCurrentDate);
                        const sopBaseline = project.sopBaselineDate ? new Date(project.sopBaselineDate) : null;
                        let sopIndicator = '';

                        if (sopBaseline) {
                            if (sopCurrent > sopBaseline) {
                                sopIndicator = ' (verzögert)';
                            } else if (sopCurrent < sopBaseline) {
                                sopIndicator = ' (vorgezogen)';
                            }
                        }

                        doc.text(`SOP: ${this.formatDate(project.sopCurrentDate)}${sopIndicator}`, 20, yPos);
                        yPos += 6;
                    }
                    yPos += 4;

                    // Kosten-Daten für Balkendiagramm vorbereiten
                    const costs = AppState.getProjectCosts(project.id);
                    const costsByCategory = AppState.getProjectCostsByCategory(project.id);
                    const totalActual = costs.reduce((sum, c) => sum + (c.amount ?? 0), 0);
                    const totalForecast = costsByCategory.intern.forecast + costsByCategory.extern.forecast + costsByCategory.investitionen.forecast;
                    const budget = project.budget ? project.budget.total : 0;

                    // Vertikales Kosten-Balkendiagramm (Budget / IST / Forecast)
                    try {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Kostenübersicht:', 20, yPos);
                        yPos += 8;

                        const maxValue = Math.max(budget, totalActual, totalForecast);
                        const chartHeight = 60; // Höhe des Diagramms
                        const barWidth = 25; // Breite jedes Balkens
                        const spacing = 15; // Abstand zwischen Balken
                        const chartBaseY = yPos + chartHeight; // Grundlinie des Diagramms
                        const startX = 30;

                        // Y-Achse
                        doc.setDrawColor(100);
                        doc.line(startX - 5, yPos, startX - 5, chartBaseY);

                        // X-Achse
                        doc.line(startX - 5, chartBaseY, startX + (3 * (barWidth + spacing)), chartBaseY);

                        // Budget Bar (vertikal)
                        const budgetBarHeight = maxValue > 0 ? (budget / maxValue) * chartHeight : 0;
                        doc.setFillColor(37, 99, 235);
                        doc.rect(startX, chartBaseY - budgetBarHeight, barWidth, budgetBarHeight, 'F');
                        doc.setDrawColor(37, 99, 235);
                        doc.rect(startX, chartBaseY - budgetBarHeight, barWidth, budgetBarHeight);

                        // Label unter dem Balken
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        doc.text('Budget', startX + barWidth/2, chartBaseY + 5, { align: 'center' });
                        doc.text(this.formatCurrency(budget, project.currency), startX + barWidth/2, chartBaseY + 10, { align: 'center' });

                        // IST Bar (vertikal)
                        const actualBarHeight = maxValue > 0 ? (totalActual / maxValue) * chartHeight : 0;
                        doc.setFillColor(22, 163, 74);
                        doc.rect(startX + barWidth + spacing, chartBaseY - actualBarHeight, barWidth, actualBarHeight, 'F');
                        doc.setDrawColor(22, 163, 74);
                        doc.rect(startX + barWidth + spacing, chartBaseY - actualBarHeight, barWidth, actualBarHeight);

                        // Label unter dem Balken
                        doc.text('IST', startX + barWidth + spacing + barWidth/2, chartBaseY + 5, { align: 'center' });
                        doc.text(this.formatCurrency(totalActual, project.currency), startX + barWidth + spacing + barWidth/2, chartBaseY + 10, { align: 'center' });

                        // Forecast Bar (vertikal)
                        const forecastBarHeight = maxValue > 0 ? (totalForecast / maxValue) * chartHeight : 0;
                        doc.setFillColor(234, 88, 12);
                        doc.rect(startX + 2 * (barWidth + spacing), chartBaseY - forecastBarHeight, barWidth, forecastBarHeight, 'F');
                        doc.setDrawColor(234, 88, 12);
                        doc.rect(startX + 2 * (barWidth + spacing), chartBaseY - forecastBarHeight, barWidth, forecastBarHeight);

                        // Label unter dem Balken
                        doc.text('Forecast', startX + 2 * (barWidth + spacing) + barWidth/2, chartBaseY + 5, { align: 'center' });
                        doc.text(this.formatCurrency(totalForecast, project.currency), startX + 2 * (barWidth + spacing) + barWidth/2, chartBaseY + 10, { align: 'center' });

                        doc.setFontSize(10);
                        yPos = chartBaseY + 18;
                    } catch (err) {
                        // Silently skip chart if there's an error
                        console.log('Chart konnte nicht erstellt werden, fahre ohne Chart fort:', err);
                    }

                    // Risks
                    const risks = AppState.getProjectRisks(project.id);
                    if (risks.length > 0) {
                        doc.setFont('helvetica', 'bold');
                        doc.text('Risiken:', 20, yPos);
                        yPos += 6;
                        doc.setFont('helvetica', 'normal');

                        risks.forEach((risk, riskIndex) => {
                            if (yPos > 270) {
                                doc.addPage();
                                yPos = 20;
                            }

                            const impactColor = risk.impact === 'critical' || risk.impact === 'high' ? [239, 68, 68] : risk.impact === 'medium' ? [251, 191, 36] : [34, 197, 94];
                            doc.setTextColor(...impactColor);
                            doc.text(`? ${risk.title || risk.description}`, 25, yPos);
                            doc.setTextColor(0, 0, 0);
                            yPos += 5;
                            doc.setFontSize(8);
                            doc.text(`  Impact: ${risk.impact || '-'} | Wahrscheinlichkeit: ${risk.probability || '-'}`, 27, yPos);
                            yPos += 5;
                            if (risk.mitigation) {
                                doc.text(`  Massnahmen: ${risk.mitigation.substring(0, 80)}...`, 27, yPos);
                                yPos += 5;
                            }
                            doc.setFontSize(10);
                            yPos += 2;
                        });
                    } else {
                        doc.text('Keine Risiken erfasst.', 25, yPos);
                        yPos += 6;
                    }

                    // Management Comment
                    if (project.managementComment && project.managementComment.trim()) {
                        yPos += 5;

                        // Check if we need a new page
                        if (yPos > 250) {
                            doc.addPage();
                            yPos = 20;
                        }

                        doc.setFont('helvetica', 'bold');
                        doc.text('Management-Kommentar:', 20, yPos);
                        yPos += 6;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);

                        // Split comment into lines that fit the page width
                        const commentLines = doc.splitTextToSize(project.managementComment, 170);
                        commentLines.forEach(line => {
                            if (yPos > 280) {
                                doc.addPage();
                                yPos = 20;
                            }
                            doc.text(line, 25, yPos);
                            yPos += 5;
                        });

                        doc.setFontSize(10);
                        yPos += 3;
                    }

                    // Add separator
                    if (index < projects.length - 1) {
                        doc.setDrawColor(200, 200, 200);
                        doc.line(20, yPos + 5, 190, yPos + 5);
                    }
                });

                // Save PDF
                const fileName = `Management_Snapshot_${new Date().toISOString().split('T')[0]}.pdf`;
                doc.save(fileName);

                this.showAlert('PDF erfolgreich erstellt!');
            },

            exportGanttToPDF() {
                try {
                    const project = AppState.getProject(AppState.currentProjectId);
                    if (!project) {
                        this.showAlert('Kein Projekt ausgewählt.');
                        return;
                    }

                    // Check if jsPDF is loaded
                    if (!window.jspdf || !window.jspdf.jsPDF) {
                        this.showAlert('Fehler: PDF-Bibliothek konnte nicht geladen werden. Bitte Seite neu laden.');
                        return;
                    }

                    const { jsPDF } = window.jspdf;

                    // Get the SVG element from the Gantt chart
                    const ganttContainer = document.getElementById('gantt-chart-container');
                    const svgElement = ganttContainer ? ganttContainer.querySelector('svg') : null;

                    if (!svgElement) {
                        this.showAlert('Gantt-Chart konnte nicht gefunden werden. Bitte stellen Sie sicher, dass das Chart angezeigt wird.');
                        return;
                    }

                    // Create PDF in landscape orientation
                    const doc = new jsPDF('landscape', 'mm', 'a4');

                    // Add title
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Gantt-Zeitplan: ${project.name}`, 15, 15);

                    // Add date
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Erstellt am: ${this.formatDateDDMMYYYY(new Date())}`, 15, 22);

                    // Get SVG dimensions
                    const svgWidth = parseFloat(svgElement.getAttribute('width')) || 800;
                    const svgHeight = parseFloat(svgElement.getAttribute('height')) || 400;

                    // Calculate scaling to fit A4 landscape (297mm x 210mm, with margins)
                    const maxWidth = 267; // 297mm - 30mm margins
                    const maxHeight = 165; // 210mm - 45mm margins (more space for title)
                    const scale = Math.min(maxWidth / svgWidth, maxHeight / svgHeight, 1);

                    // Clone SVG to avoid modifying the original
                    const svgClone = svgElement.cloneNode(true);

                    // Set explicit dimensions if missing
                    if (!svgClone.getAttribute('width')) {
                        svgClone.setAttribute('width', svgWidth);
                    }
                    if (!svgClone.getAttribute('height')) {
                        svgClone.setAttribute('height', svgHeight);
                    }

                    // Convert SVG to data URL with proper encoding
                    const svgData = new XMLSerializer().serializeToString(svgClone);
                    const encodedData = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

                    // Create canvas to convert SVG to image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = svgWidth;
                    canvas.height = svgHeight;

                    const img = new Image();

                    img.onload = () => {
                        try {
                            ctx.drawImage(img, 0, 0);
                            const imgData = canvas.toDataURL('image/png');

                            const scaledWidth = svgWidth * scale;
                            const scaledHeight = svgHeight * scale;

                            // Center the image
                            const x = (297 - scaledWidth) / 2;
                            const y = 30;

                            doc.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

                            // Save PDF
                            const fileName = `${project.name.replace(/\s+/g, '_')}_Gantt.pdf`;
                            doc.save(fileName);

                            this.showAlert('Gantt-Zeitplan wurde als PDF exportiert.');
                        } catch (err) {
                            console.error('Fehler beim Konvertieren:', err);
                            this.showAlert('Fehler beim Konvertieren des Gantt-Charts. Verwende Fallback-Methode...');
                            this.exportGanttFallback(doc, project);
                        }
                    };

                    img.onerror = (err) => {
                        console.error('Bild-Ladefehler:', err);
                        this.showAlert('Fehler beim Laden des Charts. Verwende Fallback-Methode...');
                        this.exportGanttFallback(doc, project);
                    };

                    img.src = encodedData;

                } catch (err) {
                    console.error('Fehler beim Export:', err);
                    this.showAlert(`Fehler beim PDF-Export: ${err.message || 'Unbekannter Fehler'}`);
                }
            },

            exportGanttFallback(doc, project) {
                // Fallback: Export task list as text
                try {
                    const tasks = AppState.getProjectTasks(AppState.currentProjectId);
                    const milestones = AppState.getProjectMilestones(AppState.currentProjectId);

                    let yPos = 35;
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Aufgaben:', 15, yPos);
                    yPos += 8;

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');

                    tasks.forEach((task, index) => {
                        if (yPos > 190) {
                            doc.addPage();
                            yPos = 20;
                        }
                        const taskName = task.name || task.description || 'Unnamed Task';
                        const taskDates = `${this.formatDate(task.startDate)} - ${this.formatDate(task.endDate)}`;
                        doc.text(`${index + 1}. ${taskName}`, 15, yPos);
                        yPos += 6;
                        doc.text(`   ${taskDates} (${task.progress ?? 0}%)`, 15, yPos);
                        yPos += 8;
                    });

                    if (milestones.length > 0) {
                        yPos += 5;
                        doc.setFont('helvetica', 'bold');
                        doc.text('Gates:', 15, yPos);
                        yPos += 8;
                        doc.setFont('helvetica', 'normal');

                        milestones.forEach((ms, index) => {
                            if (yPos > 190) {
                                doc.addPage();
                                yPos = 20;
                            }
                            doc.text(`${index + 1}. ${ms.name} - ${this.formatDate(ms.date || ms.plannedDate)}`, 15, yPos);
                            yPos += 8;
                        });
                    }

                    const fileName = `${project.name.replace(/\s+/g, '_')}_Gantt.pdf`;
                    doc.save(fileName);
                    this.showAlert('Gantt-Zeitplan wurde als Text-Liste exportiert.');
                } catch (err) {
                    console.error('Fallback-Fehler:', err);
                    this.showAlert('Export konnte nicht abgeschlossen werden.');
                }
            },

            formatCurrency(amount, currency) {
                return new Intl.NumberFormat('de-CH', {
                    style: 'currency',
                    currency: currency || 'CHF'
                }).format(amount);
            },

            formatDate(dateStr) {
                if (!dateStr) return '-';
                return this.formatDateDDMMYYYY(dateStr);
            },

            formatDateDDMMYYYY(dateStr) {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '-';

                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();

                return `${day}.${month}.${year}`;
            },

            getCostTypeLabel(type) {
                const labels = {
                    'internal_hours': 'Interne Stunden',
                    'external_service': 'Externe Dienstleistung',
                    'investment': 'Investitionen'
                };
                return labels[type] || type;
            },

            escapeHtml(text) {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },


            getRiskCategoryLabel(category) {
                const labels = {
                    'time': 'Zeit',
                    'finance': 'Finanzen',
                    'tech': 'Technik',
                    'organization': 'Organisation'
                };
                return labels[category] || category;
            },

            getTaskStatusLabel(status) {
                const labels = {
                    'open': '⚪ Offen',
                    'in_progress': '🔵 In Arbeit',
                    'done': '🟢 Erledigt',
                    'blocked': '🔴 Blockiert'
                };
                return labels[status] || status;
            },

            getBudgetVarianceHTML(forecast, budget, currency) {
                const variance = forecast - budget;

                // Percent only makes sense if budget > 0. If budget is 0, we evaluate only absolute thresholds.
                const hasBudget = budget > 0;
                const variancePercent = hasBudget ? (variance / budget) * 100 : null;

                // Traffic-light logic:
                // - Green: variance <= 0 (forecast at or below budget)
                // - Orange: variance > 0 AND (variancePercent <= 10% OR variance <= 100000)
                // - Red: variance > 0 AND (variancePercent > 10% OR variance > 100000)
                let color = 'var(--success)';
                let icon = '🟢';

                if (variance > 0) {
                    const overPercent = hasBudget ? variancePercent > 10 : false;
                    const withinPercent = hasBudget ? (variancePercent > 0 && variancePercent <= 10) : false;

                    const overAbs = variance > 100000;
                    const withinAbs = variance <= 100000;

                    const isRed = overAbs || overPercent || (!hasBudget && overAbs);
                    const isOrange = !isRed && (withinPercent || withinAbs);

                    if (isRed) {
                        color = 'var(--danger)';
                        icon = '🔴';
                    } else if (isOrange) {
                        color = '#eab308'; // warmes Gelb (Tailwind yellow-400)
                        icon = '🟠';
                    }
                }

                const percentDisplay = hasBudget ? `(${Math.abs(variancePercent).toFixed(1)}%)` : '(—)';

                return `
                    <span style="color: ${color};">
                        ${icon} ${this.formatCurrency(Math.abs(variance), currency)}
                        ${percentDisplay}
                    </span>
                `;
            }

        };
		const AppState = {
			projects: [],
			members: [],              // GLOBAL: Alle Ressourcen/Mitarbeiter
			projectTeamMembers: [],   // Projekt-spezifische Teamzuordnungen
			costs: [],
			milestones: [],
			risks: [],
			tasks: [],
			phaseTemplates: [],
			resourceBookings: [],     // Ressourcenbuchungen
			currentProjectId: null,
			currentUser: 'Aktueller Benutzer', // Simplified for demo

			save() {
				const data = {
					projects: this.projects,
					members: this.members,
					projectTeamMembers: this.projectTeamMembers,
					costs: this.costs,
					milestones: this.milestones,
					risks: this.risks,
					tasks: this.tasks,
					phaseTemplates: this.phaseTemplates,
					resourceBookings: this.resourceBookings
				};

				DataService.save(data).catch(err => {
					console.error('Fehler beim Speichern in Azure /api/state:', err);
					// Optional: Backup in localStorage
					// try {
					//     window.localStorage.setItem('projecthub_data_backup', JSON.stringify(data));
					// } catch (e) {}
				});
			},

			async load() {
				try {
					const data = await DataService.load();

					this.projects = data.projects || [];
					this.members = data.members || [];
					this.projectTeamMembers = data.projectTeamMembers || [];
					this.costs = data.costs || [];
					this.milestones = data.milestones || [];
					this.risks = data.risks || [];
					this.tasks = data.tasks || [];
					this.phaseTemplates = data.phaseTemplates || [];
					this.resourceBookings = data.resourceBookings || [];

					// Migration alter Struktur: partialAmount ? partialPayments (falls vorhanden)
					this.costs.forEach(cost => {
						if (cost.partialAmount && !cost.partialPayments) {
							cost.partialPayments = [{
								date: cost.date,
								amount: cost.partialAmount
							}];
							delete cost.partialAmount;
						}
					});
				} catch (e) {
					console.error('Fehler beim Laden aus Azure /api/state:', e);
				}
				this.initializeDefaults();
			},

            initializeDefaults() {
                // Add default phase template if none exists
                if (this.phaseTemplates.length === 0) {
                    this.phaseTemplates.push({
                        id: this.generateId(),
                        name: 'Standard Software-Projekt',
                        phases: [
                            { name: 'Konzept', order: 1 },
                            { name: 'Entwicklung', order: 2 },
                            { name: 'Test', order: 3 },
                            { name: 'Rollout', order: 4 }
                        ],
                        defaultMilestones: [
                            { name: 'Konzept abgeschlossen', phase: 'Konzept' },
                            { name: 'MVP fertig', phase: 'Entwicklung' },
                            { name: 'Testing abgeschlossen', phase: 'Test' },
                            { name: 'Go-Live', phase: 'Rollout' }
                        ]
                    });
                }
            },

            generateId() {
                return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            },

            getProject(id) {
                return this.projects.find(p => p.id === id);
            },

            getProjectCosts(projectId) {
                return this.costs.filter(c => c.projectId === projectId);
            },

            getProjectMilestones(projectId) {
                return this.milestones.filter(m => m.projectId === projectId);
            },

            getProjectRisks(projectId) {
                return this.risks.filter(r => r.projectId === projectId);
            },

            // NEW: Projektteam-Management
            getProjectTeamMembers(projectId) {
                return this.projectTeamMembers.filter(ptm => ptm.projectId === projectId);
            },

            isInProjectTeam(projectId, memberId) {
                return this.projectTeamMembers.some(ptm =>
                    ptm.projectId === projectId && ptm.memberId === memberId
                );
            },

            addToProjectTeam(projectId, memberId, roleInProject = '') {
                if (this.isInProjectTeam(projectId, memberId)) {
                    return false; // Already in team
                }

                this.projectTeamMembers.push({
                    id: this.generateId(),
                    projectId,
                    memberId,
                    roleInProject,
                    addedDate: new Date().toISOString().split('T')[0]
                });

                this.save();
                return true;
            },

            removeFromProjectTeam(projectId, memberId) {
                const index = this.projectTeamMembers.findIndex(ptm =>
                    ptm.projectId === projectId && ptm.memberId === memberId
                );

                if (index === -1) return false;

                this.projectTeamMembers.splice(index, 1);

                // Remove related bookings
                this.resourceBookings = this.resourceBookings.filter(rb =>
                    !(rb.projectId === projectId && rb.memberId === memberId)
                );

                // Optionally: Clear task assignments
                this.tasks.forEach(task => {
                    if (task.projectId === projectId && task.responsible === memberId) {
                        task.responsible = null;
                    }
                });

                this.save();
                return true;
            },

            getProjectTasks(projectId) {
                return this.tasks.filter(t => t.projectId === projectId);
            },

            getProjectResourceBookings(projectId) {
                return this.resourceBookings.filter(b => b.projectId === projectId);
            },

            getResourceBookings(memberId) {
                return this.resourceBookings.filter(b => b.memberId === memberId);
            },

            // Calculate costs by category
            getProjectCostsByCategory(projectId) {
                const costs = this.getProjectCosts(projectId);
                const project = this.getProject(projectId);
                const budget = project?.budget || {};

                // NEW: Auto-calculate forecast from resource bookings
                const forecastFromBookings = this.calculateForecastFromBookings(projectId);

                return {
                    intern: {
                        budget: budget.intern || 0,
                        actual: costs.filter(c => c.type === 'internal_hours').reduce((sum, c) => sum + (c.amount || 0), 0),
                        forecast: budget.forecastIntern || budget.intern || 0
                    },
                    extern: {
                        budget: budget.extern || 0,
                        actual: costs.filter(c => c.type === 'external_service').reduce((sum, c) => sum + (c.amount || 0), 0),
                        forecast: budget.forecastExtern || budget.extern || 0
                    },
                    investitionen: {
                        budget: budget.investitionen || 0,
                        actual: costs.filter(c => c.type === 'investment').reduce((sum, c) => sum + (c.amount || 0), 0),
                        forecast: budget.forecastInvestitionen || budget.investitionen || 0
                    }
                };
            },

            // Calculate burnrate (cost per month)
            calculateBurnrate(projectId) {
                const project = this.getProject(projectId);
                if (!project) return 0;

                const costs = this.getProjectCosts(projectId);
                const totalActual = costs.reduce((sum, c) => sum + (c.amount || 0), 0);

                const startDate = new Date(project.startDate);
                const today = new Date();
                const monthsElapsed = Math.max(1, (today - startDate) / (1000 * 60 * 60 * 24 * 30.44));

                return totalActual / monthsElapsed;
            },

            // Calculate resource utilization for a time period
            calculateResourceUtilization(memberId, startDate, endDate, excludeBookingId = null) {
                const member = this.members.find(m => m.id === memberId);
                if (!member) return { utilization: 0, overbookWarning: false };

                let bookings = this.resourceBookings.filter(b => {
                    // Exclude specific booking if provided (for edit scenarios)
                    if (excludeBookingId && b.id === excludeBookingId) return false;

                    return b.memberId === memberId &&
                        new Date(b.startDate) <= new Date(endDate) &&
                        new Date(b.endDate) >= new Date(startDate);
                });

                // Filter only bookings from active projects (unless excludeBookingId is provided)
                if (!excludeBookingId) {
                    bookings = bookings.filter(b => {
                        const project = this.projects.find(p => p.id === b.projectId);
                        return project && (project.projectStatus === 'active' || !project.projectStatus);
                    });
                }

                const totalBooked = bookings.reduce((sum, b) => sum + (b.capacityPercent || 0), 0);
                const utilization = totalBooked;
                const overbookWarning = utilization > member.availableCapacity;

                return {
                    utilization,
                    overbookWarning,
                    availableCapacity: member.availableCapacity,
                    bookings: bookings.length,
                    bookingDetails: bookings
                };
            },

            // NEW: Get global resource utilization across all projects
            getGlobalResourceUtilization(memberId) {
                const member = this.members.find(m => m.id === memberId);
                if (!member) return null;

                // Get all bookings for this member
                const allBookings = this.resourceBookings.filter(b => b.memberId === memberId);

                // Group by project
                const byProject = {};
                allBookings.forEach(booking => {
                    const project = this.projects.find(p => p.id === booking.projectId);
                    if (!project) return;

                    if (!byProject[project.id]) {
                        byProject[project.id] = {
                            projectName: project.name,
                            projectStatus: project.projectStatus || 'active',
                            bookings: [],
                            totalCapacity: 0
                        };
                    }

                    byProject[project.id].bookings.push(booking);
                    // Only count active projects
                    if (project.projectStatus === 'active') {
                        byProject[project.id].totalCapacity += booking.capacityPercent || 0;
                    }
                });

                // Calculate total utilization (only active projects)
                const totalUtilization = Object.values(byProject)
                    .filter(p => p.projectStatus === 'active')
                    .reduce((sum, p) => sum + p.totalCapacity, 0);

                return {
                    member,
                    totalUtilization,
                    isOverbooked: totalUtilization > member.availableCapacity,
                    byProject: Object.values(byProject),
                    availableCapacity: member.availableCapacity,
                    remainingCapacity: member.availableCapacity - totalUtilization
                };
            },

            // NEW: Archive/Complete project
            setProjectStatus(projectId, newStatus) {
                const project = this.projects.find(p => p.id === projectId);
                if (!project) return false;

                const validStatuses = ['active', 'completed', 'archived'];
                if (!validStatuses.includes(newStatus)) return false;

                project.projectStatus = newStatus;

                // If completing/archiving, set completion date
                if (newStatus !== 'active' && !project.completedDate) {
                    project.completedDate = new Date().toISOString().split('T')[0];
                }

                this.save();
                return true;
            },

            // NEW: Calculate FTE for a project
            calculateProjectFTE(projectId) {
                const bookings = this.resourceBookings.filter(b => b.projectId === projectId);

                if (bookings.length === 0) return 0;

                // Calculate total FTE across all resources
                // FTE = (capacityPercent / 100) * (employmentLevel / 100)
                const totalFTE = bookings.reduce((sum, booking) => {
                    const member = this.members.find(m => m.id === booking.memberId);
                    if (!member) return sum;

                    // capacityPercent is percentage of available capacity
                    // Convert to FTE: (capacity% / 100) * (availableCapacity / 100)
                    const fte = (booking.capacityPercent / 100) * ((member.availableCapacity || 80) / 100);
                    return sum + fte;
                }, 0);

                return Math.round(totalFTE * 100) / 100;
            },

            // NEW: Calculate forecast costs from resource bookings
            calculateForecastFromBookings(projectId) {
                const bookings = this.resourceBookings.filter(b => b.projectId === projectId);

                if (bookings.length === 0) return 0;

                // Calculate total cost from all bookings
                const totalCost = bookings.reduce((sum, booking) => {
                    const member = this.members.find(m => m.id === booking.memberId);
                    if (!member) return sum;

                    // Calculate booking duration in working days
                    const startDate = new Date(booking.startDate);
                    const endDate = new Date(booking.endDate);
                    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    const workingDays = durationDays * (5/7); // Approximate working days (5 out of 7 days)

                    // Calculate FTE for this booking
                    const fte = (booking.capacityPercent / 100) * ((member.availableCapacity || 80) / 100);

                    // Calculate hours: FTE × working days × 8 hours/day
                    const hours = fte * workingDays * 8;

                    // Calculate cost: hours × hourly rate
                    const cost = hours * (member.hourlyRateInternal || 0);

                    return sum + cost;
                }, 0);

                return Math.round(totalCost);
            },

            // NEW: Calculate total available FTE in organization
            getTotalAvailableFTE() {
                const activeMembers = this.members.filter(m => m.active !== false);
                const totalFTE = activeMembers.reduce((sum, m) => {
                    // FTE = availableCapacity / 100
                    const fte = (m.availableCapacity || 80) / 100;
                    return sum + fte;
                }, 0);
                return Math.round(totalFTE * 100) / 100;
            },

            // NEW: Calculate utilization by competency group
            getCompetencyGroupUtilization() {
                const activeMembers = this.members.filter(m => m.active !== false);
                const groups = {};

                // Initialize groups
                activeMembers.forEach(member => {
                    const group = member.competencyGroup || 'Nicht zugewiesen';
                    if (!groups[group]) {
                        groups[group] = {
                            name: group,
                            totalCapacity: 0,
                            bookedFTE: 0,
                            members: []
                        };
                    }

                    const availableFTE = (member.availableCapacity || 80) / 100;
                    groups[group].totalCapacity += availableFTE;
                    groups[group].members.push(member.id);
                });

                // Calculate booked FTE for each group
                const allBookings = this.resourceBookings || [];

                allBookings.forEach(booking => {
                    const member = this.members.find(m => m.id === booking.memberId);
                    if (!member || member.active === false) return;

                    const group = member.competencyGroup || 'Nicht zugewiesen';
                    if (!groups[group]) return;

                    // Calculate FTE for this booking
                    const fte = (booking.capacityPercent / 100) * ((member.availableCapacity || 80) / 100);
                    groups[group].bookedFTE += fte;
                });

                // Calculate utilization percentage for each group
                const result = Object.values(groups).map(group => ({
                    name: group.name,
                    totalCapacity: Math.round(group.totalCapacity * 100) / 100,
                    bookedFTE: Math.round(group.bookedFTE * 100) / 100,
                    utilizationPercent: group.totalCapacity > 0
                        ? Math.round((group.bookedFTE / group.totalCapacity) * 100)
                        : 0,
                    isOverloaded: group.bookedFTE > group.totalCapacity,
                    memberCount: group.members.length
                }));

                // Sort by name
                return result.sort((a, b) => a.name.localeCompare(b.name));
            },

            // NEW: Calculate FTE utilization over time periods (weeks)
            calculateFTETimeline() {
                // FIXED: Include projects without projectStatus (backward compatibility)
                const activeProjects = this.projects.filter(p => p.projectStatus === 'active' || !p.projectStatus);
                if (activeProjects.length === 0) return [];

                // NEW: Limit to 9 weeks (4 past, current, 4 future)
                const today = new Date();
                const currentWeekStart = new Date(today);
                currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday of current week

                const minDate = new Date(currentWeekStart);
                minDate.setDate(currentWeekStart.getDate() - (4 * 7)); // 4 weeks back

                const maxDate = new Date(currentWeekStart);
                maxDate.setDate(currentWeekStart.getDate() + (5 * 7) - 1); // current + 4 future weeks

                const weekCount = 9; // Fixed: 4 past + 1 current + 4 future

                // Generate weekly periods
                const periods = [];

                for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
                    const periodStart = new Date(minDate);
                    periodStart.setDate(minDate.getDate() + (weekIndex * 7));

                    const periodEnd = new Date(periodStart);
                    periodEnd.setDate(periodEnd.getDate() + 6);

                    // Calculate FTE for this period
                    let totalFTE = 0;
                    const projectFTEs = [];

                    activeProjects.forEach(project => {
                        const projectStart = new Date(project.startDate);
                        // FIXED: Handle both endDate and plannedEndDate
                        const projectEnd = new Date(project.endDate || project.plannedEndDate);

                        // Check if project overlaps with this period
                        if (projectStart <= periodEnd && projectEnd >= periodStart) {
                            // Get bookings for this project in this period
                            const bookings = this.resourceBookings.filter(b => {
                                if (b.projectId !== project.id) return false;
                                const bookingStart = new Date(b.startDate);
                                const bookingEnd = new Date(b.endDate);
                                return bookingStart <= periodEnd && bookingEnd >= periodStart;
                            });

                            let projectFTE = 0;
                            bookings.forEach(booking => {
                                const member = this.members.find(m => m.id === booking.memberId);
                                if (!member) return;
                                const fte = (booking.capacityPercent / 100) * ((member.availableCapacity || 80) / 100);
                                projectFTE += fte;
                            });

                            if (projectFTE > 0) {
                                totalFTE += projectFTE;
                                projectFTEs.push({
                                    projectId: project.id,
                                    projectName: project.name,
                                    fte: Math.round(projectFTE * 100) / 100
                                });
                            }
                        }
                    });

                    periods.push({
                        startDate: periodStart.toISOString().split('T')[0],
                        endDate: periodEnd.toISOString().split('T')[0],
                        totalFTE: Math.round(totalFTE * 100) / 100,
                        projects: projectFTEs,
                        isOverloaded: totalFTE > this.getTotalAvailableFTE()
                    });
                }

                return periods;
            },

            // NEW: Get only active projects
            getActiveProjects() {
                return this.projects.filter(p => p.projectStatus === 'active' || !p.projectStatus);
            },

            // NEW: Get all projects including archived
            getAllProjects(includeArchived = false) {
                if (!includeArchived) {
                    return this.projects.filter(p => p.projectStatus !== 'archived');
                }
                return this.projects;
            },

            // Calculate Critical Path using CPM (Critical Path Method)
            calculateCriticalPath(projectId) {
                const tasks = this.getProjectTasks(projectId);
                if (tasks.length === 0) return { criticalPath: [], taskData: {} };

                // Initialize task data
                const taskData = {};
                tasks.forEach(task => {
                    taskData[task.id] = {
                        id: task.id,
                        name: task.name,
                        duration: task.duration || this.calculateDuration(task.startDate, task.endDate),
                        dependencies: task.dependencies || [],
                        earlyStart: 0,
                        earlyFinish: 0,
                        lateStart: 0,
                        lateFinish: 0,
                        slack: 0,
                        isCritical: false
                    };
                });

                // Forward Pass - Calculate Early Start and Early Finish
                const visited = new Set();
                const calculateEarly = (taskId) => {
                    if (visited.has(taskId)) return;
                    visited.add(taskId);

                    const task = taskData[taskId];
                    if (!task) return;

                    // Calculate earlyStart based on dependencies
                    let maxEarlyFinish = 0;
                    if (task.dependencies && task.dependencies.length > 0) {
                        task.dependencies.forEach(dep => {
                            calculateEarly(dep.task);
                            const depTask = taskData[dep.task];
                            if (depTask && depTask.earlyFinish > maxEarlyFinish) {
                                maxEarlyFinish = depTask.earlyFinish;
                            }
                        });
                    }

                    task.earlyStart = maxEarlyFinish;
                    task.earlyFinish = task.earlyStart + task.duration;
                };

                // Calculate early times for all tasks
                tasks.forEach(t => calculateEarly(t.id));

                // Find project completion time (maximum earlyFinish)
                const projectCompletionTime = Math.max(...Object.values(taskData).map(t => t.earlyFinish));

                // Backward Pass - Calculate Late Start and Late Finish
                const backwardVisited = new Set();
                const calculateLate = (taskId) => {
                    if (backwardVisited.has(taskId)) return;
                    backwardVisited.add(taskId);

                    const task = taskData[taskId];
                    if (!task) return;

                    // Find tasks that depend on this task
                    const dependentTasks = Object.values(taskData).filter(t =>
                        t.dependencies && t.dependencies.some(dep => dep.task === taskId)
                    );

                    if (dependentTasks.length === 0) {
                        // This is an end task
                        task.lateFinish = projectCompletionTime;
                    } else {
                        // Calculate lateFinish as minimum lateStart of dependent tasks
                        let minLateStart = Infinity;
                        dependentTasks.forEach(depTask => {
                            calculateLate(depTask.id);
                            if (depTask.lateStart < minLateStart) {
                                minLateStart = depTask.lateStart;
                            }
                        });
                        task.lateFinish = minLateStart;
                    }

                    task.lateStart = task.lateFinish - task.duration;
                    task.slack = task.lateStart - task.earlyStart;
                    task.isCritical = task.slack === 0;
                };

                // Calculate late times for all tasks
                tasks.forEach(t => calculateLate(t.id));

                // Extract critical path
                const criticalPath = Object.values(taskData)
                    .filter(t => t.isCritical)
                    .sort((a, b) => a.earlyStart - b.earlyStart)
                    .map(t => t.id);

                return { criticalPath, taskData, projectCompletionTime };
            },

            // Helper: Calculate duration in days between two dates
            calculateDuration(startDate, endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays || 1;
            },

            calculateProjectStatus(projectId) {
                const project = this.getProject(projectId);
                if (!project || project.status.manualOverride) return project.status.light;

                // Auto-calculate based on budget, timeline, and risks
                const costsByCategory = this.getProjectCostsByCategory(projectId);
                const totalForecast = costsByCategory.intern.forecast + costsByCategory.extern.forecast + costsByCategory.investitionen.forecast;
                const totalBudget = project.budget ? project.budget.total : 0;

                // Budget variance based on forecast vs. budget
                const budgetVariance = totalBudget > 0 ? ((totalForecast - totalBudget) / totalBudget) * 100 : 0;

                const highRisks = this.getProjectRisks(projectId).filter(r => r.impact === 'high' || r.impact === 'critical').length;

                const today = new Date();
                const endDate = new Date(project.plannedEndDate);
                const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                // Red: Budget overrun > 15%, > 3 high risks, or past deadline
                if (budgetVariance > 15 || highRisks > 3 || daysRemaining < 0) {
                    return 'red';
                }
                // Yellow: Budget overrun > 5%, > 1 high risk, or < 30 days remaining
                else if (budgetVariance > 5 || highRisks > 1 || daysRemaining < 30) {
                    return 'yellow';
                }
                return 'green';
            }
        };

		window.AppState = AppState; 

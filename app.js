/**
 * IronTrack - Workout Tracker App
 * Core Logic
 */

// --- State Management ---
const state = {
    exercises: [], // List of available exercises
    workouts: [],  // Saved workout templates
    history: [],   // Completed workout sessions
    activeSession: null, // Currently running workout
    currentView: 'home'
};

// --- Constants ---
const STORAGE_KEY = 'irontrack_data';

// --- Initialization ---
function init() {
    loadData();
    setupRouting();
    render();
}

// --- Data Persistence ---
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        state.exercises = parsed.exercises || [];
        state.workouts = parsed.workouts || [];
        state.history = parsed.history || [];
        // We generally don't persist active session in this simple version, 
        // but could be added later.
    } else {
        // Seed initial data if empty
        seedData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        exercises: state.exercises,
        workouts: state.workouts,
        history: state.history
    }));
}

function seedData() {
    state.exercises = [
        { id: 'ex_1', name: 'Bench Press', muscle: 'Chest', type: 'Strength' },
        { id: 'ex_2', name: 'Squat', muscle: 'Legs', type: 'Strength' },
        { id: 'ex_3', name: 'Deadlift', muscle: 'Back', type: 'Strength' },
        { id: 'ex_4', name: 'Overhead Press', muscle: 'Shoulders', type: 'Strength' },
        { id: 'ex_5', name: 'Pull Up', muscle: 'Back', type: 'Bodyweight' },
        { id: 'ex_6', name: 'Dumbbell Curl', muscle: 'Biceps', type: 'Strength' },
        { id: 'ex_7', name: 'Tricep Extension', muscle: 'Triceps', type: 'Strength' }
    ];
    saveData();
}

// --- Routing ---
function setupRouting() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Handle initial load
}

function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'home';
    state.currentView = hash;
    render();
    updateActiveNav(hash);
}

function navigateTo(view) {
    window.location.hash = view;
}

// --- Rendering ---
function render() {
    const app = document.getElementById('app');
    app.innerHTML = ''; // Clear current content

    let content = '';

    switch (state.currentView) {
        case 'home':
            content = renderHome();
            break;
        case 'exercises':
            content = renderExercises();
            break;
        case 'workouts':
            content = renderWorkouts();
            break;
        case 'analytics':
            content = renderAnalytics();
            break;
        case 'create-workout':
            content = renderCreateWorkout();
            break;
        case 'active-session':
            content = renderActiveSession();
            break;
        default:
            content = renderHome();
    }

    app.innerHTML = content;

    // Attach event listeners after rendering
    attachEventListeners();

    // Render Navigation (except for active session maybe? No, keep it for now)
    if (state.currentView !== 'active-session') {
        renderBottomNav();
    }
}

function renderBottomNav() {
    const app = document.getElementById('app');
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
        <a href="#home" class="nav-item ${state.currentView === 'home' ? 'active' : ''}">
            <span class="nav-icon">🏠</span>
            <span>Home</span>
        </a>
        <a href="#workouts" class="nav-item ${state.currentView === 'workouts' ? 'active' : ''}">
            <span class="nav-icon">💪</span>
            <span>Workouts</span>
        </a>
        <a href="#exercises" class="nav-item ${state.currentView === 'exercises' ? 'active' : ''}">
            <span class="nav-icon">📋</span>
            <span>Exercises</span>
        </a>
        <a href="#analytics" class="nav-item ${state.currentView === 'analytics' ? 'active' : ''}">
            <span class="nav-icon">📈</span>
            <span>Progress</span>
        </a>
    `;
    app.appendChild(nav);
}

function updateActiveNav(view) {
    // Re-rendering nav in render() handles this, but we could optimize later
}

// --- View Renderers (Placeholders for now) ---

function renderHome() {
    return `
        <div class="container">
            <h1>Welcome Back</h1>
            <div class="card">
                <h3>Quick Start</h3>
                <p>Ready to crush it today?</p>
                <button class="btn btn-primary" onclick="startEmptyWorkout()">Start Empty Workout</button>
            </div>
            
            <h3>Recent History</h3>
            ${state.history.length === 0 ? '<p>No workouts yet.</p>' : renderRecentHistoryList()}
        </div>
    `;
}

function renderExercises() {
    return `
        <div class="container">
            <div class="flex justify-between items-center mb-md">
                <h1>Exercises</h1>
                <button class="btn btn-secondary" style="padding: 8px 16px;" onclick="alert('Add Exercise Feature Coming Soon')">+</button>
            </div>
            <div class="input-group">
                <input type="text" id="search-exercises" placeholder="Search exercises..." oninput="filterExercises(this.value)">
            </div>
            <div id="exercise-list">
                ${state.exercises.map(ex => `
                    <div class="card flex justify-between items-center">
                        <div>
                            <h3>${ex.name}</h3>
                            <p style="margin:0; font-size: 14px;">${ex.muscle} • ${ex.type}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderWorkouts() {
    return `
        <div class="container">
            <h1>My Workouts</h1>
            ${state.workouts.length === 0 ? `
                <div class="text-center mt-md">
                    <p>You haven't created any routines yet.</p>
                    <button class="btn btn-primary" onclick="navigateTo('create-workout')">Create Routine</button>
                </div>
            ` : `
                <div id="workout-list">
                    ${state.workouts.map(workout => `
                        <div class="card">
                            <div class="flex justify-between items-center mb-md">
                                <h3>${workout.name}</h3>
                                <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="deleteWorkout('${workout.id}')">Delete</button>
                            </div>
                            <p>${workout.exercises.length} Exercises</p>
                            <button class="btn btn-primary" onclick="startWorkout('${workout.id}')">Start Workout</button>
                        </div>
                    `).join('')}
                </div>
            `}
            <button class="fab" onclick="navigateTo('create-workout')">+</button>
        </div>
    `;
}

function renderCreateWorkout() {
    return `
        <div class="container">
            <h1>Create Workout</h1>
            <div class="input-group">
                <label>Workout Name</label>
                <input type="text" id="new-workout-name" placeholder="e.g., Push Day">
            </div>
            
            <h3>Select Exercises</h3>
            <div class="input-group">
                <input type="text" placeholder="Search to add..." oninput="filterSelectableExercises(this.value)">
            </div>
            
            <div id="selectable-exercise-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 24px;">
                ${state.exercises.map(ex => `
                    <div class="card flex justify-between items-center" style="padding: 12px; margin-bottom: 8px;">
                        <div>
                            <h4 style="font-size: 16px; margin:0;">${ex.name}</h4>
                            <span style="font-size: 12px; color: var(--text-secondary);">${ex.muscle}</span>
                        </div>
                        <input type="checkbox" class="exercise-select-checkbox" value="${ex.id}" style="width: 20px; height: 20px;">
                    </div>
                `).join('')}
            </div>

            <div class="flex gap-md">
                <button class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
                <button class="btn btn-primary" onclick="saveNewWorkout()">Save Workout</button>
            </div>
        </div>
    `;
}

function renderAnalytics() {
    // Get list of exercises that have history
    const options = state.exercises.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('');

    setTimeout(() => {
        initChart(state.exercises[0]?.id);
    }, 0);

    return `
        <div class="container">
            <h1>Progress</h1>
            <div class="card">
                <div class="input-group">
                    <label>Select Exercise</label>
                    <select id="analytics-exercise-select" onchange="updateChart(this.value)">
                        ${options}
                    </select>
                </div>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>
            
            <h3>History</h3>
            ${state.history.length === 0 ? '<p>No workouts yet.</p>' : renderRecentHistoryList()}
        </div>
    `;
}

function renderActiveSession() {
    if (!state.activeSession) return '<div class="container"><p>No active session.</p></div>';

    const duration = Math.floor((Date.now() - state.activeSession.startTime) / 60000);

    return `
        <div class="container">
            <div class="flex justify-between items-center mb-md">
                <h1>${state.activeSession.name}</h1>
                <span style="color: var(--primary-color); font-weight: bold;">${duration} min</span>
            </div>
            
            <div id="active-exercises-list" style="padding-bottom: 80px;">
                ${state.activeSession.exercises.map((ex, exIndex) => `
                    <div class="card">
                        <h3>${ex.name}</h3>
                        <div class="flex justify-between" style="margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border-color);">
                            <span style="width: 30px; text-align: center; font-size: 12px; color: var(--text-secondary);">Set</span>
                            <span style="flex: 1; text-align: center; font-size: 12px; color: var(--text-secondary);">kg/lbs</span>
                            <span style="flex: 1; text-align: center; font-size: 12px; color: var(--text-secondary);">Reps</span>
                            <span style="width: 30px; text-align: center; font-size: 12px; color: var(--text-secondary);">✓</span>
                        </div>
                        ${ex.sets.map((set, setIndex) => `
                            <div class="flex justify-between items-center" style="margin-bottom: 8px;">
                                <span style="width: 30px; text-align: center; color: var(--text-secondary);">${setIndex + 1}</span>
                                <input type="number" value="${set.weight}" placeholder="0" 
                                    style="flex: 1; margin: 0 4px; text-align: center; padding: 8px;"
                                    onchange="updateSet(${exIndex}, ${setIndex}, 'weight', this.value)">
                                <input type="number" value="${set.reps}" placeholder="0" 
                                    style="flex: 1; margin: 0 4px; text-align: center; padding: 8px;"
                                    onchange="updateSet(${exIndex}, ${setIndex}, 'reps', this.value)">
                                <div style="width: 30px; display: flex; justify-content: center;">
                                    <input type="checkbox" ${set.completed ? 'checked' : ''} 
                                        style="width: 20px; height: 20px;"
                                        onchange="toggleSetComplete(${exIndex}, ${setIndex})">
                                </div>
                            </div>
                        `).join('')}
                        <button class="btn btn-secondary" style="width: 100%; margin-top: 8px; font-size: 14px; padding: 8px;" onclick="addSet(${exIndex})">+ Add Set</button>
                    </div>
                `).join('')}
            </div>

            <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 16px; background: var(--bg-color); border-top: 1px solid var(--border-color); max-width: 600px; margin: 0 auto;">
                <button class="btn btn-primary" onclick="finishSession()">Finish Workout</button>
            </div>
        </div>
    `;
}

function renderRecentHistoryList() {
    // Show last 3 workouts
    const recent = state.history.slice(-3).reverse();
    return recent.map(session => `
        <div class="card">
            <h3>${session.name || 'Untitled Workout'}</h3>
            <p>${new Date(session.date).toLocaleDateString()} • ${session.duration || 0} min</p>
        </div>
    `).join('');
}

// --- Logic Helpers ---

function startEmptyWorkout() {
    state.activeSession = {
        startTime: Date.now(),
        exercises: []
    };
    navigateTo('active-session');
}

function filterExercises(query) {
    const list = document.getElementById('exercise-list');
    const filtered = state.exercises.filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()));

    list.innerHTML = filtered.map(ex => `
        <div class="card flex justify-between items-center">
            <div>
                <h3>${ex.name}</h3>
                <p style="margin:0; font-size: 14px;">${ex.muscle} • ${ex.type}</p>
            </div>
        </div>
    `).join('');
}

function saveNewWorkout() {
    const nameInput = document.getElementById('new-workout-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Please enter a workout name.');
        return;
    }

    const checkboxes = document.querySelectorAll('.exercise-select-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert('Please select at least one exercise.');
        return;
    }

    const newWorkout = {
        id: 'workout_' + Date.now(),
        name: name,
        exercises: selectedIds
    };

    state.workouts.push(newWorkout);
    saveData();
    navigateTo('workouts');
}

function deleteWorkout(id) {
    if (confirm('Are you sure you want to delete this workout?')) {
        state.workouts = state.workouts.filter(w => w.id !== id);
        saveData();
        render(); // Re-render to show updated list
    }
}

function startWorkout(workoutId) {
    const workout = state.workouts.find(w => w.id === workoutId);
    if (!workout) return;

    // Prepare active session
    state.activeSession = {
        startTime: Date.now(),
        name: workout.name,
        exercises: workout.exercises.map(exId => {
            const exDef = state.exercises.find(e => e.id === exId);
            return {
                ...exDef,
                sets: [{ weight: '', reps: '', completed: false }] // Start with one empty set
            };
        })
    };
    navigateTo('active-session');
}

function startEmptyWorkout() {
    state.activeSession = {
        startTime: Date.now(),
        name: 'Quick Workout',
        exercises: []
    };
    // Prompt to add exercises could go here, but for now just empty
    navigateTo('active-session');
}

function addSet(exIndex) {
    const previousSet = state.activeSession.exercises[exIndex].sets[state.activeSession.exercises[exIndex].sets.length - 1];
    state.activeSession.exercises[exIndex].sets.push({
        weight: previousSet ? previousSet.weight : '',
        reps: previousSet ? previousSet.reps : '',
        completed: false
    });
    render(); // Re-render to show new set
}

function updateSet(exIndex, setIndex, field, value) {
    state.activeSession.exercises[exIndex].sets[setIndex][field] = value;
    // No need to re-render for input changes as they are preserved in DOM, 
    // but we update state.
}

function toggleSetComplete(exIndex, setIndex) {
    const set = state.activeSession.exercises[exIndex].sets[setIndex];
    set.completed = !set.completed;
    // Optional: Visual feedback or auto-save
}

function finishSession() {
    if (!confirm('Finish and save this workout?')) return;

    const session = {
        id: 'session_' + Date.now(),
        date: Date.now(),
        name: state.activeSession.name,
        duration: Math.floor((Date.now() - state.activeSession.startTime) / 60000),
        exercises: state.activeSession.exercises
    };

    state.history.push(session);
    state.activeSession = null;
    saveData();
    navigateTo('analytics');
}

function filterSelectableExercises(query) {
    const list = document.getElementById('selectable-exercise-list');
    const filtered = state.exercises.filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()));

    list.innerHTML = filtered.map(ex => `
        <div class="card flex justify-between items-center" style="padding: 12px; margin-bottom: 8px;">
            <div>
                <h4 style="font-size: 16px; margin:0;">${ex.name}</h4>
                <span style="font-size: 12px; color: var(--text-secondary);">${ex.muscle}</span>
            </div>
            <input type="checkbox" class="exercise-select-checkbox" value="${ex.id}" style="width: 20px; height: 20px;">
        </div>
    `).join('');
}

// --- Analytics Helpers ---
let chartInstance = null;

function initChart(exerciseId) {
    if (!exerciseId) return;

    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Destroy existing chart if it exists to avoid canvas reuse errors
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Max Weight (kg/lbs)',
                data: [],
                borderColor: '#00E676',
                backgroundColor: 'rgba(0, 230, 118, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#333' },
                    ticks: { color: '#B0B0B0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#B0B0B0' }
                }
            },
            plugins: {
                legend: { labels: { color: '#FFF' } }
            }
        }
    });

    updateChart(exerciseId);
}

function updateChart(exerciseId) {
    if (!chartInstance) return;

    // Filter history for this exercise
    const dataPoints = [];
    const labels = [];

    state.history.forEach(session => {
        const exerciseData = session.exercises.find(ex => ex.id === exerciseId);
        if (exerciseData && exerciseData.sets.length > 0) {
            // Find max weight in this session
            const maxWeight = Math.max(...exerciseData.sets.map(s => parseFloat(s.weight) || 0));
            if (maxWeight > 0) {
                labels.push(new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
                dataPoints.push(maxWeight);
            }
        }
    });

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = dataPoints;
    chartInstance.update();
}

function attachEventListeners() {
    // Any dynamic listeners can go here
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

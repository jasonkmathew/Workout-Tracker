import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyC91rY8_FSfQfXkoFuhT0I_H_fan6VLNe0",
    authDomain: "split-workout-tracker.firebaseapp.com",
    projectId: "split-workout-tracker",
    storageBucket: "split-workout-tracker.firebasestorage.app",
    messagingSenderId: "429001339736",
    appId: "1:429001339736:web:e753739f5c827145c36b2d",
    measurementId: "G-1F6C2R60P7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- State Management ---
let currentUser = null;
let currentWeek = 1;
let currentWorkout = 'upperA';
let workoutData = {};
let chartInstance = null;

// --- Data Definitions ---
const exerciseTips = {
    "Incline Press": "Don't arch back, maintain stacked position. Brief pause at bottom. Stop 1-2\" above chest.",
    "Chest Fly": "Focus on expansion during eccentric. Don't force scapular retraction, focus on depression.",
    "Lat Pulldown": "Push elbows forward, think 'stabbing the floor'. Don't arch back. Pull DOWN, not back.",
    "Mid Back Row": "Stay upright, don't arch. Focus on shoulder extension, not retraction.",
    "Lateral Raise": "Think pushing out, not up/down. Keep arms slightly in front of you.",
    "Tricep Pushdown": "Control the eccentric, pause at stretch, squeeze at contraction.",
    "DB Curl": "Can rotate from neutral to supination through concentric for bicep focus.",
    "Leg Curl": "Lean forward from hips to lengthen hamstring. Sit back if reaching failure for more reps.",
    "Leg Extension": "Can lean back & scoot butt up for more rectus femoris activation.",
    "Squat": "Use heel elevation. Stay upright, drive knees forward. Brief pause at bottom.",
    "Adductors": "Set machine as wide as possible to force a stretch.",
    "Calf Raise": "Slightly bend knee on concentric. Hold 60sec loaded stretch after final set.",
    "Abs": "Focus on spinal flexion, not hip movement. Contract core through full range.",
    "Pullover": "Still a pulldown, not row. Stab floor with elbow, focus on scapular depression.",
    "Upper Back Row": "Keep elbows high/abducted. Initiate with shoulder extension into full retraction.",
    "Rear Delt Fly": "Start with full protraction. Think pushing outwards, don't turn into row.",
    "Shoulder Press": "Keep spine neutral, core engaged. Don't arch back or lift chest.",
    "Chest Press (RPS)": "Rest Pause: to failure, rest 20-30 breaths, repeat 3x total rounds.",
    "Lower Chest": "Drive biceps into chest, try to touch inner elbows at peak contraction.",
    "Preacher Curl": "Control eccentric, pause at stretch, hold peak contraction.",
    "Tricep Extension": "Focus on keeping upper arms still, control through full range.",
    "Lying Leg Curl": "Press hips into pad, keep spine neutral. Don't let pad leave contact.",
    "Leg Extension (RPS)": "Rest Pause: to failure, rest 20-30 breaths, repeat 3x total rounds.",
    "Romanian Deadlift": "Drive glutes back, knees over ankles. Think driving back then driving in.",
    "Lunges": "Control descent, brief pause, drive through front heel to return.",
    "Leg Raises": "Move into lumbar flexion to contract core, not just hip flexion."
};

const workouts = {
    upperA: {
        name: "Upper A",
        exercises: [
            { name: "Incline Press", sets: "1-2 sets", reps: "6-10 reps", tempo: "3:1:1:1", options: ["Incline DB Press", "Incline Smith Machine", "Incline Barbell", "Incline Press Machine"] },
            { name: "Chest Fly", sets: "2-3 sets", reps: "8-12 reps", tempo: "3:1:1:1", options: ["Chest Fly Machine", "Seated Cable Fly", "Flat DB Flys"] },
            { name: "Lat Pulldown", sets: "2-3 sets", reps: "6-10 reps", tempo: "3:1:1:1", options: ["Wide Grip", "Neutral Grip", "Pulldown Machine"] },
            { name: "Mid Back Row", sets: "2-3 sets", reps: "8-12 reps", tempo: "3:1:1:1", options: ["Seated Machine Row", "Cable Row"] },
            { name: "Lateral Raise", sets: "2-4 sets", reps: "10-15 reps", tempo: "4:1:1:1", options: ["DB Lateral Raise", "Lateral Raise Machine", "Cable Lateral Raise"] },
            { name: "Tricep Pushdown", sets: "2-4 sets", reps: "8-12 reps", tempo: "3:2:1:1", options: ["Rope", "V-Bar", "Straight Bar"] },
            { name: "DB Curl", sets: "2-4 sets", reps: "8-12 reps", tempo: "3:1:1:1", options: ["Alternating DB Curl", "Hammer Curl", "Seated", "Standing"] }
        ]
    },
    lowerA: {
        name: "Lower A",
        exercises: [
            { name: "Leg Curl", sets: "2-3 sets", reps: "8-12 reps", tempo: "4:1:1:1", options: ["Seated Leg Curl"] },
            { name: "Leg Extension", sets: "2-3 sets", reps: "8-12 reps", tempo: "3:1:1:1", options: ["Standard", "Leaning Back"] },
            { name: "Squat", sets: "1-2 sets", reps: "6-10 reps", tempo: "3:1:1:1", options: ["High Bar Back Squat", "Front Squat", "Smith Machine", "Hack Squat"] },
            { name: "Adductors", sets: "2-3 sets", reps: "10-15 reps", tempo: "3:2:1:1", options: ["Adductor Machine"] },
            { name: "Calf Raise", sets: "3-5 sets", reps: "10-15 reps", tempo: "3:2:1:2", options: ["Standing Machine", "Donkey", "Leg Press"] },
            { name: "Abs", sets: "3-5 sets", reps: "10-15 reps", tempo: "3:1:1:1", options: ["Crunch Machine", "Cable Crunches"] }
        ]
    },
    upperB: {
        name: "Upper B",
        exercises: [
            { name: "Pullover", sets: "2-3 sets", reps: "8-12 reps", tempo: "3:1:1:1", options: ["Cable Pullover", "Machine Pulldown"] },
            { name: "Upper Back Row", sets: "2-3 sets", reps: "6-10 reps", tempo: "3:1:1:2", options: ["T-Bar Row", "Machine Row", "DB Row"] },
            { name: "Rear Delt Fly", sets: "2-4 sets", reps: "10-15 reps", tempo: "3:2:1:2", options: ["Machine", "Cable", "DB Fly"] },
            { name: "Shoulder Press", sets: "1-2 sets", reps: "8-12 reps", tempo: "3:1:1:1", options: ["DB Press", "Smith Machine", "Machine Press"] },
            { name: "Chest Press (RPS)", sets: "Rest Pause", reps: "10-12 reps", tempo: "3:1:1:1", options: ["Machine Press", "Smith Bench"] },
            { name: "Lower Chest", sets: "2-3 sets", reps: "10-15 reps", tempo: "3:1:1:1", options: ["Decline Cable", "Cable Fly"] },
            { name: "Preacher Curl", sets: "2-4 sets", reps: "8-12 reps", tempo: "3:2:1:2", options: ["DB", "Cable", "Machine", "Barbell"] },
            { name: "Tricep Extension", sets: "2-4 sets", reps: "8-12 reps", tempo: "3:2:1:1", options: ["Skull Crushers", "JM Press"] }
        ]
    },
    lowerB: {
        name: "Lower B",
        exercises: [
            { name: "Lying Leg Curl", sets: "2-3 sets", reps: "8-12 reps", tempo: "4:2:1:2", options: ["Lying Leg Curl"] },
            { name: "Leg Extension (RPS)", sets: "Rest Pause", reps: "12-15 reps", tempo: "3:1:1:2", options: ["Standard", "Leaning Back"] },
            { name: "Romanian Deadlift", sets: "2 sets", reps: "8-12 reps", tempo: "4:1:1:1", options: ["Dumbbells", "Barbell", "Belt Squat"] },
            { name: "Lunges", sets: "2 sets", reps: "8-12 reps/leg", tempo: "3:1:1:1", options: ["Walking DB", "Split Squat", "Bulgarian", "Leg Press"] },
            { name: "Calf Raise", sets: "3-5 sets", reps: "8-12 reps", tempo: "3:2:1:2", options: ["Standing Machine", "Donkey", "Leg Press"] },
            { name: "Leg Raises", sets: "3-5 sets", reps: "AMRAP", tempo: "3:1:1:1", options: ["Hanging", "Machine", "Lying"] }
        ]
    }
};

// --- Auth Functions ---
window.handleGoogleAuth = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Google auth error:', error);
        alert(error.message);
    }
};

window.handleEmailAuth = async (isSignUp) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        alert(error.message);
    }
};

window.handleLogout = async () => {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// --- Data Management ---
function initializeWorkoutData() {
    workoutData = {};
    for (let week = 1; week <= 12; week++) {
        workoutData[week] = {};
        for (let workoutKey in workouts) {
            workoutData[week][workoutKey] = {};
            workouts[workoutKey].exercises.forEach((exercise, index) => {
                workoutData[week][workoutKey][index] = {
                    selectedExercise: exercise.options[0],
                    sets: [{ weight: '', reps: '' }, { weight: '', reps: '' }],
                    comments: ''
                };
            });
        }
    }
}

async function loadUserData() {
    if (!currentUser) return;
    document.getElementById('loadingScreen').classList.remove('hidden');

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.workouts) {
                workoutData = userData.workouts;
            } else {
                initializeWorkoutData();
            }
        } else {
            initializeWorkoutData();
            await saveUserData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        initializeWorkoutData();
    }

    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    renderApp();
    initAnalytics();
}

async function saveUserData() {
    if (!currentUser) return;
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
            workouts: workoutData,
            lastUpdated: new Date()
        }, { merge: true });

        showSaveIndicator();
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 2000);
}

// --- UI Rendering ---
function renderApp() {
    document.getElementById('userInfo').textContent = currentUser.email.split('@')[0];
    document.getElementById('avatar').textContent = currentUser.email[0].toUpperCase();

    // Setup selectors
    const weekSelect = document.getElementById('weekSelect');
    weekSelect.value = currentWeek;
    weekSelect.onchange = (e) => {
        currentWeek = parseInt(e.target.value);
        renderWorkout();
    };

    const workoutSelect = document.getElementById('workoutSelect');
    workoutSelect.value = currentWorkout;
    workoutSelect.onchange = (e) => {
        currentWorkout = e.target.value;
        renderWorkout();
        updateAnalytics();
    };

    renderWorkout();
    updateAnalytics();
}

function renderWorkout() {
    const content = document.getElementById('workoutContent');

    if (currentWorkout === 'rest1' || currentWorkout === 'rest2') {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <h2 style="font-size: 2rem; margin-bottom: 10px;">🛌 Rest Day</h2>
                <p style="color: var(--text-secondary);">Recovery is when growth happens. Eat well and sleep well!</p>
            </div>
        `;
        return;
    }

    const workout = workouts[currentWorkout];
    let html = '';

    workout.exercises.forEach((exercise, index) => {
        const exerciseData = workoutData[currentWeek][currentWorkout][index];
        const previousWeekData = currentWeek > 1 ? workoutData[currentWeek - 1][currentWorkout][index] : null;
        const tips = exerciseTips[exercise.name] || "Focus on proper form and controlled movement.";

        html += `
            <div class="exercise-card">
                <div class="exercise-header">
                    <div>
                        <div class="exercise-title">${exercise.name}</div>
                        <div class="exercise-meta">${exercise.sets} • ${exercise.reps} • ${exercise.tempo}</div>
                    </div>
                    <select class="exercise-select" 
                            style="width: auto; padding: 6px; font-size: 0.85rem;"
                            onchange="window.updateExerciseSelection(${index}, this.value)">
                        ${exercise.options.map(option => `
                            <option value="${option}" ${exerciseData.selectedExercise === option ? 'selected' : ''}>
                                ${option}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div id="sets-${index}" class="sets-container">
                    ${generateSetsHTML(index, exerciseData, previousWeekData)}
                </div>
                
                <button class="btn btn-secondary" style="margin-top: 12px; font-size: 0.85rem; padding: 8px;" onclick="window.addSet(${index})">
                    + Add Set
                </button>
                
                <div class="tips-box">
                    <div class="tips-title">Pro Tip</div>
                    <div class="tips-content">${tips}</div>
                </div>
                
                <div style="margin-top: 12px;">
                    <textarea 
                        placeholder="Notes on form, weight feel, etc..."
                        style="min-height: 60px; font-size: 0.85rem;"
                        onchange="window.updateComments(${index}, this.value)"
                    >${exerciseData.comments}</textarea>
                </div>
            </div>
        `;
    });

    content.innerHTML = html;
}

function generateSetsHTML(exerciseIndex, exerciseData, previousWeekData) {
    let html = '';
    const currentSets = exerciseData.sets.length;
    const previousSets = previousWeekData ? previousWeekData.sets.length : 0;
    const maxSets = Math.max(currentSets, previousSets, 2);

    // Ensure enough sets exist
    while (exerciseData.sets.length < maxSets) {
        exerciseData.sets.push({ weight: '', reps: '' });
    }

    for (let i = 0; i < maxSets; i++) {
        const currentSet = exerciseData.sets[i] || { weight: '', reps: '' };
        const previousSet = previousWeekData && previousWeekData.sets[i] ? previousWeekData.sets[i] : null;

        const weightVal = currentSet.weight !== '' ? currentSet.weight : (previousSet && currentWeek > 1 ? previousSet.weight : '');
        const repsVal = currentSet.reps !== '' ? currentSet.reps : (previousSet && currentWeek > 1 ? previousSet.reps : '');

        const isCurrent = currentSet.weight !== '' || currentSet.reps !== '';
        const isPrev = !isCurrent && previousSet && currentWeek > 1;

        const inputClass = isCurrent ? 'current' : (isPrev ? 'previous' : '');

        html += `
            <div class="set-row">
                <span class="set-number">S${i + 1}</span>
                <input type="number" 
                       class="set-input ${inputClass}" 
                       placeholder="${isPrev ? (previousSet.weight || '-') : 'Lbs'}"
                       value="${weightVal}"
                       onchange="window.updateSetData(${exerciseIndex}, ${i}, 'weight', this.value)"
                       onfocus="this.classList.remove('previous'); this.classList.add('current')">
                <input type="number" 
                       class="set-input ${inputClass}" 
                       placeholder="${isPrev ? (previousSet.reps || '-') : 'Reps'}"
                       value="${repsVal}"
                       onchange="window.updateSetData(${exerciseIndex}, ${i}, 'reps', this.value)"
                       onfocus="this.classList.remove('previous'); this.classList.add('current')">
                ${i > 1 ? `<button class="btn-icon" onclick="window.removeSet(${exerciseIndex}, ${i})">×</button>` : '<span></span>'}
            </div>
        `;
    }
    return html;
}

// --- Global Actions (exposed to window for HTML event handlers) ---
window.updateExerciseSelection = (idx, val) => {
    workoutData[currentWeek][currentWorkout][idx].selectedExercise = val;
    saveUserData();
};

window.updateSetData = (exIdx, setIdx, field, val) => {
    if (!workoutData[currentWeek][currentWorkout][exIdx].sets[setIdx]) {
        workoutData[currentWeek][currentWorkout][exIdx].sets[setIdx] = { weight: '', reps: '' };
    }
    workoutData[currentWeek][currentWorkout][exIdx].sets[setIdx][field] = val;
    saveUserData();
};

window.updateComments = (idx, val) => {
    workoutData[currentWeek][currentWorkout][idx].comments = val;
    saveUserData();
};

window.addSet = (idx) => {
    workoutData[currentWeek][currentWorkout][idx].sets.push({ weight: '', reps: '' });
    renderWorkout(); // Re-render to show new set
    saveUserData();
};

window.removeSet = (exIdx, setIdx) => {
    workoutData[currentWeek][currentWorkout][exIdx].sets.splice(setIdx, 1);
    renderWorkout();
    saveUserData();
};

// --- Analytics ---
function initAnalytics() {
    const workoutSelect = document.getElementById('chartWorkoutSelect');
    const exerciseSelect = document.getElementById('chartExerciseSelect');

    // Populate Workout Select
    workoutSelect.innerHTML = '';
    Object.keys(workouts).forEach(key => {
        if (key.startsWith('rest')) return;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = workouts[key].name;
        workoutSelect.appendChild(opt);
    });

    // Listeners
    workoutSelect.onchange = () => {
        updateChartExerciseOptions();
        updateAnalytics();
    };

    exerciseSelect.onchange = () => {
        updateAnalytics();
    };

    // Initial population
    workoutSelect.value = currentWorkout.startsWith('rest') ? 'upperA' : currentWorkout;
    updateChartExerciseOptions();
}

function updateChartExerciseOptions() {
    const workoutKey = document.getElementById('chartWorkoutSelect').value;
    const exerciseSelect = document.getElementById('chartExerciseSelect');

    exerciseSelect.innerHTML = '';
    const workout = workouts[workoutKey];

    workout.exercises.forEach((ex, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = ex.name;
        exerciseSelect.appendChild(opt);
    });
}

function updateAnalytics() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const workoutKey = document.getElementById('chartWorkoutSelect').value;
    const exerciseIdx = document.getElementById('chartExerciseSelect').value;

    const labels = [];
    const weightData = [];
    const repsData = [];

    for (let i = 1; i <= 12; i++) {
        labels.push(`W${i}`);
        let weight = 0;
        let reps = 0;

        if (workoutData[i] && workoutData[i][workoutKey] && workoutData[i][workoutKey][exerciseIdx]) {
            const sets = workoutData[i][workoutKey][exerciseIdx].sets;
            // Find best set (highest weight)
            const bestSet = sets.reduce((prev, current) => {
                const prevW = parseFloat(prev.weight) || 0;
                const currW = parseFloat(current.weight) || 0;
                return currW > prevW ? current : prev;
            }, { weight: 0, reps: 0 });

            weight = parseFloat(bestSet.weight) || 0;
            reps = parseFloat(bestSet.reps) || 0;
        }

        weightData.push(weight);
        repsData.push(reps);
    }

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Weight (lbs)',
                    data: weightData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Reps',
                    data: repsData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.0)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' },
                    title: { display: true, text: 'Weight', color: '#3b82f6' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#94a3b8' },
                    title: { display: true, text: 'Reps', color: '#10b981' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('authContainer').classList.add('hidden');
        loadUserData();
    } else {
        currentUser = null;
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
        document.getElementById('loadingScreen').classList.add('hidden');
    }
});

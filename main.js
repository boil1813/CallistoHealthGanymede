import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQpKkh7gcamN5cqHJ4GKnYtRVFjccVA_w",
  authDomain: "callistohealth-18aeb.firebaseapp.com",
  projectId: "callistohealth-18aeb",
  storageBucket: "callistohealth-18aeb.firebasestorage.app",
  messagingSenderId: "160546906695",
  appId: "1:160546906695:web:e56a001490f57e5d7b0762"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const USER_DOC_ID = "main_user_data";
const userDocRef = doc(db, "data", USER_DOC_ID);

// Initialize Data structure
let MOCK_DATA = {
    weight: null,
    targetWeight: null, // Added target weight
    breakfast: [],
    lunch: [],
    dinner: [],
    postWorkout: [], // Added post-workout
    exercise: []
};

// Function to save data to Firebase Firestore
window.saveData = async function() {
    try {
        await setDoc(userDocRef, MOCK_DATA);
        console.log("Data saved to Firestore");
    } catch (error) {
        console.error("Error saving to Firestore:", error);
    }
};

// Function to render all UI components based on current MOCK_DATA
window.renderAll = function() {
    window.updateSummary();
    ['breakfast', 'lunch', 'dinner', 'postWorkout', 'exercise'].forEach(listType => {
        const el = document.getElementById(`${listType}-tasks`);
        if (el && typeof el.render === 'function') el.render();
    });
};

// Helper to get today's date string
function getTodayString() {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
}

// Real-time synchronization with Firestore
onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        const todayStr = getTodayString();

        // Check if it's a new day
        if (data.lastAccessedDate && data.lastAccessedDate !== todayStr) {
            // New day detected: Keep target weight, clear current weight, uncheck all tasks
            MOCK_DATA = data;
            MOCK_DATA.weight = null;
            ['breakfast', 'lunch', 'dinner', 'postWorkout', 'exercise'].forEach(listType => {
                if (MOCK_DATA[listType]) {
                    MOCK_DATA[listType].forEach(task => task.completed = false);
                }
            });
            MOCK_DATA.lastAccessedDate = todayStr;
            
            // Save the reset data back to Firestore
            window.saveData();
        } else {
            // Same day, just load the data normally
            MOCK_DATA = data;
            if (!MOCK_DATA.lastAccessedDate) {
                MOCK_DATA.lastAccessedDate = todayStr;
                window.saveData();
            }
        }
        
        window.renderAll();
    } else {
        // First time initialization if document doesn't exist
        MOCK_DATA.lastAccessedDate = getTodayString();
        window.saveData();
    }
});

window.updateSummary = function() {
    const summaryWidget = document.querySelector('summary-widget');
    if (summaryWidget && typeof summaryWidget.render === 'function') {
        summaryWidget.render();
    }
};

window.toggleTask = function(listType, id) {
    const task = MOCK_DATA[listType].find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        const taskListElement = document.getElementById(`${listType}-tasks`);
        if (taskListElement && typeof taskListElement.render === 'function') {
            taskListElement.render();
        }
        window.updateSummary();
        window.saveData();
    }
};

// Global function to handle deleting tasks
window.deleteTask = function(listType, id) {
    MOCK_DATA[listType] = MOCK_DATA[listType].filter(task => task.id !== id);
    const taskListElement = document.getElementById(`${listType}-tasks`);
    if (taskListElement && typeof taskListElement.render === 'function') {
        taskListElement.render();
    }
    window.updateSummary();
    window.saveData();
};

// ==========================================================================
// Web Component: <summary-widget>
// ==========================================================================
class SummaryWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        // Calculate Diet Progress
        const dietTasks = [...(MOCK_DATA.breakfast || []), ...(MOCK_DATA.lunch || []), ...(MOCK_DATA.dinner || []), ...(MOCK_DATA.postWorkout || [])];
        const totalDiet = dietTasks.length;
        const completedDiet = dietTasks.filter(t => t.completed).length;
        const dietPercent = totalDiet === 0 ? 0 : Math.round((completedDiet / totalDiet) * 100);

        // Calculate Exercise Progress
        const exerciseTasks = MOCK_DATA.exercise || [];
        const totalExercise = exerciseTasks.length;
        const completedExercise = exerciseTasks.filter(t => t.completed).length;
        const exercisePercent = totalExercise === 0 ? 0 : Math.round((completedExercise / totalExercise) * 100);

        let weightHtml = '';
        
        // Target Weight HTML
        let targetWeightHtml = '';
        if (MOCK_DATA.targetWeight) {
            targetWeightHtml = `
                <div class="target-weight-display">
                    목표: <strong>${MOCK_DATA.targetWeight}kg</strong>
                    <button onclick="document.querySelector('summary-widget').editTargetWeight()" class="icon-btn mini" title="목표 수정">
                        <span class="material-icons-round" style="font-size: 14px;">edit</span>
                    </button>
                </div>
            `;
        } else {
            targetWeightHtml = `
                <div class="add-weight-form mini" style="margin-top: 4px;">
                    <span style="font-size:0.8rem; color:var(--color-text-muted);">목표:</span>
                    <input type="number" step="0.1" id="summary-target-weight-input" placeholder="00.0" style="width: 50px; font-size:0.85rem; padding: 2px 4px;">
                    <button onclick="document.querySelector('summary-widget').recordTargetWeight()" class="btn mini">저장</button>
                </div>
            `;
        }

        // Current Weight HTML
        if (MOCK_DATA.weight) {
            let diffHtml = '';
            if (MOCK_DATA.targetWeight) {
                const diff = (parseFloat(MOCK_DATA.weight) - parseFloat(MOCK_DATA.targetWeight)).toFixed(1);
                if (diff > 0) {
                    diffHtml = `<div class="weight-diff">목표까지 <strong>-${diff}kg</strong></div>`;
                } else if (diff < 0) {
                    diffHtml = `<div class="weight-diff success">목표 초과 달성! (+${Math.abs(diff)}kg)</div>`;
                } else {
                    diffHtml = `<div class="weight-diff success">목표 달성! 🎉</div>`;
                }
            }

            weightHtml = `
                <div class="weight-recorded">
                    <span class="value highlight">${MOCK_DATA.weight}</span> <span class="unit">kg</span>
                    <button onclick="document.querySelector('summary-widget').editWeight()" class="icon-btn" title="수정">
                        <span class="material-icons-round">edit</span>
                    </button>
                </div>
                ${targetWeightHtml}
                ${diffHtml}
            `;
        } else {
            weightHtml = `
                <div class="add-weight-form" style="margin-bottom: 8px;">
                    <input type="number" step="0.1" id="summary-weight-input" placeholder="00.0">
                    <span class="unit">kg</span>
                    <button onclick="document.querySelector('summary-widget').recordWeight()" class="btn">기록</button>
                </div>
                ${targetWeightHtml}
            `;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    /* Host styling relies on the parent .card class in index.html */
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-lg);
                }
                .section-header h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: var(--color-text-main);
                }
                .summary-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 32px;
                    background-color: var(--color-bg-main);
                    padding: 24px;
                    border-radius: var(--radius-md);
                }
                .summary-item {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    min-height: 120px;
                }
                .label {
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                    font-weight: 600;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .progress-container {
                    width: 100%;
                    margin-top: auto;
                }
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: var(--color-text-main);
                    margin-bottom: 8px;
                    font-weight: 700;
                }
                .progress-bar {
                    width: 100%;
                    height: 10px;
                    background-color: rgba(0,0,0,0.05);
                    border-radius: var(--radius-pill);
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: var(--radius-pill);
                    transition: width 0.5s ease-out;
                }
                .weight-recorded {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }
                .value {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--color-text-main);
                    line-height: 1;
                }
                .value.highlight {
                    color: var(--color-primary);
                }
                .unit {
                    font-size: 1rem;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }
                .icon-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--color-text-muted);
                    padding: 4px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: auto;
                    transition: color 0.2s;
                }
                .icon-btn.mini {
                    padding: 2px;
                    margin-left: 4px;
                }
                .icon-btn:hover {
                    color: var(--color-primary);
                    background-color: rgba(0,0,0,0.02);
                }
                .add-weight-form {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .add-weight-form input {
                    width: 80px;
                    font-size: 1.2rem;
                    text-align: center;
                    font-weight: 700;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 8px;
                    padding: 6px;
                    outline: none;
                    font-family: inherit;
                    color: var(--color-text-main);
                    background-color: #fff;
                }
                .add-weight-form input:focus {
                    border-color: var(--color-primary);
                }
                .btn {
                    background-color: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 6px 12px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                }
                .btn.mini {
                    padding: 4px 8px;
                    font-size: 0.8rem;
                    border-radius: 4px;
                }
                .btn:hover {
                    background-color: var(--color-primary-dark);
                }
                .target-weight-display {
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    display: flex;
                    align-items: center;
                    margin-top: 4px;
                }
                .target-weight-display strong {
                    color: var(--color-text-main);
                    margin-left: 4px;
                }
                .weight-diff {
                    font-size: 0.85rem;
                    color: var(--color-primary);
                    background-color: rgba(255, 107, 107, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                    display: inline-block;
                    margin-top: 8px;
                    font-weight: 600;
                }
                .weight-diff.success {
                    color: var(--color-success);
                    background-color: rgba(46, 204, 113, 0.1);
                }
                .material-icons-round {
                    font-family: 'Material Icons Round';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 20px;
                    display: inline-block;
                    line-height: 1;
                    text-transform: none;
                    letter-spacing: normal;
                    word-wrap: normal;
                    white-space: nowrap;
                    direction: ltr;
                }
                @media (max-width: 768px) {
                    .summary-container {
                        grid-template-columns: 1fr;
                        gap: var(--space-lg);
                    }
                }
            </style>
            
            <div class="section-header">
                <div>
                    <h3>종합 대시보드 📊</h3>
                </div>
            </div>

            <div class="summary-container">
                <div class="summary-item">
                    <div class="label"><span class="material-icons-round" style="color:#2ecc71; font-size:18px;">restaurant</span> 식단 달성률</div>
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>${completedDiet} / ${totalDiet} 완료</span>
                            <span>${dietPercent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${dietPercent}%; background: linear-gradient(90deg, #2ecc71, #27ae60);"></div>
                        </div>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="label"><span class="material-icons-round" style="color:#f1c40f; font-size:18px;">fitness_center</span> 운동 달성률</div>
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>${completedExercise} / ${totalExercise} 완료</span>
                            <span>${exercisePercent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${exercisePercent}%; background: linear-gradient(90deg, #f1c40f, #f39c12);"></div>
                        </div>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="label"><span class="material-icons-round" style="color:var(--color-primary); font-size:18px;">monitor_weight</span> 현재 체중</div>
                    ${weightHtml}
                </div>
            </div>
        `;

        const input = this.shadowRoot.getElementById('summary-weight-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.recordWeight();
            });
        }
        
        const targetInput = this.shadowRoot.getElementById('summary-target-weight-input');
        if (targetInput) {
            targetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.recordTargetWeight();
            });
        }
    }

    recordWeight() {
        const input = this.shadowRoot.getElementById('summary-weight-input');
        if (input && input.value.trim() !== '') {
            const val = parseFloat(input.value);
            if (!isNaN(val) && val > 0) {
                MOCK_DATA.weight = val.toFixed(1);
                this.render();
                window.saveData();
            }
        }
    }

    editWeight() {
        MOCK_DATA.weight = null;
        this.render();
        window.saveData();
    }
    
    recordTargetWeight() {
        const input = this.shadowRoot.getElementById('summary-target-weight-input');
        if (input && input.value.trim() !== '') {
            const val = parseFloat(input.value);
            if (!isNaN(val) && val > 0) {
                MOCK_DATA.targetWeight = val.toFixed(1);
                this.render();
                window.saveData();
            }
        }
    }

    editTargetWeight() {
        MOCK_DATA.targetWeight = null;
        this.render();
        window.saveData();
    }
}
customElements.define('summary-widget', SummaryWidget);

// ==========================================================================
// Web Component: <task-list>
// ==========================================================================
class TaskList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const listType = this.getAttribute('id').replace('-tasks', '');
        const tasks = MOCK_DATA[listType] || [];

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: var(--color-bg-card, #fff);
                    border-radius: var(--radius-md, 16px);
                    box-shadow: var(--shadow-soft);
                    overflow: hidden;
                }
                .task-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                .task-item {
                    display: flex;
                    align-items: center;
                    padding: var(--space-md) var(--space-lg);
                    border-bottom: 1px solid var(--color-bg-main);
                    transition: background-color 0.2s ease;
                }
                .task-item:last-child {
                    border-bottom: none;
                }
                .task-item:hover {
                    background-color: rgba(0,0,0,0.02);
                }
                .task-checkbox {
                    width: 24px;
                    height: 24px;
                    border: 2px solid var(--color-text-muted);
                    border-radius: 6px;
                    margin-right: var(--space-md);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                .task-item.completed .task-checkbox {
                    background-color: var(--color-success);
                    border-color: var(--color-success);
                }
                .task-item.completed .task-checkbox::after {
                    content: '✓';
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                }
                .task-content {
                    flex: 1;
                    min-width: 0;
                }
                .task-title {
                    font-weight: 600;
                    color: var(--color-text-main);
                    margin-bottom: 0px;
                    font-size: 0.95rem;
                    transition: color 0.2s ease;
                }
                .task-item.completed .task-title {
                    text-decoration: line-through;
                    color: var(--color-text-muted);
                }
                .task-detail {
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                }
                .delete-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    padding: 4px;
                    margin-left: var(--space-sm);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .delete-btn:hover {
                    color: var(--color-danger);
                    background-color: rgba(231, 76, 60, 0.1);
                }
                .material-icons-round {
                    font-family: 'Material Icons Round';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 18px;
                    display: inline-block;
                    line-height: 1;
                    text-transform: none;
                    letter-spacing: normal;
                    word-wrap: normal;
                    white-space: nowrap;
                    direction: ltr;
                }
                .empty-state {
                    padding: var(--space-md);
                    text-align: center;
                    color: var(--color-text-muted);
                    font-size: 0.85rem;
                }
            </style>
            
            ${tasks.length === 0 ? '<div class="empty-state">기록이 없습니다.</div>' : `
            <ul class="task-list">
                ${tasks.map(task => `
                    <li class="task-item ${task.completed ? 'completed' : ''}">
                        <div class="task-checkbox" onclick="window.toggleTask('${listType}', ${task.id})"></div>
                        <div class="task-content">
                            <div class="task-title">${task.title}</div>
                            ${task.detail ? `<div class="task-detail">${task.detail}</div>` : ''}
                        </div>
                        <button class="delete-btn" onclick="window.deleteTask('${listType}', ${task.id})" title="삭제">
                            <span class="material-icons-round">delete_outline</span>
                        </button>
                    </li>
                `).join('')}
            </ul>
            `}
        `;
    }
}
customElements.define('task-list', TaskList);

// ==========================================================================
// App Logic: Global Add Function
// ==========================================================================
window.addNewTask = function(mealType) {
    const titleInput = document.getElementById(`new-${mealType}-title`);
    const title = titleInput.value.trim();

    if (title) {
        const allTasks = [...(MOCK_DATA.breakfast || []), ...(MOCK_DATA.lunch || []), ...(MOCK_DATA.dinner || []), ...(MOCK_DATA.postWorkout || []), ...(MOCK_DATA.exercise || [])];
        const newId = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1;
        
        if (!MOCK_DATA[mealType]) MOCK_DATA[mealType] = [];
        MOCK_DATA[mealType].push({
            id: newId,
            title: title,
            completed: false
        });
        
        window.renderAll();
        window.saveData();
        titleInput.value = '';
    }
};

window.addExerciseTask = function() {
    const typeSelector = document.querySelector('input[name="exercise-type"]:checked');
    const isCardio = typeSelector && typeSelector.value === 'cardio';

    let title, detail;

    if (isCardio) {
        const titleInput = document.getElementById('new-cardio-title');
        const speedInput = document.getElementById('new-cardio-speed');
        const inclineInput = document.getElementById('new-cardio-incline');
        const timeInput = document.getElementById('new-cardio-time');

        title = titleInput.value.trim();
        
        let detailStr = [];
        if (speedInput.value.trim()) detailStr.push(`속도 ${speedInput.value.trim()}`);
        if (inclineInput.value.trim()) detailStr.push(`경사도 ${inclineInput.value.trim()}`);
        if (timeInput.value.trim()) detailStr.push(`${timeInput.value.trim()}분`);
        detail = detailStr.join(' / ');

        titleInput.value = '';
        speedInput.value = '';
        inclineInput.value = '';
        timeInput.value = '';
        titleInput.focus();
    } else {
        // Strength (Upper/Lower)
        const typePrefix = typeSelector ? (typeSelector.value === 'strength-upper' ? '[상체] ' : '[하체] ') : '';
        const titleInput = document.getElementById('new-strength-title');
        const weightInput = document.getElementById('new-strength-weight');
        const repsInput = document.getElementById('new-strength-reps');
        const setsInput = document.getElementById('new-strength-sets');

        const rawTitle = titleInput.value.trim();
        title = rawTitle ? typePrefix + rawTitle : '';

        let detailStr = [];
        if (weightInput.value.trim()) detailStr.push(`${weightInput.value.trim()}kg`);
        if (repsInput.value.trim()) detailStr.push(`${repsInput.value.trim()}회`);
        if (setsInput.value.trim()) detailStr.push(`${setsInput.value.trim()}세트`);
        detail = detailStr.join(' x ');

        titleInput.value = '';
        weightInput.value = '';
        repsInput.value = '';
        setsInput.value = '';
        titleInput.focus();
    }

    if (title) {
        const allTasks = [...(MOCK_DATA.breakfast || []), ...(MOCK_DATA.lunch || []), ...(MOCK_DATA.dinner || []), ...(MOCK_DATA.postWorkout || []), ...(MOCK_DATA.exercise || [])];
        const newId = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1;
        
        if (!MOCK_DATA.exercise) MOCK_DATA.exercise = [];
        MOCK_DATA.exercise.push({
            id: newId,
            title: title,
            detail: detail,
            completed: false
        });
        
        window.renderAll();
        window.saveData();
    }
};

// ==========================================================================
// Initial Setup
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set Current Date
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        dateElement.textContent = now.toLocaleDateString('ko-KR', options);
    }

    // Handle exercise type toggle
    const radioButtons = document.querySelectorAll('input[name="exercise-type"]');
    const strengthInputs = document.getElementById('strength-inputs');
    const cardioInputs = document.getElementById('cardio-inputs');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'cardio') {
                strengthInputs.style.display = 'none';
                cardioInputs.style.display = 'flex';
            } else {
                strengthInputs.style.display = 'flex';
                cardioInputs.style.display = 'none';
            }
        });
    });

    // Set up Enter key listeners for all inputs
    const inputs = document.querySelectorAll('.task-input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (input.id.startsWith('new-strength') || input.id.startsWith('new-cardio')) {
                    window.addExerciseTask();
                } else {
                    const mealType = input.id.replace('new-', '').replace('-title', '');
                    window.addNewTask(mealType);
                }
            }
        });
    });
});

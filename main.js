// Mock Data for Prototype
const MOCK_DATA = {
    weight: null,
    breakfast: [],
    lunch: [],
    dinner: [],
    exercise: []
};

// Global function to handle deleting tasks so it can be called from inline onclick handlers
window.deleteTask = function(listType, id) {
    MOCK_DATA[listType] = MOCK_DATA[listType].filter(task => task.id !== id);
    const taskListElement = document.getElementById(`${listType}-tasks`);
    if (taskListElement && typeof taskListElement.render === 'function') {
        taskListElement.render();
    }
};

// ==========================================================================
// App Logic: Weight Tracker
// ==========================================================================
window.renderWeight = function() {
    const displayArea = document.getElementById('weight-display-area');
    const statusBadge = document.getElementById('weight-status');
    
    if (!displayArea || !statusBadge) return;

    if (MOCK_DATA.weight) {
        statusBadge.textContent = '기록 완료';
        statusBadge.className = 'status-badge success';
        displayArea.innerHTML = `
            <div class="weight-recorded">
                ${MOCK_DATA.weight} <span>kg</span>
                <button onclick="window.editWeight()" class="icon-button" style="margin-left: auto; width: 32px; height: 32px;" title="수정">
                    <span class="material-icons-round" style="font-size: 1.2rem;">edit</span>
                </button>
            </div>
        `;
    } else {
        statusBadge.textContent = '미기록';
        statusBadge.className = 'status-badge'; // default grey/muted style or fallback
        displayArea.innerHTML = `
            <div class="add-weight-form">
                <input type="number" step="0.1" id="daily-weight-input" class="task-input" placeholder="00.0" style="width: 120px; font-size: 1.5rem; text-align: center; font-weight: 700;">
                <span style="font-size: 1.2rem; font-weight: 600; color: var(--color-text-muted);">kg</span>
                <button onclick="window.recordWeight()" class="primary-button" style="padding: 8px 16px; margin-left: var(--space-md);">기록</button>
            </div>
        `;
        
        const input = document.getElementById('daily-weight-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') window.recordWeight();
            });
            input.focus();
        }
    }
};

window.recordWeight = function() {
    const input = document.getElementById('daily-weight-input');
    if (input && input.value.trim() !== '') {
        // Simple validation to ensure it's a number
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
            MOCK_DATA.weight = val.toFixed(1);
            window.renderWeight();
        }
    }
};

window.editWeight = function() {
    MOCK_DATA.weight = null;
    window.renderWeight();
};

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
                    min-width: 0; /* allows text truncation if needed */
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
                        <div class="task-checkbox" onclick="this.closest('.task-item').classList.toggle('completed')"></div>
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
        // Combined ID search across all diet keys to be safe
        const allTasks = [...MOCK_DATA.breakfast, ...MOCK_DATA.lunch, ...MOCK_DATA.dinner, ...MOCK_DATA.exercise];
        const newId = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1;
        
        MOCK_DATA[mealType].push({
            id: newId,
            title: title,
            completed: false
        });
        
        const taskListElement = document.getElementById(`${mealType}-tasks`);
        if (taskListElement && typeof taskListElement.render === 'function') {
            taskListElement.render();
        }

        titleInput.value = '';
    }
};

window.addExerciseTask = function() {
    const titleInput = document.getElementById('new-exercise-title');
    const weightInput = document.getElementById('new-exercise-weight');
    const repsInput = document.getElementById('new-exercise-reps');
    const setsInput = document.getElementById('new-exercise-sets');

    const title = titleInput.value.trim();
    const weight = weightInput.value.trim();
    const reps = repsInput.value.trim();
    const sets = setsInput.value.trim();

    if (title) {
        let detailStr = [];
        if (weight) detailStr.push(`${weight}kg`);
        if (reps) detailStr.push(`${reps}회`);
        if (sets) detailStr.push(`${sets}세트`);
        
        const detail = detailStr.join(' x ');

        const allTasks = [...MOCK_DATA.breakfast, ...MOCK_DATA.lunch, ...MOCK_DATA.dinner, ...MOCK_DATA.exercise];
        const newId = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1;
        
        MOCK_DATA.exercise.push({
            id: newId,
            title: title,
            detail: detail,
            completed: false
        });
        
        const taskListElement = document.getElementById('exercise-tasks');
        if (taskListElement && typeof taskListElement.render === 'function') {
            taskListElement.render();
        }

        titleInput.value = '';
        weightInput.value = '';
        repsInput.value = '';
        setsInput.value = '';
        titleInput.focus();
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

    // Initialize Weight Tracker
    window.renderWeight();

    // Set up Enter key listeners for all inputs
    const inputs = document.querySelectorAll('.task-input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (input.id.startsWith('new-exercise')) {
                    window.addExerciseTask();
                } else {
                    const mealType = input.id.replace('new-', '').replace('-title', '');
                    window.addNewTask(mealType);
                }
            }
        });
    });
});

// Mock Data for Prototype
const MOCK_DATA = {
    summary: {
        caloriesConsumed: 1250,
        caloriesTarget: 1800,
        caloriesBurned: 350,
        currentWeight: 72.5,
        targetWeight: 68.0
    },
    diet: [], // Start with empty diet list
    exercise: [
        { id: 5, title: '유산소: 가볍게 런닝', detail: '30분 / 250 kcal 소모', completed: true },
        { id: 6, title: '근력: 스쿼트 & 런지', detail: '4세트', completed: false },
        { id: 7, title: '스트레칭: 요가 마무리', detail: '15분', completed: false }
    ]
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
        const { caloriesConsumed, caloriesTarget, caloriesBurned, currentWeight, targetWeight } = MOCK_DATA.summary;
        const progressPercent = Math.min((caloriesConsumed / caloriesTarget) * 100, 100);

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: var(--color-bg-card, #fff);
                    border-radius: var(--radius-md, 16px);
                    padding: var(--space-lg, 24px);
                    box-shadow: var(--shadow-soft);
                }
                .summary-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: var(--space-md);
                }
                .summary-item {
                    display: flex;
                    flex-direction: column;
                }
                .label {
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    font-weight: 600;
                    margin-bottom: 4px;
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
                .progress-container {
                    margin-top: var(--space-lg);
                }
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                .progress-bar {
                    width: 100%;
                    height: 12px;
                    background-color: var(--color-bg-main);
                    border-radius: var(--radius-pill);
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
                    border-radius: var(--radius-pill);
                    width: ${progressPercent}%;
                    transition: width 0.5s ease-out;
                }
                .stats-footer {
                    display: flex;
                    margin-top: var(--space-md);
                    gap: var(--space-md);
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                }
                .stats-footer span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .icon-burned { color: var(--color-secondary); }
            </style>
            
            <div class="summary-header">
                <div class="summary-item">
                    <span class="label">섭취 칼로리</span>
                    <span class="value highlight">${caloriesConsumed} <span style="font-size:1rem; color:var(--color-text-muted)">kcal</span></span>
                </div>
                <div class="summary-item" style="text-align: right;">
                    <span class="label">목표 체중</span>
                    <span class="value">${currentWeight} <span style="font-size:1rem; color:var(--color-text-muted)">kg</span></span>
                </div>
            </div>

            <div class="progress-container">
                <div class="progress-header">
                    <span>일일 권장량: ${caloriesTarget} kcal</span>
                    <span>${Math.round(progressPercent)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>

            <div class="stats-footer">
                <span><b class="icon-burned">🔥</b> ${caloriesBurned} kcal 소모함</span>
            </div>
        `;
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
        const listType = this.getAttribute('id') === 'diet-tasks' ? 'diet' : 'exercise';
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
                    margin-bottom: 4px;
                    font-size: 1rem;
                    transition: color 0.2s ease;
                }
                .task-item.completed .task-title {
                    text-decoration: line-through;
                    color: var(--color-text-muted);
                }
                .task-detail {
                    font-size: 0.85rem;
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
                    font-size: 20px;
                    display: inline-block;
                    line-height: 1;
                    text-transform: none;
                    letter-spacing: normal;
                    word-wrap: normal;
                    white-space: nowrap;
                    direction: ltr;
                }
                .empty-state {
                    padding: var(--space-lg);
                    text-align: center;
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                }
            </style>
            
            ${tasks.length === 0 ? '<div class="empty-state">등록된 항목이 없습니다.</div>' : `
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
// App Logic: Add Diet
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const addDietBtn = document.getElementById('add-diet-btn');
    const titleInput = document.getElementById('new-diet-title');
    const dietTaskList = document.getElementById('diet-tasks');

    if (addDietBtn) {
        addDietBtn.addEventListener('click', () => {
            const title = titleInput.value.trim();

            if (title) {
                const newId = MOCK_DATA.diet.length > 0 ? Math.max(...MOCK_DATA.diet.map(d => d.id)) + 1 : 1;
                MOCK_DATA.diet.push({
                    id: newId,
                    title: title,
                    completed: false
                });
                
                // Re-render the task list component
                if (dietTaskList && typeof dietTaskList.render === 'function') {
                    dietTaskList.render();
                }

                // Clear input
                titleInput.value = '';
            }
        });
        
        // Handle Enter key
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addDietBtn.click();
        });
    }
});

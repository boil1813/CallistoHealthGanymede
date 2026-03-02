// Mock Data for Prototype
const MOCK_DATA = {
    summary: {
        caloriesConsumed: 1250,
        caloriesTarget: 1800,
        caloriesBurned: 350,
        currentWeight: 72.5,
        targetWeight: 68.0
    },
    diet: [
        { id: 1, title: '아침: 오트밀과 바나나', detail: '300 kcal', completed: true },
        { id: 2, title: '점심: 닭가슴살 샐러드', detail: '450 kcal', completed: true },
        { id: 3, title: '간식: 아몬드 한 줌', detail: '150 kcal', completed: false },
        { id: 4, title: '저녁: 연어 스테이크', detail: '600 kcal', completed: false }
    ],
    exercise: [
        { id: 5, title: '유산소: 가볍게 런닝', detail: '30분 / 250 kcal 소모', completed: true },
        { id: 6, title: '근력: 스쿼트 & 런지', detail: '4세트', completed: false },
        { id: 7, title: '스트레칭: 요가 마무리', detail: '15분', completed: false }
    ]
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
            </style>
            
            <ul class="task-list">
                ${tasks.map(task => `
                    <li class="task-item ${task.completed ? 'completed' : ''}">
                        <div class="task-checkbox" onclick="this.closest('.task-item').classList.toggle('completed')"></div>
                        <div class="task-content">
                            <div class="task-title">${task.title}</div>
                            <div class="task-detail">${task.detail}</div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    }
}
customElements.define('task-list', TaskList);

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

let MOCK_DATA = {};

// Default dictionary if none exists
const defaultDictionary = {
    upper: [
        { id: 'u1', name: '벤치프레스', target: '가슴', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop' },
        { id: 'u2', name: '바벨 로우', target: '등', image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=200&h=200&fit=crop' },
        { id: 'u3', name: '풀업 (턱걸이)', target: '등', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&h=200&fit=crop' },
        { id: 'u4', name: '덤벨 숄더 프레스', target: '어깨', image: 'https://images.unsplash.com/photo-1541534741688-6078c65b5a33?w=200&h=200&fit=crop' },
        { id: 'u5', name: '사이드 레터럴 레이즈', target: '어깨', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=200&h=200&fit=crop' },
        { id: 'u6', name: '푸시업 (팔굽혀펴기)', target: '가슴/팔', image: 'https://images.unsplash.com/photo-1566241142559-40e1bfc26ebc?w=200&h=200&fit=crop' }
    ],
    lower: [
        { id: 'l1', name: '스쿼트', target: '전체', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&h=200&fit=crop' },
        { id: 'l2', name: '레그 프레스', target: '허벅지 앞', image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&h=200&fit=crop' },
        { id: 'l3', name: '런지', target: '엉덩이/허벅지', image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=200&h=200&fit=crop' },
        { id: 'l4', name: '데드리프트', target: '하체 뒷면', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop' },
        { id: 'l5', name: '레그 익스텐션', target: '허벅지 앞', image: 'https://images.unsplash.com/photo-1591948971351-70ba99110252?w=200&h=200&fit=crop' },
        { id: 'l6', name: '카프 레이즈', target: '종아리', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2ec617?w=200&h=200&fit=crop' }
    ]
};

// ==========================================================================
// Setup & Firebase Logic
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set Current Date Header
    const dateElement = document.getElementById('current-date-exercises');
    if (dateElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        dateElement.textContent = now.toLocaleDateString('ko-KR', options);
    }

    // Set up add buttons
    document.getElementById('add-upper-btn').addEventListener('click', () => addExerciseToDict('upper'));
    document.getElementById('add-lower-btn').addEventListener('click', () => addExerciseToDict('lower'));

    // Handle Enter keys
    document.getElementById('new-upper-name').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExerciseToDict('upper'); });
    document.getElementById('new-upper-target').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExerciseToDict('upper'); });
    document.getElementById('new-upper-image').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExerciseToDict('upper'); });
    document.getElementById('new-lower-name').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExerciseToDict('lower'); });
    document.getElementById('new-lower-target').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExerciseToDict('lower'); });
    document.getElementById('new-lower-image').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExerciseToDict('lower'); });
});

onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
        MOCK_DATA = docSnap.data();
        if (!MOCK_DATA.exerciseDictionary) {
            MOCK_DATA.exerciseDictionary = defaultDictionary;
            saveData();
        } else {
            renderDictionaries();
        }
    } else {
        // Initialize if empty
        MOCK_DATA = { exerciseDictionary: defaultDictionary };
        saveData();
    }
});

async function saveData() {
    try {
        await setDoc(userDocRef, MOCK_DATA, { merge: true });
    } catch (error) {
        console.error("Error saving dictionary to Firestore:", error);
    }
}

// ==========================================================================
// Render Logic
// ==========================================================================
function renderDictionaries() {
    renderList('upper');
    renderList('lower');
}

function renderList(type) {
    const listEl = document.getElementById(`${type}-exercise-list`);
    if (!listEl) return;

    const items = MOCK_DATA.exerciseDictionary[type] || [];
    
    if (items.length === 0) {
        listEl.innerHTML = `<li style="justify-content:center; color:var(--color-text-muted);">등록된 운동이 없습니다.</li>`;
        return;
    }

    listEl.innerHTML = items.map(item => `
        <li style="display: flex; align-items: center; gap: 16px; padding: 16px;">
            <div style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; background-color: var(--color-bg-main); flex-shrink: 0;">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: crop;">` : `<span class="material-icons-round" style="font-size: 2rem; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; height: 100%;">fitness_center</span>`}
            </div>
            <div style="flex: 1;">
                <div class="ex-name">${item.name}</div>
                <div style="margin-top: 4px;"><span class="muscle-badge">${item.target}</span></div>
            </div>
            <button onclick="deleteExerciseFromDict('${type}', '${item.id}')" class="icon-button" style="width:28px; height:28px; color:var(--color-text-muted);" title="삭제">
                <span class="material-icons-round" style="font-size:1.1rem;">delete_outline</span>
            </button>
        </li>
    `).join('');
}

// ==========================================================================
// Actions
// ==========================================================================
window.addExerciseToDict = function(type) {
    const nameInput = document.getElementById(`new-${type}-name`);
    const targetInput = document.getElementById(`new-${type}-target`);
    const imageInput = document.getElementById(`new-${type}-image`);
    
    const name = nameInput.value.trim();
    const target = targetInput.value.trim() || '미지정';
    let image = imageInput.value.trim();

    if (name) {
        const newId = type.charAt(0) + Date.now().toString(36); // Generate pseudo-unique ID
        
        // Use manual image if provided, otherwise fallback to auto placeholder
        if (!image) {
            image = `https://loremflickr.com/200/200/fitness,gym?random=${Math.floor(Math.random() * 1000)}`;
        }
        
        if (!MOCK_DATA.exerciseDictionary) MOCK_DATA.exerciseDictionary = {};
        if (!MOCK_DATA.exerciseDictionary[type]) MOCK_DATA.exerciseDictionary[type] = [];
        
        MOCK_DATA.exerciseDictionary[type].push({
            id: newId,
            name: name,
            target: target,
            image: image
        });
        
        saveData(); // onSnapshot will trigger re-render
        
        nameInput.value = '';
        targetInput.value = '';
        imageInput.value = '';
        nameInput.focus();
    }
};

window.deleteExerciseFromDict = function(type, id) {
    if (confirm('이 운동을 목록에서 삭제하시겠습니까?')) {
        if (MOCK_DATA.exerciseDictionary && MOCK_DATA.exerciseDictionary[type]) {
            MOCK_DATA.exerciseDictionary[type] = MOCK_DATA.exerciseDictionary[type].filter(item => item.id !== id);
            saveData();
        }
    }
};

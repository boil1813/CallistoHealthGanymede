import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const userDocRef = doc(db, "data", USER_DOC_ID); // Currently points to a single doc, we'll need to adapt to daily docs for a real calendar app, but for prototype we simulate it.

// ==========================================================================
// Setup
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set Current Date Header
    const dateElement = document.getElementById('current-date-stats');
    if (dateElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        dateElement.textContent = now.toLocaleDateString('ko-KR', options);
    }

    initCalendar();
});

let calendar;
let ALL_DATA = {}; // In a real app, this would be a collection of daily documents

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        height: 'auto',
        selectable: true,
        dateClick: function(info) {
            displayDateDetails(info.dateStr);
            
            // Highlight selected day
            document.querySelectorAll('.fc-day').forEach(el => el.style.backgroundColor = '');
            info.dayEl.style.backgroundColor = 'rgba(78, 205, 196, 0.1)'; // Light secondary color
        },
        // We will add events here when data loads to show dots on days with data
        eventContent: function(arg) {
            return { html: '<div class="record-dot"></div>' }
        }
    });
    
    calendar.render();

    // Load data
    loadFirebaseData();
}

function loadFirebaseData() {
    // Currently, main.js saves to a single document 'main_user_data'. 
    // To make a calendar work perfectly, main.js should save to doc(db, 'data', 'YYYY-MM-DD').
    // For this prototype, we will load the single document and pretend it's for "today".
    
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Format today's date as YYYY-MM-DD
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + 
                             String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(today.getDate()).padStart(2, '0');
            
            // Store it in our fake "all data" dictionary under today's date
            ALL_DATA[todayStr] = data;

            // Add a dot to today's date on the calendar
            const existingEvents = calendar.getEvents();
            existingEvents.forEach(e => e.remove());
            
            // Add dots for any dates that have data (currently only today)
            Object.keys(ALL_DATA).forEach(dateStr => {
                const dayData = ALL_DATA[dateStr];
                // Only show dot if there is actually some data
                if (dayData.weight || 
                    (dayData.breakfast && dayData.breakfast.length > 0) || 
                    (dayData.lunch && dayData.lunch.length > 0) || 
                    (dayData.dinner && dayData.dinner.length > 0) || 
                    (dayData.exercise && dayData.exercise.length > 0)) {
                    
                    calendar.addEvent({
                        start: dateStr,
                        allDay: true,
                        display: 'background'
                    });
                }
            });

            // Automatically display today's details if it's currently selected (or on initial load)
            displayDateDetails(todayStr);
        }
    });
}

function displayDateDetails(dateStr) {
    const titleEl = document.getElementById('selected-date-title');
    const contentEl = document.getElementById('detail-content');
    const emptyEl = document.getElementById('detail-empty');
    const weightEl = document.getElementById('detail-weight');
    const dietEl = document.getElementById('detail-diet');
    const exerciseEl = document.getElementById('detail-exercise');

    // Format date string for display
    const dateObj = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    titleEl.textContent = dateObj.toLocaleDateString('ko-KR', options);

    const dayData = ALL_DATA[dateStr];

    if (!dayData || (!dayData.weight && 
        (!dayData.breakfast || dayData.breakfast.length === 0) && 
        (!dayData.lunch || dayData.lunch.length === 0) && 
        (!dayData.dinner || dayData.dinner.length === 0) && 
        (!dayData.exercise || dayData.exercise.length === 0))) {
        
        // No data for this day
        contentEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
    }

    // We have data
    contentEl.style.display = 'block';
    emptyEl.style.display = 'none';

    // 1. Weight
    if (dayData.weight) {
        weightEl.innerHTML = `<div class="weight-display">${dayData.weight} <span>kg</span></div>`;
    } else {
        weightEl.innerHTML = `<div style="color: var(--color-text-muted);">기록 없음</div>`;
    }

    // 2. Diet
    const allDiet = [
        ...(dayData.breakfast || []).map(item => ({...item, meal: '아침'})),
        ...(dayData.lunch || []).map(item => ({...item, meal: '점심'})),
        ...(dayData.dinner || []).map(item => ({...item, meal: '저녁'}))
    ];

    if (allDiet.length > 0) {
        dietEl.innerHTML = allDiet.map(item => `
            <li>
                <span style="text-decoration: ${item.completed ? 'line-through' : 'none'}; color: ${item.completed ? 'var(--color-text-muted)' : 'inherit'}">${item.title}</span>
                <span class="meta">${item.meal} ${item.completed ? '✓' : ''}</span>
            </li>
        `).join('');
    } else {
        dietEl.innerHTML = `<li style="justify-content: center; color: var(--color-text-muted);">기록 없음</li>`;
    }

    // 3. Exercise
    if (dayData.exercise && dayData.exercise.length > 0) {
        exerciseEl.innerHTML = dayData.exercise.map(item => `
            <li>
                <div>
                    <span style="text-decoration: ${item.completed ? 'line-through' : 'none'}; color: ${item.completed ? 'var(--color-text-muted)' : 'inherit'}; font-weight:600;">${item.title}</span>
                    <div class="meta" style="margin-top: 2px;">${item.detail || ''}</div>
                </div>
                <span class="meta">${item.completed ? '완료 ✓' : '미완료'}</span>
            </li>
        `).join('');
    } else {
        exerciseEl.innerHTML = `<li style="justify-content: center; color: var(--color-text-muted);">기록 없음</li>`;
    }
}

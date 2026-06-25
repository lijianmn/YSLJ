const DATA_URL = 'meals.json';

let meals = [];
let startDate = null;

async function loadMeals() {
    try {
        const response = await fetch(DATA_URL);
        if (response.ok) {
            meals = await response.json();
        }
    } catch (error) {
        console.error('Failed to load meals:', error);
    }
}

function getStoredStartDate() {
    const stored = localStorage.getItem('yuezi_start_date');
    if (stored) {
        return new Date(stored);
    }
    return null;
}

function setStoredStartDate(date) {
    localStorage.setItem('yuezi_start_date', date.toISOString().split('T')[0]);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateCN(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
}

function getMealByDay(day) {
    return meals.find(meal => meal.day === day);
}

function getDayFromDate(dateStr) {
    if (!startDate) return null;
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 1 && diffDays <= 42) {
        return diffDays;
    }
    return null;
}

function getDateByDay(day) {
    if (!startDate) return null;
    const date = new Date(startDate);
    date.setDate(date.getDate() + day - 1);
    return date;
}

function getTodayDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getDayFromDate(formatDate(today));
}

function renderDaysGrid() {
    const daysGrid = document.getElementById('daysGrid');
    daysGrid.innerHTML = '';
    
    const todayDay = getTodayDay();
    
    for (let day = 1; day <= 42; day++) {
        const date = getDateByDay(day);
        const dateStr = date ? formatDate(date) : '';
        const shortDate = date ? `${date.getMonth() + 1}/${date.getDate()}` : '';
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        if (todayDay === day) {
            dayCard.classList.add('today');
        }
        
        if (getMealByDay(day)) {
            dayCard.classList.add('has-meal');
        }
        
        dayCard.innerHTML = `
            <span class="day-number">${day}</span>
            <span class="day-date">${shortDate}</span>
        `;
        
        dayCard.addEventListener('click', () => {
            window.location.href = `detail.html?day=${day}`;
        });
        
        daysGrid.appendChild(dayCard);
    }
    
    updateProgress();
}

function updateProgress() {
    const todayDay = getTodayDay() || 0;
    const progress = Math.min((todayDay / 42) * 100, 100);
    
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('completedDays').textContent = todayDay;
}

function initHomePage() {
    const savedStartDate = getStoredStartDate();
    startDate = savedStartDate || new Date();
    
    document.getElementById('startDate').value = formatDate(startDate);
    
    document.getElementById('applyDate').addEventListener('click', () => {
        const dateValue = document.getElementById('startDate').value;
        if (dateValue) {
            startDate = new Date(dateValue);
            setStoredStartDate(startDate);
            renderDaysGrid();
            alert('开始日期已设置！');
        }
    });
    
    loadMeals().then(() => {
        renderDaysGrid();
    });
}

function renderDetail(day) {
    const meal = getMealByDay(day);
    const date = getDateByDay(day);
    
    document.getElementById('dayNumber').textContent = day;
    document.getElementById('dateTitle').textContent = date ? formatDateCN(date) : '';
    
    function renderList(elementId, items) {
        const list = document.getElementById(elementId);
        if (items && items.trim()) {
            list.innerHTML = items.split('\n').filter(item => item.trim()).map(item => `<li>${item.trim()}</li>`).join('');
            return true;
        }
        list.innerHTML = '<li>暂无安排</li>';
        return false;
    }
    
    if (meal) {
        renderList('breakfastList', meal.breakfast);
        renderList('lunchList', meal.lunch);
        renderList('dinnerList', meal.dinner);
        
        const hasSnack = renderList('snackList', meal.snack);
        document.getElementById('snackCard').style.display = hasSnack ? 'block' : 'none';
        
        const notesContent = document.getElementById('notesContent');
        if (meal.notes && meal.notes.trim()) {
            notesContent.innerHTML = meal.notes.split('\n').filter(item => item.trim()).map(item => `<li>${item.trim()}</li>`).join('');
        } else {
            notesContent.innerHTML = '<p>暂无注意事项</p>';
        }
    } else {
        renderList('breakfastList', '');
        renderList('lunchList', '');
        renderList('dinnerList', '');
        document.getElementById('snackCard').style.display = 'none';
        document.getElementById('notesContent').innerHTML = '<p>该天暂无菜单安排</p>';
    }
    
    document.getElementById('prevDay').disabled = day <= 1;
    document.getElementById('nextDay').disabled = day >= 42;
    
    document.getElementById('prevDay').addEventListener('click', () => {
        if (day > 1) {
            window.location.href = `detail.html?day=${day - 1}`;
        }
    });
    
    document.getElementById('nextDay').addEventListener('click', () => {
        if (day < 42) {
            window.location.href = `detail.html?day=${day + 1}`;
        }
    });
}

function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const day = parseInt(urlParams.get('day')) || 1;
    
    const savedStartDate = getStoredStartDate();
    startDate = savedStartDate || new Date();
    
    loadMeals().then(() => {
        renderDetail(day);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('daysGrid')) {
        initHomePage();
    }
    
    if (document.getElementById('themeSection')) {
        initDetailPage();
    }
    
    initFontSizeControls();
});

function initFontSizeControls() {
    const increaseBtn = document.getElementById('fontIncrease');
    const decreaseBtn = document.getElementById('fontDecrease');
    const indicator = document.getElementById('fontSizeIndicator');
    
    if (!increaseBtn || !decreaseBtn) return;
    
    let currentSize = parseInt(localStorage.getItem('font_size') || '16');
    
    function updateFontSize() {
        currentSize = Math.max(12, Math.min(28, currentSize));
        document.body.style.fontSize = `${currentSize}px`;
        localStorage.setItem('font_size', currentSize.toString());
        if (indicator) {
            indicator.textContent = `${currentSize}px`;
        }
    }
    
    updateFontSize();
    
    increaseBtn.addEventListener('click', () => {
        currentSize += 2;
        updateFontSize();
    });
    
    decreaseBtn.addEventListener('click', () => {
        currentSize -= 2;
        updateFontSize();
    });
}
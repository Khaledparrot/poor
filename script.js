// ==================== ÉTAT DE L'APPLICATION ====================
let appState = {
    user: {
        age: null,
        weight: null,
        height: null,
        gender: 'male'
    },
    currentDay: new Date().toISOString().split('T')[0],
    daily: {}, // Données par jour
    foodDatabase: [
        { id: 1, name: 'Riz', protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, calories: 130, unitWeight: null },
        { id: 2, name: 'Poulet', protein: 31, carbs: 0, fats: 3.6, fiber: 0, calories: 165, unitWeight: null },
        { id: 3, name: 'Œuf', protein: 13, carbs: 1.1, fats: 11, fiber: 0, calories: 155, unitWeight: 60 },
        { id: 4, name: 'Pomme', protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, calories: 52, unitWeight: 150 },
        { id: 5, name: 'Banane', protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, calories: 89, unitWeight: 120 }
    ],
    nextFoodId: 6,
    reminders: {
        water: true,
        protein: true,
        meditation: true,
        sleep: true,
        waterFrequency: 60,
        proteinTime: '12:00',
        meditationTime: '18:00',
        bedTime: '22:00'
    },
    notifications: []
};

// ==================== INITIALISATION ====================
function saveUserInfo() {
    const age = document.getElementById('userAge').value;
    const weight = document.getElementById('userWeight').value;
    const height = document.getElementById('userHeight').value;
    const gender = document.getElementById('userGender').value;
    
    if (!age || !weight || !height) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    appState.user.age = parseInt(age);
    appState.user.weight = parseFloat(weight);
    appState.user.height = parseFloat(height);
    appState.user.gender = gender;
    
    // Initialiser le jour courant
    if (!appState.daily[appState.currentDay]) {
        appState.daily[appState.currentDay] = createEmptyDay();
    }
    
    document.getElementById('ageModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    updateUserInfoDisplay();
    calculateNeeds();
    updateAllDisplays();
    loadFoodSelect();
    updateFoodDatabaseList();
    startRealTimeUpdates();
    requestNotificationPermission();
    saveState();
    
    showSection('colon');
}

function createEmptyDay() {
    return {
        date: appState.currentDay,
        sleep: { hours: 0, quality: '' },
        water: 0,
        waterHistory: [],
        foods: [],
        foodHistory: [],
        exercise: { duration: 0, sessions: [] },
        steps: 0,
        meditation: { total: 0, sessions: [] },
        bowel: []
    };
}

// ==================== MISE À JOUR EN TEMPS RÉEL ====================
function startRealTimeUpdates() {
    // Mise à jour toutes les secondes
    setInterval(() => {
        updateAllDisplays();
        checkAndSaveDailyReport();
    }, 1000);
    
    // Vérifier les notifications toutes les minutes
    setInterval(checkReminders, 60000);
    
    // Mettre à jour la date
    updateDate();
    setInterval(updateDate, 60000);
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('fr-FR', options);
}

function checkAndSaveDailyReport() {
    const now = new Date();
    const currentDay = now.toISOString().split('T')[0];
    
    // Si on change de jour, sauvegarder le rapport du jour précédent
    if (currentDay !== appState.currentDay) {
        saveDailyReport(appState.currentDay);
        appState.currentDay = currentDay;
        if (!appState.daily[currentDay]) {
            appState.daily[currentDay] = createEmptyDay();
        }
    }
}

function saveDailyReport(date) {
    const dayData = appState.daily[date];
    if (!dayData) return;
    
    // Calculer le score global
    const scores = calculateDailyScores(dayData);
    dayData.score = scores.global;
    dayData.scores = scores;
    
    saveState();
}

function calculateDailyScores(dayData) {
    const needs = getCurrentNeeds();
    
    const waterScore = Math.min((dayData.water / needs.water) * 100, 100);
    const proteinScore = calculateNutrientScore(dayData, 'protein', needs.protein);
    const activityScore = calculateActivityScore(dayData);
    const sleepScore = Math.min((dayData.sleep.hours / needs.sleep) * 100, 100);
    const meditationScore = Math.min((dayData.meditation.total / 10) * 100, 100);
    
    const global = Math.round(
        (waterScore + proteinScore + activityScore + sleepScore + meditationScore) / 5
    );
    
    return {
        water: Math.round(waterScore),
        protein: Math.round(proteinScore),
        activity: Math.round(activityScore),
        sleep: Math.round(sleepScore),
        meditation: Math.round(meditationScore),
        global: global
    };
}

// ==================== NOTIFICATIONS SYSTÈME ====================
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showAppNotification('✅ Notifications activées', 'Vous recevrez des rappels');
        }
    }
}

function showAppNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
    }
    
    // Ajouter aussi dans le panneau interne
    addInternalNotification(title, body);
}

function addInternalNotification(title, message) {
    const time = new Date().toLocaleTimeString();
    appState.notifications.push({ title, message, time, read: false });
    if (appState.notifications.length > 20) {
        appState.notifications.shift();
    }
    updateNotificationBell();
}

function checkReminders() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Rappel d'eau
    if (appState.reminders.water) {
        const minutes = now.getMinutes();
        if (minutes % (appState.reminders.waterFrequency / 60) === 0) {
            const waterPercent = (getTodayData().water / getCurrentNeeds().water) * 100;
            if (waterPercent < 70) {
                showAppNotification('💧 Rappel d\'eau', 'Pensez à boire de l\'eau');
            }
        }
    }
    
    // Rappel protéines
    if (appState.reminders.protein && currentTime === appState.reminders.proteinTime) {
        const proteinEaten = calculateTotalProtein();
        if (proteinEaten < getCurrentNeeds().protein * 0.7) {
            showAppNotification('🥩 Rappel protéines', 'Vous n\'avez pas assez mangé de protéines');
        }
    }
    
    // Rappel méditation
    if (appState.reminders.meditation && currentTime === appState.reminders.meditationTime) {
        showAppNotification('🧘 Méditation', 'Prenez 10 minutes pour méditer');
    }
    
    // Rappel coucher
    if (appState.reminders.sleep && currentTime === appState.reminders.bedTime) {
        showAppNotification('😴 Heure du coucher', 'Pensez à aller dormir');
    }
}

// ==================== CALENDRIER ET RAPPORTS ====================
let currentCalendarDate = new Date();

function showCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        currentCalendarDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '<div class="calendar-grid">';
    
    // Jours de la semaine
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    weekDays.forEach(day => {
        html += `<div class="calendar-day header">${day}</div>`;
    });
    
    // Cases vides avant le premier jour
    for (let i = 1; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const hasData = appState.daily[dateStr] && appState.daily[dateStr].score;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        html += `<div class="calendar-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}" 
                      onclick="showDailyReport('${dateStr}')">
                    ${day}
                </div>`;
    }
    
    html += '</div>';
    document.getElementById('calendar').innerHTML = html;
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    showCalendar();
}

function showDailyReport(dateStr) {
    const dayData = appState.daily[dateStr];
    const reportDiv = document.getElementById('dailyReport');
    
    if (!dayData) {
        reportDiv.innerHTML = '<h3>Aucune donnée pour ce jour</h3>';
        return;
    }
    
    const scores = dayData.scores || calculateDailyScores(dayData);
    
    reportDiv.innerHTML = `
        <h3>Rapport du ${new Date(dateStr).toLocaleDateString('fr-FR')}</h3>
        <div class="report-stats">
            <div class="report-item">💧 Eau: ${scores.water}%</div>
            <div class="report-item">🥩 Protéines: ${scores.protein}%</div>
            <div class="report-item">🏃 Activité: ${scores.activity}%</div>
            <div class="report-item">😴 Sommeil: ${scores.sleep}%</div>
            <div class="report-item">🧘 Méditation: ${scores.meditation}%</div>
            <div class="report-item">⭐ Global: ${scores.global}%</div>
        </div>
        <div class="report-details">
            <p>💧 Eau: ${dayData.water}ml / ${getNeedsForDate(dateStr).water}ml</p>
            <p>🥩 Protéines: ${calculateTotalProteinForDay(dayData)}g / ${getNeedsForDate(dateStr).protein}g</p>
            <p>🏃 Pas: ${dayData.steps} | Exercice: ${dayData.exercise.duration}min</p>
            <p>😴 Sommeil: ${dayData.sleep.hours}h</p>
            <p>🧘 Méditation: ${dayData.meditation.total}min</p>
            <p>🚽 Selles: ${dayData.bowel.length} fois</p>
        </div>
    `;
}

// ==================== FONCTIONS DE CALCUL ====================
function getTodayData() {
    if (!appState.daily[appState.currentDay]) {
        appState.daily[appState.currentDay] = createEmptyDay();
    }
    return appState.daily[appState.currentDay];
}

function getCurrentNeeds() {
    return {
        water: Math.round(appState.user.weight * 35),
        protein: Math.round(appState.user.weight * 0.8),
        sleep: appState.user.age < 65 ? 8 : 7.5
    };
}

function getNeedsForDate(date) {
    // Version simplifiée - on utilise les besoins actuels
    return getCurrentNeeds();
}

function calculateTotalProtein() {
    return getTodayData().foods.reduce((sum, f) => sum + f.protein, 0);
}

function calculateTotalProteinForDay(dayData) {
    return dayData.foods.reduce((sum, f) => sum + f.protein, 0);
}

function calculateNutrientScore(dayData, nutrient, target) {
    const total = dayData.foods.reduce((sum, f) => sum + (f[nutrient] || 0), 0);
    return Math.min((total / target) * 100, 100);
}

function calculateActivityScore(dayData) {
    const stepsScore = (dayData.steps / 8000) * 50;
    const exerciseScore = (dayData.exercise.duration / 30) * 50;
    return Math.min(stepsScore + exerciseScore, 100);
}

// ==================== MISE À JOUR DE L'AFFICHAGE ====================
function updateAllDisplays() {
    const today = getTodayData();
    const needs = getCurrentNeeds();
    
    // Mettre à jour les cercles
    updateCircle('colon', today.bowel.length > 0 ? 50 : 0);
    updateCircle('nutrition', calculateAverageNutritionScore(today, needs));
    updateCircle('hydration', (today.water / needs.water) * 100);
    updateCircle('activity', calculateActivityScore(today));
    updateCircle('sleep', (today.sleep.hours / needs.sleep) * 100);
    updateCircle('meditation', (today.meditation.total / 10) * 100);
    
    // Mettre à jour les stats nutrition
    updateNutritionDisplay();
    
    // Mettre à jour les stats eau
    updateWaterDisplay();
    
    // Mettre à jour les stats activité
    updateActivityDisplay();
    
    // Mettre à jour les stats sommeil
    updateSleepDisplay();
    
    // Mettre à jour les stats méditation
    updateMeditationDisplay();
    
    // Mettre à jour les recommandations
    updateRecommendations();
    
    // Mettre à jour le score global
    updateGlobalScore();
    
    // Animation de mise à jour
    document.querySelector('.real-time-indicator').classList.add('updated');
    setTimeout(() => {
        document.querySelector('.real-time-indicator').classList.remove('updated');
    }, 1000);
}

function updateCircle(section, percent) {
    const displayPercent = Math.min(Math.round(percent), 100);
    const circle = document.getElementById(section + 'Circle');
    if (circle) {
        const value = circle.querySelector('.progress-value');
        if (value) value.textContent = displayPercent + '%';
        const degrees = (displayPercent / 100) * 360;
        circle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--light) ${degrees}deg)`;
    }
}

function calculateAverageNutritionScore(today, needs) {
    const proteinScore = (calculateTotalProtein() / needs.protein) * 100;
    const carbsScore = (calculateTotalCarbs() / (appState.user.weight * 4)) * 100;
    const fatsScore = (calculateTotalFats() / (appState.user.weight * 1)) * 100;
    return (proteinScore + carbsScore + fatsScore) / 3;
}

function calculateTotalCarbs() {
    return getTodayData().foods.reduce((sum, f) => sum + f.carbs, 0);
}

function calculateTotalFats() {
    return getTodayData().foods.reduce((sum, f) => sum + f.fats, 0);
}

function updateNutritionDisplay() {
    const today = getTodayData();
    const needs = getCurrentNeeds();
    
    const protein = calculateTotalProtein();
    const carbs = calculateTotalCarbs();
    const fats = calculateTotalFats();
    const fiber = calculateTotalFiber();
    
    setElementText('proteinEaten', Math.round(protein));
    setElementText('carbsEaten', Math.round(carbs));
    setElementText('fatsEaten', Math.round(fats));
    setElementText('fiberEaten', Math.round(fiber));
    
    setElementWidth('proteinBar', (protein / needs.protein) * 100);
    setElementWidth('carbsBar', (carbs / (appState.user.weight * 4)) * 100);
    setElementWidth('fatsBar', (fats / (appState.user.weight * 1)) * 100);
    setElementWidth('fiberBar', (fiber / (appState.user.gender === 'male' ? 35 : 28)) * 100);
}

function calculateTotalFiber() {
    return getTodayData().foods.reduce((sum, f) => sum + (f.fiber || 0), 0);
}

function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setElementWidth(id, percent) {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.min(percent, 100) + '%';
}

function updateWaterDisplay() {
    const today = getTodayData();
    const needs = getCurrentNeeds();
    
    const percent = (today.water / needs.water) * 100;
    const displayPercent = Math.min(Math.round(percent), 100);
    
    setElementText('hydrationPercent', displayPercent + '%');
    setElementText('waterConsumed', Math.round(today.water));
    
    const bigCircle = document.getElementById('hydrationBigCircle');
    if (bigCircle) {
        const degrees = (displayPercent / 100) * 360;
        bigCircle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--light) ${degrees}deg)`;
    }
}

function updateActivityDisplay() {
    const today = getTodayData();
    setElementText('stepsCount', today.steps);
    setElementText('exerciseTime', today.exercise.duration + ' min');
}

function updateSleepDisplay() {
    const today = getTodayData();
    setElementText('lastSleep', today.sleep.hours + 'h');
}

function updateMeditationDisplay() {
    const today = getTodayData();
    setElementText('meditationTotal', today.meditation.total + ' min');
}

function updateGlobalScore() {
    const scores = calculateDailyScores(getTodayData());
    setElementText('globalScore', `Score global: ${scores.global}%`);
}

function updateRecommendations() {
    const today = getTodayData();
    const needs = getCurrentNeeds();
    const recommendations = [];
    
    if (today.water < needs.water * 0.7) {
        recommendations.push('💧 Buvez plus d\'eau');
    }
    
    if (calculateTotalProtein() < needs.protein * 0.7) {
        recommendations.push('🥩 Mangez plus de protéines');
    }
    
    if (today.steps < 5000) {
        recommendations.push('👣 Marchez plus');
    }
    
    if (today.meditation.total < 5) {
        recommendations.push('🧘 Méditez 5 minutes');
    }
    
    if (today.bowel.length === 0) {
        recommendations.push('🚽 Enregistrez votre selle');
    }
    
    const recDiv = document.getElementById('recommendations');
    if (recDiv) {
        if (recommendations.length > 0) {
            recDiv.innerHTML = '<h3>Recommandations</h3>' +
                recommendations.map(r => `<div class="recommendation-item">${r}</div>`).join('');
        } else {
            recDiv.innerHTML = '<h3>🌟 Parfait ! Vous êtes à jour</h3>';
        }
    }
}

// ==================== FONCTIONS D'ACTION ====================
function addWater(amount) {
    const today = getTodayData();
    today.water += amount;
    today.waterHistory.push(amount);
    updateWaterDisplay();
    saveState();
}

function confirmAddWater() {
    const amount = parseFloat(document.getElementById('customWaterAmount')?.value);
    if (amount && amount > 0) {
        addWater(amount);
        closeConfirmModal();
    }
}

function confirmAddWaterPreset(amount) {
    addWater(amount);
}

function undoLastWater() {
    const today = getTodayData();
    if (today.waterHistory.length > 0) {
        today.water -= today.waterHistory.pop();
        if (today.water < 0) today.water = 0;
        updateWaterDisplay();
        saveState();
    }
}

function clearWater() {
    if (confirm('Réinitialiser l\'eau ?')) {
        const today = getTodayData();
        today.water = 0;
        today.waterHistory = [];
        updateWaterDisplay();
        saveState();
    }
}

function addFood() {
    const foodId = parseInt(document.getElementById('foodSelect')?.value);
    if (!foodId) {
        alert('Choisissez un aliment');
        return;
    }
    
    const food = appState.foodDatabase.find(f => f.id === foodId);
    let quantity;
    
    if (appState.quantityType === 'weight') {
        quantity = parseFloat(document.getElementById('foodQuantity')?.value);
    } else {
        const units = parseFloat(document.getElementById('foodUnits')?.value);
        if (!food.unitWeight) {
            alert('Poids unitaire non défini');
            return;
        }
        quantity = units * food.unitWeight;
    }
    
    if (!quantity || quantity <= 0) {
        alert('Quantité invalide');
        return;
    }
    
    const factor = quantity / 100;
    const consumedFood = {
        ...food,
        originalQuantity: quantity,
        protein: food.protein * factor,
        carbs: food.carbs * factor,
        fats: food.fats * factor,
        fiber: (food.fiber || 0) * factor,
        calories: (food.calories || 0) * factor
    };
    
    const today = getTodayData();
    today.foods.push(consumedFood);
    today.foodHistory.push(today.foods.length - 1);
    
    updateAllDisplays();
    saveState();
}

function undoLastFood() {
    const today = getTodayData();
    if (today.foodHistory.length > 0) {
        today.foods.pop();
        today.foodHistory.pop();
        updateAllDisplays();
        saveState();
    }
}

function clearAllFoods() {
    if (confirm('Supprimer tous les aliments ?')) {
        const today = getTodayData();
        today.foods = [];
        today.foodHistory = [];
        updateAllDisplays();
        saveState();
    }
}

function logBowel() {
    const time = document.getElementById('bowelTime')?.value || new Date().toLocaleTimeString();
    const type = document.getElementById('bowelType')?.value || '4';
    
    const today = getTodayData();
    today.bowel.push({ time, type: parseInt(type), timestamp: new Date() });
    
    setElementText('lastBowel', time);
    updateCircle('colon', 50);
    saveState();
}

function undoLastBowel() {
    const today = getTodayData();
    if (today.bowel.length > 0) {
        today.bowel.pop();
        const lastBowel = today.bowel[today.bowel.length - 1];
        setElementText('lastBowel', lastBowel ? lastBowel.time : 'Non enregistrée');
        updateCircle('colon', today.bowel.length > 0 ? 50 : 0);
        saveState();
    }
}

function addSteps() {
    const steps = parseInt(document.getElementById('stepsInput')?.value);
    if (steps && steps > 0) {
        const today = getTodayData();
        today.steps += steps;
        updateAllDisplays();
        document.getElementById('stepsInput').value = '';
        saveState();
    }
}

function logExercise() {
    const duration = parseInt(document.getElementById('exerciseDuration')?.value);
    if (duration && duration > 0) {
        const today = getTodayData();
        today.exercise.duration += duration;
        today.exercise.sessions.push({ duration });
        updateAllDisplays();
        saveState();
    }
}

function undoLastExercise() {
    const today = getTodayData();
    if (today.exercise.sessions.length > 0) {
        const last = today.exercise.sessions.pop();
        today.exercise.duration -= last.duration;
        if (today.exercise.duration < 0) today.exercise.duration = 0;
        updateAllDisplays();
        saveState();
    }
}

function logSleep() {
    const hours = parseFloat(document.getElementById('sleepHours')?.value);
    if (hours && hours > 0) {
        const today = getTodayData();
        today.sleep = { hours, quality: document.getElementById('sleepQuality')?.value };
        updateAllDisplays();
        saveState();
    }
}

function undoLastSleep() {
    const today = getTodayData();
    today.sleep = { hours: 0, quality: '' };
    updateAllDisplays();
    saveState();
}

// ==================== MÉDITATION ====================
let meditationTimer = null;
let meditationSeconds = 300;
let meditationActive = false;
let meditationPaused = false;
let currentMeditationSession = null;

function setMeditationTime(minutes) {
    meditationSeconds = minutes * 60;
    updateMeditationTimer();
}

function updateMeditationTimer() {
    const mins = Math.floor(meditationSeconds / 60);
    const secs = meditationSeconds % 60;
    setElementText('meditationTimer', `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
}

function startMeditation() {
    if (meditationActive) return;
    
    meditationActive = true;
    meditationPaused = false;
    currentMeditationSession = { startTime: new Date() };
    
    document.getElementById('startMeditationBtn').style.display = 'none';
    document.getElementById('pauseMeditationBtn').style.display = 'inline-block';
    document.getElementById('stopMeditationBtn').style.display = 'inline-block';
    
    meditationTimer = setInterval(() => {
        if (!meditationPaused && meditationSeconds > 0) {
            meditationSeconds--;
            updateMeditationTimer();
        }
    }, 1000);
}

function pauseMeditation() {
    meditationPaused = !meditationPaused;
    document.getElementById('pauseMeditationBtn').textContent = meditationPaused ? 'Reprendre' : 'Pause';
}

function stopMeditation() {
    if (meditationTimer) {
        clearInterval(meditationTimer);
        meditationTimer = null;
    }
    meditationActive = false;
    
    document.getElementById('startMeditationBtn').style.display = 'inline-block';
    document.getElementById('pauseMeditationBtn').style.display = 'none';
    document.getElementById('stopMeditationBtn').style.display = 'none';
}

function logMeditation() {
    if (currentMeditationSession) {
        const minutes = Math.round((new Date() - currentMeditationSession.startTime) / 60000);
        if (minutes > 0) {
            const today = getTodayData();
            today.meditation.total += minutes;
            today.meditation.sessions.push({ minutes });
            updateAllDisplays();
            saveState();
        }
    }
    stopMeditation();
    setMeditationTime(5);
}

function undoLastMeditation() {
    const today = getTodayData();
    if (today.meditation.sessions.length > 0) {
        const last = today.meditation.sessions.pop();
        today.meditation.total -= last.minutes;
        if (today.meditation.total < 0) today.meditation.total = 0;
        updateAllDisplays();
        saveState();
    }
}

// ==================== BASE DE DONNÉES ALIMENTS ====================
function loadFoodSelect() {
    const select = document.getElementById('foodSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choisir...</option>';
    appState.foodDatabase.sort((a, b) => a.name.localeCompare(b.name)).forEach(food => {
        select.innerHTML += `<option value="${food.id}">${food.name}</option>`;
    });
}

function setQuantityType(type) {
    appState.quantityType = type;
    document.querySelectorAll('.qty-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');
    
    document.getElementById('weightInput').style.display = type === 'weight' ? 'block' : 'none';
    document.getElementById('unitInput').style.display = type === 'unit' ? 'block' : 'none';
}

function addNewFood() {
    const name = document.getElementById('newFoodName')?.value;
    if (!name) {
        alert('Entrez un nom');
        return;
    }
    
    const newFood = {
        id: appState.nextFoodId++,
        name: name,
        protein: parseFloat(document.getElementById('newFoodProtein')?.value) || 0,
        carbs: parseFloat(document.getElementById('newFoodCarbs')?.value) || 0,
        fats: parseFloat(document.getElementById('newFoodFats')?.value) || 0,
        fiber: parseFloat(document.getElementById('newFoodFiber')?.value) || 0,
        unitWeight: parseFloat(document.getElementById('newFoodUnitWeight')?.value) || null
    };
    
    appState.foodDatabase.push(newFood);
    
    // Reset form
    ['newFoodName', 'newFoodProtein', 'newFoodCarbs', 'newFoodFats', 'newFoodFiber', 'newFoodUnitWeight']
        .forEach(id => document.getElementById(id).value = '');
    
    loadFoodSelect();
    updateFoodDatabaseList();
    saveState();
    alert('Aliment ajouté');
}

function updateFoodDatabaseList() {
    const list = document.getElementById('foodDatabaseList');
    if (!list) return;
    
    list.innerHTML = '';
    appState.foodDatabase.sort((a, b) => a.name.localeCompare(b.name)).forEach(food => {
        list.innerHTML += `
            <li>
                <strong>${food.name}</strong><br>
                <small>P:${food.protein}g G:${food.carbs}g L:${food.fats}g F:${food.fiber}g</small>
                ${food.unitWeight ? `<br><small>1 unité = ${food.unitWeight}g</small>` : ''}
            </li>
        `;
    });
}

// ==================== RAPPELS ====================
function saveReminders() {
    appState.reminders = {
        water: document.getElementById('reminderWater')?.checked || false,
        protein: document.getElementById('reminderProtein')?.checked || false,
        meditation: document.getElementById('reminderMeditation')?.checked || false,
        sleep: document.getElementById('reminderSleep')?.checked || false,
        waterFrequency: parseInt(document.getElementById('reminderWaterFrequency')?.value) || 60,
        proteinTime: document.getElementById('reminderProteinTime')?.value || '12:00',
        meditationTime: document.getElementById('reminderMeditationTime')?.value || '18:00',
        bedTime: document.getElementById('reminderBedTime')?.value || '22:00'
    };
    
    saveState();
    alert('Rappels sauvegardés');
}

// ==================== NOTIFICATIONS ====================
function showNotifications() {
    const panel = document.getElementById('notificationPanel');
    const list = document.getElementById('notificationsList');
    
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        return;
    }
    
    let html = '';
    appState.notifications.forEach(n => {
        html += `<div class="notification-item">
                    <strong>${n.title}</strong>
                    <p>${n.message}</p>
                    <small>${n.time}</small>
                </div>`;
    });
    
    if (html === '') {
        html = '<div class="notification-item">Aucune notification</div>';
    }
    
    list.innerHTML = html;
    panel.style.display = 'block';
    
    // Marquer comme lues
    appState.notifications.forEach(n => n.read = true);
    updateNotificationBell();
}

function closeNotifications() {
    document.getElementById('notificationPanel').style.display = 'none';
}

function updateNotificationBell() {
    const unread = appState.notifications.filter(n => !n.read).length;
    const bell = document.getElementById('notificationBell');
    if (bell) {
        bell.innerHTML = unread > 0 ? `🔔 (${unread})` : '🔔';
    }
}

// ==================== PROFIL ====================
function updateUserInfoDisplay() {
    setElementText('userInfoDisplay', `${appState.user.age} ans | ${appState.user.weight}kg | ${appState.user.height}cm`);
    setElementText('profileAge', appState.user.age + ' ans');
    setElementText('profileWeight', appState.user.weight + ' kg');
    setElementText('profileHeight', appState.user.height + ' cm');
    
    if (appState.user.height && appState.user.weight) {
        const bmi = (appState.user.weight / ((appState.user.height / 100) ** 2)).toFixed(1);
        setElementText('profileBMI', bmi);
    }
}

function editProfile() {
    document.getElementById('editAge').value = appState.user.age;
    document.getElementById('editWeight').value = appState.user.weight;
    document.getElementById('editHeight').value = appState.user.height;
    document.getElementById('editGender').value = appState.user.gender;
    document.getElementById('editProfileModal').style.display = 'flex';
}

function saveProfileChanges() {
    appState.user.age = parseInt(document.getElementById('editAge').value);
    appState.user.weight = parseFloat(document.getElementById('editWeight').value);
    appState.user.height = parseFloat(document.getElementById('editHeight').value);
    appState.user.gender = document.getElementById('editGender').value;
    
    updateUserInfoDisplay();
    calculateNeeds();
    updateAllDisplays();
    saveState();
    closeEditModal();
}

function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// ==================== SECTION SWITCHING ====================
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const sectionEl = document.getElementById(section + 'Section');
    if (sectionEl) {
        sectionEl.style.display = 'block';
        
        // Mettre à jour le calendrier si nécessaire
        if (section === 'calendrier') {
            showCalendar();
        }
    }
}

// ==================== UTILITAIRES ====================
function confirmAction() {
    if (appState.pendingAction === 'water') {
        addWater(appState.pendingData);
    }
    closeConfirmModal();
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    appState.pendingData = null;
    appState.pendingAction = null;
}

function saveState() {
    localStorage.setItem('healthAppState', JSON.stringify(appState));
}

function loadSavedData() {
    const saved = localStorage.getItem('healthAppState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.user && parsed.user.age) {
                appState = parsed;
                appState.currentDay = new Date().toISOString().split('T')[0];
                
                if (!appState.daily[appState.currentDay]) {
                    appState.daily[appState.currentDay] = createEmptyDay();
                }
                
                document.getElementById('ageModal').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                
                updateUserInfoDisplay();
                calculateNeeds();
                updateAllDisplays();
                loadFoodSelect();
                updateFoodDatabaseList();
            }
        } catch (e) {
            console.log('Erreur de chargement');
        }
    }
}

function calculateNeeds() {
    // Les besoins sont calculés à la volée
}

function exportData() {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sante-${appState.currentDay}.json`;
    a.click();
}

function resetAllData() {
    if (confirm('Réinitialiser toutes les données ?')) {
        localStorage.removeItem('healthAppState');
        location.reload();
    }
}

// ==================== INITIALISATION ====================
window.onload = function() {
    loadSavedData();
    
    // Événements
    document.getElementById('bowelNote')?.addEventListener('input', function() {
        document.getElementById('bowelNoteValue').textContent = this.value + '/10';
    });
    
    // Démarrer les mises à jour
    startRealTimeUpdates();
};

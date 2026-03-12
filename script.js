// ==================== ÉTAT DE L'APPLICATION ====================
let appState = {
    user: {
        age: null,
        weight: null,
        height: null,
        gender: 'male'
    },
    today: {
        sleep: { hours: 0, quality: '' },
        water: 0,
        waterHistory: [],
        foods: [],
        foodHistory: [],
        exercise: { duration: 0, sessions: [] },
        steps: 0,
        meditation: { total: 0, sessions: [] },
        bowel: []
    },
    foodDatabase: [
        { id: 1, name: 'Riz', protein: 2.7, carbs: 28, fats: 0.3 },
        { id: 2, name: 'Poulet', protein: 31, carbs: 0, fats: 3.6 },
        { id: 3, name: 'Œuf', protein: 13, carbs: 1.1, fats: 11 },
        { id: 4, name: 'Pomme', protein: 0.3, carbs: 14, fats: 0.2 },
        { id: 5, name: 'Banane', protein: 1.1, carbs: 23, fats: 0.3 }
    ],
    nextFoodId: 6,
    quantityType: 'weight'
};

// ==================== VARIABLES MÉDITATION ====================
let meditationTimer = null;
let meditationSeconds = 300;
let meditationActive = false;
let meditationPaused = false;
let currentMeditationSession = null;

// ==================== FONCTION PRINCIPALE ====================
function saveUserInfo() {
    console.log("saveUserInfo appelée");
    
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
    
    // Fermer le modal
    document.getElementById('ageModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    updateUserInfoDisplay();
    calculateNeeds();
    updateAllDisplays();
    loadFoodSelect();
    updateFoodDatabaseList();
    saveState();
}

// ==================== CALCULS ====================
function calculateNeeds() {
    if (!appState.user.weight) return;
    
    const weight = appState.user.weight;
    const age = appState.user.age;
    
    // Sommeil
    if (age < 18) appState.sleepTarget = 9;
    else if (age < 65) appState.sleepTarget = 8;
    else appState.sleepTarget = 7.5;
    
    // Eau
    appState.waterTarget = Math.round(weight * 35);
    
    // Protéines
    appState.proteinTarget = Math.round(weight * 0.8);
    
    // Glucides
    appState.carbsTarget = Math.round(weight * 4);
    
    // Lipides
    appState.fatsTarget = Math.round(weight * 1);
    
    // Mise à jour affichage
    let elements = {
        'sleepTarget': appState.sleepTarget + 'h',
        'waterTarget': appState.waterTarget,
        'proteinNeeded': appState.proteinTarget,
        'carbsNeeded': appState.carbsTarget,
        'fatsNeeded': appState.fatsTarget
    };
    
    for (let id in elements) {
        let el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    }
}

// ==================== MISE À JOUR AFFICHAGE ====================
function updateAllDisplays() {
    updateNutritionDisplay();
    updateWaterDisplay();
    updateActivityDisplay();
    updateSleepDisplay();
    updateMeditationDisplay();
    updateColonDisplay();
    updateRecommendations();
}

function updateNutritionDisplay() {
    let protein = 0, carbs = 0, fats = 0;
    
    appState.today.foods.forEach(food => {
        protein += food.protein || 0;
        carbs += food.carbs || 0;
        fats += food.fats || 0;
    });
    
    setText('proteinEaten', Math.round(protein));
    setText('carbsEaten', Math.round(carbs));
    setText('fatsEaten', Math.round(fats));
    
    setWidth('proteinBar', (protein / appState.proteinTarget) * 100);
    setWidth('carbsBar', (carbs / appState.carbsTarget) * 100);
    setWidth('fatsBar', (fats / appState.fatsTarget) * 100);
    
    let avgPercent = ((protein / appState.proteinTarget) + 
                     (carbs / appState.carbsTarget) + 
                     (fats / appState.fatsTarget)) / 3 * 100;
    updateCircle('nutrition', avgPercent);
}

function updateWaterDisplay() {
    let percent = (appState.today.water / appState.waterTarget) * 100;
    let displayPercent = Math.min(Math.round(percent), 100);
    
    setText('hydrationPercent', displayPercent + '%');
    setText('waterConsumed', Math.round(appState.today.water));
    
    let bigCircle = document.getElementById('hydrationBigCircle');
    if (bigCircle) {
        let degrees = (displayPercent / 100) * 360;
        bigCircle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--light) ${degrees}deg)`;
    }
    
    updateCircle('hydration', percent);
}

function updateActivityDisplay() {
    setText('stepsCount', appState.today.steps);
    setText('exerciseTime', appState.today.exercise.duration + ' min');
    
    let score = ((appState.today.steps / 8000) * 50) + ((appState.today.exercise.duration / 30) * 50);
    updateCircle('activity', score);
}

function updateSleepDisplay() {
    setText('lastSleep', appState.today.sleep.hours + 'h');
    let percent = (appState.today.sleep.hours / appState.sleepTarget) * 100;
    updateCircle('sleep', percent);
}

function updateMeditationDisplay() {
    setText('meditationTotal', appState.today.meditation.total + ' min');
    let percent = (appState.today.meditation.total / 10) * 100;
    updateCircle('meditation', percent);
}

function updateColonDisplay() {
    if (appState.today.bowel.length > 0) {
        let last = appState.today.bowel[appState.today.bowel.length - 1];
        setText('lastBowel', last.time);
    }
    updateCircle('colon', appState.today.bowel.length > 0 ? 50 : 0);
}

function updateCircle(section, percent) {
    let displayPercent = Math.min(Math.round(percent), 100);
    let circle = document.getElementById(section + 'Circle');
    if (circle) {
        let value = circle.querySelector('.progress-value');
        if (value) value.textContent = displayPercent + '%';
        let degrees = (displayPercent / 100) * 360;
        circle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--light) ${degrees}deg)`;
    }
}

function setText(id, value) {
    let el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setWidth(id, percent) {
    let el = document.getElementById(id);
    if (el) el.style.width = Math.min(percent, 100) + '%';
}

function updateRecommendations() {
    let recs = [];
    
    if (appState.today.water < appState.waterTarget * 0.7) {
        recs.push('💧 Buvez plus d\'eau');
    }
    
    let protein = appState.today.foods.reduce((s, f) => s + f.protein, 0);
    if (protein < appState.proteinTarget * 0.7) {
        recs.push('🥩 Mangez plus de protéines');
    }
    
    if (appState.today.steps < 5000) {
        recs.push('👣 Marchez plus');
    }
    
    if (appState.today.meditation.total < 5) {
        recs.push('🧘 Méditez 5 minutes');
    }
    
    let recDiv = document.getElementById('recommendations');
    if (recDiv) {
        if (recs.length > 0) {
            recDiv.innerHTML = '<h3>Recommandations</h3>' + 
                recs.map(r => `<div class="recommendation-item">${r}</div>`).join('');
        } else {
            recDiv.innerHTML = '<h3>🌟 Parfait !</h3>';
        }
    }
}

// ==================== SECTION SWITCHING ====================
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    let el = document.getElementById(section + 'Section');
    if (el) el.style.display = 'block';
}

// ==================== FONCTIONS EAU ====================
function addWater(amount) {
    appState.today.water += amount;
    appState.today.waterHistory.push(amount);
    updateWaterDisplay();
    saveState();
}

function undoLastWater() {
    if (appState.today.waterHistory.length > 0) {
        appState.today.water -= appState.today.waterHistory.pop();
        if (appState.today.water < 0) appState.today.water = 0;
        updateWaterDisplay();
        saveState();
    }
}

function clearWater() {
    if (confirm('Réinitialiser l\'eau ?')) {
        appState.today.water = 0;
        appState.today.waterHistory = [];
        updateWaterDisplay();
        saveState();
    }
}

// ==================== FONCTIONS ALIMENTS ====================
function loadFoodSelect() {
    let select = document.getElementById('foodSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choisir...</option>';
    appState.foodDatabase.sort((a, b) => a.name.localeCompare(b.name)).forEach(food => {
        select.innerHTML += `<option value="${food.id}">${food.name}</option>`;
    });
}

function addFood() {
    let foodId = parseInt(document.getElementById('foodSelect')?.value);
    if (!foodId) {
        alert('Choisissez un aliment');
        return;
    }
    
    let food = appState.foodDatabase.find(f => f.id === foodId);
    let quantity = parseFloat(document.getElementById('foodQuantity')?.value) || 100;
    let factor = quantity / 100;
    
    let consumed = {
        ...food,
        quantity: quantity,
        protein: (food.protein || 0) * factor,
        carbs: (food.carbs || 0) * factor,
        fats: (food.fats || 0) * factor
    };
    
    appState.today.foods.push(consumed);
    appState.today.foodHistory.push(appState.today.foods.length - 1);
    
    updateAllDisplays();
    updateTodayFoodsList();
    saveState();
}

function updateTodayFoodsList() {
    let list = document.getElementById('foodList');
    if (!list) return;
    
    list.innerHTML = '';
    appState.today.foods.forEach((food, i) => {
        list.innerHTML += `<li>${food.name} (${food.quantity}g) 
            <button onclick="removeFood(${i})">✕</button></li>`;
    });
}

function removeFood(index) {
    appState.today.foods.splice(index, 1);
    appState.today.foodHistory = appState.today.foodHistory.filter(i => i !== index);
    updateAllDisplays();
    updateTodayFoodsList();
    saveState();
}

function undoLastFood() {
    if (appState.today.foodHistory.length > 0) {
        appState.today.foods.pop();
        appState.today.foodHistory.pop();
        updateAllDisplays();
        updateTodayFoodsList();
        saveState();
    }
}

// ==================== FONCTIONS ACTIVITÉ ====================
function addSteps() {
    let steps = parseInt(document.getElementById('stepsInput')?.value);
    if (steps && steps > 0) {
        appState.today.steps += steps;
        updateAllDisplays();
        document.getElementById('stepsInput').value = '';
        saveState();
    }
}

function logExercise() {
    let duration = parseInt(document.getElementById('exerciseDuration')?.value);
    if (duration && duration > 0) {
        appState.today.exercise.duration += duration;
        appState.today.exercise.sessions.push({ duration });
        updateAllDisplays();
        document.getElementById('exerciseDuration').value = '';
        saveState();
    }
}

function undoLastExercise() {
    if (appState.today.exercise.sessions.length > 0) {
        let last = appState.today.exercise.sessions.pop();
        appState.today.exercise.duration -= last.duration;
        if (appState.today.exercise.duration < 0) appState.today.exercise.duration = 0;
        updateAllDisplays();
        saveState();
    }
}

// ==================== FONCTIONS SOMMEIL ====================
function logSleep() {
    let hours = parseFloat(document.getElementById('sleepHours')?.value);
    if (hours && hours > 0) {
        appState.today.sleep = {
            hours: hours,
            quality: document.getElementById('sleepQuality')?.value
        };
        updateAllDisplays();
        saveState();
    }
}

function undoLastSleep() {
    appState.today.sleep = { hours: 0, quality: '' };
    updateAllDisplays();
    saveState();
}

// ==================== FONCTIONS CÔLON ====================
function logBowel() {
    let time = document.getElementById('bowelTime')?.value || new Date().toLocaleTimeString();
    let type = document.getElementById('bowelType')?.value || '4';
    
    appState.today.bowel.push({ time, type: parseInt(type) });
    updateAllDisplays();
    saveState();
}

function undoLastBowel() {
    if (appState.today.bowel.length > 0) {
        appState.today.bowel.pop();
        updateAllDisplays();
        saveState();
    }
}

// ==================== FONCTIONS MÉDITATION ====================
function setMeditationTime(minutes) {
    meditationSeconds = minutes * 60;
    updateMeditationTimer();
}

function updateMeditationTimer() {
    let mins = Math.floor(meditationSeconds / 60);
    let secs = meditationSeconds % 60;
    let timer = document.getElementById('meditationTimer');
    if (timer) {
        timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function startMeditation() {
    if (meditationActive) return;
    
    meditationActive = true;
    currentMeditationSession = { startTime: new Date() };
    
    document.getElementById('startMeditationBtn').style.display = 'none';
    document.getElementById('stopMeditationBtn').style.display = 'inline-block';
    
    meditationTimer = setInterval(() => {
        if (meditationSeconds > 0) {
            meditationSeconds--;
            updateMeditationTimer();
        }
    }, 1000);
}

function stopMeditation() {
    if (meditationTimer) {
        clearInterval(meditationTimer);
        meditationTimer = null;
    }
    meditationActive = false;
    
    document.getElementById('startMeditationBtn').style.display = 'inline-block';
    document.getElementById('stopMeditationBtn').style.display = 'none';
}

function logMeditation() {
    if (currentMeditationSession) {
        let minutes = Math.round((new Date() - currentMeditationSession.startTime) / 60000);
        if (minutes > 0) {
            appState.today.meditation.total += minutes;
            appState.today.meditation.sessions.push({ minutes });
            updateAllDisplays();
            saveState();
        }
    }
    stopMeditation();
    setMeditationTime(5);
}

function undoLastMeditation() {
    if (appState.today.meditation.sessions.length > 0) {
        let last = appState.today.meditation.sessions.pop();
        appState.today.meditation.total -= last.minutes;
        if (appState.today.meditation.total < 0) appState.today.meditation.total = 0;
        updateAllDisplays();
        saveState();
    }
}

// ==================== BASE DE DONNÉES ALIMENTS ====================
function addNewFood() {
    let name = document.getElementById('newFoodName')?.value;
    if (!name) {
        alert('Entrez un nom');
        return;
    }
    
    let newFood = {
        id: appState.nextFoodId++,
        name: name,
        protein: parseFloat(document.getElementById('newFoodProtein')?.value) || 0,
        carbs: parseFloat(document.getElementById('newFoodCarbs')?.value) || 0,
        fats: parseFloat(document.getElementById('newFoodFats')?.value) || 0
    };
    
    appState.foodDatabase.push(newFood);
    
    document.getElementById('newFoodName').value = '';
    document.getElementById('newFoodProtein').value = '';
    document.getElementById('newFoodCarbs').value = '';
    document.getElementById('newFoodFats').value = '';
    
    loadFoodSelect();
    updateFoodDatabaseList();
    saveState();
}

function updateFoodDatabaseList() {
    let list = document.getElementById('foodDatabaseList');
    if (!list) return;
    
    list.innerHTML = '';
    appState.foodDatabase.sort((a, b) => a.name.localeCompare(b.name)).forEach(food => {
        list.innerHTML += `<li>${food.name} - P:${food.protein} G:${food.carbs} L:${food.fats}</li>`;
    });
}

// ==================== PROFIL ====================
function updateUserInfoDisplay() {
    let display = document.getElementById('userInfoDisplay');
    if (display) {
        display.innerHTML = `${appState.user.age} ans | ${appState.user.weight}kg | ${appState.user.height}cm`;
    }
    
    setText('profileAge', appState.user.age + ' ans');
    setText('profileWeight', appState.user.weight + ' kg');
    setText('profileHeight', appState.user.height + ' cm');
    
    if (appState.user.height && appState.user.weight) {
        let bmi = (appState.user.weight / ((appState.user.height / 100) ** 2)).toFixed(1);
        setText('profileBMI', bmi);
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

// ==================== SAUVEGARDE ====================
function saveState() {
    localStorage.setItem('healthAppState', JSON.stringify(appState));
}

function loadSavedData() {
    let saved = localStorage.getItem('healthAppState');
    if (saved) {
        try {
            let parsed = JSON.parse(saved);
            if (parsed.user && parsed.user.age) {
                appState = parsed;
                
                document.getElementById('ageModal').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                
                updateUserInfoDisplay();
                calculateNeeds();
                updateAllDisplays();
                loadFoodSelect();
                updateFoodDatabaseList();
                updateTodayFoodsList();
            }
        } catch (e) {
            console.log('Erreur chargement');
        }
    }
}

// ==================== INITIALISATION ====================
window.onload = function() {
    loadSavedData();
    setMeditationTime(5);
};

// Sauvegarde automatique
setInterval(saveState, 30000);

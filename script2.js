// ==================== ÉTAT DE L'APPLICATION ====================
let appState = {
    user: {
        age: null,
        weight: null,
        height: null,
        gender: 'male',
        wakeUpTime: '07:00',
        bedTime: '22:00'
    },
    today: {
        date: new Date().toDateString(),
        sleep: { hours: 0, quality: '' },
        water: 0,
        waterHistory: [],
        foods: [],
        foodHistory: [],
        exercise: { duration: 0, type: '', sessions: [] },
        steps: 0,
        stepsHistory: [],
        meditation: { total: 0, sessions: [] },
        bowel: []
    },
    foodDatabase: [
        { id: 1, name: 'Riz', protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, calories: 130, unitWeight: null },
        { id: 2, name: 'Blanc de poulet', protein: 31, carbs: 0, fats: 3.6, fiber: 0, calories: 165, unitWeight: null },
        { id: 3, name: 'Œuf', protein: 13, carbs: 1.1, fats: 11, fiber: 0, calories: 155, unitWeight: 60 },
        { id: 4, name: 'Pomme', protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, calories: 52, unitWeight: 150 },
        { id: 5, name: 'Banane', protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, calories: 89, unitWeight: 120 },
        { id: 6, name: 'Lait', protein: 3.4, carbs: 5, fats: 3.6, fiber: 0, calories: 62, unitWeight: null },
        { id: 7, name: 'Pain complet', protein: 9, carbs: 49, fats: 3.2, fiber: 7, calories: 265, unitWeight: 50 },
        { id: 8, name: 'Poisson', protein: 22, carbs: 0, fats: 12, fiber: 0, calories: 206, unitWeight: null },
        { id: 9, name: 'Pomme de terre', protein: 2, carbs: 17, fats: 0.1, fiber: 2.2, calories: 77, unitWeight: 150 },
        { id: 10, name: 'Yaourt nature', protein: 10, carbs: 3.6, fats: 3.3, fiber: 0, calories: 61, unitWeight: 125 }
    ],
    nextFoodId: 11,
    quantityType: 'weight',
    pendingAction: null,
    pendingData: null,
    reminders: {
        wakeUp: true, breakfast: true, lunch: true, dinner: true,
        water: true, meditation: true, sleep: true,
        waterFrequency: 60,
        wakeUpTime: '07:00', breakfastTime: '08:00', lunchTime: '12:30',
        dinnerTime: '19:30', meditationTime: '18:00', bedTime: '22:00'
    },
    notifications: []
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
    const wakeUpTime = document.getElementById('wakeUpTime').value;
    const bedTime = document.getElementById('bedTime').value;
    
    if (!age || !weight || !height) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    appState.user.age = parseInt(age);
    appState.user.weight = parseFloat(weight);
    appState.user.height = parseFloat(height);
    appState.user.gender = gender;
    appState.user.wakeUpTime = wakeUpTime;
    appState.user.bedTime = bedTime;
    
    // Fermer le modal et afficher l'app
    document.getElementById('ageModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    updateUserInfoDisplay();
    calculateNeeds();
    updateAllDisplays();
    loadFoodSelect();
    updateFoodDatabaseList();
    saveState();
    
    // Afficher la première section
    showSection('colon');
}

// ==================== FONCTIONS D'AFFICHAGE ====================
function updateUserInfoDisplay() {
    let el = document.getElementById('userInfoDisplay');
    if (el) el.innerHTML = `${appState.user.age} ans | ${appState.user.weight}kg | ${appState.user.height}cm`;
    
    let profileAge = document.getElementById('profileAge');
    let profileWeight = document.getElementById('profileWeight');
    let profileHeight = document.getElementById('profileHeight');
    
    if (profileAge) profileAge.textContent = appState.user.age + ' ans';
    if (profileWeight) profileWeight.textContent = appState.user.weight + ' kg';
    if (profileHeight) profileHeight.textContent = appState.user.height + ' cm';
    
    if (appState.user.height && appState.user.weight) {
        let heightM = appState.user.height / 100;
        let bmi = (appState.user.weight / (heightM * heightM)).toFixed(1);
        let profileBMI = document.getElementById('profileBMI');
        if (profileBMI) profileBMI.textContent = bmi;
    }
}

function calculateNeeds() {
    if (!appState.user.weight) return;
    
    const weight = appState.user.weight;
    const age = appState.user.age;
    const gender = appState.user.gender;
    
    // Sommeil
    if (age < 18) appState.sleepTarget = 9;
    else if (age < 65) appState.sleepTarget = 8;
    else appState.sleepTarget = 7.5;
    
    // Eau
    let waterFactor = 35;
    if (age > 65) waterFactor = 30;
    if (age < 18) waterFactor = 40;
    appState.waterTarget = Math.round(weight * waterFactor);
    
    // Protéines
    let proteinFactor = 0.8;
    if (age > 65) proteinFactor = 1.0;
    if (age < 18) proteinFactor = 1.0;
    appState.proteinTarget = Math.round(weight * proteinFactor);
    
    // Calories (formule simplifiée)
    if (gender === 'male') {
        appState.calorieTarget = Math.round(weight * 33);
    } else {
        appState.calorieTarget = Math.round(weight * 30);
    }
    
    appState.carbsTarget = Math.round(weight * 4);
    appState.fatsTarget = Math.round(weight * 1);
    appState.fiberTarget = gender === 'male' ? 35 : 28;
    
    // Mise à jour des éléments
    let sleepTarget = document.getElementById('sleepTarget');
    let waterTarget = document.getElementById('waterTarget');
    let proteinNeeded = document.getElementById('proteinNeeded');
    let carbsNeeded = document.getElementById('carbsNeeded');
    let fatsNeeded = document.getElementById('fatsNeeded');
    let fiberNeeded = document.getElementById('fiberNeeded');
    let caloriesNeeded = document.getElementById('caloriesNeeded');
    
    if (sleepTarget) sleepTarget.textContent = appState.sleepTarget + 'h';
    if (waterTarget) waterTarget.textContent = appState.waterTarget;
    if (proteinNeeded) proteinNeeded.textContent = appState.proteinTarget;
    if (carbsNeeded) carbsNeeded.textContent = appState.carbsTarget;
    if (fatsNeeded) fatsNeeded.textContent = appState.fatsTarget;
    if (fiberNeeded) fiberNeeded.textContent = appState.fiberTarget;
    if (caloriesNeeded) caloriesNeeded.textContent = appState.calorieTarget;
}

// ==================== SECTION SWITCHING ====================
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    let sectionEl = document.getElementById(section + 'Section');
    if (sectionEl) sectionEl.style.display = 'block';
}

// ==================== NOTIFICATIONS ====================
function showNotifications() {
    let panel = document.getElementById('notificationPanel');
    if (panel) panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function closeNotifications() {
    document.getElementById('notificationPanel').style.display = 'none';
}

// ==================== FONCTIONS CÔLON ====================
function updateBristolInfo() {
    let type = document.getElementById('bowelType')?.value;
    let infoDiv = document.getElementById('bristolInfo');
    if (!type || !infoDiv) return;
    
    const descriptions = {
        '1': 'Type 1 : Constipation sévère',
        '2': 'Type 2 : Constipation légère',
        '3': 'Type 3 : Normal',
        '4': 'Type 4 : Idéal',
        '5': 'Type 5 : Manque de fibres',
        '6': 'Type 6 : Diarrhée légère',
        '7': 'Type 7 : Diarrhée'
    };
    
    infoDiv.textContent = descriptions[type];
}

function logBowel() {
    let time = document.getElementById('bowelTime')?.value || '08:00';
    let type = document.getElementById('bowelType')?.value || '4';
    
    appState.today.bowel.push({ time, type: parseInt(type), timestamp: new Date() });
    
    let lastBowel = document.getElementById('lastBowel');
    if (lastBowel) lastBowel.textContent = time;
    
    updateColonCircle();
    saveState();
    alert('Selle enregistrée');
}

function undoLastBowel() {
    if (appState.today.bowel.length > 0) {
        appState.today.bowel.pop();
        let lastBowel = document.getElementById('lastBowel');
        if (lastBowel) {
            lastBowel.textContent = appState.today.bowel.length > 0 ? 
                appState.today.bowel[appState.today.bowel.length - 1].time : 'Non enregistrée';
        }
        updateColonCircle();
        saveState();
    }
}

function updateColonCircle() {
    let percent = appState.today.bowel.length > 0 ? 50 : 0;
    let circle = document.getElementById('colonCircle');
    if (circle) {
        let value = circle.querySelector('.progress-value');
        if (value) value.textContent = percent + '%';
    }
}

// ==================== FONCTIONS EAU ====================
function confirmAddWater() {
    let amount = parseFloat(document.getElementById('customWaterAmount')?.value);
    if (amount && amount > 0) {
        appState.pendingData = amount;
        document.getElementById('confirmMessage').textContent = `Ajouter ${amount}ml d'eau ?`;
        document.getElementById('confirmModal').style.display = 'flex';
        appState.pendingAction = 'water';
    }
}

function confirmAddWaterPreset(amount) {
    let input = document.getElementById('customWaterAmount');
    if (input) input.value = amount;
    confirmAddWater();
}

function addWater(amount) {
    appState.today.water += amount;
    appState.today.waterHistory.push(amount);
    updateWaterDisplay();
    saveState();
    closeConfirmModal();
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

function updateWaterDisplay() {
    let percent = appState.waterTarget ? (appState.today.water / appState.waterTarget) * 100 : 0;
    let displayPercent = Math.min(Math.round(percent), 100);
    
    let hydrationPercent = document.getElementById('hydrationPercent');
    let waterConsumed = document.getElementById('waterConsumed');
    let hydrationCircle = document.getElementById('hydrationCircle');
    
    if (hydrationPercent) hydrationPercent.textContent = displayPercent + '%';
    if (waterConsumed) waterConsumed.textContent = Math.round(appState.today.water);
    if (hydrationCircle) {
        let value = hydrationCircle.querySelector('.progress-value');
        if (value) value.textContent = displayPercent + '%';
    }
    
    let bigCircle = document.getElementById('hydrationBigCircle');
    if (bigCircle) {
        let degrees = (displayPercent / 100) * 360;
        bigCircle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--light) ${degrees}deg)`;
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

function setQuantityType(type) {
    appState.quantityType = type;
    document.querySelectorAll('.qty-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');
    
    let weightInput = document.getElementById('weightInput');
    let unitInput = document.getElementById('unitInput');
    
    if (weightInput && unitInput) {
        weightInput.style.display = type === 'weight' ? 'block' : 'none';
        unitInput.style.display = type === 'unit' ? 'block' : 'none';
    }
}

function addFood() {
    let foodId = parseInt(document.getElementById('foodSelect')?.value);
    if (!foodId) {
        alert('Veuillez sélectionner un aliment');
        return;
    }
    
    let food = appState.foodDatabase.find(f => f.id === foodId);
    let quantity;
    
    if (appState.quantityType === 'weight') {
        quantity = parseFloat(document.getElementById('foodQuantity')?.value);
        if (!quantity || quantity <= 0) {
            alert('Quantité invalide');
            return;
        }
    } else {
        let units = parseFloat(document.getElementById('foodUnits')?.value);
        if (!units || units <= 0 || !food.unitWeight) {
            alert('Unités invalides');
            return;
        }
        quantity = units * food.unitWeight;
    }
    
    let factor = quantity / 100;
    let consumedFood = {
        ...food,
        originalQuantity: quantity,
        protein: food.protein * factor,
        carbs: food.carbs * factor,
        fats: food.fats * factor,
        fiber: (food.fiber || 0) * factor,
        calories: food.calories * factor
    };
    
    appState.today.foods.push(consumedFood);
    appState.today.foodHistory.push(appState.today.foods.length - 1);
    
    updateNutritionDisplay();
    updateTodayFoodsList();
    saveState();
}

function undoLastFood() {
    if (appState.today.foodHistory.length > 0) {
        appState.today.foods.pop();
        appState.today.foodHistory.pop();
        updateNutritionDisplay();
        updateTodayFoodsList();
        saveState();
    }
}

function clearAllFoods() {
    if (confirm('Supprimer tous les aliments ?')) {
        appState.today.foods = [];
        appState.today.foodHistory = [];
        updateNutritionDisplay();
        updateTodayFoodsList();
        saveState();
    }
}

function updateNutritionDisplay() {
    let totals = { protein: 0, carbs: 0, fats: 0, fiber: 0, calories: 0 };
    
    appState.today.foods.forEach(food => {
        totals.protein += food.protein;
        totals.carbs += food.carbs;
        totals.fats += food.fats;
        totals.fiber += food.fiber || 0;
        totals.calories += food.calories;
    });
    
    let proteinEaten = document.getElementById('proteinEaten');
    let carbsEaten = document.getElementById('carbsEaten');
    let fatsEaten = document.getElementById('fatsEaten');
    let fiberEaten = document.getElementById('fiberEaten');
    let caloriesEaten = document.getElementById('caloriesEaten');
    
    if (proteinEaten) proteinEaten.textContent = Math.round(totals.protein);
    if (carbsEaten) carbsEaten.textContent = Math.round(totals.carbs);
    if (fatsEaten) fatsEaten.textContent = Math.round(totals.fats);
    if (fiberEaten) fiberEaten.textContent = Math.round(totals.fiber);
    if (caloriesEaten) caloriesEaten.textContent = Math.round(totals.calories);
    
    let proteinBar = document.getElementById('proteinBar');
    let carbsBar = document.getElementById('carbsBar');
    let fatsBar = document.getElementById('fatsBar');
    let fiberBar = document.getElementById('fiberBar');
    let caloriesBar = document.getElementById('caloriesBar');
    
    if (proteinBar) proteinBar.style.width = Math.min((totals.protein / appState.proteinTarget) * 100, 100) + '%';
    if (carbsBar) carbsBar.style.width = Math.min((totals.carbs / appState.carbsTarget) * 100, 100) + '%';
    if (fatsBar) fatsBar.style.width = Math.min((totals.fats / appState.fatsTarget) * 100, 100) + '%';
    if (fiberBar) fiberBar.style.width = Math.min((totals.fiber / appState.fiberTarget) * 100, 100) + '%';
    if (caloriesBar) caloriesBar.style.width = Math.min((totals.calories / appState.calorieTarget) * 100, 100) + '%';
    
    let avgPercent = ((totals.protein / appState.proteinTarget) + 
                     (totals.carbs / appState.carbsTarget) + 
                     (totals.fats / appState.fatsTarget)) / 3 * 100;
    let displayPercent = Math.min(Math.round(avgPercent), 100);
    
    let nutritionCircle = document.getElementById('nutritionCircle');
    if (nutritionCircle) {
        let value = nutritionCircle.querySelector('.progress-value');
        if (value) value.textContent = displayPercent + '%';
    }
}

function updateTodayFoodsList() {
    let list = document.getElementById('foodList');
    if (!list) return;
    
    list.innerHTML = '';
    appState.today.foods.forEach((food, index) => {
        list.innerHTML += `
            <li>
                <span>${food.name} (${Math.round(food.originalQuantity)}g)</span>
                <button onclick="removeFood(${index})" class="btn-small">✕</button>
            </li>
        `;
    });
}

function removeFood(index) {
    appState.today.foods.splice(index, 1);
    appState.today.foodHistory = appState.today.foodHistory.filter(i => i !== index);
    updateNutritionDisplay();
    updateTodayFoodsList();
    saveState();
}

// ==================== FONCTIONS ACTIVITÉ ====================
function addSteps() {
    let steps = parseInt(document.getElementById('stepsInput')?.value);
    if (steps && steps > 0) {
        appState.today.steps += steps;
        let stepsCount = document.getElementById('stepsCount');
        if (stepsCount) stepsCount.textContent = appState.today.steps;
        document.getElementById('stepsInput').value = '';
        updateActivityCircle();
        saveState();
    }
}

function logExercise() {
    let duration = parseInt(document.getElementById('exerciseDuration')?.value);
    if (duration && duration > 0) {
        appState.today.exercise.duration += duration;
        appState.today.exercise.sessions.push({ duration });
        let exerciseTime = document.getElementById('exerciseTime');
        if (exerciseTime) exerciseTime.textContent = appState.today.exercise.duration + ' min';
        updateActivityCircle();
        saveState();
    }
}

function undoLastExercise() {
    if (appState.today.exercise.sessions.length > 0) {
        let last = appState.today.exercise.sessions.pop();
        appState.today.exercise.duration -= last.duration;
        if (appState.today.exercise.duration < 0) appState.today.exercise.duration = 0;
        let exerciseTime = document.getElementById('exerciseTime');
        if (exerciseTime) exerciseTime.textContent = appState.today.exercise.duration + ' min';
        updateActivityCircle();
        saveState();
    }
}

function clearSteps() {
    appState.today.steps = 0;
    let stepsCount = document.getElementById('stepsCount');
    if (stepsCount) stepsCount.textContent = '0';
    updateActivityCircle();
    saveState();
}

function clearExercise() {
    appState.today.exercise = { duration: 0, sessions: [] };
    let exerciseTime = document.getElementById('exerciseTime');
    if (exerciseTime) exerciseTime.textContent = '0 min';
    updateActivityCircle();
    saveState();
}

function updateActivityCircle() {
    let score = ((appState.today.steps / 8000) * 50) + ((appState.today.exercise.duration / 30) * 50);
    let displayPercent = Math.min(Math.round(score), 100);
    
    let circle = document.getElementById('activityCircle');
    if (circle) {
        let value = circle.querySelector('.progress-value');
        if (value) value.textContent = displayPercent + '%';
    }
}

// ==================== FONCTIONS SOMMEIL ====================
function logSleep() {
    let hours = parseFloat(document.getElementById('sleepHours')?.value);
    if (hours && hours > 0) {
        appState.today.sleep = { hours, quality: document.getElementById('sleepQuality')?.value };
        let lastSleep = document.getElementById('lastSleep');
        if (lastSleep) lastSleep.textContent = hours + 'h';
        
        let percent = (hours / appState.sleepTarget) * 100;
        let displayPercent = Math.min(Math.round(percent), 100);
        
        let circle = document.getElementById('sleepCircle');
        if (circle) {
            let value = circle.querySelector('.progress-value');
            if (value) value.textContent = displayPercent + '%';
        }
        
        saveState();
    }
}

function undoLastSleep() {
    appState.today.sleep = { hours: 0, quality: '' };
    let lastSleep = document.getElementById('lastSleep');
    if (lastSleep) lastSleep.textContent = '0h';
    
    let circle = document.getElementById('sleepCircle');
    if (circle) {
        let value = circle.querySelector('.progress-value');
        if (value) value.textContent = '0%';
    }
    
    saveState();
}

// ==================== FONCTIONS MÉDITATION ====================
function setMeditationTime(minutes) {
    meditationSeconds = minutes * 60;
    updateMeditationDisplay();
}

function updateMeditationDisplay() {
    let mins = Math.floor(meditationSeconds / 60);
    let secs = meditationSeconds % 60;
    let timer = document.getElementById('meditationTimer');
    if (timer) timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startMeditation() {
    if (meditationActive) return;
    
    meditationActive = true;
    meditationPaused = false;
    
    document.getElementById('startMeditationBtn').style.display = 'none';
    document.getElementById('pauseMeditationBtn').style.display = 'inline-block';
    document.getElementById('stopMeditationBtn').style.display = 'inline-block';
    
    currentMeditationSession = { startTime: new Date() };
    
    meditationTimer = setInterval(() => {
        if (!meditationPaused && meditationSeconds > 0) {
            meditationSeconds--;
            updateMeditationDisplay();
        }
    }, 1000);
}

function pauseMeditation() {
    meditationPaused = !meditationPaused;
    let btn = document.getElementById('pauseMeditationBtn');
    if (btn) btn.textContent = meditationPaused ? 'Reprendre' : 'Pause';
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
        let endTime = new Date();
        let minutes = Math.round((endTime - currentMeditationSession.startTime) / 60000);
        if (minutes > 0) {
            appState.today.meditation.total += minutes;
            appState.today.meditation.sessions.push({ minutes });
            
            let meditationTotal = document.getElementById('meditationTotal');
            if (meditationTotal) meditationTotal.textContent = appState.today.meditation.total + ' min';
            
            updateMeditationCircle();
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
        let meditationTotal = document.getElementById('meditationTotal');
        if (meditationTotal) meditationTotal.textContent = appState.today.meditation.total + ' min';
        updateMeditationCircle();
        saveState();
    }
}

function updateMeditationCircle() {
    let percent = (appState.today.meditation.total / 10) * 100;
    let displayPercent = Math.min(Math.round(percent), 100);
    
    let circle = document.getElementById('meditationCircle');
    if (circle) {
        let value = circle.querySelector('.progress-value');
        if (value) value.textContent = displayPercent + '%';
    }
}

// ==================== BASE DE DONNÉES ALIMENTS ====================
function addNewFood() {
    let name = document.getElementById('newFoodName')?.value;
    if (!name) {
        alert('Veuillez entrer un nom');
        return;
    }
    
    let newFood = {
        id: appState.nextFoodId++,
        name: name,
        protein: parseFloat(document.getElementById('newFoodProtein')?.value) || 0,
        carbs: parseFloat(document.getElementById('newFoodCarbs')?.value) || 0,
        fats: parseFloat(document.getElementById('newFoodFats')?.value) || 0,
        fiber: parseFloat(document.getElementById('newFoodFiber')?.value) || 0,
        calories: parseFloat(document.getElementById('newFoodCalories')?.value) || 0,
        unitWeight: parseFloat(document.getElementById('newFoodUnitWeight')?.value) || null
    };
    
    appState.foodDatabase.push(newFood);
    
    // Reset form
    document.getElementById('newFoodName').value = '';
    document.getElementById('newFoodProtein').value = '0';
    document.getElementById('newFoodCarbs').value = '0';
    document.getElementById('newFoodFats').value = '0';
    document.getElementById('newFoodFiber').value = '0';
    document.getElementById('newFoodCalories').value = '0';
    document.getElementById('newFoodUnitWeight').value = '';
    
    loadFoodSelect();
    updateFoodDatabaseList();
    saveState();
    alert('Aliment ajouté !');
}

function updateFoodDatabaseList() {
    let list = document.getElementById('foodDatabaseList');
    if (!list) return;
    
    list.innerHTML = '';
    appState.foodDatabase.sort((a, b) => a.name.localeCompare(b.name)).forEach(food => {
        list.innerHTML += `
            <li>
                <strong>${food.name}</strong><br>
                <small>P:${food.protein}g G:${food.carbs}g L:${food.fats}g | ${food.calories}kcal</small>
                ${food.unitWeight ? `<br><small>1 unité = ${food.unitWeight}g</small>` : ''}
            </li>
        `;
    });
}

// ==================== RAPPELS ====================
function saveReminders() {
    appState.reminders = {
        wakeUp: document.getElementById('reminderWakeUp')?.checked || false,
        breakfast: document.getElementById('reminderBreakfast')?.checked || false,
        lunch: document.getElementById('reminderLunch')?.checked || false,
        dinner: document.getElementById('reminderDinner')?.checked || false,
        water: document.getElementById('reminderWater')?.checked || false,
        meditation: document.getElementById('reminderMeditation')?.checked || false,
        sleep: document.getElementById('reminderSleep')?.checked || false,
        waterFrequency: parseInt(document.getElementById('reminderWaterFrequency')?.value) || 60,
        wakeUpTime: document.getElementById('reminderWakeUpTime')?.value || '07:00',
        breakfastTime: document.getElementById('reminderBreakfastTime')?.value || '08:00',
        lunchTime: document.getElementById('reminderLunchTime')?.value || '12:30',
        dinnerTime: document.getElementById('reminderDinnerTime')?.value || '19:30',
        meditationTime: document.getElementById('reminderMeditationTime')?.value || '18:00',
        bedTime: document.getElementById('reminderBedTime')?.value || '22:00'
    };
    
    saveState();
    alert('Rappels sauvegardés');
}

// ==================== PROFIL ====================
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
    
    document.getElementById('editProfileModal').style.display = 'none';
    saveState();
}

function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// ==================== RECOMMANDATIONS ====================
function checkRecommendations() {
    let recommendations = [];
    
    if (appState.today.water < appState.waterTarget) {
        let restant = Math.ceil((appState.waterTarget - appState.today.water) / 250);
        recommendations.push(`Buvez encore ${restant} verres d'eau`);
    }
    
    let proteinEaten = appState.today.foods.reduce((sum, f) => sum + f.protein, 0);
    if (proteinEaten < appState.proteinTarget * 0.7) {
        recommendations.push('Augmentez vos protéines');
    }
    
    if (appState.today.meditation.total < 10) {
        recommendations.push('Méditez 10 minutes');
    }
    
    let recDiv = document.getElementById('recommendations');
    if (recDiv) {
        if (recommendations.length > 0) {
            recDiv.innerHTML = '<h3>Recommandations</h3>' +
                recommendations.map(r => `<div class="recommendation-item">${r}</div>`).join('');
        } else {
            recDiv.innerHTML = '<h3>Parfait !</h3>';
        }
    }
}

// ==================== CONFIRMATION ====================
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

// ==================== RÉINITIALISATION ====================
function resetAllData() {
    if (confirm('Réinitialiser toutes les données ?')) {
        localStorage.removeItem('healthAppState');
        location.reload();
    }
}

// ==================== MISE À JOUR GLOBALE ====================
function updateAllDisplays() {
    updateWaterDisplay();
    updateNutritionDisplay();
    updateActivityCircle();
    updateMeditationCircle();
    updateColonCircle();
    checkRecommendations();
    
    if (appState.today.steps > 0) {
        let stepsCount = document.getElementById('stepsCount');
        if (stepsCount) stepsCount.textContent = appState.today.steps;
    }
    
    if (appState.today.exercise.duration > 0) {
        let exerciseTime = document.getElementById('exerciseTime');
        if (exerciseTime) exerciseTime.textContent = appState.today.exercise.duration + ' min';
    }
    
    if (appState.today.sleep.hours > 0) {
        let lastSleep = document.getElementById('lastSleep');
        if (lastSleep) lastSleep.textContent = appState.today.sleep.hours + 'h';
    }
    
    if (appState.today.meditation.total > 0) {
        let meditationTotal = document.getElementById('meditationTotal');
        if (meditationTotal) meditationTotal.textContent = appState.today.meditation.total + ' min';
    }
}

// ==================== SAUVEGARDE ====================
function saveState() {
    localStorage.setItem('healthAppState', JSON.stringify(appState));
}

// ==================== CHARGEMENT ====================
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
            }
        } catch (e) {
            console.log('Erreur de chargement');
        }
    }
}

// ==================== INITIALISATION ====================
window.onload = function() {
    console.log("Page chargée, fonction saveUserInfo disponible:", typeof saveUserInfo);
    
    document.getElementById('ageModal').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    loadSavedData();
    
    let bowelNote = document.getElementById('bowelNote');
    if (bowelNote) {
        bowelNote.addEventListener('input', function() {
            let value = document.getElementById('bowelNoteValue');
            if (value) value.textContent = this.value + '/10';
        });
    }
};

// Sauvegarde automatique
setInterval(saveState, 60000);

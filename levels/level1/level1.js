const Level1 = {
  // Слой для домиков (отдельный, чтобы не мешал персонажам)
    housesLayer: null,
    // Состояние
    currentScene: null,
    currentDialog: null,
    currentQuestion: null,
    dialogIndex: 0,  
    completedScenes: {
        cat: false,
        hen: false,
        turnip: false
    },
    completedCount: 0,
    isMoving: false,
    activeButton: null,
    
    // DOM элементы
    gameContainer: null,
    backgroundLayer: null,
    charactersLayer: null,
    dialogContainer: null,
    dialogText: null,
    dialogNextBtn: null,
    actionButtons: null,
    progressCounter: null,
    resetProgressBtn: null,
    
    // Звуки
    soundEnabled: true,
    soundBgMusic: null,
    soundMove: null,
    soundSuccess: null,
    soundFail: null,
    soundPortal: null,
    
    // Данные
    scenesConfig: null,
    charactersConfig: null,
    
    // Видео слой
    videoLayer: null,
    videoElement: null,
    
    // Позиции объектов на карте
    // Позиции объектов на карте
kolobokPosition: { left: '10%', bottom: '15%' },
housePositions: {
    cat: { left: '20%', bottom: '40%', id: 'cat_house' },
    hen: { left: '50%', bottom: '35%', id: 'hen_house' },
    turnip: { left: '80%', bottom: '45%', id: 'turnip_house' }
},
    
    // Инициализация
    // Инициализация
init: async function() {
    console.log('Level1.init() запущен');
    
    // Получаем DOM элементы
    this.gameContainer = document.getElementById('gameContainer');
    this.backgroundLayer = document.getElementById('backgroundLayer');
    this.charactersLayer = document.getElementById('charactersLayer');
    this.dialogContainer = document.getElementById('dialogContainer');
    this.dialogText = document.getElementById('dialogText');
    this.dialogNextBtn = document.getElementById('dialogNextBtn');
    this.actionButtons = document.getElementById('actionButtons');
    
    console.log('dialogNextBtn:', this.dialogNextBtn);
    console.log('dialogNextBtn disabled:', this.dialogNextBtn.disabled);
    console.log('dialogNextBtn display:', this.dialogNextBtn.style.display);

    // Создаём слой для видео
    this.videoLayer = document.createElement('div');
    this.videoLayer.id = 'videoLayer';
    this.videoLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
        z-index: 50;
        display: none;
        justify-content: center;
        align-items: center;
    `;
    this.gameContainer.appendChild(this.videoLayer);
    
    // Создаём отдельный слой для домиков
    this.housesLayer = document.createElement('div');
    this.housesLayer.id = 'housesLayer';
    this.housesLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 20;
        pointer-events: auto;
    `;
    this.gameContainer.appendChild(this.housesLayer);
    
    // Получаем звуки
    this.soundBgMusic = document.getElementById('level1Music');
    this.soundMove = document.getElementById('moveSound');
    this.soundSuccess = document.getElementById('successSound');
    this.soundFail = document.getElementById('failSound');
    this.soundPortal = document.getElementById('portalSound');
    
    // Загружаем конфигурации
    try {
        const [scenesRes, charactersRes, mapRes] = await Promise.all([
            fetch('/levels/level1/level1_scenes.json'),
            fetch('/levels/level1/characters.json'),
            fetch('/levels/level1/characters_map.json')
        ]);
        this.scenesConfig = await scenesRes.json();
        this.charactersConfig = await charactersRes.json();
        this.mapConfig = await mapRes.json();
        console.log('Конфигурации загружены');
        console.log('Позиции объектов загружены:', this.mapConfig);
    } catch(e) {
        console.error('Ошибка загрузки конфигураций:', e);
        return;
    }
    
    // Загружаем прогресс из localStorage
    this.loadProgress();
    
    // Настраиваем кнопку звука
    this.setupSoundButton();
    
    // Добавляем кнопку сброса прогресса
    this.addResetButton();
    
    // Создаём счётчик прогресса
    this.createProgressCounter();
    
    // Запускаем карту
    this.showMap();
},
    
    loadProgress: function() {
        this.completedScenes.cat = localStorage.getItem('level1_cat') === 'true';
        this.completedScenes.hen = localStorage.getItem('level1_hen') === 'true';
        this.completedScenes.turnip = localStorage.getItem('level1_turnip') === 'true';
        
        this.completedCount = [
            this.completedScenes.cat,
            this.completedScenes.hen,
            this.completedScenes.turnip
        ].filter(Boolean).length;
        
        console.log('Прогресс загружен:', this.completedCount, '/3');
    },
    
    saveProgress: function() {
        localStorage.setItem('level1_cat', this.completedScenes.cat);
        localStorage.setItem('level1_hen', this.completedScenes.hen);
        localStorage.setItem('level1_turnip', this.completedScenes.turnip);
        this.updateProgressDisplay();
        
        // Проверяем, все ли сказки пройдены
        if (this.completedCount === 3) {
            this.showPortal();
        }
    },
    
    updateProgressDisplay: function() {
        if (this.progressCounter) {
            this.progressCounter.innerText = `📜 Прогресс: ${this.completedCount}/3`;
        }
        
        // Обновляем галочки над домиками
        this.updateCheckmarks();
    },
    
    updateCheckmarks: function() {
    // Удаляем старые галочки
    document.querySelectorAll('.checkmark').forEach(el => el.remove());
    
    // Добавляем галочки для пройденных сказок
    if (this.completedScenes.cat) {
        this.addCheckmarkToHouse('cat_house');
    }
    if (this.completedScenes.hen) {
        this.addCheckmarkToHouse('hen_house');
    }
    if (this.completedScenes.turnip) {
        this.addCheckmarkToHouse('turnip_house');
    }
},

addCheckmarkToHouse: function(houseId) {
    const house = document.getElementById(houseId);
    if (house) {
        const checkmark = document.createElement('div');
        checkmark.className = 'checkmark';
        checkmark.innerHTML = '✓';
        checkmark.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 2rem;
            color: #4caf50;
            text-shadow: 2px 2px 0 #2c6e2c;
            z-index: 30;
            pointer-events: none;
            font-weight: bold;
        `;
        house.style.position = 'relative';
        house.appendChild(checkmark);
    }
},
    
    addCheckmark: function(houseId) {
        const house = document.getElementById(houseId);
        if (house) {
            const checkmark = document.createElement('div');
            checkmark.className = 'checkmark';
            checkmark.innerHTML = '✓';
            checkmark.style.cssText = `
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 2rem;
                color: #4caf50;
                text-shadow: 2px 2px 0 #2c6e2c;
                z-index: 20;
                pointer-events: none;
            `;
            house.style.position = 'relative';
            house.appendChild(checkmark);
        }
    },
    
    createProgressCounter: function() {
        this.progressCounter = document.createElement('div');
        this.progressCounter.className = 'progress-counter';
        this.progressCounter.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            padding: 8px 16px;
            border-radius: 30px;
            color: #f0c674;
            font-weight: bold;
            font-size: 1rem;
            z-index: 30;
            font-family: monospace;
        `;
        this.progressCounter.innerText = `📜 Прогресс: ${this.completedCount}/3`;
        document.body.appendChild(this.progressCounter);
    },
    
    addResetButton: function() {
        this.resetProgressBtn = document.createElement('button');
        this.resetProgressBtn.innerText = '🔄 Сбросить прогресс';
        this.resetProgressBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 100;
            padding: 8px 16px;
            font-size: 0.8rem;
            background-color: #888;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-weight: bold;
            color: white;
        `;
        
        this.resetProgressBtn.onclick = () => {
            if (confirm('Сбросить прогресс всех сказок?')) {
                localStorage.removeItem('level1_cat');
                localStorage.removeItem('level1_hen');
                localStorage.removeItem('level1_turnip');
                location.reload();
            }
        };
        
        document.body.appendChild(this.resetProgressBtn);
    },
    
    setupSoundButton: function() {
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.onclick = () => {
                this.soundEnabled = !this.soundEnabled;
                soundToggleBtn.innerHTML = this.soundEnabled ? '🔊 Звук вкл' : '🔇 Звук выкл';
                soundToggleBtn.style.background = this.soundEnabled ? '#f0c674' : '#888';
                
                if (this.soundEnabled && this.soundBgMusic && this.soundBgMusic.paused) {
                    this.soundBgMusic.loop = true;
                    this.soundBgMusic.volume = 0.3;
                    this.soundBgMusic.play().catch(e => console.log('Музыка:', e));
                } else if (!this.soundEnabled && this.soundBgMusic) {
                    this.soundBgMusic.pause();
                }
            };
            
            const tryAutoPlay = () => {
                if (this.soundEnabled && this.soundBgMusic && this.soundBgMusic.paused) {
                    this.soundBgMusic.loop = true;
                    this.soundBgMusic.volume = 0.3;
                    this.soundBgMusic.play().catch(e => console.log('Нажмите кнопку звука'));
                }
                document.removeEventListener('click', tryAutoPlay);
            };
            document.addEventListener('click', tryAutoPlay);
        }
    },
    
    // ========== КАРТА ==========
    
    showMap: function() {
    console.log('showMap');
    
    // Очищаем всё (один раз)
    this.charactersLayer.innerHTML = '';
    if (this.housesLayer) {
        this.housesLayer.innerHTML = '';
    }
    this.dialogContainer.style.display = 'none';
    this.hideVideo();
    
    // Устанавливаем фон карты
    this.backgroundLayer.style.backgroundImage = "url('/levels/level1/assets/images/bg_map.png')";
    this.backgroundLayer.style.backgroundSize = 'cover';
    this.backgroundLayer.style.backgroundPosition = 'center';
    
    // Добавляем домики
    this.addHouses();
    
    // Добавляем колобка
    this.addKolobokOnMap();
    
    // Если все сказки пройдены, показываем портал
    if (this.completedCount === 3) {
        this.showPortal();
    }
},
    
    addHouses: function() {
    if (this.housesLayer) {
        this.housesLayer.innerHTML = '';
    }
    
    const houses = this.mapConfig?.houses;
    if (!houses) {
        // fallback
        houses = {
            cat: { left: '20%', bottom: '40%', id: 'cat_house' },
            hen: { left: '50%', bottom: '35%', id: 'hen_house' },
            turnip: { left: '80%', bottom: '45%', id: 'turnip_house' }
        };
    }
    
    // Кошкин дом (только если не пройден)
    if (!this.completedScenes.cat) {
        this.addHouseToLayer(houses.cat.id, { left: houses.cat.left, bottom: houses.cat.bottom }, '/levels/level1/assets/images/houses/cat_house.png', () => this.onHouseClick('cat'));
    }
    
    // Курочкин дом
    if (!this.completedScenes.hen) {
        this.addHouseToLayer(houses.hen.id, { left: houses.hen.left, bottom: houses.hen.bottom }, '/levels/level1/assets/images/houses/hen_house.png', () => this.onHouseClick('hen'));
    }
    
    // Репка
    if (!this.completedScenes.turnip) {
        this.addHouseToLayer(houses.turnip.id, { left: houses.turnip.left, bottom: houses.turnip.bottom }, '/levels/level1/assets/images/houses/turnip_house.png', () => this.onHouseClick('turnip'));
    }
},

addHouseToLayer: function(id, position, imageUrl, onClick) {
    const house = document.createElement('div');
    house.id = id;
    house.className = 'house';
    house.style.cssText = `
        position: absolute;
        left: ${position.left};
        bottom: ${position.bottom};
        width: 100px;
        height: 100px;
        background-image: url('${imageUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        cursor: pointer;
        transition: transform 0.2s;
    `;
    
    house.addEventListener('mouseenter', () => {
        house.style.transform = 'scale(1.05)';
    });
    house.addEventListener('mouseleave', () => {
        house.style.transform = 'scale(1)';
    });
    
    house.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Клик по домику:', id);
        onClick();
    });
    
    this.housesLayer.appendChild(house);
},
    
    addHouse: function(id, position, imageUrl, onClick) {
        const house = document.createElement('div');
        house.id = id;
        house.className = 'house';
        house.style.cssText = `
            position: absolute;
            left: ${position.left};
            bottom: ${position.bottom};
            width: 100px;
            height: 100px;
            background-image: url('${imageUrl}');
            background-size: contain;
            background-repeat: no-repeat;
            cursor: pointer;
            z-index: 25;  // ← важно: выше, чем у фона
            transition: transform 0.2s;
        `;
        
        house.addEventListener('mouseenter', () => {
            house.style.transform = 'scale(1.05)';
        });
        house.addEventListener('mouseleave', () => {
            house.style.transform = 'scale(1)';
        });
        
        house.addEventListener('click', onClick);
        this.charactersLayer.appendChild(house);
    },
    
    addKolobokOnMap: function() {
    const config = this.mapConfig?.kolobok;
    if (!config) {
        // fallback
        config = { left: '10%', bottom: '15%', width: '60px', height: '60px' };
    }
    
    const kolobok = document.createElement('div');
    kolobok.id = 'kolobok_map';
    kolobok.className = 'kolobok-map';
    kolobok.style.cssText = `
        position: absolute;
        left: ${config.left};
        bottom: ${config.bottom};
        width: ${config.width};
        height: ${config.height};
        background-image: url('/levels/level1/assets/images/kolobok_map.png');
        background-size: contain;
        background-repeat: no-repeat;
        z-index: 15;
        transition: left 0.5s ease, bottom 0.5s ease;
    `;
    this.charactersLayer.appendChild(kolobok);
},
    
    moveKolobokToHouse: function(houseId, callback) {
    if (this.isMoving) return;
    this.isMoving = true;
    
    const kolobok = document.getElementById('kolobok_map');
    const house = document.getElementById(houseId);
    
    if (!kolobok || !house) {
        console.log('Колобок или домик не найден');
        this.isMoving = false;
        if (callback) callback();
        return;
    }
    
    // Звук движения
    if (this.soundEnabled && this.soundMove) {
        this.soundMove.currentTime = 0;
        this.soundMove.play().catch(e => console.log('Звук движения:', e));
    }
    
    const houseRect = house.getBoundingClientRect();
    const containerRect = this.gameContainer.getBoundingClientRect();
    const targetLeft = ((houseRect.left + houseRect.width/2 - containerRect.left) / containerRect.width) * 100;
    const targetBottom = ((houseRect.bottom - containerRect.bottom) / containerRect.height) * 100;
    
    console.log('Двигаем колобка к:', targetLeft, targetBottom);
    
    kolobok.style.left = targetLeft - 5 + '%';
    kolobok.style.bottom = targetBottom + 10 + '%';
    
    setTimeout(() => {
        this.isMoving = false;
        if (callback) callback();
    }, 500);
},
    onHouseClick: function(sceneId) {
        console.log('Клик по домику:', sceneId);
        
        if (this.completedScenes[sceneId]) {
            console.log('Сказка уже пройдена');
            return;
        }
        
        if (this.isMoving) {
            console.log('Колобок двигается, игнорируем клик');
            return;
        }
        
        const houseId = this.housePositions[sceneId].id;
        console.log('Двигаем колобка к домику:', houseId);
        this.moveKolobokToHouse(houseId, () => {
            this.startScene(sceneId);
        });
    },
    
    // ========== СЦЕНА СКАЗКИ ==========
    
    startScene: function(sceneId) {
    console.log('startScene:', sceneId);
    
    if (this.housesLayer) {
        this.housesLayer.innerHTML = '';
    }
    
    const scene = this.scenesConfig.scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.error('Сцена не найдена:', sceneId);
        return;
    }
    
    // Очищаем карту (убираем домики и колобка)
    this.charactersLayer.innerHTML = '';
    
    // Устанавливаем фон для диалога
    this.backgroundLayer.style.backgroundImage = "url('/levels/level1/assets/images/bg_dialog.png')";
    this.backgroundLayer.style.backgroundSize = 'cover';
    this.backgroundLayer.style.backgroundPosition = 'center';
    
    // Добавляем персонажа (кошка, курочка или дед)
    this.addCharacter(scene.character);
    
    // Добавляем колобка
    this.addCharacter('kolobok_dialog');
    
    // Запускаем диалог
    this.currentDialog = scene.dialog.dialogues;
    this.currentScene = scene;
    this.dialogIndex = 0;           // ← сбрасываем индекс
    
    console.log('Диалог загружен, реплик:', this.currentDialog.length);
    this.showDialogStep();
},
    
    addCharacter: function(characterKey) {
        const charData = this.charactersConfig[characterKey];
        if (!charData) {
            console.error('Персонаж не найден:', characterKey);
            return;
        }
        
        const char = document.createElement('div');
        char.className = 'character';
        char.id = characterKey; //charData.id;
        char.style.position = 'absolute';
        char.style.left = charData.left;
        char.style.bottom = charData.bottom;
        char.style.width = charData.width;
        char.style.height = charData.height;
        char.style.backgroundImage = `url('${charData.image}')`;
        char.style.backgroundSize = 'contain';
        char.style.backgroundRepeat = 'no-repeat';
        char.style.backgroundPosition = 'bottom';
        char.style.zIndex = charData.zIndex || 10;
        char.style.opacity = '0';
        char.style.transition = 'opacity 0.3s ease';
        
        this.charactersLayer.appendChild(char);
        setTimeout(() => { char.style.opacity = '1'; }, 10);
    },
    
    removeAllCharacters: function() {
        this.charactersLayer.innerHTML = '';
    },
    
    showDialogStep: function() {
    console.log('showDialogStep, dialogIndex:', this.dialogIndex, 'всего:', this.currentDialog ? this.currentDialog.length : 0);
    
    if (!this.currentDialog || this.dialogIndex >= this.currentDialog.length) {
        this.dialogContainer.style.display = 'none';
        this.showQuestion();
        return;
    }
    
    const line = this.currentDialog[this.dialogIndex];
    this.dialogText.innerText = line.text;
    this.dialogContainer.style.display = 'flex';
    
    // Подсветка говорящего
    const speakerElement = document.getElementById(line.speaker);
    if (speakerElement) {
        speakerElement.style.transform = 'scale(1.02)';
        setTimeout(() => { if(speakerElement) speakerElement.style.transform = ''; }, 300);
    }
    
    // Убираем старые обработчики и добавляем новый
    this.dialogNextBtn.onclick = null;
    this.dialogNextBtn.onclick = () => {
        console.log('Нажата кнопка Далее');
        this.dialogIndex++;
        this.showDialogStep();
    };
},
    
    showQuestion: function() {
    const question = this.currentScene.question;
    
    // Полностью скрываем диалоговое окно
    this.dialogContainer.style.display = 'none';
    
    // Очищаем текст в диалоговом окне (на всякий случай)
    this.dialogText.innerText = '';
    
    // Убираем обработчик с кнопки "Далее", чтобы не мешал
    this.dialogNextBtn.onclick = null;
    
    // Создаём контейнер для вариантов ответов
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quiz-container';
    optionsContainer.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        max-width: 600px;
        background-color: rgba(0,0,0,0.85);
        border-radius: 20px;
        padding: 20px;
        z-index: 200;
    `;
    
    optionsContainer.innerHTML = `
        <div style="color: white; font-size: 1.2rem; margin-bottom: 20px;">${question.text}</div>
        ${question.options.map((opt, idx) => `
            <button class="quiz-option" data-index="${idx}" style="
                display: block;
                width: 100%;
                margin: 10px 0;
                padding: 12px;
                background: #f0c674;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                cursor: pointer;
                text-align: left;
                transition: transform 0.1s;
            ">${String.fromCharCode(65+idx)}. ${opt}</button>
        `).join('')}
    `;
    
    document.body.appendChild(optionsContainer);
    
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.02)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('click', (e) => {
            const selectedIdx = parseInt(btn.getAttribute('data-index'));
            optionsContainer.remove();
            this.checkAnswer(selectedIdx);
        });
    });
},
    
    checkAnswer: function(selectedIdx) {
    const isCorrect = (selectedIdx === this.currentScene.question.correct);
    
    // Принудительно скрываем диалоговое окно
    this.dialogContainer.style.display = 'none';
    
    // Удаляем контейнер с вариантами ответов, если он есть
    const existingContainer = document.querySelector('.quiz-container');
    if (existingContainer) existingContainer.remove();
    
    if (isCorrect) {
        if (this.soundEnabled && this.soundSuccess) {
            this.soundSuccess.play().catch(e => console.log('Звук успеха:', e));
        }
        this.playVideo(this.currentScene.question.video_success, false, () => {
            this.onSceneComplete(true);
        });
    } else {
        if (this.soundEnabled && this.soundFail) {
            this.soundFail.play().catch(e => console.log('Звук неудачи:', e));
        }
        this.playVideo(this.currentScene.question.video_fail, false, () => {
            this.onSceneComplete(false);
        });
    }
},
    
    onSceneComplete: function(success) {
    this.hideVideo();
    this.removeAllCharacters();
    
    if (success) {
        const sceneId = this.currentScene.id;
        this.completedScenes[sceneId] = true;
        this.completedCount++;
        this.saveProgress();
        
        // Удаляем домик после прохождения
        const houseId = this.housePositions[sceneId].id;
        const house = document.getElementById(houseId);
        if (house) {
            house.remove();
        }
    }
    
    this.showMap();
},
    
    // ========== ПОРТАЛ ==========
    
    showPortal: function() {
    if (document.getElementById('portal_map')) return;
    
    const config = this.mapConfig?.portal;
    if (!config) {
        // fallback
        config = { left: '45%', bottom: '20%', width: '80px', height: '80px' };
    }
    
    const portal = document.createElement('div');
    portal.id = 'portal_map';
    portal.className = 'portal';
    portal.style.cssText = `
        position: absolute;
        left: ${config.left};
        bottom: ${config.bottom};
        width: ${config.width};
        height: ${config.height};
        background-image: url('/levels/level1/assets/images/portal.png');
        background-size: contain;
        background-repeat: no-repeat;
        cursor: pointer;
        z-index: 100;
        transition: transform 0.2s;
        animation: portalPulse 1s infinite;
    `;
    
    portal.addEventListener('mouseenter', () => {
        portal.style.transform = 'scale(1.1)';
    });
    portal.addEventListener('mouseleave', () => {
        portal.style.transform = 'scale(1)';
    });
    
    portal.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Клик по порталу');
        if (this.soundEnabled && this.soundPortal) {
            this.soundPortal.play().catch(e => console.log('Звук портала:', e));
        }
        this.playVideo('/levels/level1/assets/videos/portal_open.mp4', false, () => {
            window.location.href = '/level2.html';
            //window.open('/igs.pptx', '_blank');
        });
    });
    
    if (this.housesLayer) {
        this.housesLayer.appendChild(portal);
    } else {
        this.charactersLayer.appendChild(portal);
    }
},
    
    // ========== ВИДЕО ==========
    
    playVideo: function(videoUrl, loop, onEnd) {
        this.videoLayer.style.display = 'flex';
        
        const video = document.createElement('video');
        video.src = videoUrl;
        video.autoplay = true;
        video.loop = loop;
        video.muted = false;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.style.objectFit = 'contain';
        
        video.onended = () => {
            if (!loop && onEnd) {
                onEnd();
            }
        };
        
        video.onerror = () => {
            console.warn('Видео не загрузилось:', videoUrl);
            this.videoLayer.style.display = 'none';
            if (onEnd) onEnd();
        };
        
        this.videoLayer.innerHTML = '';
        this.videoLayer.appendChild(video);
        video.play().catch(e => console.log('Видео:', e));
    },
    
    hideVideo: function() {
        this.videoLayer.style.display = 'none';
        this.videoLayer.innerHTML = '';
    }
};
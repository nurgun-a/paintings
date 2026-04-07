const Level0 = {
    // Состояние
    currentPart: 0,
    currentStep: 0,
    flourCollected: 0,
    flourTotal: 3,
    dialogues: null,
    clickZones: [],
    currentQuestionIndex: 0,
    score: 0,
    isTransitioning: false,
    activeButton: null,
    
    // DOM элементы
    backgroundLayer: null,
    charactersLayer: null,
    clickzonesLayer: null,
    videoLayer: null,
    dialogContainer: null,
    dialogText: null,
    dialogNextBtn: null,
    actionButtons: null,
    questCounter: null,
    flourCountSpan: null,
    optionsContainer: null,
    continueBtn: null,
    
    // Звуки
    soundCollect: null,
    soundBgMusic: null,
    soundOven: null,
    soundFilmReel: null,
    
    // Видео элемент
    videoElement: null,
    
    // Шаги первой части (изба)
    izbaSteps: [
        'intro_dialog',
        'show_quest',
        'collect_flour',
        'knead_video',
        'show_raw_kolobok',
        'bake_video',
        'farewell_dialog'
    ],
    
    // Шаги второй части (тропинка)
    pathSteps: [
        'move_video_1',
        'meet_zayac',
        'move_video_2',
        'meet_volk',
        'move_video_3',
        'meet_medved',
        'move_video_4',
        'meet_lisa'
    ],
    
    // Инициализация
    init: async function() {
        // Получаем DOM элементы
        this.backgroundLayer = document.getElementById('backgroundLayer');
        this.charactersLayer = document.getElementById('charactersLayer');
        this.clickzonesLayer = document.getElementById('clickzonesLayer');
        this.dialogContainer = document.getElementById('dialogContainer');
        this.dialogText = document.getElementById('dialogText');
        this.dialogNextBtn = document.getElementById('dialogNextBtn');
        this.actionButtons = document.getElementById('actionButtons');
        this.questCounter = document.getElementById('questCounter');
        this.flourCountSpan = document.getElementById('flourCount');
        
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
        document.getElementById('gameContainer').appendChild(this.videoLayer);
        
        // Получаем звуки
        this.soundCollect = document.getElementById('soundCollect');
        this.soundBgMusic = document.getElementById('soundBgMusic');
        this.soundOven = document.getElementById('soundOven');
        this.soundFilmReel = document.getElementById('soundFilmReel');
        
        // Загружаем диалоги
        try {
            const response = await fetch('/levels/level0/dialogues.json');
            this.dialogues = await response.json();
        } catch(e) {
            console.error('Ошибка загрузки диалогов:', e);
            this.dialogues = this.getDefaultDialogues();
        }
        // Загружаем конфигурацию персонажей
          try {
              const response = await fetch('/levels/level0/characters.json');
              this.charactersConfig = await response.json();
          } catch(e) {
              console.error('Ошибка загрузки персонажей:', e);
              this.charactersConfig = this.getDefaultCharactersConfig();
          }
        // Запускаем первую часть
        this.currentPart = 0;
        this.currentStep = 0;
        // Кнопка включения звука
        const soundBtn = document.getElementById('enableSoundBtn');
        if (soundBtn) {
            soundBtn.onclick = () => {
                // Включаем фоновую музыку
                if (this.soundBgMusic) {
                    this.soundBgMusic.loop = true;
                    this.soundBgMusic.volume = 0.3;
                    this.soundBgMusic.play().catch(e => console.log('Музыка не заиграла:', e));
                }
                
                // Включаем звук для звуковых эффектов (они будут работать после клика)
                // Просто разблокируем аудиоконтекст
                if (this.soundCollect) {
                    this.soundCollect.play().then(() => {
                        this.soundCollect.pause();
                        this.soundCollect.currentTime = 0;
                    }).catch(e => console.log('Ошибка разблокировки collect:', e));
                }
                
                // Убираем кнопку
                soundBtn.remove();
            };
        }
        // Постоянная кнопка вкл/выкл звука
this.soundEnabled = true;
const soundToggleBtn = document.getElementById('soundToggleBtn');

if (soundToggleBtn) {
    soundToggleBtn.onclick = () => {
        this.soundEnabled = !this.soundEnabled;
        
        if (this.soundEnabled) {
            // Включаем звук
            soundToggleBtn.innerHTML = '🔊 Звук вкл';
            soundToggleBtn.style.background = '#f0c674';
            
            if (this.soundBgMusic && this.soundBgMusic.paused) {
                this.soundBgMusic.loop = true;
                this.soundBgMusic.volume = 0.3;
                this.soundBgMusic.play().catch(e => console.log('Музыка:', e));
            }
        } else {
            // Выключаем звук
            soundToggleBtn.innerHTML = '🔇 Звук выкл';
            soundToggleBtn.style.background = '#888';
            
            if (this.soundBgMusic) {
                this.soundBgMusic.pause();
            }
            if (this.soundCollect) {
                this.soundCollect.pause();
                this.soundCollect.currentTime = 0;
            }
            if (this.soundOven) {
                this.soundOven.pause();
                this.soundOven.currentTime = 0;
            }
            if (this.soundFilmReel) {
                this.soundFilmReel.pause();
                this.soundFilmReel.currentTime = 0;
            }
        }
    };
    
    // Автоматически пробуем включить музыку при первом клике в любом месте
    const tryAutoPlay = () => {
        if (this.soundEnabled && this.soundBgMusic && this.soundBgMusic.paused) {
            this.soundBgMusic.loop = true;
            this.soundBgMusic.volume = 0.3;
            this.soundBgMusic.play().catch(e => console.log('Автовоспроизведение заблокировано, нажмите кнопку звука'));
        }
        document.removeEventListener('click', tryAutoPlay);
    };
    document.addEventListener('click', tryAutoPlay);
}
        this.executeIzbaStep();
        window.addEventListener('resize', () => {
            setTimeout(() => {
                // Перерисовываем текущий шаг при повороте
                if (this.currentPart === 0) {
                    this.executeIzbaStep();
                } else {
                    this.executePathStep();
                }
            }, 100);
        });
    },
    
    getDefaultDialogues: function() {
        return {
            part1_izba: {
                dialogues: [
                    { speaker: "ded", text: "Эх, старуха, беда у нас… Корова не даёт молоко, куры не несутся!" },
                    { speaker: "baba", text: "А ты, старый, вспомни, как в сказках: то избушка сломается, то рецепт потеряется…" },
                    { speaker: "ded", text: "Вот бы кто страховал от таких несчастных случаев!" },
                    { speaker: "baba", text: "И правда! А давай испечём Колобка? Пусть он помогает сказочным героям со страховкой!" },
                    { speaker: "baba", text: "Только муки нет. Помоги, добрый молодец! Собери муку 0/3." }
                ]
            },
            part2_kolobok_born: {
                dialogues: [
                    { speaker: "baba", text: "Вот и Колобок готов! Осталось испечь!" },
                    { speaker: "baba", text: "Испекли! Какой румяный!" },
                    { speaker: "ded", text: "Смотри, Колобок, помогай героям!" },
                    { speaker: "baba", text: "Расскажи им про страховку! А мы ждать будем." },
                    { speaker: "kolobok", text: "Я всё понял! Вперёд, к новым приключениям!" }
                ]
            },
            part3_meet_zayac: {
                speaker: "zayac",
                text: "Привет, Колобок! Я Заяц. Однажды меня Лиса из дома выгнала. Если бы у меня была страховка жилья, я бы получил компенсацию и построил новый дом! Запомни: страховка помогает, когда случается непредвиденное."
            },
            part3_meet_volk: {
                speaker: "volk",
                text: "Здорово, Колобок! Я Волк. Как-то раз я съел семь козлят, а потом меня наказали. Нужна страховка ответственности — она покрывает ущерб, который ты случайно причинил другим."
            },
            part3_meet_medved: {
                speaker: "medved",
                text: "Ух! А я Медведь. Я теремок сломал нечаянно. Хорошо бы иметь страховку от случайного ущерба имуществу. Тогда хозяева теремка получили бы выплату!"
            },
            part4_lisa_questions: {
                intro: "Здравствуй, Колобок! Я Лиса. Проверю, как ты усвоил уроки. Ответь на три вопроса. Выбирай один ответ из четырёх.",
                questions: [
                    {
                        text: "Что такое страховой случай?",
                        options: [
                            "Когда ты покупаешь страховку",
                            "Когда происходит событие, предусмотренное договором страхования",
                            "Когда страховщик платит тебе просто так",
                            "Когда ты забываешь заплатить взнос"
                        ],
                        correct: 1
                    },
                    {
                        text: "Какой пример страхового случая рассказал Заяц?",
                        options: [
                            "Сломал теремок",
                            "Съел семь козлят",
                            "Лиса выгнала из дома",
                            "Потерял рецепт колобка"
                        ],
                        correct: 2
                    },
                    {
                        text: "Какой пример страхового случая рассказал Волк?",
                        options: [
                            "Сломал теремок",
                            "Съел семь козлят",
                            "Лиса выгнала из дома",
                            "Корова не даёт молоко"
                        ],
                        correct: 1
                    }
                ],
                success_text: "Молодец, Колобок! Ты всё усвоил. Вот портал в новый уровень!",
                fail_text: "Неправильно. Попробуй ещё раз, внимательнее слушай друзей!"
            }
        };
    },
    

    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    
    removeActiveButton: function() {
        if (this.activeButton) {
            this.activeButton.remove();
            this.activeButton = null;
        }
    },
    
    setBackgroundInstant: function(imageUrl) {
        this.backgroundLayer.style.backgroundImage = `url('${imageUrl}')`;
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
    },
    
    changeBackgroundWithPageFlip: function(newImageUrl, callback) {
        this.removeActiveButton();
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        // Проигрываем звук перелистывания
        if (this.soundEnabled && this.soundFilmReel) {
            this.soundFilmReel.currentTime = 0;
            this.soundFilmReel.play().catch(e => console.log('Звук перелистывания:', e));
        }
        
        // Анимация перелистывания
        this.backgroundLayer.style.transformOrigin = 'left center';
        this.backgroundLayer.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        this.backgroundLayer.style.transform = 'perspective(800px) rotateY(-35deg)';
        this.backgroundLayer.style.opacity = '0.3';
        
        setTimeout(() => {
            this.backgroundLayer.style.backgroundImage = `url('${newImageUrl}')`;
            this.backgroundLayer.style.transform = 'perspective(800px) rotateY(0deg)';
            this.backgroundLayer.style.opacity = '1';
            
            setTimeout(() => {
                this.backgroundLayer.style.transformOrigin = '';
                this.backgroundLayer.style.transition = '';
                this.isTransitioning = false;
                if (callback) callback();
            }, 300);
        }, 280);
    },
    
    addCharacter: function(characterKey, customPosition = null) {
    const charData = this.charactersConfig[characterKey];
    if (!charData) {
        console.error('Персонаж не найден:', characterKey);
        return null;
    }
    
    const char = document.createElement('div');
    char.className = 'character';
    char.id = charData.id;
    char.style.position = 'absolute';
    char.style.left = customPosition ? customPosition.left : charData.left;
    char.style.bottom = customPosition ? customPosition.bottom : charData.bottom;
    char.style.width = customPosition ? customPosition.width : charData.width;
    char.style.height = customPosition ? customPosition.height : charData.height;
    char.style.minWidth = charData.minWidth || '50px';
    char.style.maxWidth = charData.maxWidth || '150px';
    char.style.backgroundImage = `url('${charData.image}')`;
    char.style.backgroundSize = 'contain';
    char.style.backgroundRepeat = 'no-repeat';
    char.style.backgroundPosition = 'bottom';
    char.style.zIndex = charData.zIndex || 10;
    char.style.opacity = '0';
    char.style.transition = 'opacity 0.3s ease';
    
    this.charactersLayer.appendChild(char);
    setTimeout(() => { char.style.opacity = '1'; }, 10);
    return char;
},
    
    removeCharacter: function(id, callback) {
        const char = document.getElementById(id);
        if (char) {
            char.style.opacity = '0';
            setTimeout(() => {
                if (char && char.remove) char.remove();
                if (callback) callback();
            }, 300);
        } else if (callback) {
            callback();
        }
    },
    
    hideAllCharacters: function() {
        this.charactersLayer.innerHTML = '';
    },
    
    clearAllCharacters: function() {
        this.charactersLayer.innerHTML = '';
    },
    
    showFloatingText: function(x, y, text) {
        const floatDiv = document.createElement('div');
        floatDiv.className = 'floating-text';
        floatDiv.innerText = text;
        floatDiv.style.left = x + 'px';
        floatDiv.style.top = y + 'px';
        document.getElementById('gameContainer').appendChild(floatDiv);
        setTimeout(() => floatDiv.remove(), 800);
    },
    
    playVideo: function(videoUrl, loop, onEnd) {
        this.videoLayer.style.display = 'flex';
    
        const video = document.createElement('video');
        video.src = videoUrl;
        video.autoplay = true;
        video.loop = loop;
        video.muted = false;
        
        // Растягиваем видео на весь экран
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';  // fill, contain, или cover
        video.style.zIndex = '51';
        
        video.onerror = () => {
            console.warn('Видео не загрузилось:', videoUrl);
            const fallbackImg = document.createElement('img');
            fallbackImg.src = videoUrl.replace('.mp4', '.png');
            fallbackImg.style.maxWidth = '100%';
            fallbackImg.style.maxHeight = '100%';
            this.videoLayer.innerHTML = '';
            this.videoLayer.appendChild(fallbackImg);
        };
        
        if (!loop && onEnd) {
            video.onended = onEnd;
        }
        
        this.videoLayer.innerHTML = '';
        this.videoLayer.appendChild(video);
        video.play().catch(e => console.log('Видео не воспроизвелось:', e));
        this.videoElement = video;
    },
    
    hideVideo: function() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement = null;
        }
        this.videoLayer.style.display = 'none';
        this.videoLayer.innerHTML = '';
    },
    
    // ========== ЧАСТЬ 1: ИЗБА ==========
    
    executeIzbaStep: function() {
        const stepName = this.izbaSteps[this.currentStep];
        console.log('executeIzbaStep:', this.currentStep, stepName);
        
        switch(stepName) {
            case 'intro_dialog':
                this.startIntroDialog();
                break;
            case 'show_quest':
                this.showQuest();
                break;
            case 'collect_flour':
                this.startFlourCollection();
                break;
            case 'knead_video':
                this.playKneadVideo();
                break;
            case 'show_raw_kolobok':
                this.showRawKolobok();
                break;
            case 'bake_video':
                this.playBakeVideo();
                break;
            case 'farewell_dialog':
                this.startFarewellDialog();
                break;
        }
    },
    
    startIntroDialog: function() {
        this.setBackgroundInstant('/levels/level0/assets/images/bg_izba1.png');
        
        if (!document.getElementById('ded')) {
            this.addCharacter('ded');
        }
        if (!document.getElementById('baba')) {
            this.addCharacter('baba');
        }
        
        this.introDialogs = this.dialogues.part1_izba.dialogues;
        this.dialogIndex = 0;
        this.showIntroDialog();
    },
    
    showIntroDialog: function() {
        if (this.dialogIndex >= this.introDialogs.length) {
            this.dialogContainer.style.display = 'none';
            this.currentStep++;
            this.executeIzbaStep();
            return;
        }
        
        const dialog = this.introDialogs[this.dialogIndex];
        this.dialogText.innerText = dialog.text;
        this.dialogContainer.style.display = 'flex';
        
        if (dialog.speaker === 'ded') {
            const ded = document.getElementById('ded');
            if (ded) {
                ded.style.transform = 'scale(1.02)';
                setTimeout(() => { if(ded) ded.style.transform = ''; }, 300);
            }
        } else if (dialog.speaker === 'baba') {
            const baba = document.getElementById('baba');
            if (baba) {
                baba.style.transform = 'scale(1.02)';
                setTimeout(() => { if(baba) baba.style.transform = ''; }, 300);
            }
        }
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogIndex++;
            this.showIntroDialog();
        };
    },
    
    showQuest: function() {
        this.dialogText.innerText = this.dialogues.part1_izba.dialogues[4].text;
        this.dialogContainer.style.display = 'flex';
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogContainer.style.display = 'none';
            
            this.removeCharacter('ded');
            this.removeCharacter('baba');
            
            setTimeout(() => {
                this.currentStep++;
                this.executeIzbaStep();
            }, 350);
        };
    },
    
    startFlourCollection: function() {
        console.log('startFlourCollection вызвана');
        
        this.charactersLayer.innerHTML = '';
        
        this.backgroundLayer.style.backgroundImage = "url('/levels/level0/assets/images/bg_collect.png')";
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
        
        this.questCounter.style.display = 'flex';
        this.flourCollected = 0;
        this.flourCountSpan.innerText = '0';
        document.getElementById('flourTotal').innerText = this.flourTotal;
        
        this.createClickZones();
    },
    
    createClickZones: function() {
        const isMobile = window.innerWidth <= 768;
        const zoneSize = isMobile ? '70px' : '100px';
        
        const zones = [
            { id: 'zone1', left: '15%', top: '50%', width: zoneSize, height: zoneSize, img: 'flour_1.png' },
            { id: 'zone2', left: '45%', top: '60%', width: zoneSize, height: zoneSize, img: 'flour_2.png' },
            { id: 'zone3', left: '75%', top: '45%', width: zoneSize, height: zoneSize, img: 'flour_3.png' }
        ];
        
        zones.forEach(zone => {
            const zoneDiv = document.createElement('div');
            zoneDiv.id = zone.id;
            zoneDiv.className = 'clickzone';
            zoneDiv.style.left = zone.left;
            zoneDiv.style.top = zone.top;
            zoneDiv.style.width = zone.width;
            zoneDiv.style.height = zone.height;
            zoneDiv.style.position = 'absolute';
            zoneDiv.style.backgroundImage = `url('/levels/level0/assets/images/clickzones/${zone.img}')`;
            zoneDiv.style.backgroundSize = 'contain';
            zoneDiv.style.backgroundRepeat = 'no-repeat';
            zoneDiv.style.backgroundPosition = 'center';
            zoneDiv.style.cursor = 'pointer';
            zoneDiv.style.transition = 'transform 0.2s';
            zoneDiv.setAttribute('data-collected', 'false');
            
            zoneDiv.addEventListener('mouseenter', () => {
                zoneDiv.style.transform = 'scale(1.05)';
            });
            zoneDiv.addEventListener('mouseleave', () => {
                zoneDiv.style.transform = 'scale(1)';
            });
            
            zoneDiv.addEventListener('click', (e) => this.onZoneClick(e, zoneDiv));
            this.clickzonesLayer.appendChild(zoneDiv);
            this.clickZones.push(zoneDiv);
        });
    },
    
    onZoneClick: function(event, zoneElement) {
        if (zoneElement.getAttribute('data-collected') === 'true') return;
        
        zoneElement.setAttribute('data-collected', 'true');
        zoneElement.style.display = 'none';
        
        this.flourCollected++;
        this.flourCountSpan.innerText = this.flourCollected;
        
        const rect = zoneElement.getBoundingClientRect();
        const containerRect = document.getElementById('gameContainer').getBoundingClientRect();
        const x = rect.left + rect.width/2 - containerRect.left;
        const y = rect.top + rect.height/2 - containerRect.top;
        this.showFloatingText(x, y, '+1 мука');
        
        if (this.soundEnabled && this.soundCollect) {
            this.soundCollect.currentTime = 0;
            this.soundCollect.play().catch(e => console.log('Звук не загрузился:', e));
        }
        
        if (this.flourCollected >= this.flourTotal) {
            this.onAllFlourCollected();
        }
    },
    
    onAllFlourCollected: function() {
        this.removeActiveButton();
        
        const kneadBtn = document.createElement('button');
        kneadBtn.className = 'action-btn';
        kneadBtn.innerText = '🍞 Слепить колобка';
        const isMobile = window.innerWidth <= 768;
        kneadBtn.style.cssText = `
        position: fixed;
        bottom: ${isMobile ? '20px' : '40px'};
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        padding: ${isMobile ? '8px 20px' : '14px 32px'};
        font-size: ${isMobile ? '0.9rem' : '1.2rem'};
        background-color: #f0c674;
        border: none;
        border-radius: 60px;
        cursor: pointer;
        box-shadow: 0 4px 0 #a57c3c;
        font-weight: bold;
        color: #2c2c2c;
        white-space: nowrap;
    `;
        
        kneadBtn.onclick = () => {
            kneadBtn.remove();
            this.currentStep++;
            this.executeIzbaStep();
        };
        
        document.body.appendChild(kneadBtn);
        this.activeButton = kneadBtn;
    },
    
    playKneadVideo: function() {
        this.hideAllCharacters();
        this.removeActiveButton();
        
        this.playVideo('/levels/level0/assets/videos/knead.mp4', true, null);
        
        const continueBtn = document.createElement('button');
        continueBtn.className = 'action-btn';
        continueBtn.innerText = 'Продолжить ➡';
        const isMobile = window.innerWidth <= 768;
        continueBtn.style.cssText = `
        position: fixed;
        bottom: ${isMobile ? '20px' : '40px'};
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        padding: ${isMobile ? '8px 20px' : '14px 32px'};
        font-size: ${isMobile ? '0.9rem' : '1.2rem'};
        background-color: #f0c674;
        border: none;
        border-radius: 60px;
        cursor: pointer;
        box-shadow: 0 4px 0 #a57c3c;
        font-weight: bold;
        color: #2c2c2c;
        white-space: nowrap;
    `;
        
        continueBtn.onclick = () => {
            this.hideVideo();
            continueBtn.remove();
            this.currentStep++;
            this.executeIzbaStep();
        };
        
        document.body.appendChild(continueBtn);
        this.activeButton = continueBtn;
    },
    
    showRawKolobok: function() {
        this.removeActiveButton();
        
        this.addCharacter('baba_smile');
        this.addCharacter('kolobok_raw');
        
        this.dialogText.innerText = 'Вот и Колобок готов! Осталось испечь!';
        this.dialogContainer.style.display = 'flex';
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogContainer.style.display = 'none';
            
            const bakeBtn = document.createElement('button');
            bakeBtn.className = 'action-btn';
            bakeBtn.innerText = '🔥 Испечь колобка';
            bakeBtn.style.cssText = `
                position: fixed;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                padding: 14px 32px;
                font-size: 1.2rem;
                background-color: #f0c674;
                border: none;
                border-radius: 60px;
                cursor: pointer;
                box-shadow: 0 4px 0 #a57c3c;
                font-weight: bold;
                color: #2c2c2c;
            `;
            
            bakeBtn.onclick = () => {
                bakeBtn.remove();
                this.currentStep++;
                this.executeIzbaStep();
            };
            
            document.body.appendChild(bakeBtn);
            this.activeButton = bakeBtn;
        };
    },
    
    playBakeVideo: function() {
      if (this.soundEnabled && this.soundOven) {
            this.soundOven.play().catch(e => console.log('Звук печи:', e));
        }
        if (this.soundOven) {
            this.soundOven.pause();
            this.soundOven.currentTime = 0;
        }
        this.hideAllCharacters();
        this.removeActiveButton();
        
        this.backgroundLayer.style.backgroundImage = "url('/levels/level0/assets/images/bg_oven.png')";
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
        
        this.playVideo('/levels/level0/assets/videos/bake.mp4', true, null);
        
        const continueBtn = document.createElement('button');
        continueBtn.className = 'action-btn';
        continueBtn.innerText = 'Продолжить ➡';
        const isMobile = window.innerWidth <= 768;
        continueBtn.style.cssText = `
        position: fixed;
        bottom: ${isMobile ? '20px' : '40px'};
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        padding: ${isMobile ? '8px 20px' : '14px 32px'};
        font-size: ${isMobile ? '0.9rem' : '1.2rem'};
        background-color: #f0c674;
        border: none;
        border-radius: 60px;
        cursor: pointer;
        box-shadow: 0 4px 0 #a57c3c;
        font-weight: bold;
        color: #2c2c2c;
        white-space: nowrap;
    `;
        
        continueBtn.onclick = () => {
            this.hideVideo();
            continueBtn.remove();
            this.currentStep++;
            this.executeIzbaStep();
        };
        
        document.body.appendChild(continueBtn);
        this.activeButton = continueBtn;
    },
    
    startFarewellDialog: function() {
        this.removeActiveButton();
        
        this.backgroundLayer.style.backgroundImage = "url('/levels/level0/assets/images/bg_izba1.png')";
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
        
        this.addCharacter('ded');
        this.addCharacter('baba');
        this.addCharacter('kolobok_final');
        
        this.farewellDialogs = this.dialogues.part2_kolobok_born.dialogues;
        this.dialogIndex = 0;
        this.showFarewellDialog();
    },
    
    showFarewellDialog: function() {
        if (this.dialogIndex >= this.farewellDialogs.length) {
            this.dialogContainer.style.display = 'none';
            
            const goBtn = document.createElement('button');
            goBtn.className = 'action-btn';
            goBtn.innerText = '🚀 В путь!';
            const isMobile = window.innerWidth <= 768;
        goBtn.style.cssText = `
            position: fixed;
            bottom: ${isMobile ? '20px' : '40px'};
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            padding: ${isMobile ? '8px 20px' : '14px 32px'};
            font-size: ${isMobile ? '0.9rem' : '1.2rem'};
            background-color: #f0c674;
            border: none;
            border-radius: 60px;
            cursor: pointer;
            box-shadow: 0 4px 0 #a57c3c;
            font-weight: bold;
            color: #2c2c2c;
            white-space: nowrap;
        `;
            
            goBtn.onclick = () => {
                goBtn.remove();
                this.startSecondPart();
            };
            
            document.body.appendChild(goBtn);
            this.activeButton = goBtn;
            return;
        }
        
        const dialog = this.farewellDialogs[this.dialogIndex];
        this.dialogText.innerText = dialog.text;
        this.dialogContainer.style.display = 'flex';
        
        const speaker = dialog.speaker;
        if (speaker === 'ded') {
            const ded = document.getElementById('ded');
            if (ded) {
                ded.style.transform = 'scale(1.02)';
                setTimeout(() => { if(ded) ded.style.transform = ''; }, 300);
            }
        } else if (speaker === 'baba') {
            const baba = document.getElementById('baba');
            if (baba) {
                baba.style.transform = 'scale(1.02)';
                setTimeout(() => { if(baba) baba.style.transform = ''; }, 300);
            }
        } else if (speaker === 'kolobok') {
            const kolobok = document.getElementById('kolobok_final');
            if (kolobok) {
                kolobok.style.transform = 'scale(1.05)';
                setTimeout(() => { if(kolobok) kolobok.style.transform = ''; }, 300);
            }
        }
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogIndex++;
            this.showFarewellDialog();
        };
    },
    
    // ========== ЧАСТЬ 2: ТРОПИНКА ==========
    
    startSecondPart: function() {
        this.clearAllCharacters();
        this.removeActiveButton();
        this.questCounter.style.display = 'none';
        
        this.currentPart = 1;
        this.currentStep = 0;
        this.executePathStep();
    },
    
    executePathStep: function() {
        const stepName = this.pathSteps[this.currentStep];
        console.log('executePathStep:', this.currentStep, stepName);
        
        switch(stepName) {
            case 'move_video_1':
            case 'move_video_2':
            case 'move_video_3':
            case 'move_video_4':
                this.playMoveVideoAndNext();
                break;
            case 'meet_zayac':
                this.meetCharacter('zayac', this.dialogues.part3_meet_zayac);
                break;
            case 'meet_volk':
                this.meetCharacter('volk', this.dialogues.part3_meet_volk);
                break;
            case 'meet_medved':
                this.meetCharacter('medved', this.dialogues.part3_meet_medved);
                break;
            case 'meet_lisa':
                this.startLisaQuiz();
                break;
        }
    },
    
    playMoveVideoAndNext: function() {
        this.removeActiveButton();
        
        this.backgroundLayer.style.backgroundImage = "url('/levels/level0/assets/images/bg_path.png')";
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
        
        //this.addCharacter('kolobok_move');
        
        this.playVideo('/levels/level0/assets/videos/move.mp4', false, () => {
            this.hideVideo();
            //this.removeCharacter('kolobok_move');
            this.currentStep++;
            this.executePathStep();
        });
    },
    
    meetCharacter: function(characterId, dialogData) {
        this.removeActiveButton();
        
        this.backgroundLayer.style.backgroundImage = "url('/levels/level0/assets/images/bg_meeting.png')";
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
        
        // Добавляем персонажа из конфига
        this.addCharacter(characterId);  // characterId = 'zayac', 'volk', 'medved'
        this.addCharacter('kolobok_meet');
        
        this.dialogText.innerText = dialogData.text;
        this.dialogContainer.style.display = 'flex';
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogContainer.style.display = 'none';
            
            this.removeCharacter(characterId, () => {
                this.currentStep++;
                this.executePathStep();
            });
        };
    },
    
    startLisaQuiz: function() {
        this.removeActiveButton();
        
        // Очищаем всех персонажей перед сценой с лисой
        this.clearAllCharacters();
        
        this.backgroundLayer.style.backgroundImage = "url('/levels/level0/assets/images/bg_portal.png')";
        this.backgroundLayer.style.backgroundSize = 'cover';
        this.backgroundLayer.style.backgroundPosition = 'center';
        
        // Добавляем только лису и одного колобка
        this.addCharacter('lisa');
        this.addCharacter('kolobok_quiz');
        
        this.dialogText.innerText = this.dialogues.part4_lisa_questions.intro;
        this.dialogContainer.style.display = 'flex';
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogContainer.style.display = 'none';
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.showQuestion();
        };
    },
    
    showQuestion: function() {
        const questions = this.dialogues.part4_lisa_questions.questions;
        if (this.currentQuestionIndex >= questions.length) {
            this.onQuizComplete();
            return;
        }
        
        const q = questions[this.currentQuestionIndex];
        this.dialogContainer.style.display = 'none';
        
        if (!this.optionsContainer) {
            this.optionsContainer = document.createElement('div');
            this.optionsContainer.className = 'quiz-container';
            this.optionsContainer.style.cssText = `
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
            document.body.appendChild(this.optionsContainer);
        }
        
        this.optionsContainer.innerHTML = `
            <div style="color: white; font-size: 1.2rem; margin-bottom: 20px;">${q.text}</div>
            ${q.options.map((opt, idx) => `
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
        
        this.optionsContainer.style.display = 'block';
        
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.02)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
            btn.addEventListener('click', (e) => {
                const selectedIdx = parseInt(btn.getAttribute('data-index'));
                if (selectedIdx === q.correct) {
                    this.score++;
                    this.showQuizFeedback('✅ Правильно!', true);
                } else {
                    this.showQuizFeedback('❌ Неправильно!', false);
                }
            });
        });
    },
    
    showQuizFeedback: function(message, isCorrect) {
        if (this.optionsContainer) {
            this.optionsContainer.style.display = 'none';
        }
        
        this.dialogText.innerText = message;
        this.dialogContainer.style.display = 'flex';
        
        this.dialogNextBtn.onclick = null;
        this.dialogNextBtn.onclick = () => {
            this.dialogContainer.style.display = 'none';
            
            if (isCorrect) {
                this.currentQuestionIndex++;
                this.showQuestion();
            } else {
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.showQuestion();
            }
        };
    },
    
    onQuizComplete: function() {
        if (this.optionsContainer) {
            this.optionsContainer.remove();
            this.optionsContainer = null;
        }
        
        if (this.score === 3) {
            // Убираем лису и колобка
            this.removeCharacter('lisa');
            this.removeCharacter('kolobok_quiz');
            
            // Показываем кнопку "В путь" (без портала)
            const nextLevelBtn = document.createElement('button');
            nextLevelBtn.className = 'action-btn';
            nextLevelBtn.innerText = '🚀 В путь!';
            nextLevelBtn.style.cssText = `
                position: fixed;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                padding: 14px 32px;
                font-size: 1.2rem;
                background-color: #f0c674;
                border: none;
                border-radius: 60px;
                cursor: pointer;
                box-shadow: 0 4px 0 #a57c3c;
                font-weight: bold;
                color: #2c2c2c;
            `;
            
            nextLevelBtn.onclick = () => {
                nextLevelBtn.remove();
                localStorage.setItem('level0_completed', 'true');
                window.location.href = '/level1.html';
            };
            
            document.body.appendChild(nextLevelBtn);
            this.activeButton = nextLevelBtn;
            
        } else {
            this.dialogText.innerText = this.dialogues.part4_lisa_questions.fail_text;
            this.dialogContainer.style.display = 'flex';
            
            this.dialogNextBtn.onclick = null;
            this.dialogNextBtn.onclick = () => {
                this.dialogContainer.style.display = 'none';
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.showQuestion();
            };
        }
    },
};
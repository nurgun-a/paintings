// Общие утилиты
const Common = {
    // Плавная смена фона
    setBackground: (element, imageUrl) => {
        if (!element) return;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.backgroundImage = `url('${imageUrl}')`;
            element.style.opacity = '1';
        }, 200);
    },
    
    // Воспроизведение звука
    playSound: (audioElement) => {
        if (audioElement && audioElement.currentTime !== undefined) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.log('Audio play failed:', e));
        }
    },
    
    // Показать всплывающий текст в координатах
    showFloatingText: (x, y, text, parentElement) => {
        const floatDiv = document.createElement('div');
        floatDiv.className = 'floating-text';
        floatDiv.innerText = text;
        floatDiv.style.left = x + 'px';
        floatDiv.style.top = y + 'px';
        parentElement.appendChild(floatDiv);
        setTimeout(() => floatDiv.remove(), 800);
    },
    
    // Очистить слой
    clearLayer: (layerElement) => {
        if (layerElement) layerElement.innerHTML = '';
    },
    
    // Добавить персонажа
    addCharacter: (layer, id, imageUrl, left, bottom, width = 'auto', height = 'auto') => {
        const char = document.createElement('div');
        char.className = 'character';
        char.id = id;
        char.style.position = 'absolute';
        char.style.left = left;
        char.style.bottom = bottom;
        char.style.width = width;
        char.style.height = height;
        char.style.backgroundImage = `url('${imageUrl}')`;
        char.style.backgroundSize = 'contain';
        char.style.backgroundRepeat = 'no-repeat';
        char.style.backgroundPosition = 'bottom';
        layer.appendChild(char);
        return char;
    },
    
    // Удалить персонажа с анимацией
    removeCharacter: (id, callback) => {
        const char = document.getElementById(id);
        if (char) {
            char.classList.add('fade-out-down');
            setTimeout(() => {
                if (char && char.remove) char.remove();
                if (callback) callback();
            }, 300);
        }
    }
};
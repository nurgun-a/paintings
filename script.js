const gallery = document.getElementById("gallery");

let scenes = [];
let currentIndex = 0;

let currentX = 0;
let targetX = 0;

let isLocked = false;

let mouseX = 0;
let mouseY = 0;

let smoothMouseX = 0;
let smoothMouseY = 0;

const ease = 0.04;          // медленнее и плавнее
const scrollThreshold = 150; // увеличенный порог
const animationDuration = 1100; // блокировка на время анимации

/* ===============================
   ЗАГРУЗКА ДАННЫХ
================================ */

fetch("data.json")
  .then(res => res.json())
  .then(data => {

    data.forEach(item => {

      const scene = document.createElement("section");
      scene.classList.add("scene");

      item.layers.forEach((layerData, i) => {

        const layer = document.createElement("div");
        layer.classList.add("layer");
        layer.dataset.speed = layerData.speed;
        layer.dataset.depth = i;

        if (layerData.type === "painting") {
          layer.classList.add("painting");
          layer.innerHTML = `<img src="${layerData.image}" />`;
        } else {
          layer.style.backgroundImage =
            `url(${layerData.image})`;
        }

        scene.appendChild(layer);
      });

      const content = document.createElement("div");
      content.classList.add("content");
      content.innerHTML = `
        <h1>${item.title}</h1>
        <p>${item.description}</p>
      `;

      scene.appendChild(content);
      gallery.appendChild(scene);
    });

    scenes = document.querySelectorAll(".scene");

    document.body.style.height =
      `${window.innerWidth * scenes.length}px`;

    initControls();
    animate();
  });

/* ===============================
   УПРАВЛЕНИЕ
================================ */

let scrollAccumulator = 0;

function initControls() {
    window.addEventListener("mousemove", (e) => {

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    mouseX = (e.clientX - centerX) / centerX;
    mouseY = (e.clientY - centerY) / centerY;
    });

  window.addEventListener("wheel", (e) => {

    if (isLocked) return;

    scrollAccumulator += e.deltaY;

    if (Math.abs(scrollAccumulator) < scrollThreshold)
      return;

    if (scrollAccumulator > 0) {
      goToScene(currentIndex + 1);
    } else {
      goToScene(currentIndex - 1);
    }

    scrollAccumulator = 0;
  });
}

/* ===============================
   ПЕРЕХОД К СЦЕНЕ
================================ */

function goToScene(index) {

  if (index < 0 || index >= scenes.length)
    return;

  if (index === currentIndex)
    return;

  isLocked = true;

  currentIndex = index;
  targetX = index * window.innerWidth;

  setTimeout(() => {
    isLocked = false;
  }, animationDuration);
}

/* ===============================
   АНИМАЦИЯ
================================ */

function animate() {

  currentX += (targetX - currentX) * ease;

  gallery.style.transform =
    `translateX(${-currentX}px)`;

  updateParallax();
  updateActive();

  requestAnimationFrame(animate);
}

/* ===============================
   3D ПАРАЛЛАКС (без накопления!)
================================ */

function updateParallax() {

  // плавность движения мыши
  smoothMouseX += (mouseX - smoothMouseX) * 0.08;
  smoothMouseY += (mouseY - smoothMouseY) * 0.08;

  scenes.forEach((scene, i) => {

    const offset = i * window.innerWidth;
    const distance = currentX - offset;

    const rotate = distance * 0.0005;

    scene.style.transform =
      `rotateY(${rotate}deg)`;

    scene.querySelectorAll(".layer")
      .forEach(layer => {

        const speed = parseFloat(layer.dataset.speed);
        const depth = parseFloat(layer.dataset.depth);

        const moveX = distance * speed * -0.35;

        // мышиный параллакс
        const mouseMoveX = smoothMouseX * 40 * speed;
        const mouseMoveY = smoothMouseY * 30 * speed;

        const z = (depth - 3) * 150;

        layer.style.transform =
          `
          translateX(${moveX + mouseMoveX}px)
          translateY(${mouseMoveY}px)
          translateZ(${z}px)
          `;
      });
  });
}

/* ===============================
   АКТИВНАЯ СЦЕНА
================================ */

function updateActive() {

  scenes.forEach((scene, i) => {

    if (i === currentIndex) {
      scene.style.opacity = 1;
      scene.style.transform += " scale(1)";
    } else {
      scene.style.opacity = 0.6;
      scene.style.transform += " scale(0.94)";
    }
  });
}
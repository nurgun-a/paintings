let scenes = [];
let currentIndex = 0;
let isScrolling = false;
let idleOffset = 0;

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    createScenes(data);
    initNavigation();
    updateNavButtons();
    initParallax();
    initModal();
  });

function createScenes(data) {
  const gallery = document.getElementById("gallery");

  data.forEach((item, index) => {

    const scene = document.createElement("div");
    scene.className = "scene";
    scene.style.transform = `translateX(${index * 100}%)`;

    // слои
    item.layers.forEach((layerData, i) => {

    const img = document.createElement("img");
    img.src = layerData.images;
    img.className = "layer";
    img.style.zIndex = i;

    // сохраняем скорость прямо в dataset
    img.dataset.speed = layerData.speed;

    scene.appendChild(img);
    });

    // контент
    const content = document.createElement("div");
    content.className = "content";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.title;

    const short = document.createElement("div");
    short.className = "short";
    short.textContent = item.short;

    content.appendChild(title);
    content.appendChild(short);
    scene.appendChild(content);

    // клик
    title.addEventListener("click", () => openModal(item));

    gallery.appendChild(scene);
    scenes.push(scene);
  });
}

function initNavigation() {

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  prevBtn.addEventListener("click", () => {
    if (isScrolling) return;
    if (currentIndex === 0) return;

    currentIndex--;
    changeScene();
  });

  nextBtn.addEventListener("click", () => {
    if (isScrolling) return;
    if (currentIndex === scenes.length - 1) return;

    currentIndex++;
    changeScene();
  });
}

function changeScene() {

  isScrolling = true;

  scenes.forEach((scene, i) => {
    scene.style.transform = `translateX(${(i - currentIndex) * 100}%)`;
  });

  updateNavButtons(); // ← ВАЖНО

  setTimeout(() => {
    isScrolling = false;
  }, 800);
}

function updateScenes() {
  scenes.forEach((scene, i) => {
    scene.style.transform = `translateX(${(i - currentIndex) * 100}%)`;
  });
}

function initParallax() {

  let time = 0;
  let mouseX = 0;
  let mouseY = 0;

  // 🔹 Параллакс от мыши (очень мягкий)
  window.addEventListener("mousemove", (e) => {

    mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;

  });

  function animate() {

    time += 0.015; // скорость дыхания

    const activeScene = scenes[currentIndex];
    if (!activeScene) {
      requestAnimationFrame(animate);
      return;
    }

    const layers = activeScene.querySelectorAll(".layer");

    layers.forEach((layer) => {

      const speed = parseFloat(layer.dataset.speed) || 0;

      // 🔹 Мышь (макс ~5px при speed=1)
      const parallaxX = mouseX * speed * 15;
      const parallaxY = mouseY * speed * 15;

      // 🔹 Дыхание (макс ~1.5px)
      const driftX = Math.sin(time) * speed * 1.5;
      const driftY = Math.cos(time * 0.8) * speed * 1.5;

      // 🔥 Собираем transform заново
      layer.style.transform = `
        translate(${parallaxX + driftX}px, 
                  ${parallaxY + driftY}px)
      `;
    });

    requestAnimationFrame(animate);
  }

  animate();
}
/* модальное окно */

function initModal() {
  document.getElementById("closeBtn").onclick = closeModal;
  document.querySelector(".modal-overlay").onclick = closeModal;
}

function openModal(item) {
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalShort").textContent = item.short;
  document.getElementById("modalFull").textContent = item.full;


  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function updateNavButtons() {

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Левая кнопка
  if (currentIndex === 0) {
    prevBtn.classList.add("hidden");
  } else {
    prevBtn.classList.remove("hidden");
  }

  // Правая кнопка
  if (currentIndex === scenes.length - 1) {
    nextBtn.classList.add("hidden");
  } else {
    nextBtn.classList.remove("hidden");
  }
}
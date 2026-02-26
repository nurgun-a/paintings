const gallery = document.getElementById("gallery");
let scenes = [];
let current = 0;
let scrollTarget = 0;
let currentX = 0;
let ease = 0.08;

// Загрузка JSON
fetch("data.json")
  .then(res => res.json())
  .then(data => {

    data.forEach(item => {

      const scene = document.createElement("section");
      scene.classList.add("scene");

      item.layers.forEach(layerData => {
        const layer = document.createElement("div");
        layer.classList.add("layer");
        layer.dataset.speed = layerData.speed;

        if (layerData.type === "painting") {
          layer.classList.add("painting");
          layer.innerHTML = `<img src="${layerData.image}">`;
        } else {
          layer.style.backgroundImage = `url(${layerData.image})`;
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

    // Устанавливаем высоту body
    document.body.style.height =
      `${gallery.scrollWidth}px`;

    initScroll();
    animate();
  });


// Вертикальный скролл -> движение вправо
function initScroll() {
  window.addEventListener("scroll", () => {
    scrollTarget = window.scrollY;
  });
}


// Плавная анимация (Apple-like)
function animate() {
  currentX += (scrollTarget - currentX) * ease;
  gallery.style.transform =
    `translateX(-${currentX}px)`;

  updateActiveScene();
  updateParallax();

  requestAnimationFrame(animate);
}


// Активная сцена (snap + анимация)
function updateActiveScene() {
  const index = Math.round(currentX / window.innerWidth);

  if (index !== current) {
    scenes[current]?.classList.remove("active");
    scenes[index]?.classList.add("active");
    current = index;
  }
}


// Параллакс
function updateParallax() {
  scenes.forEach((scene, i) => {
    const offset = i * window.innerWidth;
    const distance = currentX - offset;

    scene.querySelectorAll(".layer").forEach(layer => {
      const speed = layer.dataset.speed;
      layer.style.transform =
        `translateX(${distance * speed * -0.3}px)`;
    });
  });
}
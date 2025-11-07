const pixelGrid = document.getElementById("pixelGrid");
const upload = document.getElementById("upload");
const resetBtn = document.getElementById("reset");
const brushBtn = document.getElementById("brush");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const invertBtn = document.getElementById("invert");
const colorPicker = document.getElementById("colorPicker");
const pickColorBtn = document.getElementById("pickColorFromImage");
const colorPreview = document.getElementById("colorPreview");
const selectColorBtn = document.getElementById("selectColor");
const confirmModal = document.getElementById("confirmModal");
const saveAndLoadBtn = document.getElementById("saveAndLoad");
const replaceWithoutSaveBtn = document.getElementById("replaceWithoutSave");
const cancelLoadBtn = document.getElementById("cancelLoad");
const saveBtn = document.getElementById("saveBtn"); // botão de salvar direto (fora do modal)

let gridSize = 4;
let brushMode = false;
let pickColorMode = false;
let scale = 1;
let originalData = null;
let hasImageLoaded = false;
let pendingFile = null;
let brushColor = "#00bfff";
let tempColor = null;

/* === COR DO PINCEL === */
colorPicker.addEventListener("input", e => brushColor = e.target.value);

/* === BOTÃO PEGAR COR DA IMAGEM === */
pickColorBtn.addEventListener("click", () => {
  pickColorMode = !pickColorMode;
  pickColorBtn.style.background = pickColorMode ? "#4CAF50" : "#333";
  brushMode = false;
});

/* === BOTÃO SELECIONAR COR DO PREVIEW === */
selectColorBtn.addEventListener("click", () => {
  if (tempColor) {
    brushColor = tempColor;
    alert(`Cor ${brushColor} selecionada para pintar!`);
  }
});

/* === CARREGAR IMAGEM === */
upload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  if (hasImageLoaded) {
    pendingFile = file;
    showSaveModal();
  } else {
    loadNewImage(file);
  }
});

/* === FUNÇÃO PARA CARREGAR NOVA IMAGEM === */
function loadNewImage(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    originalData = { width: img.width, height: img.height, data: null };
    drawImageToGrid(img);
    hasImageLoaded = true;
  };
  upload.value = "";
  pendingFile = null;
  closeSaveModal();
}

/* === DESENHAR GRID DE PIXELS === */
function drawImageToGrid(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  originalData.data = new Uint8ClampedArray(imageData.data);

  pixelGrid.innerHTML = "";
  pixelGrid.style.gridTemplateColumns = `repeat(${image.width}, ${gridSize}px)`;
  pixelGrid.style.gridAutoRows = `${gridSize}px`;

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      const [r, g, b] = imageData.data.slice(i, i + 3);
      const pixel = document.createElement("div");
      pixel.classList.add("pixel");
      pixel.style.backgroundColor = `rgb(${r},${g},${b})`;

      pixel.addEventListener("click", () => {
        if (pickColorMode) {
          tempColor = pixel.style.backgroundColor;
          colorPreview.style.backgroundColor = tempColor;
          pickColorMode = false;
          pickColorBtn.style.background = "#333";
          brushColor = tempColor;
          alert(`Cor ${tempColor} selecionada!`);
        } else if (brushMode) {
          pixel.style.backgroundColor = brushColor;
        }
      });

      pixelGrid.appendChild(pixel);
    }
  }
}

/* === BOTÕES DO MODAL === */
saveAndLoadBtn.addEventListener("click", async () => {
  await saveCurrentImageToServer(); // salva antes de carregar nova imagem
  if (pendingFile) loadNewImage(pendingFile);
  closeSaveModal();
});

replaceWithoutSaveBtn.addEventListener("click", () => {
  if (pendingFile) loadNewImage(pendingFile);
  closeSaveModal();
});

cancelLoadBtn.addEventListener("click", () => {
  pendingFile = null;
  closeSaveModal();
});

/* === PINCEL === */
brushBtn.addEventListener("click", () => {
  brushMode = !brushMode;
  brushBtn.style.background = brushMode ? brushColor : "#333";
});

/* === ZOOM === */  
// 🔹 Esse bloco controla o zoom do editor de pixels, permitindo aumentar ou diminuir o tamanho da grade (pixelGrid).

zoomInBtn.addEventListener("click", () => {
  // 🟢 Adiciona um ouvinte de evento para o botão "Zoom +".
  // Quando o botão é clicado, o código dentro dessa função é executado.

  scale = Math.min(scale + 0.1, 4);
  // 📏 Aumenta a variável 'scale' em 0.1, mas nunca ultrapassa o valor máximo de 4.
  // Math.min() garante que, mesmo se o usuário clicar várias vezes, o zoom máximo seja 4x.

  pixelGrid.style.transform = `scale(${scale}) translate(0, 0)`;
  // 🔍 Aplica a transformação CSS de escala na grade de pixels.
  // A função `scale()` aumenta ou diminui visualmente o tamanho da grade.
  // O `translate(0, 0)` mantém a posição original, evitando que o zoom desloque o conteúdo.
});

zoomOutBtn.addEventListener("click", () => {
  // 🔵 Adiciona um ouvinte de evento para o botão "Zoom -".
  // Quando clicado, a função abaixo é executada.

  scale = Math.max(scale - 0.1, 0.4);
  // 📏 Diminui a variável 'scale' em 0.1, mas nunca deixa o valor abaixo de 0.4.
  // Math.max() garante um limite mínimo — evita que a grade desapareça por ficar muito pequena.

  pixelGrid.style.transform = `scale(${scale}) translate(0, 0)`;
  // 🔍 Atualiza novamente o estilo da grade aplicando a nova escala reduzida.
  // O translate(0,0) continua centralizando o zoom sem deslocar a imagem.
});


/* === INVERTER CORES === */
invertBtn.addEventListener("click", () => {
  pixelGrid.querySelectorAll(".pixel").forEach(p => {
    const [r, g, b] = getComputedStyle(p).backgroundColor.match(/\d+/g).map(Number);
    p.style.backgroundColor = `rgb(${255 - r},${255 - g},${255 - b})`;
  });
});

/* === SALVAR SOMENTE NA PASTA DO PROJETO === */
async function saveCurrentImageToServer() {
  if (!originalData) return;

  const { width, height } = originalData;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const pixels = pixelGrid.querySelectorAll(".pixel");
  let index = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!pixels[index]) continue;
      const color = getComputedStyle(pixels[index]).backgroundColor;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
      index++;
    }
  }

  const dataURL = canvas.toDataURL("image/png");
  const fileName = `imagem_${Date.now()}.png`;

 try {
    // 1️⃣ Salva na pasta do projeto (via servidor Node)
    await fetch("/save-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData: dataURL, fileName }),
    });

    console.log(`✅ Imagem salva na pasta do projeto: ${fileName}`);

    // 2️⃣ Faz download local automaticamente
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("💾 Imagem salva e baixada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao salvar imagem:", error);
    alert("❌ Erro ao salvar ou baixar a imagem!");
  }
}

/* === FUNÇÕES MODAL === */
function showSaveModal() {
  confirmModal.classList.add("show");
}

function closeSaveModal() {
  confirmModal.classList.remove("show");
}

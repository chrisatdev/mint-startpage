import { loadData, saveData } from "./utils/storage.js";

const solidInput = document.getElementById("solidColor");
const gradientColor1 = document.getElementById("gradientColor1");
const gradientColor2 = document.getElementById("gradientColor2");
const gradientAngle = document.getElementById("gradientAngle");
const angleValue = document.getElementById("angleValue");
const gradientPreview = document.getElementById("gradientPreview");
const applyGradientBtn = document.getElementById("applyGradient");
const customGradient = document.getElementById("customGradient");
const imageInput = document.getElementById("image");
const backBtn = document.getElementById("back");
const exportBtn = document.getElementById("exportData");
const importInput = document.getElementById("importData");
const resetBtn = document.getElementById("resetData");

let state;

init();

async function init() {
  state = await loadData();

  if (state.settings.theme.type === "solid") {
    solidInput.value = state.settings.theme.value;
  }

  if (state.settings.theme.type === "gradient") {
    customGradient.value = state.settings.theme.value;
    parseGradientIfPossible(state.settings.theme.value);
  }

  updateGradientPreview();
}

// ==================== COLOR SÓLIDO ====================

solidInput.addEventListener("input", async () => {
  await updateTheme("solid", solidInput.value);
});

// ==================== GRADIENTE ====================

function updateGradientPreview() {
  const color1 = gradientColor1.value;
  const color2 = gradientColor2.value;
  const angle = gradientAngle.value;
  
  const gradientCSS = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
  gradientPreview.style.background = gradientCSS;
  angleValue.textContent = `${angle}°`;
}

gradientColor1.addEventListener("input", updateGradientPreview);
gradientColor2.addEventListener("input", updateGradientPreview);

gradientAngle.addEventListener("input", updateGradientPreview);

applyGradientBtn.addEventListener("click", async () => {
  const color1 = gradientColor1.value;
  const color2 = gradientColor2.value;
  const angle = gradientAngle.value;
  
  const gradientCSS = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
  customGradient.value = gradientCSS;
  await updateTheme("gradient", gradientCSS);
});

customGradient.addEventListener("change", async () => {
  if (customGradient.value.trim()) {
    await updateTheme("gradient", customGradient.value);
    parseGradientIfPossible(customGradient.value);
    updateGradientPreview();
  }
});

function parseGradientIfPossible(gradientString) {
  // Intentar parsear el gradiente para pre-llenar los controles
  const linearMatch = gradientString.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^)]+)\)/);
  
  if (linearMatch) {
    const [, angle, color1, color2] = linearMatch;
    
    gradientAngle.value = angle;
    angleValue.textContent = `${angle}°`;
    
    // Intentar convertir los colores a hex si es posible
    try {
      gradientColor1.value = convertToHex(color1.trim());
      gradientColor2.value = convertToHex(color2.trim());
    } catch {
      // Si no se puede convertir, mantener los valores actuales
    }
  }
}

function convertToHex(color) {
  // Crear un elemento temporal para convertir el color
  const div = document.createElement('div');
  div.style.color = color;
  document.body.appendChild(div);
  
  const computed = window.getComputedStyle(div).color;
  document.body.removeChild(div);
  
  // Extraer RGB
  const rgb = computed.match(/\d+/g);
  if (rgb) {
    const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  
  return color;
}

// ==================== IMAGEN ====================

imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    await updateTheme("image", reader.result);
  };
  reader.readAsDataURL(file);
});

// ==================== ACTUALIZAR TEMA ====================

async function updateTheme(type, value) {
  state.settings.theme = { type, value };
  await saveData(state);
}

// ==================== NAVEGACIÓN ====================

backBtn.addEventListener("click", () => {
  window.open("newtab.html", "_self");
});

// ==================== EXPORTAR ====================

exportBtn.addEventListener("click", async () => {
  const payload = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: state
  };

  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `mint-startpage-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

// ==================== IMPORTAR ====================

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);

      if (!isValidImport(parsed)) {
        alert("Invalid configuration file");
        return;
      }

      state = parsed.data;
      await saveData(state);

      alert("Configuration imported successfully");
      
      // Actualizar la UI
      if (state.settings.theme.type === "solid") {
        solidInput.value = state.settings.theme.value;
      } else if (state.settings.theme.type === "gradient") {
        customGradient.value = state.settings.theme.value;
        parseGradientIfPossible(state.settings.theme.value);
        updateGradientPreview();
      }
    } catch {
      alert("Error reading file");
    }
  };

  reader.readAsText(file);
});

function isValidImport(payload) {
  if (!payload || payload.version !== "1.0") return false;
  if (!payload.data) return false;
  if (!Array.isArray(payload.data.groups)) return false;
  if (!payload.data.settings?.theme) return false;

  return true;
}

// ==================== RESET ====================

resetBtn.addEventListener("click", async () => {
  const confirmation = confirm(
    "Are you sure you want to reset all settings?\n\n" +
    "This will delete:\n" +
    "- All groups and links\n" +
    "- Custom theme configuration\n\n" +
    "This action cannot be undone."
  );

  if (!confirmation) return;

  // Second confirmation
  const finalConfirmation = confirm(
    "This is your last chance.\n\n" +
    "Do you really want to continue?"
  );

  if (!finalConfirmation) return;

  // Reset to default values
  const DEFAULT_DATA = {
    settings: {
      theme: {
        type: "gradient",
        value: "linear-gradient(135deg, #9bfab0, #2dd4bf)"
      }
    },
    groups: []
  };

  state = DEFAULT_DATA;
  await saveData(state);

  alert("Settings reset successfully");

  // Update UI
  solidInput.value = "#ecfeff";
  customGradient.value = DEFAULT_DATA.settings.theme.value;
  gradientColor1.value = "#9bfab0";
  gradientColor2.value = "#2dd4bf";
  gradientAngle.value = "135";
  updateGradientPreview();
  
  // Return to main page
  setTimeout(() => {
    window.open("newtab.html", "_self");
  }, 1000);
});

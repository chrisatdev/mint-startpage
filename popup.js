import { loadData, saveData } from "./utils/storage.js";

const titleInput = document.getElementById("linkTitle");
const urlInput = document.getElementById("linkUrl");
const groupSelect = document.getElementById("groupSelect");
const saveBtn = document.getElementById("saveBtn");
const feedback = document.getElementById("feedback");
const popupBody = document.getElementById("popupBody");
const popupEmpty = document.getElementById("popupEmpty");

let state;

init();

async function init() {
  state = await loadData();

  if (state.settings.darkMode) {
    document.body.setAttribute("data-theme", "dark");
  }

  const groups = state.groups.slice().sort((a, b) => a.order - b.order);

  if (groups.length === 0) {
    popupBody.classList.add("hidden");
    popupEmpty.classList.remove("hidden");
    return;
  }

  groups.forEach(group => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.title;
    groupSelect.appendChild(option);
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      titleInput.value = tab.title || "";
      urlInput.value = tab.url || "";
    }
    titleInput.focus();
    titleInput.select();
  });
}

saveBtn.addEventListener("click", save);

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") save();
});

async function save() {
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const groupId = groupSelect.value;

  if (!title || !url) {
    showFeedback("Fill in title and URL", "error");
    return;
  }

  if (!groupId) {
    showFeedback("Select a group", "error");
    return;
  }

  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;

  group.links.push({
    id: crypto.randomUUID(),
    title,
    url,
    order: group.links.length
  });

  await saveData(state);
  showFeedback("Saved!", "success");
  setTimeout(() => window.close(), 700);
}

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

import { loadData, saveData } from "./utils/storage.js";

const sidebar = document.getElementById("sidebar");
const sidebarTabs = document.getElementById("sidebarTabs");
const sidebarToggle = document.getElementById("sidebarToggle");
const mainContent = document.getElementById("mainContent");
const addGroupBtn = document.getElementById("addGroupBtn");
const searchInput = document.getElementById("searchInput");

const groupModal = document.getElementById("groupModal");
const groupModalTitle = document.getElementById("groupModalTitle");
const groupTitleInput = document.getElementById("groupTitleInput");
const saveGroupModal = document.getElementById("saveGroupModal");
const cancelGroupModal = document.getElementById("cancelGroupModal");

const linkModal = document.getElementById("linkModal");
const linkModalTitle = document.getElementById("linkModalTitle");
const linkTitleInput = document.getElementById("linkTitleInput");
const linkUrlInput = document.getElementById("linkUrlInput");
const saveLinkModal = document.getElementById("saveLinkModal");
const cancelLinkModal = document.getElementById("cancelLinkModal");
const shortcutsOverlay = document.getElementById("shortcutsOverlay");
const shortcutsClose = document.getElementById("shortcutsClose");

let state;
let activeGroupId = null;
let draggedGroupId = null;
let draggedLinkData = null;
let currentGroupIdForModal = null;
let currentLinkIdForModal = null;
let openMenuLinkId = null;

const GROUP_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#06b6d4"
];

init();

async function init() {
  state = await loadData();

  const sidebarExpanded = localStorage.getItem("sidebarExpanded") !== "false";
  if (!sidebarExpanded) sidebar.classList.add("collapsed");

  const groups = state.groups.slice().sort((a, b) => a.order - b.order);
  const savedActiveGroup = localStorage.getItem("activeGroupId");

  if (savedActiveGroup && groups.find(g => g.id === savedActiveGroup)) {
    activeGroupId = savedActiveGroup;
  } else if (groups.length > 0) {
    activeGroupId = groups[0].id;
  }

  applyTheme();
  renderSidebar();
  renderMainContent();
  setupSearchFilter();
}

// ==================== COLOR ====================

function getGroupColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

// ==================== SIDEBAR ====================

function renderSidebar() {
  sidebarTabs.innerHTML = "";

  state.groups
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach(group => {
      const tab = document.createElement("button");
      tab.className = "sidebar-tab" + (group.id === activeGroupId ? " active" : "");
      tab.dataset.group = group.id;
      tab.draggable = true;
      tab.title = group.title;

      const initial = (group.title[0] || "?").toUpperCase();
      const color = getGroupColor(group.id);

      tab.innerHTML = `
        <span class="sidebar-tab-icon" style="background:${color}">${initial}</span>
        <span class="sidebar-tab-name">${escapeHtml(group.title)}</span>
      `;

      tab.addEventListener("click", () => {
        activeGroupId = group.id;
        localStorage.setItem("activeGroupId", group.id);
        searchInput.value = "";
        renderSidebar();
        renderMainContent();
      });

      sidebarTabs.appendChild(tab);
    });

  bindSidebarDragEvents();
}

sidebarToggle.addEventListener("click", () => {
  const isCollapsed = sidebar.classList.toggle("collapsed");
  localStorage.setItem("sidebarExpanded", String(!isCollapsed));
});

function getOrderedGroups() {
  return state.groups.slice().sort((a, b) => a.order - b.order);
}

function navigateGroup(direction) {
  const groups = getOrderedGroups();
  const currentIndex = groups.findIndex(g => g.id === activeGroupId);
  if (currentIndex === -1) return false;

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= groups.length) return false;

  activeGroupId = groups[nextIndex].id;
  localStorage.setItem("activeGroupId", activeGroupId);
  searchInput.value = "";
  renderSidebar();
  renderMainContent();
  return true;
}

function openShortcutsOverlay() {
  shortcutsOverlay.classList.remove("hidden");
}

function closeShortcutsOverlay() {
  shortcutsOverlay.classList.add("hidden");
}

function toggleShortcutsOverlay() {
  shortcutsOverlay.classList.toggle("hidden");
}

// ==================== MAIN CONTENT ====================

function renderMainContent(searchTerm = "") {
  mainContent.innerHTML = "";

  if (searchTerm) {
    renderSearchResults(searchTerm);
    return;
  }

  if (!activeGroupId || state.groups.length === 0) {
    mainContent.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
        <p>Create a group to get started</p>
      </div>
    `;
    return;
  }

  const group = state.groups.find(g => g.id === activeGroupId);
  if (!group) return;

  const panelHeader = document.createElement("div");
  panelHeader.className = "panel-header";
  panelHeader.innerHTML = `
    <span class="panel-title">${escapeHtml(group.title)}</span>
    <div class="panel-actions">
      <button class="panel-btn" id="editGroupBtn" title="Rename group">Rename</button>
      <button class="panel-btn panel-btn-danger" id="deleteGroupBtn" title="Delete group">Delete</button>
    </div>
  `;
  mainContent.appendChild(panelHeader);

  panelHeader.querySelector("#editGroupBtn").addEventListener("click", () => openGroupModalForEdit(group.id));
  panelHeader.querySelector("#deleteGroupBtn").addEventListener("click", () => removeGroup(group.id));

  const list = document.createElement("div");
  list.className = "links-list";
  list.dataset.group = group.id;

  group.links.forEach((link, index) => {
    list.appendChild(createLinkElement(link, group.id, index));
  });

  mainContent.appendChild(list);

  const addBtn = document.createElement("button");
  addBtn.className = "add-link";
  addBtn.dataset.group = group.id;
  addBtn.textContent = "+ Add link";
  addBtn.addEventListener("click", () => openLinkModalForNew(group.id));
  mainContent.appendChild(addBtn);

  bindLinkDragEvents();
  bindLinkMenuEvents();
}

function renderSearchResults(searchTerm) {
  const term = searchTerm.toLowerCase();

  const header = document.createElement("div");
  header.className = "panel-header";
  header.innerHTML = `<span class="panel-search-label">Results for "${escapeHtml(searchTerm)}" — press Enter to search Google</span>`;
  mainContent.appendChild(header);

  const list = document.createElement("div");
  list.className = "links-list";

  let count = 0;

  state.groups
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach(group => {
      group.links
        .filter(link =>
          link.title.toLowerCase().includes(term) ||
          link.url.toLowerCase().includes(term)
        )
        .forEach((link, index) => {
          list.appendChild(createLinkElement(link, group.id, index, group.title));
          count++;
        });
    });

  if (count === 0) {
    list.innerHTML = `<div style="padding:12px 0; color:var(--link-url); font-size:13px;">No links found — press Enter to search Google</div>`;
  }

  mainContent.appendChild(list);
  bindLinkMenuEvents();
}

function createLinkElement(link, groupId, index, groupTag = null) {
  const el = document.createElement("div");
  el.className = "link-item";
  el.dataset.group = groupId;
  el.dataset.link = link.id;
  el.dataset.linkIndex = index;
  el.draggable = groupTag === null;

  const faviconHtml = buildFaviconHtml(link);
  const groupTagHtml = groupTag
    ? `<span class="link-group-tag">${escapeHtml(groupTag)}</span>`
    : "";

  el.innerHTML = `
    ${faviconHtml}
    <div class="link-content">
      <div class="link-title">${escapeHtml(link.title)}</div>
      <a href="${link.url}" class="link-url" onclick="event.preventDefault(); event.stopPropagation();">${link.url}</a>
    </div>
    ${groupTagHtml}
    <div class="link-actions">
      <button class="link-menu-btn" data-link-menu="${link.id}">⋮</button>
    </div>
  `;

  el.addEventListener("click", (e) => {
    if (e.target.closest(".link-menu-btn") || e.target.closest(".link-menu")) return;
    window.open(link.url, "_self");
  });

  return el;
}

function buildFaviconHtml(link) {
  const mode = state.settings.faviconMode || "favicon";

  if (mode === "none") return "";

  if (mode === "initial") {
    const initial = (link.title[0] || "?").toUpperCase();
    const color = getGroupColor(link.id);
    return `<div class="link-favicon-initial" style="background:${color}">${initial}</div>`;
  }

  const safeUrl = link.url.replace(/'/g, "\\'");
  return `<img class="link-favicon" src="${getFavicon(link.url)}" onerror="handleFaviconError(this, '${safeUrl}')" />`;
}

// ==================== SEARCH ====================

function setupSearchFilter() {
  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderMainContent(e.target.value.trim());
    }, 300);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_self");
      }
    }
    if (e.key === "Escape") {
      searchInput.value = "";
      renderMainContent();
    }
  });
}

// ==================== MODALS ====================

function openGroupModalForNew() {
  groupModalTitle.textContent = "New Group";
  groupTitleInput.value = "";
  currentGroupIdForModal = null;
  showModal(groupModal);
  groupTitleInput.focus();
}

function openGroupModalForEdit(groupId) {
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;
  groupModalTitle.textContent = "Edit Group";
  groupTitleInput.value = group.title;
  currentGroupIdForModal = groupId;
  showModal(groupModal);
  groupTitleInput.focus();
}

function openLinkModalForNew(groupId) {
  linkModalTitle.textContent = "New Link";
  linkTitleInput.value = "";
  linkUrlInput.value = "";
  currentGroupIdForModal = groupId;
  currentLinkIdForModal = null;
  showModal(linkModal);
  linkTitleInput.focus();
}

function openLinkModalForEdit(groupId, linkId) {
  const group = state.groups.find(g => g.id === groupId);
  const link = group?.links.find(l => l.id === linkId);
  if (!link) return;
  linkModalTitle.textContent = "Edit Link";
  linkTitleInput.value = link.title;
  linkUrlInput.value = link.url;
  currentGroupIdForModal = groupId;
  currentLinkIdForModal = linkId;
  showModal(linkModal);
  linkTitleInput.focus();
}

function showModal(modal) { modal.classList.add("active"); }
function hideModal(modal) { modal.classList.remove("active"); }

addGroupBtn.addEventListener("click", openGroupModalForNew);
cancelGroupModal.addEventListener("click", () => hideModal(groupModal));
cancelLinkModal.addEventListener("click", () => hideModal(linkModal));

saveGroupModal.addEventListener("click", async () => {
  const title = groupTitleInput.value.trim();
  if (!title) return;

  if (currentGroupIdForModal) {
    const group = state.groups.find(g => g.id === currentGroupIdForModal);
    if (group) group.title = title;
  } else {
    const newId = crypto.randomUUID();
    state.groups.push({ id: newId, title, order: state.groups.length, links: [] });
    activeGroupId = newId;
    localStorage.setItem("activeGroupId", newId);
  }

  await saveData(state);
  hideModal(groupModal);
  renderSidebar();
  renderMainContent(searchInput.value.trim());
});

saveLinkModal.addEventListener("click", async () => {
  const title = linkTitleInput.value.trim();
  const url = linkUrlInput.value.trim();
  if (!title || !url) return;

  const group = state.groups.find(g => g.id === currentGroupIdForModal);
  if (!group) return;

  if (currentLinkIdForModal) {
    const link = group.links.find(l => l.id === currentLinkIdForModal);
    if (link) { link.title = title; link.url = url; }
  } else {
    group.links.push({ id: crypto.randomUUID(), title, url, order: group.links.length });
  }

  await saveData(state);
  hideModal(linkModal);
  renderMainContent(searchInput.value.trim());
});

groupTitleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveGroupModal.click();
  else if (e.key === "Escape") hideModal(groupModal);
});

linkTitleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") linkUrlInput.focus();
  else if (e.key === "Escape") hideModal(linkModal);
});

linkUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveLinkModal.click();
  else if (e.key === "Escape") hideModal(linkModal);
});

groupModal.addEventListener("click", (e) => { if (e.target === groupModal) hideModal(groupModal); });
linkModal.addEventListener("click", (e) => { if (e.target === linkModal) hideModal(linkModal); });

// ==================== LINK MENU ====================

function bindLinkMenuEvents() {
  document.querySelectorAll(".link-menu-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLinkMenu(btn.dataset.linkMenu, btn);
    });
  });
}

function toggleLinkMenu(linkId, buttonElement) {
  const existingMenu = document.querySelector(".link-menu");
  if (existingMenu) existingMenu.remove();

  if (openMenuLinkId === linkId) {
    openMenuLinkId = null;
    return;
  }

  openMenuLinkId = linkId;
  const linkItem = buttonElement.closest(".link-item");
  const groupId = linkItem.dataset.group;
  const rect = buttonElement.getBoundingClientRect();

  const menu = document.createElement("div");
  menu.className = "link-menu";
  menu.style.left = `${rect.left - 100}px`;
  menu.style.top = `${rect.bottom + 4}px`;
  menu.innerHTML = `
    <button data-action="edit">Edit</button>
    <button data-action="delete">Delete</button>
  `;
  document.body.appendChild(menu);

  menu.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.dataset.action === "edit") openLinkModalForEdit(groupId, linkId);
    else if (e.target.dataset.action === "delete") removeLink(groupId, linkId);
    menu.remove();
    openMenuLinkId = null;
  });

  setTimeout(() => {
    function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        openMenuLinkId = null;
        document.removeEventListener("click", closeMenu);
        document.removeEventListener("scroll", closeOnScroll, true);
      }
    }
    function closeOnScroll() {
      menu.remove();
      openMenuLinkId = null;
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("scroll", closeOnScroll, true);
    }
    document.addEventListener("click", closeMenu);
    document.addEventListener("scroll", closeOnScroll, true);
  }, 0);
}

async function removeLink(groupId, linkId) {
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;
  group.links = group.links.filter(l => l.id !== linkId);
  await saveData(state);
  renderMainContent(searchInput.value.trim());
}

// ==================== GROUP MANAGEMENT ====================

async function removeGroup(groupId) {
  if (!confirm("Delete this group and all its links?")) return;

  state.groups = state.groups.filter(g => g.id !== groupId);
  state.groups.forEach((g, i) => { g.order = i; });

  if (activeGroupId === groupId) {
    activeGroupId = state.groups.length > 0
      ? state.groups.sort((a, b) => a.order - b.order)[0].id
      : null;
    if (activeGroupId) localStorage.setItem("activeGroupId", activeGroupId);
    else localStorage.removeItem("activeGroupId");
  }

  await saveData(state);
  renderSidebar();
  renderMainContent(searchInput.value.trim());
}

// ==================== SIDEBAR DRAG & DROP ====================

function bindSidebarDragEvents() {
  document.querySelectorAll(".sidebar-tab").forEach(tab => {
    tab.addEventListener("dragstart", (e) => {
      draggedGroupId = tab.dataset.group;
      tab.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    tab.addEventListener("dragend", () => {
      draggedGroupId = null;
      document.querySelectorAll(".sidebar-tab").forEach(t => t.classList.remove("dragging", "drag-over"));
    });

    tab.addEventListener("dragover", (e) => {
      if (!draggedGroupId) return;
      e.preventDefault();
      tab.classList.add("drag-over");
    });

    tab.addEventListener("dragleave", () => tab.classList.remove("drag-over"));

    tab.addEventListener("drop", async (e) => {
      e.preventDefault();
      tab.classList.remove("drag-over");
      if (draggedGroupId) await reorderGroups(draggedGroupId, tab.dataset.group);
    });
  });
}

async function reorderGroups(fromId, toId) {
  if (!fromId || fromId === toId) return;

  const groups = state.groups.slice().sort((a, b) => a.order - b.order);
  const fromIndex = groups.findIndex(g => g.id === fromId);
  const toIndex = groups.findIndex(g => g.id === toId);

  const [moved] = groups.splice(fromIndex, 1);
  groups.splice(toIndex, 0, moved);
  groups.forEach((g, i) => { g.order = i; });

  state.groups = groups;
  await saveData(state);
  renderSidebar();
}

// ==================== LINK DRAG & DROP ====================

function bindLinkDragEvents() {
  document.querySelectorAll(".link-item[draggable='true']").forEach(linkEl => {
    linkEl.addEventListener("dragstart", (e) => {
      draggedLinkData = { groupId: linkEl.dataset.group, linkId: linkEl.dataset.link };
      linkEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
    });

    linkEl.addEventListener("dragend", () => {
      draggedLinkData = null;
      document.querySelectorAll(".link-item").forEach(el => el.classList.remove("dragging", "drag-over"));
    });

    linkEl.addEventListener("dragover", (e) => {
      if (!draggedLinkData) return;
      e.preventDefault();
      e.stopPropagation();
      linkEl.classList.add("drag-over");
    });

    linkEl.addEventListener("dragleave", () => linkEl.classList.remove("drag-over"));

    linkEl.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      linkEl.classList.remove("drag-over");
      if (draggedLinkData) {
        await reorderLinks(
          draggedLinkData.groupId, draggedLinkData.linkId,
          linkEl.dataset.group, linkEl.dataset.link
        );
      }
    });
  });

  document.querySelectorAll(".links-list").forEach(listEl => {
    listEl.addEventListener("dragover", (e) => {
      if (!draggedLinkData) return;
      e.preventDefault();
    });

    listEl.addEventListener("drop", async (e) => {
      e.preventDefault();
      if (draggedLinkData) {
        await moveLink(draggedLinkData.groupId, draggedLinkData.linkId, listEl.dataset.group);
      }
    });
  });
}

async function reorderLinks(fromGroupId, fromLinkId, toGroupId, toLinkId) {
  if (fromGroupId === toGroupId && fromLinkId === toLinkId) return;

  const fromGroup = state.groups.find(g => g.id === fromGroupId);
  const toGroup = state.groups.find(g => g.id === toGroupId);
  if (!fromGroup || !toGroup) return;

  const linkIndex = fromGroup.links.findIndex(l => l.id === fromLinkId);
  const [movedLink] = fromGroup.links.splice(linkIndex, 1);

  if (fromGroupId === toGroupId) {
    const targetIndex = fromGroup.links.findIndex(l => l.id === toLinkId);
    fromGroup.links.splice(targetIndex, 0, movedLink);
  } else {
    const targetIndex = toGroup.links.findIndex(l => l.id === toLinkId);
    toGroup.links.splice(targetIndex, 0, movedLink);
  }

  await saveData(state);
  renderMainContent(searchInput.value.trim());
}

async function moveLink(fromGroupId, linkId, toGroupId) {
  if (fromGroupId === toGroupId) return;
  const fromGroup = state.groups.find(g => g.id === fromGroupId);
  const toGroup = state.groups.find(g => g.id === toGroupId);
  if (!fromGroup || !toGroup) return;
  const linkIndex = fromGroup.links.findIndex(l => l.id === linkId);
  const [movedLink] = fromGroup.links.splice(linkIndex, 1);
  toGroup.links.push(movedLink);
  await saveData(state);
  renderMainContent(searchInput.value.trim());
}

// ==================== FAVICON ====================

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return getDefaultFaviconSVG();
  }
}

function getDuckDuckGoFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return getDefaultFaviconSVG();
  }
}

function getDirectFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://${domain}/favicon.ico`;
  } catch {
    return getDefaultFaviconSVG();
  }
}

function getDefaultFaviconSVG() {
  return "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22%3E%3Cpath d=%22M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71%22/%3E%3Cpath d=%22M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71%22/%3E%3C/svg%3E";
}

function handleFaviconError(img, url) {
  if (img.src.includes("google.com/s2/favicons")) {
    img.src = getDuckDuckGoFavicon(url);
  } else if (img.src.includes("duckduckgo.com")) {
    img.src = getDirectFavicon(url);
  } else {
    img.src = getDefaultFaviconSVG();
  }
}

window.handleFaviconError = handleFaviconError;

// ==================== UTILS ====================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function applyTheme() {
  const { theme, darkMode } = state.settings;
  const isDefaultGradient = theme.type === "gradient" &&
    theme.value === "linear-gradient(135deg, #9bfab0, #2dd4bf)";

  if (darkMode && isDefaultGradient) {
    document.body.style.background = "#091922";
  } else if (theme.type === "image") {
    document.body.style.background = `url(${theme.value}) center / cover no-repeat`;
  } else {
    document.body.style.background = theme.value;
  }

  if (darkMode) {
    document.body.setAttribute("data-theme", "dark");
  } else {
    document.body.removeAttribute("data-theme");
  }
}

document.getElementById("openSettings").addEventListener("click", () => {
  window.open("settings.html", "_self");
});

shortcutsClose.addEventListener("click", closeShortcutsOverlay);
shortcutsOverlay.addEventListener("click", (e) => {
  if (e.target === shortcutsOverlay) closeShortcutsOverlay();
});

document.addEventListener("keydown", (e) => {
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);

  if (e.key === "?") {
    e.preventDefault();
    toggleShortcutsOverlay();
    return;
  }

  if (shortcutsOverlay && !shortcutsOverlay.classList.contains("hidden") && e.key === "Escape") {
    e.preventDefault();
    closeShortcutsOverlay();
    return;
  }

  if (isTyping) return;

  if (e.key === "/") {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  if (e.key === "ArrowRight") {
    e.preventDefault();
    navigateGroup(1);
    return;
  }

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    navigateGroup(-1);
  }
});

// ==================== GROUP SCROLL NAVIGATION ====================

let scrollNavCooldown = false;

mainContent.addEventListener("wheel", (e) => {
  if (scrollNavCooldown) return;

  const atBottom = mainContent.scrollHeight - mainContent.scrollTop <= mainContent.clientHeight + 4;
  const atTop = mainContent.scrollTop <= 4;
  const contentFits = mainContent.scrollHeight <= mainContent.clientHeight;

  const goNext = e.deltaY > 0 && (atBottom || contentFits);
  const goPrev = e.deltaY < 0 && (atTop || contentFits);

  if (!goNext && !goPrev) return;

  e.preventDefault();

  scrollNavCooldown = true;
  setTimeout(() => { scrollNavCooldown = false; }, 600);

  navigateGroup(goNext ? 1 : -1);
}, { passive: false });

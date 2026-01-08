import { loadData, saveData } from "./utils/storage.js";

const container = document.getElementById("groupsContainer");
const addGroupBtn = document.getElementById("addGroupBtn");
const searchInput = document.getElementById("searchInput");

// Modales
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

let state;
let draggedGroupId = null;
let draggedLinkData = null;
let currentGroupIdForModal = null;
let currentLinkIdForModal = null;
let openMenuLinkId = null;

init();

async function init() {
  state = await loadData();
  renderGroups();
  applyTheme();
  setupSearchFilter();
}

function renderGroups(searchTerm = "") {
  container.innerHTML = "";

  const filteredGroups = state.groups.map(group => {
    if (!searchTerm) return group;
    
    const filteredLinks = group.links.filter(link => {
      const titleMatch = link.title.toLowerCase().includes(searchTerm.toLowerCase());
      const urlMatch = link.url.toLowerCase().includes(searchTerm.toLowerCase());
      return titleMatch || urlMatch;
    });

    return { ...group, links: filteredLinks };
  }).filter(group => group.links.length > 0 || !searchTerm);

  filteredGroups
    .sort((a, b) => a.order - b.order)
    .forEach(group => {
      const el = document.createElement("div");
      el.className = "group";
      el.dataset.group = group.id;

      el.innerHTML = `
        <div class="group-header" draggable="true" data-group="${group.id}">
          <div class="group-title" data-group="${group.id}">
            ${group.title}
          </div>
          <button data-remove-group="${group.id}" title="Delete group">✕</button>
        </div>

        <div class="links" data-group="${group.id}">
          ${group.links.map((link, index) => `
            <div class="link-item" 
                 data-group="${group.id}" 
                 data-link="${link.id}"
                 data-link-index="${index}"
                 draggable="true">
              <img class="link-favicon" 
                   src="${getFavicon(link.url)}" 
                   onerror="handleFaviconError(this, '${link.url.replace(/'/g, "\\'")}')" />
              <div class="link-content">
                <div class="link-title">${escapeHtml(link.title)}</div>
                <a href="${link.url}" class="link-url" onclick="event.preventDefault(); event.stopPropagation();">${link.url}</a>
              </div>
              <div class="link-actions">
                <button class="link-menu-btn" data-link-menu="${link.id}">⋮</button>
              </div>
            </div>
          `).join("")}
        </div>

        <button class="add-link" data-group="${group.id}">+ Link</button>
      `;

      container.appendChild(el);
    });

  bindLinkEvents();
  bindGroupDragEvents();
  bindLinkDragEvents();
}

function setupSearchFilter() {
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderGroups(e.target.value);
    }, 300);
  });
}

// ==================== MODALES ====================

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

function showModal(modal) {
  modal.classList.add("active");
}

function hideModal(modal) {
  modal.classList.remove("active");
}

// Event listeners para modales
addGroupBtn.addEventListener("click", () => {
  openGroupModalForNew();
});

cancelGroupModal.addEventListener("click", () => {
  hideModal(groupModal);
});

saveGroupModal.addEventListener("click", async () => {
  const title = groupTitleInput.value.trim();
  if (!title) return;

  if (currentGroupIdForModal) {
    // Editar grupo existente
    const group = state.groups.find(g => g.id === currentGroupIdForModal);
    if (group) {
      group.title = title;
    }
  } else {
    // Crear nuevo grupo
    state.groups.push({
      id: crypto.randomUUID(),
      title,
      order: state.groups.length,
      links: []
    });
  }

  await saveData(state);
  hideModal(groupModal);
  renderGroups(searchInput.value);
});

groupTitleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    saveGroupModal.click();
  } else if (e.key === "Escape") {
    hideModal(groupModal);
  }
});

cancelLinkModal.addEventListener("click", () => {
  hideModal(linkModal);
});

saveLinkModal.addEventListener("click", async () => {
  const title = linkTitleInput.value.trim();
  const url = linkUrlInput.value.trim();
  
  if (!title || !url) return;

  const group = state.groups.find(g => g.id === currentGroupIdForModal);
  if (!group) return;

  if (currentLinkIdForModal) {
    // Editar link existente
    const link = group.links.find(l => l.id === currentLinkIdForModal);
    if (link) {
      link.title = title;
      link.url = url;
    }
  } else {
    // Crear nuevo link
    group.links.push({
      id: crypto.randomUUID(),
      title,
      url,
      order: group.links.length
    });
  }

  await saveData(state);
  hideModal(linkModal);
  renderGroups(searchInput.value);
});

linkUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    saveLinkModal.click();
  } else if (e.key === "Escape") {
    hideModal(linkModal);
  }
});

linkTitleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    linkUrlInput.focus();
  } else if (e.key === "Escape") {
    hideModal(linkModal);
  }
});

// Cerrar modal al hacer clic en el overlay
groupModal.addEventListener("click", (e) => {
  if (e.target === groupModal) {
    hideModal(groupModal);
  }
});

linkModal.addEventListener("click", (e) => {
  if (e.target === linkModal) {
    hideModal(linkModal);
  }
});

// ==================== LINKS ====================

function bindLinkEvents() {
  // Botón agregar link
  document.querySelectorAll(".add-link").forEach(btn => {
    btn.addEventListener("click", () => {
      openLinkModalForNew(btn.dataset.group);
    });
  });

  // Click en link para abrir
  document.querySelectorAll(".link-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".link-menu-btn") || e.target.closest(".link-menu")) {
        return;
      }
      const url = item.querySelector(".link-url").href;
      window.open(url, "_self");
    });
  });

  // Menú hamburguesa
  document.querySelectorAll(".link-menu-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const linkId = btn.dataset.linkMenu;
      toggleLinkMenu(linkId, btn);
    });
  });

  bindGroupEvents();
}

function toggleLinkMenu(linkId, buttonElement) {
  // Cerrar menú abierto si existe
  const existingMenu = document.querySelector(".link-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  // Si es el mismo link, solo cerrar
  if (openMenuLinkId === linkId) {
    openMenuLinkId = null;
    return;
  }

  openMenuLinkId = linkId;

  const linkItem = buttonElement.closest(".link-item");
  const groupId = linkItem.dataset.group;

  // Obtener posición del botón
  const buttonRect = buttonElement.getBoundingClientRect();

  const menu = document.createElement("div");
  menu.className = "link-menu";
  menu.style.left = `${buttonRect.left - 100}px`; // Ajustar para que aparezca a la izquierda del botón
  menu.style.top = `${buttonRect.bottom + 4}px`;
  menu.innerHTML = `
    <button data-action="edit">Edit</button>
    <button data-action="delete">Delete</button>
  `;

  document.body.appendChild(menu);

  menu.addEventListener("click", (e) => {
    e.stopPropagation();
    const action = e.target.dataset.action;
    
    if (action === "edit") {
      openLinkModalForEdit(groupId, linkId);
    } else if (action === "delete") {
      removeLink(groupId, linkId);
    }
    
    menu.remove();
    openMenuLinkId = null;
  });

  // Cerrar menú al hacer clic fuera
  setTimeout(() => {
    document.addEventListener("click", function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        openMenuLinkId = null;
        document.removeEventListener("click", closeMenu);
        document.removeEventListener("scroll", closeOnScroll, true);
      }
    });
    
    // Cerrar menú al hacer scroll
    function closeOnScroll() {
      menu.remove();
      openMenuLinkId = null;
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("scroll", closeOnScroll, true);
    }
    
    document.addEventListener("scroll", closeOnScroll, true);
  }, 0);
}

async function removeLink(groupId, linkId) {
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return;

  group.links = group.links.filter(l => l.id !== linkId);

  await saveData(state);
  renderGroups(searchInput.value);
}

// ==================== GRUPOS ====================

function bindGroupEvents() {
  document.querySelectorAll(".group-title").forEach(title => {
    title.addEventListener("click", (e) => {
      e.stopPropagation();
      openGroupModalForEdit(title.dataset.group);
    });
  });

  document.querySelectorAll("[data-remove-group]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await removeGroup(btn.dataset.removeGroup);
    });
  });
}

async function removeGroup(groupId) {
  if (!confirm("Delete this group and all its links?")) return;

  state.groups = state.groups.filter(g => g.id !== groupId);

  state.groups.forEach((g, index) => {
    g.order = index;
  });

  await saveData(state);
  renderGroups(searchInput.value);
}

// ==================== DRAG & DROP GRUPOS ====================

function bindGroupDragEvents() {
  document.querySelectorAll(".group-header").forEach(headerEl => {
    headerEl.addEventListener("dragstart", (e) => {
      draggedGroupId = headerEl.dataset.group;
      const groupEl = headerEl.closest(".group");
      groupEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    headerEl.addEventListener("dragend", () => {
      draggedGroupId = null;
      document.querySelectorAll(".group").forEach(el => {
        el.classList.remove("dragging");
        el.classList.remove("drag-over");
      });
    });
  });

  document.querySelectorAll(".group").forEach(groupEl => {
    groupEl.addEventListener("dragover", (e) => {
      if (!draggedGroupId) return;
      e.preventDefault();
      groupEl.classList.add("drag-over");
    });

    groupEl.addEventListener("dragleave", () => {
      groupEl.classList.remove("drag-over");
    });

    groupEl.addEventListener("drop", async (e) => {
      e.preventDefault();
      groupEl.classList.remove("drag-over");
      
      if (draggedGroupId) {
        await reorderGroups(draggedGroupId, groupEl.dataset.group);
      }
    });
  });
}

async function reorderGroups(fromId, toId) {
  if (!fromId || fromId === toId) return;

  const groups = state.groups.sort((a, b) => a.order - b.order);

  const fromIndex = groups.findIndex(g => g.id === fromId);
  const toIndex = groups.findIndex(g => g.id === toId);

  const [moved] = groups.splice(fromIndex, 1);
  groups.splice(toIndex, 0, moved);

  groups.forEach((group, index) => {
    group.order = index;
  });

  await saveData(state);
  renderGroups(searchInput.value);
}

// ==================== DRAG & DROP LINKS ====================

function bindLinkDragEvents() {
  document.querySelectorAll(".link-item").forEach(linkEl => {
    linkEl.addEventListener("dragstart", (e) => {
      const groupId = linkEl.dataset.group;
      const linkId = linkEl.dataset.link;
      
      draggedLinkData = { groupId, linkId };
      linkEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
    });

    linkEl.addEventListener("dragend", () => {
      draggedLinkData = null;
      document.querySelectorAll(".link-item").forEach(el => {
        el.classList.remove("dragging");
        el.classList.remove("drag-over");
      });
    });

    linkEl.addEventListener("dragover", (e) => {
      if (!draggedLinkData) return;
      e.preventDefault();
      e.stopPropagation();
      linkEl.classList.add("drag-over");
    });

    linkEl.addEventListener("dragleave", () => {
      linkEl.classList.remove("drag-over");
    });

    linkEl.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      linkEl.classList.remove("drag-over");
      
      if (draggedLinkData) {
        const targetGroupId = linkEl.dataset.group;
        const targetLinkId = linkEl.dataset.link;
        await reorderLinks(draggedLinkData.groupId, draggedLinkData.linkId, targetGroupId, targetLinkId);
      }
    });
  });

  // También permitir drop en el área de links vacía
  document.querySelectorAll(".links").forEach(linksContainer => {
    linksContainer.addEventListener("dragover", (e) => {
      if (!draggedLinkData) return;
      e.preventDefault();
    });

    linksContainer.addEventListener("drop", async (e) => {
      e.preventDefault();
      
      if (draggedLinkData) {
        const targetGroupId = linksContainer.dataset.group;
        await moveLink(draggedLinkData.groupId, draggedLinkData.linkId, targetGroupId);
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
    // Reordenar dentro del mismo grupo
    const targetIndex = fromGroup.links.findIndex(l => l.id === toLinkId);
    fromGroup.links.splice(targetIndex, 0, movedLink);
  } else {
    // Mover a otro grupo
    const targetIndex = toGroup.links.findIndex(l => l.id === toLinkId);
    toGroup.links.splice(targetIndex, 0, movedLink);
  }

  await saveData(state);
  renderGroups(searchInput.value);
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
  renderGroups(searchInput.value);
}

// ==================== UTILIDADES ====================

function getFavicon(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Usar primero Google (más confiable y tiene mejor caché)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return getDefaultFaviconSVG();
  }
}

function getDirectFavicon(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    // Intentar el favicon.ico directo del dominio como fallback
    return `https://${domain}/favicon.ico`;
  } catch {
    return getDefaultFaviconSVG();
  }
}

function getDefaultFaviconSVG() {
  return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22%3E%3Cpath d=%22M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71%22/%3E%3Cpath d=%22M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71%22/%3E%3C/svg%3E';
}

function handleFaviconError(img, url) {
  // Si el src actual es de Google, intentar con favicon.ico directo
  if (img.src.includes('google.com/s2/favicons')) {
    img.src = getDirectFavicon(url);
  } 
  // Si ya intentó con favicon.ico directo, usar el SVG por defecto
  else if (img.src.includes('/favicon.ico')) {
    img.src = getDefaultFaviconSVG();
  }
  // Último recurso: SVG por defecto
  else {
    img.src = getDefaultFaviconSVG();
  }
}

// Exponer la función al scope global para que funcione el onerror inline
window.handleFaviconError = handleFaviconError;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function applyTheme() {
  const theme = state.settings.theme;

  if (theme.type === "solid") {
    document.body.style.background = theme.value;
  }

  if (theme.type === "gradient") {
    document.body.style.background = theme.value;
  }

  if (theme.type === "image") {
    document.body.style.background = `url(${theme.value}) center / cover no-repeat`;
  }
}

document.getElementById("openSettings")
  .addEventListener("click", () => {
    window.open("settings.html", "_self");
  });

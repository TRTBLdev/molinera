// Molinera App Controller - Refactored for Muji Borderless UI

// Unregister any old Service Workers from previous projects on this port
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log("Unregistered Service Worker to prevent caching conflicts:", registration);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // --- App State ---
  let state = DB.load();

  if (!state.despensa_viva.custom_categories) {
    state.despensa_viva.custom_categories = {};
  }
  
  // Ensure profile schema nodes exist
  if (!state.perfil_raiz) {
    state.perfil_raiz = {
      fecha_nacimiento: null,
      ciclo: { tipo_seguimiento: null, estado_biologico: "no_especificado", duracion_promedio_ciclo: null, historial_csv_cargado: false, historial_resumen: null },
      perfil_mtc: { day_master: null, elemento_dominante: null, elemento_deficiente: null, patron_fisiologico: null },
      reglas_nutricionales: { allergies: [], intolerances: [], filosofia_alimenticia: "ninguna", objetivos: [] },
      limites_energia: { tiempo_maximo_batch_cooking_minutos: 120 }
    };
  }
  if (!state.perfil_raiz.ciclo) {
    state.perfil_raiz.ciclo = { fase_actual: "menstrual" };
  }
  if (!state.perfil_raiz.perfil_mtc) {
    state.perfil_raiz.perfil_mtc = { day_master: "", elemento_dominante: "", elemento_deficiente: "", patron_fisiologico: "" };
  }

  // --- Tab Navigation Sync ---
  const tabButtons = document.querySelectorAll(".nav-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const topSearch = document.getElementById("top-search");
  const btnAddItemModal = document.getElementById("btn-add-item-modal");
  const btnAddItemModalInfra = document.getElementById("btn-add-item-modal-infra");
  const btnAddItemMobileHeader = document.getElementById("btn-add-item-mobile-header");

  const MACHINERY_CAT_LABELS = {
    coccion: "Cocción y Calor",
    procesamiento: "Procesamiento y Licuado",
    conservacion: "Conservación y Frío",
    otros: "Otros Equipos"
  };

  const UTENSIL_CAT_LABELS = {
    ollas_sartenes: "Ollas y Sartenes",
    cuchillos_corte: "Cuchillos y Corte",
    herramientas: "Herramientas de Cocina",
    medicion: "Medición y Precisión",
    moldes_reposteria: "Moldes y Repostería",
    servicio_bebidas: "Servicio y Bebidas",
    otros: "Otros Utensilios"
  };

  // Taller List Nodes
  const machineryContainer = document.getElementById("machinery-container");
  const utensilsContainer = document.getElementById("utensils-container");
  const storageListGrandes = document.getElementById("storage-list-grandes");
  const storageListMedianos = document.getElementById("storage-list-medianos");
  const storageListPequenos = document.getElementById("storage-list-pequenos");
  
  const badgeTotalGrandes = document.getElementById("badge-total-grandes");
  const badgeTotalMedianos = document.getElementById("badge-total-medianos");
  const badgeTotalPequenos = document.getElementById("badge-total-pequenos");

  // Pantry dynamic list
  const pantryCategoriesContainer = document.getElementById("pantry-categories-container");
  
  // Alacena Master list
  const masterSelectionContainer = document.getElementById("master-selection-container");
  const ingredientSearch = document.getElementById("ingredient-search");
  const customIngredientName = document.getElementById("custom-ingredient-name");
  const customIngredientCategory = document.getElementById("custom-ingredient-category");
  const btnAddCustom = document.getElementById("btn-add-custom");

  // El Molino Parameters
  const selectMenstrualPhase = document.getElementById("select-menstrual-phase");
  const selectDayMaster = document.getElementById("select-day-master");
  const selectDominantElement = document.getElementById("select-dominant-element");
  const selectDeficientElement = document.getElementById("select-deficient-element");
  const selectFisiologicalPattern = document.getElementById("select-fisiological-pattern");
  
  const btnPlanSemanal = document.getElementById("btn-plan-semanal");
  const btnPlanMensual = document.getElementById("btn-plan-mensual");
  const textareaRescue = document.getElementById("textarea-rescue");
  const btnCreateContext = document.getElementById("btn-create-context");

  // Local backups
  const btnDownloadJson = document.getElementById("btn-download-json");
  const inputUploadJson = document.getElementById("input-upload-json");
  const btnResetFactory = document.getElementById("btn-reset-factory");

  // Prompts & Actions (Hides JSON visually)
  const markdownPreviewContent = document.getElementById("markdown-preview-content");
  const btnCopyPrompt = document.getElementById("btn-copy-prompt");
  const btnDownloadContext = document.getElementById("btn-download-context");

  const saveStatus = document.getElementById("save-status");

  // Modal Nodes
  const itemModal = document.getElementById("item-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalEditId = document.getElementById("modal-edit-id");
  const modalEditType = document.getElementById("modal-edit-type");
  const groupItemType = document.getElementById("group-item-type");
  const modalItemType = document.getElementById("modal-item-type");
  const modalName = document.getElementById("modal-name");
  const modalDesc = document.getElementById("modal-desc");
  const groupDesc = document.getElementById("group-desc");
  const modalLongDesc = document.getElementById("modal-long-desc");
  const groupLongDesc = document.getElementById("group-long-desc");
  const groupStorageCategory = document.getElementById("group-storage-category");
  const modalStorageCategory = document.getElementById("modal-storage-category");
  const groupStorageCount = document.getElementById("group-storage-count");
  const modalStorageCount = document.getElementById("modal-storage-count");

  const groupMachineryCategory = document.getElementById("group-machinery-category");
  const modalMachineryCategory = document.getElementById("modal-machinery-category");
  const groupUtensilCategory = document.getElementById("group-utensil-category");
  const modalUtensilCategory = document.getElementById("modal-utensil-category");
  
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCancelModal = document.getElementById("btn-cancel-modal");
  const btnSaveModal = document.getElementById("btn-save-modal");

  // Settings Modal Nodes
  const settingsIcons = document.querySelectorAll(".settings-icon");
  const settingsModal = document.getElementById("settings-modal");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const btnCloseSettingsFooter = document.getElementById("btn-close-settings-footer");
  const btnSettingsDownload = document.getElementById("btn-settings-download");
  const inputSettingsUploadJson = document.getElementById("input-settings-upload-json");
  const btnSettingsReset = document.getElementById("btn-settings-reset");

  // Active Tab state helper
  let activeTab = "infraestructura";
  let compiledPromptTextWithJson = ""; // Stores compiled clipboard string

  // --- Access Control Logic ---
  const CREATOR_CODE = "Molinera-Creator-Admin-2026!";
  const GUEST_CODE = "Molinera-Guest-Access-2026?";

  const accessContainer = document.getElementById("access-container");
  const appWrapper = document.querySelector(".app-wrapper");
  const inputAccessCode = document.getElementById("input-access-code");
  const btnSubmitAccess = document.getElementById("btn-submit-access");
  const accessErrorMsg = document.getElementById("access-error-msg");

  function checkAccess() {
    if (state.access_code_validated) {
      if (accessContainer) accessContainer.style.display = "none";
      if (appWrapper) appWrapper.classList.remove("hidden");
      
      // Apply role-based permissions
      if (state.access_role === "invitado") {
        if (btnResetFactory) btnResetFactory.style.display = "none";
      } else {
        if (btnResetFactory) btnResetFactory.style.display = "flex";
      }
    } else {
      if (accessContainer) accessContainer.style.display = "flex";
      if (appWrapper) appWrapper.classList.add("hidden");
    }
  }

  function validateCode() {
    const enteredCode = inputAccessCode ? inputAccessCode.value.trim() : "";
    if (enteredCode === CREATOR_CODE) {
      state.access_role = "creadora";
      state.access_code_validated = true;
      DB.save(state);
      checkAccess();
      showToast("Acceso de Creadora verificado.", "success");
    } else if (enteredCode === GUEST_CODE) {
      state.access_role = "invitado";
      state.access_code_validated = true;
      DB.save(state);
      checkAccess();
      showToast("Acceso de Invitado verificado.", "success");
    } else {
      if (accessErrorMsg) accessErrorMsg.style.display = "block";
    }
  }

  if (btnSubmitAccess) {
    btnSubmitAccess.addEventListener("click", validateCode);
  }
  if (inputAccessCode) {
    inputAccessCode.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        validateCode();
      }
    });
  }

  checkAccess();

  // Levels mapping
  const LEVELS = ["optimo", "medio", "critico", "agotado"];
  const LEVEL_LABELS = {
    optimo: "Óptimo",
    medio: "Medio",
    critico: "Crítico",
    agotado: "Agotado"
  };

  // --- Toast notifications helper ---
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "■";
    if (type === "success") icon = "✓";
    if (type === "error") icon = "✕";
    if (type === "warning") icon = "⚠";
    
    toast.innerHTML = `<span style="font-weight:bold; background:var(--color-accent); color:var(--color-dark); padding:0 4px; font-size:10px;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("animationend", () => toast.remove());
    }, 2800);
  }

  function triggerSaveIndicator() {
    saveStatus.innerHTML = '<span class="dot"></span> Guardando...';
    saveStatus.style.opacity = 1;
    setTimeout(() => {
      saveStatus.innerHTML = '<span class="dot"></span> Sincronizado';
    }, 600);
  }

  // --- Tabs Navigation Sync ---
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      activeTab = tabId;
      
      tabButtons.forEach(b => {
        if (b.dataset.tab === tabId) b.classList.add("active");
        else b.classList.remove("active");
      });

      tabPanels.forEach(p => p.classList.remove("active"));
      document.getElementById(`panel-${tabId}`).classList.add("active");
      
      // Update Top Search bar placeholder
      if (tabId === "infraestructura") topSearch.placeholder = "Buscar equipo, utensilio, envase o básico...";
      else if (tabId === "despensa") topSearch.placeholder = "Buscar ingrediente en despensa...";
      else topSearch.placeholder = "Buscar...";
      
      topSearch.value = "";
      filterUI();

      if (tabId === "molino") {
        updatePlanningUI();
      }
    });
  });

  // --- Top Search Filter ---
  topSearch.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    filterUI(q);
  });

  function filterUI(q = "") {
    if (activeTab === "infraestructura") {
      renderTaller(q);
      renderMasterAlacena(q);
    } else if (activeTab === "despensa") {
      renderPantry(q);
    }
  }

  function deleteTallerItem(id, type) {
    const confirmDelete = confirm("¿Deseas eliminar este elemento del taller?");
    if (!confirmDelete) return;

    if (type === "maquinaria") {
      state.taller.maquinaria = state.taller.maquinaria.filter(i => i.id !== id);
    } else if (type === "utensilio") {
      state.taller.utensilios = state.taller.utensilios.filter(i => i.id !== id);
    } else if (type === "almacenamiento") {
      state.taller.almacenamiento = state.taller.almacenamiento.filter(i => i.id !== id);
    }

    DB.save(state);
    triggerSaveIndicator();
    filterUI(topSearch ? topSearch.value : "");
    showToast("Elemento eliminado del taller.", "warning");
  }

  // --- El Taller (Flat UI, No Icons) ---
  function renderTaller(q = "") {
    renderMachinery(q);
    renderUtensils(q);
    renderStorage(q);
  }

  function renderMachinery(q = "") {
    machineryContainer.innerHTML = "";
    const list = state.taller.maquinaria || [];
    let matchCount = 0;

    const grouped = {
      coccion: [],
      procesamiento: [],
      conservacion: [],
      otros: []
    };

    list.forEach(item => {
      if (q && !item.name.toLowerCase().includes(q)) return;
      matchCount++;
      const cat = item.category || "otros";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    if (matchCount === 0) {
      machineryContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 12px; color: var(--color-text-muted); font-size:12px;">Ningún equipo coincide.</div>`;
      return;
    }

    Object.keys(MACHINERY_CAT_LABELS).forEach(catKey => {
      const items = grouped[catKey] || [];
      if (items.length === 0) return;

      const subHeader = document.createElement("div");
      subHeader.className = "taller-sub-header";
      subHeader.textContent = MACHINERY_CAT_LABELS[catKey];
      machineryContainer.appendChild(subHeader);

      items.forEach(item => {
        const card = document.createElement("div");
        card.className = `machine-card ${item.owned ? "owned" : "unowned"}`;
        card.id = `card-machinery-${item.id}`;

        card.innerHTML = `
          <div class="card-actions-hover">
            <button class="btn-card-action edit" title="Editar">
              <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="btn-card-action delete" title="Eliminar">
              <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="machine-card-body">
            <div class="machine-title-row">
              <h4>${item.name}</h4>
              ${item.longDesc ? `
                <button class="btn-note-toggle" title="Ver tecnología y funciones">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="note-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </button>
              ` : ""}
            </div>
            <p>${item.desc || ""}</p>
            ${item.longDesc ? `<div class="machine-long-desc">${item.longDesc}</div>` : ""}
          </div>
          <span class="card-status-badge ${item.owned ? "owned" : "unowned"}">
            ${item.owned ? "Tengo" : "No tengo"}
          </span>
        `;

        card.addEventListener("click", (e) => {
          if (e.target.closest(".card-actions-hover") || e.target.closest(".btn-note-toggle")) return;
          item.owned = !item.owned;
          DB.save(state);
          triggerSaveIndicator();
          renderMachinery(q);
        });

        if (item.longDesc) {
          card.querySelector(".btn-note-toggle").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const descEl = card.querySelector(".machine-long-desc");
            const btnEl = card.querySelector(".btn-note-toggle");
            descEl.classList.toggle("expanded");
            btnEl.classList.toggle("active");
          });
        }

        card.querySelector(".btn-card-action.edit").addEventListener("click", () => {
          openEditModal(item, "maquinaria");
        });

        card.querySelector(".btn-card-action.delete").addEventListener("click", () => {
          deleteTallerItem(item.id, "maquinaria");
        });

        machineryContainer.appendChild(card);
      });
    });
  }

  function renderUtensils(q = "") {
    utensilsContainer.innerHTML = "";
    const list = state.taller.utensilios || [];
    let matchCount = 0;

    const grouped = {
      ollas_sartenes: [],
      cuchillos_corte: [],
      herramientas: [],
      medicion: [],
      moldes_reposteria: [],
      servicio_bebidas: [],
      otros: []
    };

    list.forEach(item => {
      if (q && !item.name.toLowerCase().includes(q)) return;
      matchCount++;
      const cat = item.category || "otros";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    if (matchCount === 0) {
      utensilsContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 12px; color: var(--color-text-muted); font-size:12px;">Ningún utensilio coincide.</div>`;
      return;
    }

    Object.keys(UTENSIL_CAT_LABELS).forEach(catKey => {
      const items = grouped[catKey] || [];
      if (items.length === 0) return;

      const subHeader = document.createElement("div");
      subHeader.className = "taller-sub-header";
      subHeader.textContent = UTENSIL_CAT_LABELS[catKey];
      utensilsContainer.appendChild(subHeader);

      items.forEach(item => {
        const card = document.createElement("div");
        card.className = `machine-card ${item.owned ? "owned" : "unowned"}`;
        card.id = `card-utensil-${item.id}`;

        card.innerHTML = `
          <div class="card-actions-hover">
            <button class="btn-card-action edit" title="Editar">
              <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="btn-card-action delete" title="Eliminar">
              <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="machine-card-body">
            <div class="machine-title-row">
              <h4>${item.name}</h4>
              ${item.longDesc ? `
                <button class="btn-note-toggle" title="Ver tecnología y funciones">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="note-icon-svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </button>
              ` : ""}
            </div>
            <p>${item.desc || ""}</p>
            ${item.longDesc ? `<div class="machine-long-desc">${item.longDesc}</div>` : ""}
          </div>
          <span class="card-status-badge ${item.owned ? "owned" : "unowned"}">
            ${item.owned ? "Tengo" : "No tengo"}
          </span>
        `;

        card.addEventListener("click", (e) => {
          if (e.target.closest(".card-actions-hover") || e.target.closest(".btn-note-toggle")) return;
          item.owned = !item.owned;
          DB.save(state);
          triggerSaveIndicator();
          renderUtensils(q);
        });

        if (item.longDesc) {
          card.querySelector(".btn-note-toggle").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const descEl = card.querySelector(".machine-long-desc");
            const btnEl = card.querySelector(".btn-note-toggle");
            descEl.classList.toggle("expanded");
            btnEl.classList.toggle("active");
          });
        }

        card.querySelector(".btn-card-action.edit").addEventListener("click", () => {
          openEditModal(item, "utensilio");
        });

        card.querySelector(".btn-card-action.delete").addEventListener("click", () => {
          deleteTallerItem(item.id, "utensilio");
        });

        utensilsContainer.appendChild(card);
      });
    });
  }

  function renderStorage(q = "") {
    storageListGrandes.innerHTML = "";
    storageListMedianos.innerHTML = "";
    storageListPequenos.innerHTML = "";

    const list = state.taller.almacenamiento || [];

    let totalGrandes = 0;
    let totalMedianos = 0;
    let totalPequenos = 0;

    list.forEach(item => {
      if (q && !item.name.toLowerCase().includes(q)) return;

      const row = document.createElement("div");
      row.className = "storage-row";
      row.id = `row-storage-${item.id}`;

        row.innerHTML = `
          <div class="storage-row-info">
            <span class="storage-dot"></span>
            <div>
              <span class="storage-name">${item.name}</span>
              <span class="storage-desc">${item.desc || ""}</span>
            </div>
          </div>
          <div class="storage-row-controls">
            <div class="storage-actions-hover">
              <button class="btn-row-action adjust decrease" data-id="${item.id}">-</button>
              <button class="btn-row-action adjust increase" data-id="${item.id}">+</button>
              <button class="btn-row-action edit" title="Editar">
                <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button class="btn-row-action delete" title="Eliminar">
                <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <span class="storage-badge-count">${item.count || 0}</span>
          </div>
        `;

      row.querySelector(".btn-row-action.decrease").addEventListener("click", () => {
        if (item.count > 0) {
          item.count--;
          DB.save(state);
          triggerSaveIndicator();
          renderStorage(q);
        }
      });

      row.querySelector(".btn-row-action.increase").addEventListener("click", () => {
        item.count++;
        DB.save(state);
        triggerSaveIndicator();
        renderStorage(q);
      });

      row.querySelector(".btn-row-action.edit").addEventListener("click", () => {
        openEditModal(item, "almacenamiento");
      });

      row.querySelector(".btn-row-action.delete").addEventListener("click", () => {
        deleteTallerItem(item.id, "almacenamiento");
      });

      if (item.category === "grandes") {
        storageListGrandes.appendChild(row);
        totalGrandes += item.count || 0;
      } else if (item.category === "medianos") {
        storageListMedianos.appendChild(row);
        totalMedianos += item.count || 0;
      } else if (item.category === "pequenos") {
        storageListPequenos.appendChild(row);
        totalPequenos += item.count || 0;
      }
    });

    badgeTotalGrandes.textContent = `${totalGrandes} TOTAL`;
    badgeTotalMedianos.textContent = `${totalMedianos} TOTAL`;
    badgeTotalPequenos.textContent = `${totalPequenos} TOTAL`;

    if (storageListGrandes.children.length === 0) {
      storageListGrandes.innerHTML = `<div style="padding: 10px 0; color: var(--color-text-muted); font-size:12px;">Vacío.</div>`;
    }
    if (storageListMedianos.children.length === 0) {
      storageListMedianos.innerHTML = `<div style="padding: 10px 0; color: var(--color-text-muted); font-size:12px;">Vacío.</div>`;
    }
    if (storageListPequenos.children.length === 0) {
      storageListPequenos.innerHTML = `<div style="padding: 10px 0; color: var(--color-text-muted); font-size:12px;">Vacío.</div>`;
    }
  }

  // --- Modal Form Actions ---
  function openAddModal() {
    modalTitle.textContent = "Añadir Item";
    modalEditId.value = "";
    modalEditType.value = "";
    groupItemType.style.display = "flex";
    
    modalName.value = "";
    modalDesc.value = "";
    modalLongDesc.value = "";
    
    modalItemType.value = "maquinaria";
    toggleModalFields("maquinaria");
    
    if (modalMachineryCategory) modalMachineryCategory.value = "coccion";
    if (modalUtensilCategory) modalUtensilCategory.value = "ollas_sartenes";
    
    itemModal.classList.add("show");
  }

  if (btnAddItemModal) btnAddItemModal.addEventListener("click", openAddModal);
  if (btnAddItemModalInfra) btnAddItemModalInfra.addEventListener("click", openAddModal);
  if (btnAddItemMobileHeader) btnAddItemMobileHeader.addEventListener("click", openAddModal);

  modalItemType.addEventListener("change", () => {
    toggleModalFields(modalItemType.value);
  });

  function toggleModalFields(type) {
    if (type === "almacenamiento") {
      groupDesc.querySelector("label").textContent = "Capacidad (Descripción)";
      modalDesc.placeholder = "Ej: Capacidad 2.5L, hermético...";
      groupStorageCategory.style.display = "flex";
      groupStorageCount.style.display = "flex";
      groupLongDesc.style.display = "none";
      if (groupMachineryCategory) groupMachineryCategory.style.display = "none";
      if (groupUtensilCategory) groupUtensilCategory.style.display = "none";
    } else if (type === "maquinaria") {
      groupDesc.querySelector("label").textContent = "Descripción corta";
      modalDesc.placeholder = "Ej: Para caldos, eléctrica, XL...";
      groupStorageCategory.style.display = "none";
      groupStorageCount.style.display = "none";
      groupLongDesc.style.display = "flex";
      if (groupMachineryCategory) groupMachineryCategory.style.display = "flex";
      if (groupUtensilCategory) groupUtensilCategory.style.display = "none";
    } else if (type === "utensilio") {
      groupDesc.querySelector("label").textContent = "Descripción corta";
      modalDesc.placeholder = "Ej: Sartén de teflón, acero inoxidable...";
      groupStorageCategory.style.display = "none";
      groupStorageCount.style.display = "none";
      groupLongDesc.style.display = "flex";
      if (groupMachineryCategory) groupMachineryCategory.style.display = "none";
      if (groupUtensilCategory) groupUtensilCategory.style.display = "flex";
    }
  }

  function closeModal() {
    itemModal.classList.remove("show");
  }
  btnCloseModal.addEventListener("click", closeModal);
  btnCancelModal.addEventListener("click", closeModal);
  itemModal.addEventListener("click", (e) => {
    if (e.target === itemModal) closeModal();
  });

  // Save Modal Changes
  btnSaveModal.addEventListener("click", () => {
    const name = modalName.value.trim();
    if (!name) {
      showToast("Por favor, ingresa el nombre del elemento.", "warning");
      return;
    }

    const editId = modalEditId.value;
    const editType = modalEditType.value;

    if (editId) {
      // EDIT
      let item = null;
      if (editType === "maquinaria") {
        item = state.taller.maquinaria.find(i => i.id === editId);
      } else if (editType === "utensilio") {
        item = state.taller.utensilios.find(i => i.id === editId);
      } else if (editType === "almacenamiento") {
        item = state.taller.almacenamiento.find(i => i.id === editId);
      }

      if (item) {
        item.name = name;
        item.desc = modalDesc.value.trim();
        if (editType === "almacenamiento") {
          item.category = modalStorageCategory.value;
          item.count = parseInt(modalStorageCount.value) || 0;
        } else if (editType === "maquinaria") {
          item.longDesc = modalLongDesc.value.trim();
          item.category = modalMachineryCategory.value;
        } else if (editType === "utensilio") {
          item.longDesc = modalLongDesc.value.trim();
          item.category = modalUtensilCategory.value;
        }
      }
    } else {
      // CREATE
      const type = modalItemType.value;
      const newId = `item_${Date.now()}`;
      
      if (type === "maquinaria") {
        state.taller.maquinaria.push({
          id: newId,
          name: name,
          desc: modalDesc.value.trim(),
          longDesc: modalLongDesc.value.trim(),
          category: modalMachineryCategory.value,
          owned: true
        });
      } else if (type === "utensilio") {
        state.taller.utensilios.push({
          id: newId,
          name: name,
          desc: modalDesc.value.trim(),
          longDesc: modalLongDesc.value.trim(),
          category: modalUtensilCategory.value,
          owned: true
        });
      } else if (type === "almacenamiento") {
        state.taller.almacenamiento.push({
          id: newId,
          name: name,
          desc: modalDesc.value.trim(),
          category: modalStorageCategory.value,
          count: parseInt(modalStorageCount.value) || 1
        });
      }
    }

    DB.save(state);
    triggerSaveIndicator();
    closeModal();
    filterUI(topSearch.value);
    showToast("Guardado correctamente.", "success");
  });

  // Open edit modal
  function openEditModal(item, type) {
    modalTitle.textContent = "Editar Item";
    modalEditId.value = item.id;
    modalEditType.value = type;
    groupItemType.style.display = "none";
    
    modalName.value = item.name;
    modalDesc.value = item.desc || "";
    
    if (type === "almacenamiento") {
      modalStorageCategory.value = item.category || "grandes";
      modalStorageCount.value = item.count || 0;
      toggleModalFields("almacenamiento");
    } else if (type === "maquinaria") {
      modalLongDesc.value = item.longDesc || "";
      modalMachineryCategory.value = item.category || "otros";
      toggleModalFields("maquinaria");
    } else if (type === "utensilio") {
      modalLongDesc.value = item.longDesc || "";
      modalUtensilCategory.value = item.category || "otros";
      toggleModalFields("utensilio");
    }
    
    itemModal.classList.add("show");
  }

  // --- Alacena Maestra (Borderless lists inside configuration) ---
  function renderMasterAlacena(searchFilter = "") {
    masterSelectionContainer.innerHTML = "";
    const activeSet = new Set(state.despensa_viva.alacena_maestra || []);
    const pantryLevels = state.despensa_viva.alacena || {};
    
    const categoriesData = {};
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      categoriesData[cat] = [];
    });

    INGREDIENTS_CATALOG.forEach(item => {
      if (searchFilter && !item.name.toLowerCase().includes(searchFilter.toLowerCase())) return;
      categoriesData[item.category].push(item.name);
    });

    Object.keys(state.despensa_viva.custom_categories).forEach(customName => {
      if (searchFilter && !customName.toLowerCase().includes(searchFilter.toLowerCase())) return;
      const cat = state.despensa_viva.custom_categories[customName] || "despensa";
      if (!categoriesData[cat].includes(customName)) {
        categoriesData[cat].push(customName);
      }
    });

    let totalRendered = 0;
    Object.keys(CATEGORY_LABELS).forEach(catKey => {
      const names = categoriesData[catKey];
      if (names.length === 0) return;
      totalRendered += names.length;

      const catCard = document.createElement("div");
      catCard.className = "master-category-card";
      
      catCard.innerHTML = `
        <div class="master-category-title collapsible-header">${CATEGORY_LABELS[catKey]}</div>
        <div class="master-items-grid collapsible-content" id="master-grid-cat-${catKey}"></div>
      `;
      
      masterSelectionContainer.appendChild(catCard);
      const title = catCard.querySelector(".master-category-title");
      const grid = catCard.querySelector(".master-items-grid");
      title.addEventListener("click", () => {
        title.classList.toggle("collapsed");
        grid.classList.toggle("collapsed");
      });
      
      names.sort().forEach(name => {
        const isChecked = activeSet.has(name);
        const level = pantryLevels[name] || "optimo";
        
        const row = document.createElement("div");
        row.className = `master-item-row ${isChecked ? 'checked' : ''} level-${level}`;
        
        row.innerHTML = `
          <div class="master-item-left">
            <input type="checkbox" data-name="${name}" ${isChecked ? 'checked' : ''}>
            <span class="master-item-name">${name}</span>
          </div>
          <div class="master-item-actions">
            <div class="item-edit-delete-hover">
              <button class="btn-item-action edit" title="Editar ingrediente">
                <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button class="btn-item-action delete" title="Eliminar ingrediente">
                <svg class="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <span class="master-status-label" data-name="${name}">${LEVEL_LABELS[level]}</span>
          </div>
        `;
        
        const checkbox = row.querySelector('input[type="checkbox"]');
        
        // Checklist toggle
        checkbox.addEventListener("change", () => {
          const ingName = checkbox.dataset.name;
          if (checkbox.checked) {
            if (!state.despensa_viva.alacena_maestra.includes(ingName)) {
              state.despensa_viva.alacena_maestra.push(ingName);
            }
            if (!state.despensa_viva.alacena[ingName]) {
              state.despensa_viva.alacena[ingName] = "optimo";
            }
            row.classList.add("checked");
          } else {
            state.despensa_viva.alacena_maestra = state.despensa_viva.alacena_maestra.filter(n => n !== ingName);
            row.classList.remove("checked");
          }
          
          DB.save(state);
          triggerSaveIndicator();
          renderMasterAlacena(searchFilter);
          renderPantry();
        });

        // Click on status badge cycles level in Alacena too!
        const statusLabel = row.querySelector(".master-status-label");
        statusLabel.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const currentLevel = state.despensa_viva.alacena[name] || "optimo";
          const currentIndex = LEVELS.indexOf(currentLevel);
          const nextIndex = (currentIndex + 1) % LEVELS.length;
          const nextLevel = LEVELS[nextIndex];
          
          state.despensa_viva.alacena[name] = nextLevel;
          DB.save(state);
          triggerSaveIndicator();
          
          renderMasterAlacena(searchFilter);
          renderPantry();
        });

        // Edit Ingredient
        row.querySelector(".btn-item-action.edit").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newName = prompt("Editar nombre del ingrediente:", name);
          if (newName && newName.trim() !== "" && newName.trim() !== name) {
            const trimmed = newName.trim();
            // Check if already exists
            const alreadyExists = state.despensa_viva.alacena_maestra.includes(trimmed);
            if (alreadyExists) {
              alert("Este ingrediente ya existe.");
              return;
            }
            // Update in alacena_maestra
            state.despensa_viva.alacena_maestra = state.despensa_viva.alacena_maestra.map(n => n === name ? trimmed : n);
            // Update in alacena levels
            if (state.despensa_viva.alacena[name]) {
              state.despensa_viva.alacena[trimmed] = state.despensa_viva.alacena[name];
              delete state.despensa_viva.alacena[name];
            }
            // Update in custom_categories
            if (state.despensa_viva.custom_categories[name]) {
              state.despensa_viva.custom_categories[trimmed] = state.despensa_viva.custom_categories[name];
              delete state.despensa_viva.custom_categories[name];
            } else {
              const oldCat = getIngredientCategory(name);
              state.despensa_viva.custom_categories[trimmed] = oldCat;
            }
            DB.save(state);
            triggerSaveIndicator();
            renderMasterAlacena(searchFilter);
            renderPantry();
            showToast("Ingrediente renombrado.", "success");
          }
        });

        // Delete Ingredient
        row.querySelector(".btn-item-action.delete").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const confirmDelete = confirm(`¿Eliminar "${name}" de la biblioteca?`);
          if (confirmDelete) {
            state.despensa_viva.alacena_maestra = state.despensa_viva.alacena_maestra.filter(n => n !== name);
            delete state.despensa_viva.alacena[name];
            delete state.despensa_viva.custom_categories[name];
            
            DB.save(state);
            triggerSaveIndicator();
            renderMasterAlacena(searchFilter);
            renderPantry();
            showToast("Ingrediente eliminado.", "warning");
          }
        });
        
        grid.appendChild(row);
      });
    });

    if (totalRendered === 0) {
      masterSelectionContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--color-text-muted);">Ningún básico coincide.</div>`;
    }
  }

  // Handle ingredient libraries searches
  ingredientSearch.addEventListener("input", (e) => {
    renderMasterAlacena(e.target.value);
  });

  // Adding Custom Ingredient
  btnAddCustom.addEventListener("click", () => {
    const name = customIngredientName.value.trim();
    const category = customIngredientCategory.value;

    if (!name) {
      showToast("Ingresa el nombre del ingrediente.", "warning");
      return;
    }

    const isPredefined = INGREDIENTS_CATALOG.some(i => i.name.toLowerCase() === name.toLowerCase());
    const isCustom = state.despensa_viva.custom_categories[name] !== undefined;

    if (isPredefined || isCustom) {
      showToast("Este ingrediente ya existe.", "warning");
      return;
    }

    state.despensa_viva.custom_categories[name] = category;
    if (!state.despensa_viva.alacena_maestra.includes(name)) {
      state.despensa_viva.alacena_maestra.push(name);
    }
    state.despensa_viva.alacena[name] = "optimo";

    DB.save(state);
    triggerSaveIndicator();

    customIngredientName.value = "";
    ingredientSearch.value = "";
    
    renderMasterAlacena();
    renderPantry();
    
    showToast(`"${name}" agregado exitosamente.`, "success");
  });

  // --- La Despensa Viva (Click / Tap to Cycle Status) ---
  function renderPantry(q = "") {
    pantryCategoriesContainer.innerHTML = "";
    
    const activeIngredients = state.despensa_viva.alacena_maestra || [];
    const pantryLevels = state.despensa_viva.alacena || {};
    
    const filteredIngredients = activeIngredients.filter(name => {
      return !q || name.toLowerCase().includes(q);
    });

    if (filteredIngredients.length === 0) {
      pantryCategoriesContainer.innerHTML = `
        <div class="section-card" style="text-align: center; padding: 40px 20px; border-radius:0;">
          <p style="font-size: 15px; margin-bottom: 8px;">🚫 Ningún ingrediente activo coincide.</p>
          <p class="subtitle" style="margin: 0;">Selecciona ingredientes en la pestaña <strong>Infraestructura</strong>.</p>
        </div>
      `;
      updateSummaryCounts();
      return;
    }

    const grouped = {};
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      grouped[cat] = [];
    });

    filteredIngredients.forEach(name => {
      const category = getIngredientCategory(name);
      if (grouped[category]) {
        grouped[category].push(name);
      } else {
        grouped["despensa"].push(name);
      }
    });

    // Render category sections
    Object.keys(CATEGORY_LABELS).forEach(catKey => {
      const items = grouped[catKey];
      if (items.length === 0) return;

      const catSection = document.createElement("div");
      catSection.className = "category-section";
      
      catSection.innerHTML = `
        <h3 class="category-title collapsible-header">${CATEGORY_LABELS[catKey]}</h3>
        <div class="pantry-items-grid collapsible-content" id="grid-cat-${catKey}"></div>
      `;
      
      pantryCategoriesContainer.appendChild(catSection);
      const title = catSection.querySelector(".category-title");
      const grid = catSection.querySelector(".pantry-items-grid");
      title.addEventListener("click", () => {
        title.classList.toggle("collapsed");
        grid.classList.toggle("collapsed");
      });
      
      items.forEach(name => {
        const level = pantryLevels[name] || "optimo";
        
        const card = document.createElement("div");
        card.className = `pantry-item-card level-${level}`;
        
        // Render simple text row with uppercase tag
        card.innerHTML = `
          <div class="pantry-item-name">${name}</div>
          <span class="pantry-status-badge">${LEVEL_LABELS[level]}</span>
        `;
        
        // Tap to cycle levels: Optimo ➔ Medio ➔ Critico ➔ Agotado
        card.addEventListener("click", () => {
          const currentLevel = state.despensa_viva.alacena[name] || "optimo";
          const currentIndex = LEVELS.indexOf(currentLevel);
          const nextIndex = (currentIndex + 1) % LEVELS.length;
          const nextLevel = LEVELS[nextIndex];
          
          state.despensa_viva.alacena[name] = nextLevel;
          DB.save(state);
          triggerSaveIndicator();
          
          // Fast UI updates
          card.className = `pantry-item-card level-${nextLevel}`;
          card.querySelector(".pantry-status-badge").textContent = LEVEL_LABELS[nextLevel];
          
          updateSummaryCounts();
        });
        
        grid.appendChild(card);
      });
    });

    updateSummaryCounts();
  }

  // --- El Molino Parameters Sync ---
  function updatePlanningUI() {
    // Phase menstrual
    const phase = state.perfil_raiz.ciclo.fase_actual || "menstrual";
    selectMenstrualPhase.value = phase;

    // BaZi elements
    selectDayMaster.value = state.perfil_raiz.perfil_mtc.day_master || "";
    selectDominantElement.value = state.perfil_raiz.perfil_mtc.elemento_dominante || "";
    selectDeficientElement.value = state.perfil_raiz.perfil_mtc.elemento_deficiente || "";
    selectFisiologicalPattern.value = state.perfil_raiz.perfil_mtc.patron_fisiologico || "";

    // Scale planning toggle
    const scale = state.ejecucion.tipo_planificacion || "semanal";
    if (scale === "semanal") {
      btnPlanSemanal.classList.add("active");
      btnPlanMensual.classList.remove("active");
    } else {
      btnPlanMensual.classList.add("active");
      btnPlanSemanal.classList.remove("active");
    }

    textareaRescue.value = state.ejecucion.rescate_perecederos || "";

    // Dietary preferences
    updateDietaryPrefsUI();
  }

  // Listeners
  selectMenstrualPhase.addEventListener("change", (e) => {
    state.perfil_raiz.ciclo.fase_actual = e.target.value;
    DB.save(state);
    triggerSaveIndicator();
  });

  selectDayMaster.addEventListener("change", (e) => {
    state.perfil_raiz.perfil_mtc.day_master = e.target.value;
    DB.save(state);
    triggerSaveIndicator();
  });

  selectDominantElement.addEventListener("change", (e) => {
    state.perfil_raiz.perfil_mtc.elemento_dominante = e.target.value;
    DB.save(state);
    triggerSaveIndicator();
  });

  selectDeficientElement.addEventListener("change", (e) => {
    state.perfil_raiz.perfil_mtc.elemento_deficiente = e.target.value;
    DB.save(state);
    triggerSaveIndicator();
  });

  selectFisiologicalPattern.addEventListener("change", (e) => {
    state.perfil_raiz.perfil_mtc.patron_fisiologico = e.target.value;
    DB.save(state);
    triggerSaveIndicator();
  });

  btnPlanSemanal.addEventListener("click", () => {
    state.ejecucion.tipo_planificacion = "semanal";
    DB.save(state);
    triggerSaveIndicator();
    updatePlanningUI();
  });

  btnPlanMensual.addEventListener("click", () => {
    state.ejecucion.tipo_planificacion = "mensual";
    DB.save(state);
    triggerSaveIndicator();
    updatePlanningUI();
  });

  textareaRescue.addEventListener("input", (e) => {
    state.ejecucion.rescate_perecederos = e.target.value;
    DB.save(state);
    triggerSaveIndicator();
  });

  // --- Compile Prompt (Crear Contexto) ---
  btnCreateContext.addEventListener("click", () => {
    // Redraw and generate context document
    const rawJson = JSON.stringify(state, null, 2);
    const markdownVisual = generateMarkdownPromptPreview(state);
    
    // Set visual display on screen (No raw JSON visible)
    markdownPreviewContent.innerHTML = renderMarkdownToHTML(markdownVisual);

    // Save final compiled prompt with JSON hidden in background for copy actions
    compiledPromptTextWithJson = `Actúa como Molinera, mi sous-chef digital experta en batch cooking y nutrición hormonal. 
A continuación te proporciono mi contexto completo de cocina e inventario para que generes mi menú planificado:

---
${markdownVisual}
---

Y aquí tienes el bloque de datos estructurado correspondiente para tu analizador interno:
\`\`\`json
${rawJson}
\`\`\`

Basándote en este contexto, por favor genera una propuesta de menú detallada con su respectiva lista de compras y plan de batch cooking.`;

    showToast("Contexto de Molinera compilado con éxito.", "success");
  });

  // Previews compiler
  function generateMarkdownPromptPreview(data) {
    const scaleName = data.ejecucion.tipo_planificacion === "semanal" ? "Semanal" : "Mensual";
    const dateStr = new Date(data.ultimo_cambio).toLocaleString();
    const cyclePhase = data.perfil_raiz.ciclo.fase_actual.toUpperCase();

    // Dietary preferences & allergies
    const dietLabels = {
      ninguna: "Ninguna",
      vegan: "Vegana",
      vegetarian: "Vegetariana",
      pescatarian: "Pescetariana",
      paleo: "Paleo",
      "low-carb": "Baja en Carbohidratos",
      keto: "Keto"
    };
    const dietName = dietLabels[data.perfil_raiz.reglas_nutricionales.filosofia_alimenticia] || "Ninguna";
    const allergiesList = data.perfil_raiz.reglas_nutricionales.allergies || [];
    const allergiesStr = allergiesList.length > 0 ? allergiesList.join(", ") : "Ninguna";

    // BaZi details
    const bazi = data.perfil_raiz.perfil_mtc;
    const dayMaster = bazi.day_master || "No especificado";
    const dominant = bazi.elemento_dominante || "No especificado";
    const deficient = bazi.elemento_deficiente || "No especificado";
    const pattern = bazi.patron_fisiologico || "No especificado";

    const lists = {
      agotado: [],
      critico: [],
      medio: [],
      optimo: []
    };

    const activeList = data.despensa_viva.alacena_maestra || [];
    const levels = data.despensa_viva.alacena || {};

    activeList.forEach(name => {
      const lvl = levels[name] || "optimo";
      if (lists[lvl]) {
        lists[lvl].push(name);
      }
    });

    const activeMachinery = (data.taller.maquinaria || [])
      .filter(i => i.owned)
      .map(i => {
        let details = [];
        if (i.desc) details.push(i.desc);
        if (i.longDesc) details.push(i.longDesc);
        return details.length > 0 ? `${i.name} (${details.join(" - ")})` : i.name;
      });

    const activeUtensils = (data.taller.utensilios || [])
      .filter(i => i.owned)
      .map(i => {
        let details = [];
        if (i.desc) details.push(i.desc);
        if (i.longDesc) details.push(i.longDesc);
        return details.length > 0 ? `${i.name} (${details.join(" - ")})` : i.name;
      });

    const storageCategories = {
      grandes: [],
      medianos: [],
      pequenos: []
    };

    (data.taller.almacenamiento || []).forEach(i => {
      if (i.count > 0) {
        storageCategories[i.category].push(`${i.name} x${i.count}`);
      }
    });

    const md = `# Ficha de Planificación Hormonal y Cocina

* **Planificación:** ${scaleName}
* **Fase del Ciclo:** ${cyclePhase}
* **Dieta / Filosofía:** ${dietName}
* **Alergias / Restricciones:** ${allergiesStr}

## ☯️ Perfil Energético (MTC / BaZi)
* **Day Master:** ${dayMaster}
* **Elemento Dominante:** ${dominant} | **Deficiente:** ${deficient}
* **Patrón MTC:** ${pattern}

## 🚒 Escuadrón de Rescate (Consumir prioritariamente)
${data.ejecucion.rescate_perecederos.trim() ? `> ${data.ejecucion.rescate_perecederos.trim()}` : `*Ninguno declarado. ¡Excelente!*`}

## 🛠️ El Taller (Capacidad Instalada)
* **Maquinaria:** ${activeMachinery.length > 0 ? activeMachinery.join(", ") : "Ninguna"}
* **Utensilios:** ${activeUtensils.length > 0 ? activeUtensils.join(", ") : "Ninguno"}
* **Envases de Almacenamiento:**
  * Grandes: ${storageCategories.grandes.length > 0 ? storageCategories.grandes.join(", ") : "Ninguno"}
  * Medianos: ${storageCategories.medianos.length > 0 ? storageCategories.medianos.join(", ") : "Ninguno"}
  * Pequeños: ${storageCategories.pequenos.length > 0 ? storageCategories.pequenos.join(", ") : "Ninguno"}

## 🥑 Inventario de Despensa Viva
* **AGOTADO (Comprar urgente):** ${lists.agotado.length > 0 ? lists.agotado.join(", ") : "Ninguno"}
* **CRÍTICO (Consumir hoy/mañana y reponer):** ${lists.critico.length > 0 ? lists.critico.join(", ") : "Ninguno"}
* **MEDIO (Consumir moderado):** ${lists.medio.length > 0 ? lists.medio.join(", ") : "Ninguno"}
* **ÓPTIMO (Stock suficiente):** ${lists.optimo.length > 0 ? lists.optimo.join(", ") : "Ninguno"}
`;

    return md;
  }

  function renderMarkdownToHTML(md) {
    let html = md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/\n$/gim, '<br />');

    html = html.replace(/<\/ul>\s*<ul>/g, "");
    return html;
  }

  // --- Copy compiled prompt using Icon button ---
  btnCopyPrompt.addEventListener("click", () => {
    if (!compiledPromptTextWithJson) {
      showToast("Primero haz clic en 'Crear Contexto'.", "warning");
      return;
    }
    navigator.clipboard.writeText(compiledPromptTextWithJson)
      .then(() => showToast("Prompt copiado con datos estructurados.", "success"))
      .catch(() => showToast("Error al copiar prompt.", "error"));
  });

  // --- Download context .json ---
  btnDownloadContext.addEventListener("click", () => {
    // Downloads only the final generated context JSON bridge document
    const contextJson = {
      ultimo_cambio: state.ultimo_cambio,
      perfil_raiz: state.perfil_raiz,
      taller: state.taller,
      despensa_viva: state.despensa_viva,
      ejecucion: state.ejecucion
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contextJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `molinera_contexto_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Archivo JSON de contexto descargado.", "success");
  });

  // --- Database Backups triggers (Infraestructura tab & Settings Modal) ---
  function triggerBackupDownload() {
    DB.exportToFile(state);
    showToast("Respaldo de base de datos descargado.", "success");
  }
  if (btnDownloadJson) btnDownloadJson.addEventListener("click", triggerBackupDownload);
  if (btnSettingsDownload) btnSettingsDownload.addEventListener("click", triggerBackupDownload);

  function handleBackupImport(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const currentAccess = {
        access_code_validated: state.access_code_validated,
        access_role: state.access_role
      };
      const result = DB.validateAndImport(event.target.result, currentAccess);
      if (result.success) {
        state = result.state;
        
        filterUI();
        updatePlanningUI();
        showToast("Base de datos importada correctamente.", "success");
        closeSettingsModal();
      } else {
        showToast(`Error al importar: ${result.error}`, "error");
      }
    };
    reader.readAsText(file);
  }

  if (inputUploadJson) {
    inputUploadJson.addEventListener("change", (e) => {
      handleBackupImport(e.target.files[0]);
      inputUploadJson.value = "";
    });
  }
  if (inputSettingsUploadJson) {
    inputSettingsUploadJson.addEventListener("change", (e) => {
      handleBackupImport(e.target.files[0]);
      inputSettingsUploadJson.value = "";
    });
  }

  function triggerFactoryReset() {
    const confirmReset = confirm("🚨 ¿Deseas reiniciar de fábrica? Esto vaciará permanentemente tus inventarios locales.");
    if (confirmReset) {
      state = DB.reset();
      filterUI();
      updatePlanningUI();
      showToast("App restablecida de fábrica.", "warning");
      setTimeout(() => location.reload(), 1000);
    }
  }
  if (btnResetFactory) btnResetFactory.addEventListener("click", triggerFactoryReset);
  if (btnSettingsReset) btnSettingsReset.addEventListener("click", triggerFactoryReset);

  // Settings Modal controls
  settingsIcons.forEach(icon => {
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Control factory reset display according to role
      if (state.access_role === "invitado") {
        btnSettingsReset.style.display = "none";
      } else {
        btnSettingsReset.style.display = "flex";
      }
      
      settingsModal.classList.add("show");
    });
  });

  function closeSettingsModal() {
    settingsModal.classList.remove("show");
  }
  if (btnCloseSettings) btnCloseSettings.addEventListener("click", closeSettingsModal);
  if (btnCloseSettingsFooter) btnCloseSettingsFooter.addEventListener("click", closeSettingsModal);
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) closeSettingsModal();
    });
  }

  function getIngredientCategory(name) {
    if (state.despensa_viva.custom_categories && state.despensa_viva.custom_categories[name]) {
      return state.despensa_viva.custom_categories[name];
    }
    const found = INGREDIENTS_CATALOG.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (found) {
      return found.category;
    }
    return "despensa";
  }

  function updateSummaryCounts() {
    const activeIngredients = state.despensa_viva.alacena_maestra || [];
    const pantryLevels = state.despensa_viva.alacena || {};
    
    let optimal = 0;
    let medium = 0;
    let critical = 0;
    let empty = 0;
    
    activeIngredients.forEach(name => {
      const lvl = pantryLevels[name] || "optimo";
      if (lvl === "optimo") optimal++;
      else if (lvl === "medio") medium++;
      else if (lvl === "critico") critical++;
      else if (lvl === "agotado") empty++;
    });
    
    const optEl = document.getElementById("count-optimal");
    const medEl = document.getElementById("count-medium");
    const critEl = document.getElementById("count-critical");
    const emptyEl = document.getElementById("count-empty");

    if (optEl) optEl.textContent = optimal;
    if (medEl) medEl.textContent = medium;
    if (critEl) critEl.textContent = critical;
    if (emptyEl) emptyEl.textContent = empty;
  }

  // Collapsible static sections logic
  document.querySelectorAll(".collapsible-header.static-collapsible").forEach(header => {
    header.addEventListener("click", () => {
      header.classList.toggle("collapsed");
      const content = header.nextElementSibling;
      if (content) {
        content.classList.toggle("collapsed");
      }
    });
  });

  // --- Dietary Preferences Sync ---
  function updateDietaryPrefsUI() {
    const philosophy = state.perfil_raiz.reglas_nutricionales.filosofia_alimenticia || "ninguna";
    const allergies = state.perfil_raiz.reglas_nutricionales.allergies || [];
    
    document.querySelectorAll(".diet-card").forEach(c => {
      if (c.dataset.diet === philosophy) {
        c.classList.add("active");
      } else {
        c.classList.remove("active");
      }
    });

    document.querySelectorAll(".allergy-chip").forEach(chip => {
      if (allergies.includes(chip.dataset.allergy)) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  document.querySelectorAll(".diet-card").forEach(card => {
    card.addEventListener("click", () => {
      const diet = card.dataset.diet;
      state.perfil_raiz.reglas_nutricionales.filosofia_alimenticia = diet;
      DB.save(state);
      triggerSaveIndicator();
      updateDietaryPrefsUI();
    });
  });

  document.querySelectorAll(".allergy-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const allergy = chip.dataset.allergy;
      let allergies = state.perfil_raiz.reglas_nutricionales.allergies || [];
      if (allergies.includes(allergy)) {
        allergies = allergies.filter(a => a !== allergy);
      } else {
        allergies.push(allergy);
      }
      state.perfil_raiz.reglas_nutricionales.allergies = allergies;
      DB.save(state);
      triggerSaveIndicator();
      updateDietaryPrefsUI();
    });
  });

  // Force onboarding completed internally
  state.onboarding_completed = true;
  DB.save(state);

  // --- Initializers ---
  filterUI();
  updateDietaryPrefsUI();
});

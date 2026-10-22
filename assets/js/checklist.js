const STORAGE_KEY = "df-pneus-checklist-draft-v2";
const FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros";
const FORM_RADIOS = [
  "Veiculo_Funcionario",
  "Garantia_Peca",
  "Somente_Orcamento"
];

const evaluationData = [
  {
    title: "Avaliação Veicular - Simples (Vendedor)",
    groups: [
      {
        name: "Família: Pneu",
        items: [
          "Pneu Dianteiro",
          "Pneu Traseiro",
          "Geometria",
          "Balanceamento",
          "Válvula",
          "Rodízio de Pneus"
        ]
      },
      {
        name: "Família: Revisão",
        items: [
          "Palhetas do Limpador",
          "Limpeza / Higienização Ar Cond.",
          "Filtro Cabine"
        ]
      }
    ]
  },
  {
    title: "Avaliação Veicular - Completa (Mecânico)",
    groups: [
      {
        name: "Família: Suspensão",
        chunkSize: 10,
        items: [
          "Amortecedor Dianteiro",
          "Amortecedor Traseiro",
          "Kit Amortecedor Dianteiro",
          "Kit Amortecedor Traseiro",
          "Mola Dianteira",
          "Mola Traseira",
          "Bandeja",
          "Pivô",
          "Terminal de Direção",
          "Barra",
          "Bieleta",
          "Homocinética Lado Roda",
          "Homocinética Lado Câmbio",
          "Braço (Pitman / Auxiliar)",
          "Cubo de Rodas (Rolamento)",
          "Rolamento de Roda",
          "Buchas",
          "Coxim (Câmbio / Motor)",
          "Caixa de Direção",
          "Rodas (Tortas/Empenadas)"
        ]
      },
      {
        name: "Família: Lubrificante",
        items: [
          "Óleo Motor",
          "Filtro Óleo",
          "Filtro Combustível",
          "Filtro de Ar (Motor)"
        ]
      },
      {
        name: "Família: Freio",
        items: [
          "Pastilhas Dianteiras",
          "Discos de Freio",
          "Tambor de Freio",
          "Cilindro (Roda / Mestre)",
          "Lonas / Sapatas Freio Traseiro",
          "Flexível / Cabo Freio Mão",
          "Fluído de Freio"
        ]
      }
    ]
  }
];

const state = {
  damageEntries: [],
  fipeVehicleData: null,
  selectedDamageType: "Amassado",
  saveTimer: null,
  toastTimer: null
};

const elements = {
  formFields: () => Array.from(
    document.querySelectorAll("input[id], select[id], textarea[id]")
  ).filter(field => field.type !== "file"),
  brandSelect: document.getElementById("fipeBrand"),
  modelSelect: document.getElementById("fipeModel"),
  yearSelect: document.getElementById("fipeYear"),
  vehicleInput: document.getElementById("vehicle"),
  fipeVehicleDetails: document.getElementById("fipeVehicleDetails"),
  damageList: document.getElementById("damageList"),
  photoInput: document.getElementById("damagePhotos"),
  photoPreview: document.getElementById("photoPreview"),
  damageTypeToolbar: document.getElementById("damageTypeToolbar"),
  summaryOutput: document.getElementById("summaryOutput"),
  printSheetMeta: document.getElementById("printSheetMeta"),
  printSheetContent: document.getElementById("printSheetContent"),
  evaluationContainer: document.getElementById("evaluationSections"),
  draftStatus: document.getElementById("draftStatus"),
  fipeStatus: document.getElementById("fipeStatus"),
  toast: document.getElementById("appToast"),
  addDamageBtn: document.getElementById("addDamage"),
  generateSummaryBtn: document.getElementById("generateSummaryBtn"),
  sendEmailBtn: document.getElementById("sendEmailBtn"),
  shareChecklistBtn: document.getElementById("shareChecklistBtn"),
  printChecklistBtn: document.getElementById("printChecklistBtn")
};

function setStatusChip(element, message, variant = "info") {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `status-chip status-chip--${variant}`;
}

function showToast(message, variant = "info") {
  if (!elements.toast) {
    return;
  }

  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast toast--visible toast--${variant} hidden-print`;

  state.toastTimer = window.setTimeout(() => {
    elements.toast.className = "toast hidden-print";
  }, 3000);
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatPlate(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

function formatKm(value) {
  const digits = value.replace(/\D/g, "").slice(0, 9);

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("pt-BR");
}

function sanitizeText(value) {
  return value.trim();
}

function getFieldValue(id) {
  const element = document.getElementById(id);
  return element ? sanitizeText(element.value) : "";
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "-";
}

function setSelectOptions(select, placeholder, items, formatter) {
  select.innerHTML = [
    `<option value="">${placeholder}</option>`,
    ...items.map(item => formatter(item))
  ].join("");
}

function getSelectedText(select) {
  return select?.options[select.selectedIndex]?.text || "";
}

function clearAutoFilledVehicleIfNeeded() {
  if (!state.fipeVehicleData?.vehicleLabel) {
    return;
  }

  if (elements.vehicleInput.value === state.fipeVehicleData.vehicleLabel) {
    elements.vehicleInput.value = "";
  }
}

function renderFipeVehicleDetails(vehicleData = null) {
  if (!elements.fipeVehicleDetails) {
    return;
  }

  if (!vehicleData) {
    elements.fipeVehicleDetails.innerHTML = `
      <div class="fipe-result-empty">
        Selecione marca, modelo e ano para preencher o veículo automaticamente.
      </div>
    `;
    return;
  }

  const detailItems = [
    { label: "Marca", value: vehicleData.brand },
    { label: "Modelo", value: vehicleData.model },
    { label: "Ano", value: vehicleData.year },
    { label: "Combustível", value: vehicleData.fuel }
  ];

  elements.fipeVehicleDetails.innerHTML = `
    <div class="fipe-result-grid">
      ${detailItems.map(item => `
        <div class="fipe-result-card">
          <span>${item.label}</span>
          <strong>${item.value || "-"}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

async function fetchFipe(endpoint) {
  const response = await fetch(`${FIPE_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error("Não foi possível consultar a FIPE.");
  }

  return response.json();
}

async function loadFipeBrands(selectedValue = "") {
  elements.brandSelect.disabled = true;
  setStatusChip(elements.fipeStatus, "Carregando marcas da FIPE...", "info");

  try {
    const brands = await fetchFipe("/marcas");

    setSelectOptions(
      elements.brandSelect,
      "Selecione a marca...",
      brands,
      brand => `<option value="${brand.codigo}">${brand.nome}</option>`
    );

    elements.brandSelect.value = selectedValue;
    elements.brandSelect.disabled = false;
    setStatusChip(elements.fipeStatus, "FIPE online", "success");
  } catch (error) {
    console.error("Erro FIPE ao carregar marcas:", error);
    setSelectOptions(
      elements.brandSelect,
      "Erro ao carregar marcas",
      [],
      () => ""
    );
    setStatusChip(elements.fipeStatus, "Falha ao carregar FIPE", "error");
  }
}

async function loadFipeModels(brandId, selectedValue = "") {
  clearAutoFilledVehicleIfNeeded();
  elements.modelSelect.disabled = true;
  elements.yearSelect.disabled = true;
  setSelectOptions(elements.modelSelect, "Carregando modelos...", [], () => "");
  setSelectOptions(elements.yearSelect, "Aguardando modelo...", [], () => "");
  state.fipeVehicleData = null;
  renderFipeVehicleDetails();

  if (!brandId) {
    setSelectOptions(elements.modelSelect, "Aguardando marca...", [], () => "");
    return;
  }

  try {
    const data = await fetchFipe(`/marcas/${brandId}/modelos`);

    setSelectOptions(
      elements.modelSelect,
      "Selecione o modelo...",
      data.modelos,
      model => `<option value="${model.codigo}">${model.nome}</option>`
    );

    elements.modelSelect.value = selectedValue;
    elements.modelSelect.disabled = false;
    setStatusChip(elements.fipeStatus, "Modelos atualizados", "success");
  } catch (error) {
    console.error("Erro FIPE ao carregar modelos:", error);
    setSelectOptions(elements.modelSelect, "Erro ao carregar modelos", [], () => "");
    setStatusChip(elements.fipeStatus, "Erro ao carregar modelos", "error");
  }
}

async function loadFipeYears(brandId, modelId, selectedValue = "") {
  clearAutoFilledVehicleIfNeeded();
  elements.yearSelect.disabled = true;
  setSelectOptions(elements.yearSelect, "Carregando anos...", [], () => "");
  state.fipeVehicleData = null;
  renderFipeVehicleDetails();

  if (!brandId || !modelId) {
    setSelectOptions(elements.yearSelect, "Aguardando modelo...", [], () => "");
    return;
  }

  try {
    const years = await fetchFipe(`/marcas/${brandId}/modelos/${modelId}/anos`);

    setSelectOptions(
      elements.yearSelect,
      "Selecione o ano...",
      years,
      year => `<option value="${year.codigo}">${year.nome}</option>`
    );

    elements.yearSelect.value = selectedValue;
    elements.yearSelect.disabled = false;
    setStatusChip(elements.fipeStatus, "Anos atualizados", "success");
  } catch (error) {
    console.error("Erro FIPE ao carregar anos:", error);
    setSelectOptions(elements.yearSelect, "Erro ao carregar anos", [], () => "");
    setStatusChip(elements.fipeStatus, "Erro ao carregar anos", "error");
  }
}

async function loadFipeVehicleDetails(brandId, modelId, yearCode) {
  return fetchFipe(`/marcas/${brandId}/modelos/${modelId}/anos/${yearCode}`);
}

async function syncVehicleFromFipe() {
  if (!elements.brandSelect.value || !elements.modelSelect.value || !elements.yearSelect.value) {
    state.fipeVehicleData = null;
    renderFipeVehicleDetails();
    return;
  }

  const brandName = getSelectedText(elements.brandSelect);
  const modelName = getSelectedText(elements.modelSelect);
  const selectedYearLabel = getSelectedText(elements.yearSelect);
  const selectedYearName = selectedYearLabel.split(" ")[0];

  setStatusChip(elements.fipeStatus, "Consultando dados completos do veículo...", "info");

  try {
    const vehicleData = await loadFipeVehicleDetails(
      elements.brandSelect.value,
      elements.modelSelect.value,
      elements.yearSelect.value
    );

    const resolvedVehicle = [
      vehicleData.Marca || brandName,
      vehicleData.Modelo || modelName,
      vehicleData.AnoModelo || selectedYearName
    ].filter(Boolean).join(" ");

    elements.vehicleInput.value = resolvedVehicle.trim();

    state.fipeVehicleData = {
      brand: vehicleData.Marca || brandName,
      model: vehicleData.Modelo || modelName,
      year: String(vehicleData.AnoModelo || selectedYearName || "-"),
      fuel: vehicleData.Combustivel || selectedYearLabel.split(" ").slice(1).join(" ") || "-",
      fipeCode: vehicleData.CodigoFipe || "-",
      referenceMonth: vehicleData.MesReferencia || "-",
      vehicleLabel: resolvedVehicle.trim()
    };

    renderFipeVehicleDetails(state.fipeVehicleData);
    updateSummaryOutput();
    scheduleDraftSave();
    setStatusChip(elements.fipeStatus, "Veículo preenchido automaticamente", "success");
  } catch (error) {
    console.error("Erro ao consultar detalhes do veículo na FIPE:", error);

    elements.vehicleInput.value = `${brandName} ${modelName} ${selectedYearName}`.trim();
    state.fipeVehicleData = {
      brand: brandName,
      model: modelName,
      year: selectedYearName || "-",
      fuel: selectedYearLabel.split(" ").slice(1).join(" ") || "-",
      fipeCode: "-",
      referenceMonth: "-",
      vehicleLabel: `${brandName} ${modelName} ${selectedYearName}`.trim()
    };

    renderFipeVehicleDetails(state.fipeVehicleData);
    updateSummaryOutput();
    scheduleDraftSave();
    setStatusChip(elements.fipeStatus, "Veículo preenchido com dados básicos", "warning");
  }
}

function createStatusRow(groupKey, itemName, index) {
  const safeName = `${groupKey}-${index}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .toLowerCase();

  return `
    <div class="status-item">
      <span class="status-item-title">${itemName}</span>

      <div class="status-options">
        <label class="status-option">
          <input type="radio" name="${safeName}" value="Bom">
          <span class="good">Bom</span>
        </label>

        <label class="status-option">
          <input type="radio" name="${safeName}" value="Ruim">
          <span class="bad">Ruim</span>
        </label>

        <label class="status-option">
          <input type="radio" name="${safeName}" value="N/A">
          <span class="na">N/A</span>
        </label>
      </div>
    </div>
  `;
}

function splitGroupIntoCards(group) {
  const chunkSize = group.chunkSize || group.items.length;

  if (group.items.length <= chunkSize) {
    return [{
      ...group,
      displayName: group.name,
      inputKey: group.name
    }];
  }

  const totalParts = Math.ceil(group.items.length / chunkSize);

  return Array.from({ length: totalParts }, (_, index) => {
    const start = index * chunkSize;
    const end = start + chunkSize;

    return {
      ...group,
      displayName: `${group.name} (${index + 1}/${totalParts})`,
      inputKey: `${group.name}-${index + 1}`,
      items: group.items.slice(start, end)
    };
  });
}

function distributeGroupsIntoColumns(groups, columnCount = 2) {
  const columns = Array.from({ length: columnCount }, () => ({
    groups: [],
    weight: 0
  }));

  groups.forEach(group => {
    const targetColumn = columns.reduce((lightest, current) => (
      current.weight < lightest.weight ? current : lightest
    ), columns[0]);

    targetColumn.groups.push(group);
    targetColumn.weight += group.items.length;
  });

  return columns.map(column => column.groups);
}

function renderEvaluationGroup(group) {
  return `
    <div class="evaluation-group">
      <h3>${group.displayName || group.name}</h3>

      <div class="status-list">
        ${group.items.map((item, index) => createStatusRow(group.inputKey || group.name, item, index)).join("")}
      </div>
    </div>
  `;
}

function renderEvaluationSections() {
  elements.evaluationContainer.innerHTML = evaluationData.map(section => `
    <section class="evaluation-section">
      <div class="section-main-title">${section.title}</div>

      <div class="evaluation-wrapper">
        ${distributeGroupsIntoColumns(
          section.groups.flatMap(splitGroupIntoCards)
        ).map(column => `
          <div class="evaluation-column">
            ${column.map(renderEvaluationGroup).join("")}
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderDamageList() {
  elements.damageList.innerHTML = "";

  if (!state.damageEntries.length) {
    elements.damageList.innerHTML = '<div class="note">Nenhuma avaria adicionada.</div>';
    return;
  }

  state.damageEntries.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "damage-item";

    const description = document.createElement("div");
    const title = document.createElement("strong");
    const note = document.createElement("div");

    title.textContent = `${item.location} - ${item.type}`;
    note.textContent = item.note || "Sem observações";

    if (item.source === "map") {
      const sourceBadge = document.createElement("span");
      sourceBadge.className = "damage-source-badge";
      sourceBadge.textContent = "Mapa visual";
      description.prepend(sourceBadge);
    }
    description.append(title, note);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "neutral hidden-print";
    removeButton.dataset.removeIndex = index;
    removeButton.textContent = "Remover";

    card.append(description, removeButton);
    elements.damageList.appendChild(card);
  });
}

function setSelectedDamageType(type) {
  state.selectedDamageType = type;

  elements.damageTypeToolbar?.querySelectorAll("[data-damage-type]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.damageType === type);
  });
}

function renderDamageMap() {
  document.querySelectorAll(".damage-map-hotspot").forEach(hotspot => {
    const mappedEntry = state.damageEntries.find(
      item => item.source === "map" && item.location === hotspot.dataset.location
    );

    if (mappedEntry?.type) {
      hotspot.dataset.type = mappedEntry.type;
    } else {
      delete hotspot.dataset.type;
    }

    hotspot.classList.toggle("is-marked", Boolean(mappedEntry));
    hotspot.setAttribute("role", "button");
    hotspot.setAttribute(
      "aria-label",
      mappedEntry
        ? `${hotspot.dataset.location}: ${mappedEntry.type}`
        : `${hotspot.dataset.location}: sem marcação`
    );
  });
}

function toggleDamageMapHotspot(location) {
  const currentType = state.selectedDamageType || "Amassado";
  const existingIndex = state.damageEntries.findIndex(
    item => item.source === "map" && item.location === location
  );

  if (existingIndex >= 0) {
    const existingItem = state.damageEntries[existingIndex];

    if (existingItem.type === currentType) {
      state.damageEntries.splice(existingIndex, 1);
      showToast("Marcação visual removida.", "info");
    } else {
      state.damageEntries[existingIndex] = {
        ...existingItem,
        type: currentType,
        note: "Marcado no mapa visual"
      };
      showToast("Tipo de avaria atualizado no mapa visual.", "success");
    }
  } else {
    state.damageEntries.push({
      location,
      type: currentType,
      note: "Marcado no mapa visual",
      source: "map"
    });
    showToast("Ponto de avaria marcado no veículo.", "success");
  }

  renderDamageMap();
  renderDamageList();
  updateSummaryOutput();
  scheduleDraftSave();
}

function addDamageEntry() {
  const location = getFieldValue("damageLocation");
  const type = getFieldValue("damageType");
  const note = getFieldValue("damageNote");

  if (!location || !type) {
    showToast("Selecione o local e o tipo da avaria.", "warning");
    return;
  }

  state.damageEntries.push({ location, type, note, source: "manual" });
  renderDamageList();
  renderDamageMap();
  updateSummaryOutput();
  scheduleDraftSave();

  document.getElementById("damageLocation").value = "";
  document.getElementById("damageType").value = "";
  document.getElementById("damageNote").value = "";

  showToast("Avaria adicionada com sucesso.", "success");
}

function removeDamageEntry(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.damageEntries.length) {
    return;
  }

  state.damageEntries.splice(index, 1);
  renderDamageList();
  renderDamageMap();
  updateSummaryOutput();
  scheduleDraftSave();
  showToast("Avaria removida.", "info");
}

function previewPhotos() {
  elements.photoPreview.innerHTML = "";

  Array.from(elements.photoInput.files || []).forEach(file => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const card = document.createElement("div");
    card.className = "preview-card";

    const image = document.createElement("img");
    image.alt = file.name;

    const name = document.createElement("span");
    name.textContent = file.name;

    card.append(image, name);
    elements.photoPreview.appendChild(card);

    const reader = new FileReader();
    reader.onload = event => {
      image.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  });
}

function getMarkedIssues() {
  return Array.from(document.querySelectorAll(".status-item"))
    .map(item => {
      const title = item.querySelector(".status-item-title")?.textContent || "";
      const selected = item.querySelector('input[type="radio"]:checked');

      return selected?.value === "Ruim" ? title : "";
    })
    .filter(Boolean);
}

function formatDateForSummary(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSummaryData() {
  const services = [
    getFieldValue("servico1"),
    getFieldValue("servico2"),
    getFieldValue("servico3"),
    getFieldValue("servico4")
  ].filter(Boolean);

  return {
    storeName: getFieldValue("storeName") || "-",
    date: formatDateForSummary(getFieldValue("date")),
    clientName: getFieldValue("clientName") || "-",
    phone: getFieldValue("phone") || "-",
    plate: getFieldValue("plate") || "-",
    vehicle: getFieldValue("vehicle") || "-",
    km: getFieldValue("km") || "-",
    osNumber: getFieldValue("osNumber") || "-",
    sellerName: getFieldValue("sellerName") || "-",
    technicianName: getFieldValue("technicianName") || "-",
    vehicleEmployee: getRadioValue("Veiculo_Funcionario"),
    warranty: getRadioValue("Garantia_Peca"),
    budgetOnly: getRadioValue("Somente_Orcamento"),
    services,
    badItems: getMarkedIssues(),
    damages: [...state.damageEntries],
    generalNotes: getFieldValue("generalNotes") || "-"
  };
}

function generateSummaryText(summary = getSummaryData()) {
  const lines = [
    `LOJA: ${summary.storeName}`,
    `DATA: ${summary.date}`,
    `CLIENTE: ${summary.clientName} | TEL: ${summary.phone}`,
    `PLACA: ${summary.plate}`,
    `VEÍCULO: ${summary.vehicle} | KM: ${summary.km}`,
    `OS: ${summary.osNumber} | VENDEDOR: ${summary.sellerName} | TÉCNICO: ${summary.technicianName}`,
    "",
    `Veículo de funcionário: ${summary.vehicleEmployee}`,
    `Garantia de peça: ${summary.warranty}`,
    `Somente orçamento: ${summary.budgetOnly}`,
    `SERVIÇOS SOLICITADOS: ${summary.services.length ? summary.services.join(", ") : "-"}`,
    "",
    `ITENS RUINS / REPROVADOS: ${summary.badItems.length ? summary.badItems.join(", ") : "Nenhum."}`,
    "",
    "AVARIAS REGISTRADAS:"
  ];

  if (summary.damages.length) {
    summary.damages.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.location} - ${item.type} - ${item.note || "Sem observações"}`
      );
    });
  } else {
    lines.push("Nenhuma avaria.");
  }

  lines.push("");
  lines.push(`OBSERVAÇÕES GERAIS: ${summary.generalNotes}`);

  return lines.join("\n");
}

function renderSummaryTags(items, emptyLabel) {
  if (!items.length) {
    return `<span class="summary-tag summary-tag--muted">${escapeHtml(emptyLabel)}</span>`;
  }

  return items.map(item => `
    <span class="summary-tag">${escapeHtml(item)}</span>
  `).join("");
}

function renderSummaryList(items, emptyLabel) {
  if (!items.length) {
    return `<li class="summary-list__empty">${escapeHtml(emptyLabel)}</li>`;
  }

  return items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderDamageListMarkup(damages, emptyLabel) {
  if (!damages.length) {
    return `<li class="summary-list__empty">${escapeHtml(emptyLabel)}</li>`;
  }

  return damages.map(item => `
    <li>${escapeHtml(`${item.location} - ${item.type} - ${item.note || "Sem observações"}`)}</li>
  `).join("");
}

function getPrintFriendlyItems(items, limit, label) {
  if (items.length <= limit) {
    return items;
  }

  return [
    ...items.slice(0, limit),
    `+${items.length - limit} ${label} adicionais`
  ];
}

function generateSummaryMarkup(summary) {
  return `
    <div class="summary-card">
      <div class="summary-card__hero">
        <div>
          <span class="summary-card__eyebrow">Resumo Profissional</span>
          <h3>Checklist pronto para envio e aprovação</h3>
          <p>Visão clara do atendimento, condições do veículo e pontos críticos encontrados.</p>
        </div>
        <div class="summary-status-grid">
          <div class="summary-status">
            <span>Data</span>
            <strong>${escapeHtml(summary.date)}</strong>
          </div>
          <div class="summary-status">
            <span>OS</span>
            <strong>${escapeHtml(summary.osNumber)}</strong>
          </div>
        </div>
      </div>

      <div class="summary-metrics">
        <div class="summary-metric"><span>Cliente</span><strong>${escapeHtml(summary.clientName)}</strong></div>
        <div class="summary-metric"><span>Veículo</span><strong>${escapeHtml(summary.vehicle)}</strong></div>
        <div class="summary-metric"><span>Placa</span><strong>${escapeHtml(summary.plate)}</strong></div>
        <div class="summary-metric"><span>KM</span><strong>${escapeHtml(summary.km)}</strong></div>
      </div>

      <div class="summary-flag-row">
        <span class="summary-flag"><strong>Funcionário:</strong> ${escapeHtml(summary.vehicleEmployee)}</span>
        <span class="summary-flag"><strong>Garantia:</strong> ${escapeHtml(summary.warranty)}</span>
        <span class="summary-flag"><strong>Orçamento:</strong> ${escapeHtml(summary.budgetOnly)}</span>
      </div>

      <div class="summary-section">
        <span class="summary-section__title">Serviços Solicitados</span>
        <div class="summary-tag-list">
          ${renderSummaryTags(summary.services, "Nenhum serviço informado")}
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-section">
          <span class="summary-section__title">Itens Reprovados</span>
          <ul class="summary-list">
            ${renderSummaryList(summary.badItems, "Nenhum item reprovado")}
          </ul>
        </div>

        <div class="summary-section">
          <span class="summary-section__title">Avarias Registradas</span>
          <ul class="summary-list">
            ${renderDamageListMarkup(summary.damages, "Nenhuma avaria registrada")}
          </ul>
        </div>
      </div>

      <div class="summary-grid summary-grid--footer">
        <div class="summary-section">
          <span class="summary-section__title">Observações Gerais</span>
          <p class="summary-note">${escapeHtml(summary.generalNotes)}</p>
        </div>

        <div class="summary-section">
          <span class="summary-section__title">Equipe Responsável</span>
          <div class="summary-team">
            <div><span>Vendedor</span><strong>${escapeHtml(summary.sellerName)}</strong></div>
            <div><span>Técnico</span><strong>${escapeHtml(summary.technicianName)}</strong></div>
            <div><span>Contato</span><strong>${escapeHtml(summary.phone)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generatePrintSheetMarkup(summary) {
  const printBadItems = getPrintFriendlyItems(summary.badItems, 8, "itens");
  const printDamages = getPrintFriendlyItems(
    summary.damages.map(item => `${item.location} - ${item.type}`),
    5,
    "avarias"
  );

  return `
    <div class="print-block-grid">
      <div class="print-block">
        <span class="print-block__title">Dados do Atendimento</span>
        <div class="print-metric-grid">
          <div><span>Cliente</span><strong>${escapeHtml(summary.clientName)}</strong></div>
          <div><span>Data</span><strong>${escapeHtml(summary.date)}</strong></div>
          <div><span>Veículo</span><strong>${escapeHtml(summary.vehicle)}</strong></div>
          <div><span>Placa</span><strong>${escapeHtml(summary.plate)}</strong></div>
          <div><span>KM</span><strong>${escapeHtml(summary.km)}</strong></div>
          <div><span>OS</span><strong>${escapeHtml(summary.osNumber)}</strong></div>
        </div>
      </div>

      <div class="print-block">
        <span class="print-block__title">Contexto Comercial</span>
        <div class="print-inline-flags">
          <span>Funcionário: <strong>${escapeHtml(summary.vehicleEmployee)}</strong></span>
          <span>Garantia: <strong>${escapeHtml(summary.warranty)}</strong></span>
          <span>Orçamento: <strong>${escapeHtml(summary.budgetOnly)}</strong></span>
        </div>
        <div class="print-section-list">
          <span class="print-mini-title">Serviços Solicitados</span>
          <p>${escapeHtml(summary.services.length ? summary.services.join(", ") : "-")}</p>
        </div>
      </div>
    </div>

    <div class="print-block-grid">
      <div class="print-block">
        <span class="print-block__title">Itens Reprovados</span>
        <ul class="print-list">
          ${renderSummaryList(printBadItems, "Nenhum item reprovado")}
        </ul>
      </div>

      <div class="print-block">
        <span class="print-block__title">Avarias</span>
        <ul class="print-list">
          ${renderSummaryList(printDamages, "Nenhuma avaria registrada")}
        </ul>
      </div>
    </div>

    <div class="print-block-grid print-block-grid--single">
      <div class="print-block">
        <span class="print-block__title">Observações Gerais</span>
        <p class="print-note">${escapeHtml(summary.generalNotes)}</p>
      </div>
    </div>
  `;
}

function updateSummaryOutput() {
  const summary = getSummaryData();

  elements.summaryOutput.innerHTML = generateSummaryMarkup(summary);

  if (elements.printSheetMeta) {
    elements.printSheetMeta.textContent =
      `${summary.clientName} · ${summary.vehicle} · ${summary.plate}`;
  }

  if (elements.printSheetContent) {
    elements.printSheetContent.innerHTML = generatePrintSheetMarkup(summary);
  }
}

function scrollToSummary() {
  elements.summaryOutput.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function collectCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector)).reduce((accumulator, input) => {
    accumulator[input.name] = input.value;
    return accumulator;
  }, {});
}

function saveDraft() {
  setStatusChip(elements.draftStatus, "Checklist pronto", "success");
}

function scheduleDraftSave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(saveDraft, 100);
}

function restoreCheckedValues(values) {
  Object.entries(values || {}).forEach(([name, value]) => {
    const field = document.querySelector(`input[name="${name}"][value="${value}"]`);

    if (field) {
      field.checked = true;
    }
  });
}

async function restoreDraft() {
  setStatusChip(elements.draftStatus, "Checklist pronto", "success");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugifyText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function generateSummaryFilename(extension = "txt") {
  const plate = slugifyText(getFieldValue("plate") || "sem-placa");
  const client = slugifyText(getFieldValue("clientName") || "cliente");
  const date = getFieldValue("date") || "sem-data";

  return `checklist-${plate}-${client}-${date}.${extension}`;
}

function downloadTextFile(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadBlobFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

function ensurePdfSpace(doc, cursorY, minHeight) {
  if (cursorY + minHeight <= 280) {
    return cursorY;
  }

  doc.addPage();
  return 16;
}

function writePdfWrappedText(doc, text, x, y, maxWidth) {
  const lines = doc.splitTextToSize(String(text || "-"), maxWidth);
  doc.text(lines, x, y);

  return y + (lines.length * 5.2);
}

function addPdfSection(doc, title, rows, startY) {
  let cursorY = ensurePdfSpace(doc, startY, 24);

  doc.setFillColor(11, 78, 162);
  doc.roundedRect(15, cursorY, 180, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 19, cursorY + 5.4);

  doc.setTextColor(22, 32, 49);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);

  cursorY += 14;

  rows.forEach(row => {
    cursorY = ensurePdfSpace(doc, cursorY, 10);
    cursorY = writePdfWrappedText(doc, row, 19, cursorY, 172) + 1.2;
  });

  return cursorY + 4;
}

function addPdfSignatures(doc, startY) {
  let cursorY = ensurePdfSpace(doc, startY, 26);

  cursorY += 8;
  doc.setDrawColor(80, 96, 122);
  doc.line(18, cursorY, 68, cursorY);
  doc.line(80, cursorY, 130, cursorY);
  doc.line(142, cursorY, 192, cursorY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(44, 57, 80);
  doc.text("Assinatura do Cliente", 43, cursorY + 6, { align: "center" });
  doc.text("Vendedor", 105, cursorY + 6, { align: "center" });
  doc.text("Técnico", 167, cursorY + 6, { align: "center" });
}

async function buildChecklistPdfBlob() {
  const { jsPDF } = window.jspdf || {};

  if (!jsPDF) {
    throw new Error("Biblioteca de PDF indisponível.");
  }

  const summary = getSummaryData();
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  doc.setFillColor(7, 45, 98);
  doc.roundedRect(15, 14, 180, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Checklist DF Pneus Michelin", 20, 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Resumo executivo para atendimento, aprovacao e impressao.", 20, 29);

  let cursorY = 42;

  cursorY = addPdfSection(doc, "Dados do Atendimento", [
    `Loja: ${summary.storeName}`,
    `Data: ${summary.date}`,
    `Cliente: ${summary.clientName} | Telefone: ${summary.phone}`,
    `Veiculo: ${summary.vehicle}`,
    `Placa: ${summary.plate} | KM: ${summary.km} | OS: ${summary.osNumber}`,
    `Vendedor: ${summary.sellerName} | Tecnico: ${summary.technicianName}`
  ], cursorY);

  cursorY = addPdfSection(doc, "Contexto Comercial", [
    `Veiculo de funcionario: ${summary.vehicleEmployee}`,
    `Garantia de peca: ${summary.warranty}`,
    `Somente orcamento: ${summary.budgetOnly}`,
    `Servicos solicitados: ${summary.services.length ? summary.services.join(", ") : "-"}`
  ], cursorY);

  cursorY = addPdfSection(doc, "Itens Reprovados", (
    summary.badItems.length ? summary.badItems : ["Nenhum item reprovado."]
  ).map((item, index) => `${index + 1}. ${item}`), cursorY);

  cursorY = addPdfSection(doc, "Avarias Registradas", (
    summary.damages.length
      ? summary.damages.map((item, index) => `${index + 1}. ${item.location} - ${item.type} - ${item.note || "Sem observacoes"}`)
      : ["Nenhuma avaria registrada."]
  ), cursorY);

  cursorY = addPdfSection(doc, "Observacoes Gerais", [
    summary.generalNotes || "-"
  ], cursorY);

  addPdfSignatures(doc, cursorY + 2);

  return doc.output("blob");
}

async function buildChecklistPdfFile() {
  const pdfBlob = await buildChecklistPdfBlob();

  return new File(
    [pdfBlob],
    generateSummaryFilename("pdf"),
    { type: "application/pdf" }
  );
}

async function sendChecklistEmailViaApi({
  toEmail,
  subject,
  bodyText,
  pdfFile
}) {
  const pdfBase64 = await blobToBase64(pdfFile);
  const response = await fetch("/api/send-checklist-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      toEmail,
      subject,
      bodyText,
      pdfFilename: pdfFile.name,
      pdfBase64
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Falha ao enviar e-mail pela API.");
  }

  return result;
}

async function copyTextToClipboard(text) {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Falha ao copiar texto:", error);
    return false;
  }
}

function generateEmailBody() {
  const summary = getSummaryData();

  return [
    "Checklist DF Pneus Michelin",
    "==========================",
    "",
    generateSummaryText(summary),
    "",
    "Observação: o PDF do checklist é baixado no computador para ser anexado manualmente no e-mail.",
    "Fotos e anexos também precisam ser incluídos manualmente."
  ].join("\n");
}

async function sendEmail() {
  updateSummaryOutput();

  const email = getFieldValue("storeEmail") || "dfpneus2@hotmail.com";

  if (!isValidEmail(email)) {
    showToast("Informe um e-mail de destino válido antes de enviar.", "warning");
    return;
  }

  const subjectText =
    `Checklist - ${getFieldValue("plate") || "sem-placa"} - ${getFieldValue("clientName") || "cliente"}`;

  const bodyText = generateEmailBody();
  let pdfFile = null;

  try {
    pdfFile = await buildChecklistPdfFile();
  } catch (error) {
    console.error("Falha ao gerar PDF para envio:", error);
  }

  if (pdfFile) {
    try {
      await sendChecklistEmailViaApi({
        toEmail: email,
        subject: subjectText,
        bodyText,
        pdfFile
      });

      showToast("E-mail enviado com PDF anexado pela Vercel.", "success");
      return;
    } catch (error) {
      console.warn("Envio serverless indisponível, usando fallback local:", error);
    }
  }

  const copied = await copyTextToClipboard(bodyText);
  const subject = encodeURIComponent(subjectText);
  const encodedBody = encodeURIComponent(bodyText);

  if (pdfFile) {
    downloadBlobFile(pdfFile.name, pdfFile);
  }

  window.location.assign(`mailto:${email}?subject=${subject}&body=${encodedBody}`);

  if (pdfFile) {
    showToast("API indisponível aqui. O e-mail abriu e o PDF foi baixado para anexo manual.", "warning");
    return;
  }

  if (copied) {
    showToast("E-mail aberto e resumo copiado. O PDF nao conseguiu ser gerado nesta sessao.", "warning");
    return;
  }

  showToast("E-mail aberto. Gere o PDF manualmente pelo botao de impressao se necessario.", "warning");
}

function getWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

async function shareChecklist() {
  updateSummaryOutput();

  const text = generateSummaryText();
  let pdfFile = null;

  try {
    pdfFile = await buildChecklistPdfFile();
  } catch (error) {
    console.error("Falha ao gerar PDF para compartilhamento:", error);
  }

  if (navigator.share) {
    try {
      const payload = {
        title: "Checklist DF Pneus Michelin",
        text
      };

      if (pdfFile && navigator.canShare?.({ files: [pdfFile] })) {
        payload.files = [pdfFile];
      }

      await navigator.share(payload);
      showToast("Checklist compartilhado.", "success");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.warn("Compartilhamento indisponível:", error);
    }
  }

  try {
    await navigator.clipboard.writeText(text);

    if (pdfFile) {
      downloadBlobFile(pdfFile.name, pdfFile);
    }

    window.open(getWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
    showToast(
      pdfFile
        ? "WhatsApp aberto e PDF baixado para anexo."
        : "WhatsApp aberto com o resumo copiado.",
      "success"
    );
  } catch (error) {
    if (pdfFile) {
      downloadBlobFile(pdfFile.name, pdfFile);
    }

    window.open(getWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
    window.prompt("Copie o resumo abaixo:", text);
  }
}

function setDefaultDate() {
  const dateField = document.getElementById("date");

  if (!dateField.value) {
    dateField.valueAsDate = new Date();
  }
}

function bindFormatters() {
  const phoneIds = ["phone", "storePhone"];

  phoneIds.forEach(id => {
    const field = document.getElementById(id);

    field?.addEventListener("input", () => {
      field.value = formatPhone(field.value);
    });
  });

  document.getElementById("plate")?.addEventListener("input", event => {
    event.target.value = formatPlate(event.target.value);
  });

  document.getElementById("km")?.addEventListener("input", event => {
    event.target.value = formatKm(event.target.value);
  });
}

function bindEvents() {
  elements.generateSummaryBtn.addEventListener("click", () => {
    updateSummaryOutput();
    scrollToSummary();
    showToast("Resumo atualizado.", "info");
  });

  elements.sendEmailBtn.addEventListener("click", () => {
    void sendEmail();
  });
  elements.shareChecklistBtn.addEventListener("click", shareChecklist);
  elements.printChecklistBtn.addEventListener("click", () => {
    updateSummaryOutput();
    window.print();
  });
  elements.addDamageBtn.addEventListener("click", addDamageEntry);
  elements.damageTypeToolbar?.addEventListener("click", event => {
    const button = event.target.closest("[data-damage-type]");

    if (!button) {
      return;
    }

    setSelectedDamageType(button.dataset.damageType);
  });

  elements.brandSelect.addEventListener("change", async event => {
    const brandId = event.target.value;

    await loadFipeModels(brandId);
    setSelectOptions(elements.yearSelect, "Aguardando modelo...", [], () => "");
    updateSummaryOutput();
    scheduleDraftSave();
  });

  elements.modelSelect.addEventListener("change", async event => {
    await loadFipeYears(elements.brandSelect.value, event.target.value);
    updateSummaryOutput();
    scheduleDraftSave();
  });

  elements.yearSelect.addEventListener("change", () => {
    void syncVehicleFromFipe();
  });

  elements.damageList.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-index]");

    if (!button) {
      return;
    }

    removeDamageEntry(Number(button.dataset.removeIndex));
  });

  document.querySelector(".damage-map-canvas")?.addEventListener("click", event => {
    const hotspot = event.target.closest(".damage-map-hotspot");

    if (!hotspot) {
      return;
    }

    toggleDamageMapHotspot(hotspot.dataset.location);
  });

  document.querySelector(".damage-map-canvas")?.addEventListener("keydown", event => {
    const hotspot = event.target.closest(".damage-map-hotspot");

    if (!hotspot || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    toggleDamageMapHotspot(hotspot.dataset.location);
  });

  elements.photoInput.addEventListener("change", () => {
    previewPhotos();
    scheduleDraftSave();
  });

  document.addEventListener("input", event => {
    if (!event.target.matches("input, select, textarea")) {
      return;
    }

    updateSummaryOutput();
    scheduleDraftSave();
  });

  document.addEventListener("change", event => {
    if (!event.target.matches("input, select, textarea")) {
      return;
    }

    updateSummaryOutput();
    scheduleDraftSave();
  });

  window.addEventListener("beforeprint", updateSummaryOutput);
}

async function init() {
  renderEvaluationSections();
  renderDamageList();
  renderDamageMap();
  renderFipeVehicleDetails();
  setDefaultDate();
  bindFormatters();
  bindEvents();
  setSelectedDamageType(state.selectedDamageType);
  await loadFipeBrands();
  await restoreDraft();
  updateSummaryOutput();
}

void init();

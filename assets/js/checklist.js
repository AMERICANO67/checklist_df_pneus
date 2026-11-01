const STORAGE_KEY = "df-pneus-checklist-draft-v2";
const CATALOGS_STORAGE_KEY = "df-pneus-checklist-catalogs-v1";
const FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros";
const BANNER_IMAGE_URL = "assets/images/BANNER.jpg?v=1";
const MAX_DAMAGE_PHOTOS = 10;
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
        name: "Família: Pneus",
        items: [
          "Pneu Dianteiro",
          "Pneu Traseiro",
          "Conserto",
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
          "Filtro Cabine (Ar Condicionado)",
          "Arrefecimento"
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
          "Coifa (Câmbio / Motor)",
          "Caixas de Direção",
          "Rodas (Travas/Empenadas)"
        ]
      },
      {
        name: "Família: Freio",
        items: [
          "Pastilhas Dianteiras",
          "Discos de Freio",
          "Tambor de Freio",
          "Cilindro (Roda) / Mestre",
          "Lonas / Sapatas Freio Traseiro",
          "Revisão / Cabo Freio Mão",
          "Fluído de Freio"
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
        name: "Família: Elétrica",
        items: [
          "Bateria",
          "Lâmpadas"
        ]
      },
      {
        name: "Motor / Transmissão",
        items: [
          "Embreagem",
          "Kit Correia Dentada / Poly V",
          "Velas",
          "Revisão"
        ]
      },
      {
        name: "Escapamento",
        extraRows: 1,
        items: [
          "Sil. Traseiro",
          "Catalisador / Tubo",
          "Cano"
        ]
      }
    ]
  }
];

const state = {
  damageEntries: [],
  photoFiles: [],
  fipeVehicleData: null,
  catalogs: {
    stores: [],
    sellers: [],
    technicians: [],
    selectedStoreId: "",
    selectedSellerId: "",
    selectedTechnicianId: ""
  },
  saveTimer: null,
  toastTimer: null,
  catalogsVisible: true,
  summaryVisible: true,
  bannerPdfDataUrl: null
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
  summaryOutput: document.getElementById("summaryOutput"),
  catalogsContent: document.getElementById("catalogsContent"),
  printSheetMeta: document.getElementById("printSheetMeta"),
  printSheetContent: document.getElementById("printSheetContent"),
  evaluationContainer: document.getElementById("evaluationSections"),
  draftStatus: document.getElementById("draftStatus"),
  fipeStatus: document.getElementById("fipeStatus"),
  storeNumber: document.getElementById("storeNumber"),
  storeCatalogSelect: document.getElementById("storeCatalogSelect"),
  sellerCatalogSelect: document.getElementById("sellerCatalogSelect"),
  technicianCatalogSelect: document.getElementById("technicianCatalogSelect"),
  sellerCatalogName: document.getElementById("sellerCatalogName"),
  technicianCatalogName: document.getElementById("technicianCatalogName"),
  applyStoreBtn: document.getElementById("applyStoreBtn"),
  saveStoreBtn: document.getElementById("saveStoreBtn"),
  newStoreBtn: document.getElementById("newStoreBtn"),
  deleteStoreBtn: document.getElementById("deleteStoreBtn"),
  applySellerBtn: document.getElementById("applySellerBtn"),
  saveSellerBtn: document.getElementById("saveSellerBtn"),
  newSellerBtn: document.getElementById("newSellerBtn"),
  deleteSellerBtn: document.getElementById("deleteSellerBtn"),
  applyTechnicianBtn: document.getElementById("applyTechnicianBtn"),
  saveTechnicianBtn: document.getElementById("saveTechnicianBtn"),
  newTechnicianBtn: document.getElementById("newTechnicianBtn"),
  deleteTechnicianBtn: document.getElementById("deleteTechnicianBtn"),
  toast: document.getElementById("appToast"),
  addDamageBtn: document.getElementById("addDamage"),
  generateSummaryBtn: document.getElementById("generateSummaryBtn"),
  toggleCatalogsBtn: document.getElementById("toggleCatalogsBtn"),
  toggleSummaryBtn: document.getElementById("toggleSummaryBtn"),
  sendEmailBtn: document.getElementById("sendEmailBtn"),
  shareChecklistBtn: document.getElementById("shareChecklistBtn"),
  printChecklistBtn: document.getElementById("printChecklistBtn")
};

function makeSafeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .toLowerCase();
}

function setVehicleIdentityFields({
  brand = "",
  model = "",
  year = ""
} = {}) {
  const brandField = document.getElementById("brandDisplay");
  const modelField = document.getElementById("modelDisplay");
  const yearField = document.getElementById("yearDisplay");

  if (brandField) {
    brandField.value = brand;
  }

  if (modelField) {
    modelField.value = model;
  }

  if (yearField) {
    yearField.value = year;
  }
}

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

function createCatalogId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCatalogDefaults() {
  const storeNumber = getFieldValue("storeNumber") || "01";
  const storeName = getFieldValue("storeName") || "Loja 01";
  const storeEmail = getFieldValue("storeEmail") || "";
  const storePhone = getFieldValue("storePhone") || "";
  const defaultStore = {
    id: createCatalogId("store"),
    number: storeNumber,
    name: storeName,
    email: storeEmail,
    phone: storePhone
  };

  return {
    stores: [defaultStore],
    sellers: [],
    technicians: [],
    selectedStoreId: defaultStore.id,
    selectedSellerId: "",
    selectedTechnicianId: ""
  };
}

function sanitizeCatalogState(rawState = {}) {
  const defaults = getCatalogDefaults();
  const stores = Array.isArray(rawState.stores) && rawState.stores.length
    ? rawState.stores.map(item => ({
      id: String(item.id || createCatalogId("store")),
      number: String(item.number || "").trim(),
      name: String(item.name || "").trim(),
      email: String(item.email || "").trim(),
      phone: String(item.phone || "").trim()
    })).filter(item => item.name)
    : defaults.stores;

  const sellers = Array.isArray(rawState.sellers)
    ? rawState.sellers.map(item => ({
      id: String(item.id || createCatalogId("seller")),
      name: String(item.name || "").trim()
    })).filter(item => item.name)
    : [];

  const technicians = Array.isArray(rawState.technicians)
    ? rawState.technicians.map(item => ({
      id: String(item.id || createCatalogId("technician")),
      name: String(item.name || "").trim()
    })).filter(item => item.name)
    : [];

  const selectedStoreId = stores.some(item => item.id === rawState.selectedStoreId)
    ? rawState.selectedStoreId
    : stores[0]?.id || "";
  const selectedSellerId = sellers.some(item => item.id === rawState.selectedSellerId)
    ? rawState.selectedSellerId
    : "";
  const selectedTechnicianId = technicians.some(item => item.id === rawState.selectedTechnicianId)
    ? rawState.selectedTechnicianId
    : "";

  return {
    stores,
    sellers,
    technicians,
    selectedStoreId,
    selectedSellerId,
    selectedTechnicianId
  };
}

function loadCatalogState() {
  try {
    const stored = window.localStorage.getItem(CATALOGS_STORAGE_KEY);
    state.catalogs = sanitizeCatalogState(stored ? JSON.parse(stored) : {});
  } catch (error) {
    console.warn("Falha ao carregar cadastros locais:", error);
    state.catalogs = getCatalogDefaults();
  }
}

function persistCatalogState() {
  try {
    window.localStorage.setItem(CATALOGS_STORAGE_KEY, JSON.stringify(state.catalogs));
  } catch (error) {
    console.warn("Falha ao salvar cadastros locais:", error);
  }
}

function formatStoreLabel(store) {
  const number = String(store?.number || "").trim();
  const name = String(store?.name || "").trim();

  if (number && name) {
    return `Loja ${number} - ${name}`;
  }

  return name || number || "Loja sem identificação";
}

function populateProfileSelect(select, placeholder, items, selectedId) {
  if (!select) {
    return;
  }

  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.number !== undefined ? formatStoreLabel(item) : item.name;
    select.appendChild(option);
  });

  select.value = items.some(item => item.id === selectedId) ? selectedId : "";
}

function populateFormSelect(select, placeholder, items, selectedValue = "") {
  if (!select) {
    return;
  }

  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
    select.appendChild(option);
  });

  select.value = items.some(item => item.name === selectedValue) ? selectedValue : "";
}

function renderAssignedPeopleSelects() {
  populateFormSelect(
    document.getElementById("sellerName"),
    "Selecione",
    state.catalogs.sellers,
    getFieldValue("sellerName")
  );
  populateFormSelect(
    document.getElementById("technicianName"),
    "Selecione",
    state.catalogs.technicians,
    getFieldValue("technicianName")
  );
}

function syncCatalogEditorFields() {
  const seller = state.catalogs.sellers.find(item => item.id === state.catalogs.selectedSellerId);
  const technician = state.catalogs.technicians.find(
    item => item.id === state.catalogs.selectedTechnicianId
  );

  if (elements.sellerCatalogName) {
    elements.sellerCatalogName.value = seller?.name || "";
  }

  if (elements.technicianCatalogName) {
    elements.technicianCatalogName.value = technician?.name || "";
  }
}

function renderCatalogSelectors() {
  populateProfileSelect(
    elements.storeCatalogSelect,
    "Nova loja",
    state.catalogs.stores,
    state.catalogs.selectedStoreId
  );
  populateProfileSelect(
    elements.sellerCatalogSelect,
    "Novo vendedor",
    state.catalogs.sellers,
    state.catalogs.selectedSellerId
  );
  populateProfileSelect(
    elements.technicianCatalogSelect,
    "Novo mecânico",
    state.catalogs.technicians,
    state.catalogs.selectedTechnicianId
  );
  syncCatalogEditorFields();
  renderAssignedPeopleSelects();
}

function applyStoreById(storeId, options = {}) {
  const { silent = false } = options;
  const store = state.catalogs.stores.find(item => item.id === storeId);

  if (!store) {
    if (!silent) {
      showToast("Selecione uma loja cadastrada para aplicar.", "warning");
    }
    return;
  }

  state.catalogs.selectedStoreId = store.id;
  document.getElementById("storeNumber").value = store.number || "";
  document.getElementById("storeName").value = store.name;
  document.getElementById("storeEmail").value = store.email;
  document.getElementById("storePhone").value = store.phone;
  persistCatalogState();
  renderCatalogSelectors();
  updateSummaryOutput();

  if (!silent) {
    showToast("Loja aplicada no checklist.", "success");
  }
}

function clearStoreFields() {
  document.getElementById("storeNumber").value = "";
  document.getElementById("storeName").value = "";
  document.getElementById("storeEmail").value = "";
  document.getElementById("storePhone").value = "";
  updateSummaryOutput();
}

function saveCurrentStore() {
  state.catalogs.selectedStoreId = elements.storeCatalogSelect?.value || state.catalogs.selectedStoreId;
  const number = getFieldValue("storeNumber").trim();
  const name = getFieldValue("storeName").trim();
  const email = getFieldValue("storeEmail").trim();
  const phone = getFieldValue("storePhone").trim();

  if (!number) {
    showToast("Informe o número da loja antes de salvar.", "warning");
    return;
  }

  if (!name) {
    showToast("Informe o nome da loja antes de salvar.", "warning");
    return;
  }

  if (email && !isValidEmail(email)) {
    showToast("Informe um e-mail válido para a loja.", "warning");
    return;
  }

  const selectedId = state.catalogs.selectedStoreId;
  const existingIndex = state.catalogs.stores.findIndex(item => item.id === selectedId);
  const storeRecord = {
    id: existingIndex >= 0 ? state.catalogs.stores[existingIndex].id : createCatalogId("store"),
    number,
    name,
    email,
    phone
  };

  if (existingIndex >= 0) {
    state.catalogs.stores[existingIndex] = storeRecord;
  } else {
    state.catalogs.stores.push(storeRecord);
  }

  state.catalogs.selectedStoreId = storeRecord.id;
  persistCatalogState();
  renderCatalogSelectors();
  updateSummaryOutput();
  showToast("Loja salva no cadastro local.", "success");
}

function prepareNewStore() {
  state.catalogs.selectedStoreId = "";
  renderCatalogSelectors();
  clearStoreFields();
  showToast("Preencha os dados da nova loja.", "info");
}

function deleteCurrentStore() {
  if (!state.catalogs.selectedStoreId) {
    showToast("Selecione uma loja cadastrada para excluir.", "warning");
    return;
  }

  state.catalogs.stores = state.catalogs.stores.filter(
    item => item.id !== state.catalogs.selectedStoreId
  );

  if (!state.catalogs.stores.length) {
    clearStoreFields();
    const defaults = getCatalogDefaults();
    state.catalogs.stores = defaults.stores;
    state.catalogs.selectedStoreId = defaults.selectedStoreId;
  } else {
    state.catalogs.selectedStoreId = state.catalogs.stores[0].id;
  }

  persistCatalogState();
  renderCatalogSelectors();
  applyStoreById(state.catalogs.selectedStoreId, { silent: true });
  showToast("Loja excluída do cadastro local.", "info");
}

function applyNamedProfile(type) {
  const isSeller = type === "seller";
  const collection = isSeller ? state.catalogs.sellers : state.catalogs.technicians;
  const selectedId = isSeller
    ? state.catalogs.selectedSellerId
    : state.catalogs.selectedTechnicianId;
  const fieldId = isSeller ? "sellerName" : "technicianName";
  const label = isSeller ? "vendedor" : "mecânico";
  const profile = collection.find(item => item.id === selectedId);

  if (!profile) {
    showToast(`Selecione um ${label} cadastrado para aplicar.`, "warning");
    return;
  }

  document.getElementById(fieldId).value = profile.name;
  persistCatalogState();
  updateSummaryOutput();
  showToast(`${isSeller ? "Vendedor" : "Mecânico"} aplicado no checklist.`, "success");
}

function saveNamedProfile(type) {
  const isSeller = type === "seller";
  const fieldId = isSeller ? "sellerName" : "technicianName";
  const selectedKey = isSeller ? "selectedSellerId" : "selectedTechnicianId";
  const collectionKey = isSeller ? "sellers" : "technicians";
  const prefix = isSeller ? "seller" : "technician";
  const label = isSeller ? "vendedor" : "mecânico";
  const selectedValue = isSeller
    ? elements.sellerCatalogSelect?.value
    : elements.technicianCatalogSelect?.value;
  const editorField = isSeller ? elements.sellerCatalogName : elements.technicianCatalogName;
  const name = editorField?.value.trim() || "";

  state.catalogs[selectedKey] = selectedValue || state.catalogs[selectedKey];

  if (!name) {
    showToast(`Informe o nome do ${label} antes de salvar.`, "warning");
    return;
  }

  const selectedId = state.catalogs[selectedKey];
  const existingIndex = state.catalogs[collectionKey].findIndex(item => item.id === selectedId);
  const record = {
    id: existingIndex >= 0 ? state.catalogs[collectionKey][existingIndex].id : createCatalogId(prefix),
    name
  };

  if (existingIndex >= 0) {
    state.catalogs[collectionKey][existingIndex] = record;
  } else {
    state.catalogs[collectionKey].push(record);
  }

  state.catalogs[selectedKey] = record.id;
  persistCatalogState();
  renderCatalogSelectors();
  document.getElementById(fieldId).value = record.name;
  updateSummaryOutput();
  showToast(`${isSeller ? "Vendedor" : "Mecânico"} salvo no cadastro local.`, "success");
}

function prepareNewNamedProfile(type) {
  const isSeller = type === "seller";
  const selectedKey = isSeller ? "selectedSellerId" : "selectedTechnicianId";
  const editorField = isSeller ? elements.sellerCatalogName : elements.technicianCatalogName;

  state.catalogs[selectedKey] = "";
  renderCatalogSelectors();
  if (editorField) {
    editorField.value = "";
  }
  updateSummaryOutput();
  showToast(`Digite o nome do novo ${isSeller ? "vendedor" : "mecânico"}.`, "info");
}

function deleteNamedProfile(type) {
  const isSeller = type === "seller";
  const selectedKey = isSeller ? "selectedSellerId" : "selectedTechnicianId";
  const collectionKey = isSeller ? "sellers" : "technicians";
  const fieldId = isSeller ? "sellerName" : "technicianName";
  const editorField = isSeller ? elements.sellerCatalogName : elements.technicianCatalogName;
  const label = isSeller ? "vendedor" : "mecânico";

  if (!state.catalogs[selectedKey]) {
    showToast(`Selecione um ${label} cadastrado para excluir.`, "warning");
    return;
  }

  state.catalogs[collectionKey] = state.catalogs[collectionKey].filter(
    item => item.id !== state.catalogs[selectedKey]
  );
  state.catalogs[selectedKey] = "";
  document.getElementById(fieldId).value = "";
  if (editorField) {
    editorField.value = "";
  }
  persistCatalogState();
  renderCatalogSelectors();
  updateSummaryOutput();
  showToast(`${isSeller ? "Vendedor" : "Mecânico"} excluído do cadastro local.`, "info");
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
    setVehicleIdentityFields();
    elements.fipeVehicleDetails.innerHTML = `
      <div class="fipe-result-empty">
        Selecione marca, modelo e ano para preencher o veículo automaticamente.
      </div>
    `;
    return;
  }

  const detailItems = [
    { key: "brand", label: "Marca", value: vehicleData.brand },
    { key: "model", label: "Modelo", value: vehicleData.model },
    { key: "year", label: "Ano", value: vehicleData.year },
    { key: "fuel", label: "Combustível", value: vehicleData.fuel }
  ];

  elements.fipeVehicleDetails.innerHTML = `
    <div class="fipe-result-grid">
      ${detailItems.map(item => `
        <div class="fipe-result-card fipe-result-card--${item.key}">
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
  setVehicleIdentityFields({
    brand: getSelectedText(elements.brandSelect),
    model: "",
    year: ""
  });
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
  setVehicleIdentityFields({
    brand: getSelectedText(elements.brandSelect),
    model: getSelectedText(elements.modelSelect),
    year: ""
  });
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

    setVehicleIdentityFields({
      brand: state.fipeVehicleData.brand,
      model: state.fipeVehicleData.model,
      year: state.fipeVehicleData.year
    });
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

    setVehicleIdentityFields({
      brand: state.fipeVehicleData.brand,
      model: state.fipeVehicleData.model,
      year: state.fipeVehicleData.year
    });
    renderFipeVehicleDetails(state.fipeVehicleData);
    updateSummaryOutput();
    scheduleDraftSave();
    setStatusChip(elements.fipeStatus, "Veículo preenchido com dados básicos", "warning");
  }
}

function createStatusRow(groupKey, itemName, index) {
  const safeGroupKey = makeSafeKey(groupKey);
  const safeName = `${safeGroupKey}-${index}`;

  return `
    <div class="family-table__row status-item">
      <span class="family-table__item status-item-title">${itemName}</span>

      <label class="family-table__choice status-option">
        <input type="radio" name="${safeName}" value="SIM" data-family-key="${safeGroupKey}">
        <span class="yes">Sim</span>
      </label>

      <label class="family-table__choice status-option">
        <input type="radio" name="${safeName}" value="NÃO" data-family-key="${safeGroupKey}">
        <span class="no">Não</span>
      </label>
    </div>
  `;
}

function createEmptyStatusRow() {
  return `
    <div class="family-table__row family-table__row--empty" aria-hidden="true">
      <span class="family-table__item">&nbsp;</span>
      <span class="family-table__choice">&nbsp;</span>
      <span class="family-table__choice">&nbsp;</span>
    </div>
  `;
}

function renderFamilyTable(group) {
  const extraRows = Number(group.extraRows || 0);
  const familyKey = makeSafeKey(group.name);

  return `
    <div class="family-table evaluation-group">
      <div class="family-table__head">
        <span class="family-table__title">
          <span class="family-table__title-text">${group.name}</span>
          <button
            type="button"
            class="family-table__bulk hidden-print"
            data-mark-family="${familyKey}"
          >
            Tudo Sim
          </button>
        </span>
        <span class="family-table__col-title">Sim</span>
        <span class="family-table__col-title">Não</span>
      </div>

      <div class="family-table__body">
        ${group.items.map((item, index) => createStatusRow(group.name, item, index)).join("")}
        ${Array.from({ length: extraRows }, () => createEmptyStatusRow()).join("")}
      </div>
    </div>
  `;
}

function renderEvaluationSections() {
  const simpleSection = evaluationData[0];
  const completeSection = evaluationData[1];

  const getGroup = name => completeSection.groups.find(group => group.name === name);
  const maxSimpleRows = Math.max(...simpleSection.groups.map(group => group.items.length));
  const renderPaddedFamilyTable = group => renderFamilyTable({
    ...group,
    extraRows: Math.max(0, maxSimpleRows - group.items.length)
  });

  elements.evaluationContainer.innerHTML = `
    <section class="evaluation-section evaluation-section--sheet">
      <div class="section-main-title">${simpleSection.title}</div>
      <div class="sheet-family-grid sheet-family-grid--simple">
        ${simpleSection.groups.map(renderPaddedFamilyTable).join("")}
      </div>
    </section>

    <section class="evaluation-section evaluation-section--sheet">
      <div class="section-main-title">${completeSection.title}</div>

      <div class="sheet-family-grid sheet-family-grid--complete">
        <div class="sheet-family-stack">
          ${renderFamilyTable(getGroup("Família: Suspensão"))}
        </div>

        <div class="sheet-family-stack">
          ${renderFamilyTable(getGroup("Família: Freio"))}
          ${renderFamilyTable(getGroup("Família: Lubrificante"))}
          ${renderFamilyTable(getGroup("Família: Elétrica"))}
        </div>
      </div>

      <div class="sheet-family-grid sheet-family-grid--footer">
        ${renderFamilyTable(getGroup("Motor / Transmissão"))}
        ${renderFamilyTable(getGroup("Escapamento"))}
      </div>
    </section>
  `;
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

function addDamageEntry() {
  const location = getFieldValue("damageLocation");
  const type = getFieldValue("damageType");
  const note = getFieldValue("damageNote");

  if (!location || !type) {
    showToast("Selecione o local e o tipo da avaria.", "warning");
    return;
  }

  state.damageEntries.push({ location, type, note });
  renderDamageList();
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
  updateSummaryOutput();
  scheduleDraftSave();
  showToast("Avaria removida.", "info");
}

function previewPhotos() {
  elements.photoPreview.innerHTML = "";

  if (!state.photoFiles.length) {
    elements.photoPreview.innerHTML = `
      <div class="preview-empty">Nenhuma foto anexada. Voce pode adicionar ate ${MAX_DAMAGE_PHOTOS} imagens.</div>
    `;
    return;
  }

  state.photoFiles.forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "preview-card";

    const image = document.createElement("img");
    image.alt = file.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "preview-card__remove";
    removeButton.dataset.removePhotoIndex = String(index);
    removeButton.setAttribute("aria-label", `Remover foto ${file.name}`);
    removeButton.textContent = "×";

    const name = document.createElement("span");
    name.textContent = `${index + 1}. ${file.name}`;

    card.append(image, removeButton, name);
    elements.photoPreview.appendChild(card);

    const reader = new FileReader();
    reader.onload = event => {
      image.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  });
}

function syncPhotoInputFiles() {
  if (!elements.photoInput) {
    return;
  }

  try {
    const dataTransfer = new DataTransfer();
    state.photoFiles.forEach(file => dataTransfer.items.add(file));
    elements.photoInput.files = dataTransfer.files;
  } catch (error) {
    console.warn("Nao foi possivel sincronizar o input de fotos:", error);
  }
}

function addSelectedPhotos(fileList) {
  const selectedFiles = Array.from(fileList || []).filter(file => file.type.startsWith("image/"));

  if (!selectedFiles.length) {
    previewPhotos();
    return;
  }

  const slotsRemaining = MAX_DAMAGE_PHOTOS - state.photoFiles.length;

  if (slotsRemaining <= 0) {
    showToast(`Limite maximo de ${MAX_DAMAGE_PHOTOS} fotos atingido.`, "warning");
    elements.photoInput.value = "";
    return;
  }

  const filesToAdd = selectedFiles.slice(0, slotsRemaining);
  state.photoFiles.push(...filesToAdd);
  syncPhotoInputFiles();
  previewPhotos();
  elements.photoInput.value = "";

  if (selectedFiles.length > filesToAdd.length) {
    showToast(`Somente ${MAX_DAMAGE_PHOTOS} fotos sao permitidas por checklist.`, "warning");
    return;
  }

  showToast(`${filesToAdd.length} foto(s) adicionada(s).`, "success");
}

function removeSelectedPhoto(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.photoFiles.length) {
    return;
  }

  state.photoFiles.splice(index, 1);
  syncPhotoInputFiles();
  previewPhotos();
  showToast("Foto removida.", "info");
}

function markFamilyAsYes(familyKey) {
  const yesRadios = Array.from(
    document.querySelectorAll(`input[type="radio"][data-family-key="${familyKey}"][value="SIM"]`)
  );

  if (!yesRadios.length) {
    return;
  }

  yesRadios.forEach(input => {
    input.checked = true;
  });

  updateSummaryOutput();
  scheduleDraftSave();
  showToast("Todos os itens da família foram marcados como Sim.", "success");
}

function getMarkedIssues() {
  return Array.from(document.querySelectorAll(".status-item"))
    .map(item => {
      const title = item.querySelector(".status-item-title")?.textContent || "";
      const selected = item.querySelector('input[type="radio"]:checked');

      return selected?.value === "NÃO" ? title : "";
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
    storeNumber: getFieldValue("storeNumber") || "-",
    storeName: getFieldValue("storeName") || "-",
    storeDisplay: formatStoreLabel({
      number: getFieldValue("storeNumber"),
      name: getFieldValue("storeName")
    }) || "-",
    date: formatDateForSummary(getFieldValue("date")),
    clientName: getFieldValue("clientName") || "-",
    phone: getFieldValue("phone") || "-",
    plate: getFieldValue("plate") || "-",
    vehicle: getFieldValue("vehicle") || "-",
    km: getFieldValue("km") || "-",
    lastOilService: getFieldValue("lastOilService") || "-",
    fuelLevel: getFieldValue("fuelLevel") || "-",
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
    `LOJA: ${summary.storeDisplay}`,
    `DATA: ${summary.date}`,
    `CLIENTE: ${summary.clientName} | TEL: ${summary.phone}`,
    `PLACA: ${summary.plate}`,
    `VEÍCULO: ${summary.vehicle} | KM: ${summary.km}`,
    `ÚLTIMA TROCA DE ÓLEO: ${summary.lastOilService} | COMBUSTÍVEL: ${summary.fuelLevel}`,
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
        <div class="summary-metric"><span>Última troca de óleo</span><strong>${escapeHtml(summary.lastOilService)}</strong></div>
        <div class="summary-metric"><span>Combustível</span><strong>${escapeHtml(summary.fuelLevel)}</strong></div>
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
          <div><span>Loja</span><strong>${escapeHtml(summary.storeDisplay)}</strong></div>
          <div><span>Cliente</span><strong>${escapeHtml(summary.clientName)}</strong></div>
          <div><span>Data</span><strong>${escapeHtml(summary.date)}</strong></div>
          <div><span>Veículo</span><strong>${escapeHtml(summary.vehicle)}</strong></div>
          <div><span>Placa</span><strong>${escapeHtml(summary.plate)}</strong></div>
          <div><span>KM</span><strong>${escapeHtml(summary.km)}</strong></div>
          <div><span>OS</span><strong>${escapeHtml(summary.osNumber)}</strong></div>
          <div><span>Última troca de óleo</span><strong>${escapeHtml(summary.lastOilService)}</strong></div>
          <div><span>Combustível</span><strong>${escapeHtml(summary.fuelLevel)}</strong></div>
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

function syncSummaryVisibility() {
  if (!elements.summaryOutput || !elements.toggleSummaryBtn) {
    return;
  }

  const iconPath = state.summaryVisible
    ? "M12 5c5.5 0 9.5 4.2 10.8 6.1.3.4.3 1 0 1.4C21.5 14.3 17.5 18.5 12 18.5S2.5 14.3 1.2 12.5a1.2 1.2 0 0 1 0-1.4C2.5 9.2 6.5 5 12 5Zm0 2C7.9 7 4.7 9.8 3.3 11.8 4.7 13.7 7.9 16.5 12 16.5s7.3-2.8 8.7-4.7C19.3 9.8 16.1 7 12 7Zm0 1.5a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Zm0 2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
    : "m3.3 4.7 16 16-1.4 1.4-2.7-2.7a12.8 12.8 0 0 1-3.2.4c-5.5 0-9.5-4.2-10.8-6.1a1.2 1.2 0 0 1 0-1.4A19.4 19.4 0 0 1 6.1 7.3L1.9 3.1l1.4-1.4Zm4.4 4.4a3.3 3.3 0 0 0 4.6 4.6Zm3-5.1c5.5 0 9.5 4.2 10.8 6.1.3.4.3 1 0 1.4a18.2 18.2 0 0 1-4.5 4.3l-1.4-1.4a16.5 16.5 0 0 0 3-2.9c-1.4-1.9-4.6-4.7-8.7-4.7-.8 0-1.5.1-2.2.2L8.2 7.5A12.7 12.7 0 0 1 12 7.1Zm-.2 2.1a3.3 3.3 0 0 1 3.3 3.3c0 .3 0 .6-.1.9l-4.1-4.1c.3-.1.6-.1.9-.1Z";

  elements.summaryOutput.hidden = !state.summaryVisible;
  elements.toggleSummaryBtn.setAttribute("aria-expanded", String(state.summaryVisible));
  elements.toggleSummaryBtn.setAttribute(
    "title",
    state.summaryVisible ? "Ocultar resumo" : "Mostrar resumo"
  );

  const text = elements.toggleSummaryBtn.querySelector(".summary-toggle__text");
  const icon = elements.toggleSummaryBtn.querySelector(".summary-toggle__icon svg path");

  if (text) {
    text.textContent = state.summaryVisible ? "Ocultar" : "Mostrar";
  }

  if (icon) {
    icon.setAttribute("d", iconPath);
  }
}

function syncCatalogsVisibility() {
  if (!elements.catalogsContent || !elements.toggleCatalogsBtn) {
    return;
  }

  const iconPath = state.catalogsVisible
    ? "M12 5c5.5 0 9.5 4.2 10.8 6.1.3.4.3 1 0 1.4C21.5 14.3 17.5 18.5 12 18.5S2.5 14.3 1.2 12.5a1.2 1.2 0 0 1 0-1.4C2.5 9.2 6.5 5 12 5Zm0 2C7.9 7 4.7 9.8 3.3 11.8 4.7 13.7 7.9 16.5 12 16.5s7.3-2.8 8.7-4.7C19.3 9.8 16.1 7 12 7Zm0 1.5a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Zm0 2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
    : "m3.3 4.7 16 16-1.4 1.4-2.7-2.7a12.8 12.8 0 0 1-3.2.4c-5.5 0-9.5-4.2-10.8-6.1a1.2 1.2 0 0 1 0-1.4A19.4 19.4 0 0 1 6.1 7.3L1.9 3.1l1.4-1.4Zm4.4 4.4a3.3 3.3 0 0 0 4.6 4.6Zm3-5.1c5.5 0 9.5 4.2 10.8 6.1.3.4.3 1 0 1.4a18.2 18.2 0 0 1-4.5 4.3l-1.4-1.4a16.5 16.5 0 0 0 3-2.9c-1.4-1.9-4.6-4.7-8.7-4.7-.8 0-1.5.1-2.2.2L8.2 7.5A12.7 12.7 0 0 1 12 7.1Zm-.2 2.1a3.3 3.3 0 0 1 3.3 3.3c0 .3 0 .6-.1.9l-4.1-4.1c.3-.1.6-.1.9-.1Z";

  elements.catalogsContent.hidden = !state.catalogsVisible;
  elements.toggleCatalogsBtn.setAttribute("aria-expanded", String(state.catalogsVisible));
  elements.toggleCatalogsBtn.setAttribute(
    "title",
    state.catalogsVisible ? "Ocultar cadastros rápidos" : "Mostrar cadastros rápidos"
  );

  const text = elements.toggleCatalogsBtn.querySelector(".summary-toggle__text");
  const icon = elements.toggleCatalogsBtn.querySelector(".summary-toggle__icon svg path");

  if (text) {
    text.textContent = state.catalogsVisible ? "Ocultar" : "Mostrar";
  }

  if (icon) {
    icon.setAttribute("d", iconPath);
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
  setStatusChip(elements.draftStatus, "Checklist pronto para iniciar", "success");
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
  setStatusChip(elements.draftStatus, "Checklist pronto para iniciar", "success");
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target?.result || "");
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function dataUrlToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao preparar a imagem para o e-mail."));
    image.src = dataUrl;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error("Falha ao compactar a imagem para o e-mail."));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });
}

async function optimizeImageForEmail(file) {
  const maxDimension = 1600;
  const maxOriginalSize = 1_800_000;

  if (!file.type.startsWith("image/") || file.size <= maxOriginalSize) {
    return file;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await dataUrlToImage(dataUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const optimizedBlob = await canvasToBlob(canvas, "image/jpeg", 0.82);
    const optimizedName = file.name.replace(/\.[^.]+$/, "") || `foto-${Date.now()}`;

    return new File(
      [optimizedBlob],
      `${optimizedName}.jpg`,
      { type: "image/jpeg" }
    );
  } catch (error) {
    console.warn("Falha ao otimizar a imagem para envio, usando original:", error);
    return file;
  }
}

async function buildPhotoEmailAttachments() {
  const attachments = [];

  for (const file of state.photoFiles) {
    const preparedFile = await optimizeImageForEmail(file);
    attachments.push({
      filename: preparedFile.name,
      content: await blobToBase64(preparedFile)
    });
  }

  return attachments;
}

async function getBannerPdfDataUrl() {
  if (state.bannerPdfDataUrl) {
    return state.bannerPdfDataUrl;
  }

  const response = await fetch(BANNER_IMAGE_URL);

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o banner para o PDF.");
  }

  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  state.bannerPdfDataUrl = `data:${blob.type || "image/jpeg"};base64,${base64}`;

  return state.bannerPdfDataUrl;
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

  try {
    const bannerDataUrl = await getBannerPdfDataUrl();
    doc.addImage(bannerDataUrl, "JPEG", 15, 12, 180, 30);
  } catch (error) {
    console.warn("Falha ao carregar banner no PDF, usando cabecalho simplificado:", error);
    doc.setFillColor(7, 45, 98);
    doc.roundedRect(15, 14, 180, 20, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Checklist DF Pneus Michelin", 20, 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text("Resumo executivo para atendimento, aprovacao e impressao.", 20, 29);
  }

  doc.setDrawColor(214, 224, 238);
  doc.setLineWidth(.5);
  doc.line(15, 45, 195, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(93, 108, 129);
  doc.text(`${summary.clientName} · ${summary.vehicle} · ${summary.plate}`, 195, 50, { align: "right" });

  let cursorY = 57;

  cursorY = addPdfSection(doc, "Dados do Atendimento", [
    `Loja: ${summary.storeDisplay}`,
    `Data: ${summary.date}`,
    `Cliente: ${summary.clientName} | Telefone: ${summary.phone}`,
    `Veiculo: ${summary.vehicle}`,
    `Placa: ${summary.plate} | KM: ${summary.km} | Combustivel: ${summary.fuelLevel}`,
    `Ultima troca de oleo: ${summary.lastOilService} | OS: ${summary.osNumber}`,
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
  pdfFile,
  photoAttachments = []
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
      pdfBase64,
      photoAttachments
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

function generateEmailBody(options = {}) {
  const { includeAttachments = true } = options;
  const summary = getSummaryData();
  const attachmentLine = includeAttachments
    ? (
      state.photoFiles.length
        ? `O PDF e ${state.photoFiles.length} foto(s) seguem anexados neste envio.`
        : "O PDF do checklist segue anexado neste envio."
    )
    : (
      state.photoFiles.length
        ? `Neste fallback local, o PDF e as ${state.photoFiles.length} foto(s) precisam ser anexados manualmente.`
        : "Neste fallback local, o PDF precisa ser anexado manualmente."
    );

  return [
    "Checklist DF Pneus Michelin",
    "==========================",
    "",
    attachmentLine,
    "",
    generateSummaryText(summary),
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

  const apiBodyText = generateEmailBody({ includeAttachments: true });
  const fallbackBodyText = generateEmailBody({ includeAttachments: false });
  let pdfFile = null;
  let photoAttachments = [];
  let apiErrorMessage = "";

  try {
    pdfFile = await buildChecklistPdfFile();
  } catch (error) {
    console.error("Falha ao gerar PDF para envio:", error);
  }

  try {
    photoAttachments = await buildPhotoEmailAttachments();
  } catch (error) {
    console.error("Falha ao preparar fotos para envio:", error);
  }

  if (pdfFile) {
    try {
      await sendChecklistEmailViaApi({
        toEmail: email,
        subject: subjectText,
        bodyText: apiBodyText,
        pdfFile,
        photoAttachments
      });

      const attachmentsInfo = photoAttachments.length
        ? ` e ${photoAttachments.length} foto(s)`
        : "";

      showToast(`E-mail enviado com PDF anexado${attachmentsInfo} pela Vercel.`, "success");
      return;
    } catch (error) {
      apiErrorMessage = error?.message || "";
      console.warn("Envio serverless indisponível, usando fallback local:", error);
    }
  }

  const copied = await copyTextToClipboard(fallbackBodyText);
  const subject = encodeURIComponent(subjectText);
  const encodedBody = encodeURIComponent(fallbackBodyText);

  if (pdfFile) {
    downloadBlobFile(pdfFile.name, pdfFile);
  }

  window.location.assign(`mailto:${email}?subject=${subject}&body=${encodedBody}`);

  if (pdfFile) {
    const photoMessage = state.photoFiles.length
      ? " As fotos precisam ser anexadas manualmente neste fallback."
      : "";
    const configMessage = apiErrorMessage.includes("RESEND_API_KEY") || apiErrorMessage.includes("CHECKLIST_FROM_EMAIL")
      ? " A Vercel ainda esta sem as variaveis de e-mail configuradas."
      : "";
    showToast(`API indisponível aqui. O e-mail abriu e o PDF foi baixado para anexo manual.${photoMessage}${configMessage}`, "warning");
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

  let pdfFile = null;

  try {
    pdfFile = await buildChecklistPdfFile();
  } catch (error) {
    console.error("Falha ao gerar PDF para compartilhamento:", error);
  }

  if (pdfFile && navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
    try {
      const payload = {
        title: "Checklist DF Pneus Michelin",
        files: [pdfFile]
      };

      await navigator.share(payload);
      showToast("PDF do checklist compartilhado.", "success");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.warn("Compartilhamento de PDF indisponivel:", error);
    }
  }

  if (pdfFile) {
    downloadBlobFile(pdfFile.name, pdfFile);
    showToast("Seu navegador nao compartilha PDF direto aqui. O arquivo foi baixado.", "warning");
    return;
  }

  const text = generateSummaryText();
  window.prompt("Nao foi possivel gerar o PDF nesta sessao. Copie o resumo abaixo:", text);
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

  elements.evaluationContainer?.addEventListener("click", event => {
    const button = event.target.closest("[data-mark-family]");

    if (!button) {
      return;
    }

    markFamilyAsYes(button.dataset.markFamily);
  });

  elements.toggleSummaryBtn?.addEventListener("click", () => {
    state.summaryVisible = !state.summaryVisible;
    syncSummaryVisibility();
  });

  elements.toggleCatalogsBtn?.addEventListener("click", () => {
    state.catalogsVisible = !state.catalogsVisible;
    syncCatalogsVisibility();
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
  elements.storeCatalogSelect?.addEventListener("change", event => {
    state.catalogs.selectedStoreId = event.target.value || "";
  });
  elements.sellerCatalogSelect?.addEventListener("change", event => {
    state.catalogs.selectedSellerId = event.target.value || "";
    syncCatalogEditorFields();
  });
  elements.technicianCatalogSelect?.addEventListener("change", event => {
    state.catalogs.selectedTechnicianId = event.target.value || "";
    syncCatalogEditorFields();
  });
  elements.applyStoreBtn?.addEventListener("click", () => {
    applyStoreById(elements.storeCatalogSelect?.value);
  });
  elements.saveStoreBtn?.addEventListener("click", saveCurrentStore);
  elements.newStoreBtn?.addEventListener("click", prepareNewStore);
  elements.deleteStoreBtn?.addEventListener("click", deleteCurrentStore);
  elements.applySellerBtn?.addEventListener("click", () => {
    state.catalogs.selectedSellerId = elements.sellerCatalogSelect?.value || "";
    applyNamedProfile("seller");
  });
  elements.saveSellerBtn?.addEventListener("click", () => {
    saveNamedProfile("seller");
  });
  elements.newSellerBtn?.addEventListener("click", () => {
    prepareNewNamedProfile("seller");
  });
  elements.deleteSellerBtn?.addEventListener("click", () => {
    state.catalogs.selectedSellerId = elements.sellerCatalogSelect?.value || "";
    deleteNamedProfile("seller");
  });
  elements.applyTechnicianBtn?.addEventListener("click", () => {
    state.catalogs.selectedTechnicianId = elements.technicianCatalogSelect?.value || "";
    applyNamedProfile("technician");
  });
  elements.saveTechnicianBtn?.addEventListener("click", () => {
    saveNamedProfile("technician");
  });
  elements.newTechnicianBtn?.addEventListener("click", () => {
    prepareNewNamedProfile("technician");
  });
  elements.deleteTechnicianBtn?.addEventListener("click", () => {
    state.catalogs.selectedTechnicianId = elements.technicianCatalogSelect?.value || "";
    deleteNamedProfile("technician");
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

  elements.photoInput.addEventListener("change", () => {
    addSelectedPhotos(elements.photoInput.files);
    scheduleDraftSave();
  });

  elements.photoPreview.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-photo-index]");

    if (!button) {
      return;
    }

    removeSelectedPhoto(Number(button.dataset.removePhotoIndex));
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
  loadCatalogState();
  renderCatalogSelectors();
  applyStoreById(state.catalogs.selectedStoreId, { silent: true });
  renderEvaluationSections();
  renderDamageList();
  renderFipeVehicleDetails();
  previewPhotos();
  setDefaultDate();
  bindFormatters();
  bindEvents();
  await loadFipeBrands();
  await restoreDraft();
  updateSummaryOutput();
  syncCatalogsVisibility();
  syncSummaryVisibility();
}

void init();

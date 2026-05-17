const STATIONS = ['Valentine', 'Blackwater', 'Rhodes', 'Strawberry', 'Saint Denis', 'Annesburg', 'Armadillo'];
const RANKS = ['Direktion', 'Fach-Oberarzt', 'Oberarzt', 'Facharzt', 'Arzt', 'Assistenzarzt', 'Student'];
const TRAININGS = ['Aus.', 'Vet.', 'Pha.'];
const STATUSES = ['Im Dienst', 'Außer Dienst', 'Klingel', 'Schlafen'];

const PERMISSIONS = {
  Direktion: { hire: true, transfer: true, message: true, promote: true, sanction: true, fire: true, statusChange: true },
  'Fach-Oberarzt': { hire: true, transfer: true, message: true, promote: true, sanction: true, fire: false, statusChange: true },
  Oberarzt: { hire: false, transfer: true, message: true, promote: false, sanction: false, fire: false, statusChange: true },
  Facharzt: { hire: false, transfer: false, message: true, promote: false, sanction: false, fire: false, statusChange: false },
  Arzt: { hire: false, transfer: false, message: true, promote: false, sanction: false, fire: false, statusChange: false },
  Assistenzarzt: { hire: false, transfer: false, message: true, promote: false, sanction: false, fire: false, statusChange: false },
  Student: { hire: false, transfer: false, message: true, promote: false, sanction: false, fire: false, statusChange: false }
};

const STORAGE_KEYS = {
  employees: 'app_employees',
  currentUser: 'app_currentUser',
  handbook: 'app_handbook',
  price: 'app_priceList',
  departments: 'app_departments',
  reports: 'app_reports'
};

const loginPage = document.getElementById('loginPage');
const appPage = document.getElementById('appPage');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const currentUserName = document.getElementById('currentUserName');
const logoutButton = document.getElementById('logoutButton');
const statusSelect = document.getElementById('statusSelect');
const dashboardUserInfo = document.getElementById('dashboardUserInfo');
const employeeCount = document.getElementById('employeeCount');
const statusCounts = document.getElementById('statusCounts');
const stationCounts = document.getElementById('stationCounts');
const managementSummary = document.getElementById('managementSummary');
const employeeDetailActions = document.querySelector('.employee-detail-actions');
const updateSelectedStatusButton = document.getElementById('updateSelectedStatus');

const pages = Array.from(document.querySelectorAll('.content .page'));
const navButtons = Array.from(document.querySelectorAll('.top-nav button[data-page]'));
const topNav = document.getElementById('topNav');
const menuToggle = document.getElementById('menuToggle');
const closeTopNav = document.getElementById('closeTopNav');

let selectedStationFilter = '';
let selectedRankFilter = '';
let selectedStatusFilter = '';
let searchTerm = '';
const stationSummary = document.getElementById('stationSummary');
const employeeSelect = document.getElementById('employeeSelect');
const employeeList = document.getElementById('employeeList');

const hireForm = document.getElementById('hireForm');
const promoteForm = document.getElementById('promoteForm');
const transferForm = document.getElementById('transferForm');
const messageForm = document.getElementById('messageForm');
const fireForm = document.getElementById('fireForm');
const hireName = document.getElementById('hireName');
const hireUsername = document.getElementById('hireUsername');
const hirePassword = document.getElementById('hirePassword');
const hireStation = document.getElementById('hireStation');
const hireRank = document.getElementById('hireRank');
const promoteRank = document.getElementById('promoteRank');
const transferStation = document.getElementById('transferStation');
const messageText = document.getElementById('messageText');
const notificationBell = document.getElementById('notificationBell');
const notificationPanel = document.getElementById('notificationPanel');
const notificationList = document.getElementById('notificationList');
const closeNotificationPanel = document.getElementById('closeNotificationPanel');
const accountPanel = document.getElementById('accountPanel');
const closeAccountPanel = document.getElementById('closeAccountPanel');
const accountUserName = document.getElementById('accountUserName');
const accountUserRank = document.getElementById('accountUserRank');
const accountUserStation = document.getElementById('accountUserStation');
const openDashboardPage = document.getElementById('openDashboardPage');
const messageRecipientType = document.getElementById('messageRecipientType');
const messageTrainingFilter = document.getElementById('messageTrainingFilter');
const messageEmployeeFilter = document.getElementById('messageEmployeeFilter');
const messageTrainingGroup = document.getElementById('messageTrainingGroup');
const messageEmployeeGroup = document.getElementById('messageEmployeeGroup');
const messageRecipientCount = document.getElementById('messageRecipientCount');
const selectedEmployeeStatus = document.getElementById('selectedEmployeeStatus');
const selectedEmployeeBadge = document.getElementById('selectedEmployeeBadge');
const selectedEmployeeInfo = document.getElementById('selectedEmployeeInfo');
const selectedEmployeeStation = document.getElementById('selectedEmployeeStation');
const selectedEmployeeRank = document.getElementById('selectedEmployeeRank');
const selectedEmployeeTraining = document.getElementById('selectedEmployeeTraining');
const updateSelectedStatus = document.getElementById('updateSelectedStatus');

const handbookBlocks = document.getElementById('handbookBlocks');
const priceBlocks = document.getElementById('priceBlocks');
const reportUpload = document.getElementById('reportUpload');
const reportList = document.getElementById('reportList');
const clearStorage = document.getElementById('clearStorage');
const headerSearch = document.getElementById('headerSearch');

let employees = [];
let currentUser = null;
let handbookData = [];
let priceData = [];
let departmentData = {};
let reportsData = [];
let selectedEmployeeId = null;

async function readStorage(key) {
  if (window.indexedDB) {
    try {
      const result = await dbGet(key);
      return result === undefined ? null : result;
    } catch (error) {
      console.warn('[db] readStorage fallback to localStorage', error);
    }
  }
  return JSON.parse(localStorage.getItem(key) || 'null');
}

async function writeStorage(key, value) {
  if (window.indexedDB) {
    try {
      await dbSet(key, value);
      return;
    } catch (error) {
      console.warn('[db] writeStorage fallback to localStorage', error);
    }
  }
  localStorage.setItem(key, JSON.stringify(value));
}

async function clearAllStorage() {
  if (window.indexedDB) {
    try {
      // attempt to delete the whole database; if not possible, clear the store
      if (typeof dbDelete === 'function') {
        await dbDelete();
      } else {
        await dbClear();
      }
    } catch (error) {
      console.warn('[db] clearAllStorage failed', error);
    }
  }
  localStorage.clear();
}

async function initializeData() {
  if (window.indexedDB) {
    try {
      await openAppDatabase();
    } catch (error) {
      console.warn('[db] IndexedDB opening failed', error);
    }
  }

  employees = (await readStorage(STORAGE_KEYS.employees) || []).map((employee) => ({
    ...employee,
    messages: (employee.messages || []).map((message) => ({
      id: message.id || generateId(),
      ...message
    }))
  }));
  currentUser = await readStorage(STORAGE_KEYS.currentUser) || null;
  handbookData = await readStorage(STORAGE_KEYS.handbook) || [];
  priceData = await readStorage(STORAGE_KEYS.price) || [];
  departmentData = await readStorage(STORAGE_KEYS.departments) || {};
  reportsData = await readStorage(STORAGE_KEYS.reports) || [];

  console.log('[init] loaded employees from storage:', employees.length, employees.map(e => e.username));
  const hasAdmin = employees.some((employee) => employee.username === 'admin');
  if (!hasAdmin) {
    employees.push({
      id: generateId(),
      name: 'Admin Leitung',
      username: 'admin',
      password: 'admin',
      station: 'Saint Denis',
      rank: 'Direktion',
      status: 'Im Dienst',
      training: ['Aus.'],
      sanctions: [],
      messages: []
    });
    await saveEmployees();
  }

  // render debug panel if present
  setTimeout(renderDebugPanel, 60);
}

function renderDebugPanel() {
  const debugText = document.getElementById('debugText');
  if (!debugText) return;
  try {
    const stored = {};
    Object.keys(localStorage).forEach(k => { stored[k] = localStorage.getItem(k); });
    const safeEmployees = employees.map(e => ({ id: e.id, username: e.username, name: e.name }));
    const info = {
      employees: safeEmployees,
      employeesCount: employees.length,
      currentUser: currentUser ? { id: currentUser.id, username: currentUser.username, name: currentUser.name } : null,
      indexedDBAvailable: !!window.indexedDB,
      localStorageKeys: Object.keys(localStorage)
    };
    debugText.textContent = JSON.stringify(info, null, 2);
  } catch (err) {
    debugText.textContent = 'Debug read error: ' + err.message;
  }
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  if (t && t.id === 'recreateAdmin') {
    const has = employees.some(u => u.username === 'admin');
    if (!has) {
      employees.push({ id: generateId(), name: 'Admin Leitung', username: 'admin', password: 'admin', station: 'Saint Denis', rank: 'Direktion', status: 'Im Dienst', training: [], sanctions: [], messages: [] });
      await saveEmployees();
    }
    renderDebugPanel();
    alert('Admin account recreated. Versuch erneut anzumelden: admin / admin');
  }
  if (t && t.id === 'clearAllStorage') {
    if (!confirm('Lokalen Speicher wirklich komplett löschen?')) return;
    await clearAllStorage();
    location.reload();
  }
});
  if (!handbookData.length) {
    handbookData = [
      { id: generateId(), title: 'Abteilung', type: 'text', content: 'Hier kannst du Informationen zu Abteilungen speichern.' },
      { id: generateId(), title: 'Grundsätzliches', type: 'text', content: 'Notiere Hinweise zu Verletzungen und Erstversorgung.' },
      { id: generateId(), title: 'Verletzungen', type: 'table', table: [['Art der Verletzung', 'Sympthome', 'Behandlungsempfhelung', 'Nachsorge u. Nachbehandlung', 'Medikamentenempfehlung']] },
      { id: generateId(), title: 'Medikamente', type: 'table', table: [['Medikament', 'Anwendung', 'Menge']] },
      { id: generateId(), title: 'Ausbilder', type: 'text', content: 'Informationen zu Ausbildern.' },
      { id: generateId(), title: 'Veterinär', type: 'text', content: 'Informationen zur Veterinär-Ausbildung.' },
      { id: generateId(), title: 'Pharmazie', type: 'text', content: 'Informationen zur Pharmazie.' }
    ];
    writeStorage(STORAGE_KEYS.handbook, handbookData);
  }

  if (!priceData.length) {
    priceData = [
      { id: generateId(), title: 'Grundpreise', type: 'text', content: 'Hier kannst du die Preisliste eintragen.' },
      { id: generateId(), title: 'Medikamente', type: 'table', table: [['Leistung', 'Preis', 'Einheit']] }
    ];
    writeStorage(STORAGE_KEYS.price, priceData);
  }

  if (!Object.keys(departmentData).length) {
    departmentData = {
      Ausbildungsplan: 'Gib hier den Ausbildungsplan ein.',
      Veterinär: 'Gib hier die Informationen für Veterinär ein.',
      Pharmazie: 'Gib hier die Pharmazie-Daten ein.'
    };
    writeStorage(STORAGE_KEYS.departments, departmentData);
  }

  if (!reportsData.length) {
    reportsData = [];
    writeStorage(STORAGE_KEYS.reports, reportsData);
  }


function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const initials = parts.map(p => p[0].toUpperCase()).slice(0,2).join('');
  return initials;
}

function saveEmployees() {
  return writeStorage(STORAGE_KEYS.employees, employees);
}

function saveCurrentUser() {
  return writeStorage(STORAGE_KEYS.currentUser, currentUser);
}

function canPerform(action) {
  if (!currentUser) return false;
  return PERMISSIONS[currentUser.rank]?.[action] || false;
}

function canViewEmployeeDetails(employee) {
  if (!currentUser || !employee) return false;
  if (currentUser.id === employee.id) return true;
  const currentRankIndex = RANKS.indexOf(currentUser.rank);
  const employeeRankIndex = RANKS.indexOf(employee.rank);
  return currentRankIndex <= employeeRankIndex;
}

function renderActionButtons() {
  document.getElementById('showHireForm').style.display = canPerform('hire') ? '' : 'none';
  document.getElementById('showTransferForm').style.display = canPerform('transfer') ? '' : 'none';
  document.getElementById('showMessageForm').style.display = canPerform('message') ? '' : 'none';
  document.getElementById('showPromoteForm').style.display = canPerform('promote') ? '' : 'none';
  document.getElementById('showFireForm').style.display = canPerform('fire') ? '' : 'none';
}

function showPage(pageId) {
  const currentPage = pages.find((page) => !page.classList.contains('hidden') && page.id !== pageId);
  const nextPage = pages.find((page) => page.id === pageId);

  if (currentPage && currentPage !== nextPage) {
    currentPage.classList.remove('active');
    currentPage.addEventListener('transitionend', function handleTransition() {
      currentPage.classList.add('hidden');
      currentPage.removeEventListener('transitionend', handleTransition);
    });
  }

  if (nextPage) {
    nextPage.classList.remove('hidden');
    requestAnimationFrame(() => nextPage.classList.add('active'));
  }

  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.page === pageId));

  switch (pageId) {
    case 'dashboardPage':
      renderDashboard();
      break;
    case 'employeesPage':
      renderAllEmployeeViews();
      break;
    case 'handbookPage':
      renderHandbookBlocks();
      break;
    case 'priceListPage':
      renderPriceBlocks();
      break;
    case 'departmentsPage':
      renderDepartments();
      break;
    case 'reportsPage':
      renderReports();
      break;
    case 'managementPage':
      renderManagement();
      break;
    default:
      break;
  }
}

function updateStatusOptions() {
  statusSelect.innerHTML = '';
  STATUSES.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    statusSelect.appendChild(option);
  });
}

function renderDashboard() {
  employeeCount.textContent = `Mitarbeiter: ${employees.length}`;
  const statusSummary = STATUSES.map((status) => {
    const count = employees.filter((e) => e.status === status).length;
    return `${status}: ${count}`;
  }).join(' | ');
  statusCounts.textContent = statusSummary;

  stationCounts.innerHTML = '';
  STATIONS.forEach((station) => {
    const count = employees.filter((e) => e.station === station).length;
    if (count) {
      const item = document.createElement('li');
      item.textContent = `${station}: ${count}`;
      stationCounts.appendChild(item);
    }
  });

  dashboardUserInfo.textContent = currentUser
    ? `${currentUser.name} • ${currentUser.rank} • ${currentUser.station}`
    : 'Keine Anmeldung';
  statusSelect.value = currentUser?.status || 'Im Dienst';
}

function filterEmployees() {
  const station = selectedStationFilter;
  const rank = selectedRankFilter;
  const status = selectedStatusFilter;
  const search = (searchTerm || '').toLowerCase();
  return employees.filter((employee) => {
    return (
      (!station || employee.station === station) &&
      (!rank || employee.rank === rank) &&
      (!status || employee.status === status) &&
      (!search || [employee.name, employee.username, employee.rank, employee.station, (employee.training || []).join(' ')].join(' ').toLowerCase().includes(search))
    );
  });
}

function renderEmployeeList() {
  const data = filterEmployees();
  employeeList.innerHTML = '';

  if (!data.length) {
    employeeList.innerHTML = '<div class="card empty-state"><p>Keine Mitarbeiter gefunden.</p></div>';
    return;
  }

  const groupedByStation = STATIONS.reduce((acc, station) => {
    acc[station] = [];
    return acc;
  }, {});

  data.forEach((employee) => {
    if (!groupedByStation[employee.station]) {
      groupedByStation[employee.station] = [];
    }
    groupedByStation[employee.station].push(employee);
  });

  Object.entries(groupedByStation).forEach(([station, employeesByStation]) => {
    if (!employeesByStation.length) return;

    const stationSection = document.createElement('section');
    stationSection.className = 'station-group';
    stationSection.innerHTML = `
      <div class="station-group-header">
        <div>
          <h3>${station}</h3>
          <p>${employeesByStation.length} Mitarbeiter</p>
        </div>
      </div>
    `;

    const cards = document.createElement('div');
    cards.className = 'station-cards';

    sortByRank(employeesByStation).forEach((employee) => {
      const card = document.createElement('article');
      card.className = 'employee-card';
      if (employee.id === selectedEmployeeId) {
        card.classList.add('selected');
      }
      const trainingText = employee.training.length ? employee.training.join(', ') : 'Keine';
      const statusClass = `status-${employee.status.replace(/\s+/g, '').toLowerCase()}`;

      const rankBadge = `<span class="rank-badge">${employee.rank}</span>`;
      const stationText = `<span class="station-text">${employee.station}</span>`;
      const trainingClassMap = { 'Aus.': 'training-aus', 'Vet.': 'training-vet', 'Pha.': 'training-pha' };
      const trainingBadges = (employee.training && employee.training.length)
        ? employee.training.map(t => `<span class="training-badge ${trainingClassMap[t] || ''}">${t}</span>`).join(' ')
        : '<span class="training-none">Keine</span>';

      card.innerHTML = `
        <div class="employee-card-header">
          <div>
            <h3>${employee.name}</h3>
            <p class="meta">${rankBadge} <span class="dot">•</span> ${stationText}</p>
          </div>
          <span class="status-pill ${statusClass}">${employee.status}</span>
        </div>
        <div class="employee-card-info">
          <p class="trainings"><strong>Weiterbildung:</strong> ${trainingBadges}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        selectedEmployeeId = employee.id;
        renderSelectedEmployeeInfo();
        renderEmployeeSelection();
        renderEmployeeList();
      });

      cards.appendChild(card);
    });

    stationSection.appendChild(cards);
    employeeList.appendChild(stationSection);
  });
}

function renderStationSummary() {
  const filteredByRankStatus = employees.filter((employee) => {
    return (
      (!selectedRankFilter || employee.rank === selectedRankFilter) &&
      (!selectedStatusFilter || employee.status === selectedStatusFilter)
    );
  });
  stationSummary.innerHTML = '';

  const allPill = document.createElement('button');
  allPill.type = 'button';
  allPill.className = `station-pill ${selectedStationFilter === '' ? 'active' : ''}`;
  allPill.textContent = `Alle (${filteredByRankStatus.length})`;
  allPill.addEventListener('click', () => {
    selectedStationFilter = '';
    renderStationSummary();
    renderEmployeeList();
  });
  stationSummary.appendChild(allPill);

  STATIONS.forEach((station) => {
    const count = filteredByRankStatus.filter((employee) => employee.station === station).length;
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `station-pill ${selectedStationFilter === station ? 'active' : ''}`;
    pill.textContent = `${station} (${count})`;
    pill.addEventListener('click', () => {
      selectedStationFilter = station;
      renderStationSummary();
      renderEmployeeList();
    });
    stationSummary.appendChild(pill);
  });
}

function sortByRank(list) {
  return list.slice().sort((a, b) => {
    const aIndex = RANKS.indexOf(a.rank);
    const bIndex = RANKS.indexOf(b.rank);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name, 'de');
  });
}

function renderEmployeeSelection() {
  employeeSelect.innerHTML = '';
  const selected = employees.find((employee) => employee.id === selectedEmployeeId);
  sortByRank(employees).forEach((employee) => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} (${employee.rank})`;
    employeeSelect.appendChild(option);
  });
  if (!selected || !employees.some((employee) => employee.id === selectedEmployeeId)) {
    selectedEmployeeId = employees.length ? employees[0].id : null;
  }
  if (selectedEmployeeId) {
    employeeSelect.value = selectedEmployeeId;
  }
}

function renderSelectedEmployeeInfo() {
  const employee = getSelectedEmployee();
  if (!employee) {
    selectedEmployeeInfo.textContent = 'Wähle einen Mitarbeiter, um Informationen zu sehen.';
    selectedEmployeeBadge.textContent = 'Status';
    selectedEmployeeBadge.className = 'status-pill status-imdienst';
    selectedEmployeeStation.textContent = '-';
    selectedEmployeeRank.textContent = '-';
    selectedEmployeeTraining.textContent = '-';
    selectedEmployeeStatus.innerHTML = '';
    return;
  }
  const detailsAllowed = canViewEmployeeDetails(employee);
  selectedEmployeeInfo.textContent = employee.name;
  selectedEmployeeStation.textContent = employee.station;
  selectedEmployeeRank.textContent = employee.rank; // always show rank for selected employee
  selectedEmployeeTraining.textContent = employee.training.length ? employee.training.join(', ') : 'Keine'; // always show trainings
  selectedEmployeeBadge.textContent = employee.status;
  selectedEmployeeBadge.className = `status-pill status-${employee.status.replace(/\s+/g, '').toLowerCase()}`;

  const canChangeStatus = employee.id === currentUser?.id || canPerform('statusChange');
  if (canChangeStatus) {
    selectedEmployeeStatus.innerHTML = '';
    STATUSES.forEach((status) => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      selectedEmployeeStatus.appendChild(option);
    });
    selectedEmployeeStatus.value = employee.status;
    if (employeeDetailActions) employeeDetailActions.style.display = '';
  } else {
    selectedEmployeeStatus.innerHTML = '<option>Keine Berechtigung</option>';
    if (employeeDetailActions) employeeDetailActions.style.display = 'none';
  }
}

function renderEmployeeActionOptions() {
  [hireStation, hireRank, promoteRank, transferStation].forEach((select) => {
    select.innerHTML = '';
  });
  STATIONS.forEach((station) => {
    const option = document.createElement('option');
    option.value = station;
    option.textContent = station;
    hireStation.appendChild(option);
    const option4 = document.createElement('option');
    option4.value = station;
    option4.textContent = station;
    transferStation.appendChild(option4);
  });
  RANKS.forEach((rank) => {
    const option1 = document.createElement('option');
    option1.value = rank;
    option1.textContent = rank;
    hireRank.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = rank;
    option2.textContent = rank;
    promoteRank.appendChild(option2);
  });
}

function renderMessageRecipientOptions() {
  messageTrainingFilter.innerHTML = '';
  TRAININGS.forEach((training) => {
    const option = document.createElement('option');
    option.value = training;
    option.textContent = training;
    messageTrainingFilter.appendChild(option);
  });

  messageEmployeeFilter.innerHTML = '';
  sortByRank(employees).forEach((employee) => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} (${employee.rank})`;
    messageEmployeeFilter.appendChild(option);
  });

  updateMessageTargetGroups();
}

function updateMessageTargetGroups() {
  const type = messageRecipientType.value;
  messageTrainingGroup.classList.toggle('hidden', type !== 'training');
  messageEmployeeGroup.classList.toggle('hidden', type !== 'single');
  updateMessageRecipientPreview();
}

function updateMessageRecipientPreview() {
  const type = messageRecipientType.value;
  if (type === 'training') {
    const training = messageTrainingFilter.value;
    const count = employees.filter((employee) => employee.training.includes(training)).length;
    messageRecipientCount.textContent = `Empfänger: ${count} Mitarbeiter mit ${training}`;
    return;
  }
  if (type === 'single') {
    const employee = employees.find((employee) => employee.id === messageEmployeeFilter.value);
    messageRecipientCount.textContent = employee ? `Empfänger: ${employee.name}` : 'Empfänger: Kein Mitarbeiter ausgewählt';
    return;
  }
  messageRecipientCount.textContent = `Empfänger: Alle Mitarbeiter (${employees.length})`;
}

function getCurrentUserMessages() {
  if (!currentUser) return [];
  const employee = employees.find((item) => item.id === currentUser.id);
  return employee?.messages || [];
}

function renderNotificationBell() {
  const messages = getCurrentUserMessages();
  const badge = document.getElementById('notificationCount');
  if (!badge) return;
  if (messages.length > 0) {
    badge.textContent = messages.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderNotificationPanel() {
  if (!notificationList) return;
  notificationList.innerHTML = '';
  const messages = getCurrentUserMessages().slice().reverse();
  if (!messages.length) {
    const noMessage = document.createElement('div');
    noMessage.className = 'notification-empty';
    noMessage.textContent = 'Keine aktuellen Mitteilungen.';
    notificationList.appendChild(noMessage);
    return;
  }
  messages.forEach((message) => {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `
      <div class="notification-item-content">
        <p>${message.text}</p>
        <span>${message.date}</span>
      </div>
      <button type="button" class="notification-mark-read" data-message-id="${message.id}">Als gelesen markieren</button>
    `;
    notificationList.appendChild(item);
  });
}

function removeCurrentUserMessage(messageId) {
  if (!currentUser) return;
  const employee = employees.find((item) => item.id === currentUser.id);
  if (!employee || !employee.messages) return;
  employee.messages = employee.messages.filter((message) => message.id !== messageId);
  saveEmployees();
  renderNotificationPanel();
  renderNotificationBell();
}

function positionNotificationPanel() {
  if (!notificationPanel || !notificationBell) return;
  const rect = notificationBell.getBoundingClientRect();
  const panelWidth = Math.min(340, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
  const top = Math.min(Math.max(16, rect.bottom + 10), window.innerHeight - 16);
  notificationPanel.style.left = `${left}px`;
  notificationPanel.style.top = `${top}px`;
}

function toggleNotificationPanel() {
  if (!notificationPanel) return;
  if (notificationPanel.classList.contains('hidden')) {
    positionNotificationPanel();
    renderNotificationPanel();
    notificationPanel.classList.remove('hidden');
    notificationPanel.classList.add('visible');
  } else {
    notificationPanel.classList.add('hidden');
    notificationPanel.classList.remove('visible');
  }
}

function positionAccountPanel() {
  if (!accountPanel || !currentUserName) return;
  const rect = currentUserName.getBoundingClientRect();
  const panelWidth = Math.min(340, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
  const top = Math.min(Math.max(16, rect.bottom + 10), window.innerHeight - 16);
  accountPanel.style.left = `${left}px`;
  accountPanel.style.top = `${top}px`;
}

function toggleAccountPanel() {
  if (!accountPanel) return;
  if (accountPanel.classList.contains('hidden')) {
    positionAccountPanel();
    accountPanel.classList.remove('hidden');
    accountPanel.classList.add('visible');
  } else {
    accountPanel.classList.add('hidden');
    accountPanel.classList.remove('visible');
  }
}

function hideAccountPanel() {
  if (!accountPanel) return;
  accountPanel.classList.remove('visible');
  accountPanel.classList.add('hidden');
}

function getSelectedEmployee() {
  let employee = employees.find((employee) => employee.id === selectedEmployeeId);
  if (!employee && employeeSelect && employeeSelect.value) {
    employee = employees.find((employee) => employee.id === employeeSelect.value);
    if (employee) {
      selectedEmployeeId = employee.id;
    }
  }
  if (!employee && employees.length) {
    selectedEmployeeId = employees[0].id;
    employee = employees[0];
  }
  return employee;
}

function resetActionForms() {
  [hireForm, promoteForm, transferForm, messageForm, fireForm].forEach((form) => form.classList.add('hidden'));
}

function showActionForm(formId) {
  const actionMap = {
    hireForm: 'hire',
    transferForm: 'transfer',
    messageForm: 'message',
    promoteForm: 'promote',
    fireForm: 'fire'
  };

  const requiredPermission = actionMap[formId];
  if (!canPerform(requiredPermission)) {
    alert('Du hast dafür keine Berechtigung.');
    return;
  }

  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst einen Mitarbeiter auswählen.');
    return;
  }
  renderSelectedEmployeeInfo();
  resetActionForms();
  populateActionForm(formId);
  document.getElementById(formId).classList.remove('hidden');
}

function populateActionForm(formId) {
  const employee = getSelectedEmployee();
  if (!employee) return;

  if (formId === 'promoteForm') {
    promoteRank.value = employee.rank;
    document.querySelectorAll('.trainingCheckbox.promote').forEach((input) => {
      input.checked = employee.training.includes(input.value);
    });
  }

  if (formId === 'transferForm') {
    transferStation.value = employee.station;
  }

  if (formId === 'messageForm') {
    messageText.value = '';
    messageRecipientType.value = 'all';
    renderMessageRecipientOptions();
    updateMessageTargetGroups();
  }
}

function handleEmployeeSelection() {
  selectedEmployeeId = employeeSelect.value;
}

function handleHire() {
  const name = hireName.value.trim();
  const username = hireUsername.value.trim();
  const password = hirePassword.value.trim();
  const station = hireStation.value;
  const rank = hireRank.value;
  const training = Array.from(document.querySelectorAll('.trainingCheckbox:checked')).map((input) => input.value);

  if (!name || !username || !password) {
    alert('Bitte Name, Benutzername und Passwort eingeben.');
    return;
  }

  if (employees.some((employee) => employee.username === username)) {
    alert('Dieser Benutzername ist bereits vergeben.');
    return;
  }

  const newEmployee = {
    id: generateId(),
    name,
    username,
    password,
    station,
    rank,
    status: 'Im Dienst',
    training,
    sanctions: [],
    messages: []
  };
  employees.push(newEmployee);
  selectedEmployeeId = newEmployee.id;
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert(`Mitarbeiter erfolgreich eingestellt. Benutzer: ${username}`);
  hireName.value = '';
  hireUsername.value = '';
  hirePassword.value = '';
  document.querySelectorAll('.trainingCheckbox').forEach((input) => (input.checked = false));
}

function handlePromote() {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst einen Mitarbeiter auswählen.');
    return;
  }
  const training = Array.from(document.querySelectorAll('.trainingCheckbox.promote:checked')).map((input) => input.value);
  employee.rank = promoteRank.value;
  employee.training = training;
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert('Rang und Weiterbildungen wurden angepasst.');
}

function handleTransfer() {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst einen Mitarbeiter auswählen.');
    return;
  }
  const newStation = transferStation.value;
  if (!newStation || newStation === employee.station) {
    alert('Bitte eine andere Station auswählen.');
    return;
  }
  employee.station = newStation;
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert(`${employee.name} wurde nach ${newStation} versetzt.`);
}

function handleSendMessage() {
  const message = messageText.value.trim();
  if (!message) {
    alert('Bitte eine Nachricht eingeben.');
    return;
  }

  const recipientType = messageRecipientType.value;
  let recipients = [];

  if (recipientType === 'training') {
    const training = messageTrainingFilter.value;
    recipients = employees.filter((employee) => employee.training.includes(training));
  } else if (recipientType === 'single') {
    const selectedId = messageEmployeeFilter.value;
    const selectedEmployee = employees.find((employee) => employee.id === selectedId);
    if (selectedEmployee) recipients = [selectedEmployee];
  } else {
    recipients = employees.slice();
  }

  if (!recipients.length) {
    alert('Keine Empfänger gefunden.');
    return;
  }

  const sender = currentUser ? currentUser.name : 'System';
  recipients.forEach((employee) => {
    employee.messages = employee.messages || [];
    employee.messages.push({
      id: generateId(),
      text: `${sender}: ${message}`,
      date: new Date().toLocaleString(),
      sender
    });
  });

  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  messageText.value = '';
  alert(`Mitteilung an ${recipients.length} Mitarbeiter gesendet.`);
}


function handleFire() {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst einen Mitarbeiter auswählen.');
    return;
  }
  if (!confirm(`Mitarbeiter ${employee.name} wirklich entlassen?`)) {
    return;
  }
  employees = employees.filter((item) => item.id !== employee.id);
  if (currentUser?.id === employee.id) {
    currentUser = null;
    writeStorage(STORAGE_KEYS.currentUser, null);
    appPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
  }
  saveEmployees();
  renderAllEmployeeViews();
  resetActionForms();
  alert('Mitarbeiter entlassen.');
}

function renderAllEmployeeViews() {
  renderStationSummary();
  renderEmployeeList();
  renderEmployeeSelection();
  renderEmployeeActionOptions();
  renderMessageRecipientOptions();
  renderActionButtons();
  renderSelectedEmployeeInfo();
  renderNotificationBell();
  renderDashboard();
  renderManagement();
}

function renderHandbookBlocks() {
  handbookBlocks.innerHTML = '';
  handbookData.forEach((block) => {
    const card = document.createElement('div');
    card.className = 'block';
    const title = document.createElement('h3');
    title.textContent = block.title;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Löschen';
    deleteButton.className = 'danger';
    deleteButton.addEventListener('click', () => deleteBlock(block.id, 'handbook'));
    card.appendChild(title);
    card.appendChild(deleteButton);

    if (block.type === 'text') {
      const area = document.createElement('textarea');
      area.value = block.content;
      area.addEventListener('input', () => {
        block.content = area.value;
        writeStorage(STORAGE_KEYS.handbook, handbookData);
      });
      card.appendChild(area);
    } else {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      block.table[0].forEach((cell) => {
        const th = document.createElement('th');
        th.contentEditable = 'true';
        th.textContent = cell;
        row.appendChild(th);
      });
      thead.appendChild(row);
      block.table.slice(1).forEach((rowData) => {
        const rowEl = document.createElement('tr');
        rowData.forEach((cell) => {
          const td = document.createElement('td');
          td.contentEditable = 'true';
          td.textContent = cell;
          rowEl.appendChild(td);
        });
        tbody.appendChild(rowEl);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      card.appendChild(table);

      const rowButtons = document.createElement('div');
      rowButtons.className = 'block-actions';
      const addRow = document.createElement('button');
      addRow.textContent = 'Zeile hinzufügen';
      addRow.addEventListener('click', () => addTableRow(block.id, 'handbook'));
      const addCol = document.createElement('button');
      addCol.textContent = 'Spalte hinzufügen';
      addCol.addEventListener('click', () => addTableColumn(block.id, 'handbook'));
      const save = document.createElement('button');
      save.textContent = 'Speichern';
      save.addEventListener('click', () => saveTableBlock(block.id, 'handbook'));
      rowButtons.append(addRow, addCol, save);
      card.appendChild(rowButtons);
    }

    handbookBlocks.appendChild(card);
  });
}

function renderPriceBlocks() {
  priceBlocks.innerHTML = '';
  priceData.forEach((block) => {
    const card = document.createElement('div');
    card.className = 'block';
    const title = document.createElement('h3');
    title.textContent = block.title;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Löschen';
    deleteButton.className = 'danger';
    deleteButton.addEventListener('click', () => deleteBlock(block.id, 'price'));
    card.appendChild(title);
    card.appendChild(deleteButton);

    if (block.type === 'text') {
      const area = document.createElement('textarea');
      area.value = block.content;
      area.addEventListener('input', () => {
        block.content = area.value;
        writeStorage(STORAGE_KEYS.price, priceData);
      });
      card.appendChild(area);
    } else {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      block.table[0].forEach((cell) => {
        const th = document.createElement('th');
        th.contentEditable = 'true';
        th.textContent = cell;
        row.appendChild(th);
      });
      thead.appendChild(row);
      block.table.slice(1).forEach((rowData) => {
        const rowEl = document.createElement('tr');
        rowData.forEach((cell) => {
          const td = document.createElement('td');
          td.contentEditable = 'true';
          td.textContent = cell;
          rowEl.appendChild(td);
        });
        tbody.appendChild(rowEl);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      card.appendChild(table);

      const rowButtons = document.createElement('div');
      rowButtons.className = 'block-actions';
      const addRow = document.createElement('button');
      addRow.textContent = 'Zeile hinzufügen';
      addRow.addEventListener('click', () => addTableRow(block.id, 'price'));
      const addCol = document.createElement('button');
      addCol.textContent = 'Spalte hinzufügen';
      addCol.addEventListener('click', () => addTableColumn(block.id, 'price'));
      const save = document.createElement('button');
      save.textContent = 'Speichern';
      save.addEventListener('click', () => saveTableBlock(block.id, 'price'));
      rowButtons.append(addRow, addCol, save);
      card.appendChild(rowButtons);
    }

    priceBlocks.appendChild(card);
  });
}

function addTableRow(blockId, target) {
  const data = target === 'handbook' ? handbookData : priceData;
  const block = data.find((item) => item.id === blockId);
  if (!block) return;
  const columns = block.table[0].length;
  const newRow = Array(columns).fill('');
  block.table.push(newRow);
  writeStorage(target === 'handbook' ? STORAGE_KEYS.handbook : STORAGE_KEYS.price, data);
  target === 'handbook' ? renderHandbookBlocks() : renderPriceBlocks();
}

function addTableColumn(blockId, target) {
  const data = target === 'handbook' ? handbookData : priceData;
  const block = data.find((item) => item.id === blockId);
  if (!block) return;
  block.table.forEach((row, index) => {
    row.push(index === 0 ? 'Spalte' : '');
  });
  writeStorage(target === 'handbook' ? STORAGE_KEYS.handbook : STORAGE_KEYS.price, data);
  target === 'handbook' ? renderHandbookBlocks() : renderPriceBlocks();
}

function saveTableBlock(blockId, target) {
  const data = target === 'handbook' ? handbookData : priceData;
  const block = data.find((item) => item.id === blockId);
  if (!block) return;
  const container = document.querySelector(`#${target}Blocks .block:nth-child(${data.indexOf(block) + 1})`);
  const table = container.querySelector('table');
  const rows = Array.from(table.querySelectorAll('tr'));
  block.table = rows.map((row) => {
    return Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent.trim());
  });
  writeStorage(target === 'handbook' ? STORAGE_KEYS.handbook : STORAGE_KEYS.price, data);
  alert('Tabelle gespeichert.');
}

function deleteBlock(blockId, target) {
  if (!confirm('Block wirklich löschen?')) return;
  if (target === 'handbook') {
    handbookData = handbookData.filter((block) => block.id !== blockId);
    writeStorage(STORAGE_KEYS.handbook, handbookData);
    renderHandbookBlocks();
  } else {
    priceData = priceData.filter((block) => block.id !== blockId);
    writeStorage(STORAGE_KEYS.price, priceData);
    renderPriceBlocks();
  }
}

function addContentBlock(target, type) {
  const data = target === 'handbook' ? handbookData : priceData;
  const title = type === 'text' ? 'Neues Textfeld' : 'Neue Tabelle';
  const block = {
    id: generateId(),
    title,
    type,
    content: type === 'text' ? 'Neuer Inhalt' : undefined,
    table: type === 'table' ? [['Spalte 1', 'Spalte 2']] : undefined
  };
  data.push(block);
  writeStorage(target === 'handbook' ? STORAGE_KEYS.handbook : STORAGE_KEYS.price, data);
  target === 'handbook' ? renderHandbookBlocks() : renderPriceBlocks();
}

function renderDepartments() {
  document.getElementById('departmentAusbildung').value = departmentData.Ausbildungsplan;
  document.getElementById('departmentVeterinär').value = departmentData.Veterinär;
  document.getElementById('departmentPharmazie').value = departmentData.Pharmazie;
}

function saveDepartmentSection(section) {
  const field = document.getElementById(`department${section === 'Ausbildungsplan' ? 'Ausbildung' : section === 'Veterinär' ? 'Veterinär' : 'Pharmazie'}`);
  if (!field) return;
  departmentData[section] = field.value;
  writeStorage(STORAGE_KEYS.departments, departmentData);
  alert(`${section} gespeichert.`);
}

function renderReports() {
  reportList.innerHTML = '';
  reportsData.forEach((entry) => {
    const row = document.createElement('tr');
    const date = new Date(entry.uploadedAt).toLocaleString();
    row.innerHTML = `
      <td>${entry.name}</td>
      <td>${date}</td>
      <td>
        <a href="${entry.dataUrl}" download="${entry.name}">Herunterladen</a>
        <button class="danger">Löschen</button>
      </td>
    `;
    row.querySelector('button').addEventListener('click', () => deleteReport(entry.id));
    reportList.appendChild(row);
  });
}

function deleteReport(reportId) {
  reportsData = reportsData.filter((entry) => entry.id !== reportId);
  writeStorage(STORAGE_KEYS.reports, reportsData);
  renderReports();
}

function renderManagement() {
  const stationDistribution = STATIONS.map((station) => {
    const count = employees.filter((employee) => employee.station === station).length;
    return `${station}: ${count}`;
  }).join('\n');
  managementSummary.textContent = `Mitarbeiter gesamt: ${employees.length}\nBerichte: ${reportsData.length}\n${stationDistribution}`;
}

function handleReportUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    reportsData.push({
      id: generateId(),
      name: file.name,
      uploadedAt: Date.now(),
      dataUrl: reader.result
    });
    writeStorage(STORAGE_KEYS.reports, reportsData);
    renderReports();
    reportUpload.value = '';
  };
  reader.readAsDataURL(file);
}

function initializeAccountUI() {
  if (!currentUser) return;
  currentUserName.textContent = `${currentUser.name} (${currentUser.rank})`;
  if (accountUserName) accountUserName.textContent = currentUser.name;
  if (accountUserRank) accountUserRank.textContent = `Rang: ${currentUser.rank}`;
  if (accountUserStation) accountUserStation.textContent = `Station: ${currentUser.station}`;
}

function updateLoginState() {
  if (currentUser) {
    loginPage.classList.add('hidden');
    appPage.classList.remove('hidden');
    initializeAccountUI();
    renderAllEmployeeViews();
    renderHandbookBlocks();
    renderPriceBlocks();
    renderDepartments();
    renderReports();
    showPage('dashboardPage');
  } else {
    loginPage.classList.remove('hidden');
    appPage.classList.add('hidden');
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  console.log('[login] attempt for username:', username);
  console.log('[login] available users:', employees.map(u => ({ username: u.username, id: u.id })));
  const employee = employees.find(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password
  );
  if (!employee) {
    loginError.textContent = 'Ungültige Anmeldedaten.';
    return;
  }
  currentUser = employee;
  saveCurrentUser();
  loginError.textContent = '';
  updateLoginState();
});

function autoLoginAdmin() {
  let admin = employees.find(u => u.username && u.username.toLowerCase() === 'admin');
  if (!admin) {
    admin = { id: generateId(), name: 'Admin Leitung', username: 'admin', password: 'admin', station: 'Saint Denis', rank: 'Direktion', status: 'Im Dienst', training: [], sanctions: [], messages: [] };
    employees.push(admin);
    saveEmployees();
  }
  currentUser = admin;
  saveCurrentUser();
  console.log('[debug] autoLoginAdmin -> logged in as', admin.username);
  updateLoginState();
}

const autoLoginBtn = document.getElementById('autoLoginDev');
if (autoLoginBtn) {
  autoLoginBtn.addEventListener('click', () => {
    autoLoginAdmin();
  });
}

logoutButton.addEventListener('click', () => {
  currentUser = null;
  writeStorage(STORAGE_KEYS.currentUser, null);
  updateLoginState();
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showPage(button.dataset.page);
    if (topNav) {
      topNav.classList.remove('visible');
      topNav.classList.add('hidden');
    }
  });
});

function positionTopNav() {
  if (!topNav || !menuToggle) return;
  const rect = menuToggle.getBoundingClientRect();
  const panelWidth = Math.min(280, window.innerWidth - 32);
  const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
  const top = Math.min(rect.bottom + 10, window.innerHeight - topNav.offsetHeight - 16);
  topNav.style.left = `${left}px`;
  topNav.style.top = `${top}px`;
}

if (menuToggle) {
  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!topNav) return;
    positionTopNav();
    topNav.classList.toggle('visible');
    topNav.classList.toggle('hidden', !topNav.classList.contains('visible'));
  });
}

if (closeTopNav) {
  closeTopNav.addEventListener('click', () => {
    if (!topNav) return;
    topNav.classList.remove('visible');
    topNav.classList.add('hidden');
  });
}

window.addEventListener('resize', () => {
  if (topNav && topNav.classList.contains('visible')) {
    positionTopNav();
  }
});

document.addEventListener('click', (event) => {
  if (topNav && !topNav.contains(event.target) && event.target !== menuToggle) {
    topNav.classList.remove('visible');
    topNav.classList.add('hidden');
  }
});

// Filter dropdowns were removed from the UI. Station summary controls the station filter now.

employeeSelect.addEventListener('change', () => {
  handleEmployeeSelection();
  renderSelectedEmployeeInfo();
});

if (headerSearch) {
  headerSearch.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderStationSummary();
    renderEmployeeList();
  });
}

messageRecipientType.addEventListener('change', updateMessageTargetGroups);
messageTrainingFilter.addEventListener('change', updateMessageRecipientPreview);
messageEmployeeFilter.addEventListener('change', updateMessageRecipientPreview);
notificationBell.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleNotificationPanel();
});

if (currentUserName) {
  currentUserName.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleAccountPanel();
  });
}

if (closeNotificationPanel) {
  closeNotificationPanel.addEventListener('click', () => {
    if (notificationPanel) {
      notificationPanel.classList.remove('visible');
      notificationPanel.classList.add('hidden');
    }
  });
}

if (closeAccountPanel) {
  closeAccountPanel.addEventListener('click', () => {
    if (accountPanel) {
      accountPanel.classList.remove('visible');
      accountPanel.classList.add('hidden');
    }
  });
}

if (openDashboardPage) {
  openDashboardPage.addEventListener('click', () => {
    showPage('dashboardPage');
    if (accountPanel) {
      accountPanel.classList.remove('visible');
      accountPanel.classList.add('hidden');
    }
  });
}

document.addEventListener('click', (event) => {
  const markReadButton = event.target.closest('.notification-mark-read');
  if (markReadButton) {
    event.stopPropagation();
    const messageId = markReadButton.dataset.messageId;
    removeCurrentUserMessage(messageId);
    return;
  }

  if (notificationPanel && !notificationPanel.contains(event.target) && event.target !== notificationBell) {
    notificationPanel.classList.remove('visible');
    notificationPanel.classList.add('hidden');
  }

  if (accountPanel && !accountPanel.contains(event.target) && event.target !== currentUserName) {
    accountPanel.classList.remove('visible');
    accountPanel.classList.add('hidden');
  }
});

document.getElementById('showHireForm').addEventListener('click', () => showActionForm('hireForm'));
document.getElementById('showTransferForm').addEventListener('click', () => showActionForm('transferForm'));
document.getElementById('showMessageForm').addEventListener('click', () => showActionForm('messageForm'));
document.getElementById('showPromoteForm').addEventListener('click', () => showActionForm('promoteForm'));
document.getElementById('showFireForm').addEventListener('click', () => showActionForm('fireForm'));

document.getElementById('hireEmployee').addEventListener('click', handleHire);
document.getElementById('transferEmployee').addEventListener('click', handleTransfer);
document.getElementById('sendMessage').addEventListener('click', handleSendMessage);
document.getElementById('promoteEmployee').addEventListener('click', handlePromote);
document.getElementById('fireEmployee').addEventListener('click', handleFire);
statusSelect.addEventListener('change', () => {
  if (!currentUser) return;
  currentUser.status = statusSelect.value;
  const employee = employees.find((item) => item.id === currentUser.id);
  if (employee) {
    employee.status = currentUser.status;
    saveEmployees();
    saveCurrentUser();
    renderDashboard();
    renderEmployeeList();
  }
});

Array.from(document.querySelectorAll('[data-add]')).forEach((button) => {
  button.addEventListener('click', () => {
    addContentBlock(button.dataset.target, button.dataset.add);
  });
});

Array.from(document.querySelectorAll('.saveDepartment')).forEach((button) => {
  button.addEventListener('click', () => saveDepartmentSection(button.dataset.section));
});

reportUpload.addEventListener('change', handleReportUpload);
updateSelectedStatus.addEventListener('click', () => {
  const employee = getSelectedEmployee();
  if (!employee) {
    alert('Bitte zuerst einen Mitarbeiter auswählen.');
    return;
  }
  employee.status = selectedEmployeeStatus.value;
  saveEmployees();
  renderAllEmployeeViews();
  alert('Status des Mitarbeiters wurde gespeichert.');
});
clearStorage.addEventListener('click', async () => {
  if (!confirm('Alle lokalen Daten wirklich zurücksetzen?')) return;
  await clearAllStorage();
  // fully reload to ensure a clean state
  location.reload();
});

async function startApp() {
  await initializeData();
  updateStatusOptions();
  initializeAccountUI();
  renderAllEmployeeViews();
  renderHandbookBlocks();
  renderPriceBlocks();
  renderDepartments();
  renderReports();
  renderSelectedEmployeeInfo();
  updateLoginState();
  renderManagement();
}

startApp();

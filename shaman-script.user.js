// ==UserScript==
// @name         yashamananeproger
// @author       Шаманы Северного клана
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      4.3
// @description  Некоторые полезные для шаманства функции
// @match        https://catwar.net/*
// @match        https://catwar.su/*
// @updateURL    https://github.com/north-shaman/healing-msg/raw/refs/heads/main/shaman-script.user.js
// @downloadURL  https://github.com/north-shaman/healing-msg/raw/refs/heads/main/shaman-script.user.js
// @icon         https://raw.githubusercontent.com/north-shaman/healing-msg/main/icon_leaf.png
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async function () {
  'use strict';

  // Настройки по умолчанию
  const DEFAULT_SETTINGS = {
    enableTemplates: true,
    enableIdColumn: true  // Функция ID столбца включена по умолчанию
  };

  // Загрузка настроек
  function loadSettings() {
    const savedSettings = GM_getValue('shaman_settings');
    return { ...DEFAULT_SETTINGS, ...savedSettings };
  }

  // Сохранение настроек
  function saveSettings(settings) {
    GM_setValue('shaman_settings', settings);
  }

  // Флаг для отслеживания создания панели
  let panelCreated = false;
  let panelCreationInProgress = false;

  // Создание панели управления на странице списка ЛС
  function createControlPanel() {
    // Если уже создаем или уже создана
    if (panelCreationInProgress || panelCreated) return;

    // Проверяем, находимся ли на странице списка ЛС
    if (!window.location.pathname.includes('/ls')) return;

    const pageForm = document.querySelector('form#page_form');
    if (!pageForm) return;

    // Проверяем, не добавлена ли уже панель
    if (document.querySelector('.shaman-controls')) {
      panelCreated = true;
      return;
    }

    panelCreationInProgress = true;

    const settings = loadSettings();

    // Создаем контейнер для переключателей
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'shaman-controls';
    controlsDiv.style.margin = '10px 0';
    controlsDiv.style.padding = '10px';
    controlsDiv.style.border = '1px solid #ccc';
    controlsDiv.style.borderRadius = '5px';
    controlsDiv.style.backgroundColor = '#f9f9f9';
    controlsDiv.style.width = '300px'; // Фиксированная ширина
    controlsDiv.style.float = 'right'; // Прижимаем к правому краю
    controlsDiv.style.clear = 'both'; // Чтоб не наезжал на другие элементы

    // Заголовок
    const title = document.createElement('h4');
    title.textContent = 'Настройки шаманских функций';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '14px';
    controlsDiv.appendChild(title);

    // Переключатель для шаблонов
    const templatesLabel = document.createElement('label');
    templatesLabel.style.display = 'block';
    templatesLabel.style.marginBottom = '8px';
    templatesLabel.style.cursor = 'pointer';

    const templatesCheckbox = document.createElement('input');
    templatesCheckbox.type = 'checkbox';
    templatesCheckbox.checked = settings.enableTemplates;
    templatesCheckbox.style.marginRight = '8px';

    templatesCheckbox.addEventListener('change', function() {
      settings.enableTemplates = this.checked;
      saveSettings(settings);
      showStatus('Настройки сохранены!');

      // Если выключили шаблоны и select уже добавлен - удаляем его
      if (!settings.enableTemplates && isInitialized) {
        const select = document.querySelector('.shaman-select');
        if (select) select.remove();
        isInitialized = false;
      }
    });

    templatesLabel.appendChild(templatesCheckbox);
    templatesLabel.appendChild(document.createTextNode('Шаблоны для ЛС'));
    controlsDiv.appendChild(templatesLabel);

    // Переключатель для функции ID столбца
    const idColumnLabel = document.createElement('label');
    idColumnLabel.style.display = 'block';
    idColumnLabel.style.marginBottom = '8px';
    idColumnLabel.style.cursor = 'pointer';

    const idColumnCheckbox = document.createElement('input');
    idColumnCheckbox.type = 'checkbox';
    idColumnCheckbox.checked = settings.enableIdColumn;
    idColumnCheckbox.style.marginRight = '8px';

    idColumnCheckbox.addEventListener('change', function() {
      settings.enableIdColumn = this.checked;
      saveSettings(settings);
      showStatus('Настройки сохранены!');

      if (settings.enableIdColumn) {
        enableIdColumn();
      } else {
        disableIdColumn();
      }
    });

    idColumnLabel.appendChild(idColumnCheckbox);
    idColumnLabel.appendChild(document.createTextNode('Столбец с ID'));
    controlsDiv.appendChild(idColumnLabel);

    // Статус сообщение
    const statusDiv = document.createElement('div');
    statusDiv.className = 'shaman-status';
    statusDiv.style.marginTop = '10px';
    statusDiv.style.fontSize = '12px';
    statusDiv.style.color = '#666';
    statusDiv.style.display = 'none';
    controlsDiv.appendChild(statusDiv);

    // Функция показа статуса
    window.showStatus = function(message) {
      statusDiv.textContent = message;
      statusDiv.style.display = 'block';
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 2000);
    };

    // Вставляем после формы пагинации
    pageForm.parentNode.insertBefore(controlsDiv, pageForm.nextSibling);

    panelCreated = true;
    panelCreationInProgress = false;
  }

  // ========== ФУНКЦИЯ ID СТОЛБЦА ==========
  let idColumnObserver = null;
  let idColumnStyle = null;

  function enableIdColumn() {
    // Добавляем стиль для отступов ID столбца
    if (!idColumnStyle) {
      idColumnStyle = document.createElement('style');
      idColumnStyle.id = 'shaman-id-column-style';
      idColumnStyle.textContent = `
          td.ls-id-cell, th.ls-id-cell {
              padding-left: 15px !important;
              padding-right: 15px !important;
          }
      `;
      document.head.appendChild(idColumnStyle);
    }

    // Запускаем обработку таблицы
    processIdColumn();

    // Создаем MutationObserver для автоматической обработки при смене вкладок
    if (!idColumnObserver) {
      idColumnObserver = new MutationObserver(() => {
        processIdColumn();
      });

      idColumnObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  function disableIdColumn() {
    // Удаляем стиль
    if (idColumnStyle && idColumnStyle.parentNode) {
      idColumnStyle.parentNode.removeChild(idColumnStyle);
      idColumnStyle = null;
    }

    // Отключаем observer
    if (idColumnObserver) {
      idColumnObserver.disconnect();
      idColumnObserver = null;
    }

    // Удаляем добавленные столбцы ID
    removeIdColumns();
  }

  function removeIdColumns() {
    // Удаляем заголовок ID
    const headerTh = document.querySelector('th.ls-id-cell');
    if (headerTh && headerTh.parentNode) {
      headerTh.parentNode.removeChild(headerTh);
    }

    // Удаляем ячейки ID из всех строк
    const idCells = document.querySelectorAll('td.ls-id-cell');
    idCells.forEach(cell => {
      if (cell.parentNode) {
        cell.parentNode.removeChild(cell);
      }
    });
  }

  function processIdColumn() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) return;

    // Проверяем, нет ли уже нашего столбца ID
    const headerRow = rows[0];
    const headerCells = headerRow.querySelectorAll('th');

    let alreadyAdded = false;
    headerCells.forEach(th => {
      if (th.textContent.trim() === 'ID') {
        alreadyAdded = true;
      }
    });
    if (alreadyAdded) return;

    // Добавить заголовок "ID" после "Отправитель"
    const thSender = headerRow.querySelectorAll('th')[1];
    const thID = document.createElement('th');
    thID.textContent = 'ID';
    thID.classList.add('ls-id-cell');

    thSender.insertAdjacentElement('afterend', thID);

    // Обработать строки сообщений
    for (let i = 1; i < rows.length; i++) {
      const tr = rows[i];
      const tds = tr.querySelectorAll('td');
      if (tds.length < 2) continue;

      const senderCell = tds[1];
      const link = senderCell.querySelector('a');
      let idValue = '';

      if (link) {
        const href = link.getAttribute('href');
        const match = href.match(/cat(\d+)/);
        if (match) idValue = `[${match[1]}]`;
      }

      const tdID = document.createElement('td');
      tdID.textContent = idValue;
      tdID.classList.add('ls-id-cell');

      senderCell.insertAdjacentElement('afterend', tdID);
    }
  }

  // ========== ФУНКЦИЯ ШАБЛОНОВ ==========
  const templatesBaseUrl = 'https://raw.githubusercontent.com/north-shaman/healing-msg/main/';

  const templates = [
    { name: 'Костоправы', file: 'kostopravy.txt', subject: 'Время ношения костоправа' },
    { name: 'Костоправы (под камнем)', file: 'kostopravy-kamen.txt', subject: 'Время ношения костоправа' },
    { name: 'Костоправы (двойные)', file: 'kostopravy-dvoynye.txt', subject: 'Время ношения костоправа' },
    { name: 'Травы', file: 'travy.txt', subject: 'Лечение' },
    { name: 'Травы (под камнем)', file: 'travy-kamen.txt', subject: 'Лечение' },
    { name: 'Отработка', file: 'otrabotka.txt', subject: 'Лечение (отработка)' },
    { name: 'Выдача предметов', file: 'fond.txt', subject: 'Выдача предметов' },
    { name: 'Полученное лечение (раны/утопы)', file: 'rany.txt', subject: 'Полученное лечение' }
  ];

  let isInitializing = false;
  let isInitialized = false;

  async function loadTemplates() {
    const options = [{ text: 'Шаманское', value: '', subject: '' }];

    for (const template of templates) {
      const response = await fetch(`${templatesBaseUrl}${template.file}`);
      const text = await response.text();
      options.push({
        text: template.name,
        value: text.replace(/\n/g, '[br]'),
        subject: template.subject
      });
    }

    return options;
  }

  async function initSelect() {
    // Проверяем настройки
    const settings = loadSettings();
    if (!settings.enableTemplates) return;

    // Если уже инициализируем или уже инициализировано
    if (isInitializing || isInitialized) return;

    const textarea = document.querySelector('textarea[name="text"]');
    const subjectInput = document.querySelector('input[name="subject"]');

    if (!textarea || !subjectInput) return;

    // Проверяем, не добавлен ли уже select
    if (textarea.parentNode.querySelector('.shaman-select')) {
      isInitialized = true;
      return;
    }

    isInitializing = true;

    try {
      const options = await loadTemplates();
      const select = document.createElement('select');
      select.className = 'shaman-select';
      select.style.marginTop = '10px';

      options.forEach(function (option) {
        const optionElement = document.createElement('option');
        optionElement.text = option.text;
        optionElement.value = option.value;
        optionElement.subject = option.subject;
        select.add(optionElement);
      });

      textarea.parentNode.insertBefore(select, textarea.nextSibling);

      select.addEventListener('change', function (event) {
        event.stopPropagation();
        const selectedOption = select.options[select.selectedIndex];
        textarea.value = selectedOption.value;
        subjectInput.value = selectedOption.subject;
      });

      isInitialized = true;
    } catch (error) {
      console.error('Ошибка при загрузке шаблонов:', error);
    } finally {
      isInitializing = false;
    }
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ==========

  // Инициализация панели управления (однократно)
  setTimeout(() => {
    createControlPanel();

    // Запускаем функции если они включены
    const settings = loadSettings();
    if (settings.enableIdColumn) {
      enableIdColumn();
    }
  }, 800); // Увеличил задержку для надежности

  // MutationObserver для панели управления с debounce
  let panelTimeoutId = null;
  const panelObserver = new MutationObserver(function() {
    if (panelTimeoutId) clearTimeout(panelTimeoutId);

    panelTimeoutId = setTimeout(() => {
      if (window.location.pathname.includes('/ls') && !panelCreated) {
        createControlPanel();
      }
    }, 500); // Debounce 500ms
  });

  panelObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // MutationObserver для шаблонов с debounce
  let templatesTimeoutId = null;
  const templatesObserver = new MutationObserver(function() {
    if (templatesTimeoutId) clearTimeout(templatesTimeoutId);

    templatesTimeoutId = setTimeout(() => {
      if (!isInitialized) {
        initSelect();
      }
    }, 200);
  });

  templatesObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Инициализация шаблонов
  setTimeout(initSelect, 300);

})();

// Я люблю свою луну-шаманку ♥

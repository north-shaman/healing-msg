// ==UserScript==
// @name         yashamananeproger
// @author       Шаманы Северного клана
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      4.2
// @description  Добавляет автоматическую вставку шаманских шаблонов на страницу написания личного сообщения. Спасибо Древоточцу за создание кода! Лапки к развитию приложили Грёзы Юности и Полуденье.
// @match        https://catwar.net/*
// @match        https://catwar.su/*
// @updateURL    https://github.com/north-shaman/healing-msg/raw/refs/heads/main/shaman-script.user.js
// @downloadURL  https://github.com/north-shaman/healing-msg/raw/refs/heads/main/shaman-script.user.js
// @icon         https://raw.githubusercontent.com/north-shaman/healing-msg/main/icon_leaf.png
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function () {
  'use strict';

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

  // Начальная инициализация с задержкой
  setTimeout(initSelect, 300);

  // MutationObserver с debounce
  let timeoutId = null;
  const observer = new MutationObserver(function() {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (!isInitialized) {
        initSelect();
      }
    }, 200);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();

(function() {
    'use strict';

    // --- Добавляем стиль для отступов ID столбца ---
    const style = document.createElement('style');
    style.textContent = `
        td.ls-id-cell, th.ls-id-cell {
            padding-left: 15px !important;
            padding-right: 15px !important;
        }
    `;
    document.head.appendChild(style);


    // --- Основная функция обработки таблицы ---
    function processTable() {
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

        // --- Добавить заголовок "ID" после "Отправитель" ---
        const thSender = headerRow.querySelectorAll('th')[1];
        const thID = document.createElement('th');
        thID.textContent = 'ID';
        thID.classList.add('ls-id-cell');

        thSender.insertAdjacentElement('afterend', thID);

        // --- Обработать строки сообщений ---
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

    // --- Запускаем сразу ---
    processTable();

    // --- MutationObserver: автоматическая обработка при смене вкладок /ls ---
    const observer = new MutationObserver(() => {
        processTable();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();

// Я люблю свою луну-шаманку ♥

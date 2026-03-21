// ==UserScript==
// @name         warningshaman
// @author       Шаманы Северного клана
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      4.3
// @description  Предупреждения от работников Прочной ниши
// @match        https://catwar.net/*
// @match        https://catwar.su/*
// @updateURL    https://github.com/north-shaman/healing-msg/raw/refs/heads/main/warning-scripts.user.js
// @downloadURL  https://github.com/north-shaman/healing-msg/raw/refs/heads/main/warning-scripts.user.js
// @icon         https://raw.githubusercontent.com/north-shaman/healing-msg/main/icon_leaf.png
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
  // ========== ФУНКЦИЯ ШАБЛОНОВ ==========
  const templatesBaseUrl = 'https://raw.githubusercontent.com/north-shaman/healing-msg/main/';

  const templates = [
    { name: 'Оставленный ресурс', file: 'lost-herbs.txt', subject: 'Предупреждение' },
    { name: 'Заход в Прочную нишу', file: 'zahod.txt', subject: 'Предупреждение' },
  ];

  let isInitializing = false;
  let isInitialized = false;

  async function loadTemplates() {
    const options = [{ text: 'Предупреждения', value: '', subject: '' }];

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
      console.log('✅ Шаблоны успешно загружены и инициализированы');
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
      console.log('✅ Шаблоны успешно загружены и инициализированы');
    } catch (error) {
      console.error('❌ Ошибка при загрузке шаблонов:', error);
    } finally {
      isInitializing = false;
    }
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ==========

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
  setTimeout(() => {
    initSelect();
  }, 300);
})();

// Я люблю свою луну-шаманку ♥

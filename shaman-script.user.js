// ==UserScript==
// @name         yashamananeproger
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      4.1
// @description  Добавляет автоматическую вставку шаманских шаблонов на страницу написания личного сообщения. Спасибо Древоточцу за создание кода! Лапки к созданию приложили Грёзы Юности и Полуденье.
// @match        https://catwar.net/*
// @match        https://catwar.su/*
// @updateURL    https://github.com/north-shaman/healing-msg/raw/refs/heads/main/shaman-script.user.js
// @downloadURL  https://github.com/north-shaman/healing-msg/raw/refs/heads/main/shaman-script.user.js
// @icon         https://raw.githubusercontent.com/north-shaman/healing-msg/main/leaf_8384615.png
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function () {
  'use strict';

  setTimeout(async function () {
    const select = document.createElement('select');
    select.style.marginTop = '10px';

    // Загрузка шаблонов
    const options = await loadTemplates();

    // Заполнение списка
    options.forEach(function (option) {
      const optionElement = document.createElement('option');
      optionElement.text = option.text;
      optionElement.value = option.value;
      optionElement.subject = option.subject;
      select.add(optionElement);
    });

    const textarea = document.querySelector('textarea[name="text"]');
    const subjectInput = document.querySelector('input[name="subject"]');

    textarea.parentNode.insertBefore(select, textarea.nextSibling);

    select.addEventListener('change', function (event) {
      event.stopPropagation();
      const selectedOption = select.options[select.selectedIndex];
      textarea.value = selectedOption.value;
      subjectInput.value = selectedOption.subject;
    });
  }, 100);


const templatesBaseUrl = 'https://raw.githubusercontent.com/north-shaman/healing-msg/main/';

const templates = [
  { name: 'Костоправы', file: 'kostopravy.txt', subject: 'Время ношения костоправа' },
  { name: 'Костоправы (под камнем)', file: 'kostopravy-kamen.txt', subject: 'Время ношения костоправа' },
  { name: 'Травы', file: 'travy.txt', subject: 'Лечение' },
  { name: 'Травы (под камнем)', file: 'travy-kamen.txt', subject: 'Лечение' },
  { name: 'Отработка', file: 'otrabotka.txt', subject: 'Лечение (отработка)' }
];

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

})();

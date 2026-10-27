(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.getElementById('modeToggle');
  var modeKey = 'kivi-ui-mode-v1';

  function readMode() {
    try { return localStorage.getItem(modeKey); } catch (error) { return null; }
  }

  function writeMode(value) {
    try { localStorage.setItem(modeKey, value); } catch (error) {}
  }

  var savedMode = readMode();
  var active = savedMode === 'material3' || savedMode === 'miui';

  var originalAudio = document.getElementById('player');
  var materialAudio = document.getElementById('m3-player');

  function setMode(useMaterial) {
    active = Boolean(useMaterial);
    if (active && originalAudio && !originalAudio.paused) originalAudio.pause();
    if (!active && materialAudio && !materialAudio.paused) materialAudio.pause();
    root.classList.toggle('material3-mode', active);
    if (toggle) {
      toggle.setAttribute('aria-pressed', active ? 'true' : 'false');
      toggle.setAttribute('aria-label', active ? 'Вернуться к оконному режиму' : 'Включить M3 Expressive');
      toggle.textContent = active ? 'Оконный режим' : 'M3 Expressive';
    }
    writeMode(active ? 'material3' : 'windows');
  }

  if (toggle) toggle.addEventListener('click', function () { setMode(!active); });
  setMode(active);

  var audio = document.getElementById('m3-player');
  var musicStatus = document.getElementById('m3-music-status');
  Array.prototype.forEach.call(document.querySelectorAll('[data-m3-track]'), function (button) {
    button.addEventListener('click', function () {
      if (!audio) return;
      var path = button.getAttribute('data-m3-track');
      audio.src = path;
      if (musicStatus) musicStatus.textContent = 'Загрузка: ' + path.split('/').pop().replace(/\.mp3$/i, '').replace(/[-_]/g, ' ');
      var result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          if (musicStatus) musicStatus.textContent = 'Не удалось воспроизвести файл: ' + path;
        });
      }
    });
  });

  var field = document.getElementById('m3-command');
  var output = document.getElementById('m3-output');
  var runButton = document.getElementById('m3-run-command');
  var history = [];
  var historyIndex = 0;

  function addOutput(text, append) {
    if (!output) return;
    if (!append) output.textContent = '';
    output.textContent += (output.textContent ? '\n' : '') + text;
    output.scrollTop = output.scrollHeight;
  }

  function runCommand() {
    if (!field || !output) return;
    var value = String(field.value || '').trim();
    addOutput('$ ' + value, !output.dataset.started);
    output.dataset.started = '1';
    if (!value) { field.value = ''; return; }
    history.push(value);
    historyIndex = history.length;
    var parts = value.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1).join(' ');
    var answers = {
      help: 'about, whoami, devices, github, tg, projects, theme, date, clear, echo',
      about: 'Kivi, Санкт-Петербург. Пишу опенсорс-программы.',
      whoami: 'kivi',
      devices: 'Sony VAIO VPC-SE, CMF Phone 2 Pro, Samsung Galaxy A8',
      github: 'https://github.com/134rt5yt-svg',
      tg: 'https://t.me/kividev',
      projects: 'T3KOT: https://github.com/134rt5yt-svg/T3KOT\nmzvpn: https://github.com/134rt5yt-svg/mzvpn',
      theme: 'Оформление сайта переключается кнопкой в правом нижнем углу.',
      date: new Date().toLocaleString('ru-RU'),
      sudo: 'kivi нет в файле sudoers. Об этом инциденте сообщат.'
    };
    if (name === 'clear') {
      output.textContent = '';
      output.dataset.started = '';
    } else if (name === 'echo') {
      addOutput(args, true);
    } else if (Object.prototype.hasOwnProperty.call(answers, name)) {
      addOutput(answers[name], true);
    } else {
      addOutput('команда не найдена: ' + name + ' (help)', true);
    }
    field.value = '';
    if (typeof field.focus === 'function') field.focus();
  }

  if (runButton) runButton.addEventListener('click', runCommand);
  if (field) {
    field.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        runCommand();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex > 0) field.value = history[--historyIndex];
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        historyIndex = Math.min(historyIndex + 1, history.length);
        field.value = history[historyIndex] || '';
      }
    });
  }
})();

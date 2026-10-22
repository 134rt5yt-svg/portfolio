(function () {
  'use strict';

  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
  var root = document.documentElement;
  var isDesk = function () { return matchMedia('(min-width:1400px)').matches; };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var storage = {
    get: function (key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch (error) { return null; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
    }
  };

  var canvas = $('#bg');
  var context = canvas ? canvas.getContext('2d') : null;
  var width = 0;
  var height = 0;
  var ratio = 1;
  var accent = '169,212,94';
  var foreground = '41,44,36';

  function parseColor(name, fallback) {
    var value = getComputedStyle(root).getPropertyValue(name).trim();
    var hex = /^#([0-9a-f]{6})$/i.exec(value);
    if (hex) {
      return [0, 2, 4].map(function (offset) { return parseInt(hex[1].slice(offset, offset + 2), 16); }).join(',');
    }
    var rgb = /^rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)$/i.exec(value);
    return rgb ? rgb[1] + ',' + rgb[2] + ',' + rgb[3] : fallback;
  }

  function updateColors() {
    accent = parseColor('--acc', accent);
    foreground = parseColor('--fg', foreground);
  }

  function drawContour(centerX, centerY, radiusX, radiusY, phase, index) {
    var steps = 56;
    context.beginPath();
    for (var i = 0; i <= steps; i++) {
      var angle = i / steps * Math.PI * 2;
      var shape = 1 + Math.sin(angle * 3 + phase) * .035 + Math.cos(angle * 5 - phase) * .02;
      var x = centerX + Math.cos(angle) * radiusX * shape;
      var y = centerY + Math.sin(angle) * radiusY * shape;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.strokeStyle = 'rgba(' + (index % 4 === 0 ? accent : foreground) + ',' + (index % 4 === 0 ? '.19' : '.075') + ')';
    context.lineWidth = index % 4 === 0 ? 1 : .7;
    context.stroke();
  }

  function drawWallpaper() {
    if (!context || !width || !height) return;
    context.clearRect(0, 0, width, height);
  }

  function resizeCanvas() {
    if (!canvas || !context) return;
    ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawWallpaper();
  }

  updateColors();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  var themeQuery = matchMedia('(prefers-color-scheme: dark)');
  if (themeQuery.addEventListener) {
    themeQuery.addEventListener('change', function () {
      updateColors();
      drawWallpaper();
    });
  }

  var toastElement = $('#toast');
  var toastTimer;

  function toast(message) {
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastElement.classList.remove('on'); }, 1800);
  }

  var wins = $$('.win');
  var zIndex = 10;
  var windowWidths = {
    'w-about': 320,
    'w-devices': 420,
    'w-social': 350,
    'w-proj': 340,
    'w-music': 340,
    'w-term': 380
  };
  var savedPositions = storage.get('kivi-pos-v2') || {};

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(value, maximum));
  }

  function bringToFront(win) {
    win.style.zIndex = ++zIndex;
  }

  function positionWindows() {
    wins.forEach(function (win) {
      if (!isDesk()) {
        win.style.left = '';
        win.style.top = '';
        win.style.width = '';
        return;
      }
      var defaults = [
        parseInt(getComputedStyle(win).getPropertyValue('--x') || '36', 10),
        parseInt(getComputedStyle(win).getPropertyValue('--y') || '36', 10)
      ];
      var position = savedPositions[win.id] || defaults;
      var winWidth = windowWidths[win.id] || 360;
      win.style.width = winWidth + 'px';
      win.style.left = clamp(position[0], 0, Math.max(0, innerWidth - winWidth - 8)) + 'px';
      win.style.top = clamp(position[1], 0, Math.max(0, innerHeight - 90)) + 'px';
    });
  }

  positionWindows();
  window.addEventListener('resize', positionWindows, { passive: true });

  var resume = $('#resume');

  function updateResume() {
    resume.hidden = !wins.every(function (win) { return win.hidden; });
  }

  function reopen(win) {
    win.hidden = false;
    bringToFront(win);
    if (!reduce) {
      win.style.animation = 'none';
      void win.offsetWidth;
      win.style.animation = '';
    }
  }

  function openAll() {
    wins.forEach(reopen);
    resume.hidden = true;
    positionWindows();
  }

  resume.addEventListener('click', openAll);
  resume.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAll();
    }
  });

  wins.forEach(function (win) {
    var bar = $('.bar', win);
    var closeButton = $('.x', win);
    win.addEventListener('pointerdown', function () { bringToFront(win); });
    closeButton.addEventListener('click', function () {
      win.hidden = true;
      updateResume();
    });
    bar.addEventListener('pointerdown', function (event) {
      if (!isDesk() || event.target.closest('button')) return;
      var rect = win.getBoundingClientRect();
      var offsetX = event.clientX - rect.left;
      var offsetY = event.clientY - rect.top;
      bar.setPointerCapture(event.pointerId);
      win.classList.add('drag');

      function move(moveEvent) {
        win.style.left = clamp(moveEvent.clientX - offsetX, 0, Math.max(0, innerWidth - win.offsetWidth)) + 'px';
        win.style.top = clamp(moveEvent.clientY - offsetY, 0, Math.max(0, innerHeight - 55)) + 'px';
      }

      function end() {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', end);
        bar.removeEventListener('pointercancel', end);
        win.classList.remove('drag');
        savedPositions[win.id] = [parseInt(win.style.left, 10), parseInt(win.style.top, 10)];
        storage.set('kivi-pos-v2', savedPositions);
      }

      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', end);
      bar.addEventListener('pointercancel', end);
    });
  });

  $$('.dev').forEach(function (device) {
    device.addEventListener('click', function () {
      var hint = $('#hint');
      if (hint) hint.textContent = device.getAttribute('data-say') || '';
    });
  });

  var player = $('#player');
  var tracksList = $('#tracks');
  var coverbg = $('#coverbg');
  var musicWin = $('#w-music');
  var playlist = [
    'music/effycore.mp3',
    'music/ski_slopes.mp3',
    'music/Dog_Tag_freestyle.mp3'
  ];

  var trackName = function (path) {
    return path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  };

  var coverFor = function (path) {
    return path.replace(/\.[^.]+$/, '.jpg');
  };

  function setCover(path) {
    if (!coverbg || !musicWin) return;
    var url = coverFor(path);
    var image = new Image();
    image.onload = function () {
      coverbg.style.backgroundImage = 'url("' + url + '")';
      musicWin.classList.add('has-cover');
    };
    image.onerror = function () {
      coverbg.style.backgroundImage = '';
      musicWin.classList.remove('has-cover');
    };
    image.src = url;
  }

  if (player && tracksList) {
    playlist.forEach(function (path, index) {
      var item = document.createElement('li');
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = trackName(path);
      button.setAttribute('data-i', index);
      item.appendChild(button);
      tracksList.appendChild(item);
    });

    tracksList.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      $$('#tracks button').forEach(function (element) {
        element.classList.toggle('on', element === button);
      });
      var index = parseInt(button.getAttribute('data-i'), 10);
      setCover(playlist[index]);
      player.src = playlist[index];
      player.play().catch(function () {
        toast('не найден: ' + playlist[index]);
      });
    });

    player.addEventListener('ended', function () {
      var current = $$('#tracks button').findIndex(function (element) { return element.classList.contains('on'); });
      var next = current + 1;
      if (next >= playlist.length) next = 0;
      var button = $('#tracks button[data-i="' + next + '"]');
      if (button) button.click();
    });
  }

  $$('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-copy');
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        toast('Скопируй вручную: ' + value);
        return;
      }
      navigator.clipboard.writeText(value).then(function () {
        toast('Скопировано: ' + value);
      }).catch(function () {
        toast('Скопируй вручную: ' + value);
      });
    });
  });

  var output = $('#out');
  var commandInput = $('#cmd');
  var commandHistory = [];
  var historyIndex = 0;

  function escapeHTML(value) {
    return String(value).replace(/[&<>]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character];
    });
  }

  function printLine(html, className) {
    var line = document.createElement('div');
    line.className = 'l ' + (className || '');
    line.innerHTML = html;
    output.appendChild(line);
    $('#termBody').scrollTop = $('#termBody').scrollHeight;
  }

  var commands = {
    help: function () { printLine('about, whoami, devices, github, tg, ring, projects, theme, date, clear'); },
    about: function () { printLine('Kivi, Санкт-Петербург. Пишу опенсорс-программы.'); },
    whoami: function () { printLine('kivi'); },
    devices: function () { printLine('Sony VAIO, CMF Phone 2 Pro, Samsung Galaxy A8'); },
    github: function () { printLine('<a href="https://github.com/134rt5yt-svg" target="_blank" rel="noopener">github.com/134rt5yt-svg</a>'); },
    tg: function () { printLine('<a href="https://t.me/kividev" target="_blank" rel="noopener">t.me/kividev</a>'); },
    projects: function () {
      printLine(
        'T3KOT: <a href="https://github.com/134rt5yt-svg/T3KOT" target="_blank" rel="noopener">github.com/134rt5yt-svg/T3KOT</a>\n' +
        'mzvpn: <a href="https://github.com/134rt5yt-svg/mzvpn" target="_blank" rel="noopener">github.com/134rt5yt-svg/mzvpn</a>\n' +
        'T3KOTsite: <a href="https://github.com/134rt5yt-svg/T3KOTsite" target="_blank" rel="noopener">github.com/134rt5yt-svg/T3KOTsite</a>'
      );
    },
    ring: function () { printLine('<a href="гей.html" target="_blank" rel="noopener">нету</a>'); },
    theme: function () { printLine('Тема меняется вместе с настройкой оформления системы.', 'dim'); },
    clear: function () { output.innerHTML = ''; },
    date: function () { printLine(escapeHTML(new Date().toLocaleString('ru-RU'))); },
    sudo: function () { printLine('kivi нет в файле sudoers. Об этом инциденте сообщат.', 'dim'); }
  };

  function runCommand(value) {
    var line = value.trim();
    printLine('<span class="pr">$</span> ' + escapeHTML(line));
    if (!line) return;
    var parts = line.split(/\s+/);
    var name = parts[0].toLowerCase();
    if (name === 'echo') {
      printLine(escapeHTML(parts.slice(1).join(' ')));
      return;
    }
    if (commands[name]) commands[name]();
    else printLine('команда не найдена: ' + escapeHTML(name) + ' (help)', 'dim');
  }

  printLine('Напиши help.', 'dim');

  $('#termForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var value = commandInput.value;
    if (value.trim()) {
      commandHistory.push(value);
      historyIndex = commandHistory.length;
    }
    runCommand(value);
    commandInput.value = '';
  });

  commandInput.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex > 0) commandInput.value = commandHistory[--historyIndex];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      historyIndex = Math.min(historyIndex + 1, commandHistory.length);
      commandInput.value = commandHistory[historyIndex] || '';
    }
  });

  $('#termBody').addEventListener('click', function (event) {
    if (!event.target.closest('a')) commandInput.focus();
  });
})();

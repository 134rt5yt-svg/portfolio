(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.getElementById('modeToggle');
  var windows = Array.prototype.slice.call(document.querySelectorAll('.win'));
  var resume = document.getElementById('resume');
  var modeKey = 'kivi-ui-mode-v1';
  var visibilityKey = 'kivi-window-visibility-v1';

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
  }

  var mode = read(modeKey, 'windows') === 'miui';
  var previousVisibility = read(visibilityKey, null);

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', mode ? 'true' : 'false');
    toggle.setAttribute('aria-label', mode ? 'Вернуться к оконному режиму' : 'Включить режим MIUI 14');
    toggle.title = mode ? 'Вернуться к оконному режиму' : 'Включить режим MIUI 14';
    toggle.innerHTML = mode
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="8" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="4" width="8" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="13" width="8" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="13" width="8" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><span>Оконный режим</span>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 18.2h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span>MIUI 14</span>';
  }

  function activateInitialMode() {
    root.classList.toggle('miui-mode', mode);
    if (mode) {
      windows.forEach(function (win) { win.hidden = false; });
      if (resume) resume.hidden = true;
    }
    updateToggle();
  }

  function switchMode() {
    if (!mode) {
      previousVisibility = {};
      windows.forEach(function (win) {
        previousVisibility[win.id] = win.hidden;
        win.hidden = false;
      });
      write(visibilityKey, previousVisibility);
      mode = true;
      root.classList.add('miui-mode');
      if (resume) resume.hidden = true;
    } else {
      mode = false;
      root.classList.remove('miui-mode');
      windows.forEach(function (win) {
        win.hidden = previousVisibility && Object.prototype.hasOwnProperty.call(previousVisibility, win.id)
          ? Boolean(previousVisibility[win.id])
          : false;
      });
      if (resume) resume.hidden = !windows.every(function (win) { return win.hidden; });
    }
    write(modeKey, mode ? 'miui' : 'windows');
    updateToggle();
  }

  activateInitialMode();
  if (toggle) toggle.addEventListener('click', switchMode);
})();

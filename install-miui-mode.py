from pathlib import Path
import shutil
import sys

root = Path.cwd()
index = root / "index.html"
if not index.exists():
    print("Не найден index.html. Запусти установщик в корне репозитория portfolio.")
    sys.exit(1)

source_dir = Path(__file__).resolve().parent
for name in ("miui-mode.css", "miui-mode.js"):
    source = source_dir / name
    destination = root / name
    if source.resolve() != destination.resolve():
        if not source.exists():
            print(f"Не найден файл {name}. Распакуй весь набор в корень репозитория.")
            sys.exit(1)
        shutil.copy2(source, destination)

html = index.read_text(encoding="utf-8")
if 'id="modeToggle"' in html or 'miui-mode.css' in html:
    print("Похоже, режим MIUI уже установлен. Повторное изменение не требуется.")
    sys.exit(0)

checks = (
    '<link rel="stylesheet" href="style.css">',
    '<script src="script.js" defer></script>',
    '<main class="desk" id="desk">',
    '</body>'
)
if not all(token in html for token in checks):
    print("Структура index.html отличается от ожидаемой. Файл оставлен без изменений.")
    sys.exit(1)

backup = root / "index.html.before-miui.bak"
if not backup.exists():
    shutil.copy2(index, backup)

html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    '<link rel="stylesheet" href="style.css">\n  <link rel="stylesheet" href="miui-mode.css">',
    1
)

header = '''  <header class="miui-header" id="top">
    <div class="miui-statusline">
      <a class="miui-mark" href="#top" aria-label="В начало">k</a>
      <span class="miui-status-label">PERSONAL SPACE</span>
      <span class="miui-mode-tag">MIUI 14 · INSPIRED</span>
    </div>
    <div class="miui-hero">
      <div>
        <p class="miui-kicker">PORTFOLIO / OPEN SOURCE</p>
        <h1>Привет, я Kivi.</h1>
        <p class="miui-subtitle">Проекты, устройства и немного терминала.</p>
      </div>
      <a class="miui-github" href="https://github.com/134rt5yt-svg" target="_blank" rel="noopener">Мой GitHub <span aria-hidden="true">↗</span></a>
    </div>
    <nav class="miui-nav" aria-label="Навигация по портфолио">
      <a href="#w-about">Обо мне</a>
      <a href="#w-devices">Устройства</a>
      <a href="#w-proj">Проекты</a>
      <a href="#w-social">Контакты</a>
      <a href="#w-music">Музыка</a>
      <a href="#w-term">Терминал</a>
    </nav>
  </header>

'''
html = html.replace('<main class="desk" id="desk">', header + '<main class="desk" id="desk">', 1)

toggle = '''  <button class="mode-toggle" id="modeToggle" type="button" aria-pressed="false" aria-label="Включить режим MIUI 14" title="Включить режим MIUI 14">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 18.2h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
    <span>MIUI 14</span>
  </button>
  <script src="miui-mode.js" defer></script>
'''
html = html.replace('</body>', toggle + '</body>', 1)
index.write_text(html, encoding="utf-8")

print("Режим MIUI 14 установлен. Резервная копия: index.html.before-miui.bak")

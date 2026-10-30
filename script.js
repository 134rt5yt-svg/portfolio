(function () {
  function cover(id) {
    var covers = {
      t3kot: ["assets/cover-t3kot.jpg", "T3KOT"],
      mzvpn: ["assets/cover-mzvpn.jpg", "mzvpn"],
      t3kotsite: ["assets/cover-t3kotsite.jpg", "T3KOTsite"]
    };
    var item = covers[id] || covers.t3kot;
    return "<img src='" + item[0] + "' alt='Обложка проекта " + item[1] + "' loading='lazy' width='200' height='200'>";
  }
  document.querySelectorAll('[data-cover]').forEach(function (el) {
    el.innerHTML = cover(el.getAttribute('data-cover'));
  });

  var titles = { home: 'Портфолио', projects: 'Проекты', links: 'GitHub' };
  var views = Object.keys(titles);
  function route() {
    var h = location.hash.replace('#', '');
    if (views.indexOf(h) < 0) h = 'home';
    views.forEach(function (v) { document.getElementById('view-' + v).hidden = v !== h; });
    document.getElementById('ttl-text').textContent = titles[h];
    document.querySelectorAll('#nav a').forEach(function (a) {
      if (a.getAttribute('data-v') === h) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();

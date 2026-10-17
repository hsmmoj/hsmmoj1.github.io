(function () {
  var root = document.documentElement;
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var t = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = t === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();

// CV not published yet: show a short "coming soon" toast instead.
(function () {
  var toast;
  document.querySelectorAll('.cv-soon').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.textContent = 'My CV will be here soon!';
        document.body.appendChild(toast);
      }
      toast.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(function () { toast.classList.remove('show'); }, 2200);
    });
  });
})();

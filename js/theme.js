// Applies the saved light/dark setting before the page draws, so there's no flash.
(function () {
  var KEY = 'ma-theme';
  function saved() { try { return localStorage.getItem(KEY) || 'light'; } catch (e) { return 'light'; } }
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function apply(choice) {
    var theme = choice === 'system' ? (mq && mq.matches ? 'dark' : 'light') : choice;
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a101d' : '#13213c');
  }
  apply(saved());
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (saved() === 'system') apply('system'); });
  window.MATheme = {
    get: saved,
    set: function (choice) { try { localStorage.setItem(KEY, choice); } catch (e) {} apply(choice); }
  };
})();

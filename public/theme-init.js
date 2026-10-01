// Runs synchronously before styles and the application to avoid a theme flash.
(function () {
  var preference = null;
  try { preference = localStorage.getItem('learn-k8s:theme:v1'); } catch (_) {}
  if (preference !== 'dark' && preference !== 'light') preference = null;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark = preference === 'dark' || (preference === null && systemDark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();

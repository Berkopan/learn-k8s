// Runs synchronously before styles and the application to avoid a theme flash.
(function () {
  var preference = 'dark';
  try { preference = localStorage.getItem('learn-k8s:theme:v1') || 'dark'; } catch (_) {}
  if (['dark', 'light', 'system'].indexOf(preference) === -1) preference = 'dark';
  var dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();

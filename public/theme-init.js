// Applies the saved or system theme before first paint to avoid a light flash.
// Kept as an external file because the CSP (script-src 'self') blocks inline scripts.
// Mirrors applyTheme() in src/theme.ts.
(function () {
  var pref = 'system'
  try {
    pref = localStorage.getItem('tl_theme') || 'system'
  } catch (e) {}
  var dark = pref === 'dark' ||
    (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (dark) document.documentElement.classList.add('dark')
})()

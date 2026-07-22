// Set the theme before first paint to avoid a flash. Uses the saved choice,
// else the OS preference. Kept in sync by src/lib/theme.ts. Loaded as an
// external same-origin script (not inline) so the CSP can be script-src 'self'.
(function () {
  try {
    var t = localStorage.getItem('theme')
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    document.documentElement.dataset.theme = t
  } catch {
    document.documentElement.dataset.theme = 'dark'
  }
})()

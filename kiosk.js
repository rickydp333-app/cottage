(() => {
  const bar = document.createElement('nav');
  bar.className = 'rdp-kiosk-bar';
  bar.setAttribute('aria-label', 'RDPs Place navigation');
  bar.innerHTML = `<a href="/">Home</a><button type="button" data-back>Back</button><button type="button" data-fullscreen>Full Screen</button><button type="button" data-install>Install App</button><span role="status"></span>`;
  document.body.prepend(bar);
  const status = bar.querySelector('[role=status]');
  const full = bar.querySelector('[data-fullscreen]');
  const install = bar.querySelector('[data-install]');
  bar.querySelector('[data-back]').onclick = () => {
    if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) history.back();
    else location.assign('/');
  };
  full.hidden = !document.fullscreenEnabled;
  full.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { status.textContent = 'Full screen is unavailable. Open the installed app or use your kiosk browser.'; }
  };
  document.addEventListener('fullscreenchange', () => { full.textContent = document.fullscreenElement ? 'Exit Full Screen' : 'Full Screen'; });
  let installPrompt;
  install.hidden = navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; install.hidden = false; });
  window.addEventListener('appinstalled', () => { install.hidden = true; installPrompt = null; });
  install.onclick = async () => {
    if (!installPrompt) { status.textContent = 'Use your browser menu to install RDPs Place or Add to Home Screen, then launch its icon.'; return; }
    const prompt = installPrompt;
    installPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; } catch { status.textContent = 'Use your browser menu to install the app.'; }
  };
  const dialog = document.createElement('dialog');
  dialog.className = 'rdp-external-dialog';
  dialog.setAttribute('aria-label', 'External website');
  dialog.innerHTML = '<p role="status"></p><button type="button">Close / Back to RDPs Place</button>';
  document.body.append(dialog);
  let popup = null;
  let trigger = null;
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { try { popup?.close(); } catch {} popup = null; trigger?.focus(); });
  const mapDialog = document.createElement('dialog');
  mapDialog.className = 'rdp-map-dialog';
  mapDialog.setAttribute('aria-label', 'Map');
  mapDialog.innerHTML = '<header><h2>Map</h2><button type="button">Close Map / Back to RDPs Place</button></header><p class="rdp-map-address"></p><iframe title="Location map" referrerpolicy="no-referrer-when-downgrade" sandbox="allow-scripts allow-same-origin allow-forms"></iframe><p class="rdp-map-help">If the map stays blank, check the kiosk internet connection and allow Google Maps in its website settings.</p>';
  document.body.append(mapDialog);
  const mapFrame = mapDialog.querySelector('iframe');
  let mapTrigger = null;
  mapDialog.querySelector('button').onclick = () => mapDialog.close();
  mapDialog.addEventListener('close', () => { mapFrame.removeAttribute('src'); mapTrigger?.focus(); });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || link.hasAttribute('download') || event.button !== 0) return;
    const url = new URL(link.href, location.href);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin === location.origin) { link.target = '_self'; return; }
    event.preventDefault();
    // Our Map buttons use Google Maps address queries. Embed these in the
    // current kiosk window; a popup can be hidden or blocked by kiosk policy.
    if (url.hostname === 'maps.google.com' && url.searchParams.get('q')) {
      const address = url.searchParams.get('q');
      const embed = new URL('https://www.google.com/maps');
      embed.searchParams.set('q', address);
      embed.searchParams.set('output', 'embed');
      mapTrigger = link;
      mapDialog.querySelector('.rdp-map-address').textContent = address;
      mapFrame.src = embed.href;
      if (!mapDialog.open) mapDialog.showModal();
      return;
    }
    trigger = link;
    try {
      popup?.close();
      popup = window.open('about:blank', '_blank', 'popup,width=1100,height=800');
      if (popup) { popup.opener = null; popup.location.replace(url.href); }
    } catch { popup = null; }
    dialog.querySelector('p').textContent = popup
      ? 'The website opened in a separate window. Close that window to return, or use the button below. Your browser may show its address.'
      : 'Your browser blocked the window. Allow popups for RDPs Place and tap the link again.';
    if (!dialog.open) dialog.showModal();
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
})();

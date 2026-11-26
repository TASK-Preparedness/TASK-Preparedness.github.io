/*
 * Fetches the newest T.A.S.K. release from the GitHub API and re-renders the
 * download list. The page ships with a static copy of the v0.1.0-alpha.1 data,
 * which stays in place if JavaScript is off, the network fails, or GitHub rate
 * limits the request (60 unauthenticated requests per hour per IP).
 *
 * Note: /releases/latest ignores pre-releases (it returns 404 while every
 * release is a pre-release), so this uses the /releases list and takes the
 * first entry.
 */
(function () {
  'use strict';

  var REPO = 'TASK-Preparedness/TASK';
  var API = 'https://api.github.com/repos/' + REPO + '/releases?per_page=10';
  var DL_PREFIX = 'https://github.com/' + REPO + '/releases/download/';
  var REL_PREFIX = 'https://github.com/' + REPO + '/releases/';
  var CACHE_KEY = 'task-site-release-v1';
  var CACHE_MS = 30 * 60 * 1000;

  var root = document.getElementById('release');
  if (!root) { return; }
  var PAGE_TAG = root.getAttribute('data-page-tag');

  var DESCRIPTIONS = {
    'TASK-volunteer-test-debs-20261123.zip': 'Ten experimental Debian packages (arm64 target) plus the volunteer testing guide and their own SHA256SUMS. This is the one to install on a spare-card Raspberry Pi 5.',
    'TASK-0.1.0-alpha.1-source.tar.gz': 'Complete corresponding source tree at the release tag, as a tar.gz.',
    'TASK-0.1.0-alpha.1-source.zip': 'The same source tree as a zip.',
    'SHA256SUMS': 'Checksums of the three files above. Download it next to them and run sha256sum -c SHA256SUMS.'
  };
  var ORDER = ['TASK-volunteer-test-debs-20261123.zip', 'TASK-0.1.0-alpha.1-source.tar.gz', 'TASK-0.1.0-alpha.1-source.zip', 'SHA256SUMS'];

  function fmtBytes(n) {
    if (n < 1e6) { return n.toLocaleString('en-US') + ' bytes'; }
    return n.toLocaleString('en-US') + ' bytes (' + (n / 1e6).toFixed(2) + ' MB)';
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ''; }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) + ' (UTC)';
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }
  function setAll(selector, text) {
    document.querySelectorAll(selector).forEach(function (n) { n.textContent = text; });
  }

  function validRelease(r) {
    return r && typeof r.tag_name === 'string' && /^[\w.\-+]+$/.test(r.tag_name) &&
      typeof r.html_url === 'string' && r.html_url.indexOf(REL_PREFIX) === 0 &&
      Array.isArray(r.assets) && r.assets.length > 0;
  }

  function renderAsset(a, isPrimary) {
    var li = el('li', 'asset' + (isPrimary ? ' primary' : ''));
    li.setAttribute('data-name', a.name);
    var head = el('div');
    head.appendChild(el('h3', '', a.name));
    head.appendChild(el('p', '', DESCRIPTIONS[a.name] || 'Release asset.'));
    li.appendChild(head);

    var actions = el('div', 'actions');
    var dl = el('a', 'btn', 'Download');
    dl.href = a.browser_download_url;
    dl.setAttribute('aria-label', 'Download ' + a.name);
    actions.appendChild(dl);
    li.appendChild(actions);

    var meta = el('div', 'meta');
    meta.appendChild(el('span', '', 'Size: ' + fmtBytes(a.size)));
    var line = el('span');
    line.appendChild(document.createTextNode('SHA-256: '));
    var digest = (typeof a.digest === 'string' && /^sha256:[0-9a-f]{64}$/.test(a.digest)) ? a.digest.slice(7) : '';
    if (digest) {
      line.appendChild(el('span', 'hash', digest));
      var cp = el('button', 'btn secondary small', 'Copy');
      cp.type = 'button';
      cp.setAttribute('data-copy-text', digest);
      cp.setAttribute('aria-label', 'Copy SHA-256 of ' + a.name);
      line.appendChild(document.createTextNode(' '));
      line.appendChild(cp);
    } else {
      line.appendChild(document.createTextNode('see SHA256SUMS'));
    }
    meta.appendChild(line);
    li.appendChild(meta);
    return li;
  }

  function render(rel) {
    var assets = rel.assets.filter(function (a) {
      return a && typeof a.name === 'string' && typeof a.size === 'number' &&
        typeof a.browser_download_url === 'string' && a.browser_download_url.indexOf(DL_PREFIX) === 0;
    });
    if (!assets.length) { throw new Error('no usable assets'); }
    assets.sort(function (x, y) {
      var ix = ORDER.indexOf(x.name), iy = ORDER.indexOf(y.name);
      return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy);
    });
    var list = document.getElementById('asset-list');
    list.textContent = '';
    assets.forEach(function (a, i) { list.appendChild(renderAsset(a, i === 0)); });

    setAll('[data-rel="tag"]', rel.tag_name);
    var d = fmtDate(rel.published_at);
    if (d) { setAll('[data-rel="date"]', d); }
    document.querySelectorAll('a[data-rel="notes"]').forEach(function (a) { a.href = rel.html_url; });
    setAll('[data-rel="kind"]', rel.prerelease ? 'pre-release' : 'release');

    var notice = document.getElementById('newer-notice');
    if (notice) {
      var newer = PAGE_TAG && rel.tag_name !== PAGE_TAG;
      notice.hidden = !newer;
      if (newer) {
        setAll('[data-rel="newtag"]', rel.tag_name);
        setAll('[data-rel="pagetag"]', PAGE_TAG);
      }
    }
  }

  function status(msg) {
    var s = document.getElementById('release-status');
    if (s) { s.textContent = msg; }
  }

  function readCache() {
    try {
      var c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (c && Date.now() - c.t < CACHE_MS && validRelease(c.r)) { return c.r; }
    } catch (e) { /* ignore */ }
    return null;
  }

  function apply(rel, source) {
    render(rel);
    status('Release data loaded from the GitHub API' + (source === 'cache' ? ' (cached for this session).' : '.'));
  }

  var cached = readCache();
  if (cached) {
    try { apply(cached, 'cache'); return; } catch (e) { /* fall through */ }
  }

  status('Showing built-in release data for ' + (PAGE_TAG || 'the last known release') + ' while checking GitHub for newer releases\u2026');
  if (!window.fetch) { status('Showing built-in release data (this browser cannot check GitHub).'); return; }

  var ctl = (typeof AbortController === 'function') ? new AbortController() : null;
  var timer = ctl ? setTimeout(function () { ctl.abort(); }, 8000) : null;
  fetch(API, { headers: { 'Accept': 'application/vnd.github+json' }, signal: ctl ? ctl.signal : undefined })
    .then(function (res) { if (!res.ok) { throw new Error('HTTP ' + res.status); } return res.json(); })
    .then(function (list) {
      var rel = (Array.isArray(list) ? list : []).filter(function (r) { return r && !r.draft; })[0];
      if (!validRelease(rel)) { throw new Error('unexpected response'); }
      apply(rel, 'api');
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), r: rel })); } catch (e) { /* ignore */ }
    })
    .catch(function () {
      status('Could not reach the GitHub API, so this page is showing built-in data for ' + (PAGE_TAG || 'the last known release') + '. The download links below still work; check the release page for anything newer.');
    })
    .then(function () { if (timer) { clearTimeout(timer); } });
})();

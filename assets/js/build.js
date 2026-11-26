/* Hardware configurator: tabs, live totals, localStorage. The page works without JS. */
(function () {
  'use strict';
  var root = document.getElementById('configurator');
  if (!root) { return; }
  var KEY = 'task-site-build-owned-v1';
  var current = root.getAttribute('data-default-build') || 'comms';

  function rows() { return Array.prototype.slice.call(root.querySelectorAll('.checklist[data-kind="core"] li[data-id]')); }
  function optionalRows() { return Array.prototype.slice.call(root.querySelectorAll('.checklist[data-kind="optional"] li[data-id]')); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function range(lo, hi) { return lo === hi ? money(lo) : money(lo) + '–' + money(hi); }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function applyOwned() {
    var state = load();
    root.querySelectorAll('.checklist li[data-id]').forEach(function (li) {
      var box = li.querySelector('input[type="checkbox"]');
      if (box) { box.checked = !!state[li.getAttribute('data-id')]; }
    });
  }

  function visibleRows() {
    return rows().filter(function (li) {
      var builds = (li.getAttribute('data-builds') || '').split(/\s+/);
      return builds.indexOf(current) !== -1;
    });
  }

  function totals(list) {
    var lo = 0, hi = 0, have = 0, n = list.length;
    list.forEach(function (li) {
      var box = li.querySelector('input[type="checkbox"]');
      var owned = box && box.checked;
      if (owned) { have += 1; }
      else {
        lo += Number(li.getAttribute('data-lo') || 0);
        hi += Number(li.getAttribute('data-hi') || 0);
      }
    });
    return { lo: lo, hi: hi, have: have, n: n };
  }

  function render() {
    rows().forEach(function (li) {
      var builds = (li.getAttribute('data-builds') || '').split(/\s+/);
      var on = builds.indexOf(current) !== -1;
      li.hidden = !on;
    });
    var t = totals(visibleRows());
    var costEl = document.getElementById('est-cost');
    var remEl = document.getElementById('remaining');
    var acqEl = document.getElementById('acquired');
    var prog = document.getElementById('prog');
    var label = current === 'starter' ? 'Starter station' : current === 'field' ? 'Portable field station' : 'Communications station';
    if (costEl) {
      var full = totals(visibleRows().map(function (li) {
        // estimate for a complete buy of this build (ignore owned) — wait, the hero "Estimated build cost" in the concept is the full build, and remaining is after checkoffs.
        return li;
      }));
      // Full cost of the selected build (all parts, as if none owned)
      var fullLo = 0, fullHi = 0;
      visibleRows().forEach(function (li) {
        fullLo += Number(li.getAttribute('data-lo') || 0);
        fullHi += Number(li.getAttribute('data-hi') || 0);
      });
      costEl.textContent = range(fullLo, fullHi);
    }
    if (remEl) { remEl.textContent = t.n === t.have ? '$0' : range(t.lo, t.hi); }
    if (acqEl) { acqEl.textContent = t.have + '/' + t.n; }
    if (prog) { prog.style.width = (t.n ? Math.round((t.have / t.n) * 100) : 0) + '%'; }
    var buildLabel = document.getElementById('build-label');
    if (buildLabel) { buildLabel.textContent = label; }
    root.querySelectorAll('.seg button[data-build]').forEach(function (btn) {
      var on = btn.getAttribute('data-build') === current;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-select-build]').forEach(function (el) {
      var on = el.getAttribute('data-select-build') === current;
      if (el.tagName === 'BUTTON' && el.hasAttribute('aria-pressed')) {
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      if (el.tagName === 'ARTICLE') {
        el.classList.toggle('selected', on);
      }
    });
  }

  function persistFromDOM() {
    var state = load();
    root.querySelectorAll('.checklist li[data-id]').forEach(function (li) {
      var box = li.querySelector('input[type="checkbox"]');
      if (box) { state[li.getAttribute('data-id')] = !!box.checked; }
    });
    save(state);
  }

  function setBuild(name) {
    current = name;
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
    render();
  }

  applyOwned();
  var hash = (location.hash || '').replace('#', '');
  if (hash === 'starter' || hash === 'comms' || hash === 'field') { current = hash; }

  root.addEventListener('change', function (ev) {
    if (ev.target && ev.target.matches('input[type="checkbox"]')) {
      persistFromDOM();
      render();
    }
  });
  root.querySelectorAll('.seg button[data-build]').forEach(function (btn) {
    btn.addEventListener('click', function () { setBuild(btn.getAttribute('data-build')); });
  });
  document.querySelectorAll('[data-select-build]').forEach(function (el) {
    el.addEventListener('click', function () { setBuild(el.getAttribute('data-select-build')); });
  });

  var copyBtn = document.getElementById('copy-list');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var lines = ['T.A.S.K. shopping list — ' + (current === 'starter' ? 'Starter station' : current === 'field' ? 'Portable field station' : 'Communications station') + ' (estimates as of November 2026, USD, excluding tax and shipping)'];
      visibleRows().forEach(function (li) {
        var box = li.querySelector('input[type="checkbox"]');
        if (box && box.checked) { return; }
        var name = li.querySelector('.part-name');
        var lo = Number(li.getAttribute('data-lo') || 0);
        var hi = Number(li.getAttribute('data-hi') || 0);
        lines.push('- ' + (name ? name.textContent : li.getAttribute('data-id')) + ' — ' + range(lo, hi));
      });
      var t = totals(visibleRows());
      lines.push('Estimated remaining: ' + (t.n === t.have ? '$0' : range(t.lo, t.hi)));
      var opt = [];
      optionalRows().forEach(function (li) {
        var box = li.querySelector('input[type="checkbox"]');
        if (box && box.checked) { return; }
        var name = li.querySelector('.part-name');
        var lo = Number(li.getAttribute('data-lo') || 0);
        var hi = Number(li.getAttribute('data-hi') || 0);
        opt.push('- ' + (name ? name.textContent : li.getAttribute('data-id')) + ' — ' + range(lo, hi) + ' (optional, UNVERIFIED)');
      });
      if (opt.length) {
        lines.push('');
        lines.push('Optional expansions (not included in the total above):');
        lines = lines.concat(opt);
      }
      var text = lines.join('\n');
      function done(ok) {
        var original = copyBtn.textContent;
        copyBtn.textContent = ok ? 'Copied' : 'Copy failed — select the list yourself';
        setTimeout(function () { copyBtn.textContent = original; }, 2000);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        done(ok);
      }
    });
  }

  render();
})();

/* Progressive enhancement only: the site works with JavaScript disabled. */
(function () {
  'use strict';

  function copyText(text, btn) {
    var original = btn.textContent;
    function done(ok) {
      btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      setTimeout(function () { btn.textContent = original; }, 1800);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    done(ok);
  }

  // Add a "Copy" button to every command block.
  document.querySelectorAll('.codeblock').forEach(function (block) {
    var pre = block.querySelector('pre');
    if (!pre) { return; }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy command to clipboard');
    btn.addEventListener('click', function () { copyText(pre.innerText.replace(/\n$/, ''), btn); });
    block.appendChild(btn);
  });

  // Delegated handler for copy buttons that carry their own text (hash values).
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.matches && t.matches('button[data-copy-text]')) {
      copyText(t.getAttribute('data-copy-text'), t);
    }
  });
})();

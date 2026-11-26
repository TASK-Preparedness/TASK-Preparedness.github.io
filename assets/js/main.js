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

(function () {
  var menu = document.querySelector('.nav-menu');
  if (!menu) { return; }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) { menu.removeAttribute('open'); }
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { menu.removeAttribute('open'); });
  });
})();

(function () {
  var video = document.querySelector('.hero-bg-video');
  if (!video) { return; }

  function allowBackgroundVideo() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return false; }
    if (window.matchMedia('(max-width: 47.99rem)').matches) { return false; }
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.saveData) { return false; }
      if (conn.effectiveType && /^(slow-2g|2g)$/.test(conn.effectiveType)) { return false; }
    }
    return true;
  }

  function start() {
    if (video.getAttribute('data-started') || !allowBackgroundVideo()) { return; }
    video.setAttribute('data-started', '1');
    function addSource(src, type) {
      var s = document.createElement('source');
      s.src = src;
      s.type = type;
      video.appendChild(s);
    }
    addSource(video.getAttribute('data-webm'), 'video/webm');
    addSource(video.getAttribute('data-mp4'), 'video/mp4');
    video.load();
    function reveal() { video.hidden = false; }
    video.addEventListener('playing', reveal, { once: true });
    var play = video.play();
    if (play && play.then) {
      play.then(reveal).catch(function () { video.hidden = true; });
    }
  }

  function afterLoad() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 50);
    }
  }
  if (document.readyState === 'complete') { afterLoad(); }
  else { window.addEventListener('load', afterLoad); }

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function onMotion(e) {
    if (e.matches) {
      try { video.pause(); } catch (err) {}
      video.hidden = true;
    }
  }
  if (mq.addEventListener) { mq.addEventListener('change', onMotion); }
  else if (mq.addListener) { mq.addListener(onMotion); }
})();

(function () {
  var el = document.querySelector('.promo-player video[data-poster]');
  if (!el) { return; }
  function setPoster() {
    if (el.getAttribute('poster') || !el.getAttribute('data-poster')) { return; }
    el.setAttribute('poster', el.getAttribute('data-poster'));
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        setPoster();
        io.disconnect();
      }
    }, { rootMargin: '200px 0px' });
    io.observe(el);
  } else {
    setPoster();
  }
})();

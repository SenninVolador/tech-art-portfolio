// Small additions that do not depend on the main script:
// hero loop (only on wide screens), public reel modal.
(function () {
    'use strict';

    // --- Hero background loop: skip on phones and for reduced motion ---
    var hero = document.querySelector('.hero-video');
    if (hero) {
        var skip = window.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)').matches;
        if (!skip) {
            var src = document.createElement('source');
            src.src = hero.getAttribute('data-src');
            src.type = 'video/mp4';
            hero.appendChild(src);
            hero.load();
            var p = hero.play();
            if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
        }
    }

    // --- Public reel modal ---
    var modal = document.getElementById('reel-modal');
    var openBtn = document.getElementById('watch-reel');
    if (!modal || !openBtn) return;
    var video = modal.querySelector('video');
    var closeBtn = modal.querySelector('.reel-close');

    function open() {
        if (!video.getAttribute('src')) video.setAttribute('src', video.getAttribute('data-src'));
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        var p = video.play();
        if (p && p.catch) p.catch(function () { });
    }
    function close() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        video.pause();
    }
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
})();

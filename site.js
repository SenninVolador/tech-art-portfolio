// Small additions that do not depend on the main script:
// the hero loop (wide screens only) and muted video previews when hovering a project card.
(function () {
    'use strict';

    var wide = !window.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)').matches;

    // --- Hero background loop ---
    var hero = document.querySelector('.hero-video');
    if (hero && wide) {
        var src = document.createElement('source');
        src.src = hero.getAttribute('data-src');
        src.type = 'video/mp4';
        hero.appendChild(src);
        hero.load();
        var p = hero.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked: the poster stays */ });
    }

    // --- Hover previews on project cards (devices with a real hover only) ---
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || !wide) return;
    var previews = {};
    fetch('assets/projects.json?v=13').then(function (r) { return r.json(); }).then(function (list) {
        list.forEach(function (proj) {
            var v = (proj.gallery || []).filter(function (g) { return g.type === 'video' && /^assets\//.test(g.src); })[0];
            if (v) previews[proj.title] = v.src;
        });
    }).catch(function () { });

    var grid = document.querySelector('.bento-grid');
    if (!grid) return;
    grid.addEventListener('mouseover', function (e) {
        var card = e.target.closest && e.target.closest('.project-card');
        if (!card || card.querySelector('.card-preview')) return;
        var h3 = card.querySelector('h3');
        var url = h3 && previews[h3.textContent];
        if (!url) return;
        var holder = card.querySelector('.media-container');
        var vid = document.createElement('video');
        vid.className = 'card-preview';
        vid.src = url;
        vid.muted = true; vid.loop = true; vid.playsInline = true;
        holder.insertBefore(vid, holder.querySelector('.overlay'));
        var pr = vid.play();
        if (pr && pr.catch) pr.catch(function () { vid.remove(); });
    });
    grid.addEventListener('mouseout', function (e) {
        var card = e.target.closest && e.target.closest('.project-card');
        if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
        var vid = card.querySelector('.card-preview');
        if (vid) { vid.pause(); vid.remove(); }
    });
})();

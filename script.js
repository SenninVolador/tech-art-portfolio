// Project Data - Now Fetched from JSON
let projects = [];
let siteSettings = {};

console.log("🚀 Script v5 Loaded! Starting to fetch settings...");

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Fetch Settings First, then Projects ---
    Promise.all([
        fetch('assets/settings.json?v=5').then(r => r.json()),
        fetch('assets/projects.json?v=5').then(r => r.json())
    ])
        .then(([settings, projectsData]) => {
            console.log("✅ Data fetched successfully");
            siteSettings = settings;
            projects = Array.isArray(projectsData) ? projectsData : projectsData.projects;
            console.log(`📦 Loaded ${projects.length} projects`);

            // Apply site settings to the page
            applySiteSettings();

            // Then initialize the portfolio grid
            initializePortfolio();
        })
        .catch(err => {
            console.error('❌ Error loading data:', err);
            // Fallback for UI if fetch fails
            const bentoGrid = document.querySelector('.bento-grid');
            if (bentoGrid) bentoGrid.innerHTML = '<p style="color:white; padding: 2rem;">Error loading project data. Please Refresh (Ctrl+F5).</p>';
        });

    // --- Apply Settings to Page Elements ---
    function applySiteSettings() {
        // Hero Section
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');
        const heroSpecialties = document.getElementById('hero-specialties');

        if (heroTitle && siteSettings.heroTitle) {
            heroTitle.textContent = siteSettings.heroTitle;
            heroTitle.setAttribute('data-text', siteSettings.heroTitle);
        }
        if (heroSubtitle && siteSettings.heroSubtitle) {
            heroSubtitle.textContent = siteSettings.heroSubtitle;
        }
        if (heroSpecialties && siteSettings.heroSpecialties) {
            heroSpecialties.textContent = siteSettings.heroSpecialties;
        }

        // Contact Section
        const contactTitle = document.getElementById('contact-title');
        const contactDesc = document.getElementById('contact-description');

        if (contactTitle && siteSettings.contactTitle) {
            contactTitle.textContent = siteSettings.contactTitle;
        }
        if (contactDesc && siteSettings.contactDescription) {
            contactDesc.textContent = siteSettings.contactDescription;
        }

        // Social Links
        const socialContainer = document.getElementById('social-links-container');
        if (socialContainer && siteSettings.socialLinks && siteSettings.socialLinks.length > 0) {
            socialContainer.innerHTML = '';
            siteSettings.socialLinks.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.className = 'social-icon';
                a.setAttribute('aria-label', link.platform);
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.innerHTML = `<i class="fa-brands ${link.icon}"></i>`;
                socialContainer.appendChild(a);
            });
        }

        // About Section
        const aboutTitle = document.getElementById('about-title');
        const aboutDesc = document.getElementById('about-description');
        const skillsList = document.getElementById('skills-list');

        if (aboutTitle && siteSettings.aboutTitle) {
            aboutTitle.textContent = siteSettings.aboutTitle;
        }
        if (aboutDesc && siteSettings.aboutDescription) {
            aboutDesc.textContent = siteSettings.aboutDescription;
        }
        if (skillsList && siteSettings.aboutSkills && siteSettings.aboutSkills.length > 0) {
            skillsList.innerHTML = '';
            // Icon mapping for skills
            const iconMap = {
                'HLSL': 'fa-solid fa-cube',
                'GLSL': 'fa-solid fa-cube',
                'Python': 'fa-brands fa-python',
                'Houdini': 'fa-solid fa-wand-magic-sparkles',
                'Maya': 'fa-solid fa-cube',
                'Unreal': 'fa-solid fa-gamepad',
                'Git': 'fa-brands fa-git-alt',
                'default': 'fa-solid fa-check'
            };

            siteSettings.aboutSkills.forEach(skill => {
                const li = document.createElement('li');
                // Find matching icon
                let iconClass = iconMap.default;
                for (const key in iconMap) {
                    if (skill.toLowerCase().includes(key.toLowerCase())) {
                        iconClass = iconMap[key];
                        break;
                    }
                }
                li.innerHTML = `<i class="${iconClass}"></i> ${skill}`;
                skillsList.appendChild(li);
            });
        }

        // Resume Section
        const resumeTitle = document.getElementById('resume-title');
        const resumeSubtitle = document.getElementById('resume-subtitle');
        const resumeDownload = document.getElementById('resume-download');
        const resumeTimeline = document.getElementById('resume-timeline');

        if (resumeTitle && siteSettings.resumeTitle) {
            resumeTitle.textContent = siteSettings.resumeTitle;
        }
        if (resumeSubtitle && siteSettings.resumeSubtitle) {
            resumeSubtitle.textContent = siteSettings.resumeSubtitle;
        }
        if (resumeDownload && siteSettings.resumeDownloadUrl) {
            resumeDownload.href = siteSettings.resumeDownloadUrl;
        }
        if (resumeTimeline && siteSettings.resumeHistory) {
            resumeTimeline.innerHTML = '';
            siteSettings.resumeHistory.forEach(item => {
                const div = document.createElement('div');
                div.className = 'resume-item';
                div.innerHTML = `
                    <div class="resume-item-header">
                        <h3>${item.company}</h3>
                        <span class="period">${item.period}</span>
                    </div>
                    <span class="role">${item.role}</span>
                    <p class="description">${item.description}</p>
                `;
                resumeTimeline.appendChild(div);
            });
        }

        // Page Title and Meta
        if (siteSettings.siteTitle) {
            document.title = siteSettings.siteTitle;
        }
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && siteSettings.siteDescription) {
            metaDesc.setAttribute('content', siteSettings.siteDescription);
        }
    }

    function initializePortfolio() {
        const bentoGrid = document.querySelector('.bento-grid');
        // Clear existing static HTML content to rebuild from JSON
        bentoGrid.innerHTML = '';

        // Render projects
        projects.forEach(p => {
            const article = document.createElement('article');
            article.className = `project-card ${p.size || 'medium'}`;
            article.setAttribute('data-category', p.category);

            // Thumbnail handling - check if thumbnail exists
            let bgStyle = '';
            if (p.thumbnail) {
                if (p.thumbnail.startsWith('gradient')) {
                    bgStyle = `background: ${getGradient(p.thumbnail)}`;
                } else {
                    bgStyle = `background-image: url('${p.thumbnail}')`;
                }
            } else {
                // Fallback gradient if no thumbnail
                bgStyle = `background: linear-gradient(135deg, #333 0%, #111 100%)`;
            }

            // HTML Structure
            // Truncate desc
            const shortDesc = p.description && p.description.length > 60 ? p.description.substring(0, 60) + '...' : (p.description || '');

            article.innerHTML = `
                <div class="media-container">
                    <div class="media-placeholder" style="${bgStyle}; background-size: cover; background-position: center;"></div>
                    <div class="overlay">
                        <h3>${p.title}</h3>
                        <p>${shortDesc}</p>
                        ${p.tags.slice(0, 2).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                </div>
            `;
            bentoGrid.appendChild(article);
        });

        setupInteractions(); // Re-attach listeners to new DOM elements
    }

    function getGradient(name) {
        const map = {
            'gradient-1': 'linear-gradient(45deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)',
            'gradient-2': 'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)',
            'gradient-3': 'linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)',
            'gradient-4': 'linear-gradient(45deg, #85FFBD 0%, #FFFB7D 100%)',
            'gradient-5': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        };
        return map[name] || '#333';
    }

    function setupInteractions() {
        // --- Filtering ---
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.9)';
                        setTimeout(() => card.style.display = 'none', 300);
                    }
                });
            });
        });

        // --- Modal Logic ---
        const modal = document.getElementById('project-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalDesc = document.getElementById('modal-description');
        const modalTags = document.getElementById('modal-tags');
        const modalVisualContainer = document.getElementById('modal-visual-container');
        const viewToggleContainer = document.querySelector('.view-toggle');
        let currentProjectData = null;

        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const title = card.querySelector('h3').textContent;
                currentProjectData = projects.find(p => p.title === title);

                if (currentProjectData) {
                    modalTitle.textContent = currentProjectData.title;
                    modalDesc.innerHTML = currentProjectData.description;

                    modalTags.innerHTML = '';
                    if (currentProjectData.tags) {
                        currentProjectData.tags.forEach(tag => {
                            const span = document.createElement('span');
                            span.textContent = tag;
                            modalTags.appendChild(span);
                        });
                    }

                    buildGalleryTabs(currentProjectData.gallery);
                    updateModalVisual(0);

                    modal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        function buildGalleryTabs(galleryItems) {
            viewToggleContainer.innerHTML = '';
            if (!galleryItems || galleryItems.length === 0) return;

            galleryItems.forEach((item, index) => {
                const btn = document.createElement('button');
                btn.className = 'toggle-btn';
                btn.textContent = item.label || `View ${index + 1}`;
                if (index === 0) btn.classList.add('active');

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateModalVisual(index);
                });
                viewToggleContainer.appendChild(btn);
            });
        }

        function updateModalVisual(index) {
            if (!currentProjectData || !currentProjectData.gallery) return;
            const item = currentProjectData.gallery[index];
            if (!item) return;

            modalVisualContainer.innerHTML = '';
            const type = item.type;
            const src = item.src;

            if (type === 'video') {
                const video = document.createElement('video');
                video.src = src;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '100%';
                video.style.borderRadius = '4px';
                modalVisualContainer.appendChild(video);
            } else if (type === 'image') {
                const img = document.createElement('img');
                img.src = src;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                modalVisualContainer.appendChild(img);
            } else if (type === 'css') {
                const div = document.createElement('div');
                div.className = 'placeholder-visual';
                div.style.background = src;
                div.style.width = '100%';
                div.style.height = '100%';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.innerHTML = `<div style="padding:2rem; border:2px dashed #444">[ ${item.label} ]</div>`;
                modalVisualContainer.appendChild(div);
            }
            modalVisualContainer.style.background = '#000';
        }
    }

    // --- Modal Closing Logic ---
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-modal');
    function hideModal() {
        if (!modal) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
        const video = modal.querySelector('video');
        if (video) video.pause();
    }
    if (closeModal) closeModal.addEventListener('click', hideModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && modal.classList.contains('open')) hideModal(); });

    // --- Hamburger Menu Toggle ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            // Toggle icon between bars and X
            const icon = hamburgerBtn.querySelector('i');
            if (navLinks.classList.contains('open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                const icon = hamburgerBtn.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            });
        });
    }

    // --- XYZ Logo RGB Trigger ---
    const xyzLogo = document.getElementById('xyz-logo');
    if (xyzLogo) {
        function triggerRGB() {
            xyzLogo.classList.add('rgb-mode');
            setTimeout(() => {
                xyzLogo.classList.remove('rgb-mode');
                const nextDelay = Math.random() * 7000 + 5000;
                setTimeout(triggerRGB, nextDelay);
            }, 2500);
        }
        setTimeout(triggerRGB, 2000);
    }

    // --- Glitch Effect ---
    const glitchTitle = document.querySelector('.glitch');
    if (glitchTitle) {
        function triggerGlitch() {
            glitchTitle.classList.add('active');
            setTimeout(() => {
                glitchTitle.classList.remove('active');
                const nextDelay = Math.random() * 6000 + 4000;
                setTimeout(triggerGlitch, nextDelay);
            }, 200 + Math.random() * 200);
        }
        setTimeout(triggerGlitch, 3000);
    }

    // --- Contact Form ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.submit-btn');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            btn.style.opacity = '0.7';
            setTimeout(() => {
                btn.innerHTML = '<span>Message Sent!</span> <i class="fa-solid fa-check"></i>';
                btn.style.borderColor = '#00f2ea';
                btn.style.color = '#00f2ea';
                contactForm.reset();
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.borderColor = '';
                    btn.style.color = '';
                    btn.style.opacity = '1';
                }, 3000);
            }, 1500);
        });
    }

    // --- Tech Art Canvas (True 3D Morphing) ---
    const canvas = document.getElementById('tech-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        const connectionDistance = 100;
        let target3DPoints = [];
        let shapeIndex = 0;
        const cycleTimes = { wander: 6000, hold: 8000 };
        let lastStateChange = Date.now();
        let state = 'wander';
        const shapes = ['cube', 'torus', 'sphere', 'teapot'];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            if (state === 'wander') initParticlesWander();
        }

        function initParticlesWander() {
            synchronizeParticleCount(350);
            particles.forEach(p => {
                if (!p.vx) {
                    p.x = Math.random() * width;
                    p.y = Math.random() * height;
                    p.z = (Math.random() - 0.5) * 500;
                    p.vx = (Math.random() - 0.5) * 0.8;
                    p.vy = (Math.random() - 0.5) * 0.8;
                }
            });
        }

        window.addEventListener('resize', resize);
        resize();

        function synchronizeParticleCount(targetCount) {
            const currentCount = particles.length;
            if (currentCount < targetCount) {
                for (let i = 0; i < targetCount - currentCount; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        z: 0,
                        vx: (Math.random() - 0.5) * 1,
                        vy: (Math.random() - 0.5) * 1
                    });
                }
            } else if (currentCount > targetCount) {
                particles.splice(targetCount);
            }
        }

        function get3DPoints(type) {
            const points = [];
            if (type === 'cube') {
                const steps = 9;
                for (let x = -1; x <= 1; x += 2 / steps) {
                    for (let y = -1; y <= 1; y += 2 / steps) {
                        for (let z = -1; z <= 1; z += 2 / steps) {
                            if (Math.abs(Math.abs(x) - 1) < 0.1 || Math.abs(Math.abs(y) - 1) < 0.1 || Math.abs(Math.abs(z) - 1) < 0.1) {
                                points.push({ x, y, z });
                            }
                        }
                    }
                }
            } else if (type === 'sphere') {
                const numPoints = 400;
                const phi = (1 + Math.sqrt(5)) / 2;
                for (let i = 0; i < numPoints; i++) {
                    const y = 1 - (i / (numPoints - 1)) * 2;
                    const radius = Math.sqrt(1 - y * y);
                    const theta = phi * i;
                    points.push({ x: Math.cos(theta) * radius, y: y, z: Math.sin(theta) * radius });
                }
            } else if (type === 'torus') {
                const steps = 400; const R = 0.7; const r = 0.3;
                for (let i = 0; i < steps; i++) {
                    const u = (Math.random() * Math.PI * 2); const v = (Math.random() * Math.PI * 2);
                    points.push({
                        x: (R + r * Math.cos(v)) * Math.cos(u),
                        y: (R + r * Math.cos(v)) * Math.sin(u),
                        z: r * Math.sin(v)
                    });
                }
            } else if (type === 'teapot') {
                const numPoints = 400;
                // Simplified Utah Teapot style procedural points
                // 1. Body (Ellipsoid)
                for (let i = 0; i < 200; i++) {
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    points.push({
                        x: 0.8 * Math.sin(phi) * Math.cos(theta),
                        y: 0.5 * Math.cos(phi) - 0.2, // Offset down
                        z: 0.8 * Math.sin(phi) * Math.sin(theta)
                    });
                }
                // 2. Lid (Dome)
                for (let i = 0; i < 60; i++) {
                    const theta = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 0.4;
                    points.push({
                        x: radius * Math.cos(theta),
                        y: 0.3 + 0.15 * (1 - (radius / 0.4)), // Small bump up
                        z: radius * Math.sin(theta)
                    });
                }
                // 3. Spout (Curved line/tube)
                for (let i = 0; i < 70; i++) {
                    const t = Math.random();
                    const curveX = 0.6 + t * 0.7;
                    const curveY = -0.3 + t * 0.6;
                    const jitter = 0.05;
                    points.push({
                        x: curveX + (Math.random() - 0.5) * jitter,
                        y: curveY + (Math.random() - 0.5) * jitter,
                        z: (Math.random() - 0.5) * jitter * 2
                    });
                }
                // 4. Handle (Loop)
                for (let i = 0; i < 70; i++) {
                    const angle = Math.PI / 2 + Math.random() * Math.PI;
                    const hR = 0.4;
                    points.push({
                        x: -0.7 + Math.cos(angle) * hR * 0.6,
                        y: 0 + Math.sin(angle) * hR,
                        z: (Math.random() - 0.5) * 0.05
                    });
                }
            }
            return points;
        }

        function updateLogic() {
            const now = Date.now();
            const timeSinceChange = now - lastStateChange;
            if (state === 'wander' && timeSinceChange > cycleTimes.wander) {
                state = 'forming';
                const shapeType = shapes[shapeIndex];
                target3DPoints = get3DPoints(shapeType);
                shapeIndex = (shapeIndex + 1) % shapes.length;
                lastStateChange = now;
                synchronizeParticleCount(target3DPoints.length);
            } else if (state === 'forming' && timeSinceChange > cycleTimes.hold) {
                state = 'wander';
                target3DPoints = [];
                synchronizeParticleCount(350);
                particles.forEach(p => { p.vx = (Math.random() - 0.5) * 4; p.vy = (Math.random() - 0.5) * 4; });
                lastStateChange = now;
            }
        }

        let rotationTime = 0; let gizmoRotation = 0;
        function rotate3D(x, y, z, pitch, yaw) {
            let y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
            let z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
            let x2 = x * Math.cos(yaw) - z1 * Math.sin(yaw);
            let z2 = x * Math.sin(yaw) + z1 * Math.cos(yaw);
            return { x: x2, y: y1, z: z2 };
        }

        function drawGizmo(x, y, size) {
            ctx.save(); ctx.translate(x, y);
            const ang = gizmoRotation;
            const cos = Math.cos(ang); const sin = Math.sin(ang);
            const project = (px, py, pz) => { return { x: px * cos - pz * sin, y: px * sin * 0.5 + pz * cos * 0.5 - py }; };
            const xAxis = project(1, 0, 0); const yAxis = project(0, 1, 0); const zAxis = project(0, 0, 1);
            ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.font = '10px Space Grotesk'; const sx = size, sy = size;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(zAxis.x * sx, zAxis.y * sy); ctx.strokeStyle = '#0044ff'; ctx.stroke();
            ctx.fillStyle = '#0044ff'; ctx.fillText('Z', zAxis.x * sx, zAxis.y * sy);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(xAxis.x * sx, xAxis.y * sy); ctx.strokeStyle = '#ff0044'; ctx.stroke();
            ctx.fillStyle = '#ff0044'; ctx.fillText('X', xAxis.x * sx, xAxis.y * sy);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(yAxis.x * sx, yAxis.y * sy); ctx.strokeStyle = '#00ff44'; ctx.stroke();
            ctx.fillStyle = '#00ff44'; ctx.fillText('Y', yAxis.x * sx, yAxis.y * sy);
            ctx.restore();
        }

        function animate() {
            updateLogic();
            ctx.clearRect(0, 0, width, height);
            rotationTime += 0.005; gizmoRotation += 0.01;
            const cx = width / 2; const cy = height / 2; const size = Math.min(width, height) * 0.25;

            particles.forEach((p, i) => {
                let target = null;
                if (state === 'forming' && target3DPoints[i]) {
                    const tp = target3DPoints[i];
                    const r = rotate3D(tp.x, tp.y, tp.z, rotationTime * 0.5, rotationTime);
                    target = { x: cx + r.x * size, y: cy + r.y * size, z: r.z };
                }
                if (target) {
                    const dx = target.x - p.x; const dy = target.y - p.y;
                    p.x += dx * 0.08; p.y += dy * 0.08; p.z = target.z;
                } else {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > width) p.vx *= -1; if (p.y < 0 || p.y > height) p.vy *= -1;
                    p.z = 0;
                }
                const depthScale = 1 + (p.z * 0.5);
                const radius = Math.max(0.5, 1.5 * depthScale);
                const alpha = Math.max(0.2, Math.min(1, 0.6 + p.z * 0.4));
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
            });

            if (state === 'wander' || state === 'forming' || particles.length < 250) {
                const lineAlpha = state === 'forming' ? 0.05 : 0.1;
                ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
                ctx.beginPath();
                for (let i = 0; i < particles.length; i += 2) {
                    const p1 = particles[i];
                    for (let j = i + 1; j < Math.min(particles.length, i + 30); j++) {
                        const p2 = particles[j];
                        const dx = p1.x - p2.x; const dy = p1.y - p2.y;
                        if (dx * dx + dy * dy < connectionDistance * connectionDistance) {
                            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                        }
                    }
                }
                ctx.stroke();
            }
            drawGizmo(width * 0.9, height * 0.85, 40);
            requestAnimationFrame(animate);
        }
        animate();
    }
});

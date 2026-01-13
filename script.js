// Project Data (Simulated Database) -> Refactored for Multi-Gallery Support
const projects = {
    'RainDrop PostProcess': {
        title: 'RainDrop PostProcess',
        tags: ['UE5', 'HLSL', 'Material Graph'],
        description: 'Raindrop postprocess shader. A simple efficient approach to screen-space rain effects using masks and simple black and white textures to simulate fluid flow.',
        gallery: [
            { type: 'video', src: 'assets/project01/untitled.mp4', label: 'Final Result' },
            { type: 'image', src: 'assets/project01/daniel-rojas-drips.jpg', label: 'Flow Map Mask' }
        ]
    },
    'Pixelization Effect': {
        title: 'Pixelization Effect',
        tags: ['UE5', 'PostProcess', 'HLSL'],
        description: 'Screen-space pixelation effect tailored for retro-aesthetics. Includes controls for pixel size, color palette limiting, and temporal stability.',
        gallery: [
            { type: 'image', src: 'assets/Project02/daniel-rojas-pp-pixelation.jpg', label: 'Final Render' },
            { type: 'image', src: 'assets/Project02/daniel-rojas-untitled-1-1-1.jpg', label: 'Shader Graph' }
        ]
    },
    'Project 03': {
        title: 'Project 03',
        tags: ['UE5', 'Tech Art'],
        description: 'Tech Art Showcase. Exploring advanced shader techniques.',
        gallery: [
            { type: 'image', src: 'assets/Project03/daniel-rojas-6-1-6-1.jpg', label: 'Viewport View' },
            { type: 'image', src: 'assets/Project03/daniel-rojas-logos.jpg', label: 'Logos / Assets' },
            { type: 'image', src: 'assets/Project03/daniel-rojas-5-1-5-1.jpg', label: 'Wireframe' }
        ]
    },
    'Volumetric Cloud Renderer': {
        title: 'Volumetric Cloud Renderer',
        tags: ['HLSL', 'UE5', 'Raymarching'],
        description: 'Implemented a raymarching based volumetric cloud system optimized for mobile VR platforms.',
        gallery: [
            { type: 'css', src: 'linear-gradient(45deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%)', label: 'Concept' },
            { type: 'css', src: 'linear-gradient(to right, #000 0%, #333 100%)', label: 'Math Debug' }
        ]
    },
    'Auto-Rigger Python API': {
        title: 'Auto-Rigger Python API',
        tags: ['Python', 'Maya API', 'PySide2'],
        description: 'A modular auto-rigging system for bipedal characters.',
        gallery: [
            { type: 'css', src: 'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)', label: 'UI Demo' },
            { type: 'css', src: '#1a1a1a', label: 'Code Snippet' }
        ]
    },
    'LOD Generator': {
        title: 'Procedural LOD Generator',
        tags: ['Houdini', 'PDG', 'Python'],
        description: 'Houdini PDG network that automatically generates LODs and collision meshes.',
        gallery: [
            { type: 'css', src: 'linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)', label: 'PDG Graph' },
            { type: 'css', src: '#222', label: 'Result Mesh' }
        ]
    },
    'NPR Toon Shader': {
        title: 'Guilty Gear Style Filter',
        tags: ['UE5 Material Graph', 'HLSL'],
        description: 'Reverse-engineered the Arc System Works shading model.',
        gallery: [
            { type: 'css', src: 'linear-gradient(45deg, #85FFBD 0%, #FFFB7D 100%)', label: 'Toon Shading' },
            { type: 'css', src: '#111', label: 'Lighting Maps' }
        ]
    },
    'Asset Validator': {
        title: 'Pre-Commit Asset Validator',
        tags: ['Python', 'Git', 'Unreal Python API'],
        description: 'A sanity checker that runs before Git commits.',
        gallery: [
            { type: 'css', src: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', label: 'Console Output' },
            { type: 'css', src: '#333', label: 'Logic Flow' }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {

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
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-description');
    const modalTags = document.getElementById('modal-tags');
    const modalVisualContainer = document.getElementById('modal-visual-container');
    // We will dynamically clear and rebuild this container now
    const viewToggleContainer = document.querySelector('.view-toggle');

    let currentProjectData = null;

    // Open Modal
    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').textContent;
            currentProjectData = projects[title];

            if (currentProjectData) {
                modalTitle.textContent = currentProjectData.title;
                modalDesc.innerHTML = currentProjectData.description;

                // Tags
                modalTags.innerHTML = '';
                currentProjectData.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.textContent = tag;
                    modalTags.appendChild(span);
                });

                // --- BUILD GALLERY TABS ---
                buildGalleryTabs(currentProjectData.gallery);

                // Show first item by default
                updateModalVisual(0);

                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    function buildGalleryTabs(galleryItems) {
        viewToggleContainer.innerHTML = ''; // Clear existing static buttons

        if (!galleryItems || galleryItems.length === 0) return;

        galleryItems.forEach((item, index) => {
            const btn = document.createElement('button');
            btn.className = 'toggle-btn';
            btn.textContent = item.label || `View ${index + 1}`;
            if (index === 0) btn.classList.add('active');

            btn.addEventListener('click', () => {
                // Formatting active state
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

        modalVisualContainer.innerHTML = ''; // Clear current

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

    // Close Modal
    function hideModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        const video = modalVisualContainer.querySelector('video');
        if (video) video.pause();
    }

    closeModal.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) hideModal(); });


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
        const shapes = ['cube', 'torus', 'sphere'];

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

            if (state === 'wander' || particles.length < 250) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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

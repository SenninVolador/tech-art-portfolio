// Site Settings and Project Data
let projects = [];
let classifiedProjects = [];
let siteSettings = {};
let isClassifiedUnlocked = localStorage.getItem('portfolio-unlocked') === 'true';
let privateReelUrl = ""; // Will be fetched from classified_data.json

document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Navbar Scroll Effect ---
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // --- 1. Fetch Settings First, then Projects ---
    const fetchPromises = [
        fetch('assets/settings.json?v=5').then(r => r.json()),
        fetch('assets/projects.json?v=5').then(r => r.json())
    ];

    if (isClassifiedUnlocked) {
        fetchPromises.push(fetch('assets/classified_data.json?v=5').then(r => r.json()).catch(() => ({ projects: [] })));
    }

    Promise.all(fetchPromises)
        .then(([settings, projectsData, classifiedData]) => {
            siteSettings = settings;
            projects = Array.isArray(projectsData) ? projectsData : projectsData.projects;
            
            if (isClassifiedUnlocked && classifiedData) {
                const extraProjects = Array.isArray(classifiedData) ? classifiedData : classifiedData.projects;
                projects = [...projects, ...extraProjects];
                
                // --- PRIVATE REEL ---
                if (classifiedData.privateReel) {
                    privateReelUrl = atob(classifiedData.privateReel);
                    const reelBtn = document.getElementById('private-reel-btn');
                    if (reelBtn) reelBtn.style.display = 'inline-block';
                }

                const unlockBtn = document.getElementById('unlock-btn'); // Assuming unlockBtn is defined
                if (unlockBtn) unlockBtn.classList.add('unlocked');
                const relockBtn = document.getElementById('relock-btn');
                if (relockBtn) relockBtn.style.display = 'inline-block';
            }

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
            // Initialize blueprint wires after timeline is populated
            setTimeout(initBlueprintWires, 100);
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
        projects.forEach((p, index) => {
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
                        ${p.tags.slice(0, 2).map(t => `<span class="tech-tag ${p.isConfidential ? 'confidential-tag' : ''}">${t}</span>`).join('')}
                    </div>
                </div>
            `;
            bentoGrid.appendChild(article);

            // Entrance animation
            article.style.opacity = '0';
            article.style.transform = 'translateY(20px)';
            setTimeout(() => {
                article.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                article.style.opacity = '1';
                article.style.transform = 'translateY(0)';
            }, 100 + (index * 50));
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

        // --- Confidential Unlock ---
        const unlockBtn = document.getElementById('unlock-btn');
        const classifiedModal = document.getElementById('classified-modal');
        const submitPassBtn = document.getElementById('submit-pass');
        const passInput = document.getElementById('classified-pass');
        const passError = document.getElementById('pass-error');
        const closeClassified = document.getElementById('close-classified');
        const privateReelBtn = document.getElementById('private-reel-btn');

        if (privateReelBtn) {
            privateReelBtn.addEventListener('click', () => {
                const modal = document.getElementById('project-modal');
                const modalTitle = document.getElementById('modal-title');
                const modalDesc = document.getElementById('modal-description');
                const modalTags = document.getElementById('modal-tags');
                const modalVisualContainer = document.getElementById('modal-visual-container');
                const viewToggleContainer = document.querySelector('.view-toggle');

                if (modal && privateReelUrl) {
                    modalTitle.textContent = "Private Technical Art Reel";
                    modalDesc.innerHTML = "Restricted Reel containing confidential Tech-Art work under NDA. Not for public distribution.";
                    modalTags.innerHTML = '<span>PRIVATE</span><span>NDA</span><span>REEL</span>';
                    viewToggleContainer.innerHTML = ''; // No tabs
                    
                    modalVisualContainer.innerHTML = '';
                    const videoId = privateReelUrl.split('/').pop();
                    const iframe = document.createElement('iframe');
                    // Assuming Vimeo/YouTube but handle based on URL
                    if (privateReelUrl.includes('vimeo')) {
                        iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=0`;
                    } else if (privateReelUrl.includes('youtube') || privateReelUrl.includes('youtu.be')) {
                        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                    } else {
                        // Raw video?
                        const video = document.createElement('video');
                        video.src = privateReelUrl;
                        video.controls = true;
                        video.autoplay = true;
                        video.style.maxWidth = '100%';
                        modalVisualContainer.appendChild(video);
                        modal.classList.add('open');
                        document.body.style.overflow = 'hidden';
                        return;
                    }
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    modalVisualContainer.appendChild(iframe);
                    
                    modal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        if (unlockBtn) {
            // Check state on load
            if (isClassifiedUnlocked) {
                unlockBtn.classList.add('unlocked');
                unlockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Confidential';
            }

            unlockBtn.addEventListener('click', () => {
                if (isClassifiedUnlocked) {
                    // Already unlocked? Behave as a filter
                    filterBtns.forEach(b => b.classList.remove('active'));
                    unlockBtn.classList.add('active');
                    
                    projectCards.forEach(card => {
                        const h3 = card.querySelector('h3');
                        const p = projects.find(proj => proj.title === h3.textContent);
                        
                        if (p && p.isConfidential) {
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
                } else {
                    classifiedModal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                    passInput.focus();
                }
            });

            // Double click or long press to lock? Or maybe just add a "Lock" button in the modal?
            // Let's add a simple way to lock: Right click on the unlock button to lock back
            unlockBtn.addEventListener('contextmenu', (e) => {
                if (isClassifiedUnlocked) {
                    e.preventDefault();
                    if (confirm("Lock confidential projects again?")) {
                        localStorage.removeItem('portfolio-unlocked');
                        window.location.reload();
                    }
                }
            });
        }

        function unlockPortfolio() {
            const pass = passInput.value;
            if (pass === 'drojasreel26') {
                isClassifiedUnlocked = true;
                localStorage.setItem('portfolio-unlocked', 'true');
                
                // Fetch and add projects
                fetch('assets/classified_data.json?v=5')
                    .then(r => r.json())
                    .then(data => {
                        const extraProjects = Array.isArray(data) ? data : data.projects;
                        // Avoid duplicates
                        extraProjects.forEach(ep => {
                            if (!projects.find(p => p.title === ep.title)) {
                                projects.push(ep);
                            }
                        });
                        
                         // --- PRIVATE REEL ---
                        if (data.privateReel) {
                            privateReelUrl = atob(data.privateReel);
                            const reelBtn = document.getElementById('private-reel-btn');
                            if (reelBtn) reelBtn.style.display = 'inline-block';
                        }
                        
                        initializePortfolio();
                        unlockBtn.classList.add('unlocked');
                        unlockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Confidential';
                        const relockBtn = document.getElementById('relock-btn');
                        if (relockBtn) relockBtn.style.display = 'inline-block';
                        
                        classifiedModal.classList.remove('open');
                        document.body.style.overflow = '';
                        passInput.value = '';
                        passError.textContent = '';
                        
                        // Automatically switch to confidential filter after unlock
                        unlockBtn.click();
                    })
                    .catch(err => {
                        passError.textContent = "Error loading secure data. Try again.";
                    });
            } else {
                passError.textContent = "Access Denied. Incorrect Key.";
                passInput.style.borderColor = "#ff3366";
                setTimeout(() => {
                    passInput.style.borderColor = "";
                }, 1000);
            }
        }

        if (submitPassBtn) submitPassBtn.addEventListener('click', unlockPortfolio);
        if (passInput) {
            passInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') unlockPortfolio();
            });
        }
        if (closeClassified) {
            closeClassified.addEventListener('click', () => {
                classifiedModal.classList.remove('open');
                document.body.style.overflow = '';
                passError.textContent = '';
                passInput.value = '';
            });
        }

        // New: Handle Lock Button if added to UI
        const reLockBtn = document.getElementById('relock-btn');
        if (reLockBtn) {
            reLockBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('portfolio-unlocked');
                window.location.reload();
            });
        }

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                if (unlockBtn) unlockBtn.classList.remove('active'); // Clear confidential active state
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
                if (src.includes('youtube.com') || src.includes('youtu.be')) {
                    const videoId = src.includes('watch?v=') ? src.split('v=')[1].split('&')[0] : src.split('/').pop();
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    modalVisualContainer.appendChild(iframe);
                } else {
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
                }
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

    // --- 5. Easter Egg for danielrojas.xyz ---
    const isXYZDomain = window.location.hostname.includes('danielrojas.xyz');
    const logoLetters = document.querySelector('.logo-letters');

    if (logoLetters) {
        if (isXYZDomain) {
            // Specialized RGB pulse for the .xyz domain
            let hue = 0;
            setInterval(() => {
                hue = (hue + 1) % 360;
                logoLetters.style.color = `hsl(${hue}, 80%, 60%)`;
                logoLetters.style.textShadow = `0 0 15px hsl(${hue}, 80%, 50%)`;
            }, 50);
        } else {
            // Default look for other domains
            logoLetters.innerHTML = 'XYZ';
        }
    }

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

            // Gather data 
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            const destinationEmail = siteSettings.contactEmail || 'danielrojas.1429@gmail.com';

            const btn = contactForm.querySelector('.submit-btn');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            btn.style.opacity = '0.7';

            fetch(`https://formsubmit.co/ajax/${destinationEmail}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    message: message,
                    _subject: `New Portfolio Contact from ${name}`
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        btn.innerHTML = '<span>Message Sent!</span> <i class="fa-solid fa-check"></i>';
                        btn.style.borderColor = '#00f2ea';
                        btn.style.color = '#00f2ea';
                        contactForm.reset();
                    } else {
                        btn.innerHTML = '<span>Error Sending</span> <i class="fa-solid fa-xmark"></i>';
                        btn.style.borderColor = '#ff3366';
                        btn.style.color = '#ff3366';
                    }
                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.style.borderColor = '';
                        btn.style.color = '';
                        btn.style.opacity = '1';
                    }, 3000);
                })
                .catch(error => {
                    btn.innerHTML = '<span>Error Sending</span> <i class="fa-solid fa-xmark"></i>';
                    btn.style.borderColor = '#ff3366';
                    btn.style.color = '#ff3366';
                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.style.borderColor = '';
                        btn.style.color = '';
                        btn.style.opacity = '1';
                    }, 3000);
                });
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
        const shapes = ['cube', 'torus', 'sphere', 'teapot', 'light'];
        let mouse = { x: -1000, y: -1000, active: false };

        canvas.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        });

        canvas.addEventListener('mouseleave', () => {
            mouse.active = false;
        });

        // --- Touch Support ---
        canvas.addEventListener('touchstart', (e) => {
            mouse.active = true;
            if (e.touches && e.touches[0]) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchend', () => {
            mouse.active = false;
        });

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;

            // Adjust particle count for mobile
            const target = width < 768 ? 150 : 350;
            synchronizeParticleCount(target);

            if (state === 'wander') initParticlesWander();
        }

        function initParticlesWander() {
            const target = width < 768 ? 150 : 350;
            synchronizeParticleCount(target);
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
                // High-Fidelity Utah Teapot for Tech Art Portfolio
                // Body (Oblate Spheroid)
                for (let i = 0; i < 300; i++) {
                    const u = Math.random() * Math.PI * 2;
                    const v = Math.acos(2 * Math.random() - 1);
                    const rx = 0.6, ry = 0.42, rz = 0.6;
                    points.push({
                        x: rx * Math.sin(v) * Math.cos(u),
                        y: ry * Math.cos(v) - 0.1,
                        z: rz * Math.sin(v) * Math.sin(u)
                    });
                }
                // Lid & Knob
                for (let i = 0; i < 80; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 0.38 * Math.sqrt(Math.random());
                    points.push({ x: r * Math.cos(angle), y: 0.35 + (0.05 * (1 - r / 0.38)), z: r * Math.sin(angle) });
                }
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 0.06;
                    points.push({ x: r * Math.cos(angle), y: 0.45 + Math.random() * 0.05, z: r * Math.sin(angle) });
                }
                // Spout (Refined Bezier-like curve)
                for (let i = 0; i < 120; i++) {
                    const t = i / 120;
                    const x = 0.4 + t * 0.7;
                    const y = -0.2 + Math.pow(t, 2) * 0.6 + Math.sin(t * Math.PI) * 0.1;
                    const radius = 0.12 * (1 - t * 0.6);
                    const ang = Math.random() * Math.PI * 2;
                    points.push({
                        x: x + Math.cos(ang) * radius * 0.4,
                        y: y + Math.sin(ang) * radius,
                        z: Math.sin(ang) * radius * 0.4
                    });
                }
                // Handle (Elegant C-Curve)
                for (let i = 0; i < 100; i++) {
                    const t = i / 100;
                    const angle = Math.PI * 0.2 + t * Math.PI * 1.5;
                    const r_handle = 0.4 + Math.sin(t * Math.PI) * 0.05;
                    const hx = -0.55 - Math.cos(angle) * r_handle;
                    const hy = 0.1 + Math.sin(angle) * r_handle * 1.1;
                    const thick = 0.06;
                    const j = Math.random() * Math.PI * 2;
                    points.push({
                        x: hx + Math.cos(j) * thick * 0.2,
                        y: hy,
                        z: Math.sin(j) * thick
                    });
                }
            } else if (type === 'light') {
                // Point-light shape (Diamond/Star)
                for (let i = 0; i < 350; i++) {
                    const u = Math.random() * Math.PI * 2;
                    const v = Math.acos(2 * Math.random() - 1);
                    const r = 0.8 / (Math.abs(Math.cos(u)) + Math.abs(Math.sin(u)) + Math.abs(Math.cos(v)));
                    points.push({
                        x: r * Math.sin(v) * Math.cos(u),
                        y: r * Math.cos(v),
                        z: r * Math.sin(v) * Math.sin(u)
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
                const target = width < 768 ? 150 : target3DPoints.length;
                synchronizeParticleCount(target);
            } else if (state === 'forming' && timeSinceChange > cycleTimes.hold) {
                state = 'wander';
                target3DPoints = [];
                const target = width < 768 ? 150 : 350;
                synchronizeParticleCount(target);
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
                    p.z = 0; // Baseline depth
                }

                // --- Lighting & Bloom Logic ---
                let intensity = 0.15; // Base ambient light
                let color = "255, 255, 255";

                if (mouse.active) {
                    const ldx = mouse.x - p.x;
                    const ldy = mouse.y - p.y;
                    const distSq = ldx * ldx + ldy * ldy;
                    if (distSq < 62500) { // 250px radius
                        const lDist = Math.sqrt(distSq);
                        const falloff = 1 - lDist / 250;
                        intensity += falloff * 0.85;
                        color = "220, 250, 255"; // Subtle cyan tint
                    }
                }

                const depthScale = 1 + (p.z * 0.5);
                const radius = Math.max(0.6, 1.8 * depthScale);
                const alpha = Math.max(0.1, Math.min(1, intensity + p.z * 0.3));

                // Draw Particle with Bloom if bright
                if (intensity > 0.5) {
                    ctx.save();
                    ctx.shadowBlur = 15 * intensity;
                    ctx.shadowColor = `rgba(${color}, ${intensity * 0.8})`;
                    ctx.fillStyle = `rgba(${color}, ${alpha})`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
                }
            });

            // Draw Connections
            ctx.beginPath();
            for (let i = 0; i < particles.length; i += 2) {
                const p1 = particles[i];
                for (let j = i + 1; j < Math.min(particles.length, i + 30); j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x; const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connectionDistance * connectionDistance) {
                        let lineAlpha = state === 'forming' ? 0.05 : 0.08;

                        if (mouse.active) {
                            const midX = (p1.x + p2.x) / 2;
                            const midY = (p1.y + p2.y) / 2;
                            const mdx = mouse.x - midX;
                            const mdy = mouse.y - midY;
                            const mDistSq = mdx * mdx + mdy * mdy;
                            if (mDistSq < 150 * 150) {
                                lineAlpha += (1 - Math.sqrt(mDistSq) / 150) * 0.5;
                            }
                        }

                        ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                    }
                }
            }
            ctx.stroke();

            drawGizmo(width * 0.9, height * 0.85, 40);
            requestAnimationFrame(animate);
        }
        animate();
    }

    // --- NEW TECH-ART VISUALS ---

    // 2. Blueprint Wires for Timeline
    function initBlueprintWires() {
        const timeline = document.getElementById('resume-timeline');
        if (!timeline) return;

        // Create SVG overlay
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "blueprint-connector");
        timeline.appendChild(svg);

        function updateWires() {
            const items = timeline.querySelectorAll('.resume-item');
            if (items.length < 2) return;

            svg.innerHTML = ''; // Clear
            const timelineRect = timeline.getBoundingClientRect();
            
            let pathData = "";
            let points = [];

            items.forEach((item, idx) => {
                const dot = item.querySelector('::before'); // We can't select pseudo-elements directly
                // So we'll use the item's top position + offset
                const itemRect = item.getBoundingClientRect();
                const y = itemRect.top - timelineRect.top + 8; // Adjust based on dot position (0.5rem = 8px)
                const x = 1.4; // Fixed offset from left border

                if (idx === 0) pathData += `M ${x} ${y}`;
                else {
                    const prevY = points[idx-1].y;
                    const midY = (prevY + y) / 2;
                    // Draw a subtle "S" curve like blueprint nodes
                    pathData += ` C ${x} ${midY}, ${x} ${midY}, ${x} ${y}`;
                }
                points.push({x, y});
            });

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("class", "blueprint-path");
            svg.appendChild(path);

            // Add animated pulses
            points.forEach((point, idx) => {
                if (idx === 0) return;
                const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                pulse.setAttribute("r", "3");
                pulse.setAttribute("class", "blueprint-pulse");
                svg.appendChild(pulse);

                const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
                animate.setAttribute("dur", `${2 + Math.random() * 2}s`);
                animate.setAttribute("repeatCount", "indefinite");
                animate.setAttribute("path", `M ${points[idx-1].x} ${points[idx-1].y} C ${points[idx-1].x} ${(points[idx-1].y + point.y)/2}, ${point.x} ${(points[idx-1].y + point.y)/2}, ${point.x} ${point.y}`);
                animate.setAttribute("begin", `${idx * 0.5}s`);
                pulse.appendChild(animate);
            });
        }

        // Initial draw and update on resize
        setTimeout(updateWires, 100);
        window.addEventListener('resize', updateWires);
    }

    // 3. Reveal on Scroll
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-on-scroll').forEach(section => {
            observer.observe(section);
        });
    }

    // Start visuals
    initScrollReveal();
    // blueprint-wires will be called after resume items are rendered in applySiteSettings
});

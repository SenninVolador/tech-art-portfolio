// Site Settings and Project Data
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '[::1]' ||
                window.location.hostname.startsWith('192.168.') ||
                window.location.hostname.startsWith('10.') ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname);

let projects = [];
let classifiedProjects = [];
let siteSettings = {};
let isClassifiedUnlocked = localStorage.getItem('portfolio-unlocked') === 'true';
let privateReelUrl = ""; // Will be fetched from classified_data.json
let isEditMode = false;
let currentProjectIndex = -1;
let currentActiveSlideIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // --- Remove Edit Toolbar if not in local environment ---
    if (!isLocal) {
        const editToolbar = document.getElementById('edit-toolbar');
        if (editToolbar) editToolbar.remove();
    }

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
        fetch('assets/settings.json?v=13').then(r => r.json()),
        fetch('assets/projects.json?v=13').then(r => r.json())
    ];

    if (isClassifiedUnlocked) {
        fetchPromises.push(fetch('assets/classified_data.json?v=13').then(r => r.json()).catch(() => ({ projects: [] })));
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

            // Auto-migration fallback for decoupled timelines
            if (siteSettings.resumeHistory && !siteSettings.resumeProductions) {
                siteSettings.resumeProductions = siteSettings.resumeHistory.filter(item => item.project && item.thumbnail);
                siteSettings.resumeExperience = siteSettings.resumeHistory.map(item => {
                    return { ...item };
                });
            }

            // Auto-migration fallback for tools & skills sections
            if (siteSettings.aboutSkills && !siteSettings.resumeToolsSections) {
                const toolMapping = {
                    'unreal': { name: 'Unreal Engine 5', logo: 'assets/img/software/unreal5.png', category: 'expert' },
                    'maya': { name: 'Autodesk Maya', logo: 'assets/img/software/maya.png', category: 'expert' },
                    'houdini': { name: 'SideFX Houdini', logo: 'assets/img/software/houdini.png', category: 'expert' },
                    'photoshop': { name: 'Adobe Photoshop', logo: 'assets/img/software/photoshop.png', category: 'professional' },
                    'substance': { name: 'Substance 3D', logo: 'assets/img/software/substance3d.png', category: 'expert' },
                    'unity': { name: 'Unity', logo: 'assets/img/software/unity.png', category: 'professional' },
                    'python': { name: 'Python', logo: 'assets/img/software/python.svg', category: 'professional' },
                    'git': { name: 'Git', logo: 'assets/img/software/git.svg', category: 'production' },
                    'perforce': { name: 'Perforce', logo: 'assets/img/software/perforce.png', category: 'production' },
                    'arnold': { name: 'Arnold Renderer', logo: 'assets/img/software/arnold.svg', category: 'proficient' },
                    'redshift': { name: 'Redshift', logo: 'assets/img/software/redshift.svg', category: 'proficient' },
                    'jengafx': { name: 'JengaFX EmberGen', logo: 'assets/img/software/embergen.svg', category: 'proficient' },
                    'embergen': { name: 'JengaFX EmberGen', logo: 'assets/img/software/embergen.svg', category: 'proficient' }
                };

                const toolCats = {
                    expert: { title: "I'M AN EXPERT IN", tools: [] },
                    professional: { title: "I AM PROFESSIONAL AT", tools: [] },
                    proficient: { title: "I AM PROFICIENT IN", tools: [] },
                    production: { title: "PRODUCTION TOOLS", tools: [] }
                };

                const skillCats = {
                    shadersVfx: { title: "Shaders & VFX", skills: [] },
                    lightingRendering: { title: "Lighting & Rendering", skills: [] },
                    pipelineOptimization: { title: "Pipeline & Optimization", skills: [] }
                };

                siteSettings.aboutSkills.forEach(skillItem => {
                    let skillName = typeof skillItem === 'string' ? skillItem : skillItem.name;
                    let customLogo = typeof skillItem === 'object' ? skillItem.logo : '';
                    const lowerSkill = skillName.toLowerCase();
                    
                    let matchedTool = null;
                    if (customLogo) {
                        let category = 'proficient';
                        for (const key in toolMapping) {
                            if (lowerSkill.includes(key)) {
                                category = toolMapping[key].category;
                                break;
                            }
                        }
                        matchedTool = { name: skillName, logo: customLogo, category };
                    } else {
                        for (const key in toolMapping) {
                            if (lowerSkill.includes(key)) {
                                matchedTool = { ...toolMapping[key] };
                                break;
                            }
                        }
                    }

                    if (matchedTool) {
                        toolCats[matchedTool.category].tools.push({ name: matchedTool.name, logo: matchedTool.logo });
                    } else {
                        if (lowerSkill.includes('shader') || lowerSkill.includes('material') || lowerSkill.includes('vfx') || lowerSkill.includes('particle') || lowerSkill.includes('niagara')) {
                            skillCats.shadersVfx.skills.push(skillName);
                        } else if (lowerSkill.includes('light') || lowerSkill.includes('render') || lowerSkill.includes('lumen') || lowerSkill.includes('gpulm')) {
                            skillCats.lightingRendering.skills.push(skillName);
                        } else {
                            skillCats.pipelineOptimization.skills.push(skillName);
                        }
                    }
                });

                siteSettings.resumeToolsSections = Object.values(toolCats).filter(cat => cat.tools.length > 0);
                siteSettings.resumeSkillsSections = Object.values(skillCats).filter(cat => cat.skills.length > 0);
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

    let activeSkillUploadIndex = null;
    let activeToolUploadInfo = null;
    let draggedItemInfo = null;

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
        if (aboutTitle && siteSettings.aboutTitle) {
            aboutTitle.textContent = siteSettings.aboutTitle;
        }
        if (aboutDesc && siteSettings.aboutDescription) {
            aboutDesc.textContent = siteSettings.aboutDescription;
        }

        const toolsView = document.getElementById('tools-view');
        const skillsView = document.getElementById('skills-view');

        // Setup Tools View
        if (toolsView && siteSettings.resumeToolsSections) {
            toolsView.innerHTML = '';
            
            siteSettings.resumeToolsSections.forEach((section, sIdx) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'tools-group';
                groupDiv.dataset.sectionIndex = sIdx;
                if (isEditMode) {
                    groupDiv.setAttribute('draggable', 'true');
                }
                
                // Section Header edit container
                const headerCtr = document.createElement('div');
                headerCtr.className = 'section-header-edit-container';
                
                const h3 = document.createElement('h3');
                h3.textContent = section.title;
                if (isEditMode) {
                    h3.setAttribute('contenteditable', 'true');
                    h3.addEventListener('blur', () => {
                        section.title = h3.textContent.trim();
                    });
                }
                headerCtr.appendChild(h3);
                
                if (isEditMode) {
                    const deleteSecBtn = document.createElement('button');
                    deleteSecBtn.type = 'button';
                    deleteSecBtn.className = 'section-delete-btn';
                    deleteSecBtn.title = 'Delete Section';
                    deleteSecBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                    deleteSecBtn.addEventListener('click', () => {
                        if (confirm(`Are you sure you want to delete section "${section.title}"?`)) {
                            siteSettings.resumeToolsSections.splice(sIdx, 1);
                            applySiteSettings();
                        }
                    });
                    headerCtr.appendChild(deleteSecBtn);
                }
                groupDiv.appendChild(headerCtr);
                
                // Grid Div
                const gridDiv = document.createElement('div');
                gridDiv.className = 'tools-grid';
                gridDiv.dataset.sectionIndex = sIdx;
                
                section.tools.forEach((tool, tIdx) => {
                    const item = document.createElement('div');
                    item.className = 'tool-item';
                    item.setAttribute('data-tooltip', tool.name);
                    item.dataset.sectionIndex = sIdx;
                    item.dataset.toolIndex = tIdx;
                    if (isEditMode) {
                        item.setAttribute('draggable', 'true');
                    }
                    
                    const deleteBtn = isEditMode ? `<span class="delete-skill-badge" style="position:absolute; top:-5px; right:-5px; background:#ff3366; color:white; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:10px; cursor:pointer; z-index:10;" title="Delete Tool">&times;</span>` : '';
                    
                    const uploadOverlay = isEditMode ? `
                        <div class="tool-item-upload-overlay" title="Upload Custom Logo">
                            <i class="fa-solid fa-camera"></i>
                        </div>
                    ` : '';
                    
                    item.innerHTML = `
                        ${deleteBtn}
                        ${uploadOverlay}
                        <img src="${tool.logo || 'assets/img/software/default.svg'}" alt="${tool.name}">
                    `;
                    
                    if (isEditMode) {
                        // Click on badge deletes
                        const badge = item.querySelector('.delete-skill-badge');
                        if (badge) {
                            badge.addEventListener('click', (e) => {
                                e.stopPropagation();
                                section.tools.splice(tIdx, 1);
                                applySiteSettings();
                            });
                        }
                        
                        // Click on tool item triggers logo upload
                        item.addEventListener('click', (e) => {
                            if (e.target.closest('.delete-skill-badge')) return;
                            activeToolUploadInfo = { sectionIndex: sIdx, toolIndex: tIdx };
                            const fileInput = document.getElementById('upload-skill-logo-file');
                            if (fileInput) fileInput.click();
                        });
                    }
                    gridDiv.appendChild(item);
                });
                
                groupDiv.appendChild(gridDiv);
                
                // Add tool button inside group
                if (isEditMode) {
                    const addToolBtn = document.createElement('button');
                    addToolBtn.type = 'button';
                    addToolBtn.className = 'add-item-btn-inline';
                    addToolBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Tool';
                    addToolBtn.addEventListener('click', () => {
                        const newName = prompt("Enter new tool name:");
                        if (newName && newName.trim()) {
                            section.tools.push({
                                name: newName.trim(),
                                logo: 'assets/img/software/default.svg'
                            });
                            applySiteSettings();
                        }
                    });
                    groupDiv.appendChild(addToolBtn);
                }
                
                toolsView.appendChild(groupDiv);
            });
            
            // Add Section button for Tools column
            if (isEditMode) {
                const addSecContainer = document.createElement('div');
                addSecContainer.className = 'add-section-btn-container';
                const addSecBtn = document.createElement('button');
                addSecBtn.type = 'button';
                addSecBtn.className = 'btn btn-outline';
                addSecBtn.style.width = '100%';
                addSecBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Tools Section';
                addSecBtn.addEventListener('click', () => {
                    const newTitle = prompt("Enter new Tools Section title:");
                    if (newTitle && newTitle.trim()) {
                        siteSettings.resumeToolsSections.push({
                            title: newTitle.trim().toUpperCase(),
                            tools: []
                        });
                        applySiteSettings();
                    }
                });
                addSecContainer.appendChild(addSecBtn);
                toolsView.appendChild(addSecContainer);
            }
        }

        // Setup Skills View
        if (skillsView && siteSettings.resumeSkillsSections) {
            skillsView.innerHTML = '';
            
            const columnGrid = document.createElement('div');
            columnGrid.className = 'skills-column-grid';
            
            siteSettings.resumeSkillsSections.forEach((section, sIdx) => {
                const colDiv = document.createElement('div');
                colDiv.className = 'skills-col';
                colDiv.dataset.sectionIndex = sIdx;
                if (isEditMode) {
                    colDiv.setAttribute('draggable', 'true');
                }
                
                // Section Header edit container
                const headerCtr = document.createElement('div');
                headerCtr.className = 'section-header-edit-container';
                
                const h3 = document.createElement('h3');
                h3.textContent = section.title;
                if (isEditMode) {
                    h3.setAttribute('contenteditable', 'true');
                    h3.addEventListener('blur', () => {
                        section.title = h3.textContent.trim();
                    });
                }
                headerCtr.appendChild(h3);
                
                if (isEditMode) {
                    const deleteSecBtn = document.createElement('button');
                    deleteSecBtn.type = 'button';
                    deleteSecBtn.className = 'section-delete-btn';
                    deleteSecBtn.title = 'Delete Section';
                    deleteSecBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                    deleteSecBtn.addEventListener('click', () => {
                        if (confirm(`Are you sure you want to delete section "${section.title}"?`)) {
                            siteSettings.resumeSkillsSections.splice(sIdx, 1);
                            applySiteSettings();
                        }
                    });
                    headerCtr.appendChild(deleteSecBtn);
                }
                colDiv.appendChild(headerCtr);
                
                // List ul
                const ul = document.createElement('ul');
                ul.dataset.sectionIndex = sIdx;
                
                section.skills.forEach((skill, skIdx) => {
                    const li = document.createElement('li');
                    li.dataset.sectionIndex = sIdx;
                    li.dataset.skillIndex = skIdx;
                    if (isEditMode) {
                        li.setAttribute('draggable', 'true');
                    }
                    
                    const deleteBtn = isEditMode ? `<span class="delete-skill-text-btn" style="color:#ff3366; margin-left: 8px; cursor:pointer; font-weight:bold; font-size: 1.1rem; vertical-align: middle;" title="Delete">&times;</span>` : '';
                    
                    li.innerHTML = `
                        <span class="skill-text-label" ${isEditMode ? 'contenteditable="true"' : ''}>${skill}</span>
                        ${deleteBtn}
                    `;
                    
                    if (isEditMode) {
                        const labelSpan = li.querySelector('.skill-text-label');
                        labelSpan.addEventListener('blur', () => {
                            const updatedVal = labelSpan.textContent.trim();
                            if (updatedVal) {
                                section.skills[skIdx] = updatedVal;
                            }
                        });
                        
                        const delBtn = li.querySelector('.delete-skill-text-btn');
                        if (delBtn) {
                            delBtn.addEventListener('click', () => {
                                section.skills.splice(skIdx, 1);
                                applySiteSettings();
                            });
                        }
                    }
                    
                    ul.appendChild(li);
                });
                colDiv.appendChild(ul);
                
                // Add skill button inside group
                if (isEditMode) {
                    const addSkillBtn = document.createElement('button');
                    addSkillBtn.type = 'button';
                    addSkillBtn.className = 'add-item-btn-inline';
                    addSkillBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Skill';
                    addSkillBtn.addEventListener('click', () => {
                        const newName = prompt("Enter new skill name:");
                        if (newName && newName.trim()) {
                            section.skills.push(newName.trim());
                            applySiteSettings();
                        }
                    });
                    colDiv.appendChild(addSkillBtn);
                }
                
                columnGrid.appendChild(colDiv);
            });
            
            skillsView.appendChild(columnGrid);
            
            // Add Section button for Skills column
            if (isEditMode) {
                const addSecContainer = document.createElement('div');
                addSecContainer.className = 'add-section-btn-container';
                const addSecBtn = document.createElement('button');
                addSecBtn.type = 'button';
                addSecBtn.className = 'btn btn-outline';
                addSecBtn.style.width = '100%';
                addSecBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Skills Section';
                addSecBtn.addEventListener('click', () => {
                    const newTitle = prompt("Enter new Skills Section title:");
                    if (newTitle && newTitle.trim()) {
                        siteSettings.resumeSkillsSections.push({
                            title: newTitle.trim(),
                            skills: []
                        });
                        applySiteSettings();
                    }
                });
                addSecContainer.appendChild(addSecBtn);
                skillsView.appendChild(addSecContainer);
            }
        }

        // Resume Section
        const productionsTimeline = document.getElementById('productions-timeline');
        const experienceTimeline = document.getElementById('experience-timeline');
        const resumeTitle = document.getElementById('resume-title');
        const resumeSubtitle = document.getElementById('resume-subtitle');
        const resumeDownload = document.getElementById('resume-download');

        if (resumeTitle && siteSettings.resumeTitle) {
            resumeTitle.textContent = siteSettings.resumeTitle;
        }
        if (resumeSubtitle && siteSettings.resumeSubtitle) {
            resumeSubtitle.textContent = siteSettings.resumeSubtitle;
        }
        if (resumeDownload && siteSettings.resumeDownloadUrl) {
            resumeDownload.href = siteSettings.resumeDownloadUrl;
        }

        if (siteSettings.resumeProductions && productionsTimeline) {
            productionsTimeline.innerHTML = '';
            siteSettings.resumeProductions.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'production-card-item';
                div.style.position = 'relative';
                if (isEditMode) {
                    div.setAttribute('draggable', 'true');
                }

                const editOverlayHtml = isEditMode ? `
                    <div class="card-edit-overlay">
                        <button type="button" class="editor-action-btn edit-card-btn" data-index="${index}" data-type="production" title="Edit Production"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="editor-action-btn delete-btn delete-card-btn" data-index="${index}" data-type="production" title="Delete Production"><i class="fa-solid fa-trash"></i></button>
                    </div>
                ` : '';

                div.innerHTML = `
                    ${editOverlayHtml}
                    <div class="production-card-thumb">
                        <img src="${item.thumbnail}" alt="${item.project}">
                    </div>
                    <div class="production-card-info">
                        <div class="production-card-header">
                            <h4>${item.project}</h4>
                            <span class="period">${item.period}</span>
                        </div>
                        <span class="role">${item.role} <span class="divider">|</span> ${item.company}</span>
                        <p class="description">${item.description}</p>
                    </div>
                `;
                productionsTimeline.appendChild(div);
            });
        }

        if (siteSettings.resumeExperience && experienceTimeline) {
            experienceTimeline.innerHTML = '';
            siteSettings.resumeExperience.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'experience-list-item';
                div.style.position = 'relative';
                if (isEditMode) {
                    div.setAttribute('draggable', 'true');
                }

                const editOverlayHtml = isEditMode ? `
                    <div class="card-edit-overlay">
                        <button type="button" class="editor-action-btn edit-card-btn" data-index="${index}" data-type="experience" title="Edit Experience"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="editor-action-btn delete-btn delete-card-btn" data-index="${index}" data-type="experience" title="Delete Experience"><i class="fa-solid fa-trash"></i></button>
                    </div>
                ` : '';

                div.innerHTML = `
                    ${editOverlayHtml}
                    <div class="exp-item-header">
                        <h4>${item.company}</h4>
                        <span class="exp-period">${item.period}</span>
                    </div>
                    <span class="exp-role">${item.role}</span>
                    ${item.project ? `<span class="exp-project-link">Project: ${item.project}</span>` : ''}
                    <p class="description">${item.description}</p>
                `;
                experienceTimeline.appendChild(div);
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
        projects.forEach((p, index) => {
            const article = document.createElement('article');
            article.className = `project-card ${p.size || 'medium'}`;
            article.setAttribute('data-category', p.category);
            if (isEditMode) {
                article.setAttribute('draggable', 'true');
            }

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

            const editOverlayHtml = isEditMode ? `
                <div class="card-edit-overlay">
                    <button type="button" class="editor-action-btn edit-card-btn" data-index="${index}" data-type="portfolio" title="Edit Project"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="editor-action-btn delete-btn delete-card-btn" data-index="${index}" data-type="portfolio" title="Delete Project"><i class="fa-solid fa-trash"></i></button>
                </div>
            ` : '';

            article.innerHTML = `
                ${editOverlayHtml}
                <div class="media-container">
                    <div class="media-placeholder" style="${bgStyle}; background-size: cover; background-position: center;"></div>
                    <div class="overlay">
                        <h3>${p.title}</h3>
                        <p>${shortDesc}</p>
                        ${p.tags ? p.tags.slice(0, 2).map(t => `<span class="tech-tag ${p.isConfidential ? 'confidential-tag' : ''}">${t}</span>`).join('') : ''}
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

        if (isEditMode) {
            const addCard = document.createElement('div');
            addCard.className = 'card-add-btn';
            addCard.innerHTML = `<i class="fa-solid fa-plus"></i><span>Add Project</span>`;
            addCard.addEventListener('click', () => {
                openProjectModal(-1, 'portfolio');
            });
            bentoGrid.appendChild(addCard);
        }

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
        function playPrivateReel() {
            if (!isClassifiedUnlocked) {
                if (classifiedModal) {
                    classifiedModal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                    if (passInput) passInput.focus();
                }
                return;
            }

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
                if (privateReelUrl.includes('vimeo')) {
                    iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=0`;
                } else if (privateReelUrl.includes('youtube') || privateReelUrl.includes('youtu.be')) {
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                } else {
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
        }

        if (privateReelBtn) {
            privateReelBtn.addEventListener('click', playPrivateReel);
        }

        const heroReelTrigger = document.getElementById('private-reel-hero-trigger');
        if (heroReelTrigger) {
            heroReelTrigger.addEventListener('click', playPrivateReel);
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
                        if (unlockBtn) {
                            unlockBtn.classList.add('unlocked');
                            unlockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Confidential';
                        }
                        const relockBtn = document.getElementById('relock-btn');
                        if (relockBtn) relockBtn.style.display = 'inline-block';
                        
                        classifiedModal.classList.remove('open');
                        document.body.style.overflow = '';
                        passInput.value = '';
                        passError.textContent = '';
                        
                        // Automatically switch to confidential filter after unlock
                        if (unlockBtn) {
                            unlockBtn.click();
                        }
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
                const index = projects.findIndex(p => p.title === title);
                
                if (index !== -1) {
                    currentProjectIndex = index;
                    currentProjectData = projects[index];
                    currentActiveSlideIndex = 0;

                    modalTitle.textContent = currentProjectData.title || '';
                    modalDesc.innerHTML = currentProjectData.description || '';

                    // Apply Edit Mode elements
                    if (isEditMode) {
                        modalTitle.setAttribute('contenteditable', 'true');
                        modalDesc.setAttribute('contenteditable', 'true');

                        const adminCtrls = document.getElementById('modal-project-admin-controls');
                        if (adminCtrls) adminCtrls.style.display = 'flex';

                        const tagsEditCtr = document.getElementById('modal-tags-edit-container');
                        const tagsStaticCtr = document.getElementById('modal-tags');
                        if (tagsEditCtr) {
                            tagsEditCtr.style.display = 'block';
                            const tagsInput = document.getElementById('modal-tags-input');
                            if (tagsInput) {
                                tagsInput.value = currentProjectData.tags ? currentProjectData.tags.join(', ') : '';
                            }
                        }
                        if (tagsStaticCtr) tagsStaticCtr.style.display = 'none';
                    } else {
                        modalTitle.removeAttribute('contenteditable');
                        modalDesc.removeAttribute('contenteditable');

                        const adminCtrls = document.getElementById('modal-project-admin-controls');
                        if (adminCtrls) adminCtrls.style.display = 'none';

                        const tagsEditCtr = document.getElementById('modal-tags-edit-container');
                        const tagsStaticCtr = document.getElementById('modal-tags');
                        if (tagsEditCtr) tagsEditCtr.style.display = 'none';
                        
                        if (tagsStaticCtr) {
                            tagsStaticCtr.style.display = 'flex';
                            tagsStaticCtr.innerHTML = '';
                            if (currentProjectData.tags) {
                                currentProjectData.tags.forEach(tag => {
                                    const span = document.createElement('span');
                                    span.textContent = tag;
                                    tagsStaticCtr.appendChild(span);
                                });
                            }
                        }
                    }

                    // Build tabs based on project gallery
                    const gallery = currentProjectData.gallery || [];
                    buildGalleryTabs(gallery);
                    updateModalVisual(0);

                    modal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        // Sync inline edits on blur
        if (modalTitle) {
            modalTitle.onblur = () => {
                if (isEditMode && currentProjectIndex !== -1) {
                    projects[currentProjectIndex].title = modalTitle.textContent.trim();
                }
            };
        }
        if (modalDesc) {
            modalDesc.onblur = () => {
                if (isEditMode && currentProjectIndex !== -1) {
                    projects[currentProjectIndex].description = modalDesc.innerHTML.trim();
                }
            };
        }
        const modalTagsInput = document.getElementById('modal-tags-input');
        if (modalTagsInput) {
            modalTagsInput.oninput = () => {
                if (isEditMode && currentProjectIndex !== -1) {
                    const val = modalTagsInput.value;
                    projects[currentProjectIndex].tags = val ? val.split(',').map(t => t.trim()).filter(Boolean) : [];
                }
            };
        }

        // Change Thumbnail button and file upload binding
        const modalChangeThumbBtn = document.getElementById('modal-change-thumb-btn');
        const modalChangeThumbFile = document.getElementById('modal-change-thumb-file');
        if (modalChangeThumbBtn && modalChangeThumbFile) {
            const newBtn = modalChangeThumbBtn.cloneNode(true);
            modalChangeThumbBtn.parentNode.replaceChild(newBtn, modalChangeThumbBtn);
            
            const newFile = modalChangeThumbFile.cloneNode(true);
            modalChangeThumbFile.parentNode.replaceChild(newFile, modalChangeThumbFile);

            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                newFile.click();
            });

            newFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && currentProjectIndex !== -1) {
                    newBtn.disabled = true;
                    newBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                    
                    uploadFile(file, (uploadedPath) => {
                        projects[currentProjectIndex].thumbnail = uploadedPath;
                        alert("Cover Thumbnail updated successfully!");
                        newBtn.disabled = false;
                        newBtn.innerHTML = `<i class="fa-solid fa-image"></i> Cover Thumbnail`;
                        newFile.value = '';
                        
                        // Update media view if the gallery is empty (which renders the thumbnail as fallback)
                        const gallery = projects[currentProjectIndex].gallery || [];
                        if (gallery.length === 0) {
                            updateModalVisual(0);
                        }
                    });
                }
            });
        }

        // Full Settings Modal click handler
        const modalOpenFullEditBtn = document.getElementById('modal-open-full-edit-btn');
        if (modalOpenFullEditBtn) {
            const newOpenBtn = modalOpenFullEditBtn.cloneNode(true);
            modalOpenFullEditBtn.parentNode.replaceChild(newOpenBtn, modalOpenFullEditBtn);
            newOpenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideModal();
                openProjectModal(currentProjectIndex, 'portfolio');
            });
        }

        function buildGalleryTabs(galleryItems) {
            viewToggleContainer.innerHTML = '';
            
            const activeGallery = galleryItems || [];
            
            if (activeGallery.length === 0 && !isEditMode) {
                return;
            }

            activeGallery.forEach((item, index) => {
                const btn = document.createElement('button');
                btn.className = 'toggle-btn';
                btn.textContent = item.label || `View ${index + 1}`;
                if (index === currentActiveSlideIndex) btn.classList.add('active');

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.view-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updateModalVisual(index);
                });
                viewToggleContainer.appendChild(btn);
            });

            // Show "+ Add" button if Edit Mode is active
            if (isEditMode) {
                const addBtn = document.createElement('button');
                addBtn.className = 'toggle-btn add-media-tab-btn';
                addBtn.style.cssText = 'border: 1px dashed var(--accent-color); color: var(--accent-color); padding: 0.35rem 0.8rem; display: inline-flex; align-items: center; gap: 4px;';
                addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';

                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'file';
                hiddenInput.accept = 'image/*,video/*';
                hiddenInput.multiple = true;
                hiddenInput.style.display = 'none';

                addBtn.appendChild(hiddenInput);
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hiddenInput.click();
                });

                hiddenInput.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        let uploadCount = 0;
                        const originalLength = activeGallery.length;

                        files.forEach(file => {
                            uploadFile(file, (uploadedPath) => {
                                const type = file.type.startsWith('video/') ? 'video' : 'image';
                                activeGallery.push({
                                    type: type,
                                    src: uploadedPath,
                                    label: file.name.split('.')[0] || 'Media'
                                });
                                uploadCount++;

                                if (uploadCount === files.length) {
                                    projects[currentProjectIndex].gallery = activeGallery;
                                    buildGalleryTabs(activeGallery);
                                    updateModalVisual(originalLength);
                                }
                            });
                        });
                    }
                });

                viewToggleContainer.appendChild(addBtn);
            }
        }

        function updateModalVisual(index) {
            if (!currentProjectData) return;
            currentActiveSlideIndex = index;
            modalVisualContainer.innerHTML = '';

            const activeGallery = currentProjectData.gallery || [];

            // Case 1: Empty gallery
            if (activeGallery.length === 0) {
                const slideControls = document.getElementById('modal-slide-controls');
                if (slideControls) slideControls.style.display = 'none';

                if (isEditMode) {
                    const emptyZone = document.createElement('div');
                    emptyZone.className = 'gallery-empty-uploader';
                    emptyZone.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem; text-align: center; cursor: pointer; border: 2px dashed var(--accent-color); border-radius: 8px; margin: 2rem; width: 85%; background: rgba(0,0,0,0.3);';
                    emptyZone.innerHTML = `
                        <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                        <h4 style="color: var(--text-primary); margin-bottom: 0.4rem; font-size: 1rem;">No media in this project gallery</h4>
                        <p style="color: var(--text-secondary); font-size: 0.8rem; max-width: 280px; margin-bottom: 1.2rem;">Click here to upload photos or videos to the gallery.</p>
                        <button type="button" class="btn btn-outline" style="font-size: 0.75rem; padding: 4px 10px; height: auto; line-height: normal; pointer-events: none;"><i class="fa-solid fa-plus"></i> Select Files</button>
                        <input type="file" id="modal-empty-upload-file" style="display: none;" accept="image/*,video/*" multiple>
                    `;

                    modalVisualContainer.appendChild(emptyZone);

                    const fileInput = emptyZone.querySelector('#modal-empty-upload-file');
                    emptyZone.addEventListener('click', () => {
                        fileInput.click();
                    });

                    fileInput.addEventListener('change', (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                            emptyZone.innerHTML = `
                                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                                <h4 style="color: var(--text-primary); margin-bottom: 0.4rem; font-size: 1rem;">Uploading files...</h4>
                                <p style="color: var(--text-secondary); font-size: 0.8rem;">Please wait while we process your media.</p>
                            `;

                            let uploadCount = 0;
                            const newGallery = [];

                            files.forEach(file => {
                                uploadFile(file, (uploadedPath) => {
                                    const type = file.type.startsWith('video/') ? 'video' : 'image';
                                    newGallery.push({
                                        type: type,
                                        src: uploadedPath,
                                        label: file.name.split('.')[0] || 'Media'
                                    });
                                    uploadCount++;

                                    if (uploadCount === files.length) {
                                        projects[currentProjectIndex].gallery = newGallery;
                                        currentProjectData.gallery = newGallery;
                                        buildGalleryTabs(newGallery);
                                        updateModalVisual(0);
                                    }
                                });
                            });
                        }
                    });
                } else {
                    // Fallback to thumbnail when not in edit mode
                    if (currentProjectData.thumbnail) {
                        const img = document.createElement('img');
                        img.src = currentProjectData.thumbnail;
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '100%';
                        img.style.objectFit = 'contain';
                        modalVisualContainer.appendChild(img);
                    } else {
                        const noMedia = document.createElement('div');
                        noMedia.style.cssText = 'color: var(--text-secondary); font-style: italic; font-size: 0.9rem;';
                        noMedia.textContent = 'No media available for this project.';
                        modalVisualContainer.appendChild(noMedia);
                    }
                }
                modalVisualContainer.style.background = '#000';
                return;
            }

            // Case 2: Render active slide
            const item = activeGallery[index];
            if (!item) return;

            // Render Slide Controls in Edit Mode
            const slideControls = document.getElementById('modal-slide-controls');
            if (slideControls) {
                if (isEditMode) {
                    slideControls.style.display = 'flex';
                    renderModalSlideControls(activeGallery, index);
                } else {
                    slideControls.style.display = 'none';
                }
            }

            const type = item.type;
            const src = item.src;

            if (type === 'video') {
                if (src && (src.includes('youtube.com') || src.includes('youtu.be'))) {
                    const videoId = src.includes('watch?v=') ? src.split('v=')[1].split('&')[0] : src.split('/').pop();
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    modalVisualContainer.appendChild(iframe);
                } else if (src) {
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
                } else {
                    showMediaUrlPlaceholder('[ Empty Video URL ]');
                }
            } else if (type === 'image') {
                if (src) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    modalVisualContainer.appendChild(img);
                } else {
                    showMediaUrlPlaceholder('[ Empty Image Source ]');
                }
            } else if (type === 'css') {
                const div = document.createElement('div');
                div.className = 'placeholder-visual';
                div.style.background = src || '#222';
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

        function showMediaUrlPlaceholder(text) {
            const div = document.createElement('div');
            div.style.cssText = 'color: #777; font-size: 0.9rem; font-style: italic; border: 1px dashed #333; padding: 2rem; border-radius: 4px;';
            div.textContent = text;
            modalVisualContainer.appendChild(div);
        }

        function renderModalSlideControls(activeGallery, index) {
            const slideControls = document.getElementById('modal-slide-controls');
            if (!slideControls) return;

            const item = activeGallery[index];
            if (!item) {
                slideControls.style.display = 'none';
                return;
            }

            slideControls.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <label style="font-size: 9px; color: var(--text-secondary); font-weight: bold; text-transform: uppercase;">Type</label>
                    <select id="modal-slide-type" style="padding: 4px; font-size: 11px; background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; font-family: inherit;">
                        <option value="image" ${item.type === 'image' ? 'selected' : ''}>Image</option>
                        <option value="video" ${item.type === 'video' ? 'selected' : ''}>Video</option>
                    </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 100px;">
                    <label style="font-size: 9px; color: var(--text-secondary); font-weight: bold; text-transform: uppercase;">Tab Label</label>
                    <input type="text" id="modal-slide-label" value="${item.label || ''}" placeholder="e.g. Cinematic Pass" style="padding: 4px 8px; font-size: 11px; background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; font-family: inherit;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; flex: 2; min-width: 150px;">
                    <label style="font-size: 9px; color: var(--text-secondary); font-weight: bold; text-transform: uppercase;">Source URL / Path</label>
                    <div style="display: flex; gap: 6px;">
                        <input type="text" id="modal-slide-src" value="${item.src || ''}" placeholder="e.g. assets/uploads/render.jpg" style="flex: 1; padding: 4px 8px; font-size: 11px; background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; font-family: inherit;">
                        <button type="button" class="btn btn-outline" id="modal-slide-upload-btn" style="padding: 0 10px; font-size: 10px; height: 24px; line-height: 22px; margin: 0; background: var(--border-color); display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-upload"></i> Upload</button>
                        <input type="file" id="modal-slide-upload-file" style="display: none;" accept="image/*,video/*">
                    </div>
                </div>
                <button type="button" class="btn btn-outline" id="modal-slide-delete-btn" style="border-color: #ff3366; color: #ff3366; font-size: 11px; padding: 4px 10px; margin-top: auto; height: 24px; line-height: 22px; margin-left: auto; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-trash"></i> Delete Slide</button>
            `;

            const typeSelect = slideControls.querySelector('#modal-slide-type');
            const labelInput = slideControls.querySelector('#modal-slide-label');
            const srcInput = slideControls.querySelector('#modal-slide-src');
            const uploadBtn = slideControls.querySelector('#modal-slide-upload-btn');
            const uploadFileEl = slideControls.querySelector('#modal-slide-upload-file');
            const deleteBtn = slideControls.querySelector('#modal-slide-delete-btn');

            typeSelect.addEventListener('change', (e) => {
                item.type = e.target.value;
                updateModalVisual(index);
            });

            labelInput.addEventListener('input', (e) => {
                const val = e.target.value;
                item.label = val;
                const tabBtns = document.querySelectorAll('.view-toggle .toggle-btn');
                if (tabBtns[index] && !tabBtns[index].classList.contains('add-media-tab-btn')) {
                    tabBtns[index].textContent = val || `View ${index + 1}`;
                }
            });

            srcInput.addEventListener('input', (e) => {
                item.src = e.target.value.trim();
            });

            srcInput.addEventListener('blur', () => {
                updateModalVisual(index);
            });

            srcInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    updateModalVisual(index);
                }
            });

            uploadBtn.addEventListener('click', () => {
                uploadFileEl.click();
            });

            uploadFileEl.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    uploadBtn.disabled = true;
                    uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                    
                    uploadFile(file, (uploadedPath) => {
                        item.src = uploadedPath;
                        srcInput.value = uploadedPath;
                        
                        const isVideo = file.type.startsWith('video/');
                        item.type = isVideo ? 'video' : 'image';
                        typeSelect.value = item.type;
                        
                        uploadBtn.disabled = false;
                        uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
                        uploadFileEl.value = '';
                        
                        updateModalVisual(index);
                    });
                }
            });

            deleteBtn.addEventListener('click', () => {
                if (confirm("Delete this slide from the gallery?")) {
                    activeGallery.splice(index, 1);
                    currentProjectData.gallery = activeGallery;
                    
                    const nextIndex = Math.max(0, index - 1);
                    currentActiveSlideIndex = nextIndex;
                    
                    buildGalleryTabs(activeGallery);
                    updateModalVisual(nextIndex);
                }
            });
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
        
        if (isEditMode) {
            initializePortfolio();
        }
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

    // ==========================================
    // --- 6. Live In-Place Editor Code ---
    // ==========================================

    const toggleEditBtn = document.getElementById('toggle-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    let currentEditingGallery = [];

    // Helper to render and bind event listeners in the project gallery manager
    function renderGalleryManager(gallery) {
        const container = document.getElementById('gallery-items-container');
        if (!container) return;
        container.innerHTML = '';

        if (!gallery || gallery.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.95rem; font-style: italic; text-align: center; padding: 1rem 0;">No media items in gallery yet. Add one below!</p>';
            return;
        }

        gallery.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'gallery-edit-item-row';
            row.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 1.2rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 12px; background: rgba(0,0,0,0.15); position: relative;';

            row.innerHTML = `
                <button type="button" class="delete-gallery-row-btn" style="position: absolute; top: 8px; right: 12px; background: transparent; border: none; color: #ff3366; cursor: pointer; font-size: 1.3rem; line-height: 1;" title="Delete Item">&times;</button>
                
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
                    <div class="input-group-edit">
                        <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 3px;">Type</label>
                        <select class="gallery-item-type" style="width: 100%; padding: 0.5rem; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;">
                            <option value="image" ${item.type === 'image' ? 'selected' : ''}>Image</option>
                            <option value="video" ${item.type === 'video' ? 'selected' : ''}>Video</option>
                        </select>
                    </div>
                    <div class="input-group-edit">
                        <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 3px;">Label (Tab Name)</label>
                        <input type="text" class="gallery-item-label" value="${item.label || ''}" placeholder="e.g. Final Render" style="width: 100%; padding: 0.5rem; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;">
                    </div>
                </div>
                
                <div class="input-group-edit">
                    <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 3px;">Source URL / File</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" class="gallery-item-src" value="${item.src || ''}" placeholder="assets/uploads/image.png" style="flex: 1; padding: 0.5rem; font-size: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;">
                        <button type="button" class="btn btn-outline upload-gallery-row-btn" style="padding: 0 12px; font-size: 11px; height: 32px; line-height: 30px;"><i class="fa-solid fa-upload"></i> Upload</button>
                        <input type="file" class="upload-gallery-row-file" style="display: none;" accept="image/*,video/*">
                    </div>
                </div>
            `;
            container.appendChild(row);

            // Bind delete button
            row.querySelector('.delete-gallery-row-btn').addEventListener('click', () => {
                gallery.splice(index, 1);
                renderGalleryManager(gallery);
            });

            // Bind change events to keep data in sync
            row.querySelector('.gallery-item-type').addEventListener('change', (e) => {
                item.type = e.target.value;
            });
            row.querySelector('.gallery-item-label').addEventListener('input', (e) => {
                item.label = e.target.value.trim();
            });
            row.querySelector('.gallery-item-src').addEventListener('input', (e) => {
                item.src = e.target.value.trim();
            });

            // Bind upload button
            const uploadBtn = row.querySelector('.upload-gallery-row-btn');
            const fileInput = row.querySelector('.upload-gallery-row-file');
            const srcInput = row.querySelector('.gallery-item-src');

            if (uploadBtn && fileInput && srcInput) {
                uploadBtn.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        uploadBtn.disabled = true;
                        uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

                        uploadFile(file, (uploadedPath) => {
                            srcInput.value = uploadedPath;
                            item.src = uploadedPath;
                            alert(`File uploaded and saved as "${uploadedPath}"!`);
                            uploadBtn.disabled = false;
                            uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
                            fileInput.value = '';
                        });
                    }
                });
            }
        });
    }

    // Add new row to gallery editor
    const addGalleryItemBtn = document.getElementById('add-gallery-item-btn');
    if (addGalleryItemBtn) {
        addGalleryItemBtn.addEventListener('click', () => {
            currentEditingGallery.push({
                type: 'image',
                label: `View ${currentEditingGallery.length + 1}`,
                src: ''
            });
            renderGalleryManager(currentEditingGallery);
        });
    }

    // List of editable DOM elements mapped to siteSettings keys
    const editableSelectors = {
        'hero-title': 'heroTitle',
        'hero-subtitle': 'heroSubtitle',
        'hero-specialties': 'heroSpecialties',
        'about-title': 'aboutTitle',
        'about-description': 'aboutDescription',
        'resume-title': 'resumeTitle',
        'resume-subtitle': 'resumeSubtitle',
        'contact-title': 'contactTitle',
        'contact-description': 'contactDescription'
    };

    // Toggle edit mode active class, contenteditable attributes and buttons
    function toggleEditMode() {
        if (!isLocal) return;
        isEditMode = !isEditMode;

        if (isEditMode) {
            document.body.classList.add('edit-active');
            Object.keys(editableSelectors).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.setAttribute('contenteditable', 'true');
            });

            // Re-render grids to draw overlays
            initializePortfolio();
            applySiteSettings();

            // Toggle toolbar buttons
            if (toggleEditBtn) toggleEditBtn.style.display = 'none';
            if (saveEditBtn) saveEditBtn.style.display = 'inline-block';
            if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';

            const uploadCvBtn = document.getElementById('upload-cv-btn');
            if (uploadCvBtn) uploadCvBtn.style.display = 'inline-block';
        } else {
            document.body.classList.remove('edit-active');
            Object.keys(editableSelectors).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.removeAttribute('contenteditable');
            });

            // Re-render grids to remove overlays
            initializePortfolio();
            applySiteSettings();

            // Toggle toolbar buttons
            if (toggleEditBtn) toggleEditBtn.style.display = 'inline-block';
            if (saveEditBtn) saveEditBtn.style.display = 'none';
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';

            const uploadCvBtn = document.getElementById('upload-cv-btn');
            if (uploadCvBtn) uploadCvBtn.style.display = 'none';
        }
    }

    if (toggleEditBtn) toggleEditBtn.addEventListener('click', toggleEditMode);

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            if (confirm("Cancel editing and discard all unsaved changes?")) {
                window.location.reload();
            }
        });
    }

    // Save Changes API Call
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            saveEditBtn.disabled = true;
            saveEditBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

            // Sync all contenteditable fields to siteSettings in-memory
            Object.keys(editableSelectors).forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    siteSettings[editableSelectors[id]] = el.textContent.trim();
                }
            });

            // Ensure old flat array is removed in favor of structured columns
            delete siteSettings.aboutSkills;

            // Filter out confidential projects from projects.json save
            const publicProjects = projects.filter(p => !p.isConfidential);

            // Save Settings
            const saveSettingsPromise = fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: 'settings', data: siteSettings })
            }).then(res => {
                if (!res.ok) throw new Error("Failed to save settings");
                return res.json();
            });

            // Save Projects
            const saveProjectsPromise = fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: 'projects', data: publicProjects })
            }).then(res => {
                if (!res.ok) throw new Error("Failed to save projects");
                return res.json();
            });

            Promise.all([saveSettingsPromise, saveProjectsPromise])
                .then(() => {
                    alert("Changes saved successfully!");
                    isEditMode = false;
                    window.location.reload();
                })
                .catch(err => {
                    console.error("Save error:", err);
                    alert("Error saving changes. Ensure the Node local server (server.js) is running.");
                    saveEditBtn.disabled = false;
                    saveEditBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Changes`;
                });
        });
    }

    // Dynamic Synchronization on blur
    Object.keys(editableSelectors).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('blur', () => {
                const settingKey = editableSelectors[id];
                siteSettings[settingKey] = el.textContent.trim();
                if (id === 'hero-title') {
                    el.setAttribute('data-text', el.textContent.trim());
                }
            });
        }
    });

    // Edit Modal Functionality
    function openProjectModal(index, type) {
        const modal = document.getElementById('edit-project-modal');
        const form = document.getElementById('edit-project-form');
        
        document.getElementById('edit-proj-id').value = index;
        document.getElementById('edit-proj-type').value = type;

        const conditionalProductionFields = document.querySelectorAll('.row-conditional-production');
        const periodDiv = document.getElementById('edit-proj-period').parentElement;
        const categoryDiv = document.getElementById('edit-proj-category').parentElement;
        const tagsGroup = document.getElementById('edit-proj-tags').closest('.input-group-edit');

        const galleryManagerGroup = document.getElementById('gallery-manager-group');

        if (type === 'portfolio') {
            conditionalProductionFields.forEach(el => el.style.display = 'none');
            periodDiv.style.display = 'none';
            categoryDiv.style.display = 'block';
            if (tagsGroup) tagsGroup.style.display = 'block';
            if (galleryManagerGroup) galleryManagerGroup.style.display = 'block';
        } else {
            conditionalProductionFields.forEach(el => el.style.display = 'block');
            periodDiv.style.display = 'block';
            categoryDiv.style.display = 'none';
            if (tagsGroup) tagsGroup.style.display = 'none';
            if (galleryManagerGroup) galleryManagerGroup.style.display = 'none';
        }

        if (index === -1) {
            form.reset();
            document.getElementById('edit-proj-id').value = -1;
            document.getElementById('edit-proj-type').value = type;
            currentEditingGallery = [];
        } else {
            if (type === 'portfolio') {
                const proj = projects[index];
                document.getElementById('edit-proj-title').value = proj.title || '';
                document.getElementById('edit-proj-thumbnail').value = proj.thumbnail || '';
                document.getElementById('edit-proj-description').value = proj.description || '';
                document.getElementById('edit-proj-tags').value = proj.tags ? proj.tags.join(', ') : '';
                document.getElementById('edit-proj-category').value = proj.category || 'shaders';
                currentEditingGallery = proj.gallery ? JSON.parse(JSON.stringify(proj.gallery)) : [];
            } else {
                const item = type === 'production'
                    ? siteSettings.resumeProductions[index]
                    : siteSettings.resumeExperience[index];
                document.getElementById('edit-proj-title').value = item.project || '';
                document.getElementById('edit-proj-company').value = item.company || '';
                document.getElementById('edit-proj-role').value = item.role || '';
                document.getElementById('edit-proj-period').value = item.period || '';
                document.getElementById('edit-proj-thumbnail').value = item.thumbnail || '';
                document.getElementById('edit-proj-description').value = item.description || '';
                currentEditingGallery = [];
            }
        }

        if (type === 'portfolio') {
            renderGalleryManager(currentEditingGallery);
        }

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    const editProjectForm = document.getElementById('edit-project-form');
    if (editProjectForm) {
        editProjectForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const index = parseInt(document.getElementById('edit-proj-id').value);
            const type = document.getElementById('edit-proj-type').value;

            const title = document.getElementById('edit-proj-title').value.trim();
            const company = document.getElementById('edit-proj-company').value.trim();
            const role = document.getElementById('edit-proj-role').value.trim();
            const period = document.getElementById('edit-proj-period').value.trim();
            const thumbnail = document.getElementById('edit-proj-thumbnail').value.trim();
            const description = document.getElementById('edit-proj-description').value.trim();
            const category = document.getElementById('edit-proj-category').value;
            const tagsInput = document.getElementById('edit-proj-tags').value;
            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

            if (type === 'portfolio') {
                const projData = {
                    title,
                    category,
                    tags,
                    description,
                    thumbnail,
                    size: index === -1 ? 'medium' : (projects[index]?.size || 'medium'),
                    gallery: currentEditingGallery
                };

                if (index === -1) {
                    projects.push(projData);
                } else {
                    projects[index] = { ...projects[index], ...projData };
                }
                
                initializePortfolio();
            } else {
                const itemData = {
                    company,
                    role,
                    period,
                    description
                };

                if (type === 'production') {
                    itemData.project = title;
                    itemData.thumbnail = thumbnail;

                    if (index === -1) {
                        if (!siteSettings.resumeProductions) siteSettings.resumeProductions = [];
                        siteSettings.resumeProductions.push(itemData);
                    } else {
                        siteSettings.resumeProductions[index] = itemData;
                    }
                } else {
                    if (title) {
                        itemData.project = title;
                    }

                    if (index === -1) {
                        if (!siteSettings.resumeExperience) siteSettings.resumeExperience = [];
                        siteSettings.resumeExperience.push(itemData);
                    } else {
                        siteSettings.resumeExperience[index] = itemData;
                    }
                }

                applySiteSettings();
            }

            document.getElementById('edit-project-modal').classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    const closeProjEdit = document.getElementById('close-project-edit');
    const cancelProjEdit = document.getElementById('cancel-project-edit');
    const projModal = document.getElementById('edit-project-modal');

    function closeProjModal() {
        if (projModal) {
            projModal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    if (closeProjEdit) closeProjEdit.addEventListener('click', closeProjModal);
    if (cancelProjEdit) cancelProjEdit.addEventListener('click', closeProjModal);
    if (projModal) {
        projModal.addEventListener('click', (e) => {
            if (e.target === projModal) closeProjModal();
        });
    }

    // Card Actions Click Handler (Edit/Delete delegation)
    const bentoGrid = document.querySelector('.bento-grid');
    if (bentoGrid) {
        bentoGrid.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-card-btn');
            const deleteBtn = e.target.closest('.delete-card-btn');
            
            if (editBtn) {
                e.stopPropagation();
                const index = parseInt(editBtn.getAttribute('data-index'));
                openProjectModal(index, 'portfolio');
            } else if (deleteBtn) {
                e.stopPropagation();
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                if (confirm(`Are you sure you want to delete "${projects[index].title}"?`)) {
                    projects.splice(index, 1);
                    initializePortfolio();
                }
            }
        });
    }

    const productionsTimeline = document.getElementById('productions-timeline');
    if (productionsTimeline) {
        productionsTimeline.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-card-btn');
            const deleteBtn = e.target.closest('.delete-card-btn');
            
            if (editBtn) {
                const index = parseInt(editBtn.getAttribute('data-index'));
                openProjectModal(index, 'production');
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                if (confirm(`Are you sure you want to delete "${siteSettings.resumeProductions[index].project}" from productions?`)) {
                    siteSettings.resumeProductions.splice(index, 1);
                    applySiteSettings();
                }
            }
        });
    }

    const experienceTimeline = document.getElementById('experience-timeline');
    if (experienceTimeline) {
        experienceTimeline.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-card-btn');
            const deleteBtn = e.target.closest('.delete-card-btn');
            
            if (editBtn) {
                const index = parseInt(editBtn.getAttribute('data-index'));
                openProjectModal(index, 'experience');
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                if (confirm(`Are you sure you want to delete "${siteSettings.resumeExperience[index].company}" from experience?`)) {
                    siteSettings.resumeExperience.splice(index, 1);
                    applySiteSettings();
                }
            }
        });
    }

    const addProductionBtn = document.getElementById('add-production-btn');
    if (addProductionBtn) {
        addProductionBtn.addEventListener('click', () => {
            openProjectModal(-1, 'production');
        });
    }

    const addExperienceBtn = document.getElementById('add-experience-btn');
    if (addExperienceBtn) {
        addExperienceBtn.addEventListener('click', () => {
            openProjectModal(-1, 'experience');
        });
    }

    // --- 7. Client-side File Upload Handling ---
    
    // Helper function to upload files as base64 JSON
    function uploadFile(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Data = reader.result;
            fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, base64Data })
            })
            .then(res => {
                if (!res.ok) throw new Error("Upload failed");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    callback(data.filePath);
                } else {
                    alert("Upload failed: " + data.error);
                }
            })
            .catch(err => {
                console.error("Upload error:", err);
                alert("Upload error. Ensure the local server is running.");
            });
        };
    }

    // 1. Resume CV PDF Upload
    const uploadCvBtn = document.getElementById('upload-cv-btn');
    const uploadCvFile = document.getElementById('upload-cv-file');

    if (uploadCvBtn && uploadCvFile) {
        uploadCvBtn.addEventListener('click', () => {
            uploadCvFile.click();
        });

        uploadCvFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.name.endsWith('.pdf')) {
                    alert("Please select a PDF file.");
                    return;
                }

                uploadCvBtn.disabled = true;
                uploadCvBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

                uploadFile(file, (uploadedPath) => {
                    // Update settings references
                    siteSettings.resumeDownloadUrl = uploadedPath;
                    if (siteSettings.resume) {
                        siteSettings.resume.resumeDownloadUrl = uploadedPath;
                    }

                    // Update UI immediately
                    const resumeDownload = document.getElementById('resume-download');
                    if (resumeDownload) {
                        resumeDownload.href = uploadedPath;
                    }

                    alert(`CV PDF uploaded successfully as "${uploadedPath}"! Please click "Save Changes" on the bottom toolbar to write this updated configuration permanently to settings.json.`);
                    
                    // Reset elements
                    uploadCvBtn.disabled = false;
                    uploadCvBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload PDF`;
                    uploadCvFile.value = '';
                });
            }
        });
    }

    // 2. Project Thumbnail / Image / Video Upload in Edit Modal
    const uploadProjThumbBtn = document.getElementById('upload-proj-thumb-btn');
    const uploadProjThumbFile = document.getElementById('upload-proj-thumb-file');
    const editProjThumbnail = document.getElementById('edit-proj-thumbnail');

    if (uploadProjThumbBtn && uploadProjThumbFile && editProjThumbnail) {
        uploadProjThumbBtn.addEventListener('click', () => {
            uploadProjThumbFile.click();
        });

        uploadProjThumbFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadProjThumbBtn.disabled = true;
                uploadProjThumbBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

                uploadFile(file, (uploadedPath) => {
                    // Set input value
                    editProjThumbnail.value = uploadedPath;
                    alert(`Media file uploaded and saved as "${uploadedPath}"!`);
                    
                    // Reset elements
                    uploadProjThumbBtn.disabled = false;
                    uploadProjThumbBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
                    uploadProjThumbFile.value = '';
                });
            }
        });
    }

    // 3. Tool Logo Upload Handler
    const uploadSkillLogoFile = document.getElementById('upload-skill-logo-file');
    if (uploadSkillLogoFile) {
        uploadSkillLogoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && activeToolUploadInfo !== null) {
                uploadFile(file, (uploadedPath) => {
                    const section = siteSettings.resumeToolsSections[activeToolUploadInfo.sectionIndex];
                    if (section) {
                        const tool = section.tools[activeToolUploadInfo.toolIndex];
                        if (tool) {
                            tool.logo = uploadedPath;
                            alert(`Logo uploaded and saved for tool as "${uploadedPath}"! Please click "Save Changes" on the toolbar to make it permanent.`);
                            applySiteSettings();
                        }
                    }
                    uploadSkillLogoFile.value = '';
                    activeToolUploadInfo = null;
                });
            }
        });
    }

    // --- 8. Drag and Drop Reordering Logic ---
    let dragSourceIndex = null;
    let dragSourceType = null;

    // 1. Portfolio Grid Drag and Drop
    if (bentoGrid) {
        bentoGrid.addEventListener('dragstart', (e) => {
            if (!isEditMode) return;
            const card = e.target.closest('.project-card');
            if (card) {
                card.classList.add('dragging');
                const editBtn = card.querySelector('.edit-card-btn');
                if (editBtn) {
                    dragSourceIndex = parseInt(editBtn.getAttribute('data-index'));
                    dragSourceType = 'portfolio';
                    e.dataTransfer.effectAllowed = 'move';
                }
            }
        });

        bentoGrid.addEventListener('dragend', (e) => {
            const card = e.target.closest('.project-card');
            if (card) card.classList.remove('dragging');
            document.querySelectorAll('.project-card').forEach(c => c.classList.remove('drag-over'));
        });

        bentoGrid.addEventListener('dragover', (e) => {
            if (!isEditMode || dragSourceType !== 'portfolio') return;
            e.preventDefault();
            const card = e.target.closest('.project-card');
            if (card) card.classList.add('drag-over');
        });

        bentoGrid.addEventListener('dragleave', (e) => {
            const card = e.target.closest('.project-card');
            if (card) card.classList.remove('drag-over');
        });

        bentoGrid.addEventListener('drop', (e) => {
            if (!isEditMode || dragSourceType !== 'portfolio') return;
            e.preventDefault();
            const card = e.target.closest('.project-card');
            if (card) {
                const editBtn = card.querySelector('.edit-card-btn');
                if (editBtn) {
                    const targetIndex = parseInt(editBtn.getAttribute('data-index'));
                    if (dragSourceIndex !== null && targetIndex !== dragSourceIndex) {
                        const draggedItem = projects.splice(dragSourceIndex, 1)[0];
                        projects.splice(targetIndex, 0, draggedItem);
                        initializePortfolio();
                    }
                }
            }
        });
    }

    // 2. Productions Timeline Drag and Drop
    if (productionsTimeline) {
        productionsTimeline.addEventListener('dragstart', (e) => {
            if (!isEditMode) return;
            const card = e.target.closest('.production-card-item');
            if (card) {
                card.classList.add('dragging');
                const editBtn = card.querySelector('.edit-card-btn');
                if (editBtn) {
                    dragSourceIndex = parseInt(editBtn.getAttribute('data-index'));
                    dragSourceType = 'production';
                    e.dataTransfer.effectAllowed = 'move';
                }
            }
        });

        productionsTimeline.addEventListener('dragend', (e) => {
            const card = e.target.closest('.production-card-item');
            if (card) card.classList.remove('dragging');
            document.querySelectorAll('.production-card-item').forEach(c => c.classList.remove('drag-over'));
        });

        productionsTimeline.addEventListener('dragover', (e) => {
            if (!isEditMode || dragSourceType !== 'production') return;
            e.preventDefault();
            const card = e.target.closest('.production-card-item');
            if (card) card.classList.add('drag-over');
        });

        productionsTimeline.addEventListener('dragleave', (e) => {
            const card = e.target.closest('.production-card-item');
            if (card) card.classList.remove('drag-over');
        });

        productionsTimeline.addEventListener('drop', (e) => {
            if (!isEditMode || dragSourceType !== 'production') return;
            e.preventDefault();
            const card = e.target.closest('.production-card-item');
            if (card) {
                const editBtn = card.querySelector('.edit-card-btn');
                if (editBtn) {
                    const targetIndex = parseInt(editBtn.getAttribute('data-index'));
                    if (dragSourceIndex !== null && targetIndex !== dragSourceIndex) {
                        const draggedItem = siteSettings.resumeProductions.splice(dragSourceIndex, 1)[0];
                        siteSettings.resumeProductions.splice(targetIndex, 0, draggedItem);
                        applySiteSettings();
                    }
                }
            }
        });
    }

    // 3. Experience Timeline Drag and Drop
    if (experienceTimeline) {
        experienceTimeline.addEventListener('dragstart', (e) => {
            if (!isEditMode) return;
            const card = e.target.closest('.experience-list-item');
            if (card) {
                card.classList.add('dragging');
                const editBtn = card.querySelector('.edit-card-btn');
                if (editBtn) {
                    dragSourceIndex = parseInt(editBtn.getAttribute('data-index'));
                    dragSourceType = 'experience';
                    e.dataTransfer.effectAllowed = 'move';
                }
            }
        });

        experienceTimeline.addEventListener('dragend', (e) => {
            const card = e.target.closest('.experience-list-item');
            if (card) card.classList.remove('dragging');
            document.querySelectorAll('.experience-list-item').forEach(c => c.classList.remove('drag-over'));
        });

        experienceTimeline.addEventListener('dragover', (e) => {
            if (!isEditMode || dragSourceType !== 'experience') return;
            e.preventDefault();
            const card = e.target.closest('.experience-list-item');
            if (card) card.classList.add('drag-over');
        });

        experienceTimeline.addEventListener('dragleave', (e) => {
            const card = e.target.closest('.experience-list-item');
            if (card) card.classList.remove('drag-over');
        });

        experienceTimeline.addEventListener('drop', (e) => {
            if (!isEditMode || dragSourceType !== 'experience') return;
            e.preventDefault();
            const card = e.target.closest('.experience-list-item');
            if (card) {
                const editBtn = card.querySelector('.edit-card-btn');
                if (editBtn) {
                    const targetIndex = parseInt(editBtn.getAttribute('data-index'));
                    if (dragSourceIndex !== null && targetIndex !== dragSourceIndex) {
                        const draggedItem = siteSettings.resumeExperience.splice(dragSourceIndex, 1)[0];
                        siteSettings.resumeExperience.splice(targetIndex, 0, draggedItem);
                        applySiteSettings();
                    }
                }
            }
        });
    }
    const toolsViewContainer = document.getElementById('tools-view');
    if (toolsViewContainer) {
        toolsViewContainer.addEventListener('dragstart', (e) => {
            if (!isEditMode) return;
            const toolItem = e.target.closest('.tool-item');
            const toolsGroup = e.target.closest('.tools-group');
            
            if (toolItem) {
                toolItem.classList.add('dragging');
                dragSourceIndex = parseInt(toolItem.dataset.toolIndex);
                const sIdx = parseInt(toolItem.dataset.sectionIndex);
                dragSourceType = 'tool';
                draggedItemInfo = { type: 'tool', sectionIndex: sIdx, itemIndex: dragSourceIndex };
                e.dataTransfer.effectAllowed = 'move';
            } else if (toolsGroup && e.target === toolsGroup) {
                toolsGroup.classList.add('dragging');
                dragSourceIndex = parseInt(toolsGroup.dataset.sectionIndex);
                dragSourceType = 'tools-section';
                draggedItemInfo = { type: 'tools-section', index: dragSourceIndex };
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        toolsViewContainer.addEventListener('dragend', (e) => {
            document.querySelectorAll('.tool-item, .tools-group, .tools-grid').forEach(el => {
                el.classList.remove('dragging');
                el.classList.remove('drag-over');
            });
        });

        toolsViewContainer.addEventListener('dragover', (e) => {
            if (!isEditMode) return;
            const toolItem = e.target.closest('.tool-item');
            const toolsGrid = e.target.closest('.tools-grid');
            const toolsGroup = e.target.closest('.tools-group');
            
            if (dragSourceType === 'tool') {
                if (toolItem) {
                    e.preventDefault();
                    toolItem.classList.add('drag-over');
                } else if (toolsGrid) {
                    e.preventDefault();
                    toolsGrid.classList.add('drag-over');
                }
            } else if (dragSourceType === 'tools-section') {
                if (toolsGroup) {
                    e.preventDefault();
                    toolsGroup.classList.add('drag-over');
                }
            }
        });

        toolsViewContainer.addEventListener('dragleave', (e) => {
            const toolItem = e.target.closest('.tool-item');
            const toolsGrid = e.target.closest('.tools-grid');
            const toolsGroup = e.target.closest('.tools-group');
            if (toolItem) toolItem.classList.remove('drag-over');
            if (toolsGrid) toolsGrid.classList.remove('drag-over');
            if (toolsGroup) toolsGroup.classList.remove('drag-over');
        });

        toolsViewContainer.addEventListener('drop', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
            const toolItem = e.target.closest('.tool-item');
            const toolsGrid = e.target.closest('.tools-grid');
            const toolsGroup = e.target.closest('.tools-group');
            
            if (dragSourceType === 'tool' && draggedItemInfo && draggedItemInfo.type === 'tool') {
                let targetSecIdx = null;
                let targetToolIdx = null;
                
                if (toolItem) {
                    targetSecIdx = parseInt(toolItem.dataset.sectionIndex);
                    targetToolIdx = parseInt(toolItem.dataset.toolIndex);
                } else if (toolsGrid) {
                    targetSecIdx = parseInt(toolsGrid.dataset.sectionIndex);
                    targetToolIdx = siteSettings.resumeToolsSections[targetSecIdx].tools.length;
                }
                
                if (targetSecIdx !== null && targetToolIdx !== null) {
                    const sourceSecIdx = draggedItemInfo.sectionIndex;
                    const sourceToolIdx = draggedItemInfo.itemIndex;
                    
                    // Remove tool from source
                    const [item] = siteSettings.resumeToolsSections[sourceSecIdx].tools.splice(sourceToolIdx, 1);
                    
                    // Adjust target index if it was in the same section and after the source index
                    let insertIdx = targetToolIdx;
                    if (sourceSecIdx === targetSecIdx && sourceToolIdx < targetToolIdx) {
                        insertIdx = Math.max(0, targetToolIdx - 1);
                    }
                    
                    // Insert into target
                    siteSettings.resumeToolsSections[targetSecIdx].tools.splice(insertIdx, 0, item);
                    applySiteSettings();
                }
            } else if (dragSourceType === 'tools-section' && draggedItemInfo && draggedItemInfo.type === 'tools-section') {
                if (toolsGroup) {
                    const targetSecIdx = parseInt(toolsGroup.dataset.sectionIndex);
                    const sourceSecIdx = draggedItemInfo.index;
                    
                    if (sourceSecIdx !== targetSecIdx) {
                        const [sec] = siteSettings.resumeToolsSections.splice(sourceSecIdx, 1);
                        siteSettings.resumeToolsSections.splice(targetSecIdx, 0, sec);
                        applySiteSettings();
                    }
                }
            }
        });
    }

    // 5. Skills Column Drag and Drop
    const skillsViewContainer = document.getElementById('skills-view');
    if (skillsViewContainer) {
        skillsViewContainer.addEventListener('dragstart', (e) => {
            if (!isEditMode) return;
            const li = e.target.closest('li');
            const skillsCol = e.target.closest('.skills-col');
            
            if (li) {
                li.classList.add('dragging');
                dragSourceIndex = parseInt(li.dataset.skillIndex);
                const sIdx = parseInt(li.dataset.sectionIndex);
                dragSourceType = 'skill';
                draggedItemInfo = { type: 'skill', sectionIndex: sIdx, itemIndex: dragSourceIndex };
                e.dataTransfer.effectAllowed = 'move';
            } else if (skillsCol && e.target === skillsCol) {
                skillsCol.classList.add('dragging');
                dragSourceIndex = parseInt(skillsCol.dataset.sectionIndex);
                dragSourceType = 'skills-section';
                draggedItemInfo = { type: 'skills-section', index: dragSourceIndex };
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        skillsViewContainer.addEventListener('dragend', (e) => {
            document.querySelectorAll('#skills-view li, #skills-view .skills-col, #skills-view ul').forEach(el => {
                el.classList.remove('dragging');
                el.classList.remove('drag-over');
            });
        });

        skillsViewContainer.addEventListener('dragover', (e) => {
            if (!isEditMode) return;
            const li = e.target.closest('li');
            const ul = e.target.closest('ul');
            const skillsCol = e.target.closest('.skills-col');
            
            if (dragSourceType === 'skill') {
                if (li) {
                    e.preventDefault();
                    li.classList.add('drag-over');
                } else if (ul) {
                    e.preventDefault();
                    ul.classList.add('drag-over');
                }
            } else if (dragSourceType === 'skills-section') {
                if (skillsCol) {
                    e.preventDefault();
                    skillsCol.classList.add('drag-over');
                }
            }
        });

        skillsViewContainer.addEventListener('dragleave', (e) => {
            const li = e.target.closest('li');
            const ul = e.target.closest('ul');
            const skillsCol = e.target.closest('.skills-col');
            if (li) li.classList.remove('drag-over');
            if (ul) ul.classList.remove('drag-over');
            if (skillsCol) skillsCol.classList.remove('drag-over');
        });

        skillsViewContainer.addEventListener('drop', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
            const li = e.target.closest('li');
            const ul = e.target.closest('ul');
            const skillsCol = e.target.closest('.skills-col');
            
            if (dragSourceType === 'skill' && draggedItemInfo && draggedItemInfo.type === 'skill') {
                let targetSecIdx = null;
                let targetSkillIdx = null;
                
                if (li) {
                    targetSecIdx = parseInt(li.dataset.sectionIndex);
                    targetSkillIdx = parseInt(li.dataset.skillIndex);
                } else if (ul) {
                    targetSecIdx = parseInt(ul.dataset.sectionIndex);
                    targetSkillIdx = siteSettings.resumeSkillsSections[targetSecIdx].skills.length;
                }
                
                if (targetSecIdx !== null && targetSkillIdx !== null) {
                    const sourceSecIdx = draggedItemInfo.sectionIndex;
                    const sourceSkillIdx = draggedItemInfo.itemIndex;
                    
                    // Remove skill from source
                    const [item] = siteSettings.resumeSkillsSections[sourceSecIdx].skills.splice(sourceSkillIdx, 1);
                    
                    // Adjust target index if it was in the same section and after the source index
                    let insertIdx = targetSkillIdx;
                    if (sourceSecIdx === targetSecIdx && sourceSkillIdx < targetSkillIdx) {
                        insertIdx = Math.max(0, targetSkillIdx - 1);
                    }
                    
                    // Insert into target
                    siteSettings.resumeSkillsSections[targetSecIdx].skills.splice(insertIdx, 0, item);
                    applySiteSettings();
                }
            } else if (dragSourceType === 'skills-section' && draggedItemInfo && draggedItemInfo.type === 'skills-section') {
                if (skillsCol) {
                    const targetSecIdx = parseInt(skillsCol.dataset.sectionIndex);
                    const sourceSecIdx = draggedItemInfo.index;
                    
                    if (sourceSecIdx !== targetSecIdx) {
                        const [sec] = siteSettings.resumeSkillsSections.splice(sourceSecIdx, 1);
                        siteSettings.resumeSkillsSections.splice(targetSecIdx, 0, sec);
                        applySiteSettings();
                    }
                }
            }
        });
    }

    // Start visuals
    initScrollReveal();
});

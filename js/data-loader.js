// Data loader for personal website
document.addEventListener('DOMContentLoaded', function() {
    // Determine if current page is contact page
    const isContactPage = window.location.pathname.includes('contact.html');
    
    // 添加随机参数或时间戳以防止缓存
    const timestamp = new Date().getTime();
    
    // Load all data files
    Promise.all([
        fetch(`data/personal.json?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 personal.json: ${response.status}`);
                }
                return response.json();
            }),
        fetch(`data/publications.json?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 publications.json: ${response.status}`);
                }
                return response.json();
            }),
        fetch(`data/education.json?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 education.json: ${response.status}`);
                }
                return response.json();
            }),
        fetch(`data/experience.json?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 experience.json: ${response.status}`);
                }
                return response.json();
            }),
        fetch(`data/skills.json?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 skills.json: ${response.status}`);
                }
                return response.json();
            }),
        fetch(`data/news.json?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`无法加载 news.json: ${response.status}`);
                }
                return response.json();
            })
    ])
    .then(([personal, publications, education, experience, skills, news]) => {
        try {
            // Render footer and set title for all pages
            renderFooter(personal.footerText);
            document.title = `${isContactPage ? 'Contact' : ''} ${personal.name}'s Personal Homepage`.trim();
            
            if (isContactPage) {
                // Render contact page content
                renderContactPage(personal);
            } else {
                // Render all sections for the main page
                renderPersonalInfo(personal);
                
                // Only render highlights if they exist
                if (personal.highlights && Array.isArray(personal.highlights) && personal.highlights.length > 0) {
                    // Check if highlights container exists in the DOM
                    const highlightsContainer = document.getElementById('highlights-grid');
                    if (highlightsContainer) {
                        renderHighlights(personal.highlights);
                    }
                }
                
                renderNews(news.news);
                renderResearchInterests(personal.research_interests);
                renderSkills(skills.skills);
                renderPublications(publications.publications);
                renderEducation(education.education);
                renderExperience(experience);
                renderMisc(personal.misc);
            }
        } catch (renderError) {
            document.getElementById('loading-error').style.display = 'block';
            document.getElementById('loading-error').textContent = `渲染错误: ${renderError.message}`;
        }
    })
    .catch(error => {
        document.getElementById('loading-error').style.display = 'block';
        document.getElementById('loading-error').textContent = `数据加载失败: ${error.message}. 请刷新页面或稍后重试。`;
    });
});

// Render personal information
function renderPersonalInfo(data) {
    // Set name in header
    document.getElementById('name').textContent = data.name;
    
    // Set personal info
    const personalInfoHtml = `
        ${data.title}<br>
        ${data.department}<br>
        ${data.university}<br>
        ${data.location}<br>
        <strong>Email</strong>: ${data.email}
    `;
    document.getElementById('personal-info').innerHTML = personalInfoHtml;
    
    // Set bio - using innerHTML to support HTML content including links
    // Replace \n with <br> tags to ensure proper line breaks in HTML
    const bioWithLineBreaks = data.bio.replace(/\\n/g, '<br><br>');
    document.getElementById('bio').innerHTML = bioWithLineBreaks;
    
    // Set contact info in sidebar
    document.getElementById('contact-email').textContent = data.contact.email;
    document.getElementById('contact-location').textContent = data.contact.location;
    
    // Set social links
    const socialLinksContainer = document.getElementById('social-links');
    let socialHtml = '';
    
    data.social.forEach((link, index) => {
        socialHtml += `<a href="${link.url}" target="_blank"><i class="${link.icon}"></i> ${link.platform}</a>`;
        if (index < data.social.length - 1) {
            socialHtml += ' | ';
        }
    });
    
    // Add CV button
    socialHtml += ` | <a href="${data.cv.url}" target="_blank" class="cv-button"><i class="${data.cv.icon}"></i> ${data.cv.label}</a>`;
    
    socialLinksContainer.innerHTML = socialHtml;
    
    // Set page title
    document.title = `${data.name}'s Personal Homepage`;
}

// Render professional highlights
function renderHighlights(highlights) {
    const container = document.getElementById('highlights-grid');
    let html = '';
    
    highlights.forEach(item => {
        html += `
            <div class="highlight-item">
                <div class="highlight-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="highlight-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render news items
function renderNews(newsItems) {
    const container = document.getElementById('news-container');
    let html = '';
    
    newsItems.forEach((item, index) => {
        html += `
            <div class="news-item">
                <p>${index < 3 ? '🔥 ' : ''}[${item.date}] ${item.content}</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render research interests
function renderResearchInterests(interests) {
    const container = document.getElementById('research-interests');
    let html = '';
    
    interests.forEach(item => {
        html += `<li><strong>${item.area}</strong>: ${item.details}</li>`;
    });
    
    container.innerHTML = html;
}

// Render skills
function renderSkills(skillCategories) {
    const container = document.getElementById('skills-container');
    let html = '<table style="width: 100%;">';
    
    skillCategories.forEach(category => {
        html += `<tr>
            <td style="vertical-align: top; padding-right: 20px; font-weight: bold; width: 30%;">${category.category}</td>
            <td style="vertical-align: top;">`;
        
        if (category.skills) {
            // 对于带级别的技能，直接显示名称
            const skillNames = category.skills.map(skill => skill.name);
            html += skillNames.join(', ');
        } else if (category.items) {
            // 对于简单列表，直接显示所有项目
            html += category.items.join(', ');
        }
        
        html += '</td></tr>';
    });
    
    html += '</table>';
    container.innerHTML = html;
}

// Render publications
function renderPublications(publications) {
    const container = document.getElementById('publications-container');
    let html = '';
    
    publications.forEach((pub, index) => {
        try {
            // Build authors string with self highlighted
            let authorsHtml = '';
            if (pub.authors && Array.isArray(pub.authors)) {
                pub.authors.forEach((author, i) => {
                    if (author.is_self) {
                        authorsHtml += `<strong>${author.name}</strong>`;
                    } else {
                        authorsHtml += author.name;
                    }
                    
                    if (i < pub.authors.length - 1) {
                        authorsHtml += ', ';
                    }
                });
            } else {
                // Fallback if authors data is missing
                authorsHtml = 'Authors information unavailable';
            }
            
            // Build links
            let linksHtml = '';
            if (pub.links && Array.isArray(pub.links)) {
                pub.links.forEach((link, i) => {
                    linksHtml += `[<a href="${link.url}" target="_blank">${link.type}</a>]`;
                    if (i < pub.links.length - 1) {
                        linksHtml += ' ';
                    }
                });
                linksHtml += ` [<a href="#" onclick="toggleAbstract('abstract${index+1}'); return false;">Abstract</a>]`;
            }
            
            // Build rank and citation info - hide citations if zero or missing
            let rankHtml = '';
            if (pub.impact_factor) {
                rankHtml = `<span class="publication-impact">Rank: ${pub.impact_factor}`;
                
                // Only add citations if they exist and are greater than 0
                if (pub.citations && pub.citations > 0) {
                    rankHtml += `, Citations: ${pub.citations}`;
                }
                rankHtml += `</span>`;
            }
            
            // Build abstract HTML - handle missing abstracts
            const abstractHtml = pub.abstract 
                ? `<div id="abstract${index+1}" class="abstract" style="display:none;"><p>${pub.abstract}</p></div>`
                : `<div id="abstract${index+1}" class="abstract" style="display:none;"><p>Abstract not available</p></div>`;
            
            // Build the complete publication entry
            html += `
                <div class="publication">
                    <p>
                        <strong>"${pub.title || 'Untitled'}"</strong><br>
                        ${authorsHtml}<br>
                        <em>${pub.venue || 'Venue information unavailable'}</em><br>
                        ${rankHtml ? `${rankHtml}<br>` : ''}
                        ${linksHtml}
                    </p>
                    ${abstractHtml}
                </div>
            `;
        } catch (error) {
            console.error(`Error rendering publication at index ${index}:`, error);
            html += `
                <div class="publication">
                    <p>Error rendering publication. Please check the data format.</p>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    
    // See all publications button - use the all_publications_url from JSON if available
    const seeMoreBtn = document.getElementById('see-more-publications');
    
    // Fallback to a hardcoded URL if the JSON one isn't working
    const scholarUrl = "https://scholar.google.com/citations?view_op=list_works&hl=en&user=JM4i0R8AAAAJ";
    
    // Check if the all_publications_url exists and is not just "#"
    const rawPublicationsUrl = (publications.all_publications_url && 
                             publications.all_publications_url !== "#" && 
                             publications.all_publications_url.includes("scholar.google.com")) 
        ? publications.all_publications_url 
        : scholarUrl;
    
    // Properly encode the URL to ensure it works correctly
    const publicationsUrl = encodeURI(rawPublicationsUrl);
    
    // Use Google Scholar icon instead of arrow for the publications link
    seeMoreBtn.innerHTML = `<a href="${publicationsUrl}" target="_blank" rel="noopener noreferrer" class="see-more-button">
        View on Google Scholar <i class="fas fa-graduation-cap"></i>
    </a>`;
    
    // Directly bind the correct URL to the click event
    const scholarLink = seeMoreBtn.querySelector('a');
    scholarLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Force open the correct URL
        try {
            window.open(publicationsUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            // As a fallback, try direct assignment
            window.location.href = publicationsUrl;
        }
    });
}

// Render education
function renderEducation(education) {
    const container = document.getElementById('education-container');
    let html = '';
    
    education.forEach(item => {
        html += `<li><strong>${item.period}</strong>: ${item.degree}, ${item.field}, ${item.institution}</li>`;
    });
    
    container.innerHTML = html;
}

// Render experience and related info
function renderExperience(data) {
    // Work experience
    const expContainer = document.getElementById('experience-container');
    let expHtml = '';
    
    data.experience.forEach(item => {
        let details = item.department ? `, ${item.department}` : '';
        expHtml += `<li><strong>${item.period}</strong>: ${item.position}, ${item.company}${details}</li>`;
    });
    
    expContainer.innerHTML = expHtml;
    
    // Awards - 改为表格布局
    const awardsContainer = document.getElementById('awards-container');
    let awardsHtml = '<table style="width: 100%; border-collapse: collapse;">';
    
    data.awards.forEach(award => {
        awardsHtml += `
            <tr>
                <td style="padding-bottom: 10px; text-align: left; padding-right: 20px;">${award.name}</td>
                <td style="padding-bottom: 10px; text-align: right; white-space: nowrap; font-style: italic; color: #333; font-weight: 500;">${award.year}</td>
            </tr>
        `;
    });
    
    awardsHtml += '</table>';
    awardsContainer.innerHTML = awardsHtml;
    
    // Academic service
    const serviceContainer = document.getElementById('service-container');
    let serviceHtml = '';
    
    data.academic_service.reviewer.forEach(item => {
        serviceHtml += `<li>${item}</li>`;
    });
    
    serviceContainer.innerHTML = serviceHtml;
    
    // Teaching
    const teachingContainer = document.getElementById('teaching-container');
    let teachingHtml = '';
    
    data.teaching.forEach(item => {
        teachingHtml += `<li><strong>${item.period}</strong>: ${item.course}, ${item.role}</li>`;
    });
    
    teachingContainer.innerHTML = teachingHtml;
}

// Render miscellaneous section
function renderMisc(miscText) {
    document.getElementById('misc-content').innerHTML = miscText;
}

// Render footer
function renderFooter(footerText) {
    document.getElementById('footer-text').textContent = footerText;
}

// Render contact page
function renderContactPage(data) {
    const contactPage = data.contactPage;
    
    // Set page title and content
    document.getElementById('contact-title').textContent = contactPage.title;
    document.getElementById('contact-introduction').textContent = contactPage.introduction;
    
    // Render contact methods
    const methodsContainer = document.getElementById('contact-methods-container');
    let methodsHtml = '';
    
    contactPage.contactMethods.forEach(method => {
        methodsHtml += `
            <div class="contact-method">
                <i class="${method.icon}"></i>
                <h3>${method.type}</h3>
                <p>${method.details}</p>
            </div>
        `;
    });
    
    methodsContainer.innerHTML = methodsHtml;
    
    // 表单渲染代码已删除
} 
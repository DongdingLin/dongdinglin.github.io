// Data loader for personal website
const FALLBACK_PUBLICATIONS_URL = 'https://scholar.google.com/citations?view_op=list_works&hl=en&user=JM4i0R8AAAAJ';
const DATA_VERSION = '2026-02-11';
const HOME_DATA_FILES = [
    'personal.json',
    'publications.json',
    'education.json',
    'experience.json',
    'skills.json',
    'news.json'
];
const CONTACT_DATA_FILES = ['personal.json'];
const RECENT_NEWS_WINDOW_DAYS = 365;

document.addEventListener('DOMContentLoaded', function() {
    initBackToTop();
    initPage().catch(error => {
        showLoadingError(`Failed to load data: ${error.message}. Please refresh the page and try again.`);
    });
});

async function initPage() {
    const isContactPage = window.location.pathname.includes('contact.html');
    const fileNames = isContactPage ? CONTACT_DATA_FILES : HOME_DATA_FILES;
    const dataByFile = await loadDataFiles(fileNames);

    try {
        const personal = dataByFile['personal.json'] || {};
        const nameForTitle = personal.name || 'Dongding Lin';

        renderFooter(personal.footerText || '');
        document.title = `${isContactPage ? 'Contact' : ''} ${nameForTitle}'s Personal Homepage`.trim();

        if (isContactPage) {
            renderContactPage(personal);
            return;
        }

        renderPersonalInfo(personal);

        if (Array.isArray(personal.highlights) && personal.highlights.length > 0) {
            const highlightsContainer = document.getElementById('highlights-grid');
            if (highlightsContainer) {
                renderHighlights(personal.highlights);
            }
        }

        renderNews((dataByFile['news.json'] || {}).news);
        renderResearchInterests(personal.research_interests);
        renderSkills((dataByFile['skills.json'] || {}).skills);
        renderPublications(dataByFile['publications.json'] || {});
        renderEducation((dataByFile['education.json'] || {}).education);
        renderExperience(dataByFile['experience.json'] || {});
        renderMisc(personal.misc);
        initPublicationAbstractToggle();
    } catch (renderError) {
        showLoadingError(`Render error: ${renderError.message}`);
    }
}

async function loadDataFiles(fileNames) {
    const uniqueFiles = [...new Set(fileNames)];
    const entries = await Promise.all(
        uniqueFiles.map(async fileName => [fileName, await fetchJson(fileName)])
    );

    return Object.fromEntries(entries);
}

function fetchJson(fileName) {
    return fetch(buildDataUrl(fileName), { cache: 'default' }).then(response => {
        if (!response.ok) {
            throw new Error(`${fileName}: ${response.status}`);
        }
        return response.json();
    });
}

function buildDataUrl(fileName) {
    const versionSuffix = DATA_VERSION ? `?v=${encodeURIComponent(DATA_VERSION)}` : '';
    return `data/${fileName}${versionSuffix}`;
}

function showLoadingError(message) {
    const loadingError = document.getElementById('loading-error');
    if (!loadingError) {
        return;
    }

    loadingError.style.display = 'block';
    loadingError.textContent = message;
}

function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    if (!backToTopButton) {
        return;
    }

    const toggleVisibility = () => {
        backToTopButton.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    backToTopButton.addEventListener('click', function(event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initPublicationAbstractToggle() {
    const container = document.getElementById('publications-container');
    if (!container || container.dataset.abstractBound === 'true') {
        return;
    }

    container.addEventListener('click', function(event) {
        const button = event.target.closest('.abstract-toggle');
        if (!button) {
            return;
        }

        const abstractId = button.getAttribute('data-target');
        const abstract = document.getElementById(abstractId);
        if (!abstract) {
            return;
        }

        const expanding = abstract.hidden;
        abstract.hidden = !expanding;
        button.setAttribute('aria-expanded', String(expanding));
        button.textContent = expanding ? 'HIDE ABS' : 'ABS';

        if (expanding) {
            setTimeout(() => {
                abstract.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });

    container.dataset.abstractBound = 'true';
}

// Render personal information
function renderPersonalInfo(data) {
    const contact = data.contact || {};

    document.getElementById('name').textContent = data.name || '';

    const personalInfoHtml = [
        escapeHtml(data.title || ''),
        escapeHtml(data.department || ''),
        escapeHtml(data.university || ''),
        escapeHtml(data.location || ''),
        `<strong>Email</strong>: ${escapeHtml(data.email || '')}`
    ].join('<br>');
    document.getElementById('personal-info').innerHTML = personalInfoHtml;

    const bioWithLineBreaks = String(data.bio || '').replace(/\\n/g, '<br><br>');
    document.getElementById('bio').innerHTML = bioWithLineBreaks;

    document.getElementById('contact-email').textContent = contact.email || '';
    document.getElementById('contact-location').textContent = contact.location || '';

    const banner = document.getElementById('job-seeking-banner');
    if (banner) {
        const bannerText = typeof data.jobSeekingBanner === 'string' ? data.jobSeekingBanner.trim() : '';
        const bannerTextEl = banner.querySelector('.job-seeking-text');

        if (bannerText) {
            if (bannerTextEl) {
                bannerTextEl.textContent = bannerText;
            }
            banner.hidden = false;
        } else {
            banner.hidden = true;
        }
    }

    const socialLinksContainer = document.getElementById('social-links');
    const socialLinks = Array.isArray(data.social)
        ? data.social.map(link => {
            const iconClass = typeof link.icon === 'string' ? link.icon : 'fas fa-link';
            const platform = escapeHtml(link.platform || 'Link');
            const url = sanitizeUrl(link.url);
            return `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="${iconClass}"></i> ${platform}</a>`;
        })
        : [];

    const cvEntries = Array.isArray(data.cvs) ? data.cvs : (data.cv ? [data.cv] : []);
    const cvLinks = cvEntries.map(item => {
        const iconClass = typeof item.icon === 'string' ? item.icon : 'fas fa-file';
        const label = escapeHtml(item.label || 'CV');
        const url = sanitizeUrl(item.url);
        return `<a href="${url}" target="_blank" class="cv-button" rel="noopener noreferrer"><i class="${iconClass}"></i> ${label}</a>`;
    });

    socialLinksContainer.innerHTML = [...socialLinks, ...cvLinks].join('');

    if (data.name) {
        document.title = `${data.name}'s Personal Homepage`;
    }
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
                    <h3>${escapeHtml(item.title || '')}</h3>
                    <p>${escapeHtml(item.description || '')}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Render news items
function renderNews(newsItems) {
    const container = document.getElementById('news-container');
    const items = Array.isArray(newsItems) ? [...newsItems] : [];
    let html = '';

    items.sort((a, b) => (parseNewsDate(b.date) || 0) - (parseNewsDate(a.date) || 0));

    items.forEach(item => {
        const isRecent = isRecentNews(item.date);
        html += `
            <div class="news-item">
                <p>${isRecent ? '<span class="news-badge">NEW</span> ' : ''}<span class="news-date">[${escapeHtml(item.date || 'Date TBD')}]</span> ${escapeHtml(item.content || '')}</p>
            </div>
        `;
    });

    container.innerHTML = html || '<p>No news updates yet.</p>';
}

function parseNewsDate(rawDate) {
    if (typeof rawDate !== 'string') {
        return null;
    }

    const normalized = rawDate.trim();
    if (!normalized) {
        return null;
    }

    const directTimestamp = Date.parse(normalized);
    if (!Number.isNaN(directTimestamp)) {
        return directTimestamp;
    }

    const monthYearTimestamp = Date.parse(`1 ${normalized}`);
    if (!Number.isNaN(monthYearTimestamp)) {
        return monthYearTimestamp;
    }

    return null;
}

function isRecentNews(rawDate) {
    const parsedDate = parseNewsDate(rawDate);
    if (!parsedDate) {
        return false;
    }

    const daysAgo = (Date.now() - parsedDate) / (1000 * 60 * 60 * 24);
    return daysAgo >= 0 && daysAgo <= RECENT_NEWS_WINDOW_DAYS;
}

// Render research interests
function renderResearchInterests(interests) {
    const container = document.getElementById('research-interests');
    const list = Array.isArray(interests) ? interests : [];
    let html = '';

    list.forEach(item => {
        html += `<li><strong>${escapeHtml(item.area || '')}</strong>: ${escapeHtml(item.details || '')}</li>`;
    });

    container.innerHTML = html;
}

// Render skills
function renderSkills(skillCategories) {
    const container = document.getElementById('skills-container');
    const categories = Array.isArray(skillCategories) ? skillCategories : [];
    let html = '<div class="skills-grid">';

    categories.forEach(category => {
        const categoryName = escapeHtml(category.category || 'Other');
        const rawItems = Array.isArray(category.skills)
            ? category.skills.map(skill => skill.name)
            : (Array.isArray(category.items) ? category.items : []);
        const tags = rawItems
            .map(item => String(item || '').trim())
            .filter(item => item.length > 0)
            .map(item => `<span class="skill-tag">${escapeHtml(item)}</span>`)
            .join('');

        html += `
            <section class="skill-group">
                <h3>${categoryName}</h3>
                <div class="skill-tags">${tags || '<span class="skill-tag skill-tag-empty">TBD</span>'}</div>
            </section>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Render publications
function renderPublications(publicationsData) {
    const container = document.getElementById('publications-container');
    const publications = Array.isArray(publicationsData.publications) ? publicationsData.publications : [];
    let html = '';

    if (!container) {
        return;
    }

    if (publications.length === 0) {
        container.innerHTML = '<p>No publications available yet.</p>';
        return;
    }

    publications.forEach((pub, index) => {
        try {
            const authorsHtml = Array.isArray(pub.authors) && pub.authors.length > 0
                ? pub.authors.map(author => author.is_self ? `<strong>${escapeHtml(author.name || '')}</strong>` : escapeHtml(author.name || '')).join(', ')
                : 'Authors information unavailable';

            const publicationLinks = normalizePublicationLinks(pub.links);
            const doiLink = getPublicationDoiLink(pub, publicationLinks);
            if (doiLink) {
                publicationLinks.push(doiLink);
            }

            publicationLinks.sort((a, b) => getPublicationLinkPriority(a.label) - getPublicationLinkPriority(b.label));

            const abstractId = `abstract-${index + 1}`;
            const actionButtons = [
                `<button type="button" class="publication-link abstract-toggle" data-target="${abstractId}" aria-expanded="false" aria-controls="${abstractId}">ABS</button>`
            ];
            publicationLinks.forEach(link => {
                actionButtons.push(
                    `<a class="publication-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
                );
            });

            const metaItems = [];
            if (pub.impact_factor) {
                metaItems.push(`Rank: ${escapeHtml(pub.impact_factor)}`);
            }
            if (Number(pub.citations) > 0) {
                metaItems.push(`Citations: ${escapeHtml(String(pub.citations))}`);
            }
            const metaHtml = metaItems.length > 0
                ? `<p class="publication-impact">${metaItems.join(' | ')}</p>`
                : '';

            const abstractText = pub.abstract ? escapeHtml(pub.abstract) : 'Abstract not available';
            const safeTitle = escapeHtml(pub.title || 'Untitled');
            const safeVenue = escapeHtml(pub.venue || 'Venue information unavailable');
            const venueTag = escapeHtml(getPublicationVenueTag(pub));
            const thumbnailUrl = sanitizeAssetUrl(pub.thumbnail);
            const thumbAlt = escapeHtml(pub.thumbnail_alt || `Figure for ${pub.title || 'publication'}`);
            const mediaClassName = thumbnailUrl === '#' ? 'publication-media no-thumb' : 'publication-media';
            const thumbImage = thumbnailUrl === '#'
                ? ''
                : `<img class="publication-thumb" src="${thumbnailUrl}" alt="${thumbAlt}" loading="lazy">`;

            html += `
                <article class="publication publication-card">
                    <div class="${mediaClassName}">
                        ${thumbImage}
                        <div class="publication-thumb-fallback">
                            <span class="publication-venue-tag">${venueTag}</span>
                            <span class="publication-thumb-text">Paper Preview</span>
                        </div>
                    </div>
                    <div class="publication-content">
                        <h3 class="publication-title">${safeTitle}</h3>
                        <p class="publication-authors">${authorsHtml}</p>
                        <p class="publication-venue"><em>${safeVenue}</em></p>
                        ${metaHtml}
                        <div class="publication-links">${actionButtons.join('')}</div>
                        <div id="${abstractId}" class="abstract" hidden><p>${abstractText}</p></div>
                    </div>
                </article>
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
    bindPublicationThumbnailFallback(container);

    const seeMoreBtn = document.getElementById('see-more-publications');
    if (!seeMoreBtn) {
        return;
    }

    const publicationsUrl = getPublicationsUrl(publicationsData.all_publications_url);
    seeMoreBtn.innerHTML = `<a href="${publicationsUrl}" target="_blank" rel="noopener noreferrer" class="see-more-button">
        View on Google Scholar <i class="fas fa-graduation-cap"></i>
    </a>`;

    seeMoreBtn.style.display = 'block';
    seeMoreBtn.style.visibility = 'visible';
    seeMoreBtn.style.opacity = '1';
}

function normalizePublicationLinks(rawLinks) {
    if (!Array.isArray(rawLinks)) {
        return [];
    }

    return rawLinks
        .map(link => {
            const url = sanitizeUrl(link?.url);
            if (url === '#') {
                return null;
            }

            const label = normalizePublicationLinkLabel(link?.type, link?.url);
            if (label === 'ABS') {
                return null;
            }

            return {
                label,
                url
            };
        })
        .filter(Boolean)
        .filter((link, index, allLinks) => allLinks.findIndex(item => item.label === link.label && item.url === link.url) === index);
}

function normalizePublicationLinkLabel(rawType, rawUrl) {
    const type = String(rawType || '').trim().toLowerCase();
    const url = String(rawUrl || '').toLowerCase();

    if (type.includes('doi')) {
        return 'DOI';
    }
    if (type.includes('abs')) {
        return 'ABS';
    }
    if (type.includes('code') || type.includes('github')) {
        return 'CODE';
    }
    if (type.includes('website') || type.includes('site')) {
        return 'WEBSITE';
    }
    if (type.includes('project')) {
        return 'PROJECT';
    }
    if (type.includes('poster')) {
        return 'POSTER';
    }
    if (type.includes('video')) {
        return 'VIDEO';
    }
    if (type.includes('dataset') || type.includes('data')) {
        return 'DATA';
    }
    if (type.includes('paper') || type.includes('pdf') || url.endsWith('.pdf') || url.includes('/pdf/')) {
        return 'PDF';
    }

    return type ? type.toUpperCase() : 'LINK';
}

function getPublicationDoiLink(publication, normalizedLinks) {
    const hasDoiAlready = normalizedLinks.some(link => link.label === 'DOI');
    if (hasDoiAlready) {
        return null;
    }

    const doiCandidate = extractPublicationDoi(publication);
    if (!doiCandidate) {
        return null;
    }

    const doiUrl = sanitizeUrl(`https://doi.org/${doiCandidate}`);
    if (doiUrl === '#') {
        return null;
    }

    return { label: 'DOI', url: doiUrl };
}

function extractPublicationDoi(publication) {
    if (typeof publication?.doi === 'string' && publication.doi.trim()) {
        return normalizeDoi(publication.doi);
    }

    const links = Array.isArray(publication?.links) ? publication.links : [];
    for (const link of links) {
        if (typeof link?.url !== 'string') {
            continue;
        }

        const decoded = safeDecodeURIComponent(link.url);
        const match = decoded.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
        if (match && match[0]) {
            return normalizeDoi(match[0]);
        }
    }

    return '';
}

function normalizeDoi(value) {
    return String(value || '')
        .trim()
        .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
        .replace(/[)>.,;]+$/, '');
}

function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
}

function getPublicationLinkPriority(label) {
    const orderedLabels = ['DOI', 'PDF', 'CODE', 'WEBSITE', 'PROJECT', 'DATA', 'POSTER', 'VIDEO', 'LINK', 'ABS'];
    const index = orderedLabels.indexOf(label);
    return index === -1 ? 999 : index;
}

function getPublicationVenueTag(publication) {
    const explicitBadge = typeof publication?.badge === 'string' ? publication.badge.trim() : '';
    if (explicitBadge) {
        return explicitBadge;
    }

    const venue = String(publication?.venue || '').trim();
    const upperVenue = venue.toUpperCase();
    const candidates = ['ACM MM', 'EMNLP', 'ACL', 'AAAI', 'TOIS', 'TNNLS', 'ARXIV', 'CEUR-WS'];
    const matched = candidates.find(candidate => upperVenue.includes(candidate));
    if (matched) {
        return matched;
    }

    const compact = venue.replace(/\(.*\)/g, '').replace(/\d{4}.*/, '').trim();
    return compact ? compact.slice(0, 14).toUpperCase() : 'PAPER';
}

function bindPublicationThumbnailFallback(container) {
    const images = container.querySelectorAll('.publication-thumb');
    images.forEach(image => {
        image.addEventListener('error', () => {
            const media = image.closest('.publication-media');
            if (media) {
                media.classList.add('no-thumb');
            }
            image.remove();
        }, { once: true });
    });
}

function getPublicationsUrl(rawUrl) {
    const hasValidScholarUrl =
        typeof rawUrl === 'string' &&
        rawUrl !== '#' &&
        rawUrl.includes('scholar.google.com');

    return hasValidScholarUrl ? rawUrl : FALLBACK_PUBLICATIONS_URL;
}

// Render education
function renderEducation(education) {
    const container = document.getElementById('education-container');
    const items = Array.isArray(education) ? education : [];
    let html = '';

    items.forEach(item => {
        html += `<li><strong>${escapeHtml(item.period || '')}</strong>: ${escapeHtml(item.degree || '')}, ${escapeHtml(item.field || '')}, ${escapeHtml(item.institution || '')}</li>`;
    });

    container.innerHTML = html;
}

// Render experience and related info
function renderExperience(data) {
    const experienceItems = Array.isArray(data.experience) ? data.experience : [];

    const expContainer = document.getElementById('experience-container');
    let expHtml = '';

    experienceItems.forEach(item => {
        const details = item.department ? `, ${escapeHtml(item.department)}` : '';
        const highlights = Array.isArray(item.highlights) ? item.highlights : [];
        const highlightsHtml = highlights.length > 0
            ? `<div class="experience-highlights">${highlights.map(text => `<div class="experience-highlight-item">- ${escapeHtml(text)}</div>`).join('')}</div>`
            : '';

        expHtml += `<li><strong>${escapeHtml(item.period || '')}</strong>: ${escapeHtml(item.position || '')}, ${escapeHtml(item.company || '')}${details}${highlightsHtml}</li>`;
    });

    expContainer.innerHTML = expHtml;

    const awardsContainer = document.getElementById('awards-container');
    const awards = Array.isArray(data.awards) ? data.awards : [];
    let awardsHtml = '<ul class="awards-list">';

    awards.forEach(award => {
        awardsHtml += `
            <li class="award-item">
                <span class="award-name">${award.name || ''}</span>
                <span class="award-year">${escapeHtml(award.year || '')}</span>
            </li>
        `;
    });

    awardsHtml += '</ul>';
    awardsContainer.innerHTML = awardsHtml;

    const serviceContainer = document.getElementById('service-container');
    const reviewers = Array.isArray(data.academic_service?.reviewer) ? data.academic_service.reviewer : [];
    let serviceHtml = '';

    reviewers.forEach(item => {
        serviceHtml += `<li>${escapeHtml(item)}</li>`;
    });

    serviceContainer.innerHTML = serviceHtml;

    const teachingContainer = document.getElementById('teaching-container');
    const teachingItems = Array.isArray(data.teaching) ? data.teaching : [];
    let teachingHtml = '';

    teachingItems.forEach(item => {
        teachingHtml += `<li><strong>${escapeHtml(item.period || '')}</strong>: ${escapeHtml(item.course || '')}, ${escapeHtml(item.role || '')}</li>`;
    });

    teachingContainer.innerHTML = teachingHtml;
}

// Render miscellaneous section
function renderMisc(miscText) {
    document.getElementById('misc-content').innerHTML = miscText || '';
}

// Render footer
function renderFooter(footerText) {
    document.getElementById('footer-text').textContent = footerText;
}

// Render contact page
function renderContactPage(data) {
    const contactPage = data.contactPage || {};

    document.getElementById('contact-title').textContent = contactPage.title || 'Contact';
    document.getElementById('contact-introduction').textContent = contactPage.introduction || '';

    const methodsContainer = document.getElementById('contact-methods-container');
    const contactMethods = Array.isArray(contactPage.contactMethods) ? contactPage.contactMethods : [];
    let methodsHtml = '';

    contactMethods.forEach(method => {
        methodsHtml += `
            <div class="contact-method">
                <i class="${method.icon}"></i>
                <h3>${escapeHtml(method.type || '')}</h3>
                <p>${method.details || ''}</p>
            </div>
        `;
    });

    methodsContainer.innerHTML = methodsHtml;
}

function sanitizeUrl(rawUrl) {
    if (typeof rawUrl !== 'string') {
        return '#';
    }

    try {
        const parsedUrl = new URL(rawUrl, window.location.origin);
        const protocol = parsedUrl.protocol.toLowerCase();
        if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
            return parsedUrl.href;
        }
    } catch (error) {
        return '#';
    }

    return '#';
}

function sanitizeAssetUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
        return '#';
    }

    try {
        const parsedUrl = new URL(rawUrl, window.location.origin);
        const protocol = parsedUrl.protocol.toLowerCase();
        if (protocol === 'http:' || protocol === 'https:') {
            return parsedUrl.href;
        }
    } catch (error) {
        return '#';
    }

    return '#';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

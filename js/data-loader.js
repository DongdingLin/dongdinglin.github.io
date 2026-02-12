// Data loader for personal website
const FALLBACK_PUBLICATIONS_URL = 'https://scholar.google.com/citations?view_op=list_works&hl=en&user=JM4i0R8AAAAJ';
const DATA_VERSION = '2026-02-11-thumbbadge1';
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
const LANGUAGE_STORAGE_KEY = 'site_language';
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'zh'];
const FOOTER_COUNTER_API = 'https://api.counterapi.dev/v1/lindongding-github-io/site-visits/up';
const FOOTER_CLOCK_REFRESH_MS = 1000;
// Replace with the `d` parameter from your ClustrMaps widget script URL.
const CLUSTRMAPS_TOKEN = 'eShH9477-m_gyjW0kwUSBY6IHrbgC1gDu6TedOFLHHU';
const CLUSTRMAPS_SCRIPT_ID = 'clstr_globe';
const CLUSTRMAPS_SCRIPT_BASE = 'https://clustrmaps.com/globe.js';
const CLUSTRMAPS_RENDER_CHECK_DELAY_MS = 2500;
const VISITOR_MAP_MAX_WIDTH_PX = 105;
const UI_TEXT = {
    en: {
        nav: {
            home: 'Home',
            contact: 'Contact',
            toggleLanguage: '中文'
        },
        sections: {
            skills: 'Skills',
            publications: 'Selected Publications',
            education: 'Education',
            experience: 'Experience',
            awards: 'Honors and Awards',
            services: 'Academic Services',
            teaching: 'Teaching Experience',
            misc: 'Miscellaneous',
            news: 'News',
            interests: 'Research Interests'
        },
        labels: {
            reviewer: 'Reviewer',
            email: 'Email',
            interestsIntro: 'My research interests include the following areas:',
            interestsOutro: 'I am actively looking for collaborators interested in the above research directions. Please feel free to contact me if you are interested.',
            backToTop: 'Back to Top',
            noNews: 'No news updates yet.',
            dateTbd: 'Date TBD',
            tbd: 'TBD',
            visits: 'Visits',
            visitsUnavailable: 'Unavailable',
            currentTime: 'Current Time',
            visitorMap: 'Visitor Map',
            visitorMapSetup: 'Visitor map is not configured yet.',
            visitorMapSetupLink: 'Get ClustrMaps widget code',
            visitorMapLoadFailed: 'Visitor map failed to load from ClustrMaps.'
        },
        publications: {
            rank: 'Rank',
            citations: 'Citations',
            abs: 'ABS',
            hideAbs: 'HIDE ABS',
            abstractUnavailable: 'Abstract not available',
            noPublications: 'No publications available yet.',
            paperPreview: 'Paper Preview',
            viewScholar: 'View on Google Scholar'
        },
        contact: {
            defaultTitle: 'Contact',
            defaultIntroduction: 'Feel free to contact me through the following methods.'
        },
        wechat: {
            title: 'WeChat',
            subtitle: 'Scan the QR code to connect.',
            fallback: 'QR image is unavailable right now.',
            idPrefix: 'WeChat ID',
            idMissing: 'WeChat ID not provided'
        }
    },
    zh: {
        nav: {
            home: '主页',
            contact: '联系',
            toggleLanguage: 'EN'
        },
        sections: {
            skills: '技能',
            publications: '代表论文',
            education: '教育背景',
            experience: '经历',
            awards: '荣誉奖项',
            services: '学术服务',
            teaching: '教学经历',
            misc: '其他',
            news: '新闻动态',
            interests: '研究方向'
        },
        labels: {
            reviewer: '审稿服务',
            email: '邮箱',
            interestsIntro: '我的研究兴趣主要包括以下方向：',
            interestsOutro: '欢迎对上述方向感兴趣的老师与同学联系交流，期待合作。',
            backToTop: '回到顶部',
            noNews: '暂无新闻更新。',
            dateTbd: '日期待定',
            tbd: '待补充',
            visits: '访问人数',
            visitsUnavailable: '暂不可用',
            currentTime: '当前时间',
            visitorMap: '访客地图',
            visitorMapSetup: '访客地图尚未配置。',
            visitorMapSetupLink: '获取 ClustrMaps 小组件代码',
            visitorMapLoadFailed: '访客地图加载失败（ClustrMaps）。'
        },
        publications: {
            rank: '级别',
            citations: '引用',
            abs: '摘要',
            hideAbs: '收起摘要',
            abstractUnavailable: '暂无摘要',
            noPublications: '暂无论文信息。',
            paperPreview: '论文预览',
            viewScholar: '查看 Google Scholar'
        },
        contact: {
            defaultTitle: '联系方式',
            defaultIntroduction: '欢迎通过以下方式联系我。'
        },
        wechat: {
            title: '微信',
            subtitle: '请扫码添加微信联系。',
            fallback: '二维码暂时无法显示。',
            idPrefix: '微信号',
            idMissing: '未提供微信号'
        }
    }
};

let currentLanguage = DEFAULT_LANGUAGE;
let cachedDataByFile = null;
let isCurrentContactPage = false;
let footerClockTimerId = null;
let footerVisitCount = null;
let visitorMapNeedsSetupHint = false;
let visitorMapResizeBound = false;

document.addEventListener('DOMContentLoaded', function() {
    currentLanguage = resolveInitialLanguage();
    installLanguageToggle();
    setLanguage(currentLanguage, { persist: false, rerender: false });
    initBackToTop();
    initFooterMeta();
    initPage().catch(error => {
        showLoadingError(`Failed to load data: ${error.message}. Please refresh the page and try again.`);
    });
});

async function initPage() {
    isCurrentContactPage = window.location.pathname.includes('contact.html');
    const fileNames = isCurrentContactPage ? CONTACT_DATA_FILES : HOME_DATA_FILES;
    cachedDataByFile = await loadDataFiles(fileNames);
    renderPage(cachedDataByFile, isCurrentContactPage);
}

function renderPage(dataByFile, isContactPage) {
    try {
        const personal = dataByFile['personal.json'] || {};
        const nameForTitle = getLocalizedValue(personal, 'name', 'Dongding Lin');

        renderFooter(getLocalizedValue(personal, 'footerText', ''));
        document.title = buildPageTitle(nameForTitle, isContactPage);

        if (isContactPage) {
            renderContactPage(personal);
            applyStaticTranslations();
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
        renderMisc(getLocalizedValue(personal, 'misc', ''));
        initPublicationAbstractToggle();
        applyStaticTranslations();
    } catch (renderError) {
        showLoadingError(`Render error: ${renderError.message}`);
    }
}

function resolveInitialLanguage() {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
    }
    return DEFAULT_LANGUAGE;
}

function installLanguageToggle() {
    const toggle = document.getElementById('language-toggle');
    if (!toggle || toggle.dataset.bound === 'true') {
        return;
    }

    toggle.addEventListener('click', event => {
        event.preventDefault();
        const nextLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
        setLanguage(nextLanguage);
    });

    toggle.dataset.bound = 'true';
}

function setLanguage(lang, options = {}) {
    const normalized = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
    currentLanguage = normalized;
    document.documentElement.lang = normalized === 'zh' ? 'zh-CN' : 'en';

    if (options.persist !== false) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    }

    applyStaticTranslations();

    if (options.rerender !== false && cachedDataByFile) {
        renderPage(cachedDataByFile, isCurrentContactPage);
    }

    window.dispatchEvent(new CustomEvent('site-language-change', { detail: { lang: normalized } }));
}

function applyStaticTranslations() {
    setTextById('nav-home-text', getUiText('nav.home'));
    setTextById('nav-contact-text', getUiText('nav.contact'));
    setTextById('language-toggle-text', getUiText('nav.toggleLanguage'));
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.setAttribute('aria-label', currentLanguage === 'zh' ? 'Switch to English' : '切换到中文');
    }

    setTextById('section-skills-title', getUiText('sections.skills'));
    setTextById('section-publications-title', getUiText('sections.publications'));
    setTextById('section-education-title', getUiText('sections.education'));
    setTextById('section-experience-title', getUiText('sections.experience'));
    setTextById('section-awards-title', getUiText('sections.awards'));
    setTextById('section-services-title', getUiText('sections.services'));
    setTextById('section-teaching-title', getUiText('sections.teaching'));
    setTextById('section-misc-title', getUiText('sections.misc'));
    setTextById('section-news-title', getUiText('sections.news'));
    setTextById('section-interests-title', getUiText('sections.interests'));

    setTextById('services-reviewer-label', getUiText('labels.reviewer'));
    setTextById('interests-intro', getUiText('labels.interestsIntro'));
    setTextById('interests-outro', getUiText('labels.interestsOutro'));

    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        const text = getUiText('labels.backToTop');
        backToTop.title = text;
        backToTop.setAttribute('aria-label', text);
    }

    updateWechatModalLanguage();
    updateFooterMetaText();
}

function getUiText(keyPath) {
    const current = getNestedValue(UI_TEXT[currentLanguage], keyPath);
    if (typeof current === 'string') {
        return current;
    }
    const fallback = getNestedValue(UI_TEXT[DEFAULT_LANGUAGE], keyPath);
    return typeof fallback === 'string' ? fallback : keyPath;
}

function getNestedValue(source, keyPath) {
    if (!source || typeof keyPath !== 'string') {
        return undefined;
    }
    return keyPath.split('.').reduce((obj, key) => (obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined), source);
}

function setTextById(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function buildPageTitle(name, isContactPage) {
    if (currentLanguage === 'zh') {
        return `${isContactPage ? '联系我 - ' : ''}${name}的个人主页`;
    }
    return `${isContactPage ? 'Contact ' : ''}${name}'s Personal Homepage`.trim();
}

function getLocalizedValue(source, key, fallback = '') {
    if (!source || typeof source !== 'object') {
        return fallback;
    }

    const baseValue = source[key];
    if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
        const localizedObjectValue = baseValue[currentLanguage];
        if (localizedObjectValue !== undefined && localizedObjectValue !== null && String(localizedObjectValue).trim() !== '') {
            return localizedObjectValue;
        }
        const englishObjectValue = baseValue.en;
        if (englishObjectValue !== undefined && englishObjectValue !== null && String(englishObjectValue).trim() !== '') {
            return englishObjectValue;
        }
    }

    const localizedKey = `${key}_${currentLanguage}`;
    const localizedValue = source[localizedKey];
    if (localizedValue !== undefined && localizedValue !== null && String(localizedValue).trim() !== '') {
        return localizedValue;
    }

    if (baseValue !== undefined && baseValue !== null && String(baseValue).trim() !== '') {
        return baseValue;
    }

    return fallback;
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
        const media = event.target.closest('.publication-media[data-target]');
        const trigger = button || media;
        if (!trigger) {
            return;
        }

        const abstractId = trigger.getAttribute('data-target');
        if (!abstractId) {
            return;
        }

        const abstract = document.getElementById(abstractId);
        if (!abstract) {
            return;
        }

        const expanding = abstract.hidden;
        abstract.hidden = !expanding;

        const relatedButton = container.querySelector(`.abstract-toggle[data-target="${abstractId}"]`);
        if (relatedButton) {
            relatedButton.setAttribute('aria-expanded', String(expanding));
            relatedButton.textContent = expanding ? getUiText('publications.hideAbs') : getUiText('publications.abs');
        }

        const relatedMedia = container.querySelector(`.publication-media[data-target="${abstractId}"]`);
        if (relatedMedia) {
            relatedMedia.setAttribute('aria-expanded', String(expanding));
        }

        if (expanding) {
            setTimeout(() => {
                abstract.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    });

    container.addEventListener('keydown', function(event) {
        const media = event.target.closest('.publication-media[data-target]');
        if (!media) {
            return;
        }

        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        media.click();
    });

    container.dataset.abstractBound = 'true';
}

// Render personal information
function renderPersonalInfo(data) {
    const contact = data.contact || {};
    const displayName = getLocalizedValue(data, 'name', '');
    const title = getLocalizedValue(data, 'title', '');
    const department = getLocalizedValue(data, 'department', '');
    const university = getLocalizedValue(data, 'university', '');
    const location = getLocalizedValue(data, 'location', '');
    const email = getLocalizedValue(data, 'email', '');

    document.getElementById('name').textContent = displayName;

    const personalInfoHtml = [
        escapeHtml(title),
        escapeHtml(department),
        escapeHtml(university),
        escapeHtml(location),
        `<strong>${escapeHtml(getUiText('labels.email'))}</strong>: ${escapeHtml(email)}`
    ].join('<br>');
    document.getElementById('personal-info').innerHTML = personalInfoHtml;

    const bioWithLineBreaks = String(getLocalizedValue(data, 'bio', '')).replace(/\\n/g, '<br><br>');
    document.getElementById('bio').innerHTML = bioWithLineBreaks;

    document.getElementById('contact-email').textContent = getLocalizedValue(contact, 'email', contact.email || '');
    document.getElementById('contact-location').textContent = getLocalizedValue(contact, 'location', contact.location || '');

    const banner = document.getElementById('job-seeking-banner');
    if (banner) {
        const bannerText = String(getLocalizedValue(data, 'jobSeekingBanner', '')).trim();
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
        ? data.social.map(link => renderSocialLink(link)).filter(Boolean)
        : [];

    const cvEntries = Array.isArray(data.cvs) ? data.cvs : (data.cv ? [data.cv] : []);
    const cvLinks = cvEntries.map(item => {
        const iconClass = typeof item.icon === 'string' ? item.icon : 'fas fa-file';
        const label = escapeHtml(getLocalizedValue(item, 'label', 'CV'));
        const url = sanitizeUrl(item.url);
        return `<a href="${url}" target="_blank" class="cv-button" rel="noopener noreferrer"><i class="${iconClass}"></i> ${label}</a>`;
    });

    socialLinksContainer.innerHTML = [...socialLinks, ...cvLinks].join('');
    bindWechatModalTriggers(socialLinksContainer);

    if (displayName) {
        document.title = buildPageTitle(displayName, false);
    }
}

function renderSocialLink(link) {
    const iconClass = typeof link?.icon === 'string' ? link.icon : 'fas fa-link';
    const platform = escapeHtml(getLocalizedValue(link, 'platform', 'Link'));

    if (isWechatModalLink(link)) {
        const wechatId = escapeHtml(resolveWechatId(link));
        const qrSource = escapeHtml(resolveWechatQrSource(link));
        return `
            <a
                href="#"
                class="wechat-trigger wechat-link"
                data-wechat-id="${wechatId}"
                data-wechat-qr="${qrSource}"
                aria-haspopup="dialog"
                aria-controls="wechat-modal"
            >
                <i class="${iconClass}"></i> ${platform}
            </a>
        `;
    }

    const url = sanitizeUrl(link?.url);
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="${iconClass}"></i> ${platform}</a>`;
}

function isWechatModalLink(link) {
    return String(link?.interaction || '').toLowerCase() === 'wechat-modal';
}

function resolveWechatId(link) {
    if (typeof link?.wechat_id === 'string' && link.wechat_id.trim()) {
        return link.wechat_id.trim();
    }
    if (typeof link?.wechatId === 'string' && link.wechatId.trim()) {
        return link.wechatId.trim();
    }
    if (typeof link?.details === 'string') {
        const match = link.details.match(/wechat\s*id[:：]\s*([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
            return match[1];
        }
    }

    return '';
}

function resolveWechatQrSource(link) {
    const localQr = sanitizeAssetUrl(link?.qr_image || link?.qrImage || '');
    if (localQr !== '#') {
        return localQr;
    }

    const wechatId = resolveWechatId(link);
    if (!wechatId) {
        return '#';
    }

    const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(`WeChat ID: ${wechatId}`)}`;
    return sanitizeAssetUrl(generatedQrUrl);
}

function bindWechatModalTriggers(container) {
    if (!container || container.dataset.wechatBound === 'true') {
        return;
    }

    const modal = ensureWechatModal();
    if (!modal) {
        return;
    }

    container.addEventListener('click', event => {
        const trigger = event.target.closest('.wechat-trigger');
        if (!trigger) {
            return;
        }

        event.preventDefault();
        openWechatModal(trigger);
    });

    container.dataset.wechatBound = 'true';
}

function ensureWechatModal() {
    let modal = document.getElementById('wechat-modal');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="wechat-modal" class="wechat-modal" hidden aria-hidden="true">
                <div class="wechat-modal-backdrop" data-wechat-close="true"></div>
                <div class="wechat-modal-panel" role="dialog" aria-modal="true" aria-labelledby="wechat-modal-title">
                    <button type="button" class="wechat-modal-close" data-wechat-close="true" aria-label="Close WeChat QR modal">&times;</button>
                    <h3 id="wechat-modal-title"><i class="fab fa-weixin"></i> ${escapeHtml(getUiText('wechat.title'))}</h3>
                    <p id="wechat-modal-subtitle" class="wechat-modal-subtitle">${escapeHtml(getUiText('wechat.subtitle'))}</p>
                    <img id="wechat-modal-qr" class="wechat-modal-qr" alt="WeChat QR code" loading="lazy">
                    <p id="wechat-modal-fallback" class="wechat-modal-fallback" hidden>${escapeHtml(getUiText('wechat.fallback'))}</p>
                    <p id="wechat-modal-id" class="wechat-modal-id"></p>
                </div>
            </div>
        `);
        modal = document.getElementById('wechat-modal');
    }

    if (!modal || modal.dataset.bound === 'true') {
        return modal;
    }

    modal.addEventListener('click', event => {
        if (event.target instanceof HTMLElement && event.target.dataset.wechatClose === 'true') {
            closeWechatModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) {
            closeWechatModal();
        }
    });

    modal.dataset.bound = 'true';
    updateWechatModalLanguage();
    return modal;
}

function updateWechatModalLanguage() {
    const modal = document.getElementById('wechat-modal');
    if (!modal) {
        return;
    }

    const title = modal.querySelector('#wechat-modal-title');
    if (title) {
        title.innerHTML = `<i class="fab fa-weixin"></i> ${escapeHtml(getUiText('wechat.title'))}`;
    }

    setTextById('wechat-modal-subtitle', getUiText('wechat.subtitle'));
    setTextById('wechat-modal-fallback', getUiText('wechat.fallback'));

    const closeButton = modal.querySelector('.wechat-modal-close');
    if (closeButton) {
        closeButton.setAttribute('aria-label', `${getUiText('wechat.title')} Close`);
    }
}

function openWechatModal(trigger) {
    const modal = ensureWechatModal();
    if (!modal) {
        return;
    }

    const qrImage = modal.querySelector('#wechat-modal-qr');
    const fallback = modal.querySelector('#wechat-modal-fallback');
    const idText = modal.querySelector('#wechat-modal-id');

    if (!(qrImage instanceof HTMLImageElement) || !(fallback instanceof HTMLElement) || !(idText instanceof HTMLElement)) {
        return;
    }

    const wechatId = trigger.dataset.wechatId ? trigger.dataset.wechatId.trim() : '';
    const qrUrl = trigger.dataset.wechatQr ? trigger.dataset.wechatQr.trim() : '';

    idText.textContent = wechatId
        ? `${getUiText('wechat.idPrefix')}: ${wechatId}`
        : getUiText('wechat.idMissing');

    qrImage.hidden = false;
    fallback.hidden = true;

    if (!qrUrl || qrUrl === '#') {
        qrImage.removeAttribute('src');
        qrImage.hidden = true;
        fallback.hidden = false;
    } else {
        qrImage.onerror = () => {
            qrImage.hidden = true;
            fallback.hidden = false;
        };
        qrImage.onload = () => {
            qrImage.hidden = false;
            fallback.hidden = true;
        };
        qrImage.src = qrUrl;
    }

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wechat-modal-open');
}

function closeWechatModal() {
    const modal = document.getElementById('wechat-modal');
    if (!modal) {
        return;
    }

    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wechat-modal-open');

    const qrImage = modal.querySelector('#wechat-modal-qr');
    if (qrImage instanceof HTMLImageElement) {
        qrImage.removeAttribute('src');
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
        const content = getLocalizedValue(item, 'content', '');
        const displayDate = getLocalizedValue(item, 'date', getUiText('labels.dateTbd'));
        html += `
            <div class="news-item">
                <p>${isRecent ? '<span class="news-badge">NEW</span> ' : ''}<span class="news-date">[${escapeHtml(displayDate)}]</span> ${escapeHtml(content)}</p>
            </div>
        `;
    });

    container.innerHTML = html || `<p>${escapeHtml(getUiText('labels.noNews'))}</p>`;
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
        const area = getLocalizedValue(item, 'area', '');
        const details = getLocalizedValue(item, 'details', '');
        html += `<li><strong>${escapeHtml(area)}</strong>: ${escapeHtml(details)}</li>`;
    });

    container.innerHTML = html;
}

// Render skills
function renderSkills(skillCategories) {
    const container = document.getElementById('skills-container');
    const categories = Array.isArray(skillCategories) ? skillCategories : [];
    let html = '<div class="skills-grid">';

    categories.forEach(category => {
        const categoryName = escapeHtml(getLocalizedValue(category, 'category', 'Other'));
        const rawItems = Array.isArray(category.skills)
            ? category.skills.map(skill => getLocalizedValue(skill, 'name', ''))
            : getLocalizedStringArray(category, 'items');
        const tags = rawItems
            .map(item => String(item || '').trim())
            .filter(item => item.length > 0)
            .map(item => `<span class="skill-tag">${escapeHtml(item)}</span>`)
            .join('');

        html += `
            <section class="skill-group">
                <h3>${categoryName}</h3>
                <div class="skill-tags">${tags || `<span class="skill-tag skill-tag-empty">${escapeHtml(getUiText('labels.tbd'))}</span>`}</div>
            </section>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function getLocalizedStringArray(source, key) {
    if (!source || typeof source !== 'object') {
        return [];
    }

    const localizedKey = `${key}_${currentLanguage}`;
    const localized = source[localizedKey];
    const fallback = source[key];
    const chosenArray = Array.isArray(localized) && localized.length > 0
        ? localized
        : (Array.isArray(fallback) ? fallback : []);

    return chosenArray.map(item => {
        if (typeof item === 'string') {
            return item;
        }
        if (item && typeof item === 'object') {
            return getLocalizedValue(item, 'name', getLocalizedValue(item, 'value', ''));
        }
        return '';
    });
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
        container.innerHTML = `<p>${escapeHtml(getUiText('publications.noPublications'))}</p>`;
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
                `<button type="button" class="publication-link abstract-toggle" data-target="${abstractId}" aria-expanded="false" aria-controls="${abstractId}">${escapeHtml(getUiText('publications.abs'))}</button>`
            ];
            publicationLinks.forEach(link => {
                actionButtons.push(
                    `<a class="publication-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
                );
            });

            const metaItems = [];
            if (pub.impact_factor) {
                metaItems.push(`${escapeHtml(getUiText('publications.rank'))}: ${escapeHtml(pub.impact_factor)}`);
            }
            if (Number(pub.citations) > 0) {
                metaItems.push(`${escapeHtml(getUiText('publications.citations'))}: ${escapeHtml(String(pub.citations))}`);
            }
            const metaHtml = metaItems.length > 0
                ? `<p class="publication-impact">${metaItems.join(' | ')}</p>`
                : '';

            const abstractText = getLocalizedValue(pub, 'abstract', '') ? escapeHtml(getLocalizedValue(pub, 'abstract', '')) : escapeHtml(getUiText('publications.abstractUnavailable'));
            const safeTitle = escapeHtml(getLocalizedValue(pub, 'title', 'Untitled'));
            const safeVenue = escapeHtml(getLocalizedValue(pub, 'venue', 'Venue information unavailable'));
            const venueTagRaw = getPublicationVenueTag(pub);
            const venueTag = escapeHtml(venueTagRaw);
            const venueThemeClass = getPublicationVenueThemeClass(venueTagRaw);
            const thumbnailUrl = sanitizeAssetUrl(pub.thumbnail);
            const thumbAlt = escapeHtml(getLocalizedValue(pub, 'thumbnail_alt', `Figure for ${pub.title || 'publication'}`));
            const mediaClassName = thumbnailUrl === '#' ? 'publication-media no-thumb' : 'publication-media';
            const thumbImage = thumbnailUrl === '#'
                ? ''
                : `<img class="publication-thumb" src="${thumbnailUrl}" alt="${thumbAlt}" loading="lazy">`;

            html += `
                <article class="publication publication-card">
                    <div class="${mediaClassName}" data-target="${abstractId}" role="button" tabindex="0" aria-controls="${abstractId}" aria-expanded="false">
                        <span class="publication-venue-ribbon ${venueThemeClass}">${venueTag}</span>
                        <div class="publication-media-body">
                            ${thumbImage}
                            <div class="publication-thumb-fallback">
                                <span class="publication-thumb-text">${escapeHtml(getUiText('publications.paperPreview'))}</span>
                            </div>
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
        ${escapeHtml(getUiText('publications.viewScholar'))} <i class="fas fa-graduation-cap"></i>
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

function getPublicationVenueThemeClass(tag) {
    const normalized = String(tag || '').toUpperCase();
    if (normalized.includes('ACM MM')) {
        return 'venue-theme-acmmm';
    }
    if (normalized.includes('EMNLP')) {
        return 'venue-theme-emnlp';
    }
    if (normalized.includes('ACL')) {
        return 'venue-theme-acl';
    }
    if (normalized.includes('AAAI')) {
        return 'venue-theme-aaai';
    }
    if (normalized.includes('TOIS')) {
        return 'venue-theme-tois';
    }
    if (normalized.includes('TNNLS')) {
        return 'venue-theme-tnnls';
    }
    if (normalized.includes('CEUR-WS')) {
        return 'venue-theme-ceur';
    }
    if (normalized.includes('ARXIV')) {
        return 'venue-theme-arxiv';
    }
    return 'venue-theme-default';
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
        const period = getLocalizedValue(item, 'period', '');
        const degree = getLocalizedValue(item, 'degree', '');
        const field = getLocalizedValue(item, 'field', '');
        const institution = getLocalizedValue(item, 'institution', '');
        html += `<li><strong>${escapeHtml(period)}</strong>: ${escapeHtml(degree)}, ${escapeHtml(field)}, ${escapeHtml(institution)}</li>`;
    });

    container.innerHTML = html;
}

// Render experience and related info
function renderExperience(data) {
    const experienceItems = Array.isArray(data.experience) ? data.experience : [];

    const expContainer = document.getElementById('experience-container');
    let expHtml = '';

    experienceItems.forEach(item => {
        const position = getLocalizedValue(item, 'position', '');
        const company = getLocalizedValue(item, 'company', '');
        const department = getLocalizedValue(item, 'department', '');
        const period = getLocalizedValue(item, 'period', '');
        const details = department ? `, ${escapeHtml(department)}` : '';
        const highlights = Array.isArray(item.highlights) ? item.highlights.map(text => getLocalizedValue(text, 'text', text)) : [];
        const highlightsHtml = highlights.length > 0
            ? `<div class="experience-highlights">${highlights.map(text => `<div class="experience-highlight-item">- ${escapeHtml(text)}</div>`).join('')}</div>`
            : '';

        expHtml += `<li><strong>${escapeHtml(period)}</strong>: ${escapeHtml(position)}, ${escapeHtml(company)}${details}${highlightsHtml}</li>`;
    });

    expContainer.innerHTML = expHtml;

    const awardsContainer = document.getElementById('awards-container');
    const awards = Array.isArray(data.awards) ? data.awards : [];
    let awardsHtml = '<ul class="awards-list">';

    awards.forEach(award => {
        const awardName = getLocalizedValue(award, 'name', '');
        const awardYear = getLocalizedValue(award, 'year', '');
        awardsHtml += `
            <li class="award-item">
                <span class="award-name">${awardName}</span>
                <span class="award-year">${escapeHtml(awardYear)}</span>
            </li>
        `;
    });

    awardsHtml += '</ul>';
    awardsContainer.innerHTML = awardsHtml;

    const serviceContainer = document.getElementById('service-container');
    const reviewers = Array.isArray(data.academic_service?.reviewer) ? data.academic_service.reviewer : [];
    let serviceHtml = '';

    reviewers.forEach(item => {
        const service = typeof item === 'string' ? item : getLocalizedValue(item, 'text', '');
        serviceHtml += `<li>${escapeHtml(service)}</li>`;
    });

    serviceContainer.innerHTML = serviceHtml;

    const teachingContainer = document.getElementById('teaching-container');
    const teachingItems = Array.isArray(data.teaching) ? data.teaching : [];
    let teachingHtml = '';

    teachingItems.forEach(item => {
        const period = getLocalizedValue(item, 'period', '');
        const course = getLocalizedValue(item, 'course', '');
        const role = getLocalizedValue(item, 'role', '');
        teachingHtml += `<li><strong>${escapeHtml(period)}</strong>: ${escapeHtml(course)}, ${escapeHtml(role)}</li>`;
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

function initFooterMeta() {
    updateFooterClock();

    if (footerClockTimerId !== null) {
        clearInterval(footerClockTimerId);
    }
    footerClockTimerId = window.setInterval(updateFooterClock, FOOTER_CLOCK_REFRESH_MS);

    void refreshFooterVisitCount();
    initVisitorMap();
}

function updateFooterMetaText() {
    updateFooterVisitText();
    updateFooterClock();
    updateVisitorMapTitle();
    if (visitorMapNeedsSetupHint) {
        renderVisitorMapSetupHint();
    }
}

function updateFooterVisitText() {
    const visitElement = document.getElementById('visitor-counter');
    if (!visitElement) {
        return;
    }

    const locale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    const countText = Number.isFinite(footerVisitCount)
        ? footerVisitCount.toLocaleString(locale)
        : getUiText('labels.visitsUnavailable');

    visitElement.textContent = `${getUiText('labels.visits')}: ${countText}`;
}

function updateFooterClock() {
    const timeElement = document.getElementById('current-time');
    if (!timeElement) {
        return;
    }

    const locale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    const now = new Date();
    const timeText = now.toLocaleString(locale, {
        hour12: false
    });
    timeElement.textContent = `${getUiText('labels.currentTime')}: ${timeText}`;
}

async function refreshFooterVisitCount() {
    updateFooterVisitText();

    try {
        const response = await fetch(FOOTER_COUNTER_API, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const countCandidate = Number(payload?.count ?? payload?.value);
        if (Number.isFinite(countCandidate)) {
            footerVisitCount = countCandidate;
        }
    } catch (error) {
        footerVisitCount = null;
    }

    updateFooterVisitText();
}

function updateVisitorMapTitle() {
    const titleElement = document.getElementById('visitor-map-title');
    if (titleElement) {
        titleElement.textContent = getUiText('labels.visitorMap');
    }
}

function initVisitorMap() {
    const mapContainer = document.getElementById('visitor-map-container');
    if (!mapContainer) {
        return;
    }

    if (!visitorMapResizeBound) {
        window.addEventListener('resize', () => {
            const container = document.getElementById('visitor-map-container');
            if (hasInteractiveVisitorMapRendered(container)) {
                fitVisitorMapWidget(container);
            }
        });
        visitorMapResizeBound = true;
    }

    updateVisitorMapTitle();

    const token = (CLUSTRMAPS_TOKEN || '').trim();
    if (!token || token === 'REPLACE_WITH_YOUR_CLUSTRMAPS_D_TOKEN') {
        visitorMapNeedsSetupHint = true;
        renderVisitorMapSetupHint();
        return;
    }

    visitorMapNeedsSetupHint = false;
    const existingScript = document.getElementById(CLUSTRMAPS_SCRIPT_ID);
    if (existingScript) {
        return;
    }

    const scriptQuery = new URLSearchParams({
        d: token
    });
    mapContainer.innerHTML = '';

    const widgetScript = document.createElement('script');
    widgetScript.id = CLUSTRMAPS_SCRIPT_ID;
    widgetScript.type = 'text/javascript';
    widgetScript.async = true;
    widgetScript.src = `${CLUSTRMAPS_SCRIPT_BASE}?${scriptQuery.toString()}`;
    widgetScript.addEventListener('error', () => {
        renderVisitorMapLoadFailedHint();
    });
    widgetScript.addEventListener('load', () => {
        window.setTimeout(() => {
            if (hasInteractiveVisitorMapRendered(mapContainer)) {
                fitVisitorMapWidget(mapContainer);
            } else {
                renderVisitorMapLoadFailedHint();
            }
        }, CLUSTRMAPS_RENDER_CHECK_DELAY_MS);
    });
    mapContainer.appendChild(widgetScript);
}

function renderVisitorMapSetupHint() {
    const mapContainer = document.getElementById('visitor-map-container');
    if (!mapContainer) {
        return;
    }

    mapContainer.innerHTML = '';
}

function renderVisitorMapLoadFailedHint() {
    const mapContainer = document.getElementById('visitor-map-container');
    if (!mapContainer) {
        return;
    }

    mapContainer.innerHTML = '';
}

function getVisitorMapWidgetNode(container) {
    if (!container) {
        return null;
    }

    return Array.from(container.children).find(node => {
        if (!(node instanceof HTMLElement)) {
            return false;
        }
        return !node.classList.contains('visitor-map-hint') &&
            node.tagName !== 'SCRIPT';
    }) || null;
}

function fitVisitorMapWidget(container) {
    const widgetNode = getVisitorMapWidgetNode(container);
    if (!(widgetNode instanceof HTMLElement)) {
        return;
    }

    widgetNode.classList.add('visitor-map-widget');
    widgetNode.style.transform = '';
    container.style.height = '';

    const targetWidth = Math.min(VISITOR_MAP_MAX_WIDTH_PX, container.clientWidth || VISITOR_MAP_MAX_WIDTH_PX);
    const rect = widgetNode.getBoundingClientRect();
    if (rect.width <= 0 || targetWidth <= 0) {
        return;
    }

    if (rect.width > targetWidth + 1) {
        const scale = targetWidth / rect.width;
        widgetNode.style.transformOrigin = 'top center';
        widgetNode.style.transform = `scale(${scale})`;
        container.style.height = `${Math.ceil(rect.height * scale)}px`;
    } else {
        container.style.height = `${Math.ceil(rect.height)}px`;
    }
}

function hasInteractiveVisitorMapRendered(container) {
    return getVisitorMapWidgetNode(container) !== null;
}

// Render contact page
function renderContactPage(data) {
    const contactPage = data.contactPage || {};

    document.getElementById('contact-title').textContent = getLocalizedValue(contactPage, 'title', getUiText('contact.defaultTitle'));
    document.getElementById('contact-introduction').textContent = getLocalizedValue(contactPage, 'introduction', getUiText('contact.defaultIntroduction'));

    const methodsContainer = document.getElementById('contact-methods-container');
    const contactMethods = Array.isArray(contactPage.contactMethods) ? contactPage.contactMethods : [];
    let methodsHtml = '';

    contactMethods.forEach(method => {
        const type = getLocalizedValue(method, 'type', '');
        const details = getLocalizedValue(method, 'details', '');
        methodsHtml += `
            <div class="contact-method">
                <i class="${method.icon}"></i>
                <h3>${escapeHtml(type)}</h3>
                <p>${details || ''}</p>
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

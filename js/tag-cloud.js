(function() {
  'use strict';

  let currentTag = null;

  function getJsonUrl() {
    const container = document.querySelector('.tag-cloud-container');
    if (container && container.getAttribute('data-json-url')) {
      return container.getAttribute('data-json-url');
    }
    // Fallback: construct from current language
    const currentLang = getCurrentLang();
    return `/${currentLang}/index.json`;
  }

  function getCurrentLang() {
    const container = document.querySelector('.tag-cloud-container');
    if (container && container.getAttribute('data-lang')) {
      return container.getAttribute('data-lang');
    }
    // Detect from URL path
    const pathParts = window.location.pathname.split('/');
    for (const part of pathParts) {
      if (part && /^[a-z]{2,3}$/.test(part)) {
        return part;
      }
    }
    return 'en';
  }

  function getTranslation(key) {
    const currentLang = getCurrentLang();
    const translations = {
      'loading_posts': {
        'en': 'Loading posts...',
        'zh': '加载文章...'
      },
      'no_posts_found': {
        'en': 'No posts found with this tag.',
        'zh': '没有找到相关标签的文章。'
      },
      'error_loading': {
        'en': 'Error loading posts. Please try refreshing the page.',
        'zh': '加载文章时出错，请刷新页面重试。'
      }
    };
    return translations[key]?.[currentLang] || translations[key]?.['en'] || key;
  }

  function formatDate(dateString, lang) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(lang, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function cleanSummary(summary, maxLength = 150) {
    if (!summary) return '';
    let clean = summary.replace(/<[^>]*>/g, '');
    clean = clean.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    clean = clean.replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    if (clean.length > maxLength) {
      clean = clean.substring(0, maxLength) + '...';
    }
    return clean;
  }

  async function loadPostsForTag(tagName) {
    const container = document.getElementById('tag-posts-container');
    const postsList = document.getElementById('tag-posts-list');
    const activeTagName = document.getElementById('active-tag-name');

    if (!container || !postsList) return;

    postsList.innerHTML = `<div class="loading">${getTranslation('loading_posts')}</div>`;
    container.style.display = 'block';
    if (activeTagName) activeTagName.textContent = tagName;

    try {
      const jsonUrl = getJsonUrl();
      console.log('Fetching:', jsonUrl);
      
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const allPosts = await response.json();
      console.log(`Loaded ${allPosts.length} posts`);

      const filteredPosts = allPosts.filter(post => {
        const postTags = post.tags || [];
        if (!Array.isArray(postTags)) return false;
        return postTags.some(tag => tag.toLowerCase() === tagName.toLowerCase());
      });
      
      console.log(`Found ${filteredPosts.length} posts for "${tagName}"`);

      if (filteredPosts.length === 0) {
        postsList.innerHTML = `<div class="error">${getTranslation('no_posts_found')}</div>`;
        return;
      }

      const postsHtml = `
        <ul>
          ${filteredPosts.map(post => `
            <li>
              <a href="${post.permalink || post.url}" class="post-link">${escapeHtml(post.title)}</a>
              ${post.date ? `<span class="post-date">${formatDate(post.date, getCurrentLang())}</span>` : ''}
              ${post.summary ? `<p class="post-summary">${escapeHtml(cleanSummary(post.summary))}</p>` : ''}
            </li>
          `).join('')}
        </ul>
      `;

      postsList.innerHTML = postsHtml;
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
      console.error('Error:', error);
      postsList.innerHTML = `<div class="error">${getTranslation('error_loading')}<br><small>${error.message}</small></div>`;
    }
  }

  function handleTagClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const tagName = link.getAttribute('data-tag-name');
    if (!tagName || currentTag === tagName) return;

    currentTag = tagName;

    document.querySelectorAll('.tag-cloud-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    loadPostsForTag(tagName);
  }

  function setupTagClickHandlers() {
    document.querySelectorAll('.tag-cloud-link').forEach(link => {
      link.removeEventListener('click', handleTagClick);
      link.addEventListener('click', handleTagClick);
    });
  }

  function handleClear() {
    const container = document.getElementById('tag-posts-container');
    if (container) {
      container.style.display = 'none';
      const postsList = document.getElementById('tag-posts-list');
      if (postsList) postsList.innerHTML = '';
    }
    document.querySelectorAll('.tag-cloud-link').forEach(l => l.classList.remove('active'));
    currentTag = null;
  }

  function setupClearButton() {
    const clearBtn = document.getElementById('clear-tag');
    if (clearBtn) {
      clearBtn.removeEventListener('click', handleClear);
      clearBtn.addEventListener('click', handleClear);
    }
  }

  function init() {
    console.log('Tag Cloud initializing...');
    console.log('Language:', getCurrentLang());
    console.log('JSON URL:', getJsonUrl());
    setupTagClickHandlers();
    setupClearButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

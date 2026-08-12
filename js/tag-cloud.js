(function() {
  'use strict';

  let currentTag = null;
  let allPosts = [];

  function getBasePath() {
    // Get the base path from the current URL (e.g., /hexagram/)
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(p => p);
    
    // If first part is a language code, the base is empty
    if (parts.length > 0 && /^[a-z]{2,3}$/.test(parts[0])) {
      return '';
    }
    
    // Otherwise, the base is the first part (e.g., /hexagram)
    if (parts.length > 0) {
      return '/' + parts[0];
    }
    
    return '';
  }

  function getJsonUrl() {
    const container = document.querySelector('.tag-cloud-container');
    
    // Priority 1: Use data attribute from Hugo
    if (container && container.getAttribute('data-json-url')) {
      const url = container.getAttribute('data-json-url');
      console.log('📡 Using data-json-url:', url);
      return url;
    }

    // Priority 2: Construct URL manually
    const currentLang = getCurrentLang();
    const defaultLang = getDefaultLanguage();
    const basePath = getBasePath();
    
    let jsonUrl;
    if (currentLang === defaultLang) {
      jsonUrl = basePath + '/en/index.json';
    } else {
      jsonUrl = basePath + '/' + currentLang + '/index.json';
    }
    
    console.log('📡 Constructed JSON URL:', jsonUrl);
    return jsonUrl;
  }

  function getCurrentLang() {
    const container = document.querySelector('.tag-cloud-container');
    if (container && container.getAttribute('data-lang')) {
      return container.getAttribute('data-lang');
    }

    // Try to detect from URL
    const pathParts = window.location.pathname.split('/');
    for (const part of pathParts) {
      if (part && /^[a-z]{2,3}$/.test(part)) {
        return part;
      }
    }
    return 'en';
  }

  function getDefaultLanguage() {
    const container = document.querySelector('.tag-cloud-container');
    if (container && container.getAttribute('data-default-lang')) {
      return container.getAttribute('data-default-lang');
    }
    return 'en';
  }

  function getTranslation(key) {
    const currentLang = getCurrentLang();
    const translations = {
      'loading_posts': {
        'en': 'Loading posts...',
        'zh': '加载文章...',
        'cn': '加载文章...'
      },
      'no_posts_found': {
        'en': 'No posts found with this tag.',
        'zh': '没有找到相关标签的文章。',
        'cn': '没有找到相关标签的文章。'
      },
      'error_loading': {
        'en': 'Error loading posts. Please try refreshing the page.',
        'zh': '加载文章时出错，请刷新页面重试。',
        'cn': '加载文章时出错，请刷新页面重试。'
      }
    };
    return translations[key]?.[currentLang] || translations[key]?.['en'] || key;
  }

  function formatDate(dateString, lang) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(lang === 'cn' ? 'zh-CN' : lang, {
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

  async function loadAllPosts() {
    try {
      const jsonUrl = getJsonUrl();
      console.log('🔄 Fetching from:', jsonUrl);
      
      const response = await fetch(jsonUrl);
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        // Try alternative URLs
        const currentLang = getCurrentLang();
        const basePath = getBasePath();
        const alternatives = [
          basePath + '/en/index.json',
          basePath + '/' + currentLang + '/index.json',
          '/en/index.json',
          '/' + currentLang + '/index.json',
          '/index.json'
        ];
        
        // Remove duplicates
        const uniqueAlternatives = [...new Set(alternatives)];
        
        for (const alt of uniqueAlternatives) {
          if (alt === jsonUrl) continue;
          console.log('🔄 Trying alternative:', alt);
          try {
            const altResponse = await fetch(alt);
            if (altResponse.ok) {
              allPosts = await altResponse.json();
              console.log(`✅ Loaded ${allPosts.length} posts from alternative: ${alt}`);
              return true;
            }
          } catch (e) {
            // Continue to next alternative
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      allPosts = await response.json();
      console.log(`✅ Loaded ${allPosts.length} posts from: ${jsonUrl}`);
      
      if (allPosts.length > 0) {
        // Log all tags found
        const allTags = new Set();
        allPosts.forEach(p => {
          if (p.tags && Array.isArray(p.tags)) {
            p.tags.forEach(t => allTags.add(t));
          }
        });
        console.log('🏷️ Available tags:', [...allTags]);
        
        // Specifically check for the Statistics tag
        const statsPosts = allPosts.filter(p => 
          p.tags && p.tags.some(t => t.toLowerCase() === 'statistics')
        );
        if (statsPosts.length > 0) {
          console.log(`📊 Found ${statsPosts.length} posts with "Statistics" tag:`, 
            statsPosts.map(p => p.title));
        } else {
          console.warn('⚠️ No posts with "Statistics" tag found in JSON');
        }
      } else {
        console.warn('⚠️ No posts found in JSON');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      return false;
    }
  }

  async function showPostsForTag(tagName) {
    const container = document.getElementById('tag-posts-container');
    const postsList = document.getElementById('tag-posts-list');
    const activeTagName = document.getElementById('active-tag-name');

    if (!container || !postsList) {
      console.error('❌ Container elements not found');
      return;
    }

    // Show loading state
    postsList.innerHTML = `<div class="loading">${getTranslation('loading_posts')}</div>`;
    container.style.display = 'block';
    if (activeTagName) activeTagName.textContent = tagName;

    // Load posts if not loaded yet
    if (allPosts.length === 0) {
      console.log('🔄 Loading posts...');
      const loaded = await loadAllPosts();
      if (!loaded) {
        postsList.innerHTML = `<div class="error">${getTranslation('error_loading')}</div>`;
        return;
      }
    }

    // Debug: Show what we're searching for
    console.log(`🔍 Searching for tag: "${tagName}"`);
    console.log(`📋 Total posts in memory: ${allPosts.length}`);

    // Filter posts by tag (case insensitive)
    const tagLower = tagName.toLowerCase();
    const filteredPosts = allPosts.filter(post => {
      const postTags = post.tags || [];
      if (!Array.isArray(postTags)) return false;
      
      return postTags.some(tag => {
        const match = tag.toLowerCase() === tagLower;
        if (match) {
          console.log(`✅ Match: "${tag}" == "${tagName}" in post "${post.title}"`);
        }
        return match;
      });
    });

    console.log(`🔍 Found ${filteredPosts.length} posts for tag "${tagName}"`);

    if (filteredPosts.length === 0) {
      // Show debug info
      const allTags = [...new Set(allPosts.flatMap(p => p.tags || []))];
      console.log('📋 All available tags in system:', allTags);
      
      let debugMessage = `No posts found with tag "${tagName}"`;
      const exactMatch = allTags.some(t => t === tagName);
      const caseInsensitiveMatch = allTags.some(t => t.toLowerCase() === tagLower);
      
      if (caseInsensitiveMatch && !exactMatch) {
        const matchingTag = allTags.find(t => t.toLowerCase() === tagLower);
        debugMessage += ` (tag exists as "${matchingTag}" - case mismatch!)`;
      } else if (!caseInsensitiveMatch) {
        debugMessage += ` (tag not found. Available: ${allTags.join(', ')})`;
      }
      
      postsList.innerHTML = `
        <div class="error">
          ${debugMessage}
          <br><small>Available tags: ${allTags.join(', ')}</small>
        </div>
      `;
      return;
    }

    // Build HTML for posts
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
  }

  function handleTagClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const tagName = link.getAttribute('data-tag-name');
    
    console.log(`🖱️ Clicked tag: "${tagName}"`);
    
    if (!tagName) return;
    
    if (currentTag === tagName) {
      clearTag();
      return;
    }

    currentTag = tagName;
    document.querySelectorAll('.tag-cloud-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    showPostsForTag(tagName);
  }

  function clearTag() {
    const container = document.getElementById('tag-posts-container');
    const postsList = document.getElementById('tag-posts-list');
    
    if (container) {
      container.style.display = 'none';
    }
    if (postsList) {
      postsList.innerHTML = '';
    }
    
    document.querySelectorAll('.tag-cloud-link').forEach(l => l.classList.remove('active'));
    currentTag = null;
    console.log('🧹 Cleared tag filter');
  }

  function setupTagClickHandlers() {
    const links = document.querySelectorAll('.tag-cloud-link');
    console.log(`🔗 Found ${links.length} tag links`);
    
    links.forEach(link => {
      link.removeEventListener('click', handleTagClick);
      link.addEventListener('click', handleTagClick);
    });
  }

  function setupClearButton() {
    const clearBtn = document.getElementById('clear-tag');
    if (clearBtn) {
      clearBtn.removeEventListener('click', clearTag);
      clearBtn.addEventListener('click', clearTag);
    }
  }

  async function init() {
    console.log('🚀 Tag Cloud initializing...');
    console.log('🌐 Language:', getCurrentLang());
    console.log('📄 JSON URL:', getJsonUrl());
    console.log('🔗 Tag links found:', document.querySelectorAll('.tag-cloud-link').length);
    console.log('📍 Base path:', getBasePath());
    
    await loadAllPosts();
    setupTagClickHandlers();
    setupClearButton();
    
    console.log('✨ Tag Cloud ready!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

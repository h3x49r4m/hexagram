(function() {
  'use strict';

  let currentTag = null;

  function getCurrentLang() {
    const container = document.querySelector('.tag-cloud-container');
    return container ? container.getAttribute('data-lang') : 'en';
  }

  async function loadPostsForTag(tagName, tagUrlized) {
    const container = document.getElementById('tag-posts-container');
    const postsList = document.getElementById('tag-posts-list');
    const activeTagName = document.getElementById('active-tag-name');
    
    if (!container || !postsList) return;

    // Show loading state
    postsList.innerHTML = '<div class="loading">Loading posts...</div>';
    container.style.display = 'block';
    activeTagName.textContent = tagName;
    
    try {
      // Fetch all posts via Hugo's RSS or JSON
      // Alternative: pre-render tag data in a JSON file
      const response = await fetch('/index.json');
      if (!response.ok) throw new Error('Failed to load posts');
      
      const allPosts = await response.json();
      const currentLang = getCurrentLang();
      
      // Filter posts by language and tag
      const filteredPosts = allPosts.filter(post => {
        return post.language === currentLang && 
               post.tags && 
               post.tags.some(tag => tag.toLowerCase() === tagName.toLowerCase());
      });
      
      if (filteredPosts.length === 0) {
        postsList.innerHTML = '<div class="error">No posts found with this tag.</div>';
        return;
      }
      
      // Render posts
      const postsHtml = `
        <ul>
          ${filteredPosts.map(post => `
            <li>
              <a href="${post.permalink}">${post.title}</a>
              ${post.date ? `<span class="post-date">${new Date(post.date).toLocaleDateString()}</span>` : ''}
              ${post.summary ? `<p class="post-summary">${post.summary.substring(0, 150)}...</p>` : ''}
            </li>
          `).join('')}
        </ul>
      `;
      
      postsList.innerHTML = postsHtml;
      
    } catch (error) {
      console.error('Error loading posts:', error);
      postsList.innerHTML = '<div class="error">Error loading posts. Please try again.</div>';
    }
  }

  function setupTagClickHandlers() {
    const tagLinks = document.querySelectorAll('.tag-cloud-link');
    
    tagLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const tagName = link.getAttribute('data-tag-name');
        const tagUrlized = link.getAttribute('data-tag');
        
        if (currentTag === tagName) {
          // If same tag is clicked, you can choose to do nothing or reload
          return;
        }
        
        currentTag = tagName;
        
        // Remove active class from all tags
        tagLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        await loadPostsForTag(tagName, tagUrlized);
        
        // Scroll to posts container smoothly
        const postsContainer = document.getElementById('tag-posts-container');
        if (postsContainer) {
          postsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function setupClearButton() {
    const clearBtn = document.getElementById('clear-tag');
    if (!clearBtn) return;
    
    clearBtn.addEventListener('click', () => {
      const container = document.getElementById('tag-posts-container');
      const tagLinks = document.querySelectorAll('.tag-cloud-link');
      
      if (container) {
        container.style.display = 'none';
      }
      
      tagLinks.forEach(link => link.classList.remove('active'));
      currentTag = null;
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupTagClickHandlers();
      setupClearButton();
    });
  } else {
    setupTagClickHandlers();
    setupClearButton();
  }
})();

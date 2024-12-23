import { addMarkdownAutocomplete } from './markdown.js';

const formatDate = (date) => {
  const dateOptions = { weekday: undefined, year: 'numeric', month: 'short', day: 'numeric' };
  let ds = date.toLocaleDateString(undefined, dateOptions);
  let ts = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  let ws = date.toLocaleDateString(undefined, { weekday: 'short' });
  let s = ts + ' - ' + ds + ' - ' + ws;
  return s;
}

const formatTimestamp = (timestamp) => {
  const date = new Date((timestamp + 978307200) * 1000);
  return formatDate(date);
}

export function init() {
  let articleModal = document.getElementById('article-modal');
  articleModal.onclick = () => {
    closeArticleModal();
  };
  let articleModalContent = document.querySelector('.article-modal-content');
  articleModalContent.onclick = (e) => {
    e.stopPropagation();
  };
  let newPostModal = document.getElementById('new-post-modal');
  newPostModal.onclick = () => {
    closeNewPostModal();
  };
  let newPostModalContent = document.querySelector('.new-post-modal-content');
  newPostModalContent.onclick = (e) => {
    e.stopPropagation();
  };
  let editPostModal = document.getElementById('edit-post-modal');
  editPostModal.onclick = () => {
    closeEditPostModal();
  };
  let editPostModalContent = document.querySelector('.edit-post-modal-content');
  editPostModalContent.onclick = (e) => {
    e.stopPropagation();
  };
}

const openArticleModal = (planet, article) => {
  const cacheBuster = Math.random();
  const articleLink = `/${planet.id}/${article.id}/?r=${cacheBuster}`;
  const modal = document.getElementById('article-modal');
  const avatar = document.getElementById('article-modal-avatar');
  const title = document.getElementById('article-modal-title');
  const iframe = document.getElementById('article-modal-iframe');
  // Set up buttons for the article modal
  const externalLinkButton = document.getElementById('article-modal-external-link');
  externalLinkButton.onclick = () => {
    window.open(articleLink, '_blank');
  };
  const planetButton = document.getElementById('article-modal-planet');
  planetButton.onclick = () => {
    window.open(`/${planet.id}/`, '_blank');
  };
  const trashButton = document.getElementById('article-modal-trash');
  trashButton.onclick = () => {
    // Add a confirmation dialog
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    fetch(`/v0/planets/my/${planet.id}/articles/${article.id}`, {
      method: 'DELETE'
    }).then(response => {
      if (response.ok) {
        closeArticleModal();
        loadArticles(planet);
      }
    });
  };
  const editButton = document.getElementById('article-modal-edit');
  editButton.onclick = () => {
    closeArticleModal();
    openEditArticleModal(planet, article);
  };
  const shareButton = document.getElementById('article-modal-share');
  shareButton.onclick = () => {
    const shareableLink = `https://${planet.ipns}.eth.sucks/${article.id}/`;
    // Open in a new tab
    window.open(shareableLink, '_blank');
  }
  const closeButton = document.getElementById('article-modal-close');
  closeButton.onclick = () => {
    closeArticleModal();
  };
  modal.style.display = 'block';
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeArticleModal();
  });
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  avatar.style.backgroundImage = `url('/${planet.id}/avatar.png')`;
  title.innerText = `${article.title}`;
  iframe.src = articleLink;
}

const closeArticleModal = () => {
  const iframe = document.getElementById('article-modal-iframe');
  iframe.src = 'about:blank';
  const modal = document.getElementById('article-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
}

const openEditArticleModal = (planet, article) => {
  let modal = document.getElementById('edit-post-modal');
  let modalTitle = document.getElementById('edit-post-modal-title');
  let avatar = document.getElementById('edit-post-modal-avatar');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  modalTitle.textContent = `Edit Post on ${planet.name}: ${article.title}`;
  avatar.style.backgroundImage = `url('/${planet.id}/avatar.png')`;
  // Populate the edit post modal with the current article data
  let title = document.getElementById('edit-post-title');
  title.value = article.title;
  title.focus();
  let content = document.getElementById('edit-post-content');
  content.value = article.content;
  let cleanup = addMarkdownAutocomplete(content, { listMarkers: ['- ', '* '], supportNumberedLists: true, supportTaskLists: true, onSubmit: () => submitEditPost(planet, article) });
  // Set up the submit button
  let submitButton = document.getElementById('edit-post-modal-submit');
  submitButton.onclick = () => {
    cleanup();
    submitEditPost(planet, article);
  };
  // Set up the close button
  let closeButton = document.getElementById('edit-post-modal-close');
  closeButton.onclick = () => {
    cleanup();
    closeEditPostModal();
  };
}

const closeEditPostModal = () => {
  const modal = document.getElementById('edit-post-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
}

const submitEditPost = (planet, article) => {
  let title = document.getElementById('edit-post-title').value;
  let content = document.getElementById('edit-post-content').value;
  let attachment = document.getElementById('edit-post-attachment').files[0];
  let formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('articleType', '0');
  if (attachment) {
    formData.append('attachment', attachment);
  }
  let buttons = document.getElementById('edit-post-buttons');
  showSending(buttons);
  fetch(`/v0/planets/my/${planet.id}/articles/${article.id}`, {
    method: 'POST',
    body: formData
  }).then(response => {
    if (response.ok) {
      closeEditPostModal();
      hideSending(buttons);
      loadArticles(planet);
    }
  });
}

const showLoading = () => {
  let planetArticlesList = document.querySelector('.planet-articles-list');
  planetArticlesList.innerHTML = '';
  let loading = document.createElement('div');
  loading.classList.add('loading');
  loading.innerText = 'Loading...';
  // Fine-tune the loading element for the article list
  loading.style.padding = '10px 10px 10px 32px';
  loading.style.backgroundPosition = '10px 10px';
  planetArticlesList.appendChild(loading);
}

const hideLoading = () => {
  let planetArticlesList = document.querySelector('.planet-articles-list');
  let loadingElement = planetArticlesList.querySelector('.loading');
  if (loadingElement) {
    planetArticlesList.removeChild(loadingElement);
  }
}

export async function loadPlanets() {
  try {
    const cacheBuster = Math.random();
    const response = await fetch(`/v0/planets/my?r=${cacheBuster}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const planets = await response.json();
    let planetList = document.querySelector('.planets');
    planetList.innerHTML = ''; // Clear existing content

    planets.forEach(planet => {
      let planetElement = document.createElement('div');
      planetElement.classList.add('planet');
      planetElement.onclick = () => {
        loadPlanet(planet);
      };

      let planetAvatar = document.createElement('div');
      planetAvatar.classList.add('planet-avatar');
      planetAvatar.style.backgroundImage = `url(/${planet.id}/avatar.png)`;

      let planetInfo = document.createElement('div');
      planetInfo.classList.add('planet-info');

      let planetTitle = document.createElement('div');
      planetTitle.classList.add('planet-title');
      planetTitle.innerText = planet.name;

      let planetDescription = document.createElement('div');
      planetDescription.classList.add('planet-description');
      planetDescription.innerText = planet.about;

      planetInfo.appendChild(planetTitle);
      planetInfo.appendChild(planetDescription);

      planetElement.appendChild(planetAvatar);
      planetElement.appendChild(planetInfo);

      planetList.appendChild(planetElement);
    });

    /* Load the last selected Planet */
    let lastSelectedPlanetId = localStorage.getItem('CURRENT_PLANET_ID');
    if (lastSelectedPlanetId) {
      let lastSelectedPlanet = planets.find(planet => planet.id === lastSelectedPlanetId);
      if (lastSelectedPlanet) {
        await loadPlanet(lastSelectedPlanet);
      }
    } else {
      /* Load the first Planet */
      if (planets.length > 0) {
        await loadPlanet(planets[0]);
      }
    }
  } catch (error) {
    console.error('Failed to load planets:', error);
    let planetList = document.querySelector('.planets');
    planetList.innerHTML = '<div class="error">Failed to load planets. Please try again later.</div>';
  }
}

const loadPlanet = async (planet) => {
  fetch(`/v0/planets/my/${planet.id}`)
    .then(response => response.json())
    .then(data => {
      /* Remember the last selected Planet in local storage */
      localStorage.setItem('CURRENT_PLANET_ID', data.id);
      CURRENT_PLANET = data;
      let planetDetails = document.querySelector('.planet-details');
      let planetAvatar = planetDetails.querySelector('.planet-avatar');
      let planetInfo = planetDetails.querySelector('.planet-info');
      let planetTitle = planetInfo.querySelector('.planet-title');
      let planetDescription = planetInfo.querySelector('.planet-description');
      let planetButtons = planetDetails.querySelector('.planet-details-buttons');

      let planetNewPostButton = document.createElement('button');
      planetNewPostButton.classList.add('btn');
      planetNewPostButton.innerText = 'New Post';
      planetNewPostButton.onclick = () => {
        newPost(planet);
      };

      planetButtons.innerHTML = '';
      planetButtons.appendChild(planetNewPostButton);

      planetAvatar.style.backgroundImage = `url(/${planet.id}/avatar.png)`;
      planetTitle.innerText = planet.name;
      planetDescription.innerText = planet.about;

      loadArticles(planet);
    });
}

let currentLoadArticlesRequest = null;

const loadArticles = async (planet) => {
  if (currentLoadArticlesRequest) {
    currentLoadArticlesRequest.abort();
  }

  const controller = new AbortController();
  currentLoadArticlesRequest = controller;

  let planetArticlesList = document.querySelector('.planet-articles-list');
  planetArticlesList.innerHTML = '';
  showLoading();

  try {
    const response = await fetch(`/v0/planets/my/${planet.id}/articles`, { signal: controller.signal });
    const data = await response.json();

    if (controller.signal.aborted) return;

    let planetDetails = document.querySelector('.planet-details');
    let planetArticlesCount = planetDetails.querySelector('.planet-details-count');
    if (data.length === 0) {
      planetArticlesCount.innerText = 'No posts';
      return;
    } else if (data.length === 1) {
      planetArticlesCount.innerText = '1 post';
    } else {
      planetArticlesCount.innerText = `${data.length} posts`;
    }

    data.filter(article => article.articleType === 0).forEach(article => {
      let planetArticleItem = document.createElement('div');
      planetArticleItem.classList.add('planet-article-item');

      let articleTitle = '';
      if (article.title.length > 50) {
        articleTitle = article.title.substring(0, 50) + '...';
      } else if (article.title.length === 0) {
        if (article.content.length > 50) {
          articleTitle = article.content.substring(0, 50) + '...';
        } else {
          articleTitle = article.content;
        }
      } else {
        articleTitle = article.title;
      }
      planetArticleItem.innerText = articleTitle;

      planetArticleItem.onclick = () => {
        openArticleModal(planet, article);
      };

      planetArticlesList.appendChild(planetArticleItem);
    });
    hideLoading();
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error('Failed to load articles:', error);
  }
}

const showSending = (elem) => {
  elem.dataset.originalContent = elem.innerHTML;

  const sending = document.createElement('div');
  sending.classList.add('loading');
  sending.style.padding = '6px 10px 6px 24px';
  sending.style.backgroundPosition = '0px 6px';
  sending.innerText = 'Sending...';

  elem.innerHTML = '';
  elem.appendChild(sending);
}

const hideSending = (elem) => {
  if (elem.dataset.originalContent) {
    elem.innerHTML = elem.dataset.originalContent;
  } else {
    elem.innerHTML = '';
  }
}

const newPost = async (planet) => {
  let modal = document.getElementById('new-post-modal');
  let modalTitle = document.getElementById('new-post-modal-title');
  let avatar = document.getElementById('new-post-modal-avatar');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  modalTitle.innerText = `New Post on ${planet.name}`;
  avatar.style.backgroundImage = `url('/${planet.id}/avatar.png')`;

  let title = document.getElementById('new-post-title');
  title.focus();
  let content = document.getElementById('new-post-content');
  let cleanup = addMarkdownAutocomplete(content, { listMarkers: ['- ', '* '], supportNumberedLists: true, supportTaskLists: true, onSubmit: submitNewPost });

  // set up the submit button
  let submitButton = document.getElementById('new-post-modal-submit');
  submitButton.onclick = () => {
    cleanup();
    submitNewPost();
  };

  // set up the close button
  let closeButton = document.getElementById('new-post-modal-close');
  closeButton.onclick = () => {
    cleanup();
    closeNewPostModal();
  };
}

const closeNewPostModal = () => {
  let modal = document.getElementById('new-post-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
}

const submitNewPost = async () => {
  let title = document.getElementById('new-post-title').value;
  let content = document.getElementById('new-post-content').value;
  let attachment = document.getElementById('new-post-attachment').files[0];
  let planet = CURRENT_PLANET;

  let formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('articleType', '0');
  if (attachment) {
    formData.append('attachment', attachment);
  }

  let buttons = document.getElementById('new-post-buttons');
  showSending(buttons);

  fetch(`/v0/planets/my/${planet.id}/articles`, {
    method: 'POST',
    body: formData
  }).then(response => {
    if (response.ok) {
      clearInputs();
      closeNewPostModal();
      hideSending(buttons);
      loadArticles(planet);
    }
  });
}

const clearInputs = () => {
  document.getElementById('new-post-title').value = '';
  document.getElementById('new-post-content').value = '';
  document.getElementById('new-post-attachment').value = '';
}

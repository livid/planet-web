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

const init = () => {
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
  const articleLink = `/${planet.id}/${article.id}/`;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  avatar.style.backgroundImage = `url('/${planet.id}/avatar.png')`;
  title.innerText = `${article.title}`;
  iframe.src = articleLink;
}

const closeArticleModal = () => {
  const modal = document.getElementById('article-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'scroll';
}

const openEditArticleModal = (planet, article) => {
  let modal = document.getElementById('edit-post-modal');
  let modalTitle = document.getElementById('edit-post-modal-title');
  let avatar = document.getElementById('edit-post-modal-avatar');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  modalTitle.textContent = `Edit Post on ${planet.name}: ${article.title}`;
  avatar.style.backgroundImage = `url('/${planet.id}/avatar.png')`;
  // Populate the edit post modal with the current article data
  let title = document.getElementById('edit-post-title');
  title.value = article.title;
  let content = document.getElementById('edit-post-content');
  content.value = article.content;
  // Set up the submit button
  let submitButton = document.getElementById('edit-post-modal-submit');
  submitButton.onclick = () => {
    submitEditPost(planet, article);
  };
}

const closeEditPostModal = () => {
  const modal = document.getElementById('edit-post-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'scroll';
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
  fetch(`/v0/planets/my/${planet.id}/articles/${article.id}`, {
    method: 'POST',
    body: formData
  }).then(response => {
    if (response.ok) {
      closeEditPostModal();
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
  planetArticlesList.appendChild(loading);
}

const hideLoading = () => {
  let planetArticlesList = document.querySelector('.planet-articles-list');
  let loadingElement = planetArticlesList.querySelector('.loading');
  if (loadingElement) {
    planetArticlesList.removeChild(loadingElement);
  }
}

const loadPlanets = async () => {
  fetch(`/v0/planets/my`)
    .then(response => response.json())
    .then(data => {
      let planets = data;
      let planetList = document.querySelector('.planets');

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
          loadPlanet(lastSelectedPlanet);
        }
      }
    });
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

const loadArticles = async (planet) => {
  let planetArticlesList = document.querySelector('.planet-articles-list');
  planetArticlesList.innerHTML = '';
  showLoading();
  fetch(`/v0/planets/my/${planet.id}/articles`)
    .then(response => response.json())
    .then(data => {
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
    });
}

const newPost = async (planet) => {
  let modal = document.getElementById('new-post-modal');
  let modalTitle = document.getElementById('new-post-modal-title');
  let avatar = document.getElementById('new-post-modal-avatar');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  modalTitle.innerText = `New Post on ${planet.name}`;
  avatar.style.backgroundImage = `url('/${planet.id}/avatar.png')`;
}

const closeNewPostModal = () => {
  let modal = document.getElementById('new-post-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'scroll';
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

  fetch(`/v0/planets/my/${planet.id}/articles`, {
    method: 'POST',
    body: formData
  }).then(response => {
    if (response.ok) {
      clearInputs();
      closeNewPostModal();
      loadArticles(planet);
    }
  });
}

const clearInputs = () => {
  document.getElementById('new-post-title').value = '';
  document.getElementById('new-post-content').value = '';
  document.getElementById('new-post-attachment').value = '';
}

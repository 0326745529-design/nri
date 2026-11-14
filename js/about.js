/* Render admin-managed About page content. */
(function () {
  'use strict';

  function imageUrl(src) {
    return window.NRI_BOOT && window.NRI_BOOT.image ? window.NRI_BOOT.image(src) : src;
  }

  function render() {
    var about = (window.NRI_SITE && window.NRI_SITE.about) || {};
    var directors = Array.isArray(about.directors) ? about.directors : [];
    var certificates = Array.isArray(about.certificates) ? about.certificates : [];
    var leadership = document.getElementById('about-leadership');
    var certificateSection = document.getElementById('about-certificates');
    var directorList = document.getElementById('about-directors');
    var certificateList = document.getElementById('about-certificate-list');

    directorList.textContent = '';
    directors.forEach(function (director) {
      var card = document.createElement('article');
      card.className = 'director-card reveal';
      if (director.image) {
        var image = document.createElement('img');
        image.className = 'director-photo';
        image.src = imageUrl(director.image);
        image.alt = director.name || '';
        image.loading = 'lazy';
        card.appendChild(image);
      }
      var name = document.createElement('h4');
      name.textContent = director.name || '';
      var position = document.createElement('p');
      position.className = 'role';
      position.textContent = director.position || '';
      var biography = document.createElement('p');
      biography.textContent = director.biography || '';
      card.appendChild(name);
      card.appendChild(position);
      card.appendChild(biography);
      directorList.appendChild(card);
    });
    leadership.hidden = directors.length === 0;

    certificateList.textContent = '';
    certificates.forEach(function (certificate) {
      var card = document.createElement('article');
      card.className = 'certificate-card reveal';
      var image = document.createElement('img');
      image.src = imageUrl(certificate.image);
      image.alt = certificate.title || 'Company certificate';
      image.loading = 'lazy';
      var title = document.createElement('h3');
      title.textContent = certificate.title || '';
      card.appendChild(image);
      card.appendChild(title);
      certificateList.appendChild(card);
    });
    certificateSection.hidden = certificates.length === 0;
  }

  if (window.NRI_BOOT && window.NRI_BOOT.ready) window.NRI_BOOT.ready(render);
})();

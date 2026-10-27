(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.querySelector('.loader');

  if (loader && !reduceMotion) {
    root.classList.add('js-loader');
    window.setTimeout(() => loader.classList.add('done'), 350);
  }

  // Keep content visible unless the scroll observer is ready to reveal it.
  const revealItems = document.querySelectorAll('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    root.classList.add('js-reveal');
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // The mobile menu is collapsed only after its controls are wired up.
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (menuToggle && mainNav) {
    root.classList.add('js-navigation');

    const setMenu = open => {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      mainNav.classList.toggle('is-open', open);
    };

    menuToggle.addEventListener('click', () => {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false);
      menuToggle.focus();
    });

    const desktopNavigation = window.matchMedia('(min-width: 761px)');
    desktopNavigation.addEventListener?.('change', event => {
      if (event.matches) setMenu(false);
    });
  }

  // Counts and pressed states stay in sync with the project cards.
  const filterButtons = [...document.querySelectorAll('.filter-button')];
  const projects = [...document.querySelectorAll('.work-card')];
  const filterStatus = document.querySelector('.filter-status');
  const updateFilterStatus = (filter, visibleCount) => {
    if (!filterStatus) return;
    if (visibleCount === 0) {
      filterStatus.textContent = 'No projects match this filter.';
      return;
    }
    if (filter === 'all') {
      filterStatus.textContent = `Showing all ${visibleCount} projects.`;
      return;
    }
    const label = filterButtons.find(button => button.dataset.filter === filter)?.firstChild?.textContent.trim() ?? filter;
    filterStatus.textContent = `Showing ${visibleCount} ${label} ${visibleCount === 1 ? 'project' : 'projects'}.`;
  };

  filterButtons.forEach(button => {
    const filter = button.dataset.filter;
    const count = filter === 'all'
      ? projects.length
      : projects.filter(project => project.dataset.category === filter).length;
    const countLabel = button.querySelector('span');
    if (countLabel) countLabel.textContent = String(count).padStart(2, '0');

    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter;
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      let visibleCount = 0;
      projects.forEach(project => {
        const visible = selectedFilter === 'all' || project.dataset.category === selectedFilter;
        project.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      updateFilterStatus(selectedFilter, visibleCount);
    });
  });
  updateFilterStatus('all', projects.length);

  // With JavaScript, reel links open an accessible player; without it, links play the MP4 directly.
  const reelDialog = document.querySelector('.reel-modal');
  const reelVideo = reelDialog?.querySelector('.modal-video');
  const modalScreen = reelDialog?.querySelector('.modal-screen');
  const modalPlaceholder = reelDialog?.querySelector('.modal-placeholder');
  const modalMessage = modalPlaceholder?.querySelector('small');
  const modalTitle = reelDialog?.querySelector('.modal-title');

  document.querySelectorAll('.reel-card').forEach(card => {
    card.addEventListener('click', event => {
      if (!reelDialog?.showModal || !reelVideo || !modalScreen || !modalPlaceholder) return;
      event.preventDefault();

      reelVideo.pause();
      reelVideo.removeAttribute('src');
      reelVideo.load();
      modalScreen.classList.remove('has-video');

      const mediaPath = card.dataset.video || card.getAttribute('href');
      const title = card.dataset.title || 'Portfolio reel';
      const kind = card.dataset.kind || '';
      if (modalMessage) {
        modalMessage.textContent = `Playing ${title}.`;
      }
      if (modalTitle) modalTitle.textContent = `${title} / ${kind} / 9:16`;
      reelVideo.setAttribute('aria-label', `${title} video`);
      reelDialog.showModal();
      reelVideo.src = mediaPath;
      reelVideo.load();
    });
  });

  reelVideo?.addEventListener('loadeddata', () => {
    modalScreen?.classList.add('has-video');
  });

  reelVideo?.addEventListener('error', () => {
    modalScreen?.classList.remove('has-video');
    if (modalMessage) {
      const title = modalTitle?.textContent.split(' / ')[0] ?? 'This reel';
      modalMessage.textContent = `${title} video could not be loaded. Check the matching file in media/.`;
    }
  });

  const closeReel = () => {
    reelVideo?.pause();
    if (reelVideo) {
      reelVideo.removeAttribute('src');
      reelVideo.load();
    }
    reelDialog?.close();
  };

  reelDialog?.querySelector('.modal-close')?.addEventListener('click', closeReel);
  reelDialog?.addEventListener('click', event => {
    if (event.target === reelDialog) closeReel();
  });
  reelDialog?.addEventListener('close', () => reelVideo?.pause());

  // Subtle pointer response is limited to fine pointers and respects reduced motion.
  const cursor = document.querySelector('.cursor-dot');
  const parallaxItems = document.querySelectorAll('[data-parallax]');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    window.addEventListener('pointermove', event => {
      if (cursor) {
        cursor.style.opacity = '1';
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
      }

      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      parallaxItems.forEach((item, index) => {
        const strength = index === 0 ? 2.5 : 1.5;
        const image = item.querySelector('.about-image');
        image?.style.setProperty('--parallax-x', `${x * strength}px`);
        image?.style.setProperty('--parallax-y', `${y * strength}px`);
      });
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      if (cursor) cursor.style.opacity = '0';
    });
  }

  // Copy contact details and announce the result to screen readers.
  const copyFeedback = document.querySelector('.copy-feedback');
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const originalLabel = button.getAttribute('aria-label');
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        if (copyFeedback) copyFeedback.textContent = `${button.dataset.copy} copied to clipboard.`;
        button.setAttribute('aria-label', `${originalLabel}, copied`);
        const actionLabel = button.querySelector('i');
        if (actionLabel) actionLabel.textContent = 'Copied ✓';
        window.setTimeout(() => {
          button.setAttribute('aria-label', originalLabel);
          if (actionLabel) actionLabel.textContent = 'Copy ↗';
        }, 1800);
      } catch {
        if (copyFeedback) copyFeedback.textContent = 'Clipboard access is unavailable in this browser.';
      }
    });
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

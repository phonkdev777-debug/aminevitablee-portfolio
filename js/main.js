/* ═══════════════════════════════════════════════════════════════
   XRXCHIMARU — Main JavaScript
   GSAP animations, particle canvas, mouse glow, scroll reveals,
   typing effect, navigation, and smooth scrolling.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── WAIT FOR DOM + GSAP ────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initNavigation();
    initTypingEffect();
    initMouseGlow();
    initParticles();
    initScrollReveals();
    initHeroAnimations();
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION — scroll effect + mobile toggle
  ═══════════════════════════════════════════════════════════ */
  function initNavigation() {
    var navbar = document.getElementById('navbar');
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');

    // Add scrolled class on scroll
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });

    // Mobile menu toggle
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var isOpen = links.classList.toggle('open');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen);
      });

      // Close menu on link click
      links.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          links.classList.remove('open');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     TYPING EFFECT — cycles through words in hero tagline
  ═══════════════════════════════════════════════════════════ */
  function initTypingEffect() {
    var el = document.getElementById('typed-text');
    if (!el) return;

    var words = ['Developer', 'Designer', 'Creator', 'Problem Solver'];
    var wordIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 80;    // typing speed (ms)
    var deleteSpeed = 40;  // deleting speed (ms)
    var pauseEnd = 1800;   // pause after word typed
    var pauseStart = 600;  // pause after word deleted

    function tick() {
      var currentWord = words[wordIndex];

      if (isDeleting) {
        el.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        el.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      var speed = isDeleting ? deleteSpeed : typeSpeed;

      if (!isDeleting && charIndex === currentWord.length) {
        speed = pauseEnd;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        speed = pauseStart;
      }

      setTimeout(tick, speed);
    }

    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     MOUSE GLOW — soft radial light following cursor
  ═══════════════════════════════════════════════════════════ */
  function initMouseGlow() {
    var glow = document.getElementById('mouse-glow');
    if (!glow) return;

    // Check if device likely has a mouse (desktop)
    if (window.matchMedia('(pointer: fine)').matches) {
      var mouseX = 0;
      var mouseY = 0;
      var glowX = 0;
      var glowY = 0;

      document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        glow.style.opacity = '1';
      }, { passive: true });

      // Smooth follow with lerp
      function animateGlow() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animateGlow);
      }
      animateGlow();
    } else {
      // Hide on touch devices
      glow.style.display = 'none';
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PARTICLE CANVAS — optimized for 60fps + low RAM
     - Reduced particle count (35 vs 60)
     - Removed O(n²) connection lines (biggest CPU hog)
     - Pre-computed values, no string concat in hot loop
     - Uses fillRect for faster rendering vs arc()
  ═══════════════════════════════════════════════════════════ */
  function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var PARTICLE_COUNT = 35;
    var animFrameId;
    var w, h;

    // Flat arrays instead of objects — less GC pressure
    var px = new Float32Array(PARTICLE_COUNT);
    var py = new Float32Array(PARTICLE_COUNT);
    var pvx = new Float32Array(PARTICLE_COUNT);
    var pvy = new Float32Array(PARTICLE_COUNT);
    var pr = new Float32Array(PARTICLE_COUNT);
    var po = new Float32Array(PARTICLE_COUNT);

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Initialize particles
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      px[i] = Math.random() * w;
      py[i] = Math.random() * h;
      pvx[i] = (Math.random() - 0.5) * 0.25;
      pvy[i] = (Math.random() - 0.5) * 0.25;
      pr[i] = Math.random() * 1.0 + 0.4;
      po[i] = Math.random() * 0.2 + 0.04;
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        // Update
        px[i] += pvx[i];
        py[i] += pvy[i];
        if (px[i] < 0) px[i] = w;
        if (px[i] > w) px[i] = 0;
        if (py[i] < 0) py[i] = h;
        if (py[i] > h) py[i] = 0;

        // Draw — fillRect is faster than arc for tiny dots
        ctx.fillStyle = 'rgba(255,255,255,' + po[i] + ')';
        ctx.fillRect(px[i], py[i], pr[i], pr[i]);
      }

      animFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Pause when tab is hidden — saves battery + RAM
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(animFrameId);
      } else {
        animate();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SCROLL REVEALS — GSAP ScrollTrigger animations
     Ultra-smooth with power4 easing and staggered reveals
  ═══════════════════════════════════════════════════════════ */
  function initScrollReveals() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback: just show everything
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Global defaults for buttery smooth animations
    gsap.defaults({
      ease: 'power4.out',
      duration: 0.9,
    });

    // Reveal elements on scroll — each section gets slightly different timing
    var revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach(function (el, i) {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          ease: 'power4.out',
          duration: 1,
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            end: 'top 60%',
            toggleActions: 'play none none none',
            // Smooth scrub-like feel
            fastScrollEnd: true,
          }
        }
      );
    });

    // Stagger skill tags within each category
    document.querySelectorAll('.skill-category').forEach(function (cat) {
      // Icon entrance
      var icon = cat.querySelector('.skill-category-icon');
      if (icon) {
        gsap.fromTo(icon,
          { opacity: 0, scale: 0.5, rotate: -10 },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 0.6,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: cat,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          }
        );
      }

      var tags = cat.querySelectorAll('.skill-tag');
      gsap.fromTo(tags,
        { opacity: 0, y: 15, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cat,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    });

    // Project card icon entrance — scale + fade
    document.querySelectorAll('.project-card').forEach(function (card) {
      var iconGroup = card.querySelector('.project-icon-group');
      if (iconGroup) {
        gsap.fromTo(iconGroup,
          { opacity: 0, scale: 0.6 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            }
          }
        );
      }
    });

    // Stagger timeline items — slide in from left with smooth easing
    var timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(function (item, i) {
      gsap.fromTo(item,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'power4.out',
          delay: i * 0.08,
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
            toggleActions: 'play none none none',
          }
        }
      );
    });

    // Footer entrance — fade up smoothly
    var footer = document.querySelector('.footer');
    if (footer) {
      gsap.fromTo(footer,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 95%',
            toggleActions: 'play none none none',
          }
        }
      );
    }
  }

  /* ═══════════════════════════════════════════════════════════
     HERO ANIMATIONS — cinematic entrance sequence with GSAP
  ═══════════════════════════════════════════════════════════ */
  function initHeroAnimations() {
    if (typeof gsap === 'undefined') {
      // Fallback: just show everything
      var fallback = document.querySelectorAll('.hero-image-wrapper, .hero-subtitle, .hero-name, .hero-tagline, .hero-cta');
      fallback.forEach(function (el) { el.style.opacity = '1'; });
      return;
    }

    var tl = gsap.timeline({ delay: 0.2 });

    // Image entrance — scale up from center with smooth ease
    tl.fromTo('.hero-image-wrapper',
      { opacity: 0, scale: 0.7, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power4.out' }
    );

    // Subtitle — fade down
    tl.fromTo('.hero-subtitle',
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
      '-=0.6'
    );

    // Name lines — stagger in
    tl.fromTo('.hero-name-line',
      { opacity: 0, y: 50, clipPath: 'inset(0 0 100% 0)' },
      { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.9, stagger: 0.12, ease: 'power4.out' },
      '-=0.4'
    );

    // Tagline
    tl.fromTo('.hero-tagline',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.3'
    );

    // CTA buttons — stagger in
    tl.fromTo('.hero-cta .btn',
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
      '-=0.2'
    );

    // Scroll indicator — fade in
    tl.fromTo('.scroll-indicator',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.1'
    );
  }

})();

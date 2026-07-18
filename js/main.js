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
     DEEP SPACE CANVAS — premium starfield + constellations
     Renders hundreds of stars, soft bloom on bright ones,
     constellation lines around edges, all monochrome.
     Optimized: Float32Arrays, fillRect, no GC in hot loop.
  ═══════════════════════════════════════════════════════════ */
  function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var animFrameId;
    var w, h;

    // ── Star config ──
    var STAR_COUNT = 280;
    var BRIGHT_STAR_CHANCE = 0.06; // ~6% of stars get glow bloom
    var EDGE_MARGIN = 0.2; // edges where constellations appear (20%)

    // ── Star data (flat arrays for zero GC) ──
    var sx = new Float32Array(STAR_COUNT);
    var sy = new Float32Array(STAR_COUNT);
    var sr = new Float32Array(STAR_COUNT);   // radius
    var so = new Float32Array(STAR_COUNT);   // base opacity
    var sb = new Uint8Array(STAR_COUNT);     // is bright? (0 or 1)
    var st = new Float32Array(STAR_COUNT);   // twinkle phase

    // ── Constellation data ──
    var CONSTELLATION_MAX_LINES = 30;
    var clx1 = new Float32Array(CONSTELLATION_MAX_LINES);
    var cly1 = new Float32Array(CONSTELLATION_MAX_LINES);
    var clx2 = new Float32Array(CONSTELLATION_MAX_LINES);
    var cly2 = new Float32Array(CONSTELLATION_MAX_LINES);
    var clo = new Float32Array(CONSTELLATION_MAX_LINES); // opacity
    var constellationCount = 0;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      generateStars();
      generateConstellations();
    }

    function generateStars() {
      for (var i = 0; i < STAR_COUNT; i++) {
        sx[i] = Math.random() * w;
        sy[i] = Math.random() * h;

        // Size distribution: most are tiny, very few large
        var roll = Math.random();
        if (roll < 0.7) {
          sr[i] = 0.3 + Math.random() * 0.4;       // tiny (70%)
        } else if (roll < 0.92) {
          sr[i] = 0.6 + Math.random() * 0.5;       // small (22%)
        } else if (roll < 0.98) {
          sr[i] = 0.9 + Math.random() * 0.6;       // medium (6%)
        } else {
          sr[i] = 1.2 + Math.random() * 0.8;       // bright (2%)
        }

        // Bright stars with glow
        sb[i] = (Math.random() < BRIGHT_STAR_CHANCE) ? 1 : 0;

        // Opacity — dimmer overall, brighter if marked
        so[i] = sb[i]
          ? 0.5 + Math.random() * 0.4
          : 0.08 + Math.random() * 0.25;

        // Twinkle phase (subtle oscillation)
        st[i] = Math.random() * Math.PI * 2;
      }
    }

    function generateConstellations() {
      constellationCount = 0;
      var maxDist = Math.min(w, h) * 0.12; // max line length

      // Find stars in edge/corner regions only
      var edgeStars = [];
      for (var i = 0; i < STAR_COUNT; i++) {
        var nx = sx[i] / w;  // normalized 0-1
        var ny = sy[i] / h;

        // Is it in an edge/corner region?
        var inEdge = (
          nx < EDGE_MARGIN || nx > (1 - EDGE_MARGIN) ||
          ny < EDGE_MARGIN || ny > (1 - EDGE_MARGIN)
        );

        // Prefer corners even more
        var inCorner = (
          (nx < EDGE_MARGIN && ny < EDGE_MARGIN) ||
          (nx > 1 - EDGE_MARGIN && ny < EDGE_MARGIN) ||
          (nx < EDGE_MARGIN && ny > 1 - EDGE_MARGIN) ||
          (nx > 1 - EDGE_MARGIN && ny > 1 - EDGE_MARGIN)
        );

        if (inEdge || inCorner) {
          edgeStars.push(i);
        }
      }

      // Connect nearby edge stars
      for (var a = 0; a < edgeStars.length && constellationCount < CONSTELLATION_MAX_LINES; a++) {
        var ai = edgeStars[a];
        var bestDist = maxDist;
        var bestIdx = -1;

        for (var b = a + 1; b < edgeStars.length; b++) {
          var bi = edgeStars[b];
          var dx = sx[ai] - sx[bi];
          var dy = sy[ai] - sy[bi];
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < bestDist && dist > 20) {
            bestDist = dist;
            bestIdx = bi;
          }
        }

        if (bestIdx >= 0) {
          var idx = constellationCount;
          clx1[idx] = sx[ai];
          cly1[idx] = sy[ai];
          clx2[idx] = sx[bestIdx];
          cly2[idx] = sy[bestIdx];
          clo[idx] = 0.04 + Math.random() * 0.03; // ultra-low opacity
          constellationCount++;
        }
      }
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── Render loop ──
    var time = 0;

    function animate() {
      time += 0.016; // ~60fps time step
      ctx.clearRect(0, 0, w, h);

      // Draw constellation lines first (behind stars)
      for (var c = 0; c < constellationCount; c++) {
        ctx.beginPath();
        ctx.moveTo(clx1[c], cly1[c]);
        ctx.lineTo(clx2[c], cly2[c]);
        ctx.strokeStyle = 'rgba(255,255,255,' + clo[c] + ')';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }

      // Draw constellation vertices (tiny dots at connection points)
      for (var c = 0; c < constellationCount; c++) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(clx1[c] - 0.5, cly1[c] - 0.5, 1, 1);
        ctx.fillRect(clx2[c] - 0.5, cly2[c] - 0.5, 1, 1);
      }

      // Draw stars
      for (var i = 0; i < STAR_COUNT; i++) {
        // Subtle twinkle — sinusoidal brightness oscillation
        var twinkle = Math.sin(time * (0.5 + st[i] * 0.3) + st[i]) * 0.15;
        var alpha = Math.max(0.02, so[i] + twinkle);

        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.fillRect(sx[i], sy[i], sr[i], sr[i]);

        // Bloom glow for bright stars — soft radial gradient
        if (sb[i]) {
          var glowSize = sr[i] * 6;
          var grd = ctx.createRadialGradient(
            sx[i], sy[i], 0,
            sx[i], sy[i], glowSize
          );
          grd.addColorStop(0, 'rgba(255,255,255,' + (alpha * 0.3) + ')');
          grd.addColorStop(0.3, 'rgba(255,255,255,' + (alpha * 0.08) + ')');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(sx[i] - glowSize, sy[i] - glowSize, glowSize * 2, glowSize * 2);
        }
      }

      animFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Pause when tab hidden
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

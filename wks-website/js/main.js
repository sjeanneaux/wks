/* Wilhelm-Knapp-Schule Weilburg - Main JavaScript */

document.addEventListener('DOMContentLoaded', function () {

  // Mobile Navigation Toggle
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
  }

  // Mobile Dropdown Toggle
  document.querySelectorAll('.nav-dropdown > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        this.parentElement.classList.toggle('active');
      }
    });
  });

  // Close mobile nav on link click
  document.querySelectorAll('.main-nav a:not(.nav-dropdown > a)').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 768) {
        mainNav.classList.remove('active');
        navToggle.classList.remove('active');
      }
    });
  });

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-item');
      const isActive = item.classList.contains('active');

      // Close all others
      document.querySelectorAll('.faq-item').forEach(function (el) {
        el.classList.remove('active');
      });

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Back to Top Button
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Active Navigation Highlighting
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

  function highlightNav() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav);

  // Contact Form Handling
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Basic validation
      const requiredFields = contactForm.querySelectorAll('[required]');
      let valid = true;

      requiredFields.forEach(function (field) {
        if (!field.value.trim()) {
          field.style.borderColor = '#dc3545';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (valid) {
        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = 'Vielen Dank f\u00fcr Ihre Nachricht! Wir werden uns schnellstm\u00f6glich bei Ihnen melden.';
        contactForm.parentNode.insertBefore(alert, contactForm);
        contactForm.reset();

        setTimeout(function () {
          alert.remove();
        }, 5000);
      }
    });
  }

  // Bewerbungsformular Handling
  const bewerbungForm = document.getElementById('bewerbungForm');
  if (bewerbungForm) {
    bewerbungForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const requiredFields = bewerbungForm.querySelectorAll('[required]');
      let valid = true;

      requiredFields.forEach(function (field) {
        if (!field.value.trim()) {
          field.style.borderColor = '#dc3545';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      const datenschutz = bewerbungForm.querySelector('#datenschutz');
      if (datenschutz && !datenschutz.checked) {
        valid = false;
        datenschutz.parentElement.style.color = '#dc3545';
      }

      if (valid) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = 'Ihre Bewerbung wurde erfolgreich eingereicht! Sie erhalten eine Best\u00e4tigung per E-Mail.';
        bewerbungForm.parentNode.insertBefore(alert, bewerbungForm);
        bewerbungForm.reset();

        setTimeout(function () {
          alert.remove();
        }, 5000);
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.news-card, .schulform-card, .beruf-card, .stat-card, .faq-item').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

});

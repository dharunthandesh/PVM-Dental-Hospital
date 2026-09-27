document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  
    // 2. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
  
    function openMenu() {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
  
    function closeMenu() {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  
    mobileToggle.addEventListener('click', openMenu);
    mobileClose.addEventListener('click', closeMenu);
    
    // Close menu when clicking a link
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  
    // 3. Scroll Reveal Animations (Aesthetic fade-ins)
    const revealElements = document.querySelectorAll('.reveal');
  
    const revealOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    };
  
    const revealObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        } else {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, revealOptions);
  
    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  
    // Trigger reveals on load for elements already in viewport
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if(rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 100);

    // 4. Services Category Filter
    const tabBtns = document.querySelectorAll('.tab-btn');
    const serviceCards = document.querySelectorAll('.service-card');
  
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        
        serviceCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue) {
            card.style.display = '';
            // Trigger a reflow
            void card.offsetWidth;
            card.classList.add('active');
          } else {
            card.style.display = 'none';
            card.classList.remove('active');
          }
        });
      });
    });

    // 5. Auto-scrolling Reviews Slider
    const track = document.getElementById('reviews-slider-track');
    const prevBtn = document.getElementById('prev-review-btn');
    const nextBtn = document.getElementById('next-review-btn');
    const dotsContainer = document.getElementById('slider-dots');
    
    if (track) {
      const cards = track.querySelectorAll('.review-card');
      const cardCount = cards.length;
      let cardWidth = 0;
      let currentIndex = 0;
      let autoPlayInterval;
      
      const updateCardWidth = () => {
        if (cards.length > 1) {
          cardWidth = cards[1].offsetLeft - cards[0].offsetLeft;
          if (cardWidth <= 0) {
            cardWidth = cards[0].offsetWidth + parseInt(window.getComputedStyle(track).gap || 32);
          }
        } else {
          cardWidth = cards[0].offsetWidth;
        }
      };
      
      // Update dimensions on resize
      window.addEventListener('resize', () => {
        updateCardWidth();
        generateDots();
        updateDots();
      });
      
      // Calculate visible cards based on screen size
      const getVisibleCardsCount = () => {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 992) return 2;
        return 3;
      };
      
      // Generate dots dynamically
      const generateDots = () => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const visibleCount = getVisibleCardsCount();
        const dotCount = Math.max(1, cardCount - visibleCount + 1);
        
        for (let i = 0; i < dotCount; i++) {
          const dot = document.createElement('div');
          dot.classList.add('slider-dot');
          if (i === 0) dot.classList.add('active');
          dot.addEventListener('click', () => {
            stopAutoPlay();
            scrollToIndex(i);
            startAutoPlay();
          });
          dotsContainer.appendChild(dot);
        }
      };
      
      const updateDots = () => {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        if (dots.length === 0) return;
        const visibleCount = getVisibleCardsCount();
        // Determine active dot based on scroll position
        const scrollIndex = Math.round(track.scrollLeft / cardWidth);
        const activeIndex = Math.min(dots.length - 1, scrollIndex);
        
        dots.forEach((dot, idx) => {
          if (idx === activeIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      };
      
      const scrollToIndex = (index) => {
        const visibleCount = getVisibleCardsCount();
        const maxIndex = cardCount - visibleCount;
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        track.scrollLeft = currentIndex * cardWidth;
        updateDots();
      };
      
      // Slide left / right
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          stopAutoPlay();
          const visibleCount = getVisibleCardsCount();
          const maxIndex = cardCount - visibleCount;
          if (currentIndex <= 0) {
            scrollToIndex(maxIndex); // Loop to end
          } else {
            scrollToIndex(currentIndex - 1);
          }
          startAutoPlay();
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          stopAutoPlay();
          const visibleCount = getVisibleCardsCount();
          const maxIndex = cardCount - visibleCount;
          if (currentIndex >= maxIndex) {
            scrollToIndex(0); // Loop to start
          } else {
            scrollToIndex(currentIndex + 1);
          }
          startAutoPlay();
        });
      }
      
      // Track scroll event to update dots manually when swiping
      let scrollTimeout;
      track.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollIndex = Math.round(track.scrollLeft / cardWidth);
          currentIndex = scrollIndex;
          updateDots();
        }, 100);
      });
      
      // Auto Play
      const startAutoPlay = () => {
        stopAutoPlay(); // Prevent duplicates
        autoPlayInterval = setInterval(() => {
          const visibleCount = getVisibleCardsCount();
          const maxIndex = cardCount - visibleCount;
          if (currentIndex >= maxIndex) {
            currentIndex = 0;
          } else {
            currentIndex++;
          }
          track.scrollLeft = currentIndex * cardWidth;
          updateDots();
        }, 3000); // Auto scroll every 3 seconds
      };
      
      const stopAutoPlay = () => {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
        }
      };
      
      // Pause autoplay when hovering
      track.addEventListener('mouseenter', stopAutoPlay);
      track.addEventListener('mouseleave', startAutoPlay);
      track.addEventListener('touchstart', stopAutoPlay, { passive: true });
      track.addEventListener('touchend', startAutoPlay, { passive: true });
      
      // Initialize
      setTimeout(() => {
        updateCardWidth();
        generateDots();
        startAutoPlay();
      }, 500); // Small timeout to ensure page rendering is complete
    }

    // 6. Appointment Booking Form -> WhatsApp Redirection
    const apptForm = document.getElementById('appointment-form');
    const apptDateInput = document.getElementById('appt-date');

    if (apptDateInput) {
      // Set min date to today
      const today = new Date().toISOString().split('T')[0];
      apptDateInput.min = today;
    }

    if (apptForm) {
      apptForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('appt-name');
        const phoneInput = document.getElementById('appt-phone');
        const treatmentInput = document.getElementById('appt-treatment');
        const dateInput = document.getElementById('appt-date');
        const timeInput = document.getElementById('appt-time');
        const commentInput = document.getElementById('appt-comment');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const treatment = treatmentInput && treatmentInput.value ? treatmentInput.value : 'General Dental Consultation';
        const dateVal = dateInput ? dateInput.value : '';
        const timeSlot = timeInput && timeInput.value ? timeInput.value : 'Flexible / Any Available Slot';
        const comment = commentInput ? commentInput.value.trim() : '';

        // Validation
        let isValid = true;

        if (!name) {
          nameInput.classList.add('input-error');
          isValid = false;
        } else {
          nameInput.classList.remove('input-error');
        }

        if (!phone || phone.length < 8) {
          phoneInput.classList.add('input-error');
          isValid = false;
        } else {
          phoneInput.classList.remove('input-error');
        }

        if (!dateVal) {
          dateInput.classList.add('input-error');
          isValid = false;
        } else {
          dateInput.classList.remove('input-error');
        }

        if (!isValid) {
          alert('Please fill in your Name, Mobile Number, and Preferred Date.');
          return;
        }

        // Format Date into DD-MM-YYYY
        let displayDate = dateVal;
        if (dateVal.includes('-')) {
          const parts = dateVal.split('-');
          if (parts.length === 3) {
            displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        // Build WhatsApp Message Template with booking slot and timings
        let text = `🦷 *Appointment Booking Request - PVM Dental Clinic*\n\n`;
        text += `👤 *Patient Name:* ${name}\n`;
        text += `📱 *Mobile Number:* ${phone}\n`;
        text += `🩺 *Selected Treatment:* ${treatment}\n`;
        text += `📅 *Preferred Date:* ${displayDate}\n`;
        text += `⏰ *Booking Slot:* ${timeSlot}\n`;
        if (comment) {
          text += `💬 *Patient Comment:* ${comment}\n`;
        }
        text += `\nPlease confirm my appointment slot with Dr. Mayuri AP. Thank you!`;

        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/919677104464?text=${encodedText}`;

        // Feedback state on button
        const submitBtn = document.getElementById('btn-submit-appointment');
        if (submitBtn) {
          const originalHTML = submitBtn.innerHTML;
          submitBtn.innerHTML = `<i class="ph-fill ph-spinner ph-spin"></i> Opening WhatsApp...`;
          setTimeout(() => {
            submitBtn.innerHTML = originalHTML;
          }, 2500);
        }

        window.open(whatsappUrl, '_blank');
      });
    }
  });

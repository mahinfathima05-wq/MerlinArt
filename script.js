
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const serviceSelect = document.getElementById("serviceSelect");
if (serviceSelect) {
  const requestedService = new URLSearchParams(window.location.search).get("service");
  if (requestedService && [...serviceSelect.options].some((option) => option.value === requestedService)) {
    serviceSelect.value = requestedService;
  }
}

const heroSlides = document.querySelectorAll(".hero-slide");
const heroServiceName = document.getElementById("heroServiceName");
const heroHeadlineLead = document.getElementById("heroHeadlineLead");
const heroHeadlineHighlight = document.getElementById("heroHeadlineHighlight");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const transformationCarousel = document.getElementById("transformationCarousel");
const transformationTrack = document.getElementById("transformationCarouselTrack");
const transformationTitle = document.getElementById("transformationTitle");
const transformationDescription = document.getElementById("transformationDescription");
const transformationPoints = document.querySelector(".transformation-details ul");
if (transformationCarousel && transformationTrack && transformationTitle && transformationDescription && transformationPoints) {
  const transformationSlides = [...transformationTrack.querySelectorAll("img")];
  const previousTransformationButton = transformationCarousel.querySelector(".transformation-carousel-previous");
  const nextTransformationButton = transformationCarousel.querySelector(".transformation-carousel-next");
  const transformationContent = [
    {
      title: "A brighter, refreshed home.",
      description: "This room feels cleaner and more open with a fresh finish from floor to ceiling.",
      points: [
        "Refresh the walls with a smooth, even finish.",
        "Brighten the room with a light, neutral palette.",
        "Give the floor and trim a clean, renewed look."
      ]
    },
    {
      title: "A one-of-a-kind feature wall.",
      description: "A hand-painted floral mural transforms a simple wall into a bold, personal artwork.",
      points: [
        "Turn a room into a memorable creative space.",
        "Bring colour and detail to a plain wall.",
        "Create a custom design tailored to your space."
      ]
    },
    {
      title: "A polished, modern workplace.",
      description: "A bright office finish gives this commercial space a clean, professional feel.",
      points: [
        "Refresh the space with a crisp, light finish.",
        "Use colour to highlight architectural details.",
        "Create a welcoming environment for teams and visitors."
      ]
    },
    {
      title: "A playful place to learn.",
      description: "Colourful characters and a vivid mural turn a plain room into a cheerful play-school space.",
      points: [
        "Make the room feel fun and inviting for children.",
        "Use lively colours to bring the walls to life.",
        "Add visual details that spark imagination."
      ]
    },
    {
      title: "A fresh look for the office.",
      description: "This office transformation pairs bright finishes with glass walls and clean, modern details.",
      points: [
        "Give a commercial interior a neat, updated look.",
        "Keep the space bright with a light colour palette.",
        "Complement the workspace with considered accent colours."
      ]
    },
    {
      title: "A calm, colourful home.",
      description: "A rich teal feature wall adds character while keeping this residential room warm and restful.",
      points: [
        "Create a focal point with a confident wall colour.",
        "Pair deeper tones with soft, neutral surfaces.",
        "Bring a finished, balanced feel to the room."
      ]
    },
    {
      title: "Texture that adds depth.",
      description: "A decorative textured finish turns a plain wall into a warm, tactile feature.",
      points: [
        "Add dimension with a distinctive wall treatment.",
        "Bring warmth and character to the interior.",
        "Make a feature wall stand out from smooth surfaces."
      ]
    },
    {
      title: "A starry sky overhead.",
      description: "Optical fibre lighting transforms a ceiling into a sparkling night-sky feature.",
      points: [
        "Create a dramatic galaxy effect above the room.",
        "Add points of light for a star-like finish.",
        "Set a distinctive mood for evenings and relaxing."
      ]
    }
  ];
  let currentTransformationSlide = 0;
  let transformationTimer;

  const showTransformationSlide = (index) => {
    currentTransformationSlide = (index + transformationSlides.length) % transformationSlides.length;
    transformationTrack.style.transform = `translateX(-${currentTransformationSlide * 100}%)`;
    const content = transformationContent[currentTransformationSlide];
    transformationTitle.textContent = content.title;
    transformationDescription.textContent = content.description;
    transformationPoints.replaceChildren(...content.points.map((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      return item;
    }));
    transformationSlides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== currentTransformationSlide));
    });
  };

  const stopTransformationAutoplay = () => window.clearInterval(transformationTimer);
  const startTransformationAutoplay = () => {
    stopTransformationAutoplay();
    if (prefersReducedMotion.matches || document.hidden) return;
    transformationTimer = window.setInterval(() => {
      showTransformationSlide(currentTransformationSlide + 1);
    }, 5000);
  };

  previousTransformationButton?.addEventListener("click", () => {
    showTransformationSlide(currentTransformationSlide - 1);
    startTransformationAutoplay();
  });
  nextTransformationButton?.addEventListener("click", () => {
    showTransformationSlide(currentTransformationSlide + 1);
    startTransformationAutoplay();
  });
  transformationCarousel.addEventListener("mouseenter", stopTransformationAutoplay);
  transformationCarousel.addEventListener("mouseleave", startTransformationAutoplay);
  transformationCarousel.addEventListener("focusin", stopTransformationAutoplay);
  transformationCarousel.addEventListener("focusout", (event) => {
    if (!transformationCarousel.contains(event.relatedTarget)) startTransformationAutoplay();
  });
  document.addEventListener("visibilitychange", startTransformationAutoplay);
  prefersReducedMotion.addEventListener("change", startTransformationAutoplay);
  showTransformationSlide(currentTransformationSlide);
  startTransformationAutoplay();
}

const aboutContentRotator = document.getElementById("aboutContentRotator");
const aboutHeadlineLead = document.getElementById("aboutHeadlineLead");
const aboutHeadlineHighlight = document.getElementById("aboutHeadlineHighlight");
const aboutParagraphOne = document.getElementById("aboutParagraphOne");
const aboutParagraphTwo = document.getElementById("aboutParagraphTwo");
if (aboutContentRotator && aboutHeadlineLead && aboutHeadlineHighlight && aboutParagraphOne && aboutParagraphTwo && !prefersReducedMotion.matches) {
  const aboutContent = [
    {
      lead: "Every surface has a",
      highlight: "story.",
      paragraphOne: "Merlin Art N Texture Enterprises brings spaces to life through creative painting, refined textures and thoughtful finishing. From a child's colourful classroom to a modern home or industrial property, we help make every space feel its best.",
      paragraphTwo: "We work across residential, commercial and industrial spaces, shaping each finish around the people who use it and the character they want the space to have."
    },
    {
      lead: "Colour transforms",
      highlight: "spaces.",
      paragraphOne: "The right colours can make a room feel brighter, calmer or full of energy. We help bring your ideas to life with carefully chosen colours and quality painting.",
      paragraphTwo: "From welcoming homes and playful classrooms to polished workplaces, each project is shaped around the people who use the space."
    },
    {
      lead: "Make your walls",
      highlight: "memorable.",
      paragraphOne: "Explore creative wall art, refined textures and distinctive finishes designed to give your space its own character.",
      paragraphTwo: "We bring care and attention to every project, helping turn your vision into a finish that feels right for your home, school, office or commercial property."
    }
  ];
  let currentAboutContent = 0;

  window.setInterval(() => {
    currentAboutContent = (currentAboutContent + 1) % aboutContent.length;
    aboutContentRotator.classList.add("is-changing");
    window.setTimeout(() => {
      const content = aboutContent[currentAboutContent];
      aboutHeadlineLead.textContent = content.lead;
      aboutHeadlineHighlight.textContent = content.highlight;
      aboutParagraphOne.textContent = content.paragraphOne;
      aboutParagraphTwo.textContent = content.paragraphTwo;
      aboutContentRotator.classList.remove("is-changing");
    }, 180);
  }, 5000);
}

const whyCarouselViewport = document.getElementById("whyCarouselViewport");
const whyCarouselTrack = document.getElementById("whyCarouselTrack");
const whyCarousel = whyCarouselViewport?.closest(".why-carousel");

if (whyCarouselViewport && whyCarouselTrack && whyCarousel) {
  const whyCards = [...whyCarouselTrack.querySelectorAll(".why-card")];
  whyCards.slice(0, 3).forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");
    whyCarouselTrack.append(clone);
  });
  let currentWhySlide = 0;
  let autoplayTimer;

  const visibleWhyCards = () => {
    if (!whyCards.length) return 0;
    const gap = parseFloat(getComputedStyle(whyCarouselTrack).columnGap) || 0;
    return Math.max(1, Math.floor((whyCarouselViewport.clientWidth + gap) / (whyCards[0].offsetWidth + gap)));
  };

  const updateWhyCarousel = () => {
    const trackLeft = whyCarouselTrack.getBoundingClientRect().left;
    const slideLeft = whyCarouselTrack.children[currentWhySlide].getBoundingClientRect().left;
    whyCarouselTrack.style.transform = `translateX(-${slideLeft - trackLeft}px)`;
    whyCards.forEach((card, index) => {
      const isVisible = Array.from({ length: visibleWhyCards() }, (_, offset) => (currentWhySlide + offset) % whyCards.length)
        .includes(index);
      card.setAttribute("aria-hidden", String(!isVisible));
    });
  };

  whyCarouselTrack.addEventListener("transitionend", (event) => {
    if (event.target !== whyCarouselTrack || event.propertyName !== "transform" || currentWhySlide < whyCards.length) return;
    currentWhySlide -= whyCards.length;
    whyCarouselTrack.style.transition = "none";
    updateWhyCarousel();
    whyCarouselTrack.offsetWidth;
    whyCarouselTrack.style.removeProperty("transition");
  });

  const stopWhyAutoplay = () => window.clearInterval(autoplayTimer);
  const startWhyAutoplay = () => {
    stopWhyAutoplay();
    if (prefersReducedMotion.matches || document.hidden) return;
    autoplayTimer = window.setInterval(() => {
      currentWhySlide += 1;
      updateWhyCarousel();
    }, 2200);
  };

  document.addEventListener("visibilitychange", startWhyAutoplay);
  prefersReducedMotion.addEventListener("change", startWhyAutoplay);
  const resetWhyCarouselOnResize = () => {
    currentWhySlide %= whyCards.length;
    updateWhyCarousel();
  };
  window.addEventListener("resize", resetWhyCarouselOnResize);
  new ResizeObserver(resetWhyCarouselOnResize).observe(whyCarouselViewport);
  updateWhyCarousel();
  startWhyAutoplay();
}

const projectProcessViewport = document.getElementById("projectProcessViewport");
const projectProcessTrack = document.getElementById("projectProcessTrack");
if (projectProcessViewport && projectProcessTrack) {
  const projectProcessCards = [...projectProcessTrack.querySelectorAll(".project-process-card")];
  projectProcessCards.slice(0, 3).forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");
    projectProcessTrack.append(clone);
  });
  let currentProcessSlide = 0;
  let processAutoplayTimer;

  const visibleProcessCards = () => {
    if (!projectProcessCards.length) return 0;
    const gap = parseFloat(getComputedStyle(projectProcessTrack).columnGap) || 0;
    return Math.max(1, Math.floor((projectProcessViewport.clientWidth + gap) / (projectProcessCards[0].offsetWidth + gap)));
  };

  const updateProcessCarousel = () => {
    const trackLeft = projectProcessTrack.getBoundingClientRect().left;
    const slideLeft = projectProcessTrack.children[currentProcessSlide].getBoundingClientRect().left;
    projectProcessTrack.style.transform = `translateX(-${slideLeft - trackLeft}px)`;
    projectProcessCards.forEach((card, index) => {
      const isVisible = Array.from({ length: visibleProcessCards() }, (_, offset) => (currentProcessSlide + offset) % projectProcessCards.length)
        .includes(index);
      card.setAttribute("aria-hidden", String(!isVisible));
    });
  };

  projectProcessTrack.addEventListener("transitionend", (event) => {
    if (event.target !== projectProcessTrack || event.propertyName !== "transform" || currentProcessSlide < projectProcessCards.length) return;
    currentProcessSlide -= projectProcessCards.length;
    projectProcessTrack.style.transition = "none";
    updateProcessCarousel();
    projectProcessTrack.offsetWidth;
    projectProcessTrack.style.removeProperty("transition");
  });

  const stopProcessAutoplay = () => window.clearInterval(processAutoplayTimer);
  const startProcessAutoplay = () => {
    stopProcessAutoplay();
    if (prefersReducedMotion.matches || document.hidden) return;
    processAutoplayTimer = window.setInterval(() => {
      currentProcessSlide += 1;
      updateProcessCarousel();
    }, 3000);
  };

  projectProcessViewport.addEventListener("mouseenter", stopProcessAutoplay);
  projectProcessViewport.addEventListener("mouseleave", startProcessAutoplay);
  projectProcessViewport.addEventListener("focusin", stopProcessAutoplay);
  projectProcessViewport.addEventListener("focusout", (event) => {
    if (!projectProcessViewport.contains(event.relatedTarget)) startProcessAutoplay();
  });
  document.addEventListener("visibilitychange", startProcessAutoplay);
  prefersReducedMotion.addEventListener("change", startProcessAutoplay);
  const resetProcessCarouselOnResize = () => {
    currentProcessSlide %= projectProcessCards.length;
    updateProcessCarousel();
  };
  window.addEventListener("resize", resetProcessCarouselOnResize);
  new ResizeObserver(resetProcessCarouselOnResize).observe(projectProcessViewport);
  updateProcessCarousel();
  startProcessAutoplay();
}

if (heroSlides.length === 2 && heroServiceName && heroHeadlineLead && heroHeadlineHighlight && !prefersReducedMotion.matches) {
  const services = [
    {
      name: "RESIDENTIAL PAINTING",
      headlineLead: "Bring your home to life with",
      headlineHighlight: "beautiful colour.",
      image: "images/residential.jpeg"
    },
    {
      name: "CREATIVE ARTIST PAINTING",
      headlineLead: "Give your ideas a place to shine",
      headlineHighlight: "with custom art.",
      image: "images/creative-painting.jpeg"
    },
    {
      name: "PLAY SCHOOL CARTOON PAINTING",
      headlineLead: "Make learning spaces",
      headlineHighlight: "playful and bright.",
      image: "images/play-school.jpeg"
    },
    {
      name: "COMMERCIAL PAINTING",
      headlineLead: "Make your workplace",
      headlineHighlight: "welcoming and polished.",
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&q=80"
    },
    {
      name: "INDUSTRIAL PAINTING",
      headlineLead: "Refresh and protect",
      headlineHighlight: "industrial spaces.",
      image: "images/industrial-paint.jpeg"
    },
    {
      name: "INTERIOR TEXTURE PAINTING",
      headlineLead: "Add depth and character with",
      headlineHighlight: "rich textures.",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=80"
    },
    {
      name: "GALAXY CEILING LIGHTING",
      headlineLead: "Bring the night sky indoors with",
      headlineHighlight: "galaxy lighting.",
      image: "images/optic-fiber.jpeg"
    }
  ];
  let currentService = 0;
  let activeSlide = 0;

  window.setInterval(() => {
    currentService = (currentService + 1) % services.length;
    const nextSlide = 1 - activeSlide;
    const nextImage = heroSlides[nextSlide];
    const service = services[currentService];

    nextImage.onload = () => {
      nextImage.classList.add("is-active");
      heroSlides[activeSlide].classList.remove("is-active");
      activeSlide = nextSlide;
      heroServiceName.textContent = service.name;
      heroHeadlineLead.textContent = service.headlineLead;
      heroHeadlineHighlight.textContent = service.headlineHighlight;
    };
    nextImage.onerror = () => {
      console.error(`Unable to load hero image for ${service.name}: ${service.image}`);
    };
    nextImage.src = service.image;
  }, 5000);
}

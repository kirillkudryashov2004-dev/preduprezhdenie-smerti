const body = document.body;
const root = document.documentElement;
const hero = document.querySelector(".hero");
const topbar = document.querySelector(".topbar");
const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

body.classList.add("is-loading");

const heroRevealElements = Array.from(
  document.querySelectorAll(".hero .eyebrow, .hero h1, .hero-copy, .hero-actions, .hero-facts li")
);

const registerReveal = (elements, direction = "up", step = 0) =>
  Array.from(elements).map((element, index) => {
    element.classList.add("reveal");

    if (direction !== "up") {
      element.dataset.reveal = direction;
    }

    if (step > 0) {
      const delay = (index % 4) * step;
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    }

    return element;
  });

heroRevealElements.forEach((element, index) => {
  element.classList.add("reveal", "is-visible");
  element.style.setProperty("--reveal-delay", `${240 + index * 110}ms`);
});

const revealTargets = [
  ...registerReveal(document.querySelectorAll("main .section"), "up", 0),
  ...registerReveal(document.querySelectorAll(".section-heading"), "left", 0),
  ...registerReveal(document.querySelectorAll(".card"), "up", 90),
  ...registerReveal(document.querySelectorAll(".gallery-item"), "zoom", 100),
  ...registerReveal(document.querySelectorAll(".footer"), "up", 0),
];

const sectionLinks = navLinks
  .map((link) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return null;
    }

    return { link, target };
  })
  .filter(Boolean);

const revealAll = () => {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
};

const initializeReveals = () => {
  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -12% 0px",
    }
  );

  revealTargets.forEach((element) => observer.observe(element));
};

const updateScrollState = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

  root.style.setProperty("--scroll-progress", `${Math.max(progress, 0)}%`);

  if (topbar) {
    topbar.classList.toggle("is-condensed", window.scrollY > 36);
  }

  let activeId = "";

  sectionLinks.forEach(({ target }) => {
    if (window.scrollY + window.innerHeight * 0.34 >= target.offsetTop) {
      activeId = target.id;
    }
  });

  navLinks.forEach((link) => {
    const hash = link.getAttribute("href");
    link.classList.toggle("is-active", activeId !== "" && hash === `#${activeId}`);
  });
};

let scrollTicking = false;

const requestScrollState = () => {
  if (scrollTicking) {
    return;
  }

  scrollTicking = true;

  window.requestAnimationFrame(() => {
    updateScrollState();
    scrollTicking = false;
  });
};

const resetHeroShift = () => {
  if (!hero) {
    return;
  }

  hero.style.setProperty("--hero-shift-x", "0px");
  hero.style.setProperty("--hero-shift-y", "0px");
};

if (hero && !prefersReducedMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    hero.style.setProperty("--hero-shift-x", `${offsetX * 26}px`);
    hero.style.setProperty("--hero-shift-y", `${offsetY * 20}px`);
  });

  hero.addEventListener("pointerleave", resetHeroShift);
}

const lightbox = document.getElementById("gallery-lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox-image");
const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
let lastTrigger = null;

const openLightbox = (item) => {
  if (!lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }

  const image = item.querySelector("img");
  const caption = item.querySelector("figcaption");

  if (!image) {
    return;
  }

  lastTrigger = item;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || "";
  lightboxCaption.textContent = caption?.textContent?.trim() || image.alt || "";
  lightbox.hidden = false;
  body.classList.add("lightbox-open");

  window.requestAnimationFrame(() => {
    lightbox.classList.add("is-open");
  });
};

const closeLightbox = () => {
  if (!lightbox || lightbox.hidden) {
    return;
  }

  lightbox.classList.remove("is-open");
  body.classList.remove("lightbox-open");

  window.setTimeout(() => {
    lightbox.hidden = true;
    if (lightboxImage) {
      lightboxImage.src = "";
    }

    if (lastTrigger instanceof HTMLElement) {
      lastTrigger.focus({ preventScroll: true });
    }
  }, 240);
};

galleryItems.forEach((item) => {
  item.tabIndex = 0;
  item.setAttribute("role", "button");

  const caption = item.querySelector("figcaption")?.textContent?.trim();
  item.setAttribute("aria-label", caption ? `Open image: ${caption}` : "Open image");

  item.addEventListener("click", () => openLightbox(item));
  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openLightbox(item);
  });
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightboxClose?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

const showPage = () => {
  window.setTimeout(() => {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    requestScrollState();
  }, 140);
};

if (document.readyState === "complete") {
  showPage();
} else {
  window.addEventListener("load", showPage, { once: true });
}

initializeReveals();
updateScrollState();
window.addEventListener("scroll", requestScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);

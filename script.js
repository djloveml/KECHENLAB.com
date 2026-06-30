const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
const navLabels = isEnglish
  ? { open: "Open navigation", close: "Close navigation" }
  : { open: "打开导航", close: "关闭导航" };

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? navLabels.close : navLabels.open);
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", navLabels.open);
  }
});

const motionSafe = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(
  ".product-card, .application-grid article, .spec-table-wrap, .client-card, .download-card, .timeline article, .contact-copy, .contact-form"
);

if (motionSafe && "IntersectionObserver" in window) {
  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 8, 5) * 55}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

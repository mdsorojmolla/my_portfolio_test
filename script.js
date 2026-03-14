/* ---------- Helpers ---------- */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

/* ---------- Footer year ---------- */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Mobile menu ---------- */
const hamburger = $("#hamburger");
const mobileMenu = $("#mobileMenu");
const mobileClose = $("#mobileClose");
const menuBackdrop = $("#menuBackdrop");

function setBodyMenuState(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
}

function openMenu() {
  if (!hamburger || !mobileMenu || !menuBackdrop) return;

  mobileMenu.classList.add("open");
  menuBackdrop.classList.add("show");
  hamburger.setAttribute("aria-expanded", "true");
  mobileMenu.setAttribute("aria-hidden", "false");
  hamburger.classList.add("is-open");
  setBodyMenuState(true);

  const firstLink = $(".mobile-link", mobileMenu);
  firstLink?.focus();
}

function closeMenu({ restoreFocus = true } = {}) {
  if (!hamburger || !mobileMenu || !menuBackdrop) return;

  mobileMenu.classList.remove("open");
  menuBackdrop.classList.remove("show");
  hamburger.setAttribute("aria-expanded", "false");
  mobileMenu.setAttribute("aria-hidden", "true");
  hamburger.classList.remove("is-open");
  setBodyMenuState(false);

  if (restoreFocus) hamburger.focus();
}

hamburger?.addEventListener("click", () => {
  const isOpen = mobileMenu?.classList.contains("open");
  isOpen ? closeMenu() : openMenu();
});

mobileClose?.addEventListener("click", () => closeMenu());
menuBackdrop?.addEventListener("click", () => closeMenu({ restoreFocus: false }));

$$(".mobile-link").forEach((link) => {
  link.addEventListener("click", () => closeMenu({ restoreFocus: false }));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mobileMenu?.classList.contains("open")) closeMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900 && mobileMenu?.classList.contains("open")) {
    closeMenu({ restoreFocus: false });
  }
});

/* ---------- Reveal on scroll ---------- */
const revealItems = $$(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });
revealItems.forEach((el) => revealObserver.observe(el));

/* ---------- Skill bars ---------- */
const bars = $$(".bar");
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const bar = entry.target;
    const val = Number(bar.dataset.progress || 0);
    bar.style.width = `${val}%`;
    barObserver.unobserve(bar);
  });
}, { threshold: 0.35 });
bars.forEach((bar) => barObserver.observe(bar));

/* ---------- Active nav highlight ---------- */
const sections = $$("main section[id]");
const navLinks = $$(".nav-link");
const mobileLinks = $$(".mobile-link");

function setActiveLink(id) {
  navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
  mobileLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
}

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (visible) setActiveLink(visible.target.id);
}, { threshold: [0.25, 0.4, 0.55, 0.7] });
sections.forEach((sec) => sectionObserver.observe(sec));

/* ---------- Projects Modal ---------- */
const modal = $("#projectModal");
const modalBackdrop = $("#modalBackdrop");
const modalClose = $("#modalClose");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalFull = $("#modalFull");
const modalTech = $("#modalTech");
const modalDemo = $("#modalDemo");
const modalGithub = $("#modalGithub");
const modalImage = $("#modalImage");
let lastFocusedEl = null;

function openProjectModal(card) {
  if (!modal || !modalBackdrop) return;

  lastFocusedEl = document.activeElement;
  if (modalTitle) modalTitle.textContent = card.dataset.title || "Project";
  if (modalDesc) modalDesc.textContent = card.dataset.desc || "";
  if (modalFull) modalFull.textContent = card.dataset.full || "";
  if (modalTech) modalTech.textContent = card.dataset.tech || "";
  if (modalDemo) modalDemo.href = card.dataset.demo || "#";
  if (modalGithub) modalGithub.href = card.dataset.github || "#";

  const img = card.dataset.image || "";
  if (modalImage) {
    modalImage.src = img;
    modalImage.alt = `${modalTitle?.textContent || "Project"} preview`;
  }

  modalBackdrop.classList.add("show");
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "true");
  modalClose?.focus();
}

function closeProjectModal() {
  if (!modal || !modalBackdrop) return;

  modalBackdrop.classList.remove("show");
  if (typeof modal.close === "function") modal.close();
  else modal.removeAttribute("open");
  lastFocusedEl?.focus?.();
}

$$(".project-card").forEach((card) => {
  card.addEventListener("click", () => openProjectModal(card));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProjectModal(card);
    }
  });
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open project: ${card.dataset.title || "project"}`);
});

modalClose?.addEventListener("click", closeProjectModal);
modalBackdrop?.addEventListener("click", closeProjectModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.hasAttribute("open")) closeProjectModal();
});

modal?.addEventListener("click", (e) => {
  const rect = modal.getBoundingClientRect();
  const isInDialog =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;
  if (!isInDialog) closeProjectModal();
});

modal?.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeProjectModal();
});

/* ---------- Achievement auto scroll + arrows ---------- */
const marquee = $("#achievementMarquee");
const track = $("#achievementTrack");
const leftBtn = $(".achievement-arrow-left");
const rightBtn = $(".achievement-arrow-right");
let speed = 1.5;
let paused = false;
let rafId = null;

function updateButtons() {
  if (!marquee || !leftBtn) return;
  leftBtn.classList.toggle("is-hidden", marquee.scrollLeft <= 5);
}

function autoScroll() {
  if (!marquee || !track) return;

  if (!paused) {
    marquee.scrollLeft += speed;
    if (marquee.scrollLeft >= track.scrollWidth - marquee.clientWidth - 2) {
      marquee.scrollLeft = 0;
    }
    updateButtons();
  }

  rafId = requestAnimationFrame(autoScroll);
}

if (marquee && track && leftBtn && rightBtn) {
  rightBtn.addEventListener("click", () => {
    paused = true;
    marquee.scrollBy({ left: 320, behavior: "smooth" });
  });

  leftBtn.addEventListener("click", () => {
    paused = true;
    marquee.scrollBy({ left: -320, behavior: "smooth" });
  });

  marquee.addEventListener("mouseenter", () => { paused = true; });
  marquee.addEventListener("mouseleave", () => { paused = false; });
  marquee.addEventListener("touchstart", () => { paused = true; }, { passive: true });
  marquee.addEventListener("touchend", () => { paused = false; }, { passive: true });

  updateButtons();
  autoScroll();
}

/* ---------- Contact form ---------- */
const contactForm = $("#contactForm");
const formNote = $("#formNote");
const submitBtn = contactForm?.querySelector('button[type="submit"]');
const FORM_ENDPOINT = "https://formspree.io/f/mdawnyrb";

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const originalLabel = submitBtn?.innerHTML;
  const formData = new FormData(contactForm);

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Sending...</span>';
  }
  if (formNote) formNote.textContent = "";

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" }
    });

    if (response.ok) {
      if (formNote) formNote.textContent = "✅ Message sent successfully!";
      contactForm.reset();
    } else {
      if (formNote) formNote.textContent = "❌ Failed to send message.";
    }
  } catch (error) {
    if (formNote) formNote.textContent = "⚠️ Network error. Try again.";
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }

    window.setTimeout(() => {
      if (formNote) formNote.textContent = "";
    }, 4000);
  }
});

/* ---------- Scroll To Top Button ---------- */
const scrollTopBtn = $("#scrollTopBtn");
window.addEventListener("scroll", () => {
  if (!scrollTopBtn) return;
  scrollTopBtn.classList.toggle("show", window.scrollY > 300);
});

scrollTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

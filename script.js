"use strict";

document.addEventListener("DOMContentLoaded", () => {

  const menuToggle = document.querySelector("#menu-toggle");
  const navMenu = document.querySelector("#nav-menu");
  const navLinks = document.querySelectorAll(".nav-link, .nav-contact");

  if (menuToggle && navMenu) {

    menuToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("active");

      menuToggle.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      if (
        !navMenu.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        navMenu.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

  }

  const currentYear = document.querySelector("#current-year");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  const viewport = document.querySelector("#project-viewport");
  const track = document.querySelector("#project-track");
  const previousButton = document.querySelector("#project-prev");
  const nextButton = document.querySelector("#project-next");
  const status = document.querySelector("#slider-status");

  if (!viewport || !track || !previousButton || !nextButton || !status) {
    return;
  }

  const cards = Array.from(track.querySelectorAll(".project-card"));

  if (cards.length === 0) {
    previousButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;
  let dragDistance = 0;
  let suppressClick = false;
  let scrollFrame = 0;
  let resizeTimer;

  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setStatus = (index) => {
    currentIndex = index;
    status.textContent = `Project ${index + 1} of ${cards.length}`;
  };

  const prepareTrack = () => {
    const styles = window.getComputedStyle(track);
    const leftPadding = Number.parseFloat(styles.paddingLeft) || 0;
    const cardWidth = cards[0].getBoundingClientRect().width;

    const rightPadding = Math.max(
      leftPadding,
      viewport.clientWidth - cardWidth - leftPadding
    );

    track.style.paddingRight = `${rightPadding}px`;
  };

  const getCardTarget = (card) => {
    const cardRect = card.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();

    return viewport.scrollLeft + cardRect.left - viewportRect.left;
  };

  const updateStatusFromScroll = () => {
    const viewportRect = viewport.getBoundingClientRect();
    const trackStyles = window.getComputedStyle(track);

    const leftPadding =
      Number.parseFloat(trackStyles.paddingLeft) || 0;

    const alignmentPoint = viewportRect.left + leftPadding;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardLeft = card.getBoundingClientRect().left;
      const distance = Math.abs(cardLeft - alignmentPoint);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setStatus(nearestIndex);
  };

  const goToProject = (index) => {
    const targetIndex =
      (index + cards.length) % cards.length;

    setStatus(targetIndex);

    viewport.scrollTo({
      left: getCardTarget(cards[targetIndex]),
      behavior: reducedMotion() ? "auto" : "smooth"
    });
  };

  previousButton.addEventListener("click", () => {
    goToProject(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    goToProject(currentIndex + 1);
  });

  viewport.addEventListener("keydown", (event) => {

    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    switch (event.key) {

      case "ArrowRight":
        event.preventDefault();
        goToProject(currentIndex + 1);
        break;

      case "ArrowLeft":
        event.preventDefault();
        goToProject(currentIndex - 1);
        break;

      case "Home":
        event.preventDefault();
        goToProject(0);
        break;

      case "End":
        event.preventDefault();
        goToProject(cards.length - 1);
        break;

    }

  });

  viewport.addEventListener("pointerdown", (event) => {

    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    isDragging = true;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    dragDistance = 0;
    suppressClick = false;

    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);

  });

  viewport.addEventListener("pointermove", (event) => {

    if (!isDragging || event.pointerType !== "mouse") {
      return;
    }

    const distance = event.clientX - startX;

    dragDistance = Math.max(
      dragDistance,
      Math.abs(distance)
    );

    if (dragDistance > 5) {
      suppressClick = true;
    }

    viewport.scrollLeft = startScroll - distance;

  });

  const stopDragging = () => {

    if (!isDragging) {
      return;
    }

    isDragging = false;
    viewport.classList.remove("is-dragging");

    updateStatusFromScroll();

    if (dragDistance > 5) {

      window.setTimeout(() => {
        suppressClick = false;
      }, 0);

    }

  };

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);
  viewport.addEventListener("lostpointercapture", stopDragging);

  viewport.addEventListener("click", (event) => {

    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }

  }, true);

  viewport.addEventListener("scroll", () => {

    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame);
    }

    scrollFrame = window.requestAnimationFrame(() => {
      updateStatusFromScroll();
      scrollFrame = 0;
    });

  }, { passive: true });

  window.addEventListener("resize", () => {

    window.clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {

      prepareTrack();

      viewport.scrollTo({
        left: getCardTarget(cards[currentIndex]),
        behavior: "auto"
      });

      updateStatusFromScroll();

    }, 120);

  });

  prepareTrack();
  updateStatusFromScroll();

});
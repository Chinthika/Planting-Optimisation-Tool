import { describe, expect, it, beforeEach, vi } from "vitest";
import { initNav, initStickyHeader } from "../src/home";

describe("Home Page Logic", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("initNav", () => {
    it("should set the 'home' link to active when on the index page", () => {
      // Pretend on the homepage
      Object.defineProperty(window, "location", {
        value: { pathname: "/index.html" },
        writable: true,
      });

      // Create the fake HTML for the navbar
      document.body.innerHTML = `
        <nav class="nav">
          <a href="/index.html" class="nav-link" data-page="home">Home</a>
          <a href="/species.html" class="nav-link" data-page="species">Species</a>
        </nav>
      `;

      initNav();

      // Check if the class was added
      const homeLink = document.querySelector('[data-page="home"]');
      expect(homeLink?.classList.contains("active")).toBe(true);
    });

    it("should remove active class from home if we are on the species page", () => {
      // Pretend on the species page
      Object.defineProperty(window, "location", {
        value: { pathname: "/species.html" },
        writable: true,
      });

      // Create HTML where Home is already active
      document.body.innerHTML = `
        <nav class="nav">
          <a href="/index.html" class="nav-link active" data-page="home">Home</a>
          <a href="/species.html" class="nav-link" data-page="species">Species</a>
        </nav>
      `;

      initNav();

      const homeLink = document.querySelector('[data-page="home"]');
      const speciesLink = document.querySelector('[data-page="species"]');

      // Home should NOT be active
      expect(homeLink?.classList.contains("active")).toBe(false);

      // Species SHOULD be active
      expect(speciesLink?.classList.contains("active")).toBe(true);
    });

    it("should set the 'profile' link to active when on the profile page", () => {
      // Simulate navigating to profile page
      Object.defineProperty(window, "location", {
        value: { pathname: "/profile.html" },
        writable: true,
      });

      // Create navbar with profile link
      document.body.innerHTML = `
        <nav class="nav">
          <a class="nav-link" data-page="home">Home</a>
          <a class="nav-link" data-page="profile">Profile</a>
        </nav>
      `;

      initNav();

      const profileLink = document.querySelector('[data-page="profile"]');

      // Profile should be active
      expect(profileLink?.classList.contains("active")).toBe(true);

      //Home should NOT be active
      expect(
        document
          .querySelector('[data-page="home"]')
          ?.classList.contains("active")
      ).toBe(false);
    });

    it("should set the 'calculator' link to active when on the calculator page", () => {
      // Simulate navigating to calculator page
      Object.defineProperty(window, "location", {
        value: { pathname: "/calculator.html" },
        writable: true,
      });

      // Create navbar with calculator link
      document.body.innerHTML = `
        <nav class="nav">
          <a class="nav-link" data-page="home">Home</a>
          <a class="nav-link" data-page="calculator">Calculator</a>
        </nav>
      `;

      initNav();

      const calcLink = document.querySelector('[data-page="calculator"]');

      // Calculator should be active
      expect(calcLink?.classList.contains("active")).toBe(true);

      // Home should NOT be active
      expect(
        document
          .querySelector('[data-page="home"]')
          ?.classList.contains("active")
      ).toBe(false);
    });

    it("should activate only the matching link and deactivate all others", () => {
      // Simulate navigating to profile page
      Object.defineProperty(window, "location", {
        value: { pathname: "/profile.html" },
        writable: true,
      });

      // Create navbar where multiple links are incorrectly active
      document.body.innerHTML = `
        <nav class="nav">
          <a class="nav-link active" data-page="home">Home</a>
          <a class="nav-link active" data-page="profile">Profile</a>
          <a class="nav-link active" data-page="species">Species</a>
        </nav>
      `;

      initNav();

      const home = document.querySelector('[data-page="home"]');
      const profile = document.querySelector('[data-page="profile"]');
      const species = document.querySelector('[data-page="species"]');

      // Only profile should remain active
      expect(profile?.classList.contains("active")).toBe(true);
      expect(home?.classList.contains("active")).toBe(false);
      expect(species?.classList.contains("active")).toBe(false);
    });
  });

  describe("initStickyHeader", () => {
    it("should add 'is-scrolled' class when scrolling down", () => {
      // Create the header element
      document.body.innerHTML = `<header class="topbar">Header</header>`;
      const header = document.querySelector(".topbar");

      initStickyHeader();

      // Pretend to scroll down 100 pixels
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));

      expect(header?.classList.contains("is-scrolled")).toBe(true);
    });

    it("should remove 'is-scrolled' class when scrolling back to top", () => {
      // Create header that is already scrolled
      document.body.innerHTML = `<header class="topbar is-scrolled">Header</header>`;
      const header = document.querySelector(".topbar");

      initStickyHeader();

      // Pretend to scroll back to top
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });
      window.dispatchEvent(new Event("scroll"));

      expect(header?.classList.contains("is-scrolled")).toBe(false);
    });

    it("should apply correct class on init based on scroll position", () => {
      // Create header element
      document.body.innerHTML = `<header class="topbar"></header>`;
      const header = document.querySelector(".topbar");

      // Simulate page already scrolled before init
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });

      initStickyHeader();

      // Header should immediately reflect scrolled state
      expect(header?.classList.contains("is-scrolled")).toBe(true);
    });

    it("should not fail if header is not present", () => {
      // No header in DOM
      document.body.innerHTML = ``;

      // Function should exit gracefully without throwing
      expect(() => initStickyHeader()).not.toThrow();
    });
  });
});

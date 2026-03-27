// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Hook to test
import { useStickyHeader } from "@/hooks/useStickyHeader";

describe("useStickyHeader Hook", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    // Reset scroll to top before each test
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  // -----------------------------
  // ADD CLASS WHEN SCROLLED
  // Also checks isScrolled return value
  // -----------------------------
  it("adds 'is-scrolled' class and returns isScrolled true when scrolling down", () => {
    // Create header element
    document.body.innerHTML = `<header class="topbar"></header>`;
    const header = document.querySelector(".topbar");

    const { result } = renderHook(() => useStickyHeader());

    // Simulate scroll
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    // Check DOM class
    expect(header?.classList.contains("is-scrolled")).toBe(true);
    // Check hook return value
    expect(result.current.isScrolled).toBe(true);
  });

  // -----------------------------
  // REMOVE CLASS WHEN AT TOP
  // Also checks isScrolled return value
  // -----------------------------
  it("removes 'is-scrolled' class and returns isScrolled false when back at top", () => {
    document.body.innerHTML = `<header class="topbar is-scrolled"></header>`;
    const header = document.querySelector(".topbar");

    const { result } = renderHook(() => useStickyHeader());

    // Scroll down first
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    // Scroll back to top
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    // Check DOM class
    expect(header?.classList.contains("is-scrolled")).toBe(false);
    // Check hook return value
    expect(result.current.isScrolled).toBe(false);
  });

  // -----------------------------
  // INITIAL STATE
  // -----------------------------
  it("returns isScrolled false on initial render when not scrolled", () => {
    document.body.innerHTML = `<header class="topbar"></header>`;

    const { result } = renderHook(() => useStickyHeader());

    expect(result.current.isScrolled).toBe(false);
  });

  // -----------------------------
  // INITIAL STATE WHEN ALREADY SCROLLED
  // -----------------------------
  it("returns isScrolled true immediately on mount if page is already scrolled", () => {
    document.body.innerHTML = `<header class="topbar"></header>`;

    // Simulate page already scrolled before hook mounts
    Object.defineProperty(window, "scrollY", { value: 100, writable: true });

    const { result } = renderHook(() => useStickyHeader());

    expect(result.current.isScrolled).toBe(true);
  });

  // -----------------------------
  // DOES NOT FAIL IF HEADER MISSING
  // -----------------------------
  it("does not throw error if header element is missing", () => {
    expect(() => {
      renderHook(() => useStickyHeader());

      act(() => {
        Object.defineProperty(window, "scrollY", { value: 50, writable: true });
        window.dispatchEvent(new Event("scroll"));
      });
    }).not.toThrow();
  });
});
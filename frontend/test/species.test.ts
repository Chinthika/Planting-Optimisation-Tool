import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { client } from "../src/utils/contentfulClient";

// Mock the Contentful Client without real API calls
vi.mock("../src/utils/contentfulClient", () => ({
  client: {
    getEntries: vi.fn(),
  },
}));

// Mock CSS import to prevent errors
vi.mock("./style.css", () => ({}));

describe("Species Page Logic", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <input id="speciesSearch" type="search" />
        <button id="speciesSearchBtn">Search</button>
        <div id="speciesArticles" class="species-grid"></div>
        <div id="speciesEmpty" hidden>No species match your search.</div>
      </main>
    `;

    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("Initial State", () => {
    it("shows initial guidance message on page load", async () => {
      await import("../src/species");

      const emptyMsg = document.getElementById("speciesEmpty");

      // Verify message is visible on initial load
      expect(emptyMsg?.hidden).toBe(false);

      // Verify correct guidance text is shown
      expect(emptyMsg?.textContent).toContain("Enter keywords");
    });
  });

  describe("Search Behaviour", () => {
    it("shows message when search input is empty", async () => {
      // Load the module (this runs init() and attaches event listeners)
      await import("../src/species");

      // Get input and button elements from the DOM
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      // Simulate user leaving the input empty
      input.value = "";

      // Simulate user clicking the search button
      btn.click();

      // Wait for async logic (handleSearch → fetch → render)
      await new Promise(process.nextTick);

      // Verify that the empty state message is shown
      const emptyMsg = document.getElementById("speciesEmpty");

      expect(emptyMsg?.hidden).toBe(false);
      expect(emptyMsg?.textContent).toContain(
        "Enter a keyword to search for species."
      );
    });

    it("shows empty state when no results are returned", async () => {
      // Mock the API to return an empty list
      (client.getEntries as Mock).mockResolvedValue({ items: [] });

      await import("../src/species");

      // Simulate User Input
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      input.value = "NonExistentTree";
      btn.click();

      await new Promise(process.nextTick);

      // Verify that the empty state message is displayed
      const emptyMsg = document.getElementById("speciesEmpty");
      expect(emptyMsg?.hidden).toBe(false);
      expect(emptyMsg?.textContent).toContain("No species found");

      // Verify that no species cards are rendered when there are no results
      const grid = document.getElementById("speciesArticles");
      expect(grid?.children.length).toBe(0);
    });

    it("shows empty state when API request fails", async () => {
      // Mock API to simulate a failure (e.g. network error)
      (client.getEntries as Mock).mockRejectedValue(new Error("API Error"));

      // Load the module (initializes event listeners)
      await import("../src/species");

      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      // Simulate user entering a query
      input.value = "Test Tree";

      // Simulate search action
      btn.click();

      // Wait for async execution to complete
      await new Promise(process.nextTick);

      const emptyMsg = document.getElementById("speciesEmpty");
      const grid = document.getElementById("speciesArticles");

      // Verify fallback UI behavior
      expect(emptyMsg?.hidden).toBe(false); // message is shown
      expect(grid?.children.length).toBe(0); // no results are rendered
    });

    it("triggers search when Enter key is pressed", async () => {
      // Mock API response with one result
      const mockSpecies = {
        items: [
          {
            fields: {
              name: "Test Tree",
              description: { content: [] },
            },
          },
        ],
      };

      (client.getEntries as Mock).mockResolvedValue(mockSpecies);

      // Load module (sets up keydown listener)
      await import("../src/species");

      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;

      // Simulate user typing a query
      input.value = "Test Tree";

      // Simulate pressing the Enter key
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      input.dispatchEvent(event);

      // Wait for async UI updates
      await new Promise(process.nextTick);

      const grid = document.getElementById("speciesArticles");
      const title = grid?.querySelector(".article-title");

      // Verify that search was triggered and result is rendered
      expect(title?.textContent).toBe("Test Tree");
    });

    it("resets search button text after search completes", async () => {
      (client.getEntries as Mock).mockResolvedValue({ items: [] });

      await import("../src/species");

      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;

      input.value = "Test";
      btn.click();

      await new Promise(process.nextTick);

      // Verify button resets to "Search"
      expect(btn.innerHTML).toContain("Search");
    });
  });

  describe("Rendering", () => {
    it("renders species cards when data is returned", async () => {
      // Mock the API to return one species
      const mockSpecies = {
        items: [
          {
            fields: {
              name: "Eucalyptus alba",
              image: {
                fields: {
                  file: { url: "//images.ctfassets.net/eucalyptus.jpg" },
                },
              },
              description: { content: [] },
            },
          },
        ],
      };
      (client.getEntries as Mock).mockResolvedValue(mockSpecies);

      await import("../src/species");

      // Simulate Search
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      input.value = "Eucalyptus alba";
      btn.click();

      await new Promise(process.nextTick);

      const grid = document.getElementById("speciesArticles");
      const cards = grid?.querySelectorAll(".article-card");
      const title = grid?.querySelector(".article-title");

      expect(client.getEntries).toHaveBeenCalledWith(
        expect.objectContaining({ query: "Eucalyptus alba" })
      );
      expect(cards?.length).toBe(1);
      expect(title?.textContent).toBe("Eucalyptus alba");
    });

    it("renders multiple species correctly", async () => {
      // Mock API response with multiple species results
      const mockSpecies = {
        items: [
          {
            fields: {
              name: "Tree A",
              description: { content: [] },
            },
          },
          {
            fields: {
              name: "Tree B",
              description: { content: [] },
            },
          },
        ],
      };

      // Replace real API call with mocked response
      (client.getEntries as Mock).mockResolvedValue(mockSpecies);

      // Load the module (initializes event listeners and page logic)
      await import("../src/species");

      // Get DOM elements for interaction
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      // Simulate user entering a search query
      input.value = "Test Tree";

      // Simulate clicking the search button
      btn.click();

      // Wait for async operations (API call + render)
      await new Promise(process.nextTick);

      // Select rendered species cards
      const grid = document.getElementById("speciesArticles");
      const cards = grid?.querySelectorAll(".article-card");

      // Verify that multiple results are rendered correctly
      expect(cards?.length).toBe(2);
    });
  });

  describe("Modal Behaviour", () => {
    it("opens modal when View Details is clicked", async () => {
      (client.getEntries as Mock).mockResolvedValue({
        items: [
          {
            fields: {
              name: "Falcataria falcata",
              description: { content: [] },
            },
          },
        ],
      });

      await import("../src/species");

      // Trigger Search & Render
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;
      (document.getElementById("speciesSearch") as HTMLInputElement).value =
        "Falcataria falcata";
      btn.click();
      await new Promise(process.nextTick);

      // Find the rendered "View Details" button and click it
      const viewBtn = document.querySelector(
        ".view-details-btn"
      ) as HTMLButtonElement;
      viewBtn.click();

      // Check if modal was added and made active
      const modal = document.getElementById("speciesModal");
      expect(modal).not.toBeNull();
      expect(modal?.classList.contains("active")).toBe(true);
      expect(modal?.innerHTML).toContain("Falcataria falcata");
    });

    it("closes modal when close button is clicked", async () => {
      // Mock API with one species
      (client.getEntries as Mock).mockResolvedValue({
        items: [
          {
            fields: {
              name: "Test Tree",
              description: { content: [] },
            },
          },
        ],
      });

      await import("../src/species");

      // Trigger search to render results
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      input.value = "Test Tree";
      btn.click();
      await new Promise(process.nextTick);

      // Open modal
      const viewBtn = document.querySelector(
        ".view-details-btn"
      ) as HTMLButtonElement;
      viewBtn.click();

      const modal = document.getElementById("speciesModal");

      // Ensure modal is open first
      expect(modal?.classList.contains("active")).toBe(true);

      // Find close button (you may need to adjust selector if different)
      const closeBtn = modal?.querySelector(".close-modal-btn") as HTMLElement;

      // Click close
      closeBtn.click();

      // Verify modal is closed
      expect(modal?.classList.contains("active")).toBe(false);
    });

    it("closes modal when clicking outside the modal content", async () => {
      // Mock API with one species
      (client.getEntries as Mock).mockResolvedValue({
        items: [
          {
            fields: {
              name: "Test Tree",
              description: { content: [] },
            },
          },
        ],
      });

      await import("../src/species");

      // Trigger search
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      input.value = "Test Tree";
      btn.click();
      await new Promise(process.nextTick);

      // Open modal
      const viewBtn = document.querySelector(
        ".view-details-btn"
      ) as HTMLButtonElement;
      viewBtn.click();

      const modal = document.getElementById("speciesModal");

      // Ensure modal is open
      expect(modal?.classList.contains("active")).toBe(true);

      // Simulate clicking outside (on overlay/background)
      const overlay = modal?.querySelector(".modal-overlay") as HTMLElement;
      overlay.click();

      // Verify modal is closed
      expect(modal?.classList.contains("active")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("shows fallback message when species description is missing", async () => {
      // Mock API with missing description
      (client.getEntries as Mock).mockResolvedValue({
        items: [
          {
            fields: {
              name: "Test Tree",
              // description is missing
            },
          },
        ],
      });

      // Load module (initializes event listeners and logic)
      await import("../src/species");

      // Trigger search
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      input.value = "Test Tree";
      btn.click();
      await new Promise(process.nextTick);

      // Open modal by clicking "View Details"
      const viewBtn = document.querySelector(
        ".view-details-btn"
      ) as HTMLButtonElement;
      viewBtn.click();

      const modal = document.getElementById("speciesModal");

      // Verify fallback message is shown when description is missing
      expect(modal?.innerHTML).toContain("No details available.");
    });

    it("renders paragraph content correctly", async () => {
      // Mock API response with paragraph-style rich text content
      (client.getEntries as Mock).mockResolvedValue({
        items: [
          {
            fields: {
              name: "Test Tree",
              description: {
                content: [
                  {
                    nodeType: "paragraph",
                    content: [{ value: "This is a paragraph." }],
                  },
                ],
              },
            },
          },
        ],
      });

      // Load module
      await import("../src/species");

      // Trigger search
      const input = document.getElementById(
        "speciesSearch"
      ) as HTMLInputElement;
      const btn = document.getElementById(
        "speciesSearchBtn"
      ) as HTMLButtonElement;

      input.value = "Test Tree";
      btn.click();
      await new Promise(process.nextTick);

      // Open modal
      const viewBtn = document.querySelector(
        ".view-details-btn"
      ) as HTMLButtonElement;
      viewBtn.click();

      const modal = document.getElementById("speciesModal");

      // Verify paragraph is correctly rendered as HTML
      expect(modal?.innerHTML).toContain("<p>This is a paragraph.</p>");
    });
  });
});

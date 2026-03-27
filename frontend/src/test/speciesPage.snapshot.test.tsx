// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SpeciesPage from "../pages/SpeciesPage";
import { client } from "@/utils/contentfulClient";

// Mock API
vi.mock("../utils/contentfulClient", () => ({
  client: {
    getEntries: vi.fn(),
  },
}));

const mockedGetEntries = vi.mocked(client.getEntries);

describe("SpeciesPage Snapshot", () => {
  it("matches snapshot after data loads", async () => {
    mockedGetEntries.mockResolvedValue({
      items: [],
    } as unknown as Awaited<ReturnType<typeof client.getEntries>>);

    const { container, findByText } = render(
      <MemoryRouter>
        <SpeciesPage />
      </MemoryRouter>
    );

    // Wait for UI to stabilize
    await findByText("Species Information");

    expect(container).toMatchSnapshot();
  });
});

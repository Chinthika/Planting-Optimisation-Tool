import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.stubEnv("VITE_SPACE_ID", "test-space-id");
vi.stubEnv("VITE_ACCESS_TOKEN", "test-access-token");

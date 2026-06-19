import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Nettoie le DOM rendu après chaque test (Testing Library).
afterEach(() => {
  cleanup();
});

// Global test setup — jsdom environment polyfills

// localStorage mock via jsdom (already included). Reset between tests.
beforeEach(() => {
  localStorage.clear();
});

// Suppress console.warn/error noise in test output
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

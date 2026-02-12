import "@testing-library/jest-dom";

// Mock Tone.js globally to avoid ES module issues
jest.mock("tone", () => {
  const mockSampler = {
    triggerAttack: jest.fn(),
    triggerRelease: jest.fn(),
    releaseAll: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
  };

  return {
    start: jest.fn().mockResolvedValue(undefined),
    loaded: jest.fn().mockResolvedValue(undefined),
    now: jest.fn().mockReturnValue(0),
    Sampler: jest.fn(() => mockSampler),
  };
});

import { renderHook, waitFor } from "@testing-library/react";
import { useAudioEngine } from "../useAudioEngine";
import { AudioEngine } from "@/lib/audio/AudioEngine";

// Mock AudioEngine
jest.mock("@/lib/audio/AudioEngine");

describe("useAudioEngine", () => {
  let mockEngine: jest.Mocked<AudioEngine>;

  beforeEach(() => {
    mockEngine = {
      init: jest.fn().mockResolvedValue(undefined),
      isReady: jest.fn().mockReturnValue(false),
      isLoading: jest.fn().mockReturnValue(false),
      noteOn: jest.fn(),
      noteOff: jest.fn(),
      allNotesOff: jest.fn(),
      dispose: jest.fn(),
    } as any;
    (AudioEngine as jest.MockedClass<typeof AudioEngine>).mockImplementation(
      () => mockEngine,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with isReady false and isLoading false", () => {
    const { result } = renderHook(() => useAudioEngine());

    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("creates AudioEngine instance", () => {
    renderHook(() => useAudioEngine());

    expect(AudioEngine).toHaveBeenCalled();
  });

  it("initializes audio when initAudio is called", async () => {
    mockEngine.isReady.mockReturnValue(true);
    const { result } = renderHook(() => useAudioEngine());

    await result.current.initAudio();

    expect(mockEngine.init).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });

  it("calls noteOn on engine", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await result.current.initAudio();

    result.current.noteOn("C4", 0.8);

    expect(mockEngine.noteOn).toHaveBeenCalledWith("C4", 0.8);
  });

  it("calls noteOff on engine", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await result.current.initAudio();

    result.current.noteOff("C4");

    expect(mockEngine.noteOff).toHaveBeenCalledWith("C4");
  });

  it("calls allNotesOff on engine", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await result.current.initAudio();

    result.current.allNotesOff();

    expect(mockEngine.allNotesOff).toHaveBeenCalled();
  });

  it("disposes engine on unmount", () => {
    const { unmount } = renderHook(() => useAudioEngine());

    unmount();

    expect(mockEngine.dispose).toHaveBeenCalled();
  });

  it("handles initialization errors gracefully", async () => {
    mockEngine.init.mockRejectedValueOnce(new Error("Audio init failed"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useAudioEngine());
    await result.current.initAudio();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to initialize audio:",
      expect.any(Error),
    );
    expect(result.current.isReady).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});

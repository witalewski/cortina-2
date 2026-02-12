import { renderHook, waitFor, act } from "@testing-library/react";
import { useMidi } from "../useMidi";
import { MidiAccess } from "@/lib/midi/MidiAccess";
import type { MidiDeviceInfo } from "@/lib/midi/types";

// Mock MidiAccess
jest.mock("@/lib/midi/MidiAccess");

describe("useMidi", () => {
  let mockMidi: jest.Mocked<MidiAccess>;

  beforeEach(() => {
    mockMidi = {
      getStatus: jest.fn().mockReturnValue("granted"),
      getInputs: jest.fn().mockReturnValue([]),
      onNoteOn: jest.fn(),
      onNoteOff: jest.fn(),
      onDeviceChange: jest.fn(),
      removeNoteOnCallback: jest.fn(),
      removeNoteOffCallback: jest.fn(),
      removeDeviceChangeCallback: jest.fn(),
      destroy: jest.fn(),
    } as any;
    (MidiAccess.request as jest.Mock).mockResolvedValue(mockMidi);

    // Mock navigator.requestMIDIAccess
    Object.defineProperty(global.navigator, "requestMIDIAccess", {
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("starts with prompt status", () => {
    const { result } = renderHook(() => useMidi());

    expect(result.current.status).toBe("prompt");
  });

  it("requests MIDI access on mount", async () => {
    renderHook(() => useMidi());

    await waitFor(() => {
      expect(MidiAccess.request).toHaveBeenCalled();
    });
  });

  it("updates status to granted after successful access", async () => {
    const { result } = renderHook(() => useMidi());

    await waitFor(() => {
      expect(result.current.status).toBe("granted");
    });
  });

  it("retrieves and sets devices after access", async () => {
    const mockDevices: MidiDeviceInfo[] = [
      {
        id: "1",
        name: "Test Device",
        manufacturer: "Test",
        state: "connected",
      },
    ];
    mockMidi.getInputs.mockReturnValue(mockDevices);

    const { result } = renderHook(() => useMidi());

    await waitFor(() => {
      expect(result.current.devices).toEqual(mockDevices);
    });
  });

  it("sets status to unsupported when Web MIDI API is not available", async () => {
    // @ts-expect-error - testing unsupported browser
    global.navigator.requestMIDIAccess = undefined;

    const { result } = renderHook(() => useMidi());

    await waitFor(() => {
      expect(result.current.status).toBe("unsupported");
    });
  });

  it("sets status to denied when access is rejected", async () => {
    (MidiAccess.request as jest.Mock).mockRejectedValueOnce(
      new Error("Permission denied"),
    );

    const { result } = renderHook(() => useMidi());

    await waitFor(() => {
      expect(result.current.status).toBe("denied");
      expect(result.current.error).toBeTruthy();
    });
  });

  it("registers note-on callback", async () => {
    const onNoteOn = jest.fn();
    renderHook(() => useMidi({ onNoteOn }));

    await waitFor(() => {
      expect(mockMidi.onNoteOn).toHaveBeenCalled();
    });
  });

  it("registers note-off callback", async () => {
    const onNoteOff = jest.fn();
    renderHook(() => useMidi({ onNoteOff }));

    await waitFor(() => {
      expect(mockMidi.onNoteOff).toHaveBeenCalled();
    });
  });

  it("updates lastNote when note-on is triggered", async () => {
    let capturedNoteOnCallback: any;

    mockMidi.onNoteOn.mockImplementation((cb) => {
      capturedNoteOnCallback = cb;
    });

    const { result } = renderHook(() => useMidi());

    await waitFor(() => {
      expect(mockMidi.onNoteOn).toHaveBeenCalled();
    });

    // Simulate note-on event
    act(() => {
      capturedNoteOnCallback(60, 100, 0);
    });

    await waitFor(() => {
      expect(result.current.lastNote).toEqual({ note: 60, velocity: 100 });
    });
  });

  it("calls provided onNoteOn callback when note is played", async () => {
    let capturedNoteOnCallback: any;
    const onNoteOn = jest.fn();

    mockMidi.onNoteOn.mockImplementation((cb) => {
      capturedNoteOnCallback = cb;
    });

    renderHook(() => useMidi({ onNoteOn }));

    await waitFor(() => {
      expect(mockMidi.onNoteOn).toHaveBeenCalled();
    });

    // Simulate note-on event
    act(() => {
      capturedNoteOnCallback(60, 100, 0);
    });

    await waitFor(() => {
      expect(onNoteOn).toHaveBeenCalledWith(60, 100, 0);
    });
  });

  it("destroys MIDI access on unmount", async () => {
    const { unmount } = renderHook(() => useMidi());

    await waitFor(() => {
      expect(MidiAccess.request).toHaveBeenCalled();
    });

    unmount();

    expect(mockMidi.destroy).toHaveBeenCalled();
  });
});

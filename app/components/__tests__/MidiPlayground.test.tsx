import { render, screen, fireEvent } from "@testing-library/react";
import { MidiPlayground } from "../MidiPlayground";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngineContext } from "@/app/providers/AudioEngineProvider";
import { AudioEngineProvider } from "@/app/providers/AudioEngineProvider";

// Mock hooks
jest.mock("@/hooks/useMidi");
jest.mock("@/app/providers/AudioEngineProvider", () => ({
  useAudioEngineContext: jest.fn(),
  AudioEngineProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/music/midi", () => ({
  midiToNoteName: jest.fn((midi: number) => `Note${midi}`),
  velocityToGain: jest.fn((vel: number) => vel / 127),
}));

const mockUseMidi = useMidi as jest.MockedFunction<typeof useMidi>;
const mockUseAudioEngineContext = useAudioEngineContext as jest.MockedFunction<typeof useAudioEngineContext>;

describe("MidiPlayground", () => {
  const mockInitAudio = jest.fn();
  const mockNoteOn = jest.fn();
  const mockNoteOff = jest.fn();
  const mockAllNotesOff = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAudioEngineContext.mockReturnValue({
      isReady: false,
      isLoading: false,
      initAudio: mockInitAudio,
      noteOn: mockNoteOn,
      noteOff: mockNoteOff,
      allNotesOff: mockAllNotesOff,
    });

    mockUseMidi.mockReturnValue({
      status: "prompt",
      devices: [],
      lastNote: null,
      error: null,
    });
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<AudioEngineProvider>{component}</AudioEngineProvider>);
  };

  describe("Initial State - Audio Not Ready", () => {
    it("renders header with status badges", () => {
      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText("Cortina")).toBeInTheDocument();
      expect(screen.getByText("Audio locked")).toBeInTheDocument();
      expect(
        screen.getByText("Studio for Real-Time MIDI Practice"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Open Play Mode/i }),
      ).toBeInTheDocument();
    });

    it("shows Enable Audio card", () => {
      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText("Enable the Audio Engine")).toBeInTheDocument();
      expect(
        screen.getByText(/Audio playback requires a user gesture/),
      ).toBeInTheDocument();
    });

    it("calls initAudio when Enable Audio button is clicked", async () => {
      renderWithProvider(<MidiPlayground />);

      const button = screen.getByRole("button", { name: /Enable Audio/i });
      fireEvent.click(button);

      expect(mockInitAudio).toHaveBeenCalled();
    });

    it("shows loading state while samples are loading", () => {
      mockUseAudioEngineContext.mockReturnValue({
        isReady: false,
        isLoading: true,
        initAudio: mockInitAudio,
        noteOn: mockNoteOn,
        noteOff: mockNoteOff,
        allNotesOff: mockAllNotesOff,
      });

      renderWithProvider(<MidiPlayground />);

      const button = screen.getByRole("button", {
        name: /Loading piano samples/i,
      });
      expect(button).toBeDisabled();
    });
  });

  describe("Audio Ready States", () => {
    beforeEach(() => {
      mockUseAudioEngineContext.mockReturnValue({
        isReady: true,
        isLoading: false,
        initAudio: mockInitAudio,
        noteOn: mockNoteOn,
        noteOff: mockNoteOff,
        allNotesOff: mockAllNotesOff,
      });
    });

    it("shows unsupported message when MIDI is not supported", () => {
      mockUseMidi.mockReturnValue({
        status: "unsupported",
        devices: [],
        lastNote: null,
        error: null,
      });

      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText(/MIDI not supported/)).toBeInTheDocument();
      expect(
        screen.getByText(/does not expose the Web MIDI API/),
      ).toBeInTheDocument();
    });

    it("shows denied message when MIDI permission is denied", () => {
      mockUseMidi.mockReturnValue({
        status: "denied",
        devices: [],
        lastNote: null,
        error: "User denied permission",
      });

      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText(/MIDI permission denied/)).toBeInTheDocument();
      expect(screen.getByText(/User denied permission/)).toBeInTheDocument();
    });

    it("shows waiting message when requesting MIDI access", () => {
      mockUseMidi.mockReturnValue({
        status: "prompt",
        devices: [],
        lastNote: null,
        error: null,
      });

      renderWithProvider(<MidiPlayground />);

      expect(
        screen.getByText(/Waiting for MIDI permission/),
      ).toBeInTheDocument();
    });

    it("shows no devices message when MIDI is granted but no devices connected", () => {
      mockUseMidi.mockReturnValue({
        status: "granted",
        devices: [],
        lastNote: null,
        error: null,
      });

      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText(/No MIDI devices detected/)).toBeInTheDocument();
    });

    it("shows connected device information", () => {
      mockUseMidi.mockReturnValue({
        status: "granted",
        devices: [
          {
            id: "1",
            name: "Test Keyboard",
            manufacturer: "TestCo",
            state: "connected",
          },
        ],
        lastNote: null,
        error: null,
      });

      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText(/Test Keyboard/)).toBeInTheDocument();
      expect(screen.getByText(/TestCo/)).toBeInTheDocument();
    });

    it("displays last played note", () => {
      mockUseMidi.mockReturnValue({
        status: "granted",
        devices: [
          {
            id: "1",
            name: "Test Keyboard",
            manufacturer: "TestCo",
            state: "connected",
          },
        ],
        lastNote: { note: 60, velocity: 100 },
        error: null,
      });

      renderWithProvider(<MidiPlayground />);

      expect(screen.getByText("Note60")).toBeInTheDocument();
      expect(screen.getByText(/Velocity 100/)).toBeInTheDocument();
    });
  });

  describe("MIDI to Audio Integration", () => {
    it("wires note-on events to audio engine", () => {
      let capturedCallbacks: any = {};

      mockUseMidi.mockImplementation((props) => {
        capturedCallbacks = props;
        return {
          status: "granted",
          devices: [],
          lastNote: null,
          error: null,
        };
      });

      mockUseAudioEngineContext.mockReturnValue({
        isReady: true,
        isLoading: false,
        initAudio: mockInitAudio,
        noteOn: mockNoteOn,
        noteOff: mockNoteOff,
        allNotesOff: mockAllNotesOff,
      });

      renderWithProvider(<MidiPlayground />);

      // Simulate note-on callback
      capturedCallbacks.onNoteOn?.(60, 100, 0);

      expect(mockNoteOn).toHaveBeenCalled();
    });

    it("wires note-off events to audio engine", () => {
      let capturedCallbacks: any = {};

      mockUseMidi.mockImplementation((props) => {
        capturedCallbacks = props;
        return {
          status: "granted",
          devices: [],
          lastNote: null,
          error: null,
        };
      });

      mockUseAudioEngineContext.mockReturnValue({
        isReady: true,
        isLoading: false,
        initAudio: mockInitAudio,
        noteOn: mockNoteOn,
        noteOff: mockNoteOff,
        allNotesOff: mockAllNotesOff,
      });

      renderWithProvider(<MidiPlayground />);

      // Simulate note-off callback
      capturedCallbacks.onNoteOff?.(60, 0);

      expect(mockNoteOff).toHaveBeenCalled();
    });

    it("does not call audio engine when audio is not ready", () => {
      let capturedCallbacks: any = {};

      mockUseMidi.mockImplementation((props) => {
        capturedCallbacks = props;
        return {
          status: "granted",
          devices: [],
          lastNote: null,
          error: null,
        };
      });

      mockUseAudioEngineContext.mockReturnValue({
        isReady: false, // Audio not ready
        isLoading: false,
        initAudio: mockInitAudio,
        noteOn: mockNoteOn,
        noteOff: mockNoteOff,
        allNotesOff: mockAllNotesOff,
      });

      renderWithProvider(<MidiPlayground />);

      // Simulate note-on callback
      capturedCallbacks.onNoteOn?.(60, 100, 0);

      expect(mockNoteOn).not.toHaveBeenCalled();
    });
  });
});
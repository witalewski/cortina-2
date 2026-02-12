import { render, screen, fireEvent } from "@testing-library/react";
import PlayPage from "../page";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngineContext } from "@/app/providers/AudioEngineProvider";
import { AudioEngineProvider } from "@/app/providers/AudioEngineProvider";

jest.mock("@/hooks/useMidi");
jest.mock("@/app/providers/AudioEngineProvider", () => ({
  useAudioEngineContext: jest.fn(),
  AudioEngineProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseMidi = useMidi as jest.MockedFunction<typeof useMidi>;
const mockUseAudioEngineContext = useAudioEngineContext as jest.MockedFunction<typeof useAudioEngineContext>;

describe("PlayPage", () => {
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

  it("shows enable audio button when audio is locked", () => {
    renderWithProvider(<PlayPage />);

    expect(
      screen.getByRole("button", { name: /Enable Audio/i }),
    ).toBeInTheDocument();
  });

  it("calls initAudio when enable audio is clicked", () => {
    renderWithProvider(<PlayPage />);

    fireEvent.click(screen.getByRole("button", { name: /Enable Audio/i }));
    expect(mockInitAudio).toHaveBeenCalled();
  });

  it("disables the keyboard while audio is locked", () => {
    renderWithProvider(<PlayPage />);

    const keyboard = screen.getByLabelText("Piano keyboard");
    expect(keyboard).toHaveAttribute("aria-disabled", "true");
  });

  it("renders C-note labels for the default range", () => {
    renderWithProvider(<PlayPage />);

    expect(screen.getByText("C3")).toBeInTheDocument();
    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("C5")).toBeInTheDocument();
  });

  it("hides enable audio button when audio is ready", () => {
    mockUseAudioEngineContext.mockReturnValue({
      isReady: true,
      isLoading: false,
      initAudio: mockInitAudio,
      noteOn: mockNoteOn,
      noteOff: mockNoteOff,
      allNotesOff: mockAllNotesOff,
    });

    renderWithProvider(<PlayPage />);

    expect(
      screen.queryByRole("button", { name: /Enable Audio/i }),
    ).not.toBeInTheDocument();
  });
});
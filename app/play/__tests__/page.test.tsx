import { render, screen, fireEvent } from "@testing-library/react";
import PlayPage from "../page";
import { useMidi } from "@/hooks/useMidi";
import { useAudioEngine } from "@/hooks/useAudioEngine";

jest.mock("@/hooks/useMidi");
jest.mock("@/hooks/useAudioEngine");

const mockUseMidi = useMidi as jest.MockedFunction<typeof useMidi>;
const mockUseAudioEngine = useAudioEngine as jest.MockedFunction<
  typeof useAudioEngine
>;

describe("PlayPage", () => {
  const mockInitAudio = jest.fn();
  const mockNoteOn = jest.fn();
  const mockNoteOff = jest.fn();
  const mockAllNotesOff = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAudioEngine.mockReturnValue({
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

  it("shows enable audio button when audio is locked", () => {
    render(<PlayPage />);

    expect(
      screen.getByRole("button", { name: /Enable Audio/i }),
    ).toBeInTheDocument();
  });

  it("calls initAudio when enable audio is clicked", () => {
    render(<PlayPage />);

    fireEvent.click(screen.getByRole("button", { name: /Enable Audio/i }));
    expect(mockInitAudio).toHaveBeenCalled();
  });

  it("disables the keyboard while audio is locked", () => {
    render(<PlayPage />);

    const keyboard = screen.getByLabelText("Piano keyboard");
    expect(keyboard).toHaveAttribute("aria-disabled", "true");
  });

  it("renders C-note labels for the default range", () => {
    render(<PlayPage />);

    expect(screen.getByText("C3")).toBeInTheDocument();
    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("C5")).toBeInTheDocument();
  });

  it("hides enable audio button when audio is ready", () => {
    mockUseAudioEngine.mockReturnValue({
      isReady: true,
      isLoading: false,
      initAudio: mockInitAudio,
      noteOn: mockNoteOn,
      noteOff: mockNoteOff,
      allNotesOff: mockAllNotesOff,
    });

    render(<PlayPage />);

    expect(
      screen.queryByRole("button", { name: /Enable Audio/i }),
    ).not.toBeInTheDocument();
  });
});

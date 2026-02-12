import { render, screen, fireEvent } from "@testing-library/react";
import { PianoKeyboard } from "../PianoKeyboard";

describe("PianoKeyboard", () => {
  it("renders 25 keys by default", () => {
    render(<PianoKeyboard />);
    expect(screen.getAllByRole("button")).toHaveLength(25);
  });

  it("renders no labels by default", () => {
    render(<PianoKeyboard />);
    expect(screen.queryByText("C3")).not.toBeInTheDocument();
  });

  it("renders labels when provided", () => {
    render(
      <PianoKeyboard
        labels={{
          48: "C3",
          60: "C4",
          72: "C5",
        }}
      />,
    );

    expect(screen.getByText("C3")).toBeInTheDocument();
    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("C5")).toBeInTheDocument();
  });

  it("marks active and highlighted keys", () => {
    render(
      <PianoKeyboard
        activeNotes={[60]}
        highlightedNotes={[62, 49]}
        labels={{ 60: "C4", 62: "D4" }}
      />,
    );

    const activeKey = screen.getByLabelText("C4");
    const highlightedKey = screen.getByLabelText("D4");
    const highlightedBlackKey = screen.getByLabelText("C#3");

    expect(activeKey).toHaveAttribute("data-active", "true");
    expect(highlightedKey).toHaveAttribute("data-highlighted", "true");
    expect(highlightedBlackKey).toHaveAttribute("data-highlighted", "true");
  });

  it("fires pointer callbacks when enabled", () => {
    const onKeyDown = jest.fn();
    const onKeyUp = jest.fn();

    render(<PianoKeyboard onKeyDown={onKeyDown} onKeyUp={onKeyUp} />);

    const key = screen.getByLabelText("C4");
    fireEvent.pointerDown(key);
    fireEvent.pointerUp(key);

    expect(onKeyDown).toHaveBeenCalledWith(60);
    expect(onKeyUp).toHaveBeenCalledWith(60);
  });

  it("ignores pointer callbacks when disabled", () => {
    const onKeyDown = jest.fn();

    render(<PianoKeyboard disabled onKeyDown={onKeyDown} />);

    const key = screen.getByLabelText("C4");
    fireEvent.pointerDown(key);

    expect(onKeyDown).not.toHaveBeenCalled();
  });
});

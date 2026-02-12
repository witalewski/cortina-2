import { render, screen } from "@testing-library/react";

import { Button } from "../button";

describe("Button", () => {
  it("renders a button", () => {
    render(<Button>Play</Button>);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
});

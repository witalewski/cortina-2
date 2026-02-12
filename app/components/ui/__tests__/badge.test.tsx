import { render, screen } from "@testing-library/react";

import { Badge } from "../badge";

describe("Badge", () => {
  it("renders badge text", () => {
    render(<Badge>Ready</Badge>);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});

import { render } from "@testing-library/react";

import { Separator } from "../separator";

describe("Separator", () => {
  it("renders a separator", () => {
    const { container } = render(<Separator />);
    expect(container.querySelector("[data-orientation]")).toBeInTheDocument();
  });
});

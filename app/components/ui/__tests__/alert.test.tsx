import { render, screen } from "@testing-library/react";

import { Alert, AlertDescription, AlertTitle } from "../alert";

describe("Alert", () => {
  it("renders title and description", () => {
    render(
      <Alert>
        <AlertTitle>Status</AlertTitle>
        <AlertDescription>Detail</AlertDescription>
      </Alert>,
    );

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Detail")).toBeInTheDocument();
  });
});

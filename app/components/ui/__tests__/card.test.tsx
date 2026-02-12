import { render, screen } from "@testing-library/react";

import { Card, CardContent, CardHeader, CardTitle } from "../card";

describe("Card", () => {
  it("renders card sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    );

    expect(screen.getByText("Session")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

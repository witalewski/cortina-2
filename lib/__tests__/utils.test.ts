import { cn } from "../utils";

describe("cn", () => {
  it("merges class names and resolves conflicts", () => {
    expect(cn("p-2", "p-4", "text-sm", null, undefined)).toBe("p-4 text-sm");
  });
});

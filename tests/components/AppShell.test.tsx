import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { AppShell } from "../../src/components/AppShell";

describe("AppShell", () => {
  it("renders crisis affordance on every wrapped screen", () => {
    const { getByText } = render(
      <AppShell>
        <Text>Test content</Text>
      </AppShell>
    );
    expect(getByText(/need help right now/i)).toBeTruthy();
  });

  it("renders children content", () => {
    const { getByText } = render(
      <AppShell>
        <Text>Child content here</Text>
      </AppShell>
    );
    expect(getByText("Child content here")).toBeTruthy();
  });

  it("crisis button has accessible label", () => {
    const { getByRole } = render(
      <AppShell>
        <Text>Test</Text>
      </AppShell>
    );
    const trigger = getByRole("button", { name: /need help right now/i });
    expect(trigger).toBeTruthy();
  });
});

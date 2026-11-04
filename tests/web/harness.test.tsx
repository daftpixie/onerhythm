// Does this project actually render through react-native-web into a real DOM?
//
// Every other test in tests/web/ is only meaningful if the answer stays yes. If
// the preset, the moduleNameMapper or the babel caller silently changed, those
// tests would keep passing while quietly checking the wrong renderer — the exact
// class of failure this project exists to remove. So assert the harness itself.

import { Platform, Text, View } from "react-native";
import { mount } from "./mount";

describe("web test harness", () => {
  it("inlines Platform.OS as web", () => {
    // Proves babel caller.platform = "web" reached the transform. Every
    // Platform.select in src/ branches on this.
    expect(Platform.OS).toBe("web");
  });

  it("maps react-native to react-native-web and produces real DOM nodes", () => {
    const { container, getByText } = mount(
      <View>
        <Text>hello</Text>
      </View>,
    );

    // react-test-renderer would give us a JSON tree with no ownerDocument.
    const node = getByText("hello");
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.ownerDocument).toBe(document);
    expect(container.querySelector("div")).not.toBeNull();
  });

  it("attaches the container to the document so focus() works", () => {
    // jsdom silently refuses to focus a node outside the document. If that ever
    // regressed, every focus assertion in this project would pass vacuously.
    const { getByRole } = mount(
      <View accessibilityRole="button" focusable>
        <Text>focus me</Text>
      </View>,
    );

    const button = getByRole("button");
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});

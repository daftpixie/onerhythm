import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../src/lib/supabase", () => ({ supabase: {} }));

jest.mock("../../src/lib/auth", () => ({
  useAuth: () => ({
    session: { user: { id: "u1" } },
    user: { id: "u1" },
    loading: false,
    signOut: jest.fn(),
  }),
}));

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockSetPublished = jest.fn();
const mockGet = jest.fn();
jest.mock("../../src/lib/social", () => ({
  createJourneyEntry: (...args: unknown[]) => mockCreate(...args),
  updateJourneyEntry: (...args: unknown[]) => mockUpdate(...args),
  setJourneyPublished: (...args: unknown[]) => mockSetPublished(...args),
  getJourneyEntry: (...args: unknown[]) => mockGet(...args),
}));

import JourneyEditorScreen from "../../app/journey/editor";

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({ id: "j-new" });
  mockUpdate.mockResolvedValue(undefined);
  mockSetPublished.mockResolvedValue(undefined);
  mockGet.mockResolvedValue(null);
});

describe("journey editor (new entry)", () => {
  it("has labeled Title and Your story fields — labels above, never placeholder-as-label", () => {
    const { getByLabelText, getByText } = render(<JourneyEditorScreen />);
    expect(getByText("Title")).toBeTruthy();
    expect(getByText("Your story")).toBeTruthy();
    expect(getByLabelText("Title")).toBeTruthy();
    expect(getByLabelText("Your story")).toBeTruthy();
  });

  it("Save draft creates the entry without publishing", async () => {
    const { getByLabelText, getByRole } = render(<JourneyEditorScreen />);
    fireEvent.changeText(getByLabelText("Title"), "The first year");
    fireEvent.changeText(
      getByLabelText("Your story"),
      "It took a while to trust my heart again.",
    );
    fireEvent.press(getByRole("button", { name: /save draft/i }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(expect.anything(), {
        title: "The first year",
        body: "It took a while to trust my heart again.",
      }),
    );
    expect(mockSetPublished).not.toHaveBeenCalled();
  });

  it("Publish creates the entry and then publishes it", async () => {
    const { getByLabelText, getByRole } = render(<JourneyEditorScreen />);
    fireEvent.changeText(getByLabelText("Title"), "The first year");
    fireEvent.changeText(getByLabelText("Your story"), "A long story.");
    fireEvent.press(getByRole("button", { name: /^publish$/i }));

    await waitFor(() =>
      expect(mockSetPublished).toHaveBeenCalledWith(
        expect.anything(),
        "j-new",
        true,
      ),
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("offers NO media/upload control of any kind (plain text this slice)", () => {
    const { getAllByRole } = render(<JourneyEditorScreen />);
    for (const button of getAllByRole("button")) {
      const name: string = button.props.accessibilityLabel ?? "";
      expect(name).not.toMatch(/upload|attach|photo|file|camera|image|media/i);
    }
  });

  it("primary actions meet the 44px target", () => {
    const { getByRole } = render(<JourneyEditorScreen />);
    const publish = getByRole("button", { name: /^publish$/i });
    const style = Array.isArray(publish.props.style)
      ? Object.assign({}, ...(publish.props.style as object[]).filter(Boolean))
      : publish.props.style || {};
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });
});

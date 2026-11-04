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

// the singleton reads env at import time; the screen only passes it through
jest.mock("../../src/lib/supabase", () => ({ supabase: {} }));

jest.mock("../../src/lib/auth", () => ({
  useAuth: () => ({
    session: { user: { id: "u1" } },
    user: { id: "u1" },
    loading: false,
    signOut: jest.fn(),
  }),
}));

const mockListCommunities = jest.fn();
const mockCreatePost = jest.fn();
jest.mock("../../src/lib/social", () => ({
  listCommunities: (...args: unknown[]) => mockListCommunities(...args),
  createPost: (...args: unknown[]) => mockCreatePost(...args),
}));

import ComposeScreen from "../../app/compose";

const communities = [
  {
    id: "c-afib",
    slug: "afib",
    name: "AFib",
    description: "For people living with atrial fibrillation.",
    is_caregiver: false,
  },
  {
    id: "c-svt",
    slug: "svt",
    name: "SVT",
    description: "For people living with supraventricular tachycardia.",
    is_caregiver: false,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockListCommunities.mockResolvedValue(communities);
  mockCreatePost.mockResolvedValue({ id: "p-new" });
});

describe("post composer screen", () => {
  it("renders community choice, title, and message fields with labels", async () => {
    const { getByRole, getByLabelText } = render(<ComposeScreen />);
    await waitFor(() =>
      expect(getByRole("radio", { name: "AFib" })).toBeTruthy(),
    );
    expect(getByRole("radio", { name: "SVT" })).toBeTruthy();
    expect(getByLabelText("Title")).toBeTruthy();
    expect(getByLabelText("Your message")).toBeTruthy();
  });

  it("shows the medical-records reminder copy", async () => {
    const { getByText, getByRole } = render(<ComposeScreen />);
    await waitFor(() =>
      expect(getByRole("radio", { name: "AFib" })).toBeTruthy(),
    );
    expect(
      getByText(
        "Please don't share medical records or ECG images. This is peer support.",
      ),
    ).toBeTruthy();
  });

  it("offers NO upload control of any kind", async () => {
    const { getAllByRole, getByRole, queryByLabelText } = render(
      <ComposeScreen />,
    );
    await waitFor(() =>
      expect(getByRole("radio", { name: "AFib" })).toBeTruthy(),
    );
    for (const button of getAllByRole("button")) {
      const name: string =
        button.props.accessibilityLabel ??
        button.props.accessibilityHint ??
        "";
      expect(name).not.toMatch(/upload|attach|photo|file|camera|image/i);
    }
    expect(queryByLabelText(/upload|attach|photo|file|camera/i)).toBeNull();
  });

  it("posts to the CHOSEN community with the typed title and body", async () => {
    const { getByRole, getByLabelText } = render(<ComposeScreen />);
    await waitFor(() =>
      expect(getByRole("radio", { name: "SVT" })).toBeTruthy(),
    );

    fireEvent.press(getByRole("radio", { name: "SVT" }));
    fireEvent.changeText(getByLabelText("Title"), "Racing heart at rest");
    fireEvent.changeText(
      getByLabelText("Your message"),
      "Does anyone else get episodes while lying down?",
    );
    fireEvent.press(getByRole("button", { name: /^post$/i }));

    await waitFor(() =>
      expect(mockCreatePost).toHaveBeenCalledWith(expect.anything(), {
        communityId: "c-svt",
        title: "Racing heart at rest",
        body: "Does anyone else get episodes while lying down?",
      }),
    );
  });

  it("the Post button meets the 44px primary target", async () => {
    const { getByRole } = render(<ComposeScreen />);
    await waitFor(() =>
      expect(getByRole("radio", { name: "AFib" })).toBeTruthy(),
    );
    const post = getByRole("button", { name: /^post$/i });
    const style = Array.isArray(post.props.style)
      ? Object.assign({}, ...(post.props.style as object[]).filter(Boolean))
      : post.props.style || {};
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });
});

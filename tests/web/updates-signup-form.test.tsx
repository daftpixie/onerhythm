// The updates signup form, in a real DOM.
//
// This is where the two known-vacuous live-region assertions lived (ADR 0013).
// The native versions asked "is there a node with role=status?" and "is its
// live region polite?" — both true from the first tick, because the region is
// deliberately mounted EMPTY so its later text reads as a change rather than an
// arrival. Neither could fail. The question worth asking is whether the region
// CONTENT actually became the success message, and that is answerable here.

import { act } from "react";
import { mount } from "./mount";

const mockSubscribe = jest.fn();
jest.mock("../../src/lib/updates/subscribe", () => ({
  subscribeToUpdates: (...args: unknown[]) => mockSubscribe(...args),
  looksLikeEmail: jest.requireActual("../../src/lib/updates/subscribe")
    .looksLikeEmail,
}));

import { UpdatesSignupForm } from "../../src/components/UpdatesSignupForm";

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockResolvedValue({ ok: true });
});

function type(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit(getByRole: ReturnType<typeof mount>["getByRole"]) {
  await act(async () => {
    getByRole("button", { name: "Keep me posted" }).dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
  });
}

describe("the success announcement", () => {
  it("mounts the status region EMPTY, so its text is a change not an arrival", () => {
    const { container } = mount(<UpdatesSignupForm />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    // The vacuity fix: assert emptiness at mount. The old test only asserted
    // that the node existed, which was true here and would also be true of a
    // region that had already announced.
    expect(status).toHaveTextContent("");
  });

  it("fills that same region with the success message after a real submit", async () => {
    const view = mount(<UpdatesSignupForm />);
    const status = view.container.querySelector('[role="status"]')!;
    expect(status).toHaveTextContent("");

    type(view.getByLabelText("Your email address") as HTMLInputElement, "a@b.co");
    await submit(view.getByRole);

    expect(mockSubscribe).toHaveBeenCalledWith("a@b.co");
    // The SAME node must now hold the message — a different node appearing
    // would be the unreliable pattern the component comments warn about.
    expect(view.container.querySelector('[role="status"]')).toBe(status);
    expect(status).toHaveTextContent(/we've saved your address/i);
  });

  it("keeps the promise honest: says no email has been sent", async () => {
    const view = mount(<UpdatesSignupForm />);
    type(view.getByLabelText("Your email address") as HTMLInputElement, "a@b.co");
    await submit(view.getByRole);

    const status = view.container.querySelector('[role="status"]')!;
    expect(status).toHaveTextContent(/no email has gone out/i);
  });

  it("announces politely, never assertively", () => {
    const { container } = mount(<UpdatesSignupForm />);
    // Kept, but it is only meaningful next to the content assertions above.
    expect(container.querySelector('[role="status"]')).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});

describe("validation", () => {
  it("rejects a malformed address without calling the backend", async () => {
    const view = mount(<UpdatesSignupForm />);
    type(view.getByLabelText("Your email address") as HTMLInputElement, "nope");
    await submit(view.getByRole);

    expect(mockSubscribe).not.toHaveBeenCalled();
    const alert = view.container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert).toHaveTextContent(/doesn't look like an email address/i);
  });

  it("wires the error to the field with aria-invalid and aria-describedby", async () => {
    const view = mount(<UpdatesSignupForm />);
    const input = view.getByLabelText("Your email address") as HTMLInputElement;
    type(input, "nope");
    await submit(view.getByRole);

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "updates-email-error");
    // The reference must resolve, or it announces nothing.
    expect(document.getElementById("updates-email-error")).toHaveTextContent(
      /doesn't look like an email address/i,
    );
  });

  it("hides the ! glyph from assistive tech but keeps it visible", async () => {
    const view = mount(<UpdatesSignupForm />);
    type(view.getByLabelText("Your email address") as HTMLInputElement, "nope");
    await submit(view.getByRole);

    const icon = Array.from(view.container.querySelectorAll("div")).find(
      (d) => d.textContent === "!",
    );
    expect(icon).toBeDefined();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    // ...and no native-only spelling leaked onto the DOM instead.
    expect(icon).not.toHaveAttribute("importantForAccessibility");
  });

  it("clears aria-invalid once a good address is submitted", async () => {
    const view = mount(<UpdatesSignupForm />);
    const input = view.getByLabelText("Your email address") as HTMLInputElement;
    type(input, "nope");
    await submit(view.getByRole);
    expect(input).toHaveAttribute("aria-invalid", "true");

    type(input, "a@b.co");
    await submit(view.getByRole);
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
  });
});

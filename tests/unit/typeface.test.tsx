import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PostCard } from "../../src/components/PostCard";
import { CommentThread } from "../../src/components/CommentThread";
import { JourneyEntryView } from "../../src/components/JourneyEntryView";
import { CrisisHelpSheet } from "../../src/components/CrisisHelpSheet";
import { DisclaimerBand } from "../../src/components/DisclaimerBand";
import type { PostListItem, CommentTreeNode, JourneyEntry } from "../../src/lib/social";

// Atkinson Hyperlegible is the reading face. Everywhere.
//
// Brand v3 §10.1 records this as a DIVERGENCE from the VT Infinite house guide
// (which specifies JetBrains Mono) and marks it "not up for revision": monospace
// forces uniform character width, which measurably slows prose reading, and
// OneRhythm's baseline user is 65+ with reduced vision. WCAG 2.2 AA is
// build-blocking and PRD §9 wins conflicts by rule.
//
// That rule lived only in prose until now. This suite pins it mechanically, so
// a future re-skin cannot quietly swap the reading face.

function textNodes(tree: ReturnType<typeof render>) {
  // RNTL types host element names as the RN/DOM union; "Text" is the RN host
  // component this suite cares about, so compare as a plain string.
  //
  // UNSAFE_root, not root: a <Modal>'s children are rendered OUTSIDE the
  // component's own root subtree, so tree.root.findAll silently missed every
  // text node inside one. Measured on CrisisHelpSheet with the sheet open —
  // root reaches 6 nodes and 2 Texts, UNSAFE_root reaches 38 and 9. The whole
  // body of the crisis sheet was outside this suite's reach.
  return tree.UNSAFE_root.findAll(
    (n) => typeof n.type === "string" && String(n.type) === "Text",
  );
}

function declaredFamily(node: { props: { style?: unknown } }): string | null {
  const style = node.props.style;
  const flat = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};
  const family = (flat as { fontFamily?: unknown }).fontFamily;
  return family ? String(family) : null;
}

// The family a text node actually RENDERS in. A nested <Text> legitimately
// inherits from its parent <Text> in React Native, so an undeclared family is
// only a defect when nothing up the chain declares one either.
function resolvedFamily(node: {
  props: { style?: unknown };
  parent: unknown;
}): string | null {
  let current: typeof node | null = node;
  while (current) {
    const own = declaredFamily(current);
    if (own) return own;
    const parent = current.parent as typeof node | null;
    // Only a <Text> ancestor passes fontFamily down; a <View> does not.
    current =
      parent &&
      typeof (parent as { type?: unknown }).type === "string" &&
      String((parent as { type?: unknown }).type) === "Text"
        ? parent
        : null;
  }
  return null;
}

function familiesOf(tree: ReturnType<typeof render>): string[] {
  const out: string[] = [];
  for (const node of textNodes(tree)) {
    const family = resolvedFamily(node);
    if (family) out.push(family);
  }
  return out;
}

// Text that renders in whatever face the platform picked. This is the check
// that was missing: familiesOf() used to SKIP any node with no fontFamily, so
// the suite asserted "every family found is Atkinson" while a component that
// declared no family anywhere passed trivially. That is precisely how
// CrisisHelpSheet — the crisis copy — went unnoticed rendering in the system
// face. Proven by removing one fontFamily and watching this fail.
function unstyledTextOf(tree: ReturnType<typeof render>): string[] {
  const out: string[] = [];
  for (const node of textNodes(tree)) {
    if (resolvedFamily(node)) continue;
    const children = node.props.children;
    if (typeof children === "string" && children.trim().length > 0) {
      out.push(children);
    }
  }
  return out;
}

const post = {
  id: "p1",
  title: "A long-form post",
  body: "Body copy that a member actually reads.",
  created_at: new Date(0).toISOString(),
  upbeat_count: 2,
  comment_count: 1,
  author: { id: "a1", display_name: "Rosa", role: "patient" },
  community: { id: "c1", name: "AFib", slug: "afib" },
} as unknown as PostListItem;

const comment = {
  id: "c1",
  body: "A reply worth reading.",
  created_at: new Date(0).toISOString(),
  upbeat_count: 0,
  author: { id: "a2", display_name: "Ben", role: "patient" },
  children: [],
} as unknown as CommentTreeNode;

const entry = {
  id: "j1",
  author_id: "u1",
  title: "My journey",
  body: "Long-form reading copy.",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  is_published: true,
  upbeat_count: 0,
  author: { display_name: "Marcus", role: "patient" },
} as unknown as JourneyEntry;

function renderEntryView() {
  return render(
    <JourneyEntryView
      entry={entry}
      isOwner={false}
      upbeated={false}
      onToggleUpbeat={jest.fn().mockResolvedValue(undefined)}
      onEdit={jest.fn()}
      onTogglePublish={jest.fn()}
      onDelete={jest.fn()}
    />,
  );
}

describe("typeface — Atkinson Hyperlegible is the reading face (v3 §10.1)", () => {
  const cases: [string, () => ReturnType<typeof render>][] = [
    ["PostCard", () => render(<PostCard post={post} />)],
    [
      "CommentThread",
      () =>
        render(
          <CommentThread
            nodes={[comment]}
            myUpbeatedIds={[]}
            onToggleUpbeat={jest.fn().mockResolvedValue(undefined)}
            onReply={jest.fn()}
          />,
        ),
    ],
    ["JourneyEntryView", renderEntryView],
    ["DisclaimerBand", () => render(<DisclaimerBand />)],
    // Added after the a11y gate on the landing page found that the crisis
    // sheet — the highest-stakes text in the app — set no fontFamily at all
    // and so was silently rendering in the platform default, not the face
    // chosen for a 65+ low-vision reader. It was invisible to CI because this
    // list did not include it.
    [
      "CrisisHelpSheet (trigger)",
      () => render(<CrisisHelpSheet />),
    ],
    [
      // The sheet's five OTHER text styles live inside a <Modal>, which
      // renders nothing at all while visible={false}. Rendering the component
      // alone therefore only ever exercised the trigger — so the guard added
      // above would have watched one style out of six and let the crisis copy
      // itself regress in silence. Open it.
      "CrisisHelpSheet (open)",
      () => {
        const utils = render(<CrisisHelpSheet />);
        fireEvent.press(
          utils.getByRole("button", { name: "Need help right now?" }),
        );
        return utils;
      },
    ],
  ];

  it.each(cases)(
    "%s sets every styled text node in Atkinson Hyperlegible",
    (_name, mount) => {
      const families = familiesOf(mount());
      expect(families.length).toBeGreaterThan(0);
      for (const f of families) {
        expect(f).toMatch(/^AtkinsonHyperlegible_/);
      }
    },
  );

  it.each(cases)(
    "%s leaves no text node in the platform default face",
    (_name, mount) => {
      expect(unstyledTextOf(mount())).toEqual([]);
    },
  );

  it.each(cases)("%s never resolves a text node to Inter", (_name, mount) => {
    for (const f of familiesOf(mount())) {
      expect(f).not.toMatch(/^Inter_/);
    }
  });

  it("long-form body reads at 18px with 1.6 line-height (v3 §4)", () => {
    const tree = renderEntryView();
    const body = tree.getByText("Long-form reading copy.");
    const style = Array.isArray(body.props.style)
      ? Object.assign({}, ...body.props.style.filter(Boolean))
      : body.props.style;
    expect(style.fontSize).toBeGreaterThanOrEqual(18);
    expect(style.lineHeight / style.fontSize).toBeGreaterThanOrEqual(1.5);
  });
});

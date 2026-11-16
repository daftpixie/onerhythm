import { type ComponentRef, useEffect, useId, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { addMutedWord, listMutedWords, removeMutedWord } from "../../lib/moderation/mutedWords";
import { useAnnounce } from "../StatusRegion";
import { focusNode } from "./panel";
import { mod } from "./styles";

// Settings → "Words I don't want to see" (plan §4.8; Q6: device only).
//
// Posts with these words collapse behind a named button; they are never
// hidden silently. The words stay on this device, and the screen says so
// plainly. Status messages never echo the word, because the words can reveal
// health (plan §11, review round 3).
export function MutedWordsSettings({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const announce = useAnnounce();
  const id = useId();
  const hintId = `muted-hint-${id}`;
  const [words, setWords] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [emptyAdd, setEmptyAdd] = useState(false);
  const fieldRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    let live = true;
    listMutedWords().then((w) => {
      if (live) setWords(w);
    });
    return () => {
      live = false;
    };
  }, []);

  async function add() {
    if (!draft.trim()) {
      setEmptyAdd(true);
      focusNode(fieldRef.current);
      return;
    }
    setEmptyAdd(false);
    setWords(await addMutedWord(draft));
    setDraft("");
    announce("Word added.");
  }

  async function remove(word: string) {
    setWords(await removeMutedWord(word));
    // The Remove button just went away; focus goes to the field, never to body.
    focusNode(fieldRef.current);
    announce("Word removed.");
  }

  return (
    <View style={mod.block}>
      <Text role="heading" aria-level={headingLevel} style={mod.heading}>
        Words I don&apos;t want to see
      </Text>
      <Text nativeID={hintId} style={mod.body}>
        These words are saved on this device only. If you use a new phone or computer,
        add them again.
      </Text>
      <Text style={mod.hint}>
        In the feed and on a post, a post with one of these words is folded away
        behind a button. You can always open it.
      </Text>
      <Text style={mod.hint}>
        On a shared phone or computer, these words are kept for you only, while you
        are signed in.
      </Text>
      <Text nativeID={`${hintId}-label`} style={mod.body}>
        A word or phrase to hide
      </Text>
      <TextInput
        ref={fieldRef}
        value={draft}
        onChangeText={(t) => setDraft(t.slice(0, 60))}
        maxLength={60}
        aria-labelledby={`${hintId}-label`}
        accessibilityLabelledBy={`${hintId}-label`}
        accessibilityLabel={Platform.OS === "ios" ? "A word or phrase to hide" : undefined}
        aria-describedby={emptyAdd ? `${hintId}-empty ${hintId}` : hintId}
        aria-invalid={emptyAdd ? true : undefined}
        onSubmitEditing={add}
        style={[mod.input, { minHeight: 44 }]}
      />
      {emptyAdd && (
        <Text nativeID={`${hintId}-empty`} style={mod.error}>
          Type a word or phrase first.
        </Text>
      )}
      <Pressable
        onPress={add}
        role="button"
        accessibilityRole="button"
        style={({ focused, pressed }: PressState) => [
          mod.button,
          mod.buttonPrimary,
          pressed && mod.pressed,
          focused && mod.focusRing,
        ]}
      >
        <Text style={[mod.buttonText, mod.buttonTextPrimary]}>Add</Text>
      </Pressable>
      {words.length === 0 ? (
        <Text style={mod.hint}>No words yet.</Text>
      ) : (
        <View role="list" style={mod.block}>
          {words.map((w) => (
            <View role="listitem" key={w} style={mod.row}>
              <Text style={mod.body}>{w}</Text>
              <Pressable
                onPress={() => remove(w)}
                role="button"
                accessibilityRole="button"
                aria-label={`Remove '${w}'`}
                style={({ focused, pressed }: PressState) => [
                  mod.button,
                  pressed && mod.pressed,
                  focused && mod.focusRing,
                ]}
              >
                <Text style={mod.buttonText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

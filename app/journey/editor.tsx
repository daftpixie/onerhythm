import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import {
  createJourneyEntry,
  getJourneyEntry,
  setJourneyPublished,
  updateJourneyEntry,
} from "../../src/lib/social";
import { type PressState } from "../../src/lib/pressable";
import { tokens, focus } from "../../src/theme/tokens";

// Journey entry composer — title + long-form plain text. NO media control of
// any kind (Phase 2M is for community posts; journey pages are outside its
// scope). New entries start as drafts; Publish is an explicit, separate act.
export default function JourneyEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof params.id === "string" ? params.id : null;
  const { session, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(editingId === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/sign-in");
  }, [loading, session, router]);

  useEffect(() => {
    if (!editingId) return;
    let active = true;
    getJourneyEntry(supabase, editingId)
      .then((entry) => {
        if (!active) return;
        if (entry) {
          setTitle(entry.title);
          setBody(entry.body);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (active) {
          setError("We couldn't load this entry. Want to try again?");
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [editingId]);

  const canSave = Boolean(title.trim() && body.trim() && !busy);

  async function save(publish: boolean) {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const input = { title: title.trim(), body: body.trim() };
      let id = editingId;
      if (id) {
        await updateJourneyEntry(supabase, id, input);
      } else {
        id = (await createJourneyEntry(supabase, input)).id;
      }
      if (publish) {
        await setJourneyPublished(supabase, id, true);
        router.replace(`/journey/entry/${id}`);
      } else {
        router.replace("/journey");
      }
    } catch {
      setError("We couldn't save that. Your words are still here — try again?");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !session || !loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading} accessibilityRole="header">
        {editingId ? "Edit your entry" : "Write a journey entry"}
      </Text>
      <Text style={styles.help}>
        {
          "Your story is yours. Save it as a draft for as long as you like — publish only when you're ready."
        }
      </Text>

      <Text style={styles.label} nativeID="journeyTitleLabel">
        Title
      </Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Title"
        aria-labelledby="journeyTitleLabel"
        maxLength={200}
      />

      <Text style={styles.label} nativeID="journeyBodyLabel">
        Your story
      </Text>
      <TextInput
        style={[styles.input, styles.bodyInput]}
        value={body}
        onChangeText={setBody}
        accessibilityLabel="Your story"
        aria-labelledby="journeyBodyLabel"
        multiline
        numberOfLines={14}
        textAlignVertical="top"
      />

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publish"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => save(true)}
          style={({ focused, pressed }: PressState) => [
            styles.primaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
            !canSave && styles.disabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={tokens.paper} />
          ) : (
            <Text style={styles.primaryText}>Publish</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save draft"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => save(false)}
          style={({ focused, pressed }: PressState) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
            !canSave && styles.disabled,
          ]}
        >
          <Text style={styles.secondaryText}>Save draft</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={() => router.back()}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>Cancel</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: {
    padding: 24,
    gap: 8,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  heading: {
    fontSize: 24,
    lineHeight: 36,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginTop: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.inkSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: tokens.ink,
    backgroundColor: tokens.paper,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  bodyInput: { minHeight: 288, fontSize: 18, lineHeight: 29 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: tokens.pulse,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryText: {
    color: tokens.paper,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: tokens.paper,
  },
  secondaryText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  quietButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quietText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});

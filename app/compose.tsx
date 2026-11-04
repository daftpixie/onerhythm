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
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/lib/auth";
import {
  createPost,
  listCommunities,
  type CommunitySummary,
} from "../src/lib/social";
import { type PressState } from "../src/lib/pressable";
import { tokens, focus } from "../src/theme/tokens";

// The post composer (wireframe B "+ Share" / C7). Community, title, message —
// and NOTHING that could carry a medical record: no upload, attach, photo, or
// file control exists here by design (PRD §8 data minimization).
export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ community?: string }>();
  const { session, loading } = useAuth();
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(
    typeof params.community === "string" ? params.community : null,
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/sign-in");
  }, [loading, session, router]);

  useEffect(() => {
    let active = true;
    listCommunities(supabase)
      .then((data) => {
        if (active) setCommunities(data);
      })
      .catch(() => {
        if (active) setError("We couldn't load the communities. Try again?");
      });
    return () => {
      active = false;
    };
  }, []);

  const canPost = Boolean(communityId && title.trim() && body.trim() && !busy);

  async function submit() {
    if (!communityId || !canPost) return;
    setBusy(true);
    setError(null);
    try {
      const { id } = await createPost(supabase, {
        communityId,
        title: title.trim(),
        body: body.trim(),
      });
      router.replace(`/posts/${id}`);
    } catch {
      setError("We couldn't post that. Want to try again?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading} accessibilityRole="header">
        Share something
      </Text>

      <Text style={styles.label} nativeID="communityLabel">
        Post to
      </Text>
      <View
        accessibilityRole="radiogroup"
        aria-labelledby="communityLabel"
        style={styles.group}
      >
        {communities.map((community) => {
          const selected = communityId === community.id;
          return (
            <Pressable
              key={community.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={community.name}
              onPress={() => setCommunityId(community.id)}
              style={({ focused, pressed }: PressState) => [
                styles.radioRow,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={styles.radioLabel}>{community.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label} nativeID="titleLabel">
        Title
      </Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Title"
        aria-labelledby="titleLabel"
        maxLength={200}
      />

      <Text style={styles.label} nativeID="bodyLabel">
        Your message
      </Text>
      <TextInput
        style={[styles.input, styles.bodyInput]}
        value={body}
        onChangeText={setBody}
        accessibilityLabel="Your message"
        aria-labelledby="bodyLabel"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <View style={styles.reminder}>
        <Text style={styles.reminderIcon} accessibilityLabel="Information">
          ℹ
        </Text>
        <Text style={styles.reminderText}>
          {
            "Please don't share medical records or ECG images. This is peer support."
          }
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Post"
        accessibilityState={{ disabled: !canPost }}
        disabled={!canPost}
        onPress={submit}
        style={({ focused, pressed }: PressState) => [
          styles.primaryButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
          !canPost && styles.disabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={tokens.paper} />
        ) : (
          <Text style={styles.primaryButtonText}>Post</Text>
        )}
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
        <Text style={styles.quietButtonText}>Cancel</Text>
      </Pressable>

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
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginTop: 8,
  },
  group: { gap: 2 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.inkSecondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  radioSelected: { borderColor: tokens.ink },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.ink,
  },
  radioLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
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
  bodyInput: { minHeight: 144 },
  reminder: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: tokens.fill,
    borderLeftWidth: 3,
    borderLeftColor: tokens.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  reminderIcon: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
  },
  reminderText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  primaryButton: {
    backgroundColor: tokens.pulse,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: tokens.paper,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  quietButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  quietButtonText: {
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

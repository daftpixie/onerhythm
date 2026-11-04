import { ScrollView, StyleSheet, View } from "react-native";
import { MutedWordsSettings } from "../../src/components/moderation/MutedWordsSettings";

// Settings → Words I don't want to see (plan §4.8; Q6: device only).
export default function MutedWordsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.main}>
        <MutedWordsSettings headingLevel={1} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  main: { maxWidth: 680 },
});

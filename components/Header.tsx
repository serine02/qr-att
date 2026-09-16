<<<<<<< HEAD
import { Image, StyleSheet, Text, View } from "react-native";
=======
import { StyleSheet, Text, View, Image } from "react-native";
>>>>>>> 2731e2d013b50532b4cd0e96e0ba9cb8afb6bb04

import { COLORS } from "@/constants/colors";

type Props = { title: string };

export default function Header({ title }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
<<<<<<< HEAD
          resizeMode="contain"
=======
>>>>>>> 2731e2d013b50532b4cd0e96e0ba9cb8afb6bb04
        />
      </View>

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 24,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },

  logo: {
<<<<<<< HEAD
    width: 60,
    height: 60,
=======
    width: 52,
    height: 52,
    resizeMode: "contain",
>>>>>>> 2731e2d013b50532b4cd0e96e0ba9cb8afb6bb04
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});
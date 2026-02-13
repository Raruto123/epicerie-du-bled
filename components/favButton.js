import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Animated } from "react-native";
import { COLORS } from "../constants/colors";

export default function FavButton({ isFav, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const runPop = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  return (
    <Pressable
      style={styles.favBtn}
      onPress={(e) => {
        e?.stopPropagation?.();
        runPop();
        onPress?.();
      }}
      hitSlop={10}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <MaterialIcons
          name={isFav ? "favorite" : "favorite-border"}
          size={18}
          color={isFav ? COLORS.primary : "#71717a"}
        ></MaterialIcons>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

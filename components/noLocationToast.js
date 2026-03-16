import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function NoLocationToast({
  visible,
  message,
  type = "info", //info|error|success
  bottom = 24,
  duration = 2200,
  onHide,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 16,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onHide?.();
      });
    }, duration);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  const iconName =
    type === "error"
      ? "location-off"
      : type === "success"
        ? "check-circle"
        : "info";

  return (
    <View pointerEvents="none" style={styles.portal}>
      <Animated.View
        style={[styles.toast, { bottom, opacity, transform: [{ translateY }] }]}
      >
        <MaterialIcons name={iconName} size={18} color="white"></MaterialIcons>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  toast: {
    minHeight: 48,
    maxWidth: "88%",
    borderRadius: 14,
    backgroundColor: "rgba(23,19,17,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  message: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
});

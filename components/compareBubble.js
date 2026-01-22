import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Image, Pressable } from "react-native";
import { Text } from "react-native";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";

const BUBBLE_SIZE = 72;
const PADDING = 12;
const TRASH_H = 86;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function CompareBubble({
  product,
  onDropToTrash,
  onPress,
  tabBarHeight = 80,
  topSafe = 0,
}) {
  const { width: W, height: H } = Dimensions.get("window");
  // position initiale: bas-droite (au-dessus des tabs)

  const startX = W - BUBBLE_SIZE - PADDING;
  const startY = H - tabBarHeight - BUBBLE_SIZE - 120;

  const pan = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  // limites (ne va pas sur les tabs)
  const minX = PADDING;
  const maxX = W - BUBBLE_SIZE - PADDING;

  const minY = topSafe + PADDING;
  const maxY = H - tabBarHeight - BUBBLE_SIZE - PADDING;

  // zone poubelle (au-dessus des tabs)
  const trashTop = H - tabBarHeight - TRASH_H - 10;
  const trashBottom = H - tabBarHeight - 10;

  const isInTrash = (x, y) => {
    // la bulle est “dans” si son centre est dans la zone
    const cx = x + BUBBLE_SIZE / 2;
    const cy = y + BUBBLE_SIZE / 2;
    return cy >= trashTop && cy <= trashBottom;
  };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setDragging(true);
          setOverTrash(false);
          pan.setOffset({
            x: pan.x.__getValue(),
            y: pan.y.__getValue(),
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, g) => {
          // position “future”
          const nextX = clamp(g.dx + pan.x._offset, minX, maxX);
          const nextY = clamp(g.dy + pan.y._offset, minY, maxY);

          setOverTrash(isInTrash(nextX, nextY));
          pan.setValue({
            x: nextX - pan.x._offset,
            y: nextY - pan.y._offset,
          });
        },

        onPanResponderRelease: (_, g) => {
          const finalX = clamp(g.dx + pan.x._offset, minX, maxX);
          const finalY = clamp(g.dy + pan.y._offset, minY, maxY);

          pan.flattenOffset();
          setDragging(false);

          if (isInTrash(finalX, finalY)) {
            onDropToTrash?.();
            return;
          }

          // snap clean sur les limites
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
          }).start();
        },
      }),
    [H, W, maxX, maxY, minX, minY, onDropToTrash, pan, tabBarHeight, topSafe],
  );

  if (!product) return null;

  return (
    <>
      {/* {Trash zone} */}
      {dragging && (
        <View
          pointerEvents="none"
          style={[styles.trashWrap, { top: trashTop }]}
        >
          <View style={[styles.trashPill, overTrash && styles.trashPillActive]}>
            <MaterialIcons
              name="delete"
              size={22}
              color={overTrash ? "#ef4444" : "#71717a"}
            ></MaterialIcons>
            <Text
              style={[styles.trashText, overTrash && styles.trashTextActive]}
            >
              Glisse ici pour supprimer
            </Text>
          </View>
        </View>
      )}

      {/* Bubble */}
      <Animated.View
        style={[styles.bubble, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={onPress} style={styles.inner} hitSlop={10}>
          {!!product?.photoURL ? (
            <Image
              source={{ uri: product.photoURL }}
              style={styles.img}
            ></Image>
          ) : (
            <View style={styles.img}></View>
          )}

          {/* Badge comparE */}
          <View style={styles.badge}>
            <MaterialIcons
              name="compare-arrows"
              size={14}
              color="white"
            ></MaterialIcons>
          </View>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: 999,
    zIndex: 999,
  },
  inner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  img: { width: "100%", height: "100%", },

  badge: {
    position: "absolute",
    right: 10,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f97316",
    borderWidth: 2,
    borderColor: "white",
  },

  trashWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRASH_H,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 998,
  },
  trashPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
  },
  trashPillActive: {
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(254,242,242,0.96)",
  },
  trashText: { fontSize: 12, fontWeight: "900", color: "#71717a" },
  trashTextActive: { color: "#ef4444" },
});

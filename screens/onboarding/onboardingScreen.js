import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { setHasSeenOnboarding } from "../../services/onboardingService";
import { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
//Simple logo placeholder : later you can swap this View with your real logo <Image/>

export function LogoMark() {
  return (
    <View
      style={{
        width: 100,
        height: 30,
        borderRadius: 17,
        borderWidth: 1,
        borderBottomWidth: 1,
        backgroundColor: "none",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "red", fontWeight: "800" }}>Future Logo</Text>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const slides = useMemo(
    () => [
      {
        id: "1",
        title: "Trouver des ingrédients africains...",
        text: "...sans faire 3 magasins, sans être sûr du stock, et sans comparer les prix.",
        image: require("../../assets/image1onboarding.png"),
        theme: {
          bg: "#fbfaf9",
          primary: "#d6561f",
          darkText: "#2a2622",
        },
      },
      {
        id: "2",
        title: "Tout au même endroit",
        text: "Découvre les épiceries africaines autour de toi, les produits disponibles, les prix et la distance.",
        image: require("../../assets/image2onboarding.png"),
        theme: {
          bg: "#FBFAF9",
          primary: "#13ec5b",
          darkText: "#2B323D",
        },
      },
      {
        id: "3",
        title: "Acheter ou vendre",
        text: "Acheteurs : trouvez vos produits facilement.\nVendeurs : gagnez en visibilité et gérez vos produits.",
        image: require("../../assets/image3epicerie.png"),
        theme: {
          bg: "#fafaf9",
          primary: "#13ec5b",
          darkText: "#161d18",
        },
      },
    ],
    []
  );

  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const isLast = index === slides.length - 1;
  const current = slides[index] ?? slides[0];
  const { bg, primary, darkText } = current.theme;

  const finish = async () => {
    await setHasSeenOnboarding();
    navigation.replace("Auth");
  };

  //Robust next : update index + scroll by offset (more reliable than scrollToIndex)
  const next = () => {
    if (isLast) return finish();
    console.log("wtf");
    // listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    const nextIndex = Math.min(index + 1, slides.length - 1);
    setIndex(nextIndex);
    listRef.current?.scrollToOffset({
      offset: width * nextIndex,
      animated: true,
    });
  };

  const skip = () => finish();

  const renderSlide = ({ item }) => {
    const singleTheme = item.theme;

    //Shared hero container styles
    const heroOuter =
      item.id === "1"
        ? {
            height: Math.min(height * 0.52, 420),
            width: "100%",
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: "#00000010",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 3,
          }
        : {
            height: Math.min(height * 0.5, 430),
            width: "100%",
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 3,
          };

    return (
      <View style={{ width, paddingHorizontal: 24, paddingTop: 0, flex: 1 }}>
        {/* HERO */}
        <View
          style={{ alignItems: "center", marginTop: item.id === "1" ? 0 : 0 }}
        >
          <View style={heroOuter}>
            <Image
              source={item.image}
              style={{ width: "100%", height: "100%" }}
              resizeMode={item.id === "1" ? "cover" : "cover"}
            ></Image>
            {/* Subtle gradient overlay */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                top: item.id === "1" ? "85%" : "75%",
                backgroundColor: "rgba(119, 17, 17, 0.18)",
              }}
            ></View>
            {/* Slide 2 : floating mini badges + glass price card */}
            {item.id === "2" && (
              <>
                <View
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 40,
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 4,
                    transform: [{ rotate: "12deg" }],
                  }}
                >
                  <Text style={{ color: "#FFCB3D", fontWeight: "900" }}>
                    🛒
                  </Text>
                </View>
                <View
                  style={{
                    position: "absolute",
                    left: "10",
                    bottom: 92,
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 4,
                    transform: [{ rotate: "-6deg" }],
                  }}
                >
                  <Text
                    style={{ color: singleTheme.primary, fontWeight: "900" }}
                  >
                    📍
                  </Text>
                </View>
                <View
                  style={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: 14,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.92)",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: `${singleTheme.primary}33`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: singleTheme.primary,
                            fontWeight: "900",
                          }}
                        >
                          🏪
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            color: "#6b7280",
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          Marché Tropical
                        </Text>
                        <Text
                          style={{
                            color: "#111827",
                            fontSize: 10,
                          }}
                        >
                          1.2 km ⚫️ Ouvert
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "900",
                        fontSize: 12,
                        backgroundColor: singleTheme.primary,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      $4.99
                    </Text>
                  </View>
                  <View
                    style={{
                      width: "100%",
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.22",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: "66%",
                        height: "100%",
                        backgroundColor: singleTheme.primary,
                        borderRadius: 999,
                      }}
                    ></View>
                  </View>
                </View>
              </>
            )}
            {/* Slide 3: bottom availability badge */}
            {item.id === "3" && (
              <View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 16,
                  borderRadius: 18,
                  padding: 12,
                  backgroundColor: "rgba(255,255,255,0.92)",
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${singleTheme.primary}22`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: singleTheme.primary, fontWeight: "900" }}
                  >
                    🏪
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontWeight: "700",
                    }}
                  >
                    Maintenant disponible
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#111827",
                      fontWeight: "900",
                    }}
                  >
                    Épiceries locales
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
        {/* TEXT */}
        <View style={{ paddingTop: 0, gap: 10 }}>
          <Text
            style={{
              fontSize: item.id === "2" ? 30 : 32,
              fontWeight: "900",
              lineHeight: item.id === "2" ? 36 : 38,
              color: singleTheme.darkText,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 23,
              fontWeight: "600",
              color: `${singleTheme.darkText}B3`,
            }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bg }}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle={"dark-content"}></StatusBar>
      {/* Top-right skip pill */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <View
          style={{
            paddingTop: 52,
            paddingHorizontal: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <LogoMark></LogoMark>
          {/* <Text style={{ fontWeight: "900", color: darkText }}>
            Mon Épicerie
          </Text> */}
          {!isLast ? (
            <Pressable
              onPress={skip}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.65",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: `${darkText}B3`,
                }}
              >
                Passer
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "900",
                  color: `${darkText}B3`,
                }}
              >
                →
              </Text>
            </Pressable>
          ) : (
            <View></View>
          )}
        </View>
      </View>

      {/* Slides list*/}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 86, paddingBottom: 170 }}
        getItemLayout={(data, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onScroll={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          if (newIndex !== index) setIndex(newIndex);
        }}
        scrollEventThrottle={16}
        renderItem={renderSlide}
      ></FlatList>
      {/* Bottom controls */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 20 + insets.bottom,
        }}
      >
        {/* Pagination indicators */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {slides.map((_, i) => {
            const active = i === index;
            return (
              <View
                key={i}
                style={{
                  width: active ? 32 : 10,
                  height: active ? 10 : 10,
                  borderRadius: 999,
                  backgroundColor: active ? primary : "rgba(0,0,0,0.12)",
                }}
              ></View>
            );
          })}
        </View>

        {/* Primary action */}
        <Pressable
          onPress={next}
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: primary,
            justifyContent: "center",
            shadowColor: primary,
            shadowOpacity: 0.25,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 4,
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text
              style={{
                color: isLast ? "black" : "white",
                fontWeight: "900",
                fontSize: 16,
              }}
            >
              {isLast ? "Commencer" : "Suivant"}
            </Text>
            <Text
              style={{
                color: isLast ? "black" : "white",
                fontWeight: "900",
                fontSize: 18,
              }}
            >
              →
            </Text>
          </View>
        </Pressable>

        {/* Secondary link only on last slide */}
        {isLast && (
          <Pressable
            onPress={skip}
            style={{ paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ opacity: 0.75, fontWeight: "800", color: darkText }}>
              J'ai déjà un compte
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

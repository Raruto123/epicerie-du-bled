import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { setHasSeenOnboarding } from "../../services/onboardingService";
import { useMemo, useRef, useState } from "react";

const { width } = Dimensions.get("window");

export default function OnboardingScreen({ navigation }) {
  const slides = useMemo(
    () => [
      {
        id: "1",
        title: "Trouver des ingrédients africains...",
        text: "...sans faire 3 magasins, sans être sûr du stock, et sans comparer les prix.",
        image: require("../../assets/image1epicerie.png"),
      },
      {
        id: "2",
        title: "Tout au même endroit",
        text: "Découvre les épiceries africaines autour de toi, les produits disponibles, les prix et la distance.",
        image: require("../../assets/image2epicerie.png"),
      },
      {
        id: "3",
        title: "Acheter ou vendre",
        text: "Acheteurs : trouvez vos produits facilement. \nVendeurs : gagnez en visibilité et gérez vos produits.",
        image: require("../../assets/image3épicerie.png"),
      },
    ],
    []
  );

  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;
  const finish = async () => {
    await setHasSeenOnboarding();
    navigation.replace("Auth"); //on ne revient pas en arrière
  };

  const next = () => {
    if (isLast) return finish();
    console.log("wtf");
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const skip = () => finish();

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header actions */}
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 20,
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Mon Épicerie</Text>
        {!isLast ? (
          <Pressable onPress={skip}>
            <Text style={{ opacity: 0.7 }}>Passer</Text>
          </Pressable>
        ) : (
          <View></View>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(data, i) => ({
          length: width,
          offset: width * 1,
          index: i,
        })}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={{ width, padding: 24, justifyContent: "center" }}>
            {/* Tu peux remplacer par une image plus tard */}
            <View
              style={{
                height: 240,
                borderRadius: 18,
                backgroundColor: "#F3F4F6",
                marginBottom: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* <Text style = {{opacity : 0.5}}>Image / Illustration</Text> */}
              <Image
                style={{ width: "100%", height: "100%" }}
                source={item.image}
                resizeMode="cover"
              ></Image>
            </View>

            <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 22, opacity: 0.8 }}>
              {item.text}
            </Text>
          </View>
        )}
      ></FlatList>

      {/* Dots + CTA */}
      <View style={{ padding: 20 }}>
        {/* Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 16,
            gap: 8,
          }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 18 : 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: i === index ? "#111827" : "#D1D5DB",
              }}
            ></View>
          ))}
        </View>

        {/* Buttons */}
        <Pressable
          onPress={next}
          style={{
            backgroundColor: "#111827",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {isLast ? "Commencer" : "Suivant"}
          </Text>
        </Pressable>

        {isLast && (
          <Pressable
            onPress={skip}
            style={{ paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ opacity: 0.7 }}>J'ai déjà un compte</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// const styles = StyleSheet.create({
//     container : {
//         flex : 1,
//         padding : 24,
//         justifyContent : "center",
//         gap : 16
//     },
//     mainText : {
//         fontSize : 28,
//         fontWeight : 700
//     },
//     subtext : {
//         fontSize : 16
//     }
// })

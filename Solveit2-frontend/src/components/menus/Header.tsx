import { View, Image, useWindowDimensions, Pressable } from "react-native";
import CustomIcons from "@/assets/icons/CustomIcons";
import images from "@/constants/images";
import { useSmartNavigation } from "@/utils/navigation";

export default function Header() {
  const { width } = useWindowDimensions();
  const { navigateTo } = useSmartNavigation();

  if (width >= 771) return null;

  return (
    <View className="w-full flex flex-row px-4 py-3 bg-destaqueAzul justify-between items-center">
      <Image style={{ width: 115, height: 32 }} source={images.logo} />
      <View className="flex flex-row gap-[15px]">
        <Pressable onPress={() => navigateTo("/help")}>
          <CustomIcons name="help" size={26} color="#fff" />
        </Pressable>
        <Pressable onPress={() => navigateTo("/information")}>
          <CustomIcons name="settings" size={26} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
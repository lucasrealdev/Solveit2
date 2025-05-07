// Menu.tsx
import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import CustomIcons from "@/assets/icons/CustomIcons";
import images from "@/constants/images";
import type IconNames from "@/constants/icons-names";
import Button from "../Button";
import { useToast } from "../ToastProvider";

interface MenuProps {
  home?: number;
  friends?: number;
}

// Cores padrão
const COLORS = {
  primary: "#01B198",
  grey: "#3692C5",
};

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj['; // truncado

export default function Menu({ home, friends }: MenuProps) {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [isVisible, setIsVisible] = useState(true);

  const isMobile = width < 771;
  const isTablet = height <= 720;
  const containerWidth = width >= 1400 ? 312 : 280;

  const isCurrentRoute = (route: string) => pathname === route;

  const navigateTo = (route: string) =>
    router[isCurrentRoute(route) ? "replace" : "push"](route);

  const handleLogout = () => {
    showToast({
      title: "Sucesso",
      message: "Você saiu da conta com sucesso!",
      duration: 5000,
      type: "info",
      position: "top",
    });
    router.replace("/signin");
  };

  const MenuButton = ({ route, label, iconName, count }: {
    route: string;
    label: string;
    iconName: IconNames;
    count?: number;
  }) => {
    const active = isCurrentRoute(route);
    const color = active ? COLORS.primary : COLORS.grey;

    return (
      <Pressable className="flex w-full flex-row items-center justify-between px-[12px] py-[10px]" onPress={() => navigateTo(route)}>
        <View className="flex flex-row items-center gap-[8px]">
          <CustomIcons name={iconName} size={26} color={color} />
          <Text className="text-white text-base font-bold">{label}</Text>
        </View>
        {count !== undefined && (
          <View className="bg-white px-[10px] py-[3px] rounded-full">
            <Text className="text-[#0172B1] text-sm font-semibold" style={{ lineHeight: 14 }}>{count}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const MobileMenuButton = ({ route, iconName, count }: {
    route: string;
    iconName: IconNames;
    count?: number;
  }) => {
    const active = isCurrentRoute(route);
    const color = active ? COLORS.primary : COLORS.grey;

    return (
      <Pressable className="items-center justify-center" onPress={() => navigateTo(route)}>
        <View className="relative">
          {count !== undefined && (
            <View className="absolute bg-white w-[16px] h-[16px] rounded-full items-center justify-center top-[-5px] right-[-10px] z-10">
              <Text className="text-primaryStandardDark text-[10px] leading-3 font-semibold">{count}</Text>
            </View>
          )}
          {iconName === "profile" ? (
            <ExpoImage source={images.person} style={{ width: 26, height: 26, borderRadius: 9999 }} contentFit="cover" placeholder={{ blurhash: BLURHASH }} cachePolicy="memory-disk" />
          ) : (
            <CustomIcons name={iconName} size={26} color={color} />
          )}
        </View>
      </Pressable>
    );
  };

  const PremiumCard = () => isVisible && (
    <View className={`gap-4 p-4 bg-secondaryStandardDark rounded-2xl w-full ${isTablet ? "hidden" : ""}`}>
      <View className="flex-row justify-between">
        <View className="w-10 h-10 bg-secondaryStandard rounded-full items-center justify-center">
          <CustomIcons name="danger" size={20} color="#FFF" />
        </View>
        <Pressable onPress={() => setIsVisible(false)}>
          <CustomIcons name="close" size={14} color="#FFF" />
        </Pressable>
      </View>
      <Text className="text-white text-sm">Aproveite os benefícios premiuns do app, exclusivos para você!</Text>
      <View className="flex-row gap-4">
        <Pressable onPress={() => setIsVisible(false)}><Text className="text-white font-bold">Recusar</Text></Pressable>
        <Pressable onPress={() => navigateTo("/premium")}><Text className="text-[#C7FEF1] font-bold">Garantir</Text></Pressable>
      </View>
    </View>
  );

  const AccountCard = () => (
    <View className="gap-4 pt-6 border-t border-borderStandard flex-row items-end">
      <View className="flex-1 flex-row items-center gap-3">
        <Button onPress={() => router.push("/personalprofile")}>
          <ExpoImage
            source={images.person}
            style={{ width: 40, height: 40, borderRadius: 9999 }}
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            cachePolicy="memory-disk"
          />
        </Button>
        <View className="gap-[2px]">
          <Text className="text-white font-bold text-base">Lucasreal</Text>
          <Text className="text-textStandard font-medium text-sm">Membro Básico</Text>
        </View>
      </View>
      <Button onPress={handleLogout}><CustomIcons name="exit" size={24} color="#FFF" /></Button>
    </View>
  );

  const renderDesktopMenu = () => (
    <View aria-label="ContainerMenu" className="h-screen justify-between items-start bg-primaryStandardDark px-4 py-8" style={{ width: containerWidth }}>
      <View className="gap-8 w-full">
        <ExpoImage source={images.logo} style={{ width: 115, height: 32 }} contentFit="cover" placeholder={{ blurhash: BLURHASH }} cachePolicy="none" />
        <View className="rounded-full border border-[#3692C5] px-3 py-2 items-center">
          <Text className="text-white font-semibold text-center">"A necessidade é a mãe da invenção" - Platão</Text>
        </View>
        <View className="w-full gap-2">
          <MenuButton route="/" label="Descubra o mundo" iconName="home" count={home} />
          <MenuButton route="/games" label="Jogos" iconName="games" />
          <MenuButton route="/friends" label="Amigos" iconName="friends" count={friends} />
          <MenuButton route="/information" label="Configurações" iconName="configs" />
          <MenuButton route="/help" label="Ajuda e Suporte" iconName="help"/>
        </View>
      </View>
      <View className="w-full gap-6">
        {PremiumCard()}
        {AccountCard()}
      </View>
    </View>
  );

  const renderMobileMenu = () => (
    <View aria-label="ContainerMenu" className="flex-row w-full bg-destaqueAzul px-[25px] py-[13px] justify-center">
      <View className="w-full max-w-[400px] flex-row justify-between">
        <MobileMenuButton route="/" iconName="home" count={home} />
        <MobileMenuButton route="/games" iconName="games"/>
        <MobileMenuButton route="/createpost" iconName="createPost" />
        <MobileMenuButton route="/friends" iconName="friends" count={friends} />
        <MobileMenuButton route="/personalprofile" iconName="profile" />
      </View>
    </View>
  );

  return isMobile ? renderMobileMenu() : renderDesktopMenu();
}
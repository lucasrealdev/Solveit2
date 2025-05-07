import "../styles/global.css";
import { Stack, usePathname, SplashScreen } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { useFonts } from "expo-font";
import { useEffect, useMemo } from "react";

import Menu from "@/components/menus/Menu";
import Header from "@/components/menus/Header";
import MenuRight from "@/components/menus/MenuRight";
import SearchHeader from "@/components/menus/SearchHeader";
import { ToastProvider } from "@/components/ToastProvider";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const [fontsLoaded, error] = useFonts({
    "PlusJakartaSans-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "PlusJakartaSans-BoldItalic": require("../assets/fonts/PlusJakartaSans-BoldItalic.ttf"),
    "PlusJakartaSans-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "PlusJakartaSans-ExtraBoldItalic": require("../assets/fonts/PlusJakartaSans-ExtraBoldItalic.ttf"),
    "PlusJakartaSans-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "PlusJakartaSans-ExtraLightItalic": require("../assets/fonts/PlusJakartaSans-ExtraLightItalic.ttf"),
    "PlusJakartaSans-Italic": require("../assets/fonts/PlusJakartaSans-Italic.ttf"),
    "PlusJakartaSans-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "PlusJakartaSans-LightItalic": require("../assets/fonts/PlusJakartaSans-LightItalic.ttf"),
    "PlusJakartaSans-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-MediumItalic": require("../assets/fonts/PlusJakartaSans-MediumItalic.ttf"),
    "PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-SemiBoldItalic": require("../assets/fonts/PlusJakartaSans-SemiBoldItalic.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded || !width) return null;

  // Regras independentes para cada componente
  const menuRoutes = ["/", "/games", "/friends", "/information", "/help", "/personalprofile", "/createpost", "/premium", "/favorites", "/postdetails"];
  const headerRoutes = ["/", "/games", "/friends", "/information", "/help", "/personalprofile", "/createpost", "/premium", "/favorites", "/postdetails"];
  const searchHeaderRoutes = ["/", "/postdetails"];
  const menuRightRoutes = ["/", "/createpost", "/postdetails"];

  // Função para verificar se deve renderizar (início exato ou prefixo)
  const matchRoute = (routes: string[]) =>
    routes.some(route => pathname === route || pathname.startsWith(route + "/"));

  const shouldShowMenu = useMemo(() => matchRoute(menuRoutes), [pathname]);
  const shouldShowHeader = useMemo(() => matchRoute(headerRoutes), [pathname]);
  const shouldShowSearchHeader = useMemo(() => matchRoute(searchHeaderRoutes), [pathname]);
  const shouldShowMenuRight = useMemo(() => matchRoute(menuRightRoutes), [pathname]);

  const isMobileDirection = width <= 770 ? "column-reverse" : "row";

  return (
    <ToastProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0172B1" }} edges={["top"]}>
        <View className="flex flex-1" style={{ flexDirection: isMobileDirection }}>
          {shouldShowMenu && <Menu friends={2} />}

          <View className="flex-col flex-1">
            {shouldShowSearchHeader && <SearchHeader />}
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(settings)" options={{ headerShown: false }} />
            </Stack>
          </View>

          {shouldShowMenuRight && <MenuRight />}
          {shouldShowHeader && <Header />}
        </View>
      </SafeAreaView>
    </ToastProvider>
  );
}

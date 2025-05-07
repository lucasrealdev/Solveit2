import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import CustomIcons from "@/assets/icons/CustomIcons";
import images from "@/constants/images";
import Button from "@/components/Button";

const NotFoundScreen = () => {
  const router = useRouter();

  const handleBack = () => {
    router.canGoBack() ? router.back() : router.push("/");
  };

  return (
    <View className="flex-1 items-center justify-center bg-backgroundStandardLight px-4">
      <View aria-label="ContainerErro" className="items-center justify-center max-w-[600px] mb-4">
        <Text className="font-bold text-xl text-primaryStandardDark mb-4">404 Error</Text>
        <Text className="font-extrabold text-4xl sm:text-7xl text-textStandardDark text-center mb-6">
          Oops! Página não encontrada.
        </Text>
        <Text className="text-lg text-textStandardDark text-center mb-8">
          Infelizmente, a página que você está procurando desapareceu ou foi movida :(
        </Text>

        <View className="flex-row flex-wrap justify-center gap-3 self-stretch">
          <Button
            backgroundColor="#e5e7eb"
            hoverInColor="#CBD5E1"
            className="border rounded-full border-borderStandard flex-row items-center justify-center gap-3 h-14"
            classNameContainer="w-full max-w-[220px]"
            scale={1.015}
            onPress={handleBack}
          >
            <CustomIcons name="previous" color="#475569" size={20} />
            <Text className="font-bold text-lg text-textStandardDark">Voltar</Text>
          </Button>

          <Button
            backgroundColor="#0174b2"
            className="border rounded-full border-borderStandard flex-row items-center justify-center gap-3 h-14"
            classNameContainer="w-full max-w-[220px]"
            scale={1.015}
            onPress={() => router.push("/")}
          >
            <Text className="font-bold text-lg text-white">Voltar ao Começo</Text>
            <CustomIcons name="home" size={24} color="white" />
          </Button>
        </View>
      </View>

      <Image source={images.logoShadow} style={{ width: 74, height: 74 }} />
    </View>
  );
};

export default NotFoundScreen;
import { useState } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import images from "@/constants/images";
import CustomIcons from "@/assets/icons/CustomIcons";
import colors from "@/constants/colors";
import GoogleAuth from "@/components/GoogleAuth";
import { useToast } from "@/components/ToastProvider";
import CustomTextInput from "@/components/CustomTextInput";
import Button from "@/components/Button";

export default function SignUp() {
  const router = useRouter();
  const { showToast } = useToast();

  const [isSubmitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleInputChange = (field: any, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const sendUser = async () => {
    if (!validateForm(formData)) {
      return;
    }
  };

  // Função de validação
  const validateForm = (form: { username: string; email: string; password: string }): boolean => {
    const { username, email, password } = form;

    if (!username.trim() || !email.trim() || !password.trim()) {
      showToast({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast({
        type: 'error',
        title: 'E-mail inválido',
        message: 'Por favor, insira um endereço de e-mail válido.',
      });
      return false;
    }

    if (password.length < 8) {
      showToast({
        type: 'error',
        title: 'Senha curta',
        message: 'Sua senha deve ter pelo menos 8 caracteres.',
      });
      return false;
    }

    return true;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient
        aria-label="Gradient"
        className="flex-1 justify-between items-center"
        colors={['#EBD4FF', '#ABB9FF', '#0145F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View className="flex-1 justify-center items-center w-full p-2">
          <View
            className="bg-backgroundStandardLight gap-8 p-6 rounded-[32px] border border-borderStandard w-full max-w-[480px]"
            aria-label="CardSignUp"
            style={{
              shadowColor: 'rgba(0, 0, 0, 0.1)', // Ajuste para corresponder à sombra padrão do `shadow-lg`
              shadowOffset: { width: 0, height: 4 }, // Deslocamento padrão do Tailwind `shadow-lg`
              shadowOpacity: 1, // Opacidade da sombra
              shadowRadius: 6, // Raio padrão do Tailwind `shadow-lg`
              elevation: 8, // Para Android, simulando `shadow-lg`
            }}
          >
            <View className="gap-2">
              <Image source={images.logoShadow} className="!w-12 !h-12 ml-[-7px]" />
              <View className="gap-2">
                <Text className="font-extrabold text-4xl text-textStandardDark">Cadastre-se gratuitamente.</Text>
                <Text className="text-base text-textStandardDark">Unleash your inner sloth 4.0 right now.</Text>
              </View>
            </View>

            <View aria-label="FieldsCard" className="gap-4">
              <CustomTextInput
                title="Nome de Usuario"
                placeholder="X_AE_A_13b"
                maxLength={20}
                inputFilter={/[^a-zA-Z0-9@._-]/g}
                inputMode="text"
                icon="user"
                blurColor="#CBD5E1"
                onChangeText={(value) => handleInputChange('username', value)}
              />
              <CustomTextInput
                title="Digite seu e-mail"
                placeholder="exemplo@dominio.com"
                maxLength={50}
                inputFilter={/[^a-zA-Z0-9@._-]/g}
                inputMode="email"
                icon="email"
                blurColor="#CBD5E1"
                onChangeText={(value) => handleInputChange('email', value)}
              />
              <CustomTextInput
                title="Digite sua Senha"
                placeholder="*************"
                maxLength={50}
                inputFilter={/[^a-zA-Z0-9@#._-]/g}
                inputMode="text"
                icon="padlock"
                blurColor="#CBD5E1"
                password
                strength
                onChangeText={(value) => handleInputChange('password', value)}
              />
            </View>

            <View aria-label="ContainerButtonSignUp" className="gap-6">
              <Button className="rounded-xl py-3 gap-2"
                onPress={sendUser}
                backgroundColor="#01b297">
                <Text className="text-white font-bold">Cadastrar</Text>
                <CustomIcons name="exit" color="white" size={20} />
              </Button>

              <View className="w-full flex items-center flex-row justify-center">
                <Text className="text-textStandardDark font-bold">Você já tem uma conta?{' '}</Text>
                <Button onPress={() => router.push('/signin')} hoverInColor={colors.accentStandardDark.hover} pressInColor={colors.accentStandardDark.pressIn} applyChildColors>
                    <Text className="font-bold" style={{ color: "#01b297" }}>Entre</Text>
                  </Button>
              </View>
            </View>

            <View className="w-full gap-3 flex-row justify-center items-center">
              <View className="h-[1px] flex-1 bg-borderStandard"></View>
              <Text className="text-[#94A3B8] font-extrabold">OU</Text>
              <View className="h-[1px] flex-1 bg-borderStandard"></View>
            </View>

            <GoogleAuth />
          </View>
        </View>

        <BlurView intensity={50} tint="dark" className="w-full p-4 border border-t-borderStandard">
          <Text className="text-center text-textStandard">© 2024 SolveIt. Todos os direitos reservados.</Text>
        </BlurView>
      </LinearGradient>
    </ScrollView>
  );
}

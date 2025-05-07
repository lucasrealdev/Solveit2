import { useState } from "react";
import { Text, View, ScrollView, useWindowDimensions, ActivityIndicator } from "react-native";
import CustomIcons from "@/assets/icons/CustomIcons";
import { useToast } from "@/components/ToastProvider";
import { useSmartNavigation } from "@/utils/navigation";
import Tooltip from "@/components/Tooltip";
import CustomTextInput from "@/components/CustomTextInput";
import Button from "@/components/Button";

type FormData = {
  username: string;
  numberPhone: string;
  biography: string;
  profile: string;
  banner: string;
};

export default function Information() {
  const [loading, setLoading] = useState<boolean>(false);

  const { width } = useWindowDimensions();
  const largeScreen = width > 700;
  const paddingClass = largeScreen ? "px-6" : "px-2";

  const { showToast } = useToast();
  const { navigateTo } = useSmartNavigation();

  const [form, setForm] = useState<FormData>({
    username: "",
    numberPhone: "",
    biography: "",
    profile: "",
    banner: "",
  });

  // Função para atualizar os dados do usuário no contexto global
  const handleUpdateUser = async () => {
    try {
      // Validação para garantir que o nome de Usuario tem no mínimo 6 caracteres
      if (form.username.length < 6) {
        showToast({
          type: 'error',
          title: 'Erro',
          message: 'O nome de Usuário deve ter no mínimo 6 caracteres.',
        });
        return; // Interrompe a execução
      }

      // Validação para garantir que o número de telefone tem no mínimo 11 caracteres
      const cleanedNumber = form.numberPhone.replace(/[^\d]/g, ""); // Remove não numéricos
      if (cleanedNumber.length > 0 && cleanedNumber.length < 11) {
        showToast({
          type: 'error',
          title: 'Erro',
          message: 'O número de telefone deve ter no mínimo 11 dígitos.',
        });
        return; // Interrompe a execução
      }

      // Validação para garantir que o nome de Usuário não está vazio
      if (!form.username.trim()) {
        showToast({
          type: 'error',
          title: 'Erro',
          message: 'Por favor, preencha o nome de usuário.',
        });
        return; // Interrompe a execução
      }

      // Validação para garantir que a biografia tem no mínimo 20 caracteres
      if (form.biography.length < 20) {
        showToast({
          type: 'error',
          title: 'Erro',
          message: 'A biografia precisa ter no mínimo 20 caracteres.',
        });
        return;
      }

      // Validação para garantir que a biografia não está vazia
      if (!form.biography.trim()) {
        showToast({
          type: 'error',
          title: 'Erro',
          message: 'Por favor, preencha a biografia.',
        });
        return; // Interrompe a execução
      }

      // Adiciona o prefixo +55 ao numberPhone, se necessário
      const numberPhoneWithPrefix = form.numberPhone.startsWith("+55")
        ? form.numberPhone
        : `+55 ${form.numberPhone.trim()}`;

      setLoading(true);

      const updatedForm = {
        ...form,
        numberPhone: numberPhoneWithPrefix,
      };

      // Aqui você faria a chamada para sua API para atualizar o usuário

      // Atualiza os dados no contexto global
      setForm((prev) => ({
        ...prev,
        username: updatedForm.username || "",
        numberPhone: updatedForm.numberPhone || "",
        biography: updatedForm.biography || "",
        profile: updatedForm.profile || "valorpadrao",
        banner: updatedForm.banner || "valorpadrao",
      }));

      showToast({
        type: 'success',
        title: 'Sucesso',
        message: 'Dados atualizados com sucesso!',
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof FormData, value: string) => {
    // Verifica se o campo é válido, e se o valor não é null ou undefined
    if (field) {
      const newValue = value === null || value === undefined ? "valorpadrao" : value;
      setForm((prev) => ({
        ...prev,
        [field]: newValue,
      }));
    }
  };

  return (
    <View aria-label="Main-Content-Master" className="bg-white flex-1">
      <ScrollView showsVerticalScrollIndicator={false} className={`pb-3 ${paddingClass}`}>
        {/* Header */}
        <View className="gap-6 bg-white my-4">
          <View className="flex flex-row flex-wrap gap-2 justify-between items-center mb-2">
            <View className="flex-col">
              <Text className="text-lg font-bold">Seu Perfil</Text>
              <Text className="text-base text-gray-500">
                Atualize as informações do seu perfil aqui
              </Text>
            </View>
            <View className="flex-row gap-2 items-center">
              <Tooltip
                title="Informações dos dados"
                content="Ninguem pode visualizar os dados do seu perfil se não tiver uma assinatura premium"
                iconSize={40}
                iconColor="#1E40AF"
              />
            </View>
          </View>
        </View>

        {/* Formulário */}
        <View className={`${largeScreen ? "gap-6" : "gap-3"}`}>
          {/* Nome de Usuário */}
          <CustomTextInput
            title="Nome de Usuário"
            placeholder={form.username || "Digite o nome"}
            maxLength={30}
            inputFilter={/[^\p{L}\p{N}\s\p{P}\p{So}]/gu}
            inputMode="text"
            onChangeText={(text) => updateForm("username", text)}
            focusColor="#475569"
            blurColor="#CBD5E1"
            minLength={6}
          />

          {/* Número de Celular */}
          <CustomTextInput
            title="Número de Celular"
            placeholder={form.numberPhone || "(19) 12345-6789"}
            maxLength={15}
            inputFilter={/\D/g}
            inputMode="tel"
            maskType="phone"
            onChangeText={(text) => updateForm("numberPhone", text)}
            focusColor="#475569"
            blurColor="#CBD5E1"
            minLength={11}
          />

          {/* Foto de Perfil */}
          <View className="flex flex-row flex-wrap items-start justify-start gap-3">
            <Text className="font-bold text-textStandardDark">Foto de Perfil</Text>

          </View>

          {/* Banner de Perfil */}
          <View className="flex flex-row flex-wrap items-start justify-start gap-3">
            <Text className="font-bold text-textStandardDark">Banner do Perfil</Text>

          </View>

          {/* Biografia */}
          <CustomTextInput
            title="Biografia"
            placeholder={form.biography || "Digite sua biografia"}
            maxLength={325}
            inputFilter={/[^\p{L}\p{N}\s\p{P}\p{So}]/gu}
            inputMode="text"
            onChangeText={(text) => updateForm("biography", text)}
            multiline
            showCharCount
            focusColor="#475569"
            blurColor="#CBD5E1"
            minLength={20}
          />
        </View>

        {/* Botão de Atualizar */}
        <View className="flex justify-end items-start flex-row py-3">
          <Button
            backgroundColor="#01b297"
            className="h-11 px-6 rounded-full flex-row items-center gap-2"
            onPress={handleUpdateUser}
          >
            <Text className="text-white font-semibold text-lg">Atualizar</Text>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <CustomIcons name="correct" size={18} color="#fff" />
            )}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

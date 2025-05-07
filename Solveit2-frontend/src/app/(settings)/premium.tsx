import Button from "@/components/Button";
import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';

export default function Premium() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View aria-label="Main-Content-Master" className="gap-[24px] bg-white flex flex-1 items-center">

        {/* Conteúdo Principal */}
        <View aria-label="FrameComponentes" className="p-[16px] gap-[24px]">
          <View aria-label="RepresentanteText" className="flex items-center">
            <Text className="text-[20px] font-bold">Atualize para o Solveit Premium</Text>
          </View>

          {/* Benefícios do Plano Premium */}
          <View aria-label="Components" className="flex flex-row flex-wrap justify-center gap-[20px]">
            <Button
              scale={1.04}
              style={[styles.card]}
              className="w-[300px] p-4 gap-3 rounded-lg border h-[189px] border-[#CBD5E1] bg-[#F7FAFC] flex-col"
            >
              <Feather name="phone" size={24} color="#0D141C" />
              <Text className="text-[#1E293B] text-base font-semibold mb-[8px]">
                Acesso através do telefone e e-mail
              </Text>
              <Text className="text-[#475569] text-sm">
                Conectar-se com outros usuários diretamente, via telefone e e-mail.
              </Text>
            </Button>

            <Button
              scale={1.04}
              style={[styles.card]}
              className="w-[300px] p-4 gap-3 rounded-lg border h-[189px] border-[#CBD5E1] bg-[#F7FAFC] flex-col items-start"
            >
              <Fontisto name="email" size={24} color="#0D141C" />
              <Text className="text-[#1E293B] text-base font-semibold mb-2">
                Sugestões personalizadas para resolução de problemas
              </Text>
              <Text className="text-[#475569] text-sm">
                Obtenha aconselhamento personalizado sobre suas questões financeiras.
              </Text>
            </Button>

            <Button
              scale={1.04}
              style={[styles.card]}
              className="w-[300px] p-4 gap-3 rounded-lg border h-[189px] border-[#CBD5E1] bg-[#F7FAFC] flex-col items-start"
            >
              <Feather name="check" size={24} color="#0D141C" />
              <Text className="text-[#1E293B] text-base font-semibold mb-[8px]">
                Respostas ilimitadas de especialistas
              </Text>
              <Text className="text-[#475569] text-sm">
                Acesso instantâneo e ilimitado aos nossos especialistas.
              </Text>
            </Button>
          </View>

          {/* Planos de Assinatura Mensal */}
          <View aria-label="PlanosMensais" className="flex flex-row flex-wrap justify-center items-center gap-[16px]">
            {/* Plano Mensal 1 */}
            <View style={[styles.card]} className="flex-1 max-w-[500px] min-w-[250px] h-[234px] p-[24px] rounded-lg border border-[#CBD5E1] bg-[#F7FAFC]">
              <View className="w-fit h-fit bg-[#3B82F6] rounded-full absolute right-2 top-2 px-2 py-1">
                <Text className="text-white text-xs">Mais Popular</Text>
              </View>
              <Text className="text-[#1E293B] text-sm font-medium">Pacote Mensal</Text>
              <View className="flex-row items-end justify-start">
                <Text className="text-[#1E293B] text-3xl font-bold mt-[8px]">R$40</Text>
                <Text className="text-sm font-bold">/mês</Text>
              </View>
              <TouchableOpacity className="bg-[#E8EDF2] mt-[16px] p-[12px] rounded-[12px]">
                <Text className="text-black font-bold text-center text-sm">Comprar Premium</Text>
              </TouchableOpacity>
              <Text className="text-[#64748B] text-[12px] mt-[12px]">
                ✓ Acesso a respostas de milhares especialistas
              </Text>
            </View>

            {/* Plano Mensal 2 */}
            <View style={[styles.card]} className="flex-1 max-w-[500px] min-w-[250px] h-[234px] p-[24px] rounded-lg border border-[#CBD5E1] bg-[#F7FAFC]">
              <Text className="text-[#1E293B] text-sm font-medium">Pacote Mensal</Text>
              <View className="flex-row items-end justify-start">
                <Text className="text-[#1E293B] text-3xl font-bold mt-[8px]">R$20</Text>
                <Text className="text-sm font-bold">/mês</Text>
              </View>
              <TouchableOpacity className="bg-[#E8EDF2] mt-[16px] p-[12px] rounded-[12px]">
                <Text className="text-black font-bold text-center text-sm">Comprar Premium</Text>
              </TouchableOpacity>
              <Text className="text-[#64748B] text-[12px] mt-[12px]">
                ✓ Acesso a respostas de milhares especialistas
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000", // Cor da sombra
    shadowOffset: { width: 0, height: 2 }, // Deslocamento da sombra
    shadowOpacity: 0.1, // Opacidade da sombra
    shadowRadius: 4, // Raio da sombra
    elevation: 4, // Sombra no Android
  },
});

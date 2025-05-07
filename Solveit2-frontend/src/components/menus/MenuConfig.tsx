import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { label: 'Informações', route: '/information' },
  { label: 'Favoritos', route: '/favorites' },
  { label: 'Premium', route: '/premium' },
];

export default function MenuConfig() {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (route: string) => {
    const method = route !== pathname ? 'push' : 'replace';
    router[method](route);
  };

  const isActive = (route: string) => route === pathname;

  return (
    <View
      aria-label="Main-Content"
      className="flex pt-4 px-4 bg-[#F8FAFC] border-b border-[#CBD5E1]"
    >
      <View aria-label="Header" className="flex gap-5">
        <Text className="font-bold text-2xl">Configurações</Text>

        <View aria-label="Tab-Groups" className="flex-row gap-7 items-center">
          {TABS.map(({ label, route }) => {
            const active = isActive(route);
            return (
              <Pressable
                key={route}
                onPress={() => navigateTo(route)}
                className={`items-center pb-3 ${active ? 'border-b-2 border-[#01B198]' : ''}`}
              >
                <Text className="text-base font-semibold text-center">
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

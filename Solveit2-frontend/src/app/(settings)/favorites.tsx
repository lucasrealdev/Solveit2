import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  Button,
} from "react-native";

// Componente fictício simples
function PostFicticio({ title }: { title: string }) {
  return (
    <View className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <Text className="text-lg font-bold">{title}</Text>
      <Text className="text-gray-500">Conteúdo fictício...</Text>
    </View>
  );
}

export default function Favoritos() {
  const [posts, setPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Carrega posts simulados
  const carregarPosts = () => {
    setLoading(true);
    setTimeout(() => {
      setPosts(Array.from({ length: 5 }, (_, i) => `Post #${i + 1}`));
      setLoading(false);
    }, 1000);
  };

  // Simula recarregar (pull-to-refresh)
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      carregarPosts();
      setRefreshing(false);
    }, 1000);
  };

  // Simula carregar mais
  const carregarMais = () => {
    const novos = Array.from(
      { length: 3 },
      (_, i) => `Post #${posts.length + i + 1}`
    );
    setPosts([...posts, ...novos]);
  };

  useEffect(() => {
    carregarPosts();
  }, []);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 gap-4 max-w-[700px] w-full self-center">
          {loading ? (
            <ActivityIndicator size="large" color="#3692C5" />
          ) : posts.length === 0 ? (
            <Text className="text-center text-gray-500">
              Você ainda não tem posts favoritos.
            </Text>
          ) : (
            posts.map((title, index) => (
              <PostFicticio key={index} title={title} />
            ))
          )}

          {!loading && posts.length > 0 && (
            <Button title="Carregar mais" onPress={carregarMais} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

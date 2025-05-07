import { Text, View, ScrollView } from "react-native";
import { useState } from "react";
import CardFriend from "@/components/CardFriend";
import Comment from "@/components/Comment"; // ajuste conforme o local do seu Comment.tsx
import GoogleAuth from "@/components/GoogleAuth";
import Tooltip from "@/components/Tooltip";
import CustomTextInput from "@/components/CustomTextInput";
import Quiz from "@/components/Quiz";
import Button from "@/components/Button";
import { useToast } from "@/components/ToastProvider";

export default function Index() {
  const currentUserId = "user_000";

  const friends = [
    {
      id: "user_123",
      username: "lucas_dev",
      avatar: "https://i.pravatar.cc/150?img=3",
      isFollowing: true,
    },
    {
      id: "user_456",
      username: "maria.tech",
      avatar: "https://i.pravatar.cc/150?img=5",
      isFollowing: false,
    },
  ];

  const [commentsComponent, setCommentsComponent] = useState([
    {
      $id: "comment1",
      content: "Esse é um ótimo post!",
      likeCount: 5,
      isLiked: false,
      $createdAt: new Date().toISOString(),
      creator: {
        $id: currentUserId,
        username: "lucas_dev",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
    },
    {
      $id: "comment2",
      content: "Muito bom, parabéns!",
      likeCount: 2,
      isLiked: true,
      $createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      creator: {
        $id: "user_456",
        username: "maria.tech",
        avatar: "https://i.pravatar.cc/150?img=5",
      },
    },
  ]);

  const handleDeleteComment = (id: string) => {
    setCommentsComponent((prev) => prev.filter((comment) => comment.$id !== id));
  };

  const { showToast } = useToast();

  return (
    <View className="flex-1 bg-zinc-100 pt-10">
      <Text className="text-black text-2xl text-center mb-4">Teste Componentes</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {friends.map((friend) => (
          <CardFriend
            key={friend.id}
            id={friend.id}
            username={friend.username}
            avatar={friend.avatar}
            isFollowing={friend.isFollowing}
            currentUserId={currentUserId}
          />
        ))}

        <View className="mt-6 px-4">
          {commentsComponent.map((comment) => (
            <Comment
              key={comment.$id}
              commentData={comment}
              currentUserId={currentUserId}
              onDelete={handleDeleteComment}
            />
          ))}
        </View>

        <View className="mt-6 px-4">
          <GoogleAuth />
        </View>

        <View className="mt-6 px-4 flex items-start">
          <Tooltip
            title="Pro Features"
            content="These features are only available for premium subscribers."
          />
        </View>

        <View className="mt-6 px-4 flex items-start">
          {/* Variação de Input para Email */}
          <CustomTextInput
            title="Email"
            placeholder="Digite seu e-mail"
            maxLength={50}
            inputMode="email"
            icon="email"
            showCharCount={false}
          />
        </View>

        <View className="mt-6 px-4 flex items-start">
          {/* Variação de Input para Telefone com Máscara */}
          <CustomTextInput
            title="Telefone"
            placeholder="Digite seu telefone"
            maxLength={15}
            maskType="phone"
            icon="danger"
            showCharCount={true}
          />
        </View>

        <View className="mt-6 px-4 flex items-start">
          {/* Variação de Input Multiline com Texto Livre */}
          <CustomTextInput
            title="Comentário"
            placeholder="Escreva seu comentário"
            maxLength={100000}
            multiline={true}
            inputMode="text"
            icon="chat"
            showCharCount={true}
          />
        </View>

        <View className="mt-6 px-4 flex items-start">
          {/* Variação de Input para Senha com Força */}
          <CustomTextInput
            title="Senha"
            placeholder="Digite sua senha"
            maxLength={20}
            password={true}
            strength={true}
            showCharCount={false}
          />
        </View>

        <View className="px-4 mt-6 max-w-[700px] w-full">
          <Quiz
            isLogged={true}
            quiz={{
              id: 'abc123',
              createdAt: new Date().toISOString(),
              title: 'Qual é o seu framework favorito?',
              options: [
                { text: 'React' },
                { text: 'Vue' },
                { text: 'Angular' },
              ],
              voteCount: {
                0: 12,
                1: 5,
                2: 3,
              },
              userVoted: null,
              totalVotes: 20,
            }}
          />
        </View>

        <View className="px-4 mt-6 ">
          <Button backgroundColor="red"
          onPress={() =>
            showToast({
              title: 'Success',
              message: 'Your changes have been saved.',
              duration: 5000,
              type: 'success',
              position: 'top',
              buttons: [
                { text: 'Undo', onPress: () => console.log('Undo') },
                { text: 'OK', onPress: () => console.log('OK') },
              ],
            })
          }>
            <Text>Clique aqui</Text>
          </Button>
          <Button backgroundColor="green"
          onPress={() =>
            showToast({
              title: 'Erro',
              message: 'Vish',
              duration: 5000,
              type: 'error',
              position: 'top',
              buttons: [
                { text: 'Undo', onPress: () => console.log('Undo') },
                { text: 'OK', onPress: () => console.log('OK') },
              ],
            })
          }>
            <Text>Clique aqui</Text>
          </Button>
          <Button backgroundColor="blue"
          onPress={() =>
            showToast({
              title: 'Info',
              message: 'Einstein',
              duration: 5000,
              type: 'info',
              position: 'top',
              buttons: [
                { text: 'Undo', onPress: () => console.log('Undo') },
                { text: 'OK', onPress: () => console.log('OK') },
                { text: 'OK', onPress: () => console.log('OK') },
              ],
            })
          }>
            <Text>Clique aqui</Text>
          </Button>

        </View>
      </ScrollView>
    </View>
  );
}

import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import CustomIcons from '@/assets/icons/CustomIcons';
import colors from '@/constants/colors';
import { Image as ExpoImage } from 'expo-image';
import Button from './Button';
import { useRouter } from 'expo-router';
import { useToast } from './ToastProvider';

interface CardFriendProps {
  id: string;
  username: string;
  avatar: string;
  isFollowing?: boolean;
  label?: string;
  currentUserId: string;
}

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const CardFriend: React.FC<CardFriendProps> = ({
  id,
  username,
  avatar,
  isFollowing: initialFollowing = false,
  label,
  currentUserId,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleFollow = async () => {
    if (!currentUserId) return;

    setLoading(true);

    try {
      const actionMessage = isFollowing ? 'deixar de seguir' : 'seguir';
      const successMessage = isFollowing
        ? 'Você deixou de seguir este usuário!'
        : 'Você começou a seguir este usuário!';
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast({
        title: 'Sucesso',
        message: successMessage,
        duration: 5000,
        type: 'success',
        position: 'top',
      });

      setIsFollowing(!isFollowing);
    } catch (error) {
      showToast({
        title: 'Erro',
        message: `Erro ao ${isFollowing ? 'deixar de seguir' : 'seguir'} o usuário.`,
        duration: 5000,
        type: 'error',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToProfile = () => router.push(`/profile/${id}`);

  if (label === 'menu' && loading) return null;

  return (
    <View
      className={`flex flex-row border-b border-borderStandardLight ${
        label !== 'menu' ? 'py-4' : 'py-2'
      } ${label !== 'menu' ? 'px-[15px]' : ''} gap-3 items-center`}
    >
      {/* Avatar Button */}
      <Button scale={1.06} onPress={navigateToProfile}>
        <ExpoImage
          source={{ uri: avatar }}
          style={{
            borderWidth: 2,
            borderColor: 'white',
            borderRadius: 9999,
            width: label === 'menu' ? 45 : 50,
            height: label === 'menu' ? 45 : 50,
          }}
          contentFit="cover"
          placeholder={{ blurhash }}
          cachePolicy="memory-disk"
        />
      </Button>

      {/* Username */}
      <View className="flex-1 gap-[1px]">
        <Text className="text-textSecondary font-bold text-[14px]">{username}</Text>
      </View>

      {/* Loading / Follow Button */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primaryStandardDark.standard} />
      ) : (
        <Button
          hoverInColor={isFollowing ? '#D21F3C' : colors.textSecondary.standard}
          pressInColor={isFollowing ? '#c20826' : colors.primaryStandardDark.standard}
          onPress={handleFollow}
          applyChildColors
        >
          {isFollowing ? (
            <Text className="text-[14px] font-bold" style={{ color: '#FF0029' }}>
              Remover
            </Text>
          ) : (
            <CustomIcons name="more" color="#94A3B8" size={20} />
          )}
        </Button>
      )}
    </View>
  );
};

export default CardFriend;
import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import CustomIcons from '@/assets/icons/CustomIcons';
import images from '@/constants/images';
import { Image as ExpoImage } from 'expo-image';
import Button from './Button';
import { useToast } from './ToastProvider';

interface CommentProps {
  commentData: {
    $id: string;
    content: string;
    $createdAt: string;
    isLiked: boolean;
    likeCount: number;
    creator: {
      $id: string;
      username: string;
      avatar?: string;
    };
  };
  currentUserId?: string;
  onLikeToggle?: (id: string, liked: boolean) => void;
  onDelete?: (id: string) => void;
  isDeleteLoading?: boolean;
  navigateToProfile?: (id: string) => void;
}

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj['; // encurtado para clareza

const Comment: React.FC<CommentProps> = ({
  commentData,
  currentUserId,
  onLikeToggle,
  onDelete,
  isDeleteLoading = false,
  navigateToProfile,
}) => {
  const [liked, setLiked] = useState(commentData.isLiked);
  const [likeCount, setLikeCount] = useState(commentData.likeCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isUserCreator = currentUserId === commentData.creator.$id;
  const { showToast } = useToast();

  const formattedDate = (() => {
    const now = new Date();
    const createdAt = new Date(commentData.$createdAt);
    const diff = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
    const m = Math.floor(diff / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    const mo = Math.floor(d / 30), y = Math.floor(mo / 12);
    if (y > 0) return `há ${y} ano${y > 1 ? 's' : ''}`;
    if (mo > 0) return `há ${mo} mês${mo > 1 ? 'es' : ''}`;
    if (d > 0) return `há ${d} dia${d > 1 ? 's' : ''}`;
    if (h > 0) return `há ${h}h`;
    if (m > 0) return `há ${m}m`;
    return 'há menos de 1 minuto';
  })();

  const handleLike = () => {
    setLikeLoading(true);
    setTimeout(() => {
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(prev => prev + (newLiked ? 1 : -1));
      setLikeLoading(false);
      onLikeToggle?.(commentData.$id, newLiked);
    }, 500); // simula delay de API
  };

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      onDelete?.(commentData.$id);
      showToast({
        type: 'success',
        title: 'Comentário excluído',
        message: 'Seu comentário foi removido com sucesso.',
      });
    }, 600); // simula delay de exclusão
  };

  return (
    <View className="flex-row items-start gap-2">
      <Button scale={1.03} onPress={() => navigateToProfile?.(commentData.creator.$id)}>
        <ExpoImage
          source={commentData.creator.avatar ? { uri: commentData.creator.avatar } : images.person}
          style={{ width: 40, height: 40, borderRadius: 9999 }}
          alt={`Avatar de ${commentData.creator.username}`}
          contentFit="cover"
          placeholder={{ blurhash }}
          cachePolicy="memory-disk"
        />
      </Button>

      <View className="flex-1">
        <Text className="text-textStandardDark text-sm">{commentData.creator.username}</Text>
        <Text className="text-textStandardDark text-sm">{commentData.content}</Text>
        <Text className="text-textSecondary text-xs">{formattedDate}</Text>
      </View>

      <View className="justify-center items-center">
        {isUserCreator ? (
          <Button scale={1.09} onPress={handleDelete} className="w-fit mr-[6px]">
            {deleting || isDeleteLoading ? (
              <ActivityIndicator size={20} color="#FF0000" />
            ) : (
              <CustomIcons name="dump" size={20} color="#FF0000" />
            )}
          </Button>
        ) : (
          <Button scale={1.09} onPress={handleLike} className="w-fit flex-row items-center justify-center">
            {likeLoading ? (
              <ActivityIndicator size={20} color="#94A3B8" />
            ) : (
              <>
                <CustomIcons name="hearth" size={20} color={liked ? '#FF0000' : '#94A3B8'} />
                <Text className="text-xs ml-[2px]">{likeCount}</Text>
              </>
            )}
          </Button>
        )}
      </View>
    </View>
  );
};

export default Comment;

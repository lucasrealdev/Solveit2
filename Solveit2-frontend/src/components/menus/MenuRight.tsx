import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions, ActivityIndicator } from "react-native";
import CustomIcons from "@/assets/icons/CustomIcons";
import colors from "@/constants/colors";
import { Image as ExpoImage } from "expo-image";
import Button from "../Button";
import CardFriend from "../CardFriend";
import type IconNames from "@/constants/icons-names";
import { useSmartNavigation } from "@/utils/navigation";

// Tipagem para o user
interface User {
  avatar: string;
  status: boolean | null;
}

interface Event {
  $id: string;
  title: string;
  dateEvent: string;
  icon: IconNames;
}

interface MenuRightProps {
  user?: User;
}

const MenuRight: React.FC<MenuRightProps> = ({ user }) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width > 1250;
  const isTablet = height <= 835 ? "hidden" : "";
  const containerWidth = width >= 1400 ? 368 : 320;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<boolean | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const { navigateTo } = useSmartNavigation();

  const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  if (!isMobile || isLoadingMenu) return null;

  const renderUserCardsSuggested = () =>
    suggestedFriends.map((friend) => (
      <CardFriend
        key={friend.id}
        id={friend.id}
        username={friend.username}
        avatar={friend.avatar}
        isFollowing={friend.isFollowing}
        currentUserId="user_123"
      />
    ));

  const renderEventCard = (event: Event) => (
    <View key={event.$id} aria-label="CardEvento" className="flex flex-row border-t border-borderStandardLight py-[12px] gap-3 items-center">
      <View className="w-[40px] h-[40px] flex items-center justify-center bg-[#EEF2FF] rounded-full">
        <CustomIcons name={event.icon} color="#01B198" size={20} />
      </View>
      <View className="flex flex-1">
        <Text className="text-textSecondary font-bold text-[14px]">{event.title}</Text>
        <Text className="text-textSecondary font-normal text-[14px]">{event.dateEvent}</Text>
      </View>
      <CustomIcons name="notification" color="#94A3B8" size={20} />
    </View>
  );

  return (
    <View aria-label="ContainerMenu" className="flex h-[100vh] border-l border-borderStandardLight bg-white" style={{ width: containerWidth }}>
      <View className="flex w-full px-6 py-[19px] flex-row justify-between border-b border-borderStandardLight">
        <Pressable className="flex justify-center">
          {user ? (
            <Button scale={1.05} className="items-end" disabled={isLoading}>
              <ExpoImage
                source={{ uri: user.avatar }}
                style={{ width: 48, height: 48, borderRadius: 9999 }}
                contentFit="cover"
                placeholder={{ blurhash }}
                cachePolicy="memory-disk"
              />
              <View
                className={`w-3 h-3 border-white border-[1.5px] rounded-full mt-[-12px] ${
                  isLoading ? "bg-gray-400" : currentStatus ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </Button>
          ) : (
            <ActivityIndicator size="small" color="#C0C0C0" />
          )}
        </Pressable>

        <View className="flex flex-row gap-2">
          <Button
            scale={1.07}
            className="flex p-[11px] border border-borderStandard rounded-full"
            onPress={() => navigateTo("/premium")}>
            <CustomIcons name="upgrade" size={24} color="#475569" />
          </Button>
        </View>
      </View>

      <View className="flex w-full gap-8 p-6">
        <View>
          <View className="flex flex-row justify-between items-center pb-6">
            <Text className="font-bold text-[18px]">Sugestão de amigos</Text>
            <Button
              className="flex flex-row items-end gap-2"
              onPress={() => navigateTo("/friends")}
              hoverInColor={colors.accentStandardDark.hover}
              pressInColor={colors.accentStandardDark.pressIn}
              applyChildColors>
              <Text className="font-bold text-[14px]" style={{ color: "#01b297" }}>
                Ver tudo
              </Text>
              <CustomIcons name="rightArrow" color="#01B198" size={20} />
            </Button>
          </View>
          {renderUserCardsSuggested()}
        </View>

        {events.length > 0 && (
          <View className={isTablet}>
            <View className="flex flex-row justify-between items-center pb-6">
              <Text className="font-bold text-[18px]">Próximos eventos</Text>
            </View>
            {events.map((event) => renderEventCard(event))}
          </View>
        )}
      </View>
    </View>
  );
};

export default MenuRight;

import MenuConfig from "@/components/menus/MenuConfig";
import { Stack } from "expo-router";
import { View } from "react-native";

const configLayout = () => {
    return (
        <View className="flex-1">
            <MenuConfig />
            <Stack>
                <Stack.Screen
                    name="premium"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="information"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="favorites"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </View>
    );
};

export default configLayout;

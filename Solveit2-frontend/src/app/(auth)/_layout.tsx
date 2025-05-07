import { Stack } from "expo-router";
import { View } from "react-native";

const AuthLayout = () => {
  return (
    <View className="flex-1">
      <Stack>
        <Stack.Screen
          name="signin"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default AuthLayout;

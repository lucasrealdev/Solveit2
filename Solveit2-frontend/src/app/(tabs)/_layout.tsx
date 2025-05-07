import { Stack } from 'expo-router';

const TabsLayout = () => {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="friends" options={{ headerShown: false }} />
        <Stack.Screen name="games" options={{ headerShown: false }} />
        <Stack.Screen name="createpost" options={{ headerShown: false }} />
        <Stack.Screen name="personalprofile" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="postdetails/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default TabsLayout;

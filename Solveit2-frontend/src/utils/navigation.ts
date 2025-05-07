import { useRouter, usePathname } from "expo-router";

export function useSmartNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (route: string) => {
    router[route !== pathname ? "push" : "replace"](route);
  };

  return { navigateTo, pathname };
}
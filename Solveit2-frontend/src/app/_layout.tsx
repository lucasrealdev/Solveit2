import { useEffect } from 'react';
import { Slot } from 'expo-router';

export default function Layout() {
  useEffect(() => {
    document.title = 'Solveit2';
  }, []);

  return <Slot />;
}

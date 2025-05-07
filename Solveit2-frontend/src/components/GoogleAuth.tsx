import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Image, Text, ActivityIndicator } from 'react-native';
import images from '@/constants/images';
import Button from './Button';
import { useToast } from './ToastProvider';

WebBrowser.maybeCompleteAuthSession();

const GoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    try {
      setIsLoading(true);

      // Chama sua API para pegar o link de autenticação do Google
      const response = await fetch('https://suaapi.com/auth/google');
      const { authUrl } = await response.json();

      // Abre o navegador com o link
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'https://suaapp.com/auth/callback');

      if (result.type === 'success') {
        // Ex: você pode extrair tokens ou dados da URL de callback
        const redirectUrl = result.url;
        showToast({
          title: 'Sucesso',
          message: 'Login concluído com sucesso.',
          duration: 5000,
          type: 'info',
          position: 'top',
        });
        // Aqui você pode redirecionar ou tratar os dados como quiser
      } else {
        showToast({
          title: 'Cancelado',
          message: 'Login cancelado ou falhou.',
          duration: 5000,
          type: 'error',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
      showToast({
        title: 'Erro',
        message: 'Falha ao iniciar login com Google.',
        duration: 5000,
        type: 'error',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onPress={handleLogin}
      disabled={isLoading}
      className="w-full border border-borderStandard py-[10px] rounded-full flex flex-row justify-center items-center gap-3"
      scale={1.007}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#01b297" />
      ) : (
        <>
          <Image source={images.google} className="w-6 h-6" />
          <Text className="font-bold text-textoPretoCinza">Continuar com Google</Text>
        </>
      )}
    </Button>
  );
};

export default GoogleAuth;

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { Suspense, useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../constants/Colors';
import { DatabaseProvider, useDatabase } from '../context/DatabaseContext';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.destaque} />
    </View>
  );
}

async function registerForNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

function InitialLayout() {
  const db = useDatabase();
  const router = useRouter();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const result = await db.getFirstAsync<{ onboarding_concluido: number }>('SELECT onboarding_concluido FROM metas WHERE id = 1');
        
        if (result && result.onboarding_concluido === 0) {
          setTimeout(() => {
             router.replace('/onboarding');
          }, 100);
        } 
      } catch (e) {
        console.error("Erro ao verificar onboarding:", e);
      } finally {
        setIsReady(true);
      }
    };

    checkOnboarding();
  }, [db, router]);

  if (!isReady) {
    return <LoadingFallback />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: COLORS.fundo },
        headerStyle: { backgroundColor: COLORS.fundo },
        headerTintColor: COLORS.textoPrimario,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: 'Inter_500Medium' }
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen 
        name="registro-sono" 
        options={{ 
          presentation: 'modal',
          title: 'Registro de Sono',
          headerStyle: { backgroundColor: COLORS.secundario },
        }} 
      />
      <Stack.Screen 
        name="dica-detalhe/[id]" 
        options={{ 
          presentation: 'card',
          title: 'Dica',
        }} 
      />
      <Stack.Screen 
        name="sono-detalhe/[id]" 
        options={{ 
          presentation: 'card',
          title: 'Detalhes do Registro',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      registerForNotificationsAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<LoadingFallback />}>
        <DatabaseProvider>
          <InitialLayout />
        </DatabaseProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fundo,
  },
});
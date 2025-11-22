import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { NotificationProvider } from '../lib/NotificationContext';
import { RoleProvider } from '../lib/RoleContext';

export default function RootLayout() {
  return (
    <RoleProvider>
      <NotificationProvider>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: '#111',
              },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Welcome' }} />
            <Stack.Screen name="bienvenida" options={{ title: 'Bienvenida' }} />
            <Stack.Screen name="BienvenidaScreen" options={{ title: 'Bienvenida' }} />
            <Stack.Screen name="home-dj" options={{ title: 'Home DJ' }} />
            <Stack.Screen name="home-cliente" options={{ title: 'Home Cliente' }} />
            <Stack.Screen name="eventos-dj" options={{ title: 'Eventos DJ' }} />
            <Stack.Screen name="eventos-cliente" options={{ title: 'Eventos Cliente' }} />
            <Stack.Screen name="buscar-djs" options={{ title: 'Buscar DJs' }} />
            <Stack.Screen name="perfil-dj" options={{ title: 'Perfil DJ' }} />
            <Stack.Screen name="chat" options={{ title: 'Chat' }} />
            <Stack.Screen name="chats" options={{ title: 'Chats' }} />
            <Stack.Screen name="chats-dj" options={{ title: 'Chats DJ' }} />
            <Stack.Screen name="chats-cliente" options={{ title: 'Chats Cliente' }} />
            <Stack.Screen name="alertas" options={{ title: 'Alertas' }} />
            <Stack.Screen name="alertas-dj" options={{ title: 'Alertas DJ' }} />
            <Stack.Screen name="alertas-cliente" options={{ title: 'Alertas Cliente' }} />
            <Stack.Screen name="apartadodj" options={{ title: 'Apartado DJ' }} />
            <Stack.Screen name="apartadomascliente" options={{ title: 'Apartado Cliente' }} />
            <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />
            <Stack.Screen name="editar-perfil" options={{ title: 'Editar Perfil' }} />
            <Stack.Screen name="registro-dj" options={{ title: 'Registro DJ' }} />
            <Stack.Screen name="registro-cliente" options={{ title: 'Registro Cliente' }} />
          </Stack>
        </View>
      </NotificationProvider>
    </RoleProvider>
  );
}

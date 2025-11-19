import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { useDatabase } from '../../context/DatabaseContext';

type DicaDetalhe = {
  id: number;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
};

export default function DicaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();
  const [dica, setDica] = useState<DicaDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDica = async () => {
      setIsLoading(true);
      try {
        const result = await db.getFirstAsync<DicaDetalhe>(
          `SELECT * FROM dicas_sono WHERE id = ?`,
          [id]
        );
        setDica(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDica();
  }, [db, id]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.destaque} />
      </View>
    );
  }

  if (!dica) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.titulo}>Dica não encontrada.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: dica.titulo,
          headerStyle: { backgroundColor: COLORS.fundo },
          headerTintColor: COLORS.textoPrimario,
        }} 
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.categoria}>{dica.categoria.toUpperCase()}</Text>
          <Text style={styles.titulo}>{dica.titulo}</Text>
          <Text style={styles.resumo}>{dica.resumo}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.conteudo}>{dica.conteudo}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  categoria: {
    color: COLORS.destaque,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  titulo: {
    color: COLORS.textoPrimario,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  resumo: {
    color: COLORS.textoSecundario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.secundario,
    marginVertical: 16,
  },
  conteudo: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 26,
  },
});
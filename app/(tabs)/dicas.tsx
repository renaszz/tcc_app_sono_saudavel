import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { useDatabase } from '../../context/DatabaseContext';

type Dica = {
  id: number;
  titulo: string;
  resumo: string;
  categoria: string;
};

const shuffleArray = (array: Dica[]) => {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function DicasScreen() {
  const router = useRouter();
  const db = useDatabase();
  
  const [dicas, setDicas] = useState<Dica[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await db.getAllAsync<Dica>(
        `SELECT id, titulo, resumo, categoria FROM dicas_sono`
      );
      setDicas(shuffleArray(result));
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      if (dicas.length === 0) {
        onRefresh();
      }
    }, [onRefresh, dicas.length])
  );

  const renderDicaCard = ({ item }: { item: Dica }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push({ 
        pathname: "/dica-detalhe/[id]", 
        params: { id: item.id } 
      })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="bulb-outline" size={20} color={COLORS.destaque} />
        <Text style={styles.cardCategoria}>{item.categoria.toUpperCase()}</Text>
      </View>
      <Text style={styles.cardTitulo}>{item.titulo}</Text>
      <Text style={styles.cardResumo}>{item.resumo}</Text>
      <Text style={styles.cardLink}>
        Saber mais <Ionicons name="arrow-forward" size={12} />
      </Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={dicas}
      renderItem={renderDicaCard}
      keyExtractor={(item) => item.id.toString()}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Central Informativa</Text>
        </View>
      }
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={COLORS.destaque}
        />
      }
      ListEmptyComponent={
        !refreshing ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma dica encontrada.</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
    marginTop: 60,
  },
  title: {
    color: COLORS.textoPrimario,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    backgroundColor: COLORS.secundario,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCategoria: {
    color: COLORS.destaque,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  cardTitulo: {
    color: COLORS.textoPrimario,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  cardResumo: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  cardLink: {
    color: COLORS.destaque,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textoSecundario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
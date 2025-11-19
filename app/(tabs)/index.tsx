import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { COLORS } from '../../constants/Colors';
import { useDatabase } from '../../context/DatabaseContext';

interface Meta {
  id: number;
  meta_sono_horas: number;
  nome_usuario: string; 
}

interface UltimoRegistro {
  duracao_horas: number;
  data: string;
}

const formatarHoras = (decimal: number) => {
  if (!decimal) return '0h';
  
  let horas = Math.floor(decimal);
  let minutos = Math.round((decimal - horas) * 60);

  if (minutos === 60) {
    minutos = 0;
    horas += 1;
  }

  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${String(minutos).padStart(2, '0')}m`;
};

export default function HomeScreen() {
  const router = useRouter();
  const db = useDatabase();
  const params = useLocalSearchParams();
  
  const [meta, setMeta] = useState<Meta | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState<UltimoRegistro | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = useCallback(async () => {
    if (!db) return;
    setRefreshing(true);
    try {
      const metaResult = await db.getFirstAsync<Meta>(
        'SELECT * FROM metas WHERE id = 1'
      );
      setMeta(metaResult);

      const ultimoReg = await db.getFirstAsync<UltimoRegistro>(
        'SELECT duracao_horas, data FROM registros_sono ORDER BY data DESC LIMIT 1'
      );
      setUltimoRegistro(ultimoReg);

    } catch (e) {
      console.error("Erro ao buscar dados para Home:", e);
    } finally {
      setRefreshing(false);
    }
  }, [db]);
  
  const handleHideToast = () => {
    setToastVisible(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();

      if (params.successAction) {
        let message = '';
        const action = params.successAction as 'created' | 'updated';
        
        if (action === 'created') {
          message = 'Registro de sono salvo com sucesso!';
        } else if (action === 'updated') {
          message = 'Registro de sono atualizado!';
        }
        
        setToastMessage(message);
        setToastVisible(true); 

        router.setParams({ successAction: undefined });
      }

    }, [fetchData, params.successAction, router]) // <--- CORREÇÃO: Adicionado 'router'
  );

  const handleRegistrarPress = () => {
    if (!ultimoRegistro) {
      router.push('/registro-sono');
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataUltimo = new Date(ultimoRegistro.data);
    
    const hojeStart = hoje.getTime();
    const dataUltimoStart = new Date(dataUltimo.getFullYear(), dataUltimo.getMonth(), dataUltimo.getDate()).getTime();
    

    if (hojeStart === dataUltimoStart) {
      setShowConfirmModal(true);
    } else {
      router.push('/registro-sono');
    }
  };

  const confirmarRefazer = () => {
    setShowConfirmModal(false);
    router.push('/registro-sono'); 
  };

  const metaHoras = meta?.meta_sono_horas ?? 8;
  const ultimaNoiteHoras = ultimoRegistro?.duracao_horas ?? 0;
  
  const nomeCompleto = meta?.nome_usuario || 'Usuário';
  const primeiroNome = nomeCompleto.split(' ')[0];

  const razao = metaHoras > 0 ? ultimaNoiteHoras / metaHoras : 0;
  const larguraBarra = Math.min(Math.max(razao, 0), 1) * 100;
  const corBarra = razao >= 1 ? COLORS.bom : COLORS.destaque;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchData} 
            tintColor={COLORS.destaque}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {primeiroNome}</Text>
            <Text style={styles.headerSubtitle}>Como foi sua noite de sono?</Text>
          </View>
          <Ionicons name="moon-outline" size={28} color={COLORS.destaque} />
        </View>
        <View style={styles.card}>
          <Ionicons name="bed-outline" size={32} color={COLORS.destaque} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Como foi sua noite?</Text>
          <Text style={styles.cardSubtitle}>Registre seu diário de sono</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegistrarPress}
          >
            <Text style={styles.buttonText}>Registrar Agora</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meta de Sono</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>
              <View style={[styles.dot, { backgroundColor: COLORS.destaque }]} />
              {' '}Meta: {formatarHoras(metaHoras)} por noite
            </Text>
          </View>
          
          <View style={styles.metaContent}>
            <Text style={styles.metaValue}>{formatarHoras(ultimaNoiteHoras)}</Text>
            <Text style={styles.metaLabel}>última noite</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${larguraBarra}%`, backgroundColor: corBarra }
                ]} 
              />
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb-outline" size={28} color={COLORS.destaque} />
            <Text style={[styles.cardTitle, { marginLeft: 12, marginBottom: 0 }]}>Dica do Dia</Text>
          </View>
          <Text style={styles.cardBody}>
            Evite usar dispositivos eletrônicos 1 hora antes de dormir. A luz azul pode interferir na produção de melatonina.
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/dicas')}>
            <Text style={styles.linkText}>Ver mais dicas <Ionicons name="arrow-forward" size={14} /></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <ConfirmModal
        visible={showConfirmModal}
        title="Registro Existente"
        message={`Olá, ${primeiroNome}! Você já registrou seu sono hoje. Tem certeza que deseja refazer o registro? Isso apagará o registro anterior.`}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmarRefazer}
        confirmText="Sim, refazer"
        cancelText="Cancelar"
      />
      
      <Toast 
        isVisible={toastVisible}
        message={toastMessage}
        onHide={handleHideToast}
      />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: COLORS.textoPrimario,
    fontSize: 26,
    fontFamily: 'Inter_600SemiBold',
  },
  headerSubtitle: {
    color: COLORS.textoSecundario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
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
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textoPrimario,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.destaque,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.fundo,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metaContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaValue: {
    color: COLORS.textoPrimario,
    fontSize: 36,
    fontFamily: 'Inter_600SemiBold',
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardBody: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginVertical: 8,
  },
  linkText: {
    color: COLORS.destaque,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
});
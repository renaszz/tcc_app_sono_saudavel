import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmModal from '../../components/ConfirmModal';
import { COLORS } from '../../constants/Colors';
import { useDatabase } from '../../context/DatabaseContext';

type RegistroDB = {
  id: number;
  data: string;
  qualidade: string;
  tempo_tela_min: number;
  duracao_horas: number;
  observacoes: string | null;
  sentimento_acordar: string | null;
};

const DetalheItem = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number | null;
}) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemHeader}>
      <Ionicons name={icon} size={20} color={COLORS.destaque} />
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
    <Text style={styles.itemValue}>{value || 'Não informado'}</Text>
  </View>
);

const DicaAlerta = ({
  icon,
  titulo,
  texto,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}) => (
  <View style={styles.dicaContainer}>
    <Ionicons name={icon} size={24} color={COLORS.destaque} />
    <View style={styles.dicaConteudo}>
      <Text style={styles.dicaTitulo}>{titulo}</Text>
      <Text style={styles.dicaTexto}>{texto}</Text>
    </View>
  </View>
);

const formatarData = (isoData: string) => {
  const data = new Date(isoData);
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  return dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
};

export default function DetalheRegistroScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [registro, setRegistro] = useState<RegistroDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (!id || !db) return;

    async function loadRegistro() {
      try {
        setLoading(true);
        const reg = await db.getFirstAsync<RegistroDB>(
          'SELECT * FROM registros_sono WHERE id = ?',
          [Number(id)]
        );
        setRegistro(reg);
      } catch (e) {
        console.error('Erro ao carregar registro:', e);
      } finally {
        setLoading(false);
      }
    }
    loadRegistro();
  }, [id, db]);

  const dicas = useMemo(() => {
    if (!registro) return [];
    const alertas = [];

    const telaPositiva = registro.tempo_tela_min <= 30;
    const sonoPositivo = registro.duracao_horas >= 7;

    if (telaPositiva && sonoPositivo) {
      alertas.push({
        id: 99,
        icon: 'sparkles-outline' as keyof typeof Ionicons.glyphMap,
        titulo: 'Ótimo Trabalho!',
        texto:
          'Seu tempo de tela está baixo e sua duração de sono foi excelente. Continue assim para manter uma ótima higiene do sono!',
      });
    } else {
      if (!telaPositiva) {
        alertas.push({
          id: 1,
          icon: 'phone-portrait-outline' as keyof typeof Ionicons.glyphMap,
          titulo: 'Alto Tempo de Tela',
          texto:
            'A luz azul inibe a produção de melatonina. Tente definir um "toque de recolher digital" pelo menos 60 minutos antes de dormir.',
        });
      }

      if (!sonoPositivo) {
        alertas.push({
          id: 2,
          icon: 'moon-outline' as keyof typeof Ionicons.glyphMap,
          titulo: 'Poucas Horas de Sono',
          texto:
            'A privação do sono pode causar déficits de atenção e prejuízos no desempenho cognitivo. Tente manter uma rotina mais regular.',
        });
      }
    }

    return alertas;
  }, [registro]);

  const showDeleteModal = () => {
    setIsModalVisible(true);
  };

  const executeDelete = async () => {
    try {
      await db.runAsync(
        'DELETE FROM registros_sono WHERE id = ?',
        [Number(id)]
      );
      setIsModalVisible(false);
      router.back();
    } catch (e) {
      console.error('Erro ao apagar registro:', e);
      setIsModalVisible(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/registro-sono',
      params: { id: id },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.destaque} />
      </View>
    );
  }

  if (!registro) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Erro' }} />
        <Text style={styles.title}>Registro não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Detalhes do Registro',
          headerBackTitle: 'Voltar',
          headerStyle: { backgroundColor: COLORS.fundo },
          headerTintColor: COLORS.textoPrimario,
          contentStyle: { backgroundColor: COLORS.fundo },
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>{formatarData(registro.data)}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
            <Ionicons name="pencil-outline" size={24} color={COLORS.destaque} />
          </TouchableOpacity>
          <TouchableOpacity onPress={showDeleteModal} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.ruim} />
          </TouchableOpacity>
        </View>
      </View>

      {dicas.length > 0 && (
        <View style={styles.dicasSection}>
          <Text style={styles.dicasSectionTitle}>
            Análise do seu dia
          </Text>
          {dicas.map((dica) => (
            <DicaAlerta
              key={dica.id}
              icon={dica.icon}
              titulo={dica.titulo}
              texto={dica.texto}
            />
          ))}
        </View>
      )}

      <View style={styles.grid}>
        <DetalheItem
            icon="star-outline"
            label="Qualidade"
            value={registro.qualidade}
          />
          <DetalheItem
            icon="bed-outline"
            label="Duração"
            value={`${registro.duracao_horas.toFixed(1)}h`}
          />
          <DetalheItem
            icon="phone-portrait-outline"
            label="Tempo de Tela"
            value={`${registro.tempo_tela_min} min`}
          />
          <DetalheItem
            icon="happy-outline"
            label="Sentimento ao Acordar"
            value={registro.sentimento_acordar}
        />
      </View>

      {registro.observacoes && registro.observacoes.trim().length > 0 ? (
        <ScrollView style={styles.obsContainer}>
          <Text style={styles.itemLabel}>Observações</Text>
          <Text style={styles.obsText}>{registro.observacoes}</Text>
        </ScrollView>
      ) : null}

      <ConfirmModal
        visible={isModalVisible}
        title="Apagar Registro"
        message="Tem certeza que deseja apagar este registro? Esta ação não pode ser desfeita."
        onClose={() => setIsModalVisible(false)}
        onConfirm={executeDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fundo,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.fundo,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textoPrimario,
    marginBottom: 4,
    flex: 1,
    marginRight: 16,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemContainer: {
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    height: 110,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textoSecundario,
    marginLeft: 8,
  },
  itemValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textoPrimario,
  },
  obsContainer: {
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    padding: 16,
    height: 110,
    marginBottom: 16, 
  },
  obsText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textoPrimario,
    marginTop: 8,
    lineHeight: 22,
  },
  dicasSection: {
    marginBottom: 24,
  },
  dicasSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textoSecundario,
    marginBottom: 12,
  },
  dicaContainer: {
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dicaConteudo: {
    flex: 1,
    marginLeft: 12,
  },
  dicaTitulo: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textoPrimario,
    marginBottom: 4,
  },
  dicaTexto: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textoSecundario,
    lineHeight: 20,
  },
});
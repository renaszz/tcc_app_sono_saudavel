import { Inter_400Regular } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient, useFont, vec } from '@shopify/react-native-skia';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bar, CartesianChart } from 'victory-native';
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

type RegistroProcessado = RegistroDB & {
  dia: string;
};

type ChartData = {
  x_id: number;
  valor: number;
  dia: string;
};

type ActiveTab = 'sono' | 'tela';

const diasDaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MAX_SONO_HORAS_CHART = 9.8;
const MAX_TELA_MIN_CHART = 88;
const newYellow = '#FFDA00';

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHoursToTime = (decimalHours: number) => {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatMinutesToTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function RelatoriosScreen() {
  const font = useFont(Inter_400Regular, 12);
  const db = useDatabase();
  const router = useRouter();

  const [registrosDaSemana, setRegistrosDaSemana] = useState<RegistroProcessado[]>([]);
  const [historicoCompleto, setHistoricoCompleto] = useState<RegistroProcessado[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('sono');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      
      const endOfPeriod = new Date(today);
      endOfPeriod.setDate(today.getDate() - 1);
      
      const startOfPeriod = new Date(endOfPeriod);
      startOfPeriod.setDate(endOfPeriod.getDate() - 6);

      const startStr = getLocalDateString(startOfPeriod);
      const endStr = getLocalDateString(endOfPeriod);

      const dbRegistrosSemana = await db.getAllAsync<RegistroDB>(
        'SELECT * FROM registros_sono WHERE data >= ? AND data <= ? ORDER BY data ASC',
        [startStr, endStr]
      );

      const processedSemana = dbRegistrosSemana.map((reg) => {
        const dateObj = new Date(reg.data + 'T12:00:00');
        return {
          ...reg,
          dia: diasDaSemana[dateObj.getDay()],
        };
      });

      setRegistrosDaSemana(processedSemana);

      const dbHistorico = await db.getAllAsync<RegistroDB>(
        'SELECT * FROM registros_sono ORDER BY data DESC'
      );

      const processedHistorico = dbHistorico.map((reg) => {
        const dateObj = new Date(reg.data + 'T12:00:00');
        return {
          ...reg,
          dia: diasDaSemana[dateObj.getDay()],
        };
      });

      setHistoricoCompleto(processedHistorico);
    } catch (e) {
      console.error('Erro ao carregar relatórios:', e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const today = new Date();
    const endOfPeriod = new Date(today);
    endOfPeriod.setDate(today.getDate() - 1);

    const startOfChart = new Date(endOfPeriod);
    startOfChart.setDate(startOfChart.getDate() - 6);

    const dataForChart: ChartData[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfChart);
      d.setDate(d.getDate() + i);
      
      const dateStr = getLocalDateString(d);
      const dayInitial = diasDaSemana[d.getDay()];

      const record = registrosDaSemana.find((r) => r.data === dateStr);

      let valor = 0;
      const maxLimit = activeTab === 'sono' ? MAX_SONO_HORAS_CHART : MAX_TELA_MIN_CHART;

      if (record) {
        const realValue =
          activeTab === 'sono'
            ? record.duracao_horas
            : record.tempo_tela_min;
        
        valor = Math.min(realValue, maxLimit); 
      }

      dataForChart.push({
        x_id: i,
        valor,
        dia: dayInitial,
      });
    }

    setChartData(dataForChart);
  }, [registrosDaSemana, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatarData = (isoData: string) => {
    const data = new Date(isoData + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatusIcons = (item: RegistroProcessado) => {
    const temPoucoSono = item.duracao_horas < 6.5;
    const temSonoExcessivo = item.duracao_horas > 9.5;
    const temMuitaTela = item.tempo_tela_min > 30;
    const temProblemaSono = temPoucoSono || temSonoExcessivo;

    const diaPerfeito = !temProblemaSono && !temMuitaTela;

    if (diaPerfeito) {
      return (
        <Ionicons name="sparkles-outline" size={24} color={COLORS.bom} style={{ marginLeft: 8 }} />
      );
    }

    return (
      <View style={styles.iconsRow}>
        {temProblemaSono && (
          <Ionicons name="moon-outline" size={24} color={COLORS.ruim} style={{ marginLeft: 8 }} />
        )}
        {temMuitaTela && (
          <Ionicons name="phone-portrait-outline" size={24} color={COLORS.ruim} style={{ marginLeft: 6 }} />
        )}
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: RegistroProcessado }) => (
    <TouchableOpacity 
      style={styles.historyItem} 
      onPress={() => router.push({ 
        pathname: "/sono-detalhe/[id]", 
        params: { id: item.id } 
      })}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={styles.historyItemText}>{formatarData(item.data)}</Text>
        <Text style={styles.historyItemSubtext}>
          Qualidade: {item.qualidade} / Tela: {formatMinutesToTime(item.tempo_tela_min)} / Sono:{' '}
          {formatHoursToTime(item.duracao_horas)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ marginRight: 12 }}>
            {renderStatusIcons(item)}
        </View>
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={COLORS.textoSecundario}
        />
      </View>
    </TouchableOpacity>
  );

  const EmptyHistoryComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={48} color={COLORS.textoSecundario} style={{ opacity: 0.5 }} />
      <Text style={styles.emptyTitle}>Sem registros ainda</Text>
      <Text style={styles.emptyText}>
        Você ainda não registrou seu sono. Comece hoje para ver sua evolução!
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/registro-sono')}
      >
        <Text style={styles.emptyButtonText}>Registrar Agora</Text>
      </TouchableOpacity>
    </View>
  );

  const hasChartData = chartData.some((d) => d.valor > 0);

  const isSono = activeTab === 'sono';
  const yDomain: [number, number] = isSono
    ? [0, MAX_SONO_HORAS_CHART]
    : [0, MAX_TELA_MIN_CHART];

  const yTickValues = isSono
    ? [0, 2, 4, 6, 8, 10]
    : [0, 15, 30, 45, 60, 75, 90];

  const gradientColors =
    isSono
      ? ['#37E2D5', '#37E2D580']
      : [newYellow, newYellow + '80'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
      </View>

      <View style={styles.tabContainer}>
        <TabButton tab="sono" label="Sono" />
        <TabButton tab="tela" label="Tela" />
      </View>

      <View style={styles.chartContainer}>
        {hasChartData && font ? (
          <CartesianChart
            data={chartData}
            xKey="x_id"
            yKeys={['valor']}
            domain={{ y: yDomain, x: [-0.5, 6.5] }}
            axisOptions={{
              font: font,
              labelColor: COLORS.textoSecundario,
              lineColor: 'transparent',
              formatYLabel: (v) => (isSono ? `${v}h` : `${v}m`),
              tickValues: {
                y: yTickValues,
                x: [0, 1, 2, 3, 4, 5, 6],
              },
              formatXLabel: (v) => {
                const dataPoint = chartData[Math.round(v)];
                return dataPoint ? dataPoint.dia : '';
              },
            }}
          >
            {({ points, chartBounds }) => (
              <>
                {points.valor.map((point, i) => (
                  <Bar
                    key={i}
                    chartBounds={chartBounds}
                    points={[point]}
                    barWidth={36}
                    roundedCorners={{ topLeft: 8, topRight: 8 }}
                  >
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(0, chartBounds.bottom)}
                      colors={gradientColors}
                    />
                  </Bar>
                ))}
              </>
            )}
          </CartesianChart>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={40} color={COLORS.textoSecundario} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Text style={styles.noDataText}>
              Sem dados suficientes para o gráfico desta semana.
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.historyTitle}>Histórico de Registros</Text>
      <FlatList
        data={historicoCompleto}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.historyList}
        contentContainerStyle={styles.historyListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.destaque}
          />
        }
        ListEmptyComponent={EmptyHistoryComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundo,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  title: {
    color: COLORS.textoPrimario,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.destaque,
  },
  tabText: {
    color: COLORS.textoSecundario,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  tabTextActive: {
    color: COLORS.fundo,
    fontFamily: 'Inter_600SemiBold',
  },
  chartContainer: {
    backgroundColor: COLORS.secundario,
    borderRadius: 16,
    height: 260,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 24,
    justifyContent: 'center',
  },
  historyTitle: {
    color: COLORS.textoPrimario,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingBottom: 40,
    flexGrow: 1, 
  },
  historyItem: {
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemText: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  historyItemSubtext: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  noDataText: {
    color: COLORS.textoSecundario,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: COLORS.textoPrimario,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.destaque,
  },
  emptyButtonText: {
    color: COLORS.destaque,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
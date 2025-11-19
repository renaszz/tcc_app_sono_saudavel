import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmModal from '../../components/ConfirmModal';
import TempoTelaModal from '../../components/TempoTelaModal';
import TimePickerModal from '../../components/TimePickerModal';
import { COLORS } from '../../constants/Colors';
import { useDatabase } from '../../context/DatabaseContext';

type Metas = {
  meta_sono_horas: number;
  meta_horario_dormir_minutos: number;
  meta_alerta_tela_minutos: number;
  notificacoes_ativas: number;
};

const formatMinutesToTime = (totalMinutes: number) => {
  if (isNaN(totalMinutes)) return '00:00';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatMinutesToHours = (totalMinutes: number) => {
  if (isNaN(totalMinutes)) return '0h';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const opcoaesAlertaTela = [
  { label: '15 Minutos', value: 15 },
  { label: '30 Minutos', value: 30 },
  { label: '45 Minutos', value: 45 },
  { label: '1 Hora', value: 60 },
];

export default function PerfilScreen() {
  const db = useDatabase();

  const [metas, setMetas] = useState<Metas | null>(null);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);

  const [isHorarioPickerVisible, setIsHorarioPickerVisible] = useState(false);
  const [isHorasPickerVisible, setIsHorasPickerVisible] = useState(false);
  const [isDeactivateModalVisible, setIsDeactivateModalVisible] = useState(false);
  const [isTempoTelaModalVisible, setIsTempoTelaModalVisible] = useState(false);

  const agendarNotificacoes = async (
    horarioMinutos: number,
    sonoHoras: number,
    alertaTelaMin: number
  ) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const minutosTotais = 1440;

    const horarioLembreteTela =
      (horarioMinutos - alertaTelaMin + minutosTotais) % minutosTotais;
    
    const triggerHoraTela =
      Platform.OS === 'ios'
        ? {
            hour: Math.floor(horarioLembreteTela / 60),
            minute: horarioLembreteTela % 60,
            repeats: true,
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR as const,
          }
        : {
            hour: Math.floor(horarioLembreteTela / 60),
            minute: horarioLembreteTela % 60,
            type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
          };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alerta de Tempo de Tela 📱',
        body: `Faltam ${alertaTelaMin} minutos para sua meta de dormir. Lembre-se de guardar o celular!`,
        sound: 'default',
      },
      trigger: triggerHoraTela,
      identifier: 'lembrete-tela',
    });

    const horarioRegistro = (horarioMinutos + sonoHoras * 60) % minutosTotais;
    
    const triggerHoraRegistro =
      Platform.OS === 'ios'
        ? {
            hour: Math.floor(horarioRegistro / 60),
            minute: horarioRegistro % 60,
            repeats: true,
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR as const,
          }
        : {
            hour: Math.floor(horarioRegistro / 60),
            minute: horarioRegistro % 60,
            type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
          };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bom dia! ☀️',
        body: 'Como foi a sua noite? Não se esqueça de registrar o seu sono.',
        sound: 'default',
        data: { rota: '/registro-sono' },
      },
      trigger: triggerHoraRegistro,
      identifier: 'lembrete-registrar',
    });
  };

  const fetchMetas = useCallback(async () => {
    try {
      const result = await db.getFirstAsync<Metas>(
        'SELECT * FROM metas WHERE id = 1'
      );
      setMetas(result);

      const dbNotificacoesAtivas = result?.notificacoes_ativas === 1;
      setNotificacoesAtivas(dbNotificacoesAtivas);
      
      if (dbNotificacoesAtivas && result) {
        agendarNotificacoes(
          result.meta_horario_dormir_minutos,
          result.meta_sono_horas,
          result.meta_alerta_tela_minutos
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchMetas();
    }, [fetchMetas])
  );

  const executeDeactivateNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await db.runAsync('UPDATE metas SET notificacoes_ativas = 0 WHERE id = 1');
    
    setNotificacoesAtivas(false);
    setIsDeactivateModalVisible(false);
  };

  const onToggleNotificacoes = async (ativo: boolean) => {
    if (ativo) {
      setNotificacoesAtivas(true);

      await db.runAsync('UPDATE metas SET notificacoes_ativas = 1 WHERE id = 1');

      if (metas) {
        agendarNotificacoes(
          metas.meta_horario_dormir_minutos,
          metas.meta_sono_horas,
          metas.meta_alerta_tela_minutos
        );
      }
    } else {
      setIsDeactivateModalVisible(true);
    }
  };


  const onSelectTempoTela = async (minutos: number) => {
    if (!metas || minutos === metas.meta_alerta_tela_minutos) return;

    const novasMetas = { ...metas, meta_alerta_tela_minutos: minutos };
    setMetas(novasMetas);

    try {
      await db.runAsync(
        'UPDATE metas SET meta_alerta_tela_minutos = ? WHERE id = 1',
        [minutos]
      );
      if (notificacoesAtivas) {
        agendarNotificacoes(
          novasMetas.meta_horario_dormir_minutos,
          novasMetas.meta_sono_horas,
          minutos
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onConfirmarNovoHorario = async (totalMinutes: number) => {
    if (!metas) return;

    const novasMetas = { ...metas, meta_horario_dormir_minutos: totalMinutes };

    try {
      await db.runAsync(
        'UPDATE metas SET meta_horario_dormir_minutos = ? WHERE id = 1',
        [totalMinutes]
      );
      setMetas(novasMetas);

      if (notificacoesAtivas) {
        agendarNotificacoes(
          totalMinutes,
          novasMetas.meta_sono_horas,
          novasMetas.meta_alerta_tela_minutos
        );
      }
    } catch (e) {
      console.error('Erro ao salvar meta:', e);
    } finally {
      setIsHorarioPickerVisible(false);
    }
  };

  const onConfirmarNovaMetaHoras = async (totalMinutes: number) => {
    if (!metas) return;
    const horas = totalMinutes / 60;

    const novasMetas = { ...metas, meta_sono_horas: horas };

    try {
      await db.runAsync('UPDATE metas SET meta_sono_horas = ? WHERE id = 1', [
        horas,
      ]);
      setMetas(novasMetas);

      if (notificacoesAtivas) {
        agendarNotificacoes(
          novasMetas.meta_horario_dormir_minutos,
          horas,
          novasMetas.meta_alerta_tela_minutos
        );
      }
    } catch (e) {
      console.error('Erro ao salvar meta de horas:', e);
    } finally {
      setIsHorasPickerVisible(false);
    }
  };

  const onConfirmTempoTela = (minutos: number) => {
    onSelectTempoTela(minutos);
    setIsTempoTelaModalVisible(false);
  };

  const horarioDormirFormatado = metas
    ? formatMinutesToTime(metas.meta_horario_dormir_minutos)
    : '...';
  const metaHorasFormatada = metas
    ? formatMinutesToHours(metas.meta_sono_horas * 60)
    : '...';

  const getTempoTelaLabel = () => {
    if (!metas) return '...';
    const option = opcoaesAlertaTela.find(
      (opt) => opt.value === metas.meta_alerta_tela_minutos
    );
    return option ? option.label : `${metas.meta_alerta_tela_minutos} min`;
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Metas e Alertas</Text>
        </View>

        <Text style={styles.sectionTitle}>Minhas Metas</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setIsHorarioPickerVisible(true)}
        >
          <View style={styles.prototipo}>
            <Text style={styles.rowLabel}>Horário de dormir</Text>
            <Text style={styles.rowLabel2}>{horarioDormirFormatado}</Text>
          </View>
          <View style={styles.rowValueContainer}>
            <Ionicons
              name="pencil-outline"
              size={20}
              color={COLORS.textoSecundario}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setIsHorasPickerVisible(true)}
        >
          <View style={styles.prototipo}>
            <Text style={styles.rowLabel}>Meta de horas de sono</Text>
            <Text style={styles.rowLabel2}>{metaHorasFormatada}</Text>
          </View>
          <View style={styles.rowValueContainer}>
            <Ionicons
              name="pencil-outline"
              size={20}
              color={COLORS.textoSecundario}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Alertas</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setIsTempoTelaModalVisible(true)}>
          <View style={styles.prototipo}>
            <Text style={styles.rowLabel}>Alerta de Tempo de Tela</Text>
            <Text style={styles.rowValueCiano}>{getTempoTelaLabel()}</Text>
          </View>
          <View style={styles.rowValueContainer}>
            <Ionicons
              name="pencil-outline"
              size={20}
              color={COLORS.textoSecundario}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notificações</Text>
          <Switch
            trackColor={{ false: COLORS.fundo, true: COLORS.destaque }}
            thumbColor={COLORS.textoPrimario}
            ios_backgroundColor={COLORS.fundo}
            onValueChange={onToggleNotificacoes}
            value={notificacoesAtivas}
          />
        </View>
        <Text
          style={[
            styles.rowSubLabel,
            { paddingHorizontal: 8, marginTop: -8, marginBottom: 12 },
          ]}
        >
          Lembrete de alerta de tela e de registro do sono.
        </Text>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Sobre o app</Text>
          <Text style={styles.rowValue}>Versão 1.0.0</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimePickerModal
        visible={isHorarioPickerVisible}
        onClose={() => setIsHorarioPickerVisible(false)}
        onConfirm={onConfirmarNovoHorario}
        initialMinutes={metas?.meta_horario_dormir_minutos || 1380}
      />

      <TimePickerModal
        visible={isHorasPickerVisible}
        onClose={() => setIsHorasPickerVisible(false)}
        onConfirm={onConfirmarNovaMetaHoras}
        initialMinutes={metas ? metas.meta_sono_horas * 60 : 480}
      />

      <ConfirmModal
        visible={isDeactivateModalVisible}
        title="Desativar Lembretes?"
        message="Tem certeza que deseja desligar todos os lembretes de sono e de tela? Você precisará reativá-los manualmente."
        onClose={() => setIsDeactivateModalVisible(false)}
        onConfirm={executeDeactivateNotifications}
        confirmText="Desativar"
        cancelText="Cancelar"
      />

      <TempoTelaModal
        visible={isTempoTelaModalVisible}
        onClose={() => setIsTempoTelaModalVisible(false)}
        onSelect={onConfirmTempoTela}
        currentValue={metas?.meta_alerta_tela_minutos}
        options={opcoaesAlertaTela}
      />
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
  sectionTitle: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  rowLabel2: {
    color: COLORS.destaque,
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  rowValueCiano: {
    color: COLORS.destaque,
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  rowSubLabel: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prototipo: {
    flexDirection: 'column',
  },
  rowValue: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginRight: 8,
  },
});
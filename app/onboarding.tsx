import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import TempoTelaModal from '../components/TempoTelaModal';
import TimePickerModal from '../components/TimePickerModal';
import { COLORS } from '../constants/Colors';
import { useDatabase } from '../context/DatabaseContext';
import { getFeedbackMetaSono } from '../utils/sleepFeedback';

const OPCOES_TELA = [
  { label: '15 Minutos', value: 15 },
  { label: '30 Minutos', value: 30 },
  { label: '45 Minutos', value: 45 },
  { label: '1 Hora', value: 60 },
];

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

export default function OnboardingScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [nome, setNome] = useState('');
  const [horarioDormirMinutos, setHorarioDormirMinutos] = useState(1320);
  const [tempoTela, setTempoTela] = useState(45);
  const [metaSonoMinutos, setMetaSonoMinutos] = useState(480);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showScreenTimePicker, setShowScreenTimePicker] = useState(false);
  
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const finalizarOnboarding = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setShowPermissionModal(true);
        return; 
      }

      const notificacoesAtivas = 1;
      const metaSonoHoras = metaSonoMinutos / 60;

      await db.runAsync(`
        UPDATE metas SET 
          nome_usuario = ?,
          meta_horario_dormir_minutos = ?,
          meta_alerta_tela_minutos = ?,
          meta_sono_horas = ?,
          notificacoes_ativas = ?,
          onboarding_concluido = 1
        WHERE id = 1
      `, [nome, horarioDormirMinutos, tempoTela, metaSonoHoras, notificacoesAtivas]);

      router.replace('/(tabs)');

    } catch (error) {
      console.error("Erro ao salvar onboarding:", error);
    }
  };

  const nextStep = () => {
    if (step === 0 && nome.trim() === '') return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text style={styles.questionText}>Como devemos te chamar?</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome ou apelido"
              placeholderTextColor={COLORS.textoSecundario}
              value={nome}
              onChangeText={setNome}
            />
            <TouchableOpacity style={[styles.btnProximo, styles.btnFull]} onPress={nextStep} disabled={nome.trim() === ''}>
              <Text style={styles.btnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </>
        );

      case 1: // NOME
        return (
          <>
            <Text style={styles.questionText}>Qual sua meta de horário para dormir?</Text>

            <TouchableOpacity style={styles.selectionButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.selectionLabel}>Horário escolhido</Text>
              <Text style={styles.selectionValue}>{formatTime(horarioDormirMinutos)}</Text>
              <Text style={styles.tapToEditText}>(Toque para alterar)</Text>
            </TouchableOpacity>

            <View style={styles.navButtons}>
              <TouchableOpacity onPress={prevStep} style={styles.btnBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textoSecundario} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnProximo, styles.btnFlex]} onPress={nextStep}>
                <Text style={styles.btnText}>Próximo</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 2: // TEMPO DE TELA
        return (
          <>
            <Text style={styles.questionText}>Quanto tempo antes de dormir você quer deixar o celular?</Text>

            <TouchableOpacity style={styles.selectionButton} onPress={() => setShowScreenTimePicker(true)}>
              <Text style={styles.selectionLabel}>Lembrete sobre o uso de telas</Text>
              <Text style={styles.selectionValueCiano}>
                {OPCOES_TELA.find(o => o.value === tempoTela)?.label || `${tempoTela} min`}
              </Text>
              <Text style={styles.tapToEditText}>(Toque para alterar)</Text>
            </TouchableOpacity>

            <View style={styles.navButtons}>
              <TouchableOpacity onPress={prevStep} style={styles.btnBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textoSecundario} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnProximo, styles.btnFlex]} onPress={nextStep}>
                <Text style={styles.btnText}>Próximo</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 3: // META DE SONO
        const feedback = getFeedbackMetaSono(metaSonoMinutos);
        
        return (
          <>
            <Text style={styles.questionText}>Qual sua meta de tempo de sono?</Text>

            <TouchableOpacity 
              style={[styles.selectionButton, { borderColor: feedback.color, borderWidth: 1 }]} 
              onPress={() => setShowDurationPicker(true)}
            >
              <Text style={styles.selectionLabel}>Meta de sono</Text>
              <Text style={[styles.selectionValue, { color: feedback.color }]}>{formatDuration(metaSonoMinutos)}</Text>
              
              <View style={styles.feedbackContainer}>
                <Ionicons name={feedback.icon} size={16} color={feedback.color} style={styles.feedbackIcon} />
                <Text style={[styles.feedbackText, { color: feedback.color }]}>
                  {feedback.msg}
                </Text>
              </View>

              <Text style={styles.tapToEditText}>(Toque para alterar)</Text>
            </TouchableOpacity>

            <View style={styles.navButtons}>
              <TouchableOpacity onPress={prevStep} style={styles.btnBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textoSecundario} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnProximo, styles.btnFlex]} onPress={nextStep}>
                <Text style={styles.btnText}>Próximo</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 4: // META DE USO DE TELA E NOTIFICAÇÕES
        return (
          <>
            <Text style={styles.questionText}>Ative as notificações para um sono melhor!</Text>
            <Text style={styles.subText}>
              Precisamos da sua permissão para enviar alertas sobre o uso de telas antes de dormir e lembretes para registrar seu sono pela manhã.
            </Text>

            <TouchableOpacity style={styles.btnAction} onPress={finalizarOnboarding}>
              <Text style={styles.btnActionText}>Sim, ativar as notificações</Text>
              <Ionicons name="notifications" size={20} color={COLORS.secundario} />
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/onboarding-bg.jpeg')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          <View style={styles.progressBarContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[styles.progressDot, i <= step ? styles.progressDotActive : null]}
              />
            ))}
          </View>

          {renderStepContent()}
        </View>
      </KeyboardAvoidingView>
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={(totalMinutes) => setHorarioDormirMinutos(totalMinutes)}
        initialMinutes={horarioDormirMinutos}
      />

      <TimePickerModal
        visible={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onConfirm={(totalMinutes) => setMetaSonoMinutos(totalMinutes)}
        initialMinutes={metaSonoMinutos}
      />

      <TempoTelaModal
        visible={showScreenTimePicker}
        onClose={() => setShowScreenTimePicker(false)}
        onSelect={(val) => {
          setTempoTela(val);
          setShowScreenTimePicker(false);
        }}
        currentValue={tempoTela}
        options={OPCOES_TELA}
      />

      <ConfirmModal
        visible={showPermissionModal}
        title="Permissão Necessária"
        message="Para que o GoodSleep funcione corretamente, precisamos que você ative as notificações nas configurações do seu aparelho."
        onClose={() => setShowPermissionModal(false)}
        onConfirm={() => {
          setShowPermissionModal(false);
          Linking.openSettings();
        }}
        confirmText="Ir para Configurações"
        cancelText="Cancelar"
      />

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    backgroundColor: 'rgba(11, 19, 43, 0.90)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 60,
    minHeight: 400,
    alignItems: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    backgroundColor: COLORS.destaque,
    width: 20,
  },
  questionText: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 24,
  },
  subText: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Inter_400Regular',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectionButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 30,
  },
  selectionLabel: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter_500Medium',
  },
  selectionValue: {
    color: '#FFF',
    fontSize: 42,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  selectionValueCiano: {
    color: COLORS.destaque,
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  tapToEditText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
  },
  navButtons: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  btnProximo: {
    backgroundColor: COLORS.destaque,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    minHeight: 56,
  },
  btnFull: {
    width: '100%',
  },
  btnFlex: {
    flex: 1,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  btnBack: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 56,
    width: 56,
  },
  btnAction: {
    backgroundColor: COLORS.destaque,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
    borderRadius: 12,
    marginBottom: 15,
    gap: 10,
    minHeight: 56,
  },
  btnActionText: {
    color: COLORS.fundo,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  feedbackContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    paddingHorizontal: 10,
  },
  feedbackIcon: {
    marginRight: 6,
  },
  feedbackText: {
    fontSize: 13, 
    fontFamily: 'Inter_500Medium', 
    textAlign: 'center',
  }
});
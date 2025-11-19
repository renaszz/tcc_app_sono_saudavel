import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import InputModal from '@/components/InputModal';
import TimePickerModal from '@/components/TimePickerModal';
import { COLORS } from '../constants/Colors';
import { useDatabase } from '../context/DatabaseContext';

type Qualidade = 'Ruim' | 'OK' | 'Bom' | null;
type ActiveField = 'observacoes' | 'sentimento' | null;

type RegistroDB = {
  id: number;
  data: string;
  qualidade: string;
  tempo_tela_min: number;
  duracao_horas: number;
  observacoes: string | null;
  sentimento_acordar: string | null;
};

const formatMinutes = (minutes: number) => {
  if (minutes <= 0) return 'Selecionar...';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

export default function RegistroSonoModal() {
  const db = useDatabase();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [qualidade, setQualidade] = useState<Qualidade>(null);
  const [dataOriginal, setDataOriginal] = useState<string | null>(null);
  const [tempoTelaEmMinutos, setTempoTelaEmMinutos] = useState(0);
  const [duracaoEmMinutos, setDuracaoEmMinutos] = useState(0);

  const [observacoes, setObservacoes] = useState('');
  const [sentimento, setSentimento] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'tela' | 'duracao' | null>(null);
  
  const [activeField, setActiveField] = useState<ActiveField>(null);

  useEffect(() => {
    async function carregarRegistroParaEdicao() {
      if (!id || !db) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const reg = await db.getFirstAsync<RegistroDB>(
          'SELECT * FROM registros_sono WHERE id = ?',
          [Number(id)]
        );
        if (reg) {
          setIdEdicao(reg.id);
          setDataOriginal(reg.data);
          
          setQualidade(reg.qualidade as Qualidade);
          setTempoTelaEmMinutos(reg.tempo_tela_min);
          setDuracaoEmMinutos(reg.duracao_horas * 60);
          setObservacoes(reg.observacoes || '');
          setSentimento(reg.sentimento_acordar || '');
        }
      } catch (e) {
        console.error(e);
        setErro('Não foi possível carregar o registro.');
      } finally {
        setLoading(false);
      }
    }
    carregarRegistroParaEdicao();
  }, [id, db]);

  const handleSalvar = async () => {
    setErro(null);

    if (!qualidade) {
      setErro('Por favor, selecione a qualidade do sono.');
      return;
    }
    
    if (tempoTelaEmMinutos <= 0) {
      setErro('Informe o tempo de tela antes de dormir.');
      return;
    }

    if (duracaoEmMinutos <= 0) {
      setErro('Informe a duração total do sono.');
      return;
    }

    try {
      const duracaoHoras = duracaoEmMinutos / 60;
      const tempoTelaMin = tempoTelaEmMinutos;

      if (idEdicao && dataOriginal) {
        await db.runAsync(
          `UPDATE registros_sono SET 
             qualidade = ?, tempo_tela_min = ?, duracao_horas = ?, 
             observacoes = ?, sentimento_acordar = ?
           WHERE id = ?`,
          [
            qualidade,
            tempoTelaMin,
            duracaoHoras,
            observacoes || null,
            sentimento || null,
            idEdicao,
          ]
        );
      } else {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const dataParaSalvar = ontem.toISOString();
        
        const checkDate = new Date(ontem);
        checkDate.setHours(0, 0, 0, 0);
        const startOfCheckDate = checkDate.toISOString();

        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM registros_sono WHERE data >= ? AND data < ?',
          [
            startOfCheckDate, 
            new Date(checkDate.getTime() + 86400000).toISOString()
          ]
        );

        if (existing) {
          await db.runAsync(
            `UPDATE registros_sono SET 
               data = ?, qualidade = ?, tempo_tela_min = ?, duracao_horas = ?, 
               observacoes = ?, sentimento_acordar = ?
             WHERE id = ?`,
            [
              dataParaSalvar,
              qualidade,
              tempoTelaMin,
              duracaoHoras,
              observacoes || null,
              sentimento || null,
              existing.id,
            ]
          );
        } else {
          await db.runAsync(
            `INSERT INTO registros_sono 
               (data, qualidade, tempo_tela_min, duracao_horas, observacoes, sentimento_acordar)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              dataParaSalvar,
              qualidade,
              tempoTelaMin,
              duracaoHoras,
              observacoes || null,
              sentimento || null,
            ]
          );
        }
      }
        router.replace('/');
    } catch (e) {
      console.error(e);
      setErro('Ocorreu um erro ao salvar o registro.');
    }
  };

  const QualidadeButton = ({
    tipo,
    icone,
  }: {
    tipo: Qualidade;
    icone: any;
  }) => (
    <TouchableOpacity
      style={[
        styles.qualidadeButton,
        qualidade === tipo && styles.qualidadeButtonSelected,
      ]}
      onPress={() => setQualidade(tipo)}
    >
      <Ionicons
        name={icone}
        size={28}
        color={
          qualidade === tipo
            ? COLORS.fundo
            : tipo === 'Ruim'
            ? COLORS.ruim
            : tipo === 'OK'
            ? COLORS.ok
            : COLORS.bom
        }
      />
      <Text
        style={[
          styles.qualidadeButtonText,
          qualidade === tipo && styles.qualidadeButtonTextSelected,
        ]}
      >
        {tipo}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.destaque} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.safeArea}
    >
      <Stack.Screen
        options={{
          title: idEdicao ? 'Editar Registro' : 'Registrar Sono',
          headerStyle: { backgroundColor: COLORS.secundario },
          headerTintColor: COLORS.textoPrimario,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Como foi sua noite?</Text>
        <View style={styles.qualidadeContainer}>
          <QualidadeButton tipo="Ruim" icone="sad-outline" />
          <QualidadeButton tipo="OK" icone="happy-outline" />
          <QualidadeButton tipo="Bom" icone="sparkles-outline" />
        </View>

        <Text style={styles.label}>Tempo de tela antes de dormir</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            setCurrentPicker('tela');
            setIsPickerVisible(true);
          }}
        >
          <Text style={styles.pickerText}>
            {formatMinutes(tempoTelaEmMinutos)}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Duração do sono</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            setCurrentPicker('duracao');
            setIsPickerVisible(true);
          }}
        >
          <Text style={styles.pickerText}>
            {formatMinutes(duracaoEmMinutos)}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Observações (opcional)</Text>
        <TouchableOpacity
          style={[styles.input, styles.textAreaDisplay]}
          onPress={() => setActiveField('observacoes')}
        >
          <Text style={[styles.inputText, !observacoes && styles.placeholderText]}>
            {observacoes || "Alguma anotação sobre a noite..."}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Como você se sentiu ao acordar?</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setActiveField('sentimento')}
        >
          <Text style={[styles.inputText, !sentimento && styles.placeholderText]}>
            {sentimento || "Ex: Cansado, disposto, etc."}
          </Text>
        </TouchableOpacity>

        {erro && <Text style={styles.errorText}>{erro}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSalvar}>
          <Text style={styles.buttonText}>
            {idEdicao ? 'Atualizar Registro' : 'Salvar Registro'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TimePickerModal
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        initialMinutes={
          currentPicker === 'tela' ? tempoTelaEmMinutos : duracaoEmMinutos
        }
        onConfirm={(totalMinutes: number) => {
          if (currentPicker === 'tela') {
            setTempoTelaEmMinutos(totalMinutes);
          } else if (currentPicker === 'duracao') {
            setDuracaoEmMinutos(totalMinutes);
          }
          setIsPickerVisible(false);
        }}
      />

      <InputModal
        visible={!!activeField}
        title={activeField === 'observacoes' ? 'Observações' : 'Sentimento'}
        initialText={activeField === 'observacoes' ? observacoes : sentimento}
        placeholder={
          activeField === 'observacoes'
            ? 'Escreva suas observações...'
            : 'Como se sentiu?'
        }
        isMultiline={activeField === 'observacoes'}
        onClose={() => setActiveField(null)}
        onConfirm={(text) => {
          if (activeField === 'observacoes') setObservacoes(text);
          if (activeField === 'sentimento') setSentimento(text);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fundo,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secundario,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginBottom: 12,
    marginTop: 16,
  },
  qualidadeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  qualidadeButton: {
    flex: 1,
    backgroundColor: COLORS.fundo,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualidadeButtonSelected: {
    backgroundColor: COLORS.destaque,
    borderColor: COLORS.destaque,
  },
  qualidadeButtonText: {
    color: COLORS.textoSecundario,
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  qualidadeButtonTextSelected: {
    color: COLORS.fundo,
  },
  input: {
    backgroundColor: COLORS.fundo,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  textAreaDisplay: {
    minHeight: 100,
    justifyContent: 'flex-start',
    paddingTop: 14,
  },
  inputText: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  placeholderText: {
    color: COLORS.textoSecundario,
  },
  pickerText: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  button: {
    backgroundColor: COLORS.destaque,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.fundo,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  errorText: {
    color: COLORS.ruim,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginTop: 12,
  },
});
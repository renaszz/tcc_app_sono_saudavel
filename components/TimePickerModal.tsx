import React, { useEffect, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { COLORS } from '../constants/Colors';

// Interface de props movida para este arquivo
interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (totalMinutes: number) => void;
  initialMinutes?: number;
}

// O componente, agora exportado como default
const TimePickerModal = ({
  visible,
  onClose,
  onConfirm,
  initialMinutes = 0,
}: TimePickerModalProps) => {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('00');

  useEffect(() => {
    if (visible) {
      const h = Math.floor(initialMinutes / 60);
      const m = initialMinutes % 60;
      setHours(String(h));
      setMinutes(String(m).padStart(2, '0'));
    }
  }, [visible, initialMinutes]);

  const handleConfirm = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    let totalMinutes = h * 60 + m;

    onConfirm(totalMinutes);
    onClose();
  };

  const handleMinutesBlur = () => {
    const minuteValue = parseInt(minutes);
    if (!isNaN(minuteValue)) {
      if (minuteValue > 59) {
        setMinutes('59');
      } else {
        setMinutes(String(minuteValue).padStart(2, '0'));
      }
    } else {
      setMinutes('00');
    }
  };

  const handleHoursBlur = () => {
    const hourValue = parseInt(hours);
    if (!isNaN(hourValue)) {
      if (hourValue > 23) {
        setHours('23');
      } else {
        setHours(String(hourValue));
      }
    } else {
      setHours('0');
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Definir tempo</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.timeInput}
              placeholder="0"
              placeholderTextColor={COLORS.textoSecundario}
              keyboardType="numeric"
              value={hours}
              onChangeText={(text) => setHours(text.replace(/[^0-9]/g, ''))}
              onBlur={handleHoursBlur}
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={styles.modalColon}>:</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="00"
              placeholderTextColor={COLORS.textoSecundario}
              keyboardType="numeric"
              value={minutes}
              onChangeText={(text) => setMinutes(text.replace(/[^0-9]/g, ''))}
              onBlur={handleMinutesBlur}
              maxLength={2}
              selectTextOnFocus
            />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.timeLabel}>horas</Text>
            <Text style={styles.timeLabel}>minutos</Text>
          </View>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={handleConfirm}
            >
              <Text style={styles.modalButtonTextConfirm}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Estilos específicos do Modal
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    backgroundColor: COLORS.fundo,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.textoSecundario + '50',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textoPrimario,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timeInput: {
    fontSize: 48,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textoPrimario,
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    textAlign: 'center',
    width: '40%',
  },
  modalColon: {
    fontSize: 40,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textoSecundario,
    marginHorizontal: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textoSecundario,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 30,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.destaque,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.destaque,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.fundo,
  },
});

export default TimePickerModal
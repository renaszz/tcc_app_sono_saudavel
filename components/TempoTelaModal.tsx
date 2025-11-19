import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/Colors';

type OptionType = {
  label: string;
  value: number;
  subLabel?: string;
};

interface TempoTelaModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: number) => void;
  currentValue?: number;
  options: OptionType[];
}

const TempoTelaModal = ({
  visible,
  onClose,
  onSelect,
  currentValue,
  options,
}: TempoTelaModalProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View
          style={styles.modalView}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.modalTitle}>Alerta de Tempo de Tela</Text>
          <Text style={styles.modalSubTitle}>
            Quanto tempo antes de dormir você quer ser avisado?
          </Text>

          <View style={styles.optionsRow}>
            {options.map((opt) => {
              const isSelected = opt.value === currentValue;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => onSelect(opt.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.subLabel && (
                    <Text
                      style={[
                        styles.optionSubText,
                        isSelected && styles.optionSubTextSelected,
                      ]}
                    >
                      {opt.subLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.modalButton, { alignSelf: 'flex-end' }]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    backgroundColor: COLORS.fundo,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    marginBottom: 8,
  },
  modalSubTitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textoSecundario,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  optionButton: {
    backgroundColor: COLORS.secundario,
    borderRadius: 12,
    paddingVertical: 14,
    margin: 6,
    alignItems: 'center',
    minWidth: '40%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.destaque,
    borderColor: COLORS.destaque,
  },
  optionText: {
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  optionTextSelected: {
    color: COLORS.fundo,
    fontFamily: 'Inter_600SemiBold',
  },
  optionSubText: {
    color: COLORS.textoSecundario,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  optionSubTextSelected: {
    color: COLORS.fundo,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
    marginTop: 20,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.destaque,
  },
});

export default TempoTelaModal;
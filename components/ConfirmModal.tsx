import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { COLORS } from '../constants/Colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Apagar',
  cancelText = 'Cancelar',
}: ConfirmModalProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirmDelete]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonTextConfirmDelete}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textoSecundario,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
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
  modalButtonConfirmDelete: {
    backgroundColor: COLORS.ruim,
  },
  modalButtonTextConfirmDelete: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textoPrimario,
  },
});

export default ConfirmModal
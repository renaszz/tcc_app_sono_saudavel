import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { COLORS } from '../constants/Colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  title: string;
  initialText: string;
  placeholder?: string;
  isMultiline?: boolean;
};

export default function InputModal({
  visible,
  onClose,
  onConfirm,
  title,
  initialText,
  placeholder,
  isMultiline = false,
}: Props) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setText(initialText);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, initialText]);

  const handleSend = () => {
    onConfirm(text);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback onPress={onClose}>
              <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>

            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {/* Botão X removido conforme pedido */}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, isMultiline && styles.multilineInput]}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textoSecundario}
                  value={text}
                  onChangeText={setText}
                  multiline={isMultiline}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Ionicons name="arrow-up" size={24} color={COLORS.fundo} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.secundario,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.destaque,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.fundo,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textoPrimario,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginRight: 12,
    maxHeight: 120,
  },
  multilineInput: {
    minHeight: 50,
    paddingTop: 12,
  },
  sendButton: {
    backgroundColor: COLORS.destaque,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
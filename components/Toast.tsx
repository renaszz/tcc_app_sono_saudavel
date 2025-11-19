import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/Colors';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  duration?: number;
}

const Toast = ({
  message,
  isVisible,
  onHide,
  duration = 3000,
}: ToastProps) => {
  const [fadeAnim] = useState(new Animated.Value(0)); 
  const backgroundColor = COLORS.destaque;
  const iconColor = COLORS.fundo;
  const textColor = COLORS.fundo;
  const iconName = 'checkmark-circle-outline';

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        const timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => onHide()); 
        }, duration);

        return () => clearTimeout(timer); 
      });
    } else {
      fadeAnim.setValue(0); 
    }
  }, [isVisible, fadeAnim, duration, onHide]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
      <View style={[styles.toast, { backgroundColor }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
        <Text style={[styles.toastText, { color: textColor }]}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 20, 
    right: 20, 
    left: 20, 
    zIndex: 1000, 
    alignItems: 'flex-end', 
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    maxWidth: 300, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});

export default Toast;
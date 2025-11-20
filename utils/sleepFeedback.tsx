import { COLORS } from '../constants/Colors';

export const getFeedbackMetaSono = (minutos: number) => {
  const horas = minutos / 60;
  
  if (horas < 6) {
    return {
      msg: 'Atenção: é pouco tempo de sono.',
      color: COLORS.ruim,
      icon: 'alert-circle-outline' as const
    };
  }

  if (horas >= 6 && horas < 7) {
    return {
      msg: 'Aceitável. Tente dormir um pouco mais.',
      color: COLORS.ok, 
      icon: 'warning-outline' as const
    };
  }

  if (horas >= 7 && horas <= 9) {
    return {
      msg: 'Excelente! Essa é a faixa ideal.',
      color: COLORS.bom,
      icon: 'checkmark-circle-outline' as const
    };
  }

  if (horas > 9 && horas <= 10) {
    return {
      msg: 'Um pouco acima da média recomendada.',
      color: COLORS.ok,
      icon: 'time-outline' as const
    };
  }

  return {
    msg: 'Muito longo. Pode causar cansaço.',
    color: COLORS.ruim,
    icon: 'alert-circle-outline' as const
  };
};
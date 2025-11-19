import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase
} from 'expo-sqlite';
import React, { ReactNode, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/Colors';

const DATABASE_NAME = "goodsleep.db";
const DATABASE_VERSION = 1;

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  
  let currentDbVersion = 0;
  if (result !== null) {
    currentDbVersion = result.user_version;
  }

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      -- Tabela de Registros Diários
      CREATE TABLE IF NOT EXISTS registros_sono (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        qualidade TEXT NOT NULL,
        tempo_tela_min INTEGER,
        duracao_horas REAL NOT NULL,
        observacoes TEXT,
        sentimento_acordar TEXT
      );

      -- Tabela de Metas (Squash: Todas as colunas já nascem aqui)
      CREATE TABLE IF NOT EXISTS metas (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        meta_sono_horas REAL NOT NULL DEFAULT 8,
        meta_horario_dormir_minutos INTEGER NOT NULL DEFAULT 1380,
        meta_alerta_tela_minutos INTEGER NOT NULL DEFAULT 45,
        notificacao_tela_ativa INTEGER NOT NULL DEFAULT 1,
        nome_usuario TEXT,
        onboarding_concluido INTEGER NOT NULL DEFAULT 0,
        notificacoes_ativas INTEGER NOT NULL DEFAULT 1
      );

      -- Inicializa a meta padrão
      INSERT OR IGNORE INTO metas (id, meta_sono_horas, meta_horario_dormir_minutos, meta_alerta_tela_minutos) 
      VALUES (1, 8, 1380, 45);

      -- Tabela de Dicas
      CREATE TABLE IF NOT EXISTS dicas_sono (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        resumo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        categoria TEXT NOT NULL
      );

      -- Insere as dicas iniciais
      INSERT INTO dicas_sono (titulo, resumo, conteudo, categoria) VALUES
        ('Evite Telas Antes de Dormir', 'A luz azul de celulares e TVs inibe a produção de melatonina, o hormônio do sono.', 'A exposição à luz azul emitida por smartphones, tablets e computadores nas horas que antecedem o sono pode enganar seu cérebro, fazendo-o pensar que ainda é dia. Isso suprime a liberação de melatonina, hormônio essencial para induzir o sono, dificultando o adormecer e piorando a qualidade do descanso. Tente definir um "toque de recolher digital" pelo menos 60 minutos antes de ir para a cama.', 'Higiene do Sono'),
        ('Mantenha um Horário Regular', 'Tente dormir e acordar na mesma hora todos os dias, mesmo nos fins de semana.', 'Nosso corpo funciona com base em um relógio biológico interno chamado ritmo circadiano. Manter uma rotina de sono consistente ajuda a regular esse relógio, melhorando a qualidade do sono a longo prazo. Ir para a cama e acordar em horários aleatórios pode causar sintomas semelhantes aos do jet lag, deixando você cansado e indisposto.', 'Rotina'),
        ('O Poder da Melatonina', 'Entenda como funciona o "hormônio do vampiro" e como ele regula seu sono.', 'A melatonina é um hormônio produzido naturalmente pela glândula pineal no cérebro. Sua produção é estimulada pela escuridão e inibida pela luz. Ela sinaliza ao corpo que é hora de se preparar para dormir. É por isso que criar um ambiente escuro e relaxante à noite é tão crucial para um bom sono.', 'Ciência do Sono'),
        ('Cuidado com a Cafeína', 'Evite café, chás pretos e refrigerantes pelo menos 6 horas antes de dormir.', 'A cafeína é um estimulante poderoso que bloqueia a adenosina, uma substância química no cérebro que promove o sono. Embora você possa sentir que "não faz efeito", a cafeína tem uma meia-vida longa e pode fragmentar seu sono, impedindo que você alcance os estágios mais profundos e restauradores, mesmo que consiga adormecer.', 'Alimentação'),
        ('O Quarto é para Dormir', 'Use seu quarto apenas para dormir e atividades íntimas. Evite trabalhar ou assistir TV na cama.', 'Associar sua cama a outras atividades, como trabalho, estudos ou assistir a séries, pode criar uma associação mental errada. Seu cérebro pode começar a ver a cama como um local de alerta e estresse, em vez de um local de descanso. Mantenha essas atividades em outras áreas da casa para fortalecer a associação cérebro-cama-sono.', 'Higiene do Sono'),
        ('Exercício Físico: O Aliado', 'Atividades físicas regulares melhoram a profundidade e a qualidade do sono.', 'O exercício físico ajuda a reduzir o estresse e a ansiedade, além de regular o relógio biológico. No entanto, tente evitar exercícios muito intensos perto da hora de dormir, pois eles podem aumentar a adrenalina e a temperatura corporal, dificultando o relaxamento inicial. Atividades moderadas pela manhã ou tarde são ideAIS.', 'Estilo de Vida'),
        ('A Importância do Sono REM', 'O estágio dos sonhos é crucial para a memória e o processamento emocional.', 'Durante o sono REM (Rapid Eye Movement), seu cérebro está muito ativo, consolidando memórias, processando emoções do dia e "limpando" informações irrelevantes. A privação do sono REM, muitas vezes causada por álcool ou interrupções, pode afetar negativamente seu humor, criatividade e capacidade de aprendizado.', 'Ciência do Sono');
    `);
    
    currentDbVersion = 1;
  }
  
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

function LoadingComponent() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.destaque} />
    </View>
  );
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        useSuspense
      >
        {children}
      </SQLiteProvider>
    </Suspense>
  );
}

export function useDatabase() {
  return useSQLiteContext();
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fundo,
  },
});
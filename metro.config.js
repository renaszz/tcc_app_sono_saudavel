// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Garante que 'ttf' e 'otf' sejam tratados como assets
const defaultAssetExts = config.resolver.assetExts;

config.resolver.assetExts = [
  ...defaultAssetExts,
  'ttf', // Adiciona ttf se não estiver
  'otf', // Adiciona otf se não estiver
];

module.exports = config;
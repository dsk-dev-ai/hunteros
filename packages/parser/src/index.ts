export { FileIndexer } from './file-indexer.js';
export { detectLanguage, isGenerated, isTestFile, isConfigFile, getLanguageFromContent } from './language-detector.js';
export { detectPackageManager, readPackageJson } from './package-manager-detector.js';
export type { PackageJsonInfo } from './package-manager-detector.js';

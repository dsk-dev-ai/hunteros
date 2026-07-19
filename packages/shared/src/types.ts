export interface RepositoryInfo {
  path: string;
  name: string;
  remoteUrl?: string;
  branch: string;
  commitHash?: string;
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  packageManager?: PackageManager;
  fileCount: number;
  sizeBytes: number;
}

export interface LanguageInfo {
  name: string;
  percentage: number;
  files: number;
}

export interface FrameworkInfo {
  name: string;
  version?: string;
  category: FrameworkCategory;
  confidence: number;
}

export enum FrameworkCategory {
  Frontend = 'frontend',
  Backend = 'backend',
  Fullstack = 'fullstack',
  Database = 'database',
  Auth = 'auth',
  Testing = 'testing',
  Build = 'build',
  Other = 'other',
}

export enum PackageManager {
  Npm = 'npm',
  Yarn = 'yarn',
  Pnpm = 'pnpm',
  Bun = 'bun',
  Unknown = 'unknown',
}

export interface FileInfo {
  path: string;
  language: string;
  size: number;
  lines: number;
  isGenerated: boolean;
  isTest: boolean;
  isConfig: boolean;
}

export interface FileIndex {
  files: FileInfo[];
  totalFiles: number;
  totalLines: number;
  languages: Map<string, number>;
}

export interface ASTNode {
  id: string;
  type: ASTNodeType;
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  metadata: Record<string, unknown>;
  children: ASTNode[];
  parentId?: string;
}

export enum ASTNodeType {
  Import = 'import',
  Export = 'export',
  Class = 'class',
  Function = 'function',
  ArrowFunction = 'arrow_function',
  Method = 'method',
  Variable = 'variable',
  Interface = 'interface',
  TypeAlias = 'type_alias',
  Route = 'route',
  Middleware = 'middleware',
  DatabaseCall = 'database_call',
  HttpHandler = 'http_handler',
  FileSystemAccess = 'filesystem_access',
  EnvVarAccess = 'env_var_access',
  Decorator = 'decorator',
  Unknown = 'unknown',
}

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  name: string;
  filePath: string;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: GraphEdgeType;
  metadata: Record<string, unknown>;
}

export enum GraphNodeType {
  File = 'file',
  Directory = 'directory',
  Symbol = 'symbol',
  Function = 'function',
  Class = 'class',
  Module = 'module',
  Route = 'route',
  Service = 'service',
  Repository = 'repository',
  Controller = 'controller',
  Middleware = 'middleware',
}

export enum GraphEdgeType {
  Imports = 'imports',
  Exports = 'exports',
  Calls = 'calls',
  Extends = 'extends',
  Implements = 'implements',
  Contains = 'contains',
  Defines = 'defines',
  Routes = 'routes',
  Middleware = 'middleware',
  Dependency = 'dependency',
}

export interface AnalysisResult {
  filePath: string;
  findings: Finding[];
  score: number;
  metadata: Record<string, unknown>;
}

export interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  message: string;
  filePath: string;
  startLine: number;
  endLine: number;
  category: FindingCategory;
  framework?: string;
  reviewPriority: number;
  metadata: Record<string, unknown>;
}

export enum FindingType {
  AuthModule = 'auth_module',
  AuthLogic = 'auth_logic',
  ApiRoute = 'api_route',
  UploadHandler = 'upload_handler',
  Configuration = 'configuration',
  Secrets = 'secrets',
  DatabaseAccess = 'database_access',
  NetworkAccess = 'network_access',
  CacheUsage = 'cache_usage',
  Cryptography = 'cryptography',
  FileSystemAccess = 'filesystem_access',
  EnvVarAccess = 'env_var_access',
  InputValidation = 'input_validation',
  OutputEncoding = 'output_encoding',
  DangerousFunction = 'dangerous_function',
  InformationExposure = 'information_exposure',
}

export enum Severity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  Info = 'info',
}

export enum FindingCategory {
  Authentication = 'authentication',
  Authorization = 'authorization',
  InputValidation = 'input_validation',
  Cryptography = 'cryptography',
  Secrets = 'secrets',
  Configuration = 'configuration',
  DataAccess = 'data_access',
  Network = 'network',
  FileSystem = 'filesystem',
  ErrorHandling = 'error_handling',
  Logging = 'logging',
  Dependency = 'dependency',
  Other = 'other',
}

export interface ReviewContext {
  repository: RepositoryInfo;
  fileIndex: FileIndex;
  astNodes: ASTNode[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  analysis: AnalysisResult[];
  findings: Finding[];
}

export interface ScanConfig {
  path: string;
  depth: number;
  ignorePatterns: string[];
  includePatterns: string[];
  frameworks: string[];
  maxFileSize: number;
  enableAst: boolean;
  enableGraph: boolean;
  enableAi: boolean;
  aiProvider?: string;
  aiApiKey?: string;
  aiModel?: string;
}

export interface ScanProgress {
  phase: string;
  total: number;
  completed: number;
  current: string;
}

export type ScanCallback = (progress: ScanProgress) => void | Promise<void>;

export interface Report {
  id: string;
  timestamp: string;
  repository: RepositoryInfo;
  summary: ReportSummary;
  findings: Finding[];
  sections: ReportSection[];
}

export interface ReportSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  topFrameworks: string[];
  totalFiles: number;
}

export interface ReportSection {
  title: string;
  type: string;
  content: string;
  findings: Finding[];
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  entryPoint: string;
  type: PluginType;
  hooks: string[];
}

export enum PluginType {
  Analyzer = 'analyzer',
  Reporter = 'reporter',
  FrameworkDetector = 'framework_detector',
  AiProvider = 'ai_provider',
  Scanner = 'scanner',
}

export interface ToolRunResult {
  toolName: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timestamp: string;
}

export interface VulnerabilityFinding {
  id: string;
  toolName: string;
  title: string;
  description: string;
  severity: Severity;
  category: FindingCategory;
  target: string;
  cve?: string;
  cvss?: number;
  evidence: string;
  remediation: string;
  references: string[];
  falsePositive: boolean;
  triageNotes: string;
  aiAnalysis?: string;
}

export interface ScanTarget {
  type: 'url' | 'host' | 'ip' | 'domain' | 'file' | 'directory' | 'network';
  value: string;
  port?: number;
  protocol?: string;
}

export interface VulnerabilityReport {
  id: string;
  timestamp: string;
  target: ScanTarget;
  toolResults: ToolRunResult[];
  findings: VulnerabilityFinding[];
  summary: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    falsePositives: number;
    confirmedBugs: number;
    toolsUsed: string[];
    durationMs: number;
  };
  triageSummary: string;
  aiSummary: string;
}

export interface TriageResult {
  findingId: string;
  isRealBug: boolean;
  confidence: number;
  severity: Severity;
  priority: number;
  notes: string;
  escalationPath: string;
  suggestedAssignee: string;
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseUrl?: string;
}

export interface AIAnalysisRequest {
  files: string[];
  astSummaries: ASTSummary[];
  callPaths: string[];
  relatedModules: string[];
  frameworkInfo: FrameworkInfo[];
  reviewPriority: number;
  findings: Finding[];
}

export interface ASTSummary {
  filePath: string;
  language: string;
  exports: string[];
  imports: string[];
  classes: string[];
  functions: string[];
  routes: string[];
  databaseCalls: string[];
  httpHandlers: string[];
  filesystemAccess: string[];
  envVarAccess: string[];
}

export interface AIAnalysisResponse {
  summary: string;
  explanation: string;
  areasToInvestigate: string[];
  suggestedQueries: string[];
  riskScore: number;
}

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  output: LogOutput;
  filePath?: string;
}

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Silent = 'silent',
}

export enum LogFormat {
  Text = 'text',
  Json = 'json',
  Pretty = 'pretty',
}

export enum LogOutput {
  Stdout = 'stdout',
  File = 'file',
  Both = 'both',
}

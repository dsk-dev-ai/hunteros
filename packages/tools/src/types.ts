export interface ToolInfo {
  name: string;
  installed: boolean;
  version: string;
  executablePath: string;
  category?: string;
}

export interface ToolReport {
  tools: ToolInfo[];
  timestamp: string;
  totalInstalled: number;
  totalAvailable: number;
}

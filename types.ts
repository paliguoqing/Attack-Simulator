
export enum ActionType {
  WEB = 'web',
  SHELL = 'shell',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum WebExecutionMode {
  SERVER_CURL = 'server_curl', // Execute via backend using curl
  BROWSER_AJAX = 'browser_ajax', // Execute directly from browser using fetch
}

export interface WebActionDetails {
  type: ActionType.WEB;
  method: HttpMethod;
  url: string; // Can be relative or absolute. If relative, defaultTargetUri will be prepended.
  payload?: string; 
  headers?: Record<string, string>;
  executionMode?: WebExecutionMode; // Defaults to SERVER_CURL if undefined
}

export interface ShellActionDetails {
  type: ActionType.SHELL;
  script: string;
}

export interface AttackAction {
  id: string;
  name: string;
  description?: string;
  details: WebActionDetails | ShellActionDetails;
}

export interface AttackGroup {
  id: string;
  name: string;
  description?: string;
  actions: AttackAction[];
}

// User-specific settings
export interface UserSettings {
  credentials: {
    username: string;
    password?: string; // Password can be optional if not set
  };
  defaultTargetUri?: string; // Universal target URI for web attacks
}

// Configuration for attack scenarios (template/working set)
export interface AppConfig {
  version: string;
  attackGroups: AttackGroup[];
}

export interface SimulatedExecution {
  command: string;
  output: string;
  timestamp: string;
}

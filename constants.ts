
import { AppConfig, UserSettings, ActionType, HttpMethod } from './types';
// import { v4 as uuidv4 } from 'uuid'; // uuidv4 is no longer needed here as IDs will come from template.json

export const APP_VERSION = "1.27"; 

export const DEFAULT_USERNAME = "prisma_architect";
export const DEFAULT_PASSWORD = "superSecurePassword!23";
export const DEFAULT_TARGET_URI = "http://twistlock.guoqing.li:8081/";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  credentials: {
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
  },
  defaultTargetUri: DEFAULT_TARGET_URI,
};

// DEFAULT_ATTACK_CONFIG is now removed. It will be fetched from public/template.json
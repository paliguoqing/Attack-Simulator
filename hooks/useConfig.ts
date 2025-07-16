
import { useState, useEffect, useCallback } from 'react';
import { AppConfig, UserSettings, AttackGroup, AttackAction } from '../types';
import { APP_VERSION, DEFAULT_USER_SETTINGS, DEFAULT_TARGET_URI, DEFAULT_USERNAME, DEFAULT_PASSWORD } from '../constants'; // No DEFAULT_ATTACK_CONFIG
import { v4 as uuidv4 } from 'uuid';

const OLD_CONFIG_STORAGE_KEY = 'attackSimulatorConfig'; // For migration
const USER_SETTINGS_STORAGE_KEY = 'attackSimulatorUserSettings_v1';
const ATTACK_CONFIG_STORAGE_KEY = 'attackSimulatorAttackConfig_v1';

// Helper type for the old combined config structure for migration
interface OldAppConfig extends AppConfig {
  credentials?: {
    username: string;
    password?: string;
  };
  defaultTargetUri?: string;
}

const MINIMAL_ATTACK_CONFIG: AppConfig = {
  version: APP_VERSION, // Or a specific "loading" version
  attackGroups: [],
};

export const useConfig = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [attackConfig, setAttackConfig] = useState<AppConfig>(MINIMAL_ATTACK_CONFIG);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(true); // Start as true

  // Effect for initial loading, migration, and template fetching
  useEffect(() => {
    let migrated = false;
    // Try to load from new keys first
    const storedUserSettingsStr = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    const storedAttackConfigStr = localStorage.getItem(ATTACK_CONFIG_STORAGE_KEY);

    let initialUserSettings = DEFAULT_USER_SETTINGS;
    let initialAttackConfig: AppConfig | null = null; // Will be set by storage or fetch

    if (storedUserSettingsStr) {
      try {
        initialUserSettings = JSON.parse(storedUserSettingsStr) as UserSettings;
      } catch (error) {
        console.error("Failed to parse stored user settings:", error);
      }
    }
    setUserSettings(initialUserSettings);


    if (storedAttackConfigStr) {
      try {
        initialAttackConfig = JSON.parse(storedAttackConfigStr) as AppConfig;
        setAttackConfig(initialAttackConfig);
        setIsLoadingTemplate(false); // Loaded from storage
      } catch (error) {
        console.error("Failed to parse stored attack config:", error);
        // Will proceed to fetch if parsing failed
      }
    }
    
    // If attack config not loaded from new key, try to migrate from old key OR fetch template
    if (!initialAttackConfig) {
      const oldStoredConfigStr = localStorage.getItem(OLD_CONFIG_STORAGE_KEY);
      if (oldStoredConfigStr) {
        try {
          const oldParsedConfig = JSON.parse(oldStoredConfigStr) as OldAppConfig;
          
          const migratedUserSettings: UserSettings = {
            credentials: oldParsedConfig.credentials || { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD },
            defaultTargetUri: oldParsedConfig.defaultTargetUri || DEFAULT_TARGET_URI,
          };
          
          const migratedAttackConfig: AppConfig = {
            version: oldParsedConfig.version,
            attackGroups: oldParsedConfig.attackGroups,
          };

          setUserSettings(migratedUserSettings); // Overwrite if migration happens
          setAttackConfig(migratedAttackConfig);
          
          localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(migratedUserSettings));
          localStorage.setItem(ATTACK_CONFIG_STORAGE_KEY, JSON.stringify(migratedAttackConfig));
          
          localStorage.removeItem(OLD_CONFIG_STORAGE_KEY); 
          migrated = true;
          setIsLoadingTemplate(false);
        } catch (error) {
          console.error("Failed to migrate from old config:", error);
          // Fallback to fetching template if migration fails
        }
      }

      // If not migrated and not loaded from new key, fetch the template
      if (!migrated && !initialAttackConfig) {
        setIsLoadingTemplate(true);
        fetch('/template.json')
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch template.json: ${response.statusText}`);
            }
            return response.json();
          })
          .then((data: AppConfig) => {
            setAttackConfig(data);
            localStorage.setItem(ATTACK_CONFIG_STORAGE_KEY, JSON.stringify(data)); // Store fetched template
          })
          .catch(error => {
            console.error("Error fetching or parsing template.json:", error);
            setAttackConfig(MINIMAL_ATTACK_CONFIG); // Fallback to minimal on error
            // Optionally save this minimal config to local storage to prevent re-fetch attempts on error
            localStorage.setItem(ATTACK_CONFIG_STORAGE_KEY, JSON.stringify(MINIMAL_ATTACK_CONFIG));
          })
          .finally(() => {
            setIsLoadingTemplate(false);
          });
      }
    }
  }, []);


  useEffect(() => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    // Persist attackConfig whenever it changes, provided template loading is complete.
    // This ensures user modifications (like deleting all groups) are saved.
    if (!isLoadingTemplate) {
      localStorage.setItem(ATTACK_CONFIG_STORAGE_KEY, JSON.stringify(attackConfig));
    }
  }, [attackConfig, isLoadingTemplate]);

  const updateDefaultTargetUri = useCallback((uri: string) => {
    setUserSettings(prev => ({ ...prev, defaultTargetUri: uri || DEFAULT_TARGET_URI }));
  }, []);

  const addGroup = useCallback((name: string, description?: string) => {
    const newGroup: AttackGroup = { id: uuidv4(), name, description, actions: [] };
    setAttackConfig(prev => ({ ...prev, attackGroups: [...prev.attackGroups, newGroup] }));
  }, []);

  const updateGroup = useCallback((groupId: string, name: string, description?: string) => {
    setAttackConfig(prev => ({
      ...prev,
      attackGroups: prev.attackGroups.map(g => 
        g.id === groupId ? { ...g, name, description } : g
      ),
    }));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setAttackConfig(prev => ({
      ...prev,
      attackGroups: prev.attackGroups.filter(g => g.id !== groupId),
    }));
  }, []);

  const addAction = useCallback((groupId: string, action: Omit<AttackAction, 'id'>) => {
    const newAction: AttackAction = { ...action, id: uuidv4() };
    setAttackConfig(prev => ({
      ...prev,
      attackGroups: prev.attackGroups.map(g =>
        g.id === groupId ? { ...g, actions: [...g.actions, newAction] } : g
      ),
    }));
  }, []);

  const updateAction = useCallback((groupId: string, actionId: string, updatedAction: Omit<AttackAction, 'id'>) => {
    setAttackConfig(prev => ({
      ...prev,
      attackGroups: prev.attackGroups.map(g =>
        g.id === groupId
          ? { ...g, actions: g.actions.map(a => a.id === actionId ? { ...updatedAction, id: actionId } : a) }
          : g
      ),
    }));
  }, []);

  const deleteAction = useCallback((groupId: string, actionId: string) => {
    setAttackConfig(prev => ({
      ...prev,
      attackGroups: prev.attackGroups.map(g =>
        g.id === groupId ? { ...g, actions: g.actions.filter(a => a.id !== actionId) } : g
      ),
    }));
  }, []);

  const importConfig = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const newAttackCfg = JSON.parse(text) as AppConfig;
        
        if (newAttackCfg && typeof newAttackCfg.version === 'string' && Array.isArray(newAttackCfg.attackGroups)) {
          setAttackConfig(newAttackCfg);
          alert('Attack template imported successfully!');
        } else {
          throw new Error('Invalid attack template file format. Expected version and attackGroups.');
        }
      } catch (error) {
        console.error("Failed to import attack template:", error);
        alert(`Error importing attack template: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const exportConfig = useCallback(() => {
    const jsonString = JSON.stringify(attackConfig, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'attack-template-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }, [attackConfig]);
  
  const resetToDefaults = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all configurations (attack template and user settings) to default? This action cannot be undone.")) {
      setUserSettings(DEFAULT_USER_SETTINGS); // Reset user settings

      setIsLoadingTemplate(true); // Indicate template is being (re)loaded
      fetch('/template.json')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch template.json for reset: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data: AppConfig) => {
          setAttackConfig(data);
          localStorage.setItem(ATTACK_CONFIG_STORAGE_KEY, JSON.stringify(data)); // Store fresh template
          alert("Configuration and user settings have been reset to defaults.");
        })
        .catch(error => {
          console.error("Error fetching template.json during reset:", error);
          setAttackConfig(MINIMAL_ATTACK_CONFIG); // Fallback
          localStorage.setItem(ATTACK_CONFIG_STORAGE_KEY, JSON.stringify(MINIMAL_ATTACK_CONFIG));
          alert("User settings reset. Failed to reset attack template from server, using minimal template.");
        })
        .finally(() => {
          setIsLoadingTemplate(false);
        });
    }
  }, []);

  return {
    userSettings,
    attackConfig,
    isLoadingTemplate, // Expose loading state
    updateDefaultTargetUri,
    setAttackConfig,
    addGroup,
    updateGroup,
    deleteGroup,
    addAction,
    updateAction,
    deleteAction,
    importConfig,
    exportConfig,
    resetToDefaults,
  };
};
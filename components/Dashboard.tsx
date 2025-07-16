
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useConfig } from '../hooks/useConfig';
import { useAuth } from '../hooks/useAuth';
import { AttackGroup as AttackGroupType, AttackAction, AppConfig, UserSettings } from '../types';
import { AttackGroup } from './AttackGroup';
import { AddEditGroupModal } from './AddEditGroupModal';
import { PlusIcon } from './icons/PlusIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { PencilIcon } from './icons/PencilIcon'; 
import { APP_VERSION } from '../constants'; // Ensure APP_VERSION is imported

export const Dashboard: React.FC = () => {
  const {
    userSettings,
    attackConfig,
    isLoadingTemplate, // Consume new loading state
    updateDefaultTargetUri,
    addGroup,
    updateGroup,
    deleteGroup,
    addAction,
    updateAction,
    deleteAction,
    importConfig,
    exportConfig,
    resetToDefaults,
  } = useConfig();
  
  const { logout, isAuthenticated } = useAuth();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AttackGroupType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tempDefaultTargetUri, setTempDefaultTargetUri] = useState(userSettings?.defaultTargetUri || '');

  useEffect(() => {
    if (userSettings) {
      setTempDefaultTargetUri(userSettings.defaultTargetUri || '');
    }
  }, [userSettings?.defaultTargetUri]);


  const handleOpenAddGroupModal = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroupModal = (group: AttackGroupType) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = (name: string, description?: string) => {
    if (editingGroup) {
      updateGroup(editingGroup.id, name, description);
    } else {
      addGroup(name, description);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConfig(file);
    }
    if(event.target) event.target.value = '';
  };

  const handleSaveDefaultTargetUri = () => {
    const trimmedUri = tempDefaultTargetUri.trim();
    if (trimmedUri === '' || (trimmedUri.startsWith('http://') || trimmedUri.startsWith('https://'))) {
      updateDefaultTargetUri(trimmedUri);
      alert('Default Target URI updated successfully.');
    } else {
      alert('Invalid URI. Please enter a valid HTTP/HTTPS URL or leave blank to clear.');
      setTempDefaultTargetUri(userSettings?.defaultTargetUri || ''); 
    }
  };
  
  if (!isAuthenticated || !userSettings ) { 
    return <p className="text-center p-8">Loading user settings or redirecting to login...</p>;
  }
  
  // Check if attackConfig itself is loaded. It could be null/undefined initially before fetch.
  if (isLoadingTemplate || !attackConfig) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
            <svg className="animate-spin-slow h-16 w-16 text-primary-600 dark:text-primary-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">Loading Attack Template...</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Please wait while we prepare the simulation environment.</p>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-4 md:p-8 flex flex-col">
      <div className="flex-grow">
        <header className="mb-8 pb-4 border-b border-neutral-300 dark:border-neutral-700">
          <div className="container mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-red-500 dark:from-primary-400 dark:to-red-400">
                Attack Scenario Simulator
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={handleImportClick}
                  title="Import Attack Template"
                  className="btn btn-secondary"
                >
                  <UploadIcon className="w-5 h-5 mr-2" /> Import Template
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={exportConfig}
                  title="Export Attack Template"
                  className="btn btn-secondary"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" /> Export Template
                </button>
                 <button
                  onClick={resetToDefaults}
                  title="Reset All to Defaults"
                  className="btn btn-danger-secondary"
                >
                   Reset All Defaults
                </button>
                <button 
                  onClick={logout} 
                  title="Logout"
                  className="btn btn-danger"
                >
                  <LogoutIcon className="w-5 h-5 mr-1 sm:mr-2" /> Logout
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow">
              <label htmlFor="defaultTargetUri" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Default Target URI for Web Attacks (optional):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  id="defaultTargetUri"
                  value={tempDefaultTargetUri}
                  onChange={(e) => setTempDefaultTargetUri(e.target.value)}
                  placeholder="e.g., http://target-app.example.com"
                  className="flex-grow px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-neutral-700 dark:text-neutral-50"
                />
                <button
                  onClick={handleSaveDefaultTargetUri}
                  title="Save Default URI"
                  className="btn btn-primary px-3 py-2"
                  aria-label="Save Default Target URI"
                >
                  <PencilIcon className="w-5 h-5" /> 
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                If an action's URL is relative (e.g., "/login"), it will be appended to this URI. Absolute URLs in actions will override this. Leave blank if not needed.
              </p>
            </div>
          </div>
        </header>

        <div className="container mx-auto">
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleOpenAddGroupModal}
              className="btn btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" /> Add Attack Group
            </button>
          </div>

          {attackConfig.attackGroups.length === 0 && !isLoadingTemplate && (
            <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
              <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-neutral-900 dark:text-neutral-100">No attack groups found</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Get started by creating a new attack group or import a template.</p>
            </div>
          )}

          {attackConfig.attackGroups.map((group) => (
            <AttackGroup
              key={group.id}
              group={group}
              defaultTargetUri={userSettings.defaultTargetUri}
              onUpdateGroup={updateGroup}
              onDeleteGroup={deleteGroup}
              onAddAction={(groupId, actionData: Omit<AttackAction, 'id'>) => addAction(groupId, actionData)}
              onUpdateAction={(groupId, actionId, updatedActionData: Omit<AttackAction, 'id'>) => updateAction(groupId, actionId, updatedActionData)}
              onDeleteAction={deleteAction}
              onEditGroup={() => handleOpenEditGroupModal(group)}
            />
          ))}
        </div>
      </div>
      
      <footer className="container mx-auto mt-12 mb-6 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-500 cursor-default">
          Produced by National, Prisma Cloud Solution Architect
          <br />
          Powered by Gemini
        </p>
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-1">
          Version {APP_VERSION}
        </p>
      </footer>

      <AddEditGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleSaveGroup}
        group={editingGroup}
      />
      <style>{`
        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem; /* rounded-md */
          font-weight: 500; /* font-medium */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
          border: 1px solid transparent;
        }
        .btn-primary {
          background-color: #3b82f6; /* primary-600 */
          color: white;
        }
        .btn-primary:hover {
          background-color: #2563eb; /* primary-700 */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
        }
        .btn-secondary {
          background-color: #e5e7eb; /* neutral-200 */
          color: #1f2937; /* neutral-800 */
          border-color: #d1d5db; /* neutral-300 */
        }
        .dark .btn-secondary {
          background-color: #4b5563; /* dark:neutral-600 */
          color: #f3f4f6; /* dark:text-neutral-100 */
          border-color: #6b7280; /* dark:neutral-500 */
        }
        .btn-secondary:hover {
          background-color: #d1d5db; /* neutral-300 */
        }
        .dark .btn-secondary:hover {
          background-color: #374151; /* dark:neutral-700 */
        }
        .btn-danger {
          background-color: #ef4444; /* red-500 */
          color: white;
        }
        .btn-danger:hover {
          background-color: #dc2626; /* red-600 */
        }
        .btn-danger-secondary {
            background-color: #fee2e2; /* red-100 */
            color: #b91c1c; /* red-700 */
            border-color: #fecaca; /* red-200 */
        }
        .dark .btn-danger-secondary {
            background-color: #3f1212; /* custom dark red */
            color: #fca5a5; /* red-300 */
            border-color: #7f1d1d; /* red-900 */
        }
        .btn-danger-secondary:hover {
            background-color: #fecaca; /* red-200 */
        }
        .dark .btn-danger-secondary:hover {
            background-color: #5b1b1b; /* custom dark red hover */
        }
      `}</style>
    </div>
  );
};

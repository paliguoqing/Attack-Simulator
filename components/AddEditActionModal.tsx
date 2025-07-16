import React, { useState, useEffect, FormEvent } from 'react';
import { Modal } from './Modal';
import { AttackAction, ActionType, HttpMethod, WebActionDetails, ShellActionDetails, WebExecutionMode } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';


interface AddEditActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: Omit<AttackAction, 'id'>) => void;
  action?: AttackAction | null; // For editing
  defaultTargetUri?: string; // Added to provide context
}

const initialWebDetails: WebActionDetails = {
  type: ActionType.WEB,
  method: HttpMethod.GET,
  url: '',
  payload: '',
  headers: {},
  executionMode: WebExecutionMode.SERVER_CURL, // Default execution mode
};

const initialShellDetails: ShellActionDetails = {
  type: ActionType.SHELL,
  script: '',
};

export const AddEditActionModal: React.FC<AddEditActionModalProps> = ({ isOpen, onClose, onSave, action, defaultTargetUri }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<ActionType>(ActionType.WEB);
  const [webDetails, setWebDetails] = useState<WebActionDetails>(initialWebDetails);
  const [shellDetails, setShellDetails] = useState<ShellActionDetails>(initialShellDetails);
  const [headersString, setHeadersString] = useState('');
  const [showAdvancedWebSettings, setShowAdvancedWebSettings] = useState(false);


  useEffect(() => {
    if (action) {
      setName(action.name);
      setDescription(action.description || '');
      setActionType(action.details.type);
      if (action.details.type === ActionType.WEB) {
        setWebDetails({
            ...initialWebDetails, 
            ...action.details, 
        });
        setHeadersString(JSON.stringify(action.details.headers || {}, null, 2));
        setShellDetails(initialShellDetails);
        // Show advanced settings if payload or headers exist
        if (action.details.payload || (action.details.headers && Object.keys(action.details.headers).length > 0)) {
          setShowAdvancedWebSettings(true);
        } else {
          setShowAdvancedWebSettings(false);
        }
      } else {
        setShellDetails(action.details);
        setWebDetails(initialWebDetails);
        setHeadersString('');
        setShowAdvancedWebSettings(false); // Not applicable for shell
      }
    } else {
      setName('');
      setDescription('');
      setActionType(ActionType.WEB);
      setWebDetails(initialWebDetails);
      setShellDetails(initialShellDetails);
      setHeadersString('');
      setShowAdvancedWebSettings(false); // Default for new action
    }
  }, [action, isOpen]);

  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const str = e.target.value;
    setHeadersString(str);
    try {
      const parsedHeaders = str.trim() ? JSON.parse(str) : {};
      setWebDetails(prev => ({ ...prev, headers: parsedHeaders }));
    } catch (err) {
      // Ignore parse error while typing
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Action name cannot be empty.");
      return;
    }

    let details: WebActionDetails | ShellActionDetails;
    if (actionType === ActionType.WEB) {
      if (!webDetails.url.trim()) {
        alert("URL cannot be empty for Web Action.");
        return;
      }
      try {
        const parsedHeaders = headersString.trim() ? JSON.parse(headersString) : {};
        details = { 
            ...webDetails, 
            headers: parsedHeaders, 
            executionMode: webDetails.executionMode || WebExecutionMode.SERVER_CURL 
        };
      } catch (err) {
        alert("Invalid JSON format for headers.");
        return;
      }
    } else {
      if (!shellDetails.script.trim()) {
        alert("Script cannot be empty for Shell Action.");
        return;
      }
      details = shellDetails;
    }

    onSave({ name: name.trim(), description: description.trim() || undefined, details });
    onClose();
  };
  
  const urlPlaceholder = defaultTargetUri 
    ? `e.g., /login (uses ${defaultTargetUri}) or https://othersite.com/api`
    : "https://example.com/api/resource or /relative/path (if default URI is set)";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={action ? 'Edit Attack Action' : 'Add New Attack Action'} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4"> {/* Removed p-1 */}
        <div>
          <label htmlFor="actionName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Action Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="actionName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full input-style"
          />
        </div>
        <div>
          <label htmlFor="actionDescription" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Description (Optional)
          </label>
          <textarea
            id="actionDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full input-style font-mono"
          />
        </div>
        <div>
          <label htmlFor="actionType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Action Type
          </label>
          <select
            id="actionType"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as ActionType)}
            className="mt-1 block w-full input-style"
          >
            <option value={ActionType.WEB}>Web Attack</option>
            <option value={ActionType.SHELL}>Shell Command</option>
          </select>
        </div>

        {actionType === ActionType.WEB && (
          <div className="space-y-4 p-4 border border-neutral-300 dark:border-neutral-600 rounded-md">
            <h3 className="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Web Attack Details</h3>
            <div>
              <label htmlFor="webExecutionMode" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Execution Mode</label>
              <select
                id="webExecutionMode"
                value={webDetails.executionMode || WebExecutionMode.SERVER_CURL}
                onChange={(e) => setWebDetails(prev => ({ ...prev, executionMode: e.target.value as WebExecutionMode }))}
                className="mt-1 block w-full input-style"
              >
                <option value={WebExecutionMode.SERVER_CURL}>Server (cURL via backend)</option>
                <option value={WebExecutionMode.BROWSER_AJAX}>Browser (Opens URL in new tab)</option>
              </select>
               <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Server (cURL) executes on the backend. Browser mode opens the URL in a new tab (primarily for GET requests).
              </p>
            </div>
            <div>
              <label htmlFor="webMethod" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Method</label>
              <select
                id="webMethod"
                value={webDetails.method}
                onChange={(e) => setWebDetails(prev => ({ ...prev, method: e.target.value as HttpMethod }))}
                className="mt-1 block w-full input-style"
              >
                {Object.values(HttpMethod).map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="webUrl" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text" 
                id="webUrl"
                value={webDetails.url}
                onChange={(e) => setWebDetails(prev => ({ ...prev, url: e.target.value }))}
                required
                placeholder={urlPlaceholder}
                className="mt-1 block w-full input-style"
              />
               <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Enter a full URL (e.g., https://...) or a relative path (e.g., /api/data).
                {defaultTargetUri && ` Relative paths will use the default: ${defaultTargetUri}`}
              </p>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedWebSettings(!showAdvancedWebSettings)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none flex items-center"
                aria-expanded={showAdvancedWebSettings}
              >
                {showAdvancedWebSettings ? (
                  <>
                    <ChevronUpIcon className="w-4 h-4 mr-1" /> Hide Advanced Settings
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-4 h-4 mr-1" /> Show Advanced Settings (Payload & Headers)
                  </>
                )}
              </button>
            </div>

            {/* Conditionally Rendered Advanced Settings */}
            {showAdvancedWebSettings && (
              <>
                <div className="pt-2">
                  <label htmlFor="webPayload" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Payload (Optional, e.g., for POST, PUT)</label>
                  <textarea
                    id="webPayload"
                    value={webDetails.payload || ''}
                    onChange={(e) => setWebDetails(prev => ({ ...prev, payload: e.target.value }))}
                    rows={3}
                    placeholder='{"key": "value"} or param1=value1&param2=value2'
                    className="mt-1 block w-full input-style font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="webHeaders" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Headers (Optional, JSON format)</label>
                  <textarea
                    id="webHeaders"
                    value={headersString}
                    onChange={handleHeadersChange}
                    rows={3}
                    placeholder='{ "Content-Type": "application/json", "Authorization": "Bearer ..." }'
                    className="mt-1 block w-full input-style font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {actionType === ActionType.SHELL && (
          <div className="space-y-4 p-4 border border-neutral-300 dark:border-neutral-600 rounded-md">
            <h3 className="text-md font-semibold text-neutral-800 dark:text-neutral-200">Shell Command Details</h3>
            <div>
              <label htmlFor="shellScript" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Script <span className="text-red-500">*</span>
              </label>
              <textarea
                id="shellScript"
                value={shellDetails.script}
                onChange={(e) => setShellDetails(prev => ({ ...prev, script: e.target.value }))}
                rows={5}
                required
                placeholder="echo 'Hello from shell'"
                className="mt-1 block w-full input-style font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800"
          >
            {action ? 'Save Changes' : 'Add Action'}
          </button>
        </div>
      </form>
      <style>{`
        .input-style {
          padding: 0.5rem 0.75rem;
          border-width: 1px;
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
          font-size: 0.875rem; /* text-sm */
          line-height: 1.25rem; /* text-sm */
        }
         .dark .input-style {
          border-color: #4b5563; /* dark:border-neutral-600 */
          background-color: #374151; /* dark:bg-neutral-700 */
          color: #f9fafb; /* dark:text-neutral-50 */
        }
        .input-style::placeholder { /* Ensure placeholder also inherits or has similar color */
            color: #9ca3af; /* neutral-400 */
        }
        .dark .input-style::placeholder {
            color: #6b7280; /* dark:neutral-500 */
        }
        .input-style:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          --tw-ring-color: #3b82f6; /* primary-500 */
          border-color: #3b82f6; /* primary-500 */
        }
      `}</style>
    </Modal>
  );
};


import React, { useState } from 'react';
import { AttackAction, ActionType, SimulatedExecution, WebActionDetails, WebExecutionMode, HttpMethod } from '../types';
import { executionService } from '../services/executionService';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlayIcon } from './icons/PlayIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { Modal } from './Modal'; 
import { getHttpStatusMeaning } from '../utils/httpUtils';

interface AttackActionProps {
  action: AttackAction;
  defaultTargetUri?: string;
  onEdit: () => void;
  onDelete: () => void;
}

interface BackendResponseData {
  stdout?: string;
  stderr?: string;
  exitCode?: number; // Added to capture exit code from backend
  error?: string; // For errors from the /api/execute endpoint itself
}

export const AttackActionCard = ({ action, defaultTargetUri, onEdit, onDelete }: AttackActionProps): JSX.Element => {
  const [executionResult, setExecutionResult] = useState<SimulatedExecution | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('Execution Details');


  const constructFullUrl = (actionUrl: string): string => {
    if (defaultTargetUri && actionUrl && !actionUrl.startsWith('http://') && !actionUrl.startsWith('https://')) {
      const base = defaultTargetUri.endsWith('/') ? defaultTargetUri.slice(0, -1) : defaultTargetUri;
      const path = actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`;
      return base + path;
    }
    return actionUrl;
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setExecutionResult(null);
    setModalContent(''); 
    setModalTitle(`Execution Details: ${action.name}`);
    let commandToDisplay = '';
    let summaryOutput = ''; 
    let fullLogForModal = ''; 

    const actionDetails = action.details;
    const timestamp = new Date().toLocaleString();
    const isoTimestamp = new Date().toISOString();

    try {
      if (actionDetails.type === ActionType.WEB && actionDetails.executionMode === WebExecutionMode.BROWSER_AJAX) {
        const webAction = actionDetails as WebActionDetails;
        const finalUrl = constructFullUrl(webAction.url);
        
        commandToDisplay = `Browser Action: Open URL in new tab`;
        summaryOutput = `Attempting to open URL in a new browser tab/window...\n`;
        summaryOutput += `URL: ${finalUrl}\n`;
        summaryOutput += `Method Specified: ${webAction.method}\n`;
        summaryOutput += `-------------------------------------\n`;
        
        try {
          window.open(finalUrl, '_blank');
          summaryOutput += `Successfully requested to open URL in a new tab.\n`;
          summaryOutput += `Please observe the result in the newly opened tab.\n`;
          summaryOutput += `Note: This method primarily performs a GET request. Defined headers or payload may not be sent.\n`;
          if (webAction.method !== HttpMethod.GET) {
            summaryOutput += `WARNING: The specified method is ${webAction.method}. Opening a URL in a new tab typically results in a GET request. Payloads for POST/PUT etc. will not be submitted this way.\n`;
          }
        } catch (e) {
          summaryOutput += `ERROR: Could not open URL in a new tab. Browser might have blocked the popup.\n`;
          if (e instanceof Error) {
            summaryOutput += `Details: ${e.message}\n`;
          }
        }
        fullLogForModal = summaryOutput; // For consistency if a modal was to be used.

      } else { // Shell action or Web action via Server/cURL
        if (actionDetails.type === ActionType.WEB) { // SERVER_CURL
          commandToDisplay = executionService.generateCurlCommand(actionDetails, defaultTargetUri);
        } else { // SHELL
          commandToDisplay = executionService.getShellCommand(actionDetails);
        }

        const backendResponse = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: commandToDisplay }),
        });

        const data: BackendResponseData = await backendResponse.json();
        let stdout = data.stdout || '';
        let stderr = data.stderr || '';
        const exitCode = data.exitCode; 

        // Prepare full log for the modal first - This structure applies to both ok and not-ok responses if data is parsed
        fullLogForModal = `COMMAND EXECUTED:\n${commandToDisplay}\n\n`;
        if (typeof exitCode === 'number') {
            fullLogForModal += `EXIT CODE: ${exitCode}\n\n`;
        } else {
            fullLogForModal += `EXIT CODE: Not provided by backend or not applicable.\n\n`;
        }
        // For not-ok responses, data.error might contain the server's textual error description
        if (data.error && !backendResponse.ok) { 
            fullLogForModal += `SERVER MESSAGE: ${data.error}\n\n`;
        }
        fullLogForModal += `RAW STDOUT:\n${stdout || '(empty)'}\n\nRAW STDERR:\n${stderr || '(empty)'}\n`;


        if (backendResponse.ok) { // HTTP 200-299
            if (actionDetails.type === ActionType.WEB) { // SERVER_CURL specific parsing
                const statusCodeMarker = "\nCURL_HTTP_STATUS_CODE:";
                let httpStatusCode: string | null = null;
                let responseBody = stdout; 

                const markerIndex = stdout.lastIndexOf(statusCodeMarker);
                if (markerIndex !== -1) {
                    responseBody = stdout.substring(0, markerIndex).trim();
                    const codePart = stdout.substring(markerIndex + statusCodeMarker.length);
                    httpStatusCode = codePart.trim().split('\n')[0]; 
                }

                // Update fullLogForModal specific details for successful WEB actions
                if (httpStatusCode) {
                     fullLogForModal = `COMMAND EXECUTED:\n${commandToDisplay}\n\nEXIT CODE: ${exitCode}\n\nDETECTED HTTP STATUS: ${httpStatusCode} - ${getHttpStatusMeaning(httpStatusCode)}\n\nRESPONSE BODY (from STDOUT):\n${responseBody || '(empty)'}\n\nRAW STDERR:\n${stderr || '(empty)'}\n`;
                } else {
                    fullLogForModal = `COMMAND EXECUTED:\n${commandToDisplay}\n\nEXIT CODE: ${exitCode}\n\nHTTP STATUS: Not detected in raw STDOUT.\n\nRESPONSE BODY (from STDOUT):\n${responseBody || '(empty)'}\n\nRAW STDERR:\n${stderr || '(empty)'}\n`;
                }
                
                // Summary based on exitCode if available (should be 0 for this path)
                if (typeof exitCode === 'number' && exitCode === 0) {
                    summaryOutput = `Curl Command Executed Successfully (Exit Code: 0).\n`;
                    if (httpStatusCode) summaryOutput += `HTTP Status: ${httpStatusCode} - ${getHttpStatusMeaning(httpStatusCode)}.\n`;
                    else summaryOutput += `HTTP Status: Not detected.\n`;
                    if (stderr) summaryOutput += `stderr (may contain progress/info, first line): ${stderr.split('\n')[0]}...\n`;
                } else { 
                     // Should ideally not happen if backendResponse.ok and exitCode is non-zero
                    summaryOutput = `Curl Command completed with Exit Code: ${exitCode} (HTTP OK).\n`;
                    if (httpStatusCode) summaryOutput += `HTTP Status: ${httpStatusCode} - ${getHttpStatusMeaning(httpStatusCode)}.\n`;
                    if (stderr) summaryOutput += `Details (stderr): ${stderr.split('\n')[0]}...\n`;
                }

            } else { // Shell Action (HTTP OK, so exitCode should be 0)
                 fullLogForModal = `COMMAND EXECUTED:\n${commandToDisplay}\n\nEXIT CODE: ${exitCode}\n\nRAW STDOUT:\n${stdout}\n\nRAW STDERR:\n${stderr || '(empty)'}\n`;
                
                if (typeof exitCode === 'number' && exitCode === 0) {
                    summaryOutput = `Shell Command Executed Successfully (Exit Code: 0).\n`;
                    if (stdout.length > 0) summaryOutput += `Output (first 100 chars): ${stdout.substring(0, 100)}${stdout.length > 100 ? '...' : ''}\n`;
                    else summaryOutput += `No STDOUT produced.\n`;
                    if (stderr) summaryOutput += `stderr (may contain progress/info, first line): ${stderr.split('\n')[0]}...\n`;
                } else {
                    // Should ideally not happen if backendResponse.ok and exitCode is non-zero
                    summaryOutput = `Shell Command completed with Exit Code: ${exitCode} (HTTP OK).\n`;
                    if (stderr) summaryOutput += `Details (stderr): ${stderr.split('\n')[0]}...\n`;
                    else if (stdout) summaryOutput += `Output (stdout): ${stdout.substring(0,100)}...\n`;
                }
            }
        } else { // backendResponse not ok (e.g. HTTP 500, 400)
            const actionTypeName = actionDetails.type === ActionType.WEB ? "Curl Command" : "Shell Command";
            if (typeof data.exitCode === 'number' && data.exitCode !== 0) {
                // This was a command execution failure, server correctly reported it with a non-200 HTTP status.
                summaryOutput = `${actionTypeName} Failed (Exit Code: ${data.exitCode}).\n`;
                if (data.stderr) summaryOutput += `Error Details (stderr): ${data.stderr.split('\n')[0]}...\n`;
                else if (data.stdout) summaryOutput += `Output (stdout): ${data.stdout.substring(0,100)}...\n`;
                else summaryOutput += `No output on stdout or stderr for failed command.\n`;
            } else if (data.error) { 
                // A true backend service error, or command might have succeeded but server returned non-200 (less likely with current server code if exitCode 0)
                summaryOutput = `API Error: ${data.error}\n`; // data.error likely contains the "Command execution failed. Exit Code: X" message
                if (data.stdout) summaryOutput += `STDOUT (during API error): ${data.stdout}\n`;
                if (data.stderr) summaryOutput += `STDERR (during API error): ${data.stderr}\n`;
            } else { // Fallback for non-OK response with no detailed error in JSON
                summaryOutput = `API Error: Received HTTP ${backendResponse.status} ${backendResponse.statusText}\n`;
            }
             // fullLogForModal is already prepared with command, exitCode, stdout, stderr, and server message if present.
        }
        setModalContent(fullLogForModal);
      }
    } catch (error) {
      console.error("Failed to execute action:", error);
      summaryOutput = `CLIENT-SIDE ERROR: Failed to communicate with backend or unexpected error.\nError: ${error instanceof Error ? error.message : String(error)}`;
      fullLogForModal = summaryOutput; 
      if(!commandToDisplay && action.details.type === ActionType.SHELL) commandToDisplay = action.details.script;
      if(!commandToDisplay && action.details.type === ActionType.WEB && action.details.executionMode !== WebExecutionMode.BROWSER_AJAX) commandToDisplay = "Error generating command";
      setModalContent(fullLogForModal);
    }
    
    const displayTimestamp = `Timestamp: ${timestamp}`;

    setExecutionResult({
      command: commandToDisplay, 
      output: summaryOutput.trim() + `\n${displayTimestamp}`,
      timestamp: isoTimestamp,
    });

    setIsLoading(false);
    if (!isExpanded) setIsExpanded(true);
  };

  const getDisplayUrl = () => {
    if (action.details.type === ActionType.WEB) {
      return constructFullUrl(action.details.url);
    }
    return 'N/A (Shell Command)';
  };

  const getExecutionModeDisplay = () => {
    if (action.details.type === ActionType.WEB) {
      const mode = action.details.executionMode;
      if (mode === WebExecutionMode.BROWSER_AJAX) return "Browser (New Tab)";
      return "Server (cURL)"; 
    }
    return "N/A";
  };


  return (
    <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-1 border border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1 min-w-0">
          <h4 className="text-md font-semibold text-primary-700 dark:text-primary-400 truncate" title={action.name}>
            {action.name}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate" title={action.description}>
            {action.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleExecute(); }}
            title="Execute Command"
            disabled={isLoading}
            className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            aria-label="Execute action"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit Action"
            disabled={isLoading}
            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            aria-label="Edit action"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete Action"
            disabled={isLoading}
            className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            aria-label="Delete action"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          <button 
            className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors"  
            disabled={isLoading} 
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse action details" : "Expand action details"}
          >
             {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-xs text-neutral-600 dark:text-neutral-300 mb-3 space-y-0.5">
            <p><strong className="font-medium">Type:</strong> {action.details.type === ActionType.WEB ? `Web (${action.details.method})` : 'Shell Command'}</p>
            {action.details.type === ActionType.WEB && (
                <>
                    <p className="truncate"><strong>URL:</strong> {getDisplayUrl()}</p>
                    <p><strong>Execution Mode:</strong> {getExecutionModeDisplay()}</p>
                </>
            )}
          </div>

          {isLoading && (
            <div role="status" className="flex items-center justify-center my-4">
              <svg aria-hidden="true" className="animate-spin h-6 w-6 text-primary-500 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="ml-2 text-sm text-neutral-600 dark:text-neutral-300">Executing action...</p>
              <span className="sr-only">Executing action...</span>
            </div>
          )}

          {executionResult && !isLoading && (
            <div className="mt-3 space-y-2">
              <div>
                <h5 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Execution Summary:</h5>
                <pre className="bg-neutral-100 dark:bg-neutral-900 p-3 rounded-md text-xs text-neutral-600 dark:text-neutral-300 overflow-y-auto max-h-60 whitespace-pre-wrap break-all">
                  {executionResult.output}
                </pre>
                 {( (action.details.type === ActionType.WEB && action.details.executionMode === WebExecutionMode.SERVER_CURL) || action.details.type === ActionType.SHELL) 
                    && modalContent && (
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none"
                    aria-label="View full output details"
                  >
                    View Full Output Details
                  </button>
                )}
              </div>
            </div>
          )}
          {!executionResult && !isLoading && (
             <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Click the 'Execute' button to run this action.</p>
          )}
        </div>
      )}
       <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={modalTitle}
        size="xl"
      >
        <pre className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-md text-xs text-neutral-700 dark:text-neutral-200 overflow-x-auto whitespace-pre-wrap break-all max-h-[60vh]">
          {modalContent}
        </pre>
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDetailsModal(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

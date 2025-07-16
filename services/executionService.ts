
import { WebActionDetails, ShellActionDetails, HttpMethod } from '../types';

export const executionService = {
  generateCurlCommand: (details: WebActionDetails, defaultTargetUri?: string): string => {
    // Start with curl, silent mode (-s), and write-out format for HTTP status code
    // The status code and a marker will be appended to stdout.
    let curlCmd = `curl -s -w "\\nCURL_HTTP_STATUS_CODE:%{http_code}\\n" -X ${details.method}`;
    
    let finalUrl = details.url;

    if (defaultTargetUri && finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      const base = defaultTargetUri.endsWith('/') ? defaultTargetUri.slice(0, -1) : defaultTargetUri;
      const path = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
      finalUrl = base + path;
    }

    if (details.headers) {
      for (const [key, value] of Object.entries(details.headers)) {
        // Ensure header values with spaces are quoted if the entire -H arg isn't quoted.
        // Here, we quote the entire "Key: Value" part.
        const sanitizedValue = String(value).replace(/"/g, '\\"'); // Escape existing double quotes in value
        curlCmd += ` -H "${key}: ${sanitizedValue}"`;
      }
    }
    
    if (details.payload && (details.method === HttpMethod.POST || details.method === HttpMethod.PUT || details.method === HttpMethod.PATCH)) {
      // Escape single quotes in payload for safe inclusion in command
      const escapedPayload = details.payload.replace(/'/g, "'\\''");
      curlCmd += ` -d '${escapedPayload}'`;
    }
    
    // URL-encode the final URL to handle special characters before adding it to the command
    // The URL should be the last main argument before options like -w, but -w is already part of initial options.
    curlCmd += ` "${encodeURI(finalUrl)}"`;
    return curlCmd;
  },

  getShellCommand: (details: ShellActionDetails): string => {
    // Escape special characters for bash -c "..."
    // Escape backslashes, double quotes, dollar signs, and backticks.
    // Newlines within the script are preserved and handled correctly by bash -c.
    const escapedScript = details.script
      .replace(/\\/g, '\\\\') // Must be first: escape backslashes
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\$/g, '\\$') // Escape dollar signs
      .replace(/`/g, '\\`'); // Escape backticks
    return `bash -c "${escapedScript}"`;
  },
};

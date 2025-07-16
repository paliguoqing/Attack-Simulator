// File: server.mjs
import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run provides PORT env var

// Middleware
app.use(cors()); // Enable CORS - configure appropriately for production
app.use(express.json()); // To parse JSON request bodies

// Serve static files from the 'public' directory
// This is where your index.html and the bundled JS (dist/bundle.js) will be
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/execute', (req, res) => {
  const { command } = req.body;

  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command must be a non-empty string.', exitCode: -1 });
  }

  // SECURITY WARNING: remains the same
  console.log(`Executing command: ${command}`);

  exec(command, { timeout: 30000, shell: true }, (error, stdout, stderr) => { // Increased timeout
    if (error) {
      console.error(`Execution error: ${error.message}`);
      console.error(`Stderr: ${stderr}`);
      console.error(`Stdout: ${stdout}`);
      // Send back stdout and stderr even on error, as they might contain useful info
      // error.code is the exit code of the child process
      return res.status(500).json({
        error: `Command execution failed. Exit Code: ${error.code}. Message: ${error.message}`,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: error.code === null ? 1 : error.code, // Ensure exitCode is a number; null can mean killed by signal
      });
    }
    // If no error, command executed successfully (exit code 0)
    res.json({
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    });
  });
});

// Fallback for client-side routing (Single Page Application)
// Serve index.html for any GET request that doesn't match an API route or a static file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`Frontend entry point: ${path.join(__dirname, 'public', 'index.html')}`);
  console.log(`JavaScript bundle: ${path.join(__dirname, 'public', 'dist', 'bundle.js')}`);
});

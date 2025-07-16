import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks'; // Updated import path
import { useConfig } from '../hooks'; 
import { APP_VERSION } from '../constants'; 

export const Login: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { userSettings } = useConfig(); // useConfig now returns userSettings

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(usernameInput, passwordInput)) {
      // Login successful
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleCopyrightDoubleClick = () => {
    // Ensure userSettings and credentials exist before accessing
    if (userSettings && userSettings.credentials) {
      setUsernameInput(userSettings.credentials.username);
      setPasswordInput(userSettings.credentials.password || ''); 
    }
  };

  // Default to sensible placeholders if userSettings isn't loaded yet.
  const currentUsername = userSettings?.credentials?.username || 'loading...';
  const isPasswordConfigured = !!userSettings?.credentials?.password;


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-950 p-4">
      <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:scale-105 duration-300">
        <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8">
          Attack Simulator Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-neutral-50 sm:text-sm"
              placeholder={`Default: ${currentUsername}`}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required={isPasswordConfigured} 
              className="mt-1 block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-neutral-50 sm:text-sm"
              placeholder={isPasswordConfigured ? "Enter password" : "Password (optional)"}
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={!userSettings} // Disable if config not loaded
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800 transition-colors duration-150 disabled:opacity-50"
            >
              Sign In
            </button>
          </div>
        </form>
        <p 
          className="mt-8 text-xs text-center text-neutral-400 dark:text-neutral-500 cursor-default"
          onDoubleClick={handleCopyrightDoubleClick} 
        >
          Produced by National,  Prisma Cloud Solution Architect
          <br />
          Powered by Gemini 
        </p>
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-1">
          Version {APP_VERSION}
        </p>
      </div>
    </div>
  );
};
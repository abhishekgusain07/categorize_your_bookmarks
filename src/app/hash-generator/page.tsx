'use client';

import { useState } from 'react';
import { sha256 } from 'js-sha256';

export default function HashGenerator() {
  const [password, setPassword] = useState('');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  const generateHash = () => {
    if (!password) return;
    const newHash = sha256(password);
    setHash(newHash);
  };

  const copyToClipboard = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Password Hash Generator</h1>
        <p className="mb-8 text-gray-400 text-center">
          Use this tool to generate a secure hash for your password.
          <br />
          Replace the hash in your AuthContext with the generated value.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Enter your password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
            placeholder="Password to hash"
          />
        </div>
        
        <button
          onClick={generateHash}
          disabled={!password}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Hash
        </button>

        {hash && (
          <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Generated Hash:</label>
              <button 
                onClick={copyToClipboard}
                className="text-sm text-primary hover:text-primary/80"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm font-mono break-all bg-black p-3 rounded border border-gray-800">
              {hash}
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Copy this hash and replace the PASSWORD_HASH value in src/lib/AuthContext.tsx
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
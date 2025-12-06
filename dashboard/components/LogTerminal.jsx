'use client';

import React, { useEffect, useRef } from 'react';

const LogTerminal = ({ logs }) => {
  const terminalRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case 'api':
        return 'text-purple-400';
      case 'success':
        return 'text-emerald-400';
      case 'webhook':
        return 'text-orange-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-300';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'api':
        return '📡';
      case 'success':
        return '✅';
      case 'webhook':
        return '🔔';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border border-emerald-500/20 rounded-lg overflow-hidden">
      <div className="bg-slate-900/50 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse-glow"></div>
          <span className="text-emerald-400 font-mono text-sm font-semibold">LIVE SERVER LOGS</span>
        </div>
        <span className="text-slate-500 font-mono text-xs">{logs.length} entries</span>
      </div>
      
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1"
        style={{
          background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.98))',
        }}
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Waiting for activity...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 ${getLogColor(log.type)} hover:bg-slate-900/30 px-2 py-1 rounded transition-colors`}
            >
              <span className="text-slate-500 text-xs min-w-[80px]">
                {log.timestamp}
              </span>
              <span className="mr-2">{getLogIcon(log.type)}</span>
              <span className="flex-1 break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogTerminal;


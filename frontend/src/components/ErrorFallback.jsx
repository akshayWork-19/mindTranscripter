import React from 'react';

export default function ErrorFallback({ error, resetErrorBoundary }) {
    return (<div className="flex flex-col items-center justify-center h-full p-8 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong!</h2>
        <pre className="text-xs text-gray-400 bg-black/40 p-4 rounded mb-6 overflow-auto max-w-full text-left w-full">
            {error.message}
        </pre>
        <button
            onClick={resetErrorBoundary}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-lg active:scale-95"
        >
            Try Again
        </button>
    </div>
    );
}


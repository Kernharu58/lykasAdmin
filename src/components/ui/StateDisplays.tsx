import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col justify-center items-center py-20 w-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2D6A4F] mb-4"></div>
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string, message: string, onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center flex flex-col items-center w-full my-8">
      <AlertCircle size={40} className="text-red-500 mb-3" />
      <h3 className="text-lg font-bold text-red-800 mb-2">{title}</h3>
      <p className="text-red-600 max-w-md mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition">
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "No Data Found", message, icon }: { title?: string, message: string, icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center items-center py-20 text-center px-4 w-full border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <div className="text-gray-400 mb-4">{icon || <Inbox size={48} />}</div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-sm">{message}</p>
    </div>
  );
}
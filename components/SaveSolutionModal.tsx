import React, { useState } from 'react';
import { RecordedAction } from '../types';

interface SaveSolutionModalProps {
  actions: RecordedAction[];
  onClose: () => void;
  onSave: (solution: { problemDescription: string; solutionDescription: string; actions: RecordedAction[] }) => void;
}

export const SaveSolutionModal: React.FC<SaveSolutionModalProps> = ({ actions, onClose, onSave }) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');

  const handleSave = () => {
    if (problemDescription.trim() && solutionDescription.trim()) {
      onSave({
        problemDescription,
        solutionDescription,
        actions,
      });
      onClose();
    } else {
      alert('Please fill out both description fields.');
    }
  };

  return (
    <div className="relative z-20" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">Save Recorded Solution</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="problem" className="block text-sm font-medium text-gray-700">
                  Problem Description
                </label>
                <input
                  type="text"
                  id="problem"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., VPN connection fails"
                />
              </div>
              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700">
                  Solution Description
                </label>
                <textarea
                  id="solution"
                  value={solutionDescription}
                  onChange={(e) => setSolutionDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Cleared VPN cache and re-entered credentials"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Actions Recorded: {actions.length}</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              >
                Save Solution
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Solution } from '../types';
import { Card } from './common/Card';
import { BrainCircuit, SpinnerIcon, XCircleIcon } from './icons/Icons';
import { useToast } from '../services/ToastContext';

interface KnowledgeBaseProps {
    role?: 'staff' | 'admin';
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ role = 'admin' }) => {
  const { addToast } = useToast();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProblem, setNewProblem] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSolutions = async () => {
      setIsLoading(true);
      try {
        const fetchedSolutions = await window.electronAPI.getSolutions();
        setSolutions(fetchedSolutions);
      } catch (error) {
        console.error('Error fetching solutions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSolutions();
  }, []);

  const filteredSolutions = solutions.filter(s =>
    s.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.solutionDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSolution = async () => {
    if (!newProblem.trim() || !newSolution.trim()) return;
    setIsSaving(true);
    try {
        const solutionData = {
            problemDescription: newProblem,
            solutionDescription: newSolution,
            actions: [] // Manual entry has no recorded actions
        };
        const created = await window.electronAPI.createSolution(solutionData);
        setSolutions(prev => [created, ...prev]);
        setIsModalOpen(false);
        setNewProblem('');
        setNewSolution('');
        addToast('Solution added successfully', 'success');
    } catch (error) {
        addToast('Failed to add solution', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Knowledge Base</h2>
        {role === 'admin' && (
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
            >
                Add Manual Solution
            </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search for solutions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
        />
        <div className="absolute left-3 top-3.5 text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
           </svg>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <SpinnerIcon className="w-8 h-8 text-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSolutions.length > 0 ? (
            filteredSolutions.map((solution) => (
              <Card key={solution.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <BrainCircuit className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-2">{solution.problemDescription}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {solution.solutionDescription}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-400">
                        {solution.actions.length} recorded actions
                      </span>
                      <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                        {solution.id}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
               <p className="text-slate-500">No solutions found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Add to Knowledge Base</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Problem Description</label>
                        <input
                            type="text"
                            value={newProblem}
                            onChange={(e) => setNewProblem(e.target.value)}
                            placeholder="e.g., Cannot connect to VPN"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Solution Description</label>
                        <textarea
                            value={newSolution}
                            onChange={(e) => setNewSolution(e.target.value)}
                            rows={4}
                            placeholder="Describe the steps to fix this problem..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddSolution}
                        disabled={!newProblem.trim() || !newSolution.trim() || isSaving}
                        className="px-6 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-colors shadow-sm disabled:bg-slate-300"
                    >
                        {isSaving ? 'Saving...' : 'Save Solution'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

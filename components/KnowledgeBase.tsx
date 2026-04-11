import React, { useState, useEffect } from 'react';
import { Solution } from '../types';
import { Card } from './common/Card';
import { BrainCircuit, SpinnerIcon } from './icons/Icons';

export const KnowledgeBase: React.FC = () => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Knowledge Base</h2>
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
    </div>
  );
};

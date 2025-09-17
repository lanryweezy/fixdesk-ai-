import React, { useState, useRef, useEffect, useCallback } from 'react';
import { startConversation, continueConversation, AnalysisResult, ConversationResult } from '../services/geminiService';
import { Ticket, TicketStatus } from '../types';
import { ComputerDesktopIcon, BrainCircuit, CheckCircleIcon, XCircleIcon } from './icons/Icons';


type ModalStep = 'initial' | 'recording' | 'processing' | 'result' | 'clarification';

interface ReportIssueModalProps {
  onClose: () => void;
  onTicketCreated: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'reportedBy'>) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ onClose, onTicketCreated }) => {
  const [step, setStep] = useState<ModalStep>('initial');
  const [prompt, setPrompt] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleConversationResult = (result: ConversationResult) => {
    if (result.type === 'analysis') {
        setAnalysisResult(result.data);
        setStep('result');
    } else if (result.type === 'question') {
        setClarificationQuestion(result.question);
        setUserAnswer(''); // Clear previous answer
        setStep('clarification');
    } else { // error
        setAnalysisResult({
            title: `Issue reported: "${prompt}"`,
            description: result.message || 'An unexpected error occurred during analysis.',
            resolution: null,
            status: TicketStatus.NEW,
            priority: 'Medium'
        });
        setStep('result');
    }
  };

  const handleStopButtonClick = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!window.electronAPI) {
          throw new Error("Electron API is not available. This feature only works in the desktop app.");
      }

      const sources = await window.electronAPI.getScreenSources({ types: ['screen', 'window'] });

      // For this example, we'll automatically select the first screen.
      // A real-world app might present a UI for the user to choose.
      const primarySource = sources.find(source => source.id.startsWith('screen:'));

      if (!primarySource) {
          throw new Error("No screen to record was found.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false, // Audio capture via this method is complex, disabling for now.
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: primarySource.id,
          }
        } as any // Use `any` to bypass strict type checking for `mandatory`
      });

      setStep('recording');
      setStream(mediaStream);
      
      mediaStream.getVideoTracks()[0].addEventListener('ended', handleStopButtonClick);

      mediaRecorderRef.current = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
        
        setStep('processing');
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

        if (videoBlob.size === 0) {
            console.warn("Recording was empty.");
            alert("Recording failed or was too short. Please try again.");
            setStep('initial');
            return;
        }

        const result = await startConversation(videoBlob, prompt);
        handleConversationResult(result);
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error starting screen recording.", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      alert(`Could not start screen recording: ${errorMessage}`);
      setStep('initial');
    }
  }, [prompt, handleStopButtonClick]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  const handleProblemSolved = () => {
    if (analysisResult) {
      onTicketCreated({
        title: analysisResult.title,
        description: analysisResult.description,
        status: TicketStatus.AI_RESOLVED,
        priority: analysisResult.priority,
        resolution: analysisResult.resolution || 'User confirmed the AI-suggested fix was successful.',
        videoUrl: 'https://mock.url/video.mp4'
      });
    }
  };

  const handleCreateTicket = () => {
    if (analysisResult) {
      onTicketCreated({
        title: analysisResult.title,
        description: analysisResult.description,
        status: TicketStatus.NEW,
        priority: analysisResult.priority,
        videoUrl: 'https://mock.url/video.mp4'
      });
    }
  };
  
  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) return;
    setStep('processing');
    const result = await continueConversation(userAnswer);
    handleConversationResult(result);
  };

  const handleExecuteCommand = async () => {
    if (!analysisResult?.suggestedCommand) return;

    setIsExecutingCommand(true);
    try {
        const { stdout, stderr } = await window.electronAPI.executeCommand(analysisResult.suggestedCommand);
        if (stderr) {
            alert(`Command failed:\n${stderr}`);
        } else {
            alert(`Command executed successfully:\n${stdout}`);
            // Optionally, you could re-run analysis or mark as resolved here
        }
    } catch (error) {
        alert(`An error occurred while executing the command: ${(error as Error).message}`);
    } finally {
        setIsExecutingCommand(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
              <ComputerDesktopIcon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">Report an Issue</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Briefly describe your problem, then record your screen to show us what's happening.</p>
              </div>
            </div>
            <div className="mt-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                placeholder="e.g., My VPN keeps disconnecting..."
              />
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                disabled={!prompt}
                onClick={startRecording}
                className="inline-flex w-full justify-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Start Screen Recording
              </button>
            </div>
          </>
        );
      case 'recording':
        return (
            <>
                <h3 className="text-lg font-semibold leading-6 text-gray-900 text-center">Recording...</h3>
                <div className="mt-4 w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-contain bg-black"></video>
                </div>
                <div className="mt-5 sm:mt-6">
                    <button
                        type="button"
                        onClick={handleStopButtonClick}
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        Stop Recording & Analyze
                    </button>
                </div>
            </>
        );
       case 'processing':
        return (
          <div className="text-center py-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 animate-pulse">
                <BrainCircuit className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold leading-6 text-gray-900">AI Analysis in Progress...</h3>
            <p className="mt-2 text-sm text-gray-500">FixDesk AI is analyzing your recording. This may take a moment.</p>
          </div>
        );
      case 'clarification':
        return (
            <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
                    <BrainCircuit className="h-6 w-6 text-brand-primary" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Clarification Needed</h3>
                    <div className="mt-4 text-sm text-gray-600 bg-slate-50 p-4 rounded-lg text-left">
                        <p className="font-semibold text-slate-700">FixDesk AI asks:</p>
                        <p>{clarificationQuestion}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                        placeholder="Your answer..."
                    />
                </div>
                <div className="mt-5 sm:mt-6">
                    <button
                        type="button"
                        disabled={!userAnswer.trim()}
                        onClick={handleAnswerSubmit}
                        className="inline-flex w-full justify-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Submit Answer
                    </button>
                </div>
            </>
        );
      case 'result':
        if (!analysisResult) return null;
        const canAutoFix = !!analysisResult.resolution;
        return (
          <div className="text-center">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${canAutoFix ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {canAutoFix ? <CheckCircleIcon className="h-7 w-7 text-green-600" /> : <XCircleIcon className="h-7 w-7 text-yellow-600" />}
            </div>
            <h3 className="mt-4 text-lg font-semibold leading-6 text-gray-900">{analysisResult.title}</h3>
            <div className="mt-2 text-sm text-gray-600 bg-slate-50 p-4 rounded-lg text-left">
                <p className="font-semibold text-slate-700">AI Diagnosis:</p>
                <p>{analysisResult.description}</p>
            </div>
            {canAutoFix && (
                <div className="mt-4 text-sm text-green-700 bg-green-50 p-4 rounded-lg text-left">
                    <p className="font-semibold">Suggested Fix:</p>
                    <p>{analysisResult.resolution}</p>
                </div>
            )}
            {analysisResult.suggestedCommand && (
                 <div className="mt-4 text-sm text-orange-700 bg-orange-50 p-4 rounded-lg text-left">
                    <p className="font-semibold">Suggested Automated Fix:</p>
                    <code className="text-xs bg-black/10 p-1 rounded font-mono">{analysisResult.suggestedCommand}</code>
                    <button
                        onClick={handleExecuteCommand}
                        disabled={isExecutingCommand}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition-all disabled:bg-gray-400"
                    >
                        {isExecutingCommand ? 'Executing...' : 'Attempt Automated Fix'}
                    </button>
                </div>
            )}
            <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                {canAutoFix ? (
                    <>
                        <button type="button" onClick={handleProblemSolved} className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:w-auto">This Fixed It!</button>
                        <button type="button" onClick={handleCreateTicket} className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto">I Still Need Help</button>
                    </>
                ) : (
                    <button type="button" onClick={handleCreateTicket} className="inline-flex w-full justify-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90">Create Ticket & Notify IT</button>
                )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button type="button" onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2">
                    <span className="sr-only">Close</span>
                    <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

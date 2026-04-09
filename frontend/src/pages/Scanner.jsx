import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import api from '../services/api';
import { CheckCircle, XCircle, StopCircle, Keyboard, ScanLine } from 'lucide-react';

const Scanner = () => {
    const navigate = useNavigate();
    const sessionId = localStorage.getItem('currentSessionId');
    const [scannedStudents, setScannedStudents] = useState([]);
    const [scanMessage, setScanMessage] = useState(null);
    const [manualBarcode, setManualBarcode] = useState('');
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    
    // Core Engine Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const workerRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);
    
    // Safety Locks
    const isSubmittingRef = useRef(false);
    const isAnalyzingRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        let isMounted = true;

        const initializeEngine = async () => {
            try {
                // 1. Boot up Tesseract Worker in the background
                const worker = await createWorker('eng');
                if (isMounted) {
                    workerRef.current = worker;
                    setIsWorkerReady(true);
                } else {
                    worker.terminate();
                }

                // 2. Request High-Def Camera Stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'environment', // Strictly use the back camera
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                
                if (isMounted && videoRef.current) {
                    streamRef.current = stream;
                    videoRef.current.srcObject = stream;
                    
                    // Essential for iOS Safari
                    videoRef.current.setAttribute('playsinline', true);
                    await videoRef.current.play();

                    // 3. Start the silent extraction loop once video is playing
                    beginSilentExtraction();
                } else {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                console.error("Camera/Worker Init Error:", err);
                if (isMounted) {
                    setScanMessage({ type: 'error', text: 'Camera access denied or device unsupported.' });
                }
            }
        };

        const beginSilentExtraction = () => {
            // Grab a frame every 1.5 seconds.
            // Pushing it faster will freeze mobile processors due to OCR intensity.
            intervalRef.current = setInterval(extractAndProcessFrame, 1500);
        };

        initializeEngine();

        // Cleanup: Stop Camera, Worker, and Loop on unmount
        return () => {
            isMounted = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            if (workerRef.current) workerRef.current.terminate();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, navigate]);

    const extractAndProcessFrame = async () => {
        // Drop the frame if the previous one is still parsing, or if we are submitting to API
        if (isAnalyzingRef.current || isSubmittingRef.current || !workerRef.current || !videoRef.current || !canvasRef.current) return;
        
        isAnalyzingRef.current = true;

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Match canvas dims to real video dims
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Draw current video frame onto the hidden canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Export the frame
            const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Unleash OCR
            const result = await workerRef.current.recognize(imageUrl);
            const text = result.data.text;
            
            // Console logging to help debug what Tesseract "Sees"
            if (text.trim().length > 0) {
                console.log("OCR Seen:", text.replace(/\n/g, ' ')); 
            }

            // Regex: Looks strictly for an isolated 5-digit number
            const match = text.match(/(?:^|\D)(\d{5})(?=\D|$)/);

            if (match && match[1]) {
                const extractedId = match[1];
                await handleBarcodeSubmit(extractedId);
            }
        } catch (err) {
            console.error("Frame Processing Error:", err);
        } finally {
            isAnalyzingRef.current = false;
        }
    };

    async function handleBarcodeSubmit(barcodeData) {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            const { data } = await api.post('/attendance/scan', {
                barcodeId: barcodeData,
                sessionId
            });
            
            setScanMessage({ type: 'success', text: `Marked: ${data.student.name} (${barcodeData})` });
            setScannedStudents(prev => [data.student, ...prev]);
            
        } catch (err) {
            setScanMessage({ 
                type: 'error', 
                text: err.response?.data?.message || `Error mapping ID: ${barcodeData}` 
            });
        }

        // Wait 2 seconds before unlocking to prevent double-scanning
        setTimeout(() => {
            setScanMessage(null);
            isSubmittingRef.current = false;
        }, 2000);
    }

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualBarcode.trim() === '') return;
        handleBarcodeSubmit(manualBarcode.trim());
        setManualBarcode('');
    };

    const handleEndSession = async () => {
        try {
            await api.post('/attendance/end-session', { sessionId });
            localStorage.removeItem('currentSessionId');
            navigate(`/report/${sessionId}`);
        } catch {
            alert('Failed to end session');
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4FC] p-4 lg:p-8 flex flex-col md:flex-row gap-6">
            
            {/* Hidden Canvas used for isolating frames perfectly */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Left Col: Scanner UI */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold font-['Manrope'] text-gray-800">Live Feed OCR</h2>
                            {!isWorkerReady && (
                                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full animate-pulse">Booting Engine...</span>
                            )}
                        </div>
                        <p className="text-gray-500 font-['Inter'] text-sm">Focus the ID number perfectly in the camera.</p>
                    </div>
                    <button 
                        onClick={handleEndSession} 
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                    >
                        <StopCircle size={20} /> End Session
                    </button>
                </div>
                
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-gray-200 min-h-[350px] md:h-[400px]">
                    
                    {/* The Live Video Player */}
                    <video 
                        ref={videoRef} 
                        className="absolute inset-0 w-full h-full object-cover"
                        muted 
                        playsInline
                    />

                    {/* Laser Targeting Graphic */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[70%] h-[20%] border-2 border-blue-500/50 rounded-xl relative shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] flex items-center justify-center">
                            <ScanLine size={48} className="text-blue-500/40 animate-pulse" />
                        </div>
                    </div>
                    
                    {/* Floating Toast Notification */}
                    {scanMessage && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold shadow-xl flex items-center gap-2 transform transition-all z-20 w-[90%] md:w-auto text-center ${scanMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {scanMessage.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                            <span className="truncate">{scanMessage.text}</span>
                        </div>
                    )}
                </div>

                {/* Manual Entry Fallback */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Keyboard size={16}/> Manual Entry Fallback
                    </h3>
                    <form onSubmit={handleManualSubmit} className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="Type ID naturally if scanning fails..." 
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                            disabled={isSubmittingRef.current}
                        />
                        <button type="submit" disabled={isSubmittingRef.current} className="px-6 py-3 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl transition">
                            Submit
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Col: Ledger */}
            <div className="w-full md:w-[400px] bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-xl font-bold font-['Manrope'] text-gray-800 mb-6">Recent Scans</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {scannedStudents.length === 0 ? (
                        <p className="text-gray-400 text-center mt-10">No students scanned yet.</p>
                    ) : (
                        scannedStudents.map((student, idx) => (
                            <div key={idx} className="bg-[#f8f9fb] p-4 rounded-2xl flex justify-between items-center border border-gray-100 hover:shadow-sm transition">
                                <div>
                                    <div className="font-semibold text-gray-800">{student.name}</div>
                                    <div className="text-xs text-gray-500">Roll No: {student.rollNo}</div>
                                </div>
                                <div className="text-green-600 bg-green-50 p-2 rounded-full">
                                    <CheckCircle size={18} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Scanner;

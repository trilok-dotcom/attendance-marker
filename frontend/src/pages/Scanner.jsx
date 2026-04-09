import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Quagga from '@ericblade/quagga2';
import api from '../services/api';
import { CheckCircle, XCircle, StopCircle, Keyboard } from 'lucide-react';

const Scanner = () => {
    const navigate = useNavigate();
    const sessionId = localStorage.getItem('currentSessionId');
    const [scannedStudents, setScannedStudents] = useState([]);
    const [scanMessage, setScanMessage] = useState(null);
    const [manualBarcode, setManualBarcode] = useState('');
    
    const scannerRef = useRef(null);
    const isScanningRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                    facingMode: "environment",
                    width: { min: 1280, ideal: 1920 }, // High-Res requested
                    height: { min: 720, ideal: 1080 }
                }
            },
            locator: {
                patchSize: "medium", // 'medium' is balanced, 'large' is better for dense/distant barcodes
                halfSample: true     // Speed optimization
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            decoder: {
                readers: ["code_128_reader", "code_39_reader"]
            },
            locate: true // Turns on localization (critical for finding codes without quiet zones)
        }, function(err) {
            if (err) {
                console.error("Quagga Init Error:", err);
                return;
            }
            Quagga.start();
        });

        const onDetected = (result) => {
            const code = result.codeResult && result.codeResult.code;
            if (code && !isScanningRef.current) {
                handleBarcodeSubmit(code);
            }
        };

        Quagga.onDetected(onDetected);

        return () => {
            Quagga.offDetected(onDetected);
            Quagga.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, navigate]);

    async function handleBarcodeSubmit(barcodeData) {
        if (isScanningRef.current) return;
        isScanningRef.current = true;

        try {
            const { data } = await api.post('/attendance/scan', {
                barcodeId: barcodeData,
                sessionId
            });
            
            setScanMessage({ type: 'success', text: `Marked: ${data.student.name}` });
            setScannedStudents(prev => [data.student, ...prev]);
            
        } catch (err) {
            setScanMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Error scanning barcode' 
            });
        }

        setTimeout(() => {
            setScanMessage(null);
            isScanningRef.current = false;
        }, 1500);
    }

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualBarcode.trim() === '') return;
        handleBarcodeSubmit(manualBarcode.trim());
        setManualBarcode('');
    };

    const handleEndSession = async () => {
        try {
            Quagga.stop();
            await api.post('/attendance/end-session', { sessionId });
            localStorage.removeItem('currentSessionId');
            navigate(`/report/${sessionId}`);
        } catch {
            alert('Failed to end session');
        }
    };

    // Auto-remove scan message
    useEffect(() => {
        if (scanMessage) {
            const timer = setTimeout(() => setScanMessage(null), 1500);
            return () => clearTimeout(timer);
        }
    }, [scanMessage]);

    return (
        <div className="min-h-screen bg-[#F0F4FC] p-4 lg:p-8 flex flex-col md:flex-row gap-6">
            {/* Left Col: Scanner UI */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-['Manrope'] text-gray-800">Quagga Scanner</h2>
                        <p className="text-gray-500 font-['Inter'] text-sm">Engineered for difficult 1D barcodes.</p>
                    </div>
                    <button 
                        onClick={handleEndSession} 
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                    >
                        <StopCircle size={20} /> End Session
                    </button>
                </div>
                
                <div className="relative bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-200 min-h-[350px] md:h-[400px]">
                    
                    {/* Quagga injects a <video> and <canvas> directly into this div */}
                    <div 
                        ref={scannerRef} 
                        className="absolute inset-0 w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-cover"
                    ></div>
                    
                    {/* Targeting Box */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[80%] h-[30%] border-2 border-green-500 rounded-xl relative shadow-[0_0_0_4000px_rgba(0,0,0,0.4)]"></div>
                    </div>

                    {/* Floating Toast Notification inside Scanner */}
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
                            placeholder="If camera fails, type 17672..." 
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                        />
                        <button type="submit" className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition">
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

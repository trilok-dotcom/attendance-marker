import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import api from '../services/api';
import { CheckCircle, XCircle, StopCircle, Keyboard, Camera, Loader2 } from 'lucide-react';

const Scanner = () => {
    const navigate = useNavigate();
    const sessionId = localStorage.getItem('currentSessionId');
    const [scannedStudents, setScannedStudents] = useState([]);
    const [scanMessage, setScanMessage] = useState(null);
    const [manualBarcode, setManualBarcode] = useState('');
    const [isScanningPhoto, setIsScanningPhoto] = useState(false);
    
    // Maintain strict locking so we don't double submit
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
        }
    }, [sessionId, navigate]);

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

        setTimeout(() => {
            setScanMessage(null);
            isSubmittingRef.current = false;
        }, 1500);
    }

    const handleImageCapture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanningPhoto(true);
        setScanMessage(null);

        try {
            const result = await Tesseract.recognize(file, 'eng');
            const text = result.data.text;
            console.log("OCR Extracted Text:", text);

            // Regex: Looks strictly for a standalone 5-digit number
            const match = text.match(/(?:^|\D)(\d{5})(?=\D|$)/);

            if (match && match[1]) {
                const extractedId = match[1];
                handleBarcodeSubmit(extractedId);
            } else {
                setScanMessage({ type: 'error', text: 'No 5-digit ID found in that photo. Please try again or type it manually.' });
            }
        } catch (err) {
            console.error("OCR Read Error:", err);
            setScanMessage({ type: 'error', text: 'Failed to process image.' });
        } finally {
            setIsScanningPhoto(false);
            e.target.value = ''; // Reset input to allow immediate re-scans
        }
    };

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

    // Auto-remove scan message
    useEffect(() => {
        if (scanMessage && !isScanningPhoto) {
            const timer = setTimeout(() => setScanMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [scanMessage, isScanningPhoto]);

    return (
        <div className="min-h-screen bg-[#F0F4FC] p-4 lg:p-8 flex flex-col md:flex-row gap-6">
            {/* Left Col: Scanner UI */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-['Manrope'] text-gray-800">OCR Scanner</h2>
                        <p className="text-gray-500 font-['Inter'] text-sm">Snap a photo to read the 5-digit ID automatically.</p>
                    </div>
                    <button 
                        onClick={handleEndSession} 
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                    >
                        <StopCircle size={20} /> End Session
                    </button>
                </div>
                
                <div className="relative bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 min-h-[350px] p-6 transition hover:bg-gray-100">
                    {isScanningPhoto ? (
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                            <p className="text-lg font-bold text-gray-700">Reading Text...</p>
                            <p className="text-sm text-gray-500">Searching for ID number</p>
                        </div>
                    ) : (
                        <label htmlFor="camera-capture" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <Camera size={48} className="text-blue-600" />
                            </div>
                            <span className="text-xl font-bold text-gray-800 mb-2">Tap to Snap Photo</span>
                            <span className="text-sm text-gray-500 text-center max-w-xs">Take a clear picture of the physical ID card and the system will read the 5-digit number automatically.</span>
                        </label>
                    )}

                    <input 
                        id="camera-capture"
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden"
                        onChange={handleImageCapture}
                        disabled={isScanningPhoto || isSubmittingRef.current}
                    />
                    
                    {/* Floating Toast Notification */}
                    {scanMessage && !isScanningPhoto && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold shadow-xl flex items-center gap-2 transform transition-all z-10 w-[90%] md:w-auto text-center ${scanMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
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
                            placeholder="Type 5-digit ID..." 
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

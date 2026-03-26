import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Optimized for 1D Barcodes with higher resolution request
        const config = { 
            fps: 15, 
            qrbox: { width: 350, height: 100 },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };
        
        // Request HD camera for better 1D barcode dense line reading
        const cameraConfig = { facingMode: "environment" };

        html5QrCode.start(
            cameraConfig,
            config,
            async (decodedText) => {
                if (isScanningRef.current) return;
                handleBarcodeSubmit(decodedText);
            },
            (error) => {
                // Ignore ongoing errors due to no code found
            }
        ).catch((err) => {
            console.error("Failed to start scanner", err);
            // Ignore if it's just camera access denied, they can use manual entry
        });

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
            }
        };
    }, [sessionId, navigate]);

    const handleBarcodeSubmit = async (barcodeData) => {
        if (isScanningRef.current) return;
        
        isScanningRef.current = true;
        
        if (scannerRef.current && scannerRef.current.getState() === 2) {
            scannerRef.current.pause(true);
        }

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
            if (scannerRef.current && scannerRef.current.getState() === 3) {
                scannerRef.current.resume();
            }
            isScanningRef.current = false;
        }, 1500);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualBarcode.trim() === '') return;
        handleBarcodeSubmit(manualBarcode.trim());
        setManualBarcode('');
    };

    const handleEndSession = async () => {
        try {
            if (scannerRef.current && scannerRef.current.isScanning) {
                await scannerRef.current.stop();
            }
            await api.post('/attendance/end-session', { sessionId });
            localStorage.removeItem('currentSessionId');
            navigate(`/report/${sessionId}`);
        } catch (err) {
            alert('Failed to end session');
        }
    };

    // Auto-remove scan message
    useEffect(() => {
        if (scanMessage) {
            const timer = setTimeout(() => setScanMessage(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [scanMessage]);

    return (
        <div className="min-h-screen bg-[#F0F4FC] p-4 lg:p-8 flex flex-col md:flex-row gap-6">
            {/* Left Col: Scanner */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-['Manrope'] text-gray-800">Live Scanner</h2>
                        <p className="text-gray-500 font-['Inter'] text-sm">Position barcode inside the frame</p>
                    </div>
                    <button 
                        onClick={handleEndSession} 
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                    >
                        <StopCircle size={20} /> End Session
                    </button>
                </div>
                
                <div className="relative bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200 min-h-[350px]">
                    <div id="reader" className="w-full max-w-lg mx-auto overflow-hidden rounded-xl"></div>
                    
                    {/* Floating Toast Notification inside Scanner */}
                    {scanMessage && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold shadow-xl flex items-center gap-2 transform transition-all z-10 ${scanMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {scanMessage.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                            {scanMessage.text}
                        </div>
                    )}
                </div>

                {/* Manual Entry Fallback */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Keyboard size={16}/> Manual Entry Fallback
                    </h3>
                    <form onSubmit={handleManualSubmit} className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="Enter barcode ID manually..." 
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

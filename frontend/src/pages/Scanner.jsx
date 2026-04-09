import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner as ModernScanner } from '@yudiel/react-qr-scanner';
import api from '../services/api';
import { CheckCircle, XCircle, StopCircle, Keyboard } from 'lucide-react';

const Scanner = () => {
    const navigate = useNavigate();
    const sessionId = localStorage.getItem('currentSessionId');
    const [scannedStudents, setScannedStudents] = useState([]);
    const [scanMessage, setScanMessage] = useState(null);
    const [manualBarcode, setManualBarcode] = useState('');
    const isScanningRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
        }
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
                text: err.response?.data?.message || 'Error marking attendance' 
            });
        }

        setTimeout(() => {
            setScanMessage(null);
            isScanningRef.current = false;
        }, 1500); // Wait 1.5 seconds before allowing the next scan
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
            {/* Left Col: Scanner UI */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-['Manrope'] text-gray-800">Smart Scanner</h2>
                        <p className="text-gray-500 font-['Inter'] text-sm">Align the barcode in the green box.</p>
                    </div>
                    <button 
                        onClick={handleEndSession} 
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30"
                    >
                        <StopCircle size={20} /> End Session
                    </button>
                </div>
                
                <div className="relative bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-200 min-h-[350px]">
                    
                    <ModernScanner 
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                // @yudiel/react-qr-scanner returns an array of objects: { rawValue: string }
                                handleBarcodeSubmit(result[0].rawValue);
                            }
                        }}
                        formats={['code_128', 'code_39', 'ean_13']}
                        scanDelay={1000} // Don't burn CPU trying 60fps
                        allowMultiple={false}
                        components={{
                            tracker: true, // Draws a bounding box over detected barcodes!
                            audio: false
                        }}
                        styles={{
                            container: { width: '100%', height: '100%', aspectRatio: '1/1' }
                        }}
                    />

                    {/* Floating Toast Notification inside Scanner */}
                    {scanMessage && (
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
                            placeholder="Enter ID artificially (e.g. 17672)" 
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

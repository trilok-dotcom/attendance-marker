import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, Play, Users, StopCircle, RefreshCcw } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [classId, setClassId] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Active Session State
    const [activeSession, setActiveSession] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const { data } = await api.get('/attendance/active-session');
                setActiveSession(data);
                if (data) {
                    localStorage.setItem('currentSessionId', data._id);
                } else {
                    localStorage.removeItem('currentSessionId');
                }
            } catch (err) {
                console.error("Failed to fetch active session");
            } finally {
                setCheckingSession(false);
            }
        };
        checkActiveSession();
    }, []);

    const startSession = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/attendance/start-session', { classId, subject });
            localStorage.setItem('currentSessionId', data._id);
            navigate('/scanner');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start session');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeSession = () => {
        navigate('/scanner');
    };

    const handleEndSession = async () => {
        if (!activeSession) return;
        setLoading(true);
        try {
            await api.post('/attendance/end-session', { sessionId: activeSession._id });
            localStorage.removeItem('currentSessionId');
            navigate(`/report/${activeSession._id}`);
        } catch (err) {
            alert('Failed to end session');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F0F4FC] p-6 lg:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Welcome, {user?.name}</h1>
                        <p className="text-gray-500 text-sm">Teacher Dashboard</p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">
                        <LogOut size={18} /> Logout
                    </button>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Session Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        
                        {checkingSession ? (
                            <div className="flex h-full items-center justify-center text-gray-500">Checking for active sessions...</div>
                        ) : activeSession ? (
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2 font-['Manrope']">Session in Progress</h2>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
                                        <p className="text-sm text-gray-500">Class</p>
                                        <p className="font-semibold text-blue-900 mb-2">{activeSession.classId}</p>
                                        <p className="text-sm text-gray-500">Subject</p>
                                        <p className="font-semibold text-blue-900 mb-2">{activeSession.subject}</p>
                                        <p className="text-xs text-blue-600">Started: {new Date(activeSession.startTime).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={handleResumeSession}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-blue-500/30 shadow-md"
                                    >
                                        <Play size={18} /> Resume Scanning
                                    </button>
                                    <button 
                                        onClick={handleEndSession}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
                                    >
                                        {loading ? 'Ending...' : <><StopCircle size={18} /> End Session & View Report</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Play size={100} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6 font-['Manrope'] relative z-10">Start Attendance Session</h2>
                                
                                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                                
                                <form onSubmit={startSession} className="space-y-5 relative z-10">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                                        <select 
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={classId}
                                            onChange={(e) => setClassId(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Choose a class</option>
                                            <option value="CS101">CS101 - Intro to CS</option>
                                            <option value="CS201">CS201 - Data Structures</option>
                                            <option value="CS301">CS301 - Algorithms</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject / Topic</label>
                                        <input 
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="E.g. Binary Trees"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 mt-4"
                                    >
                                        {loading ? 'Starting...' : <><Play size={18} /> Start Session</>}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Assigned Classes */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 font-['Manrope']">Assigned Classes</h2>
                        {user?.assignedClasses && user.assignedClasses.length > 0 ? (
                            <ul className="space-y-4">
                                {user.assignedClasses.map((cls, idx) => (
                                    <li key={idx} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                        <div className="w-10 h-10 bg-white shadow-sm text-gray-700 flex items-center justify-center rounded-lg border border-gray-200">
                                            <Users size={18} />
                                        </div>
                                        <div className="font-semibold text-gray-700">{cls}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No classes assigned to you.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

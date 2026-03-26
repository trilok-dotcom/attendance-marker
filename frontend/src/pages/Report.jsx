import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Download, Check, X } from 'lucide-react';

const Report = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const { data } = await api.get(`/attendance/report/${sessionId}`);
                setReport(data);
            } catch (err) {
                setError('Failed to load report');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [sessionId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F4FC]">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-[#F0F4FC] text-red-500">{error}</div>;

    const { stats, presentStudents, absentStudents, session } = report;

    const exportCsv = () => {
        const headers = ["Name,Roll No,Status\n"];
        const presentRows = presentStudents.map(s => `${s.name},${s.rollNo},Present\n`);
        const absentRows = absentStudents.map(s => `${s.name},${s.rollNo},Absent\n`);
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(presentRows, absentRows).join("");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_Report_${session.subject}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="min-h-screen bg-[#F0F4FC] p-6 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={20}/></button>
                            <h1 className="text-2xl font-bold font-['Manrope'] text-gray-800">Attendance Report</h1>
                        </div>
                        <p className="text-gray-500 ml-12 text-sm">{session.subject} • Class: {session.classId}</p>
                    </div>
                    <button onClick={exportCsv} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition shadow-lg">
                        <Download size={18} /> Export CSV
                    </button>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center shadow-sm">
                        <div className="text-sm font-semibold text-gray-500 mb-1">Total Students</div>
                        <div className="text-3xl font-bold text-gray-800 font-['Manrope']">{stats.total}</div>
                    </div>
                    <div className="bg-blue-500 p-6 rounded-2xl border border-blue-600 text-center shadow-lg shadow-blue-500/30 text-white">
                        <div className="text-sm font-semibold opacity-90 mb-1">Present</div>
                        <div className="text-3xl font-bold font-['Manrope']">{stats.present}</div>
                    </div>
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center shadow-sm">
                        <div className="text-sm font-semibold text-red-500 mb-1">Absent</div>
                        <div className="text-3xl font-bold text-red-600 font-['Manrope']">{stats.absent}</div>
                    </div>
                </div>

                {/* Tables */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Present List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-2">
                            <Check className="text-green-600" size={20}/>
                            <h3 className="font-bold text-green-900 text-lg">Present List</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {presentStudents.map(student => (
                                <div key={student._id} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="font-medium text-gray-800">{student.name}</span>
                                    <span className="text-sm text-gray-500">{student.rollNo}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Absent List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
                            <X className="text-red-600" size={20}/>
                            <h3 className="font-bold text-red-900 text-lg">Absent List</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {absentStudents.map(student => (
                                <div key={student._id} className="flex justify-between p-3 bg-red-50/50 rounded-xl">
                                    <span className="font-medium text-gray-800">{student.name}</span>
                                    <span className="text-sm text-gray-500">{student.rollNo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report;

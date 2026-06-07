import React, { useState, useEffect } from 'react';
import { Trash2, Plus, LogOut } from 'lucide-react';

const HRAttendanceApp = () => {
  const [workers, setWorkers] = useState([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [activeTab, setActiveTab] = useState('checkin');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Load data from localStorage
  useEffect(() => {
    const savedWorkers = localStorage.getItem('hrWorkers');
    const savedCheckins = localStorage.getItem('hrCheckins');
    if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    if (savedCheckins) setCheckins(JSON.parse(savedCheckins));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('hrWorkers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('hrCheckins', JSON.stringify(checkins));
  }, [checkins]);

  const addWorker = () => {
    if (newWorkerName.trim() && !workers.includes(newWorkerName)) {
      setWorkers([...workers, newWorkerName]);
      setNewWorkerName('');
    }
  };

  const deleteWorker = (name) => {
    setWorkers(workers.filter(w => w !== name));
    setCheckins(checkins.filter(c => c.workerName !== name));
  };

  const handleCheckIn = () => {
    if (!selectedWorker) return;
    const now = new Date();
    const timestamp = now.toISOString();
    setCheckins([...checkins, {
      id: Date.now(),
      workerName: selectedWorker,
      checkInTime: timestamp,
      checkOutTime: null
    }]);
  };

  const handleCheckOut = (checkinId) => {
    const now = new Date().toISOString();
    setCheckins(checkins.map(c =>
      c.id === checkinId ? { ...c, checkOutTime: now } : c
    ));
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return { time: `${hours}:${minutes}`, date: `${day}/${month}/${year}` };
  };

  const getDayString = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Today's check-ins
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckins = checkins.filter(c => getDayString(c.checkInTime) === today);

  // Monthly report
  const monthCheckins = checkins.filter(c => c.checkInTime.slice(0, 7) === selectedMonth);
  const monthStats = workers.map(worker => {
    const workerCheckins = monthCheckins.filter(c => c.workerName === worker);
    const daysPresent = new Set(workerCheckins.map(c => getDayString(c.checkInTime))).size;
    const avgHours = workerCheckins.length > 0
      ? (workerCheckins.reduce((sum, c) => {
          if (c.checkOutTime) {
            const checkIn = new Date(c.checkInTime).getTime();
            const checkOut = new Date(c.checkOutTime).getTime();
            return sum + (checkOut - checkIn) / (1000 * 60 * 60);
          }
          return sum;
        }, 0) / workerCheckins.length).toFixed(1)
      : '-';
    return { worker, daysPresent, avgHours, totalCheckins: workerCheckins.length };
  });

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">ניהול נוכחות עובדים</h1>
          <p className="text-gray-600">מערכת תיעוד נוכחות עובדים בזמן אמת</p>
        </div>

        {/* Worker Management */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-indigo-800 mb-4">ניהול עובדים</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newWorkerName}
              onChange={(e) => setNewWorkerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addWorker()}
              placeholder="הוסף עובד חדש"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addWorker}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={20} />
              הוסף
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {workers.map(worker => (
              <div key={worker} className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full flex items-center gap-2">
                {worker}
                <button
                  onClick={() => deleteWorker(worker)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              activeTab === 'checkin'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-600 border-2 border-indigo-600'
            }`}
          >
            כניסה/יציאה
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-600 border-2 border-indigo-600'
            }`}
          >
            דוח נוכחות יומי
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              activeTab === 'report'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-600 border-2 border-indigo-600'
            }`}
          >
            דוח חודשי
          </button>
        </div>

        {/* Check-in Tab */}
        {activeTab === 'checkin' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-800 mb-6">כניסה/יציאה</h2>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg text-right text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">בחר עובד</option>
              {workers.map(worker => (
                <option key={worker} value={worker}>{worker}</option>
              ))}
            </select>
            <button
              onClick={handleCheckIn}
              disabled={!selectedWorker}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white text-lg transition ${
                selectedWorker
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              כניסה {new Date().toLocaleTimeString('he-IL')}
            </button>
          </div>
        )}

        {/* Attendance Table Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-800 mb-4">דוח נוכחות - {today}</h2>
            {todayCheckins.length === 0 ? (
              <p className="text-gray-500 text-lg">אין רישומי כניסה היום</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="border p-3 font-bold text-indigo-800">שם עובד</th>
                    <th className="border p-3 font-bold text-indigo-800">שעת כניסה</th>
                    <th className="border p-3 font-bold text-indigo-800">שעת יציאה</th>
                    <th className="border p-3 font-bold text-indigo-800">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {todayCheckins.map(checkin => {
                    const checkInTime = formatDateTime(checkin.checkInTime);
                    const checkOutTime = checkin.checkOutTime ? formatDateTime(checkin.checkOutTime) : null;
                    return (
                      <tr key={checkin.id} className="hover:bg-gray-50">
                        <td className="border p-3">{checkin.workerName}</td>
                        <td className="border p-3">{checkInTime.time}</td>
                        <td className="border p-3">
                          {checkOutTime ? checkOutTime.time : '-'}
                        </td>
                        <td className="border p-3">
                          {!checkin.checkOutTime && (
                            <button
                              onClick={() => handleCheckOut(checkin.id)}
                              className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 flex items-center gap-2 mx-auto"
                            >
                              <LogOut size={16} />
                              יציאה
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Monthly Report Tab */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-indigo-800 mb-4">דוח חודשי</h2>
            <div className="mb-4">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {monthStats.length === 0 ? (
              <p className="text-gray-500 text-lg">אין עובדים</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="border p-3 font-bold text-indigo-800">שם עובד</th>
                    <th className="border p-3 font-bold text-indigo-800">ימי נוכחות</th>
                    <th className="border p-3 font-bold text-indigo-800">סה״כ כניסות</th>
                    <th className="border p-3 font-bold text-indigo-800">ממוצע שעות</th>
                  </tr>
                </thead>
                <tbody>
                  {monthStats.map(stat => (
                    <tr key={stat.worker} className="hover:bg-gray-50">
                      <td className="border p-3 font-bold">{stat.worker}</td>
                      <td className="border p-3 text-center">{stat.daysPresent}</td>
                      <td className="border p-3 text-center">{stat.totalCheckins}</td>
                      <td className="border p-3 text-center">{stat.avgHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendanceApp;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/" element={<div className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to CampusQuery</h1>
            <p className="text-gray-600 mb-4">Student Query Chatbot Admin Panel</p>
            <a href="/admin-dashboard" className="text-blue-600 hover:text-blue-800 underline">
              Go to Admin Dashboard
            </a>
          </div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
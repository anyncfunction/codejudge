import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Submissions from './pages/Submissions';
import Admin from './pages/Admin';
import AdminProblemForm from './pages/AdminProblemForm';
import Leaderboard from './pages/Leaderboard';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/submissions" element={<Submissions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/problems/new" element={<AdminProblemForm />} />
          <Route path="/admin/problems/:id/edit" element={<AdminProblemForm />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

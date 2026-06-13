import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing';
import Login from './components/Login';
import Signup from './components/Signup';
import ManagerDash from './components/ManagerDash';
import RepDash from './components/RepDash';
import TeamOverview from "./components/TeamOverview";
import MyPipeline from './components/MyPipeline';
import Invoices from './components/Invoices';
import Reports from "./components/Reports";
import CalendarPage from './components/CalendarPage';
import TodoPage from './components/TodoPage';

import Settings from './components/Settings';
import ProfilePage from './components/ProfilePage';
import { getCurrentUser } from './utils/auth';
import { ProtectedRoute, PublicRoute } from './components/AuthGuards';

import LayoutWrapper from './components/LayoutWrapper';

const DashboardRouter = () => {
  const user = getCurrentUser();
  // Handle both backend string "Sales Manager" and potential slug "sales_manager"
  const isManager = user?.role === 'Sales Manager' || user?.role === 'sales_manager';
  return isManager ? <ManagerDash /> : <RepDash />;
};


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Public-only routes (redirect to dashboard if logged in) */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          
          {/* Protected routes (redirect to login if not logged in) */}
          <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/team-overview" element={<TeamOverview />} />
            <Route path="/mypipeline" element={<MyPipeline />}/>
            <Route path="/invoices" element={<Invoices />}/>
            <Route path="/reports" element={<Reports />}/>
            <Route path="/settings" element={<Settings />} />
            <Route path="/calendar" element={<CalendarPage />}/>
            <Route path="/todo" element={<TodoPage />}/>
            <Route path="/profile" element={<ProfilePage />}/>
          </Route>

          {/* Legacy redirects */}
          <Route path="/rep-dash" element={<Navigate to="/dashboard" replace />} />
          <Route path="/manager-dash" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

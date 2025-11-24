import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import PeriodsPage from './pages/PeriodsPage';
import EmpleadosPage from './pages/EmpleadosPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/periodos" element={<PeriodsPage />} />
          <Route path="/empleados" element={<EmpleadosPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

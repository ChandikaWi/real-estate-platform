import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Home = () => <h1>Home Page - Search Properties</h1>;
const Login = () => <h1>Login / Register</h1>;
const Dashboard = () => <h1>Seller Dashboard</h1>;
const PropertyDetails = () => <h1>Property Details</h1>;

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav>
          <h2>Real Estate Marketplace</h2>
        </nav>
        
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
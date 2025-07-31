import './App.css'
import { BrowserRouter } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import Router from './routes/Router';

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>

          <Router />

      </BrowserRouter>
    </RoleProvider>
  )
}

export default App

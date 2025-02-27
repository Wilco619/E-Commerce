import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRoutes from './App.jsx'
import { AuthProvider } from './authentication/AuthContext' // Assuming this exists based on your imports
import { CartProvider } from './authentication/CartContext.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import './index.css'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Header />
            <main>
              <AppRoutes />
            </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
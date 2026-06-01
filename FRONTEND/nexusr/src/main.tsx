import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Asegúrate de que apunte a tu index.css actualizado

createRoot(document.getElementById('root')!).render(
    <App />
)
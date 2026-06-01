import { useState } from "react";
import Nav from '../../components/nav';
import Aside from '../../components/aside';
import { Outlet } from 'react-router-dom';

export default function Home() {
  // 1. Declaramos el estado global de la barra lateral para el entorno responsive
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Funciones controladoras
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      {/* 2. Le pasamos la función al Nav para que la ejecute el botón hamburguesa */}
      <Nav onToggleSidebar={toggleSidebar} />
      
      {/* 3. Le pasamos el estado y la función de cierre al Aside */}
      <Aside isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {/* Contenedor dinámico principal */}
      <main className="pt-20 lg:pl-64 p-4 text-slate-800 transition-all duration-300">
        <Outlet /> 
      </main>

      {/* 4. CAPA OSCURA (Overlay): Bloquea la pantalla trasera en móvil cuando el menú está abierto */}
      {isSidebarOpen && (
        <div 
          onClick={closeSidebar}
          className="fixed inset-0 z-10 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
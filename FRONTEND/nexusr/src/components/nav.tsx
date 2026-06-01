import { Navbar, NavbarBrand } from "flowbite-react";
import { SlEnergy } from "react-icons/sl";
import { HiMenu, HiLogout } from "react-icons/hi";
import { IoIosNotificationsOutline } from "react-icons/io";
import { Link } from 'react-router-dom';

export default function Nav({ userName = "Usuario Nexus", userRol = "Usuario" }) {
  return (
    <Navbar 
      fluid 
      className="fixed top-0 z-30 w-full border-b border-slate-200 bg-white px-3 py-3 shadow-sm lg:px-5"
    >
      {/* Contenedor principal para forzar la alineación extrema y vertical */}
      <div className="flex w-full items-center justify-between">
        
        {/* CONTENEDOR IZQUIERDO: Botón Móvil + Logo */}
        <div className="flex items-center justify-start">
          {/* Botón Hamburguesa */}
          <button
            id="toggleSidebarMobile"
            type="button"
            className="mr-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-[#005f43] focus:outline-none lg:hidden"
          >
            <HiMenu className="h-6 w-6" />
          </button>

          {/* Logo NEXUS 3 */}
          <NavbarBrand href="#" className="ml-2 flex items-center gap-2">
            <SlEnergy className="h-7 w-7 text-[#005f43]" />
            <span className="self-center whitespace-nowrap text-xl font-bold italic tracking-tighter text-slate-900 select-none sm:text-2xl">
              NEXUS 3
            </span>
          </NavbarBrand>
        </div>

        {/* CONTENEDOR DERECHO: Notificaciones + Info Usuario + Salir */}
        <div className="flex items-center gap-4">
          
          {/* Botón de Notificaciones (Campana más grande) */}
          <button 
            type="button" 
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none"
          >
            {/* Subimos de h-5 w-5 a h-6 w-6 */}
            <IoIosNotificationsOutline className="h-6 w-6" />
            {/* Ajustamos la posición del punto rojo para la campana más grande */}
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Bloque de Usuario (Letras más grandes) */}
          <div className="hidden border-l border-slate-200 pl-4 text-right select-none sm:flex sm:flex-col sm:justify-center">
            {/* Subimos de text-sm a text-base (o text-lg si lo quieres gigante) */}
            <p className="text-base font-bold leading-tight text-slate-900">
              {userName}
            </p>
            {/* Subimos de text-[10px] a text-xs */}
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#005f43]">
              {userRol}
            </p>
          </div>

          {/* Botón de Cerrar Sesión */}
          <Link
              to="/Login"
          
            className="flex items-center justify-center rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 focus:outline-none"
          >
            <HiLogout className="h-6 w-6" />
          </Link>

        </div>
        
      </div>
    </Navbar>
  );
}
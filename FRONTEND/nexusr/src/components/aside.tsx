import { useState } from "react";
import { NavLink } from 'react-router-dom'; 
import { useAuth } from "../services/AuthContext"; 

import { GoHome } from "react-icons/go";
import { MdOutlineElectricCar, MdElectricRickshaw } from "react-icons/md";
import { SlEnergy } from "react-icons/sl";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";


interface AsideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Aside({ isOpen, onClose }: AsideProps) {
  const { user } = useAuth(); 
  const [isIntegralOpen, setIsIntegralOpen] = useState(false);
  const [isSwingOpen, setIsSwingOpen] = useState(false);
  const [isVerdiOpen, setIsVerdiOpen] = useState(false);

  // Mapeamos el nombre dinámico del usuario o usamos el fallback
  const userName = user?.name || "Usuario Nexus";
  const userInitial = userName.charAt(0).toUpperCase();

  const mainLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-xl p-3 text-base font-medium transition-all ${
      isActive 
        ? "bg-white text-[#005f43] shadow-md font-bold" 
        : "text-white hover:bg-white/10"     
    }`;

  // Componente para los submenús 
  const subLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center rounded-lg pl-6 p-2 text-sm transition-all ${
      isActive 
        ? "bg-white text-[#005f43] font-bold shadow-sm" 
        : "text-emerald-100 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <aside
      id="sidebar"
      className={`fixed left-0 top-0 z-20 flex h-full w-64 flex-col flex-shrink-0 pt-16 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:flex`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col border-r border-emerald-900 bg-[#005f43] shadow-xl">
        <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-5 custom-scroll">
          <div className="flex-1 space-y-1 px-3">
            <ul className="space-y-2">
              
              {/* Opción: Inicio */}
              <li>
                <NavLink to="/home" end className={mainLinkStyle} onClick={onClose}>
                  <GoHome className="h-5 w-5" />
                  <span className="ml-3">Inicio</span>
                </NavLink>
              </li>

              <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[2px] text-emerald-200 opacity-70">
                Empresas
              </p>

              {/* MENU 1: Integral Group */}
              <li>
                <button
                  type="button"
                  onClick={() => setIsIntegralOpen(!isIntegralOpen)}
                  className="group flex w-full items-center rounded-xl p-3 text-base text-emerald-50 transition duration-150 hover:bg-white/10"
                >
                  <MdOutlineElectricCar className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                  <span className="ml-3 flex-1 text-left whitespace-nowrap">Integral Group</span>
                  {isIntegralOpen ? <HiChevronUp className="h-4 w-4 opacity-50" /> : <HiChevronDown className="h-4 w-4 opacity-50" />}
                </button>
                
                <ul className={`${isIntegralOpen ? "block" : "hidden"} ml-4 space-y-1 border-l border-white/10 py-2`}>
                  <li>
                    <NavLink to="/home/Integral-InventoryParts" className={subLinkStyle} onClick={onClose}>
                      Inventario de Partes
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Integral-InventoryCar" className={subLinkStyle} onClick={onClose}>
                      Inventario de Carros
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Integral-GeneratorTxtVehicle" className={subLinkStyle} onClick={onClose}>
                      Generador TXT Vehículos
                    </NavLink>
                  </li>
                   
                  <li>
                    <NavLink to="/home/Integral-GeneratorTxtClient" className={subLinkStyle} onClick={onClose}>
                      Generador TXT Clientes
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Integral-GeneratorInvoice" className={subLinkStyle} onClick={onClose}>
                      Generador de Facturas
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* MENU 2: Swing Energy */}
              <li>
                <button
                  type="button"
                  onClick={() => setIsSwingOpen(!isSwingOpen)}
                  className="group flex w-full items-center rounded-xl p-3 text-base text-emerald-50 transition duration-150 hover:bg-white/10"
                >
                  <SlEnergy className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                  <span className="ml-3 flex-1 text-left whitespace-nowrap">Swing Energy</span>
                  {isSwingOpen ? <HiChevronUp className="h-4 w-4 opacity-50" /> : <HiChevronDown className="h-4 w-4 opacity-50" />}
                </button>

                <ul className={`${isSwingOpen ? "block" : "hidden"} ml-4 space-y-1 border-l border-white/10 py-2`}>
                  <li>
                    <NavLink to="/home/Swing-Dashboard" className={subLinkStyle} onClick={onClose}>
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Swing-Transactions" className={subLinkStyle} onClick={onClose}>
                      Transacciones
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* MENU 3: Verdi */}
              <li>
                <button
                  type="button"
                  onClick={() => setIsVerdiOpen(!isVerdiOpen)}
                  className="group flex w-full items-center rounded-xl p-3 text-base text-emerald-50 transition duration-150 hover:bg-white/10"
                >
                  <MdElectricRickshaw className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                  <span className="ml-3 flex-1 text-left whitespace-nowrap">Verdi</span>
                  {isVerdiOpen ? <HiChevronUp className="h-4 w-4 opacity-50" /> : <HiChevronDown className="h-4 w-4 opacity-50" />}
                </button>

                <ul className={`${isVerdiOpen ? "block" : "hidden"} ml-4 space-y-1 border-l border-white/10 py-2`}>
                  <li>
                    <NavLink to="/home/Verdi-Santions" className={subLinkStyle} onClick={onClose}>
                      Amonestación de Conductores
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Verdi-Allocation" className={subLinkStyle} onClick={onClose}>
                      Asignación de Unidades
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Verdi-Drivers" className={subLinkStyle} onClick={onClose}>
                      Conductores
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Verdi-LoadControl" className={subLinkStyle} onClick={onClose}>
                      Control de Carga
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Verdi-Units" className={subLinkStyle} onClick={onClose}>
                      Control de Unidades
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/home/Verdi-Dashboard" className={subLinkStyle} onClick={onClose}>
                      Dashboard
                    </NavLink>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* PIE DE PÁGINA DEL SIDEBAR - DATOS AUTOMATIZADOS */}
        <div className="border-t border-white/10 bg-black/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-white">{userName}</p>
              <p className="text-[10px] text-emerald-300">Conectado</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
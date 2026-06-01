import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../services/AuthContext"; 
import ProtectedRoute from "../services/ProtectedRoute"; 

import Login from "../pages/auth/login";
import Home from "../pages/index/home";
import Inicio from "../components/inicio";

//-------------------SWING ENERGY-------------------------------------------------- 
import DashboardPageSwing from "../pages/swingEnergy/dashboard";
import TransactionsPageSwing from "../pages/swingEnergy/transactions";

//----------------------VERDI---------------------------------------------------------
import AllocationUnitPageVerdi from "../pages/verdi/allocationunit";
import SantionsPageVerdi from "../pages/verdi/santions";
import DriversPageVerdi from "../pages/verdi/drivers";
import LoadControlPageVerdi from "../pages/verdi/loadcontrol";
import UnitsPageVerdi from "../pages/verdi/units";
import DashboardPageVerdi from "../pages/verdi/bi";

export default function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pantalla pública de Login */}
          <Route path="/login" element={<Login />} />
          
          {/* 🔐 Rutas Privadas Protegidas por Sesión de Usuario */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />}>
              <Route index element={<Inicio />} />
              
              {/* ROUTES SWING ENERGY */}
              <Route path="Swing-Dashboard" element={<DashboardPageSwing />} />
              
              <Route element={<ProtectedRoute requiredPermission="transactions:view" />}>
                <Route path="Swing-Transactions" element={<TransactionsPageSwing />} />
              </Route>

              {/* ROUTES VERDI */}
              <Route path="Verdi-Allocation" element={<AllocationUnitPageVerdi />} />
              <Route path="Verdi-Santions" element={<SantionsPageVerdi />} />
              <Route path="Verdi-Drivers" element={<DriversPageVerdi />} />
              <Route path="Verdi-LoadControl" element={<LoadControlPageVerdi />} />
              <Route path="Verdi-Units" element={<UnitsPageVerdi />} />
              <Route path="Verdi-Dashboard" element={<DashboardPageVerdi />} />
            </Route>
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
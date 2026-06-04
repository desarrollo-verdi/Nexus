import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../services/AuthContext"; 
import ProtectedRoute from "../services/ProtectedRoute"; 

import Login from "../pages/auth/login";
import Home from "../pages/index/home";
import Inicio from "../components/inicio";

//-------------------INTEGRAL GROUP------------------------------------------------

import InventoryPartsPageIntegral from "../pages/integralGroup/inventoryparts";
import InventoryCarPageIntegral from "../pages/integralGroup/inventorycar";
import GeneratorTxtVehiclePageIntegral from "../pages/integralGroup/generatortxtvehicle";
import GeneratorTxtClientPageIntegral from "../pages/integralGroup/generatortxtclient";
import InvoiceGeneratorPageIntegral from "../pages/integralGroup/generatorinvoice";

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
              
              {/* ROUTES INTEGRAL GROUP */}
              <Route path="Integral-InventoryParts" element={<InventoryPartsPageIntegral/>} />
              <Route path="Integral-InventoryCar" element={<InventoryCarPageIntegral/>} />
              <Route path="Integral-GeneratorTxtVehicle" element={<GeneratorTxtVehiclePageIntegral/>} />
              <Route path="Integral-GeneratorTxtClient" element={<GeneratorTxtClientPageIntegral/>}/>
               <Route path="Integral-GeneratorInvoice" element={<InvoiceGeneratorPageIntegral/>}/>
              {/* ROUTES SWING ENERGY */}
              <Route path="Swing-Dashboard" element={<DashboardPageSwing />} />
              <Route path="Swing-Transactions" element={<TransactionsPageSwing />} />
              
              <Route element={<ProtectedRoute requiredPermission="transactions:view" />}>
                
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
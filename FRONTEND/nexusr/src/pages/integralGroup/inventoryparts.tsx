import Headed from "../../components/headed";
import StatCard from "../../components/swingEnergyComponents/transactions/statcard";
import { ArrowLeftRight, Zap, Users, ShieldAlert, History, Calendar, Info, Clock, Save, X } from "lucide-react";

export default function InventoryPartsPageIntegral(){
    return(
        <div className="px-6 py-6 relative">
      {/* Encabezado */}
      <Headed title="Inventario de Partes" description="Gestión de repuestos de Integral Group" />
       {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Transacciones"
          textColor="text-slate-800"
          description="Total de Transacciones"
          value={"0"} 
          period="Anual"
          borderColor="border-l-slate-600"
          bgColor="bg-slate-50"
          icon={<ArrowLeftRight className="w-5 h-5 text-[#005f43]" />}
        />
        <StatCard
          title="Energía"
          textColor="text-blue-500"
          description="Total de Energía"
          value={"0.00"}
          unit="kWh"
          period="ANUAL"
          borderColor="border-l-blue-400"
          bgColor="bg-blue-50"
          icon={<Zap className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Usuarios"
          textColor="text-blue-900"
          description="Usuarios Atendidos"
          value={"0"}
          period="ANUAL"
          borderColor="border-l-blue-900"
          bgColor="bg-blue-100"
          icon={<Users className="w-5 h-5 text-blue-900" />}
        />
        <StatCard
          title="Cargadores"
          textColor="text-emerald-700"
          description="Cargadores Empleados"
          value={"0"}
          period="ALCANCE"
          borderColor="border-l-emerald-600"
          bgColor="bg-emerald-50"
          icon={<Zap className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Pendientes"
          textColor="text-amber-600"
          description="Por Completar"
          value={"0"} 
          period="Atención"
          borderColor="border-l-amber-400"
          bgColor="bg-amber-50"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
        />
        </div>
      </div>
    )
}
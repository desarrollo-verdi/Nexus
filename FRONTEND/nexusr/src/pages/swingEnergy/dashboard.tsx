import { useState, useEffect } from "react"; // 💡 Importaciones de React agregadas
import Headed from "../../components/headed";
import StatCard from "../../components/swingEnergyComponents/transactions/statcard";
import TopChargers from "../../components/swingEnergyComponents/dashboard/topChargers";
import OrganizationDistribution from "../../components/swingEnergyComponents/dashboard/organizationdistribution";
import UserRanking from "../../components/swingEnergyComponents/dashboard/userracking";
import api from "../../services/api"; 
import { HandCoins, Banknote, Building2 } from "lucide-react";

interface SummaryEarnings {
  amount_rent_a_car: string;
  amount_cliente: string;
}

export default function DashboardPageSwing() {
  const [summary, setSummary] = useState<SummaryEarnings | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true); // 💡 Estado de carga agregado

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await api.get<SummaryEarnings>("/consultEarningsSW");
      setSummary(response.data);
    } catch (error) {
      console.error("❌ Error en resumen:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 💡 Dispara la petición automáticamente al cargar la página
  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="px-6 py-6 relative">
      {/* Encabezado */}
      <Headed title="Dashboard BI" description="Análisis de eficiencia y consumo energético" />
      
      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        {/* 🟢 GANANCIAS RENT A CAR */}
        <StatCard
          title="ganancias Rent a car "
          textColor="text-emerald-800"
          description="Ganancias de RENT A CAR"
          value={isLoadingSummary ? "..." : summary?.amount_rent_a_car || "0"} 
          unit="USD"
          period="Anual"
          borderColor="border-l-emerald-900"
          bgColor="bg-emerald-50"
          icon={<HandCoins className="w-5 h-5 text-[#005f43]" />}
        />

        {/* 🔵 GANANCIAS DE CLIENTES */}
        <StatCard
          title="ganancias de clientes"
          textColor="text-blue-500"
          description="Ganancias de Clientes"
          // 💡 Acceso seguro a través del estado summary
          value={isLoadingSummary ? "..." : summary?.amount_cliente || "0"}
          unit="USD"
          period="ANUAL"
          borderColor="border-l-blue-400"
          bgColor="bg-blue-50"
          icon={<Banknote className="w-5 h-5 text-blue-600" />}
        />

        {/* 🏢 ORGANIZACIONES */}
        <StatCard
          title="Usuarios"
          textColor="text-blue-900"
          description="Organizaciones Activas"
          value="3"
          period="Total"
          borderColor="border-l-blue-900"
          bgColor="bg-blue-100"
          icon={<Building2 className="w-5 h-5 text-blue-900" />}
        />
      </div>

      {/* Sección del Top 3 de Cargadores AC vs DC */}
      <div className="mt-8">
        <TopChargers />
      </div>

      {/* Sección Inferior: Distribución y Ranking de los 10 Usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <OrganizationDistribution />
        <UserRanking />
      </div>
    </div>
  );
}
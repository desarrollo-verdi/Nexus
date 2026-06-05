import { useState, useEffect } from "react";
import api from "../../../services/api";
import { PlugZap, CarFront } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels"; 


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface ChartData {
  kwh: number[];
  names: string[];
  counts: number[];
}

interface ApiResponse {
  fn_s_api_consult_top3_ac_dc_by_org: {
    ac: ChartData;
    dc: ChartData;
  };
}

export default function TopChargers() {
  const [dataClientes, setDataClientes] = useState<ApiResponse | null>(null);
  const [loadingClientes, setLoadingClientes] = useState<boolean>(true);

  const [dataRac, setDataRac] = useState<ApiResponse | null>(null);
  const [loadingRac, setLoadingRac] = useState<boolean>(true);

  const fetchTopClientes = async () => {
    setLoadingClientes(true);
    try {
      const response = await api.post<ApiResponse>("/consultTop3Chargers", {
        p_id_organization: 6,
      });
      setDataClientes(response.data);
    } catch (error) {
      console.error("❌ Error en /consultTop3Chargers (Clientes):", error);
    } finally {
      setLoadingClientes(false);
    }
  };

  const fetchTopRac = async () => {
    setLoadingRac(true);
    try {
      const response = await api.post<ApiResponse>("/consultTop3Chargers", {
        p_id_organization: 4,
      });
      setDataRac(response.data);
    } catch (error) {
      console.error("❌ Error en /consultTop3Chargers (RAC):", error);
    } finally {
      setLoadingRac(false);
    }
  };

  useEffect(() => {
    fetchTopClientes();
    fetchTopRac();
  }, []);

  // Estructuración de los dos datasets (Energía y Transacciones)
  const buildChartData = (
    chartData: ChartData | undefined, 
    colorKwh: string, 
    colorCounts: string
  ) => {
    const names = chartData?.names || [];
    const kwh = chartData?.kwh || [];
    const counts = chartData?.counts || [];

    return {
      // Recorta nombres largos para que no colapsen el diseño lateral izquierdo
      labels: names.map(name => name.length > 22 ? name.substring(0, 20) + "..." : name),
      datasets: [
        {
          label: "Energía (kWh)",
          data: kwh,
          backgroundColor: colorKwh,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 14, // Ancho controlado de barra
        },
        {
          label: "Transacciones",
          data: counts,
          backgroundColor: colorCounts,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 14,
        },
      ],
    };
  };

  // Configuración de opciones adaptada para coincidir con la imagen
  const getChartOptions = () => ({
    indexAxis: "y" as const, // 👈 Esto hace que el gráfico sea Horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "end" as const, // Alineado a la derecha
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: "bold" as const },
          color: "#475569"
        }
      },
      tooltip: {
        enabled: true
      },
      // Configuración de los números flotantes al lado de cada barra
      datalabels: {
        display: true,
        anchor: "end" as const,
        align: "right" as const,
        offset: 4,
        color: "#1e293b",
        font: { size: 10, weight: "bold" as const },
        formatter: (value: number) => value % 1 === 0 ? value : value.toFixed(2),
      }
    },
    scales: {
      x: {
        grid: { color: "#e2e8f0" },
        ticks: { font: { size: 10 }, color: "#94a3b8" },
      },
      y: {
        grid: { display: false },
        ticks: { 
          font: { size: 10, weight: "500" as const }, 
          color: "#334155" 
        },
      },
    },
  });

  const cleanClientes = dataClientes?.fn_s_api_consult_top3_ac_dc_by_org;
  const cleanRac = dataRac?.fn_s_api_consult_top3_ac_dc_by_org;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 🟢 TARJETA CLIENTES */}
      <ChargerCard
        title="Top Cargadores"
        subtitle="Clientes"
        techSubtitle="Desglose AC vs DC"
        titleColorClass="text-emerald-900"
        iconBgClass="bg-slate-900"
        icon={<PlugZap className="w-6 h-6" />}
        isLoading={loadingClientes}
      >
        <div className="space-y-12">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-900 mb-2 block">
              Tecnología AC (Lenta)
            </span>
            <div className="h-[220px] w-full">
              {cleanClientes?.ac.names.length ? (
                <Bar options={getChartOptions()} data={buildChartData(cleanClientes?.ac, "#1e5343", "#15803d")} />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">Sin datos registrados</div>
              )}
            </div>
          </div>
          <hr className="border-slate-100" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-900 mb-2 block">
              Tecnología DC (Rápida)
            </span>
            <div className="h-[220px] w-full">
              {cleanClientes?.dc.names.length ? (
                <Bar options={getChartOptions()} data={buildChartData(cleanClientes?.dc, "#1e5343", "#15803d")} />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">Sin datos registrados</div>
              )}
            </div>
          </div>
        </div>
      </ChargerCard>

      {/* 🔵 TARJETA RENT A CAR */}
      <ChargerCard
        title="Top Cargadores"
        subtitle="Rent a Car"
        techSubtitle="Desglose AC vs DC"
        titleColorClass="text-blue-900"
        iconBgClass="bg-blue-900"
        icon={<CarFront className="w-6 h-6" />}
        isLoading={loadingRac}
      >
        <div className="space-y-12">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-blue-900 mb-2 block">
              Tecnología AC (Lenta)
            </span>
            <div className="h-[220px] w-full">
              {cleanRac?.ac.names.length ? (
                <Bar options={getChartOptions()} data={buildChartData(cleanRac?.ac, "#2e4a8a", "#2563eb")} />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">Sin datos registrados</div>
              )}
            </div>
          </div>
          <hr className="border-slate-100" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-blue-900 mb-2 block">
              Tecnología DC (Rápida)
            </span>
            <div className="h-[220px] w-full">
              {cleanRac?.dc.names.length ? (
                <Bar options={getChartOptions()} data={buildChartData(cleanRac?.dc, "#2e4a8a", "#2563eb")} />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">Sin datos registrados</div>
              )}
            </div>
          </div>
        </div>
      </ChargerCard>

    </div>
  );
}

// --- SUB-COMPONENTE AUXILIAR ---
interface ChargerCardProps {
  title: string;
  subtitle: string;
  techSubtitle: string;
  titleColorClass: string;
  iconBgClass: string;
  icon: React.ReactNode;
  isLoading: boolean;
  children: React.ReactNode;
}

function ChargerCard({
  title,
  subtitle,
  techSubtitle,
  titleColorClass,
  iconBgClass,
  icon,
  isLoading,
  children,
}: ChargerCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 transition-all hover:shadow-xl group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${iconBgClass} text-white flex items-center justify-center rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div>
            <h5 className="text-lg font-black text-slate-900 leading-tight">
              {title} <span className={titleColorClass}>{subtitle}</span>
            </h5>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {techSubtitle}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-4">
          <div className="h-36 w-full bg-slate-50 animate-pulse rounded-xl"></div>
          <div className="h-36 w-full bg-slate-50 animate-pulse rounded-xl"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../../../services/api";
import { Users } from "lucide-react";

// 📊 Importaciones esenciales de Chart.js
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

// Registrar componentes
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// --- Interface para la API ---
interface UserRankingData {
  username: string;
  total_units: string;         // Mapea con "Consumo (kWh)"
  total_transactions: string;  // Mapea con "Transacciones"
}

export default function UserRanking() {
  const [rankingData, setRankingData] = useState<UserRankingData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Consumo del Endpoint GET
  const fetchUserRanking = async () => {
  setLoading(true);
  try {
    const response = await api.get<UserRankingData | UserRankingData[]>("/consultTop10Customers");
    
    // 💡 VALIDACIÓN CRUCIAL: Si la API manda un objeto directo {}, lo metemos dentro de un arreglo []
    if (response.data && !Array.isArray(response.data)) {
      setRankingData([response.data]); 
    } else {
      setRankingData(response.data || []);
    }
  } catch (error) {
    console.error("❌ Error en /consultTop10Customers:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUserRanking();
  }, []);

  // Mapeo y ordenamiento de la información para los datasets
  const buildChartData = (data: UserRankingData[]) => {
    const labels = data.map((user) => user.username);
    const kwh = data.map((user) => parseFloat(user.total_units) || 0);
    const transactions = data.map((user) => parseInt(user.total_transactions, 10) || 0);

    return {
      labels: labels,
      datasets: [
        {
          label: "Consumo (kWh)",
          data: kwh,
          backgroundColor: "#3b82f6", // Azul principal del diseño
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 10, // Un poco más delgadas para que quepan bien los 10 usuarios
        },
        {
          label: "Transacciones",
          data: transactions,
          backgroundColor: "#1d4ed8", // Azul oscuro para transacciones
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 10,
        },
      ],
    };
  };

  // Configuración de opciones del gráfico para coincidir con la captura
  const chartOptions = {
    indexAxis: "y" as const, // Gráfico Horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const, // Leyendas al fondo como en la captura
        align: "center" as const,
        labels: {
          boxWidth: 16,
          usePointStyle: false, // Cuadrados tradicionales de leyenda
          font: { size: 12, weight: "500" as const },
          color: "#64748b",
        },
      },
      tooltip: {
        enabled: true,
      },
      // Números al final de cada barra horizontal
      datalabels: {
        display: true,
        anchor: "end" as const,
        align: "right" as const,
        offset: 4,
        color: "#2563eb", // Color dinámico azul para los números
        font: { size: 10, weight: "bold" as const },
        formatter: (value: number) => (value % 1 === 0 ? value : value.toFixed(2)),
      },
    },
    scales: {
      x: {
        grid: {
          color: "#f1f5f9",
          drawTicks: false,
        },
        border: { dash: [4, 4] }, // Líneas guía punteadas de fondo
        ticks: { font: { size: 11 }, color: "#94a3b8" },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: "600" as const },
          color: "#1e293b",
        },
      },
    },
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 transition-all hover:shadow-xl group w-full">
      {/* Encabezado e Icono */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-lg font-black text-slate-900 leading-tight">
              Ranking de Usuarios
            </h5>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Consumo Individual Acumulado
            </p>
          </div>
        </div>
      </div>

      {/* Renderizado de gráficos o estados de carga */}
      {loading ? (
        <div className="space-y-3 py-4">
          <div className="h-8 w-full bg-slate-50 animate-pulse rounded-lg"></div>
          <div className="h-8 w-full bg-slate-50 animate-pulse rounded-lg"></div>
          <div className="h-8 w-full bg-slate-50 animate-pulse rounded-lg"></div>
          <div className="h-8 w-full bg-slate-50 animate-pulse rounded-lg"></div>
          <div className="h-8 w-full bg-slate-50 animate-pulse rounded-lg"></div>
        </div>
      ) : rankingData.length > 0 ? (
        /* Altura ampliada a 450px para dar suficiente aire a los 10 registros */
        <div className="h-[450px] w-full mix-blend-multiply">
          <Bar options={chartOptions} data={buildChartData(rankingData)} />
        </div>
      ) : (
        <div className="h-[350px] w-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">
          Sin registros en el ranking de usuarios
        </div>
      )}
    </div>
  );
}
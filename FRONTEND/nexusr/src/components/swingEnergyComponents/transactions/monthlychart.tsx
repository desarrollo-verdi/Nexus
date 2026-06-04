import { useState, useEffect, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Loader2 } from "lucide-react";
import { FaChargingStation } from "react-icons/fa6";
import api from "../../../services/api"; // Importamos tu instancia protegida

// Registrar componentes necesarios en Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Interfaz para estructurar la respuesta del endpoint
interface MonthlyDataAPI {
  mes: string;
  unidades_acumuladas: string;
}

export default function MonthlyChart() {
  const [monthlyData, setMonthlyData] = useState<MonthlyDataAPI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 📡 Petición para obtener los consumos mensuales
  useEffect(() => {
    const fetchMonthlyData = async () => {
      setIsLoading(true);
      try {
        console.log("📊 Consultando consumos de /consultTotalMonthlyTransactions");
        // Cambiado a .get según especificaste en tu ruta
        const response = await api.get("/consultTotalMonthlyTransactions");
        
        if (Array.isArray(response.data)) {
          setMonthlyData(response.data);
        }
      } catch (error) {
        console.error("❌ Error al consultar transacciones mensuales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  // 🔄 Mapeo dinámico de datos para Chart.js usando useMemo
  const chartData = useMemo(() => {
    // Extraemos los nombres de los meses mapeados (ej: ["MAR", "APR"])
    const labels = monthlyData.map((item) => item.mes);

    // Convertimos strings "45.300" a números flotantes 45.3
    const dataValues = monthlyData.map((item) => {
      const parsedValue = parseFloat(item.unidades_acumuladas);
      return isNaN(parsedValue) ? 0 : parsedValue;
    });

    return {
      labels: labels.length > 0 ? labels : ["Sin Datos"],
      datasets: [
        {
          label: "Consumo (kWh)",
          data: dataValues,
          backgroundColor: "#005f43", // Verde Nexus corporativo
          borderRadius: 8,
          hoverBackgroundColor: "#004732",
        },
      ],
    };
  }, [monthlyData]);

  const averageKwh = useMemo(() => {
    if (monthlyData.length === 0) return "0.00";
    const total = monthlyData.reduce((acc, curr) => {
      const value = parseFloat(curr.unidades_acumuladas);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
    return (total / monthlyData.length).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [monthlyData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: "#f1f5f9" }, ticks: { color: "#64748b" } },
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
    },
  };

  return (
    <div className="max-w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-4 md:p-6 transition-all hover:shadow-md">
      <div className="flex justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-full me-3">
            <FaChargingStation className="w-6 h-6 text-[#005f43]" />
          </div>
          <div>
            <h5 className="text-xl font-bold text-slate-900 leading-none mb-1">
              Consumo Energético Mensual
            </h5>
            <p className="text-sm text-slate-500 font-medium">kWh acumulado por mes</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 text-slate-500 text-sm font-medium">
          <span className="text-slate-900 text-lg font-bold">
            {isLoading ? "..." : averageKwh}
          </span>{" "}
          kWh prom
        </div>
      </div>

      {/* Contenedor del Gráfico con estado de carga */}
      <div className="h-[320px] w-full flex items-center justify-center relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 font-medium text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-[#005f43]" />
            Cargando estadísticas de consumo...
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="text-sm text-slate-400 font-medium">
            No hay registros de consumo mensual disponibles.
          </div>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../../../services/api"; // Ajusta la ruta según tu proyecto
import { PieChart } from "lucide-react";

// 📊 Importaciones para el gráfico circular en Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Registrar componentes necesarios para el Pie Chart
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// --- Interface para la API ---
interface DistributionData {
  company: string;
  total_kwh: string; // Viene como string según tu JSON
}

export default function OrganizationDistribution() {
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Consumo del Endpoint GET
  const fetchDistribution = async () => {
    setLoading(true);
    try {
      const response = await api.get<DistributionData[]>("/consultDistributionOfOrganization");
      setData(response.data);
    } catch (error) {
      console.error("❌ Error en /consultDistributionOfOrganization:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
  }, []);

  // 🎨 Paleta de colores basada en tu imagen (Verdes, Azules, Grises corporativos)
  const colorPalette = [

    "#005946",
    "#38b000",
    "#64748b",
    "#1e3a8a",
    "#005946",
    "#64748b", 
    "#0f172a",
    "#1e3a8a", 
    "#047857", 
    "#10b981", 
    "#a3e635", 
  ];

  // Preparar los datos procesando los strings numéricos a flotantes
  const labels = data.map((item) => item.company);
  const values = data.map((item) => parseFloat(item.total_kwh) || 0);

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: colorPalette.slice(0, data.length),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const, 
        labels: {
          usePointStyle: true, 
          pointStyle: "circle",
          padding: 20,
          font: { size: 12, weight: "500" as const },
          color: "#475569",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw.toFixed(3)} kWh`,
        },
      },

      datalabels: {
        display: true,
        color: "#ffffff", // Texto blanco
        font: { size: 12, weight: "bold" as const },
        formatter: (value: number, ctx: any) => {
          const datapoints = ctx.chart.data.datasets[0].data;
          const total = datapoints.reduce((total: number, currentValue: number) => total + currentValue, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return parseFloat(percentage) > 2 ? `${percentage}%` : "";
        },
      },
    },
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 transition-all hover:shadow-xl group w-full">
      {/* Encabezado calcado al diseño previo */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-950 text-slate-100 flex items-center justify-center rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-lg font-black text-slate-900 leading-tight">
              Distribución por Organización
            </h5>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Cuota de Consumo
            </p>
          </div>
        </div>
      </div>

      {/* Renderizado o esqueleto de carga */}
      {loading ? (
        <div className="h-[340px] w-full flex items-center justify-center">
          <div className="w-40 h-40 bg-slate-50 rounded-full animate-pulse flex items-center justify-center border-8 border-slate-100"></div>
        </div>
      ) : data.length > 0 ? (
        <div className="h-[340px] w-full mix-blend-multiply">
          <Pie data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="h-[340px] w-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">
          Sin datos de distribución disponibles
        </div>
      )}
    </div>
  );
}
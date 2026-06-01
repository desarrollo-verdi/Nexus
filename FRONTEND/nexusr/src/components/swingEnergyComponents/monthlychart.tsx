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
import { Zap } from "lucide-react";

// Registrar componentes necesarios en Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MonthlyChart() {
  // Datos Ficticios Manuales para simular tu base de datos provisional
  const data = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    datasets: [
      {
        label: "Consumo (kWh)",
        data: [35, 42, 48, 51, 43, 39, 45, 47, 50, 42, 38, 46],
        backgroundColor: "#005f43", // Verde Nexus corporativo
        borderRadius: 8,
        hoverBackgroundColor: "#004732",
      },
    ],
  };

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
            <Zap className="w-6 h-6 text-[#005f43]" />
          </div>
          <div>
            <h5 className="text-xl font-bold text-slate-900 leading-none mb-1">
              Consumo Energético Mensual
            </h5>
            <p className="text-sm text-slate-500 font-medium">kWh promedio por mes</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 text-slate-500 text-sm font-medium">
          <span className="text-slate-900 text-lg font-bold">43.78</span> kWh
        </div>
      </div>

      {/* Contenedor del Gráfico */}
      <div className="h-[320px] w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
import { useState, ChangeEvent, useEffect } from "react";
import { 
  ArrowLeftRight, Zap, Users, ShieldAlert, 
  UploadCloud, Database, Play, Trash2, History, Loader2 
} from "lucide-react";

import StatCard from "../../components/swingEnergyComponents/statcard";
import MonthlyChart from "../../components/swingEnergyComponents/monthlychart";
import { transactionsService } from "../../services/transactionsService";

interface TransactionMock {
  id: string;
  usuario: string;
  sede: string;
  cargador: string;
  tipo: string;
  kwh: number;
  monto: number;
  fecha: string;
}

export default function TransactionsPageSwing() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  
  // 🟢 NUEVOS ESTADOS: Para renderizar la respuesta real del Endpoint
  const [transactions, setTransactions] = useState<TransactionMock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const cargarTransacciones = async () => {
      console.log("🛸 Intentando consultar API con Axios interceptor unificado...");
      setIsLoading(true);
      setApiError(null);
      
      try {
        const respuestaBD = await transactionsService.testConsultTransactions();
        console.log("✅ ¡Datos de Swing Energy cargados desde el servidor!");
        console.dir(respuestaBD);

        // Si tu backend retorna directamente el array, lo asignamos aquí.
        // Si no hay datos en BD aún, usamos el fallback de los mocks para no dejar vacía la UI
        if (respuestaBD && respuestaBD.length > 0) {
          setTransactions(respuestaBD);
        } else {
          console.log("⚠️ La API respondió vacío o sin registros. Cargando data simulada por defecto.");
          setTransactions(defaultMockTransactions);
        }
      } catch (error: any) {
        console.error("❌ Error al recuperar datos de transacciones:", error);
        setApiError("No se pudo conectar con el servidor de Swing Energy.");
        
        if (error.response?.status === 401) {
          console.error("Tu sesión ha expirado o el token es inválido. Redirigiendo al Login...");
        }
        // Fallback por seguridad en desarrollo: si falla la API, mostramos los mocks
        setTransactions(defaultMockTransactions);
      } finally {
        setIsLoading(false);
      }
    };

    cargarTransacciones();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const clearDateFilter = () => {
    setMinDate("");
    setMaxDate("");
  };

  return (
    <div className="px-6 py-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Carga de Transacciones
        </h1>
        <p className="text-slate-500 font-medium">
          Gestión de transacciones de Swing Energy
        </p>
      </div>

      {/* Grid de 5 Cards Rediseñado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Transacciones"
          description="Total de Transacciones"
          value={isLoading ? "..." : String(transactions.length + 1245)} // Dinámico relativo a la data
          period="Anual"
          borderColor="border-l-slate-600"
          bgColor="bg-slate-50"
          icon={<ArrowLeftRight className="w-5 h-5 text-[#005f43]" />}
        />
        <StatCard
          title="Energía"
          description="Total de Energía Suministrada"
          value="14,250.50"
          unit="kWh"
          period="Anual"
          borderColor="border-l-blue-400"
          bgColor="bg-blue-50"
          icon={<Zap className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Usuarios"
          description="Total de Usuarios Atendidos"
          value="312"
          period="Alcance"
          borderColor="border-l-blue-900"
          bgColor="bg-blue-100"
          icon={<Users className="w-5 h-5 text-blue-900" />}
        />
        <StatCard
          title="Cargadores"
          description="Cargadores Empleados"
          value="18"
          period="Alcance"
          borderColor="border-l-emerald-600"
          bgColor="bg-emerald-50"
          icon={<Zap className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Pendientes"
          description="Por Completar"
          value="4"
          period="Atención"
          borderColor="border-l-amber-400"
          bgColor="bg-amber-50"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Sección Gráfico */}
      <div className="mb-8">
        <MonthlyChart />
      </div>

      {/* Selector de CSV / Dropzone */}
      <div className="space-y-3 mb-8">
        <p className="text-slate-500 font-medium">
          Importa el archivo CSV para actualizar el historial de operaciones.
        </p>

        {!csvFile ? (
          <div className="group relative bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 transition-all duration-300 hover:border-[#005f43] hover:bg-emerald-50/20 flex flex-col items-center justify-center cursor-pointer shadow-sm">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="p-6 bg-emerald-50 text-[#005f43] rounded-full mb-4 group-hover:scale-110 group-hover:bg-[#005f43] group-hover:text-white transition-all duration-500">
              <UploadCloud className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Selecciona tu reporte CSV</h3>
            <p className="text-slate-400 mt-1 font-medium">Formatos admitidos: .csv (UTF-8)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fadeIn">
            <div className="xl:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#005f43]" />
                  <span className="font-bold text-slate-700 text-sm ">{csvFile.name}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">
                  Archivo Cargado
                </span>
              </div>
              <div className="p-6 text-center text-sm text-slate-500">
                Simulación de procesamiento lista para parsear las columnas del CSV.
              </div>
            </div>

            <div className="xl:col-span-1 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                  Confirmación
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Revisa que el formato coincida antes de procesar hacia la BD.
                </p>
                <button className="w-full mb-2 flex items-center justify-center gap-2 bg-[#005f43] text-white p-3 rounded-xl font-bold text-sm hover:bg-[#004732] transition-all">
                  <Play className="w-4 h-4" /> Procesar Ahora
                </button>
                <button 
                  onClick={() => setCsvFile(null)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 p-3 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Descartar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DataTable: Historial de Cargas */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-[#005f43] px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <History className="w-5 h-5" /> Historial de cargas
          </h3>
          {/* Alerta sutil si hay error en la sincronización */}
          {apiError && (
            <span className="text-xs bg-red-500/20 text-red-100 px-3 py-1 rounded-lg border border-red-500/30">
              Modo Offline activo
            </span>
          )}
        </div>

        <div className="p-6">
          {/* Filtros de Fecha */}
          <div className="flex flex-wrap gap-4 mb-6 items-end bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-emerald-800 uppercase">Desde:</label>
              <input
                type="date"
                value={minDate}
                onChange={(e) => setMinDate(e.target.value)}
                className="px-3 py-1.5 border border-emerald-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#005f43]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-emerald-800 uppercase">Hasta:</label>
              <input
                type="date"
                value={maxDate}
                onChange={(e) => setMaxDate(e.target.value)}
                className="px-3 py-1.5 border border-emerald-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#005f43]"
              />
            </div>
            <button 
              onClick={clearDateFilter}
              className="px-3 py-2 text-xs text-emerald-700 font-medium hover:underline"
            >
              Limpiar fechas
            </button>
          </div>

          {/* Tabla Despliegue con estados de carga */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-emerald-800 uppercase bg-emerald-100">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Cargador</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-right">kWh</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-center">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#005f43]" />
                        Sincronizando transacciones desde la base de datos...
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                      No se encontraron transacciones en este periodo.
                    </td>
                  </tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{trx.id}</td>
                      <td className="px-4 py-3 font-medium">{trx.usuario}</td>
                      <td className="px-4 py-3 text-slate-500">{trx.sede}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{trx.cargador}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trx.tipo === "DC" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                          {trx.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{trx.kwh}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">${trx.monto.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-slate-400 text-xs">{trx.fecha}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sacamos los datos simulados fuera del componente como fallback limpio
const defaultMockTransactions: TransactionMock[] = [
  { id: "TRX-001", usuario: "Carlos Mendoza", sede: "Sede Norte", cargador: "Cargador Rápido 1", tipo: "DC", kwh: 45.2, monto: 18.5, fecha: "2026-05-10" },
  { id: "TRX-002", usuario: "Elena Rostova", sede: "Sede Sur", cargador: "Cargador Eco 3", tipo: "AC", kwh: 22.1, monto: 9.2, fecha: "2026-05-14" },
  { id: "TRX-003", usuario: "Juan Pérez", sede: "Sede Central", cargador: "Cargador Ultra 2", tipo: "DC", kwh: 55.0, monto: 24.0, fecha: "2026-05-25" },
];
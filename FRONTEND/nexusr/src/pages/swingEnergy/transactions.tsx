import { useState, useEffect, useMemo } from "react";
import api from "../../services/api"; 
import { ArrowLeftRight, Zap, Users, ShieldAlert, History, Calendar, Info, Clock, Save, X } from "lucide-react";

import Headed from "../../components/headed";
import StatCard from "../../components/swingEnergyComponents/transactions/statcard";
import MonthlyChart from "../../components/swingEnergyComponents/transactions/monthlychart";
import CSVTransactionUploader from "../../components/swingEnergyComponents/transactions/csv";
import CustomDataTable from "../../components/customdatatable";

// 🍞 Importamos tu contenedor de notificaciones local
import ToastContainer from "../../components/toastnotification";

// Interfaz para controlar las notificaciones dinámicas
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// Interfaz Real basada exactamente en tu base de datos
interface TransactionReal {
  id_transaction: string;
  id_user: number;
  date_transaction: string;
  username: string;
  charger_name: string;
  session_start_time: string;
  session_stop_time: string;
  units_consumed: string;
  amount: string;
  organization: string;
  type_charger: string;
  headquarters: string;
}

interface SummaryStats {
  totaltransactions: string;
  totalunits: string;
  usersserved: string;
  chargersused: string;
  tocompleted: string;
}

export default function TransactionsPageSwing() {
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  
  const [transactions, setTransactions] = useState<TransactionReal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  // 📝 Estados para el Formulario y Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionReal | null>(null);

  // 🍞 Estado para almacenar y controlar la pila de toasts activos
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 🔌 Función auxiliar para disparar los toasts manualmente
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // 📡 1. PETICIÓN DEL HISTORIAL
  const fetchBD = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await api.post("/consultTransactionsSW", {});
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else if (response.data && Array.isArray(response.data.transactions)) {
        setTransactions(response.data.transactions);
      }
    } catch (error: any) {
      console.error("❌ Error en /consultTransactionsSW:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setApiError("Error de Autenticación: Sesión expirada.");
        return;
      }
      setApiError("Error de sincronización.");
    } finally {
      setIsLoading(false);
    }
  };

  // 📡 2. PETICIÓN DEL RESUMEN
  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await api.get("/consultSummaryTransaction");
      setSummary(response.data);
    } catch (error) {
      console.error("❌ Error en resumen:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleRefreshAllData = async () => {
    await Promise.all([fetchBD(), fetchSummary()]);
  };

  useEffect(() => {
    handleRefreshAllData();
  }, []);

  // 📈 Filtrado por Rango de Fechas
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const campoFecha = trx.date_transaction;
      if (!campoFecha) return true;
      
      const fechaTrx = new Date(campoFecha);
      if (minDate) {
        const desde = new Date(minDate);
        if (fechaTrx < desde) return false;
      }
      if (maxDate) {
        const hasta = new Date(maxDate);
        hasta.setHours(23, 59, 59, 999); 
        if (fechaTrx > hasta) return false;
      }
      return true;
    });
  }, [transactions, minDate, maxDate]);

  const clearDateFilter = () => {
    setMinDate("");
    setMaxDate("");
  };

  // 📝 3. DEFINICIÓN DE COLUMNAS PARA DATATABLES
  const columns = [
    {
      title: "Fecha",
      data: "date_transaction",
      className: "py-3 text-center text-slate-500 text-xs font-medium",
      render: (val: string) => val ? val.substring(0, 10) : "---"
    },
    {
      title: "Usuario",
      data: "username",
      className: "py-3 font-semibold text-slate-700"
    },
    {
      title: "Cargador",
      data: "charger_name",
      className: "py-3 text-slate-600 text-xs truncate max-w-[250px]"
    },
    {
      title: "Hora Inicio",
      data: "session_start_time",
      className: "py-3 text-center text-slate-500 text-xs font-medium"
    },
    {
      title: "Hora Fin",
      data: "session_stop_time",
      className: "py-3 text-center text-slate-500 text-xs font-medium"
    },
    {
      title: "kWh",
      data: "units_consumed",
      className: "py-3 text-right font-bold text-slate-700",
      render: (val: string) => val ? `${parseFloat(val).toFixed(2)}` : "0.00"
    },
    {
      title: "Monto",
      data: "amount",
      className: "py-3 text-right font-bold text-emerald-600",
      render: (val: string) => val ? `$${parseFloat(val).toFixed(2)}` : "$0.00"
    },
    {
      title: "Organización",
      data: "organization",
      className: "py-3 text-slate-600 text-xs font-medium"
    },
    {
      title: "Sede",
      data: "headquarters",
      className: "py-3 text-slate-600 text-xs font-medium"
    },
    {
      title: "Tipo",
      data: "type_charger",
      className: "py-3 font-bold text-center text-xs",
      render: (val: string) => {
        const isDC = val === "DC";
        return isDC ? "⚡ DC" : "🔌 AC";
      }
    },
    {
      title: "Acción",
      data: "id_transaction",
      className: "py-3 text-center",
      render: (val: string) => {
          return `
      <button 
        data-id="${val}" 
        class="btn-editar-trx inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-[#005f43] hover:text-white hover:border-[#005f43] rounded-lg transition-all text-xs font-medium shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil">
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
          <path d="m15 5 4 4"/>
        </svg>
        Editar
      </button>
    `;
        },
    }
  ];

  // 🎣 Capturador de clics en la tabla para abrir el Modal
  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest(".btn-editar-trx") as HTMLButtonElement;

    if (button) {
      const transactionId = button.getAttribute("data-id");
      const foundTx = transactions.find(t => t.id_transaction === transactionId);
      if (foundTx) {
        setSelectedTransaction({ ...foundTx });
        setIsModalOpen(true);
      }
    }
  };

  // 💾 Guardar cambios del formulario llamando al Endpoint en Mayúsculas
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      // 📡 Enviamos la organización forzada en Mayúsculas
      const response = await api.post("/updateUserSW", {
        p_id_user: Number(selectedTransaction.id_user),
        p_organization: selectedTransaction.organization.toUpperCase()
      });

      if (response.status === 200) {
        // Extraemos la clave dinámica del JSON retornado por tu base de datos
        const dbMessage = response.data?.fn_s_api_update_user_organization || "OK: Usuario actualizado con éxito.";
        
        // 💬 Mostramos la alerta exitosa directamente en el Toast personalizado
        showToast(dbMessage, 'success');

        // 1. Actualizamos el estado de la tabla localmente
        setTransactions(prev => 
          prev.map(t => t.id_transaction === selectedTransaction.id_transaction ? selectedTransaction : t)
        );

        // 2. Sincronizamos las tarjetas superiores de métricas
        fetchSummary(); 

        // 3. Cerramos el modal
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error("❌ Error al actualizar la organización en /updateUserSW:", error);
      showToast("No se pudieron guardar los cambios. Intente de nuevo.", 'error');
    }
  };

  return (
    <div className="px-6 py-6 relative">
      {/* Encabezado */}
      <Headed title="Carga de Transacciones" description="Gestión de transacciones de Swing Energy" />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Transacciones"
          textColor="text-slate-800"
          description="Total de Transacciones"
          value={isLoadingSummary ? "..." : summary?.totaltransactions || "0"} 
          period="Anual"
          borderColor="border-l-slate-600"
          bgColor="bg-slate-50"
          icon={<ArrowLeftRight className="w-5 h-5 text-[#005f43]" />}
        />
        <StatCard
          title="Energía"
          textColor="text-blue-500"
          description="Total de Energía"
          value={isLoadingSummary ? "..." : summary?.totalunits || "0.00"}
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
          value={isLoadingSummary ? "..." : summary?.usersserved || "0"}
          period="ANUAL"
          borderColor="border-l-blue-900"
          bgColor="bg-blue-100"
          icon={<Users className="w-5 h-5 text-blue-900" />}
        />
        <StatCard
          title="Cargadores"
          textColor="text-emerald-700"
          description="Cargadores Empleados"
          value={isLoadingSummary ? "..." : summary?.chargersused || "0"}
          period="ALCANCE"
          borderColor="border-l-emerald-600"
          bgColor="bg-emerald-50"
          icon={<Zap className="w-5 h-5 text-emerald-700" />}
        />
        <StatCard
          title="Pendientes"
          textColor="text-amber-600"
          description="Por Completar"
          value={isLoadingSummary ? "..." : summary?.tocompleted || "0"} 
          period="Atención"
          borderColor="border-l-amber-400"
          bgColor="bg-amber-50"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Gráfico */}
      <div className="mb-8">
        <MonthlyChart />
      </div>

      {/* CSV */}
      <CSVTransactionUploader onUploadSuccess={handleRefreshAllData} />

      {/* 🛠️ Sección de la Tabla con DataTables */}
      <div className="space-y-4 mt-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-bold mb-4 text-sm border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-[#005f43]" /> Filtrar Historial por Rango de Tiempo
          </div>
          <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Desde:</label>
              <input
                type="date"
                value={minDate}
                onChange={(e) => setMinDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-[#005f43] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hasta:</label>
              <input
                type="date"
                value={maxDate}
                onChange={(e) => setMaxDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-[#005f43] transition-colors"
              />
            </div>
            {(minDate || maxDate) && (
              <button onClick={clearDateFilter} className="px-3 py-2 text-xs text-red-600 font-semibold hover:underline">
                Limpiar filtros de fecha
              </button>
            )}
          </div>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
            {apiError}
          </div>
        )}

        <div onClick={handleTableClick}>
          <CustomDataTable
            title="Historial de Cargas"
            subtitle="Registros auditados en tiempo real desde la pasarela"
            icon={History}
            data={filteredTransactions} 
            columns={columns}
            excelFileName="Historial_de_transacciones_swing_energy"
            pageSize={50}
          />
        </div>
      </div>

      {/* 🛠️ MODAL CON EL DISEÑO EXACTO DE TU MODELO */}
      {isModalOpen && selectedTransaction && (
        <div 
          id="modal-detalle-transaccion" 
          tabIndex={-1} 
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto h-[calc(100%-1rem)] max-h-full flex items-center justify-center bg-slate-900/50"
        >
          <div className="relative w-full max-w-5xl max-h-full">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-emerald-900">

              {/* Encabezado */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-900 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-neutral-50" />
                  <h3 className="text-xl font-bold text-neutral-50">
                    Detalles de Carga
                    <span id="display-id" className="text-neutral-50 text-sm ml-2">
                      #{selectedTransaction.id_transaction}
                    </span>
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-neutral-50 hover:bg-emerald-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form id="form-detalle-transaccion" onSubmit={handleSaveChanges} className="p-6">
                <input type="hidden" id="edit-id" value={selectedTransaction.id_transaction} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Columna Izquierda: Resumen */}
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Resumen de Carga</h4>

                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-600">Monto Total ($)</label>
                      <input 
                        type="text" 
                        id="view-monto" 
                        disabled 
                        value={selectedTransaction.amount ? `$${parseFloat(selectedTransaction.amount).toFixed(2)}` : "$0.00"}
                        className="w-full p-2 bg-green-100 border border-green-200 rounded-lg text-sm font-bold text-green-700"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-600">kWh Consumidos</label>
                      <input 
                        type="text" 
                        id="view-kwh" 
                        disabled 
                        value={selectedTransaction.units_consumed || "0.00"}
                        className="w-full p-2 bg-slate-200 border border-slate-300 rounded-lg text-sm font-bold text-slate-700"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="block mb-1 text-xs font-semibold text-slate-500 italic">Fecha del Servicio</label>
                      <input 
                        type="text" 
                        id="view-fecha" 
                        disabled 
                        value={selectedTransaction.date_transaction ? selectedTransaction.date_transaction.substring(0, 10) : "---"}
                        className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Columnas Derechas: Información General */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Información General</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block mb-1 text-xs font-semibold text-slate-700">Nombre del Usuario</label>
                        <input 
                          type="text" 
                          id="view-usuario" 
                          disabled 
                          value={selectedTransaction.username || "---"}
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <label className="block mb-1 text-xs font-semibold text-slate-700">Sede</label>
                        <input 
                          type="text" 
                          id="view-sede" 
                          disabled 
                          value={selectedTransaction.headquarters || "---"}
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block mb-1 text-xs font-semibold text-slate-700">Nombre del Cargador</label>
                        <input 
                          type="text" 
                          id="view-cargador" 
                          disabled 
                          value={selectedTransaction.charger_name || "---"}
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-semibold text-slate-700">Tipo de Cargador</label>
                        <input 
                          type="text" 
                          id="view-tipo-cargador" 
                          disabled 
                          value={selectedTransaction.type_charger || "---"}
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-semibold text-slate-700">Organización</label>
                        <select 
                          id="edit-organizacion" 
                          value={selectedTransaction.organization || ""}
                          onChange={(e) => setSelectedTransaction({...selectedTransaction, organization: e.target.value})}
                          className="w-full p-2 border border-emerald-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 text-slate-800" 
                          required
                        >
                          <option value="" disabled>Seleccione Organización...</option>
                          <option value="VERDI">VERDI</option>
                          <option value="SWING ENERGY">SWING ENERGY</option>
                          <option value="INTEGRAL GROUP">INTEGRAL GROUP</option>
                          <option value="CLIENTE RENT A CAR">CLIENTE RENT A CAR</option>
                          <option value="ALIADO">ALIADO</option>
                          <option value="CLIENTE">CLIENTE</option>
                          <option value="POR DEFINIR">POR DEFINIR</option>
                        </select>
                      </div>
                    </div>

                    {/* Tiempos de Sesión */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-500 uppercase">Hora Inicio de Sesión</label>
                        <div className="flex items-center gap-2 text-slate-700 font-mono text-sm">
                          <Clock className="w-3 h-3" />
                          <span id="view-hora-inicio">{selectedTransaction.session_start_time || "--:--:--"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] font-bold text-slate-500 uppercase">Hora Fin de Sesión</label>
                        <div className="flex items-center gap-2 text-slate-700 font-mono text-sm">
                          <Clock className="w-3 h-3" />
                          <span id="view-hora-fin">{selectedTransaction.session_stop_time || "--:--:--"}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-emerald-900 rounded-xl hover:bg-eemrald-700 shadow-lg shadow-emerald-200 transition-all"
                  >
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🍞 Contenedor del Toast Inyectado de manera Global */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
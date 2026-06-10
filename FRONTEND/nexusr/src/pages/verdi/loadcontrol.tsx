import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import Headed from "../../components/headed";
import StatCard from "../../components/swingEnergyComponents/transactions/statcard";
import CustomDataTable from "../../components/customdatatable";
import {
  CalendarDays,
  Zap,
  BatteryLow,
  CircleAlert,
  BatteryFull,
  ChartSpline,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Edit3,
} from "lucide-react";

interface LoadControlSummary {
  total_transactions: string;
  units_consumed: string | null;
  initial_battery: string | null;
  final_battery: string | null;
  efficiency: string | null;
  null_id_user: string;
}

interface LoadControlRecord {
  id_load_control: string;
  cargador: string;
  conector_name: string | null;
  units_consumed: string;
  amount: string;
  headquarters_name: string;
  start_date: string;
  session_stop_time: string;
  unit: string | null;
  km: string | null;
  initial_battery_level: string | null;
  final_battery_level: string | null;
  driver: string;
  comment: string | null;
  responsible: string;
}

interface UnitOption {
  id_unit: string;
  name: string;
}

interface DriverOption {
  id_driver: string;
  name: string;
}

export default function LoadControlPageVerdi() {
  const [summary, setSummary] = useState<LoadControlSummary | null>(null);
  const [pendingRecords, setPendingRecords] = useState<LoadControlRecord[]>([]);
  const [completedRecords, setCompletedRecords] = useState<LoadControlRecord[]>(
    [],
  );

  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // 📝 Estados para el Modal de Edición
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] =
    useState<LoadControlRecord | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 📦 Estados para Selects Dinámicos y Candado de Optimización
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  const [hasLoadedOptions, setHasLoadedOptions] = useState<boolean>(false); // 🔒 Candado de Caché

  // 📝 Estados de los Campos del Formulario
  const [formData, setFormData] = useState({
    unit: "",
    conector_name: "",
    km: "",
    driver: "",
    initial_battery_level: "",
    final_battery_level: "",
    comment: "",
  });

  // Auxiliar para obtener el ID de sede del localStorage de forma segura
  const getHeadquartersId = (): number | null => {
    const savedHeadquarters = localStorage.getItem("user_headquarters_id");
    if (
      savedHeadquarters &&
      savedHeadquarters !== "null" &&
      savedHeadquarters !== "4"
    ) {
      return Number(savedHeadquarters);
    }
    return null;
  };

  // 📡 1. Consulta del Resumen
  const fetchSummary = async (idHeadquarters: number | null) => {
    setIsLoadingSummary(true);
    try {
      const response = await api.post("/consultLoadControlSummary", {
        p_id_headquarters: idHeadquarters,
      });
      if (response.data) setSummary(response.data);
    } catch (error) {
      console.error("❌ Error en /consultLoadControlSummary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 📡 2. Consulta de Tablas
  const fetchTableData = async (idHeadquarters: number | null) => {
    setIsLoadingTables(true);
    try {
      const payloadPending = { p_ID_HEADQUARTERS: idHeadquarters, p_option: 0 };
      const payloadCompleted = {
        p_ID_HEADQUARTERS: idHeadquarters,
        p_option: 1,
      };

      const [pendingRes, completedRes] = await Promise.all([
        api.post("/consultLoadControl", payloadPending),
        api.post("/consultLoadControl", payloadCompleted),
      ]);

      if (Array.isArray(pendingRes.data)) {
        setPendingRecords(pendingRes.data);
      } else if (
        pendingRes.data &&
        typeof pendingRes.data === "object" &&
        pendingRes.data.id_load_control
      ) {
        setPendingRecords([pendingRes.data]);
      } else {
        setPendingRecords([]);
      }

      if (Array.isArray(completedRes.data)) {
        setCompletedRecords(completedRes.data);
      } else if (
        completedRes.data &&
        typeof completedRes.data === "object" &&
        completedRes.data.id_load_control
      ) {
        setCompletedRecords([completedRes.data]);
      } else {
        setCompletedRecords([]);
      }
    } catch (error) {
      console.error("❌ Error en /consultLoadControl:", error);
      setApiError("No se pudieron sincronizar las tablas de registros.");
    } finally {
      setIsLoadingTables(false);
    }
  };

  // 📡 3. Cargar Unidades y Conductores de forma Optimiza (Solo una vez)
  const fetchSelectsOptions = async () => {
    // Si ya fueron cargados previamente en memoria, no volvemos a pegarle al servidor
    if (hasLoadedOptions) return;

    setIsLoadingOptions(true);
    const idHeadquarters = getHeadquartersId();
    try {
      const [unitsRes, driversRes] = await Promise.all([
        api.post("/consultUnitsForHeadquarters", {
          p_id_headquarters: idHeadquarters,
        }),
        api.post("/consultDriverForHeadquarters", {
          p_id_headquarters: idHeadquarters,
        }),
      ]);

      if (Array.isArray(unitsRes.data)) setUnits(unitsRes.data);
      if (Array.isArray(driversRes.data)) setDrivers(driversRes.data);

      setHasLoadedOptions(true); // 🔒 Activamos el candado
    } catch (error) {
      console.error("❌ Error cargando los catálogos del modal:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Sincronización Completa Manual
  const handleRefreshAllData = async () => {
    setApiError(null);
    setHasLoadedOptions(false); // Limpiamos caché si se fuerza el refresco general
    const idHeadquarters = getHeadquartersId();
    await Promise.all([
      fetchSummary(idHeadquarters),
      fetchTableData(idHeadquarters),
    ]);
  };

  useEffect(() => {
    handleRefreshAllData();
  }, []);

  // Control inteligente de apertura del modal
  useEffect(() => {
    if (isModalOpen) {
      fetchSelectsOptions();
    }
  }, [isModalOpen]);

  // Listener para Capturar Clicks en los botones "Editar" generados por DataTables
  useEffect(() => {
    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest(".btn-editar-trx");

      if (button) {
        const id = button.getAttribute("data-id");
        if (id) {
          const record =
            pendingRecords.find((r) => r.id_load_control === id) ||
            completedRecords.find((r) => r.id_load_control === id);
          if (record) {
            handleOpenModal(record);
          }
        }
      }
    };

    document.addEventListener("click", handleTableClick);
    return () => document.removeEventListener("click", handleTableClick);
  }, [pendingRecords, completedRecords]);

  // 🔓 Funciones del Modal
  const handleOpenModal = (record: LoadControlRecord) => {
    setSelectedRecord(record);
    setFormData({
      unit: record.unit || "",
      conector_name: record.conector_name || "CONECTOR A",
      km: record.km ? parseFloat(record.km).toFixed(0) : "",
      driver: record.driver || "",
      initial_battery_level: record.initial_battery_level
        ? parseFloat(record.initial_battery_level).toFixed(0)
        : "",
      final_battery_level: record.final_battery_level
        ? parseFloat(record.final_battery_level).toFixed(0)
        : "",
      comment: record.comment || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧮 Cálculo automático del total delta de carga en tiempo real
  const currentTotalCharge = useMemo(() => {
    const init = parseFloat(formData.initial_battery_level) || 0;
    const final = parseFloat(formData.final_battery_level) || 0;
    const diff = final - init;
    return diff > 0 ? diff : 0;
  }, [formData.initial_battery_level, formData.final_battery_level]);

  // 💾 Enviar Cambios Actualizados al Servidor
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSaving(true);
    try {
      await api.post("/updateLoadControl", {
        p_id_load_control: selectedRecord.id_load_control,
        p_unit: formData.unit,
        p_conector_name: formData.conector_name,
        p_km: formData.km,
        p_driver: formData.driver,
        p_initial_battery_level: formData.initial_battery_level,
        p_final_battery_level: formData.final_battery_level,
        p_comment: formData.comment,
      });

      await handleRefreshAllData();
      handleCloseModal();
    } catch (error) {
      console.error("❌ Error al guardar cambios de carga:", error);
      alert("Error al intentar actualizar el registro de control de carga.");
    } finally {
      setIsSaving(false);
    }
  };

  // 🛠️ Columnas Exclusivas para Cargas PENDIENTES
  const pendingColumns = useMemo(
    () => [
      {
        title: "Cargador",
        data: "cargador",
        className:
          "py-3 text-slate-700 text-xs font-medium max-w-[220px] truncate",
      },
      {
        title: "Fecha Inicio",
        data: "start_date",
        className: "py-3 text-left text-slate-600 font-semibold",
        render: (val: string) => (val ? val.substring(0, 16) : "---"),
      },
      {
        title: "Hora Fin",
        data: "session_stop_time",
        className: "py-3 text-left text-slate-500 font-semibold",
      },
      {
        title: "kWh",
        data: "units_consumed",
        className: "py-3 text-left font-bold text-slate-700",
        render: (val: string) =>
          val ? `${parseFloat(val).toFixed(2)}` : "0.00",
      },
      {
        title: "Costo",
        data: "amount",
        className: "py-3 text-left font-bold text-emerald-600",
        render: (val: string) =>
          val ? `$${parseFloat(val).toFixed(2)}` : "$0.00",
      },
      {
        title: "Sede",
        data: "headquarters_name",
        className: "py-3 text-left alignment-middle",
        render: (val: string) => {
          if (!val) return '<span class="text-slate-400">—</span>';
          const isLG = val.trim().toUpperCase() === "LA GUAIRA";
          return isLG
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-sm">${val}</span>`
            : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm">${val}</span>`;
        },
      },
      {
        title: "ACCIONES",
        data: "id_load_control",
        className: "py-3 text-left",
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
      },
    ],
    [],
  );

  // 🛠️ Columnas para HISTORIAL
  const historyColumns = useMemo(
    () => [
      {
        title: "UNIDAD",
        data: "unit",
        className: "py-3 text-center font-bold text-slate-500",
        render: (val: string) =>
          val && val.trim() !== ""
            ? val
            : '<span class="text-slate-400">—</span>',
      },
      {
        title: "Cargador",
        data: "cargador",
        className:
          "py-3 text-slate-700 text-xs font-medium max-w-[220px] truncate",
      },
      {
        title: "Conector",
        data: "conector_name",
        className: "py-3 text-center alignment-middle",
        render: (val: string) => {
          if (!val) return '<span class="text-slate-400">—</span>';
          const cleanVal = val.trim().toUpperCase();
          const isA = cleanVal === "CONECTOR A" || cleanVal === "A";
          return isA
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-sm">${val}</span>`
            : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-sm">${val}</span>`;
        },
      },
      {
        title: "Km Actual",
        data: "km",
        className: "py-3 text-center text-slate-600 text-xs font-medium",
        render: (val: string) =>
          val && val.trim() !== ""
            ? val
            : '<span class="text-slate-400">—</span>',
      },
      {
        title: "Fecha Inicio",
        data: "start_date",
        className: "py-3 text-center text-slate-600 font-semibold",
        render: (val: string) => (val ? val.substring(0, 16) : "---"),
      },
      {
        title: "Hora Fin",
        data: "session_stop_time",
        className: "py-3 text-center text-slate-500 font-semibold",
      },
      {
        title: "Batería (I/F)",
        data: null,
        className: "py-3 text-center text-emerald-900 font-bold",
        render: (row: LoadControlRecord) => {
          const init = row.initial_battery_level
            ? `${parseFloat(row.initial_battery_level).toFixed(0)}%`
            : "---";
          const final = row.final_battery_level
            ? `${parseFloat(row.final_battery_level).toFixed(0)}%`
            : "---";
          return `${init} ➜ ${final}`;
        },
      },
      {
        title: "Total de carga",
        data: null, // 💡 Mantenemos null para recibir toda la fila y hacer el cálculo
        className: "py-3 text-center alignment-middle",
        render: (row: LoadControlRecord, type: string) => {
          // 1. Calculamos el delta/total de carga real de forma segura
          let val = 0;
          if (row.initial_battery_level && row.final_battery_level) {
            val =
              parseFloat(row.final_battery_level) -
              parseFloat(row.initial_battery_level);
            if (val < 0) val = 0; // Evitamos barras negativas por si acaso
          }

          // 2. Si DataTables está pintando la celda en pantalla ('display')
          if (type === "display") {
            let colorClass = "bg-emerald-500";
            if (val < 30) colorClass = "bg-red-500";
            else if (val < 70) colorClass = "bg-amber-500";

            return `
        <div class="flex items-center gap-2 mx-auto" style="max-width: 140px;">
          <div class="w-full bg-slate-200 rounded-full h-2.5">
            <div class="${colorClass} h-2.5 rounded-full transition-all" style="width: ${val}%"></div>
          </div>
          <span class="text-xs font-bold text-slate-700 min-w-[35px] text-right">+${val.toFixed(0)}%</span>
        </div>
      `;
          }

          // 3. Para filtros o exportación a Excel, devolvemos solo el número limpio
          return val;
        },
      },
      {
        title: "kWh",
        data: "units_consumed",
        className: "py-3 text-right font-bold text-slate-700",
        render: (val: string) =>
          val ? `${parseFloat(val).toFixed(2)}` : "0.00",
      },
      {
        title: "Costo",
        data: "amount",
        className: "py-3 text-right font-bold text-emerald-600",
        render: (val: string) =>
          val ? `$${parseFloat(val).toFixed(2)}` : "$0.00",
      },
      {
        title: "Conductor",
        data: "driver",
        className: "py-3 text-slate-600 text-xs",
        render: (val: string) =>
          val && val.trim() !== "" ? val : "No asignado",
      },
      {
        title: "Comentarios",
        data: "comment",
        className: "py-3 text-slate-600 text-xs max-w-[250px] truncate",
        render: (val: string) =>
          val && val.trim() !== ""
            ? val
            : '<span class="text-slate-400">—</span>',
      },
      {
        title: "Responsable",
        data: "responsible",
        className: "py-3 text-slate-600 text-xs font-medium",
      },
      {
        title: "Sede",
        data: "headquarters_name",
        className: "py-3 text-center alignment-middle",
        render: (val: string) => {
          if (!val) return '<span class="text-slate-400">—</span>';
          const isLG = val.trim().toUpperCase() === "LA GUAIRA";
          return isLG
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-sm">${val}</span>`
            : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm">${val}</span>`;
        },
      },
      {
        title: "ACCIONES",
        data: "id_load_control",
        className: "py-3 text-center font-bold text-slate-500",
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
      },
    ],
    [],
  );

  const formatValue = (val: string | null, decimals: number = 2): string => {
    if (!val) return "0" + (decimals > 0 ? ".".padEnd(decimals + 1, "0") : "");
    const parsed = parseFloat(val);
    return isNaN(parsed) ? "0.00" : parsed.toFixed(decimals);
  };

  return (
    <div className="px-6 py-3 space-y-8 relative">
      <Headed
        title="Control de Carga"
        description="Gestión y monitoreo de energía - Verdi"
      />

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
          {apiError}
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Operaciones"
          textColor="text-slate-800"
          description="Operaciones"
          value={isLoadingSummary ? "..." : summary?.total_transactions || "0"}
          period="Mensual"
          borderColor="border-l-slate-600"
          bgColor="bg-slate-50"
          icon={<CalendarDays className="w-5 h-5 text-[#696969]" />}
        />
        <StatCard
          title="Por completar"
          textColor="text-yellow-600"
          description="Por Completar"
          value={isLoadingSummary ? "..." : summary?.null_id_user || "0"}
          period="ATENCIÓN"
          borderColor="border-l-yellow-500"
          bgColor="bg-amber-50"
          icon={<CircleAlert className="w-5 h-5 text-yellow-600" />}
        />
        <StatCard
          title="Energía"
          textColor="text-emerald-500"
          description="Total de Energía"
          value={
            isLoadingSummary ? "..." : formatValue(summary?.units_consumed)
          }
          unit="kWh"
          period="MENSUAL"
          borderColor="border-l-emerald-400"
          bgColor="bg-emerald-50"
          icon={<Zap className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Carga inicial"
          textColor="text-blue-700"
          description="Carga Inicial"
          value={
            isLoadingSummary ? "..." : formatValue(summary?.initial_battery, 0)
          }
          unit="%"
          period="Mensual"
          borderColor="border-l-blue-600"
          bgColor="bg-blue-50"
          icon={<BatteryLow className="w-5 h-5 text-blue-700" />}
        />
        <StatCard
          title="Carga final"
          textColor="text-blue-900"
          description="Carga Final"
          value={
            isLoadingSummary ? "..." : formatValue(summary?.final_battery, 0)
          }
          unit="%"
          period="Mensual"
          borderColor="border-l-blue-900"
          bgColor="bg-blue-50"
          icon={<BatteryFull className="w-5 h-5 text-blue-900" />}
        />
        <StatCard
          title="Eficiencia"
          textColor="text-emerald-900"
          description="Eficiencia"
          value={isLoadingSummary ? "..." : formatValue(summary?.efficiency, 0)}
          unit="%"
          period="Rendimiento"
          borderColor="border-l-emerald-900"
          bgColor="bg-emerald-50"
          icon={<ChartSpline className="w-5 h-5 text-emerald-900" />}
        />
      </div>

      {/* 📋 TABLA 1: PENDIENTES */}
      <div className="space-y-2">
        {isLoadingTables ? (
          <div className="p-10 text-center text-slate-500 text-sm font-medium">
            Cargando registros pendientes...
          </div>
        ) : (
          <CustomDataTable<LoadControlRecord>
            title="Cargas Pendientes por Completar"
            icon={AlertCircle}
            data={pendingRecords}
            columns={pendingColumns}
            pageSize={10}
            excelFileName="Control_de_Cargas_Pendientes_Verdi"
          />
        )}
      </div>

      {/* 📋 TABLA 2: HISTORIAL COMPLETADOS */}
      <div className="space-y-2">
        {isLoadingTables ? (
          <div className="p-10 text-center text-slate-500 text-sm font-medium">
            Cargando histórico de cargas...
          </div>
        ) : (
          <CustomDataTable<LoadControlRecord>
            title="Histórico General"
            icon={CheckCircle}
            targetColor="bg-slate-900"
            data={completedRecords}
            columns={historyColumns}
            pageSize={50}
            excelFileName="Historial_Control_Carga_Verdi"
          />
        )}
      </div>

      {/* 🌟 MODAL DE EDICIÓN CON CACHÉ OPTIMIZADO */}
      {isModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-emerald-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-5 border-b border-emerald-900 bg-emerald-900  rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-inner">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-50">
                    Editar Operación
                  </h3>
                  <p className="text-xs text-slate-50 font-medium font-mono">
                    ID Registro: #{selectedRecord.id_load_control}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 rounded-xl p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form
              onSubmit={handleSaveChanges}
              className="overflow-y-auto p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Columna Izquierda: Datos del Sistema */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 h-fit">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-200 pb-1">
                  Datos de Sistema
                </h4>

                {/* 🔄 Selector Dinámico de Unidades */}
                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-600">
                    Unidad
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold bg-white transition-all"
                    required
                  >
                    <option value="" disabled>
                      {isLoadingOptions
                        ? "Cargando unidades..."
                        : "Selecciona una Unidad..."}
                    </option>
                    {units.map((u) => (
                      <option key={u.id_unit} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-600">
                    kWh Cargados
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      selectedRecord.units_consumed
                        ? `${parseFloat(selectedRecord.units_consumed).toFixed(2)} kWh`
                        : "0.00 kWh"
                    }
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 cursor-not-allowed shadow-inner"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-600">
                    Costo ($)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      selectedRecord.amount
                        ? `$ ${parseFloat(selectedRecord.amount).toFixed(2)}`
                        : "$ 0.00"
                    }
                    className="w-full p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm font-bold text-blue-700 cursor-not-allowed shadow-inner"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-400 italic">
                    Fecha y Hora Inicio
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedRecord.start_date || "---"}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-400 italic">
                    Hora Fin
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedRecord.session_stop_time || "---"}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Columna Derecha / Centro: Campos Modificables */}
              <div className="md:col-span-2 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-200 pb-1">
                    Campos por Completar / Editar
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Cargador
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedRecord.cargador}
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed shadow-inner truncate"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Conector
                      </label>
                      <select
                        name="conector_name"
                        value={formData.conector_name}
                        onChange={handleInputChange}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all font-medium"
                        required
                      >
                        <option value="1">CONECTOR A</option>
                        <option value="2">CONECTOR B</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Kilometraje Actual de la Unidad (Km)
                      </label>
                      <input
                        type="number"
                        name="km"
                        value={formData.km}
                        onChange={handleInputChange}
                        placeholder="Ej. 12450"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                        required
                      />
                    </div>

                    {/* 🔄 Selector Dinámico de Conductores */}
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Conductor Operante
                      </label>
                      <select
                        name="driver"
                        value={formData.driver}
                        onChange={handleInputChange}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all font-medium"
                        required
                      >
                        <option value="" disabled>
                          {isLoadingOptions
                            ? "Cargando conductores..."
                            : "Selecciona un Conductor..."}
                        </option>
                        {drivers.map((d) => (
                          <option key={d.id_driver} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sección Métrica de Baterías */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 shadow-sm">
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        % Inicial de Carga
                      </label>
                      <input
                        type="number"
                        name="initial_battery_level"
                        value={formData.initial_battery_level}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        placeholder="0"
                        className="w-full p-2 border border-slate-200 rounded-xl text-center text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        % Final de Carga
                      </label>
                      <input
                        type="number"
                        name="final_battery_level"
                        value={formData.final_battery_level}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        placeholder="100"
                        className="w-full p-2 border border-slate-200 rounded-xl text-center text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        %Total de Carga
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`+ ${currentTotalCharge}%`}
                        className="w-full p-2 bg-emerald-600 border border-emerald-600 rounded-xl text-center text-sm font-black text-white shadow-md cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-700">
                      Comentarios u Observaciones
                    </label>
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      placeholder="Agrega notas relevantes sobre la sesión de carga..."
                    />
                  </div>
                </div>

                {/* Footer de Botones */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-400 shadow-md shadow-emerald-600/10 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />{" "}
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, ChangeEvent, useRef } from "react";
import api from "../../../services/api";
import { UploadCloud, Database, Play, Trash2, Loader2 } from "lucide-react";
import ToastContainer from "../../toastnotification";

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface CSVPreviewData {
  headers: string[];
  rows: string[][];
}

interface CSVUploaderProps {
  onUploadSuccess: () => Promise<void>; 
}

export default function CSVTransactionUploader({ onUploadSuccess }: CSVUploaderProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  
  // 🔔 Estado para manejar la cola de notificaciones activas
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🛡️ Función para disparar notificaciones visuales tipo Toast
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 7);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Remover automáticamente tras 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Función para cerrar de forma manual con la "X"
  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 📂 Leer archivo y armar la vista previa estructural en pantalla
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length === 0) return;

        const firstLine = lines[0];
        const separator = firstLine.includes(";") ? ";" : ",";

        const headers = firstLine.split(separator).map(h => h.replace(/['"]+/g, "").trim());
        const previewRows = lines.slice(1, 7).map(line => 
          line.split(separator).map(cell => cell.replace(/['"]+/g, "").trim())
        );

        setPreviewData({ headers, rows: previewRows });
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  // 🚀 Enviar Fila por Fila respetando la Arquitectura Orientada a Datos
  const handleProcessCSV = async () => {
    if (!csvFile) return;
    setIsProcessingCsv(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setIsProcessingCsv(false);
        return;
      }

      const separator = text.includes(";") ? ";" : ",";
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        // 🔄 Reemplazado alert por notificación visual de error
        showNotification("El archivo CSV no contiene transacciones procesables.", "error");
        setIsProcessingCsv(false);
        return;
      }

      const headers = lines[0].split(separator).map(h => h.replace(/['"]+/g, "").trim().toUpperCase());
      const dataLines = lines.slice(1);

      // Mapear dinámicamente las posiciones del CSV para armar las claves del JSON
      const headerMap = {
        id_swing: headers.indexOf("TRANSACTION ID"),
        date: headers.indexOf("DATE"),
        user_id: headers.indexOf("UNIQUE USER ID"),
        user_name: headers.indexOf("USER NAME"),
        charger: headers.indexOf("CHARGER NAME"),
        start_time: headers.indexOf("SESSION START TIME"),
        stop_time: headers.indexOf("SESSION STOP TIME"),
        units: headers.indexOf("UNITS CONSUMED"),
        tariff_name: headers.indexOf("TARIFF NAME"),
        charging_tariff: headers.indexOf("CHARGING TARIFF"),
        amount: headers.indexOf("AMOUNT"),
        tax: headers.indexOf("TAX"),
        total_payable: headers.indexOf("TOTAL PAYABLE AMOUNT"),
      };

      let insertados = 0;
      let saltadosOErrores = 0;
      const totalFilas = dataLines.length;

      console.log(`📡 Iniciando subida masiva controlada hacia /insertTransactionSW para ${totalFilas} registros...`);

      for (let i = 0; i < totalFilas; i++) {
        const cells = dataLines[i].split(separator).map(cell => cell.replace(/['"]+/g, "").trim());
        
        if (cells.length < 5 || cells.every(c => c === "")) {
          continue;
        }

        setUploadProgress({ current: i + 1, total: totalFilas });

        try {
          const montoValor = cells[headerMap.amount] || "0.00";
          const totalPayable = cells[headerMap.total_payable] || montoValor;

          const payload = {
            p_id_transaction_swing_energy: cells[headerMap.id_swing],
            p_date_transaction: cells[headerMap.date],
            p_user_id_swing_energy: cells[headerMap.user_id],
            p_user_name: cells[headerMap.user_name],
            p_charger: cells[headerMap.charger],
            p_session_start_time: cells[headerMap.start_time],
            p_session_stop_time: cells[headerMap.stop_time],
            p_units_consumed: cells[headerMap.units] || "0.00",
            p_tariff_name: cells[headerMap.tariff_name] || "N/A",
            p_charging_tariff: cells[headerMap.charging_tariff] || "0.00",
            p_amount: montoValor,
            p_tax: cells[headerMap.tax] || "0.00",
            p_total_payable_amount: totalPayable,
            p_amount_paid_by_user: totalPayable,
            p_refund_amount: "0.00",
            p_net_amount: montoValor,
            p_promotional: "False",
            p_payment_mode: "WALLET",
            p_status: "COMPLETED",
            p_invoice_number: cells[headerMap.id_swing] ? `SW-${cells[headerMap.id_swing].split('-')[0]}` : "SW-INV"
          };

          const response = await api.post("/insertTransactionSW", payload);
          const result = response.data;

          if (result && result.o_success === true) {
            insertados++;
          } else {
            saltadosOErrores++;
          }
        } catch (rowError: any) {
          saltadosOErrores++;
          console.error(`❌ Error en fila ${i + 1}:`, rowError.message);
        }
      }

      // 🔄 Reemplazado alert por notificación visual de éxito o advertencia reflexiva
      if (insertados > 0) {
        showNotification(`Proceso Completado. Registradas con éxito: ${insertados}. Duplicadas/Errores: ${saltadosOErrores}`, "success");
      } else {
        showNotification(`No se añadieron registros nuevos. Duplicados o con error: ${saltadosOErrores}`, "error");
      }
      
      setUploadProgress(null);
      resetUpload();
      
      // 🔔 Ejecutar callback del padre para recargar la información visual
      await onUploadSuccess();
      setIsProcessingCsv(false);
    };

    reader.readAsText(csvFile, "UTF-8");
  };

  const resetUpload = () => {
    setCsvFile(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3 mb-8">
      <p className="text-slate-500 font-medium">
        Importa el archivo CSV para actualizar el historial de operaciones.
      </p>

      {!csvFile ? (
        <div 
          onClick={triggerFileSelect}
          className="group relative bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 transition-all duration-300 hover:border-[#005f43] hover:bg-emerald-50/20 flex flex-col items-center justify-center cursor-pointer shadow-sm"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="hidden" 
          />
          <div className="p-6 bg-emerald-50 text-[#005f43] rounded-full mb-4 group-hover:scale-110 group-hover:bg-[#005f43] group-hover:text-white transition-all duration-500">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Selecciona tu reporte CSV</h3>
          <p className="text-slate-400 mt-1 font-medium">Formatos admitidos: .csv (UTF-8)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 tracking-normal animate-fadeIn">
          {/* Vista Previa Estructural */}
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#005f43]" />
                <span className="font-bold text-slate-700 text-sm">{csvFile.name}</span>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">
                Vista Previa
              </span>
            </div>
            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50 border-b border-slate-100">
                    {previewData?.headers.map((header, idx) => (
                      <th key={idx} className="px-4 py-3 font-bold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
                  {previewData?.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 max-w-[200px] truncate text-slate-500">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acciones del Panel */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                Confirmación
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Revisa que el formato coincida antes de procesar hacia la BD.
              </p>
              <button 
                onClick={handleProcessCSV}
                disabled={isProcessingCsv}
                className="w-full mb-2 flex items-center justify-center gap-2 bg-[#005f43] text-white p-3 rounded-xl font-bold text-sm hover:bg-[#004732] disabled:bg-slate-300 transition-all"
              >
                {isProcessingCsv ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isProcessingCsv 
                  ? `Procesando (${uploadProgress?.current || 0}/${uploadProgress?.total || 0})` 
                  : "Procesar Ahora"
                }
              </button>
              <button 
                onClick={resetUpload}
                disabled={isProcessingCsv}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 p-3 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📥 Inyección del contenedor flotante en el árbol de renderizado */}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}
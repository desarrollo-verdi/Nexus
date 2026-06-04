import React, { useState, useEffect, useRef } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { Search } from "lucide-react"; 

import "datatables.net-buttons-dt";
import "datatables.net-buttons/js/buttons.html5.mjs";
import JSZip from "jszip";

// 🚀 1. IMPORTAMOS LA EXTENSIÓN RESPONSIVE
import "datatables.net-responsive-dt";

if (typeof window !== "undefined") {
  (window as any).JSZip = JSZip;
}

DataTable.use(DT);

interface CustomDataTableProps<T> {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>; 
  data: T[];          
  columns: Array<{   
    title: string;
    data: keyof T | string;
    className?: string;
    render?: (data: any, row: T) => React.ReactNode | string;
  }>;
  pageSize?: number;
  excelFileName?: string;
}

export default function CustomDataTable<T>({
  title,
  icon: Icon,
  data,
  columns,
  pageSize = 10,
  excelFileName = "reporte-descarga",
}: CustomDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const tableRef = useRef<any>(null);

  useEffect(() => {
    if (tableRef.current) {
      const dtInstance = tableRef.current.dt();
      dtInstance.search(searchQuery).draw();
    }
  }, [searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-fade-in-up">
      
      {/* Encabezado Verde Estilo Banner */}
      <div className="bg-[#005f43] px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2 text-sm tracking-wide">
          {Icon && <Icon className="w-5 h-5 text-white/90" />} {title}
        </h3>
        <span className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20">
          {data.length} Registros
        </span>
      </div>

      {/* Contenedor Principal */}
      <div className="p-6">
        
        <div className="dt-tailwind-wrapper w-full">
          
          {/* BARRA SUPERIOR ALINEADA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 w-full">
            
            {/* BUSCADOR CUSTOM */}
            <div className="relative w-full max-w-md z-10">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar registros..."
                className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-[#005f43] focus:ring-4 focus:ring-[#005f43]/10"
              />
            </div>

            {/* CONTENEDOR DONDE SE CLONAN LOS BOTONES */}
            <div className="dt-buttons-target-container flex justify-end"></div>
          </div>

          {/* Tabla de datos */}
          <div className="w-full overflow-x-auto">
            <DataTable
              ref={tableRef}
              data={data}
              columns={columns as any}
              options={{
                pageLength: pageSize,
                lengthMenu: [5, 10, 25, 50],
                dom: 'Brt<"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5 text-slate-600 text-sm"ip>',
                
                // 🚀 2. ACTIVAMOS EL MODO RESPONSIVO AQUÍ
                responsive: true, 

                buttons: [
                  {
                    extend: "copy",
                    text: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
                    titleAttr: "Copiar al portapapeles"
                  },
                  {
                    extend: "excel",
                    filename: excelFileName,
                    text: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 12v6"/></svg>',
                    titleAttr: "Descargar Excel"
                  }
                ],
                initComplete: function() {
                  const api = (this as any).api();
                  const buttonsContainer = api.buttons().container();
                  const target = document.querySelector(".dt-buttons-target-container");
                  if (target && buttonsContainer.length) {
                    target.innerHTML = "";
                    target.appendChild(buttonsContainer[0]);
                  }
                },
                language: {
                  lengthMenu: "Mostrar _MENU_ registros",
                  info: "Mostrando _START_ a _END_ de _TOTAL_ entradas",
                  infoEmpty: "Mostrando 0 a 0 de 0 entradas",
                  zeroRecords: "No se encontraron transacciones coincidentes",
                  paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente →",
                    previous: "← Anterior"
                  }
                }
              }}
              className="w-full text-sm border-collapse"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
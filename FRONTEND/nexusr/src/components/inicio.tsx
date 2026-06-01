import { HiArrowSmRight, HiOutlineLightningBolt, HiOutlineTruck, HiOutlineShieldCheck } from "react-icons/hi";

export default function Inicio() {
  return (
    <div className="space-y-6">
      
      {/* BANNER DE BIENVENIDA (Basado en tu imagen) */}
      <div className="relative overflow-hidden rounded-2xl mx-3 border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bienvenido a <span className="italic font-extrabold text-[#005f43]">NEXUS 3</span>
          </h1>
          <p className="mt-2 text-sm italic text-slate-500 sm:text-base">
            Gestión inteligente de energía y servicios.
          </p>
        </div>

        {/* Marca de agua del logo al fondo a la derecha */}
        <div className="absolute -bottom-10 -right-10 select-none opacity-5 pointer-events-none sm:-bottom-16 sm:-right-16">
          <svg
            className="h-40 w-40 text-[#005f43] sm:h-56 sm:w-56"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {/* Icono de rayo estilizado similar a SlEnergy */}
            <path d="M11.5 2L3 13h8.5L10 22l8.5-11H10l1.5-9z" />
          </svg>
        </div>
      </div>

      {/* SECCIÓN ADICIONAL: Accesos Rápidos / Estado de Módulos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mx-3">
        
        {/* Tarjeta 1: Integral Group */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
              <HiOutlineTruck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Integral Group</h3>
            <p className="mt-1 text-xs text-slate-500">
              Inventario de vehiculos electricos
            </p>
          </div>
          <a href="#" className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-900 hover:underline">
            Ir a Inventario <HiArrowSmRight className="h-4 w-4" />
          </a>
        </div>

        {/* Tarjeta 2: Swing Energy */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <HiOutlineLightningBolt className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Swing Energy</h3>
            <p className="mt-1 text-xs text-slate-500">
              Revisión de transacciones energéticas en tiempo real y métricas de carga.
            </p>
          </div>
          <a href="#" className="mt-5 flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
            Ver Dashboard <HiArrowSmRight className="h-4 w-4" />
          </a>
        </div>

        {/* Tarjeta 3: Verdi */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#005f43]">
              <HiOutlineShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Verdi</h3>
            <p className="mt-1 text-xs text-slate-500">
              Control operativo de unidades, conductores asignados y amonestaciones.
            </p>
          </div>
          <a href="#" className="mt-5 flex items-center gap-1 text-xs font-semibold text-[#005f43] hover:underline">
            Gestionar Conductores <HiArrowSmRight className="h-4 w-4" />
          </a>
        </div>

      </div>

    </div>
  );
}
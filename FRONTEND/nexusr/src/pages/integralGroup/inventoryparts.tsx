import { useEffect, useState } from "react";

import api from "../../services/api";

import Headed from "../../components/headed";

import StatCard from "../../components/swingEnergyComponents/transactions/statcard";

import CustomDataTable from "../../components/customdatatable";

import {
  ArrowLeftRight,
  Zap,
  Users,
  ShieldAlert,
  Plus,
  X
} from "lucide-react";

interface PartInventory {
  id_parts_inventory: number;
  inventory_code: string;
  description: string;
  system_category: string;
  quantity: number;
}

export default function InventoryPartsPageIntegral() {

  const [parts, setParts] =
    useState<PartInventory[]>([]);

  const [loading, setLoading] =
    useState(true);

  

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [selectedPart, setSelectedPart] =
    useState<PartInventory | null>(null);

  const [formData, setFormData] =
    useState({
      id_parts_inventory: 0,
      inventory_code: "",
      description: "",
      system_category: "",
      quantity: 0
    });

  useEffect(() => {

    loadInventory();

  }, []);


  useEffect(() => {

  const handleClick = (
    event: MouseEvent
  ) => {

    console.log("CLICK");

    const target =
      event.target as HTMLElement;

    console.log("TARGET:", target);

    const viewBtn =
      target.closest(".btn-view");

    const editBtn =
      target.closest(".btn-edit");

    console.log("VIEW BTN:", viewBtn);

    console.log("EDIT BTN:", editBtn);

    if (viewBtn) {

      const id = Number(
        viewBtn.getAttribute("data-id")
      );

      console.log("VIEW ID:", id);
      console.log("PARTS:", parts);

      console.log(
  parts.map(p => ({
    id: p.id_parts_inventory,
    tipo: typeof p.id_parts_inventory
  }))
);

      const part =
  parts.find(
    p =>
      Number(p.id_parts_inventory) === Number(id)
  );

console.log("PARTS:", parts);
console.log("PART ENCONTRADA:", part);

      console.log("PART:", part);

      if (part) {

        console.log(
          "ABRIENDO MODAL VIEW"
        );

        openView(part);

      }

    }

    if (editBtn) {

      const id = Number(
        editBtn.getAttribute("data-id")
      );

      console.log("EDIT ID:", id);

      const part =
  parts.find(
    p =>
      Number(p.id_parts_inventory) === Number(id)
  );

console.log("PARTS:", parts);
console.log("PART ENCONTRADA:", part);

      console.log("PART:", part);

      if (part) {

        console.log(
          "ABRIENDO MODAL EDIT"
        );

        openEdit(part);

      }

    }

  };

  document.addEventListener(
    "click",
    handleClick
  );

  return () => {

    document.removeEventListener(
      "click",
      handleClick
    );

  };

}, [parts]);


  const loadInventory =
  async () => {

    try {

      setLoading(true);

      const response =
        await api.post(
          "/consult_parts_inventory",
          {}
        );

      if (Array.isArray(response.data)) {

  console.log(
    "DATA INVENTARIO:",
    response.data
  );

  setParts(response.data);

}



else if (
  response.data &&
  response.data.id_parts_inventory
) {

  setParts([response.data]);

}
else {

  setParts([]);

}

    }
    catch (error) {

      alert(
        "Error cargando inventario"
      );

    }
    finally {

      setLoading(false);

    }

  };

  const openView =
  (part: PartInventory) => {

    setSelectedPart(part);

    setShowViewModal(true);

  };

  const openEdit =
  (part: PartInventory) => {

    setIsEditing(true);

    setFormData({
      id_parts_inventory:
        part.id_parts_inventory,

      inventory_code:
        part.inventory_code,

      description:
        part.description,

      system_category:
        part.system_category,

      quantity:
        part.quantity
    });

    setShowEditModal(true);

  };

  const openNew = () => {

    setIsEditing(false);

    setFormData({
      id_parts_inventory: 0,
      inventory_code: "",
      description: "",
      system_category: "",
      quantity: 0
    });

    setShowEditModal(true);

  };

  const savePart =
  async () => {

    try {

      const payload = {

        p_accion:
          isEditing
            ? "EDITAR"
            : "INSERTAR",

        p_id_parts_inventory:
          isEditing
            ? formData.id_parts_inventory
            : null,

        p_inventory_code:
          formData.inventory_code,

        p_description:
          formData.description,

        p_system_category:
          formData.system_category,

        p_quantity:
          Number(formData.quantity)

      };

      await api.post(
        "/insert_parts_inventory",
        payload
      );

      setShowEditModal(false);

      await loadInventory();

      alert(
        isEditing
          ? "Repuesto actualizado"
          : "Repuesto agregado"
      );

    }
    catch (error:any) {

      alert(
        error?.response?.data?.error ||
        "Error guardando repuesto"
      );

    }

  };


  return (

    <div className="px-6 py-6">

      <Headed
        title="Inventario de Partes"
        description="Gestión de repuestos de Integral Group"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        <StatCard
  title="Total Repuestos"
  textColor="text-slate-800"
  description="Total Repuestos"
  value={String(parts.length)}
  period="ACTUAL"
  borderColor="border-l-[#005f43]"
  bgColor="bg-white"
  icon={
    <ArrowLeftRight
      className="w-5 h-5 text-[#005f43]"
    />
  }
/>

<StatCard
  title="Stock Disponible"
  textColor="text-blue-500"
  description="Stock Disponible"
  value={
    String(
      parts.reduce(
        (acc, item) =>
          acc + Number(item.quantity || 0),
        0
      )
    )
  }
  period="ACTUAL"
  borderColor="border-l-blue-400"
  bgColor="bg-blue-50"
  icon={
    <Zap className="w-5 h-5 text-blue-600" />
  }
/>


        <StatCard
          title="Stock Mínimo"
          textColor="text-blue-900"
          description="Stock Mínimo"
          value="0"
          period="ACTUAL"
          borderColor="border-l-blue-900"
          bgColor="bg-blue-100"
          icon={
            <Users className="w-5 h-5 text-blue-900" />
          }
        />

        <StatCard
          title="Entradas"
          textColor="text-emerald-700"
          description="Entradas"
          value="0"
          period="ACTUAL"
          borderColor="border-l-emerald-600"
          bgColor="bg-emerald-50"
          icon={
            <Zap className="w-5 h-5 text-emerald-700" />
          }
        />

        <StatCard
          title="Salidas"
          textColor="text-amber-600"
          description="Salidas"
          value="0"
          period="ACTUAL"
          borderColor="border-l-amber-400"
          bgColor="bg-amber-50"
          icon={
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          }
        />

      </div>

      

      <div
        className="
        bg-white
        rounded-xl
        shadow-sm
        border
        border-slate-200
        overflow-hidden"
      >

<div className="flex justify-end mb-4">

  <button
    onClick={openNew}
    className="
      bg-[#005f43]
      text-white
      px-4
      py-2
      rounded-lg
      flex
      items-center
      gap-2"
  >
    <Plus size={18} />
    Nuevo Repuesto
  </button>

</div>

    <CustomDataTable
  title="Inventario de Partes"
  icon={ArrowLeftRight}
  data={parts}
  excelFileName="inventario-partes"
  columns={[
  {
    title: "Código",
    data: "inventory_code",
    className:"text-left"
  },
  {
    title: "Descripción",
    data: "description",
    className:"text-left"
  },
  {
    title: "Categoría",
    data: "system_category",
    className:"text-left"
  },
  {
  title: "Cantidad",
  data: "quantity",
  className: "text-center max-w-[40px]"
 
},
  {
    title: "Acciones",
    data: "id_parts_inventory",
    className: "text-center max-w-[45px] ",
    render: (data: any) => `
    
        <button
          class="btn-view bg-emerald-900 text-slate-50 border border-emerald-900 rounded-lg"
          data-id="${data}"
        >
          Ver
        </button>

        <button
          class="btn-edit"
          data-id="${data}"
          style="
            background:#02B641;
            color:white;
            border:none;
            padding:6px 10px;
            border-radius:8px;
            cursor:pointer;
          "
        >
          Editar
        </button>

      
    `
  }
]}
 />    
</div>
    

      {/* MODAL VER REPUESTO */}

      {showViewModal &&
      selectedPart && (

        <div
          className="
          fixed
          inset-0
          bg-black/50
          flex
          items-center
          justify-center
          z-50"
        >

          <div
            className="
            bg-white
            rounded-xl
            shadow-xl
            w-full
            max-w-lg"
          >

            <div
              className="
              flex
              justify-between
              items-center
              p-4
              border-b"
            >

              <h2
                className="
                text-xl
                font-semibold"
              >
                Ver Repuesto
              </h2>

              <button
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-6 space-y-4">

              <div>

                <label
                  className="
                  block
                  text-sm
                  font-medium"
                >
                  ID
                </label>

                <div className="mt-1">
                  {selectedPart.id_parts_inventory}
                </div>

              </div>

              <div>

                <label
                  className="
                  block
                  text-sm
                  font-medium"
                >
                  Código
                </label>

                <div className="mt-1">
                  {selectedPart.inventory_code}
                </div>

              </div>

              <div>

                <label
                  className="
                  block
                  text-sm
                  font-medium"
                >
                  Descripción
                </label>

                <div className="mt-1">
                  {selectedPart.description}
                </div>

              </div>

              <div>

                <label
                  className="
                  block
                  text-sm
                  font-medium"
                >
                  Categoría
                </label>

                <div className="mt-1">
                  {selectedPart.system_category}
                </div>

              </div>

              <div>

                <label
                  className="
                  block
                  text-sm
                  font-medium"
                >
                  Cantidad
                </label>

                <div className="mt-1">
                  {selectedPart.quantity}
                </div>

              </div>

            </div>

            <div
              className="
              p-4
              border-t
              flex
              justify-end"
            >

              <button
                onClick={() =>
                  setShowViewModal(false)
                }
                className="
                px-4
                py-2
                rounded-lg
                bg-slate-500
                text-white"
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      )}

      
    {showEditModal && (

  <div
    className="
    fixed
    inset-0
    bg-slate-900/60
    backdrop-blur-sm
    z-[100]
    flex
    items-center
    justify-center
    p-4"
  >

    <div
      className="
      bg-white
      rounded-3xl
      w-full
      max-w-2xl
      overflow-hidden
      shadow-2xl"
    >

      <div className="bg-[#005f43] p-6 text-white relative">

        <div className="flex items-center gap-3">

          <div className="p-2 bg-white/20 rounded-lg">
            <Plus className="w-6 h-6" />
          </div>

          <div>

            <h3 className="text-xl font-bold">
              {isEditing
                ? "Editar Repuesto"
                : "Nuevo Repuesto"}
            </h3>

            <p
              className="
              text-emerald-100
              text-[10px]
              font-black
              uppercase
              tracking-widest
              opacity-80"
            >
              Inventario Integral Group
            </p>

          </div>

        </div>

        <button
          onClick={() =>
            setShowEditModal(false)
          }
          className="
          absolute
          top-6
          right-6
          hover:rotate-90
          transition-transform"
        >
          <X className="w-6 h-6" />
        </button>

      </div>

      <div className="p-8 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-4">

            <p
              className="
              text-[10px]
              font-black
              text-[#005f43]
              uppercase
              tracking-widest
              border-b
              border-[#005f43]/10
              pb-1"
            >
              Identificación
            </p>

            <div>

              <label
                className="
                block
                text-[10px]
                font-bold
                text-slate-500
                uppercase
                mb-1
                ml-1"
              >
                Código
              </label>

              <input
                type="text"
                value={formData.inventory_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inventory_code:
                      e.target.value
                  })
                }
                className="
                w-full
                px-4
                py-2.5
                bg-slate-50
                border
                border-slate-200
                rounded-xl
                text-sm
                focus:ring-2
                focus:ring-[#005f43]
                outline-none"
              />

            </div>

            <div>

              <label
                className="
                block
                text-[10px]
                font-bold
                text-slate-500
                uppercase
                mb-1
                ml-1"
              >
                Categoría
              </label>

              <input
                type="text"
                value={formData.system_category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    system_category:
                      e.target.value
                  })
                }
                className="
                w-full
                px-4
                py-2.5
                bg-slate-50
                border
                border-slate-200
                rounded-xl
                text-sm
                focus:ring-2
                focus:ring-[#005f43]
                outline-none"
              />

            </div>

          </div>

          <div className="space-y-4">

            <p
              className="
              text-[10px]
              font-black
              text-[#005f43]
              uppercase
              tracking-widest
              border-b
              border-[#005f43]/10
              pb-1"
            >
              Existencia
            </p>

            <div>

              <label
                className="
                block
                text-[10px]
                font-bold
                text-slate-500
                uppercase
                mb-1
                ml-1"
              >
                Cantidad
              </label>

              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity:
                      Number(e.target.value)
                  })
                }
                className="
                w-full
                px-4
                py-2.5
                bg-slate-50
                border
                border-slate-200
                rounded-xl
                text-sm
                focus:ring-2
                focus:ring-[#005f43]
                outline-none"
              />

            </div>

          </div>

        </div>

        <div>

          <p
            className="
            text-[10px]
            font-black
            text-[#005f43]
            uppercase
            tracking-widest
            border-b
            border-[#005f43]/10
            pb-1
            mb-4"
          >
            Descripción
          </p>

          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description:
                  e.target.value
              })
            }
            className="
            w-full
            px-4
            py-3
            bg-slate-50
            border
            border-slate-200
            rounded-xl
            text-sm
            focus:ring-2
            focus:ring-[#005f43]
            outline-none"
          />

        </div>

      </div>

      <div
        className="
        flex
        gap-4
        p-6
        border-t
        border-slate-100"
      >

        <button
          onClick={() =>
            setShowEditModal(false)
          }
          className="
          flex-1
          px-4
          py-3
          text-slate-500
          font-bold
          hover:bg-slate-50
          rounded-2xl"
        >
          Cancelar
        </button>

        <button
          onClick={savePart}
          className="
          flex-[2]
          px-4
          py-3
          bg-[#005f43]
          text-white
          font-black
          rounded-2xl
          shadow-lg
          hover:bg-[#004733]"
        >
          {isEditing
            ? "ACTUALIZAR REPUESTO"
            : "GUARDAR REPUESTO"}
        </button>

      </div>

    </div>

  </div>

)}   

    </div>

  );

}
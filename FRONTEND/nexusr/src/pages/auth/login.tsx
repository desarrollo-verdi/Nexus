import { useState, FormEvent } from "react";
import { Card, TextInput, Button, Label, Alert } from "flowbite-react";
import { HiUser, HiLockClosed, HiArrowRight, HiExclamationCircle } from "react-icons/hi";
import { SlEnergy } from "react-icons/sl";
import { useNavigate } from 'react-router-dom';
import api from "../../services/api";
import { useAuth } from "../../services/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Controlador para el cambio de usuario con Regex Estricto
  const handleUsernameChange = (val: string) => {
    // Reemplaza todo lo que NO sea una letra minúscula entre a y z
    const sanitized = val.toLowerCase().replace(/[^a-z]/g, "");
    setUsername(sanitized);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim()
      });

      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate("/home");
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      const msg = error.response?.data?.error || "Error de conexión con el servidor.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden select-none">
      {/* Fondo de pantalla */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[6px] transition-all duration-1000"
        style={{
          backgroundImage: "url('https://swingenergy.com.ve/wp-content/uploads/2025/10/SW-AH.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/60 to-zinc-900/40" />

      <Card className="relative z-10 w-full max-w-md border border-white/10 bg-white/90 backdrop-blur-md p-2 sm:p-4 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        
        {/* Encabezado */}
        <div className="flex flex-col items-center mt-2 mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50/90 text-[#005f43] text-4xl shadow-md border border-emerald-100/50 transition-transform duration-300 hover:rotate-12">
            <SlEnergy />
          </div>
          <h2 className="text-3xl font-black text-slate-950 tracking-wider mt-4">NEXUS 3</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-1.5">Portal Corporativo</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-2 pb-2">
          
          {/* Input Usuario */}
          <div className="w-full">
            <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-700 pl-3">
              Usuario
            </Label>
            <TextInput
              id="username"
              type="text"
              placeholder="Ingrese su usuario"
              icon={HiUser}
              required
              color="gray"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="mt-1.5 [&_input]:rounded-full"
              theme={{
                field: {
                  base: "relative w-full flex items-center",
                  icon: { base: "absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400 z-20", svg: "w-5 h-5" },
                  input: {
                    base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
                    colors: { gray: "bg-white/70 border border-slate-300/80 text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 backdrop-blur-sm transition-all duration-200" },
                    sizes: { md: "py-3.5 ps-11 pe-4 text-sm w-full relative z-10 focus:outline-none" }
                  }
                }
              }}
            />
          </div>

          {/* Input Contraseña */}
          <div className="w-full">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 pl-3">
              Contraseña
            </Label>
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              icon={HiLockClosed}
              required
              color="gray"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 [&_input]:rounded-full"
              theme={{
                field: {
                  base: "relative w-full flex items-center",
                  icon: { base: "absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400 z-20", svg: "w-5 h-5" },
                  input: {
                    base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
                    colors: { gray: "bg-white/70 border border-slate-300/80 text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/20 backdrop-blur-sm transition-all duration-200" },
                    sizes: { md: "py-3.5 ps-11 pe-4 text-sm w-full relative z-10 focus:outline-none" }
                  }
                }
              }}
            />
          </div>

          {/* Botón de Envío */}
          <Button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#005f43] hover:bg-[#004631] active:scale-[0.98] text-white font-bold tracking-wider transition-all duration-200 border-none rounded-full h-12 flex items-center justify-center shadow-lg shadow-emerald-900/30 transform hover:scale-[1.01]"
          >
            <span className="flex items-center justify-center gap-2 uppercase text-xs font-black">
              {loading ? "Autenticando..." : "Ingresar al Sistema"}
              {!loading && <HiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
            </span>
          </Button>

          {/* 🔴 Notificación de Error Ubicada después del Botón con Estilo UI Pulido */}
          {errorMsg && (
            <Alert 
              icon={HiExclamationCircle}
              className="mt-2 rounded-2xl bg-red-50/80 border border-red-200/60 text-red-700 backdrop-blur-sm shadow-sm transition-all duration-300 animate-fadeIn"
            >
              <span className="text-xs font-bold tracking-wide uppercase block mb-0.5">Error de Acceso</span>
              <span className="text-xs font-medium text-red-600/90 normal-case block">{errorMsg}</span>
            </Alert>
          )}
          
        </form>
      </Card>
    </div>
  );
}
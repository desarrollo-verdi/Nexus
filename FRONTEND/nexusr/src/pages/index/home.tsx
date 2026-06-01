import Nav from '../../components/nav'
import Aside from '../../components/aside'
import { Outlet } from 'react-router-dom';


export default function Home() {
  return (
    <>
      <Nav />
      <Aside />
      
      {/* Contenedor dinámico */}
      <main className="pt-20 lg:pl-64 p-4 text-slate-800">
        <Outlet /> 
        
      </main>
    </>
  );
}
import { useState, useEffect } from "react";

const store = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const EQUIPOS_DEFAULT = [
  { id:"EQ001", nombre:"Excavadora Hidráulica #1", marca:"Caterpillar", modelo:"320", horometro:1240 },
  { id:"EQ002", nombre:"Excavadora Hidráulica #2", marca:"Volvo", modelo:"EC220", horometro:3870 },
  { id:"EQ003", nombre:"Cargador Frontal #1", marca:"Komatsu", modelo:"WA380", horometro:780 },
];
const USUARIOS_DEFAULT = [
  { id:"op1", nombre:"Operario 1", rol:"operario", pin:"1234" },
  { id:"sv1", nombre:"Supervisor", rol:"supervisor", pin:"9999" },
];
const PLANES = {
  250:  { label:"250 hrs",   color:"#2563eb", tareas:["Cambiar aceite de motor + filtro","Cambiar filtro primario y secundario de combustible","Limpiar prefiltro de combustible","Inspeccionar y limpiar radiador","Verificar tensión y estado de correas","Cambiar filtro de retorno hidráulico","Cambiar filtro de pilotaje hidráulico","Verificar presiones del sistema hidráulico","Lubricar todos los puntos de engrase","Verificar y ajustar tensión de cadenas","Verificar nivel de aceite en reductores de traslación","Verificar estado y carga de batería","Inspeccionar soldaduras de pluma y brazo"] },
  500:  { label:"500 hrs",   color:"#d97706", tareas:["Realizar todo el mantenimiento de 250 hrs","Cambiar filtro de aire primario y secundario","Verificar inyectores (prueba de funcionamiento)","Verificar juego de válvulas (holguras)","Analizar muestra de aceite hidráulico","Verificar cilindros hidráulicos por desgaste de sellos","Inspeccionar válvulas de control proporcional","Cambiar aceite en reductores de traslación","Medir desgaste de zapatas","Analizar muestra de refrigerante","Verificar termostato y bomba de agua"] },
  1000: { label:"1,000 hrs", color:"#dc2626", tareas:["Realizar todo el mantenimiento de 500 hrs","Cambiar aceite de motor (análisis previo)","Cambiar filtro de ventilación del cárter","Cambiar aceite hidráulico completo","Cambiar todos los filtros hidráulicos","Limpiar depósito hidráulico internamente","Verificar y calibrar presiones de alivio principal","Cambiar aceite de reductor de giro","Inspeccionar motor de giro por ruidos y fugas","Verificar freno de giro","Cambiar aceite reductores de traslación","Reemplazar pines y bocines desgastados","Inspección completa de soldaduras (END)"] },
  2000: { label:"2,000 hrs", color:"#7c3aed", tareas:["Realizar todo el mantenimiento de 1,000 hrs","Cambiar refrigerante del sistema","Reemplazar correa de distribución / cadena","Inspeccionar / rectificar culata","Overhaul de bomba hidráulica principal","Reemplazar sellos de todos los cilindros","Evaluación completa de tren de rodaje","Reemplazar zapatas si espesor mínimo","Reemplazar rodillos desgastados","Reemplazar batería","Actualizar software ECM / tablero","Reemplazar filtro de cabina (AC)","Calibrar pantalla y controles"] },
};

const nextService = (h) => {
  for (const i of [250,500,1000,2000]) {
    const next = Math.ceil((h+1)/i)*i;
    if (next > h) return { intervalo:i, en:next-h };
  }
};
const alertLevel = (en) =>
  en<=25 ? {color:"#ef4444",label:"URGENTE"} :
  en<=75 ? {color:"#f59e0b",label:"Próximo"} :
           {color:"#10b981",label:"OK"};
const uid = () => "EQ"+Date.now().toString().slice(-6);

const Ic = {
  back:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{width:16,height:16}}><path d="M20 6L9 17l-5-5"/></svg>,
  edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:16,height:16}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:16,height:16}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  alert:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>,
  wrench: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  chart:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  mach:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v3M8 12h8"/></svg>,
  users:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  gear:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:20,height:20}}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

function Card({children,style={}}) {
  return <div style={{background:"#111827",borderRadius:18,border:"1px solid #1f2937",padding:16,...style}}>{children}</div>;
}
function Btn({children,onClick,color="#f59e0b",textColor="#111",style={},disabled=false}) {
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:disabled?"#1f2937":color,color:disabled?"#4b5563":textColor,fontWeight:700,fontSize:15,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",...style}}>{children}</button>;
}
function Header({title,sub,onBack}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:20,paddingBottom:8}}>
      {onBack && <button onClick={onBack} style={{padding:8,borderRadius:10,background:"#1f2937",border:"none",color:"#9ca3af",cursor:"pointer",display:"flex"}}>{Ic.back}</button>}
      <div>
        <h2 style={{color:"#fff",fontWeight:700,fontSize:18,margin:0}}>{title}</h2>
        {sub && <p style={{color:"#6b7280",fontSize:12,margin:0}}>{sub}</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [usuario,   setUsuario]   = useState(null);
  const [equipos,   setEquipos]   = useState(EQUIPOS_DEFAULT);
  const [usuarios,  setUsuarios]  = useState(USUARIOS_DEFAULT);
  const [registros, setRegistros] = useState([]);
  const [vista,     setVista]     = useState("home");
  const [loading,   setLoading]   = useState(true);
  const [equipoSel, setEquipoSel] = useState(null);
  const [planSel,   setPlanSel]   = useState(null);
  const [marcadas,  setMarcadas]  = useState({});
  const [obs,       setObs]       = useState("");
  const [hrInput,   setHrInput]   = useState("");
  const [savedOk,   setSavedOk]   = useState(false);

  useEffect(() => {
    const r=store.get("fc_reg"); const e=store.get("fc_eq");
    const u=store.get("fc_usr"); const us=store.get("fc_usrs");
    if(r) setRegistros(r); if(e) setEquipos(e);
    if(u) setUsuario(u);   if(us) setUsuarios(us);
    setLoading(false);
  },[]);

  const saveEq  = (v) => { setEquipos(v);   store.set("fc_eq",v);   };
  const saveReg = (v) => { setRegistros(v); store.set("fc_reg",v);  };
  const saveUs  = (v) => { setUsuarios(v);  store.set("fc_usrs",v); };
  const login   = (u) => { setUsuario(u);   store.set("fc_usr",u);  };
  const logout  = () => { setUsuario(null); store.set("fc_usr",null); setVista("home"); };

  const submitServicio = () => {
    const comp = Object.values(marcadas).filter(Boolean).length;
    const nuevo = {
      id:Date.now(), equipoId:equipoSel.id, equipoNombre:equipoSel.nombre,
      marca:equipoSel.marca, modelo:equipoSel.modelo, plan:planSel,
      horometro:parseInt(hrInput)||equipoSel.horometro, marcadas, completadas:comp,
      totalTareas:PLANES[planSel].tareas.length, observaciones:obs,
      tecnico:usuario.nombre, fecha:new Date().toLocaleString("es-MX"), timestamp:Date.now(),
    };
    saveReg([nuevo,...registros]);
    saveEq(equipos.map(e=>e.id===equipoSel.id?{...e,horometro:parseInt(hrInput)||e.horometro}:e));
    setSavedOk(true);
    setTimeout(()=>{ setSavedOk(false); setVista("home"); setEquipoSel(null); setPlanSel(null); setMarcadas({}); setObs(""); setHrInput(""); },1800);
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0b1120"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{width:44,height:44,border:"3px solid #f59e0b",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
        <p style={{color:"#f59e0b",fontFamily:"monospace",fontSize:13}}>Cargando FlotaCheck…</p>
      </div>
    </div>
  );

  if (!usuario) return <Login usuarios={usuarios} onLogin={login}/>;

  const isSup = usuario.rol==="supervisor";
  const navItems = [
    {key:"home",icon:Ic.mach,label:"Inicio"},
    {key:"nuevo",icon:Ic.wrench,label:"Servicio"},
    {key:"historial",icon:Ic.clock,label:"Historial"},
    {key:"reportes",icon:Ic.chart,label:"Reportes"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0b1120",fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <nav style={{background:"#111827",borderBottom:"1px solid #1f2937",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:520,margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#f59e0b,#fbbf24)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#111",fontWeight:800,fontSize:13}}>FC</span>
            </div>
            <div>
              <p style={{color:"#f59e0b",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:0}}>FlotaCheck</p>
              <p style={{color:"#6b7280",fontSize:11,margin:0}}>{usuario.nombre} · {usuario.rol}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {isSup && <button onClick={()=>setVista("config")} style={{padding:"6px 8px",borderRadius:8,background:"#1f2937",border:"none",color:"#9ca3af",cursor:"pointer",display:"flex"}}>{Ic.gear}</button>}
            <button onClick={logout} style={{padding:"6px 8px",borderRadius:8,background:"#1f2937",border:"none",color:"#9ca3af",cursor:"pointer",display:"flex"}}>{Ic.logout}</button>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:520,margin:"0 auto",padding:"0 16px 100px"}}>
        {vista==="home"      && <Home equipos={equipos} registros={registros} usuario={usuario} onNuevo={()=>setVista("nuevo")}/>}
        {vista==="nuevo"     && !equipoSel && <SelEquipo equipos={equipos} onSel={e=>{setEquipoSel(e);setHrInput(String(e.horometro));}} onBack={()=>setVista("home")}/>}
        {vista==="nuevo"     && equipoSel && !planSel && <SelPlan equipo={equipoSel} onSel={setPlanSel} onBack={()=>setEquipoSel(null)}/>}
        {vista==="nuevo"     && equipoSel && planSel  && <FormServ equipo={equipoSel} plan={planSel} marcadas={marcadas} setMarcadas={setMarcadas} obs={obs} setObs={setObs} hrInput={hrInput} setHrInput={setHrInput} onBack={()=>setPlanSel(null)} onSubmit={submitServicio} savedOk={savedOk} usuario={usuario}/>}
        {vista==="historial" && <Historial registros={registros} onBack={()=>setVista("home")}/>}
        {vista==="reportes"  && <Reportes registros={registros} equipos={equipos} onBack={()=>setVista("home")}/>}
        {vista==="config"    && isSup && <Config equipos={equipos} usuarios={usuarios} saveEq={saveEq} saveUs={saveUs} onBack={()=>setVista("home")}/>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#111827",borderTop:"1px solid #1f2937",padding:"8px 0 12px"}}>
        <div style={{maxWidth:520,margin:"0 auto",display:"flex",justifyContent:"space-around"}}>
          {navItems.map(({key,icon,label})=>{
            const active=vista===key||(vista==="nuevo"&&key==="nuevo");
            return (
              <button key={key} onClick={()=>{setVista(key);setEquipoSel(null);setPlanSel(null);}}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 16px",borderRadius:12,border:"none",cursor:"pointer",background:active?"#1f2937":"transparent",color:active?"#f59e0b":"#6b7280",fontFamily:"'Outfit',sans-serif"}}>
                {icon}<span style={{fontSize:10,fontWeight:600}}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Login({usuarios,onLogin}) {
  const [pin,setPin]=useState(""); const [err,setErr]=useState(false);
  const go=()=>{ const u=usuarios.find(u=>u.pin===pin); if(u) onLogin(u); else{setErr(true);setTimeout(()=>setErr(false),1400);setPin("");} };
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",background:"#0b1120"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#f59e0b,#fbbf24)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <span style={{fontSize:26,fontWeight:800,color:"#111"}}>FC</span>
          </div>
          <h1 style={{color:"#fff",fontSize:26,fontWeight:800,marginBottom:4}}>FlotaCheck</h1>
          <p style={{color:"#6b7280",fontSize:14}}>Control de Mantenimiento de Maquinaria</p>
        </div>
        <div style={{background:"#111827",borderRadius:20,padding:24,border:"1px solid #1f2937"}}>
          <p style={{color:"#d1d5db",fontSize:13,fontWeight:600,marginBottom:12}}>Ingresa tu PIN de acceso</p>
          <input type="password" inputMode="numeric" maxLength={6} value={pin}
            onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="• • • •"
            style={{width:"100%",borderRadius:12,padding:"14px 16px",textAlign:"center",fontSize:24,fontFamily:"monospace",letterSpacing:"0.4em",background:err?"#450a0a":"#1f2937",border:`2px solid ${err?"#dc2626":"#374151"}`,color:"#fff",outline:"none",boxSizing:"border-box"}}/>
          {err && <p style={{color:"#f87171",fontSize:12,textAlign:"center",marginTop:8}}>PIN incorrecto</p>}
          <button onClick={go} style={{width:"100%",marginTop:16,padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#fbbf24)",color:"#111",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Ingresar</button>
          <p style={{color:"#374151",fontSize:11,textAlign:"center",marginTop:14}}>Operario: 1234 · Supervisor: 9999</p>
        </div>
      </div>
    </div>
  );
}

function Home({equipos,registros,usuario,onNuevo}) {
  const urgentes=equipos.filter(e=>{const p=nextService(e.horometro);return p&&p.en<=75;});
  const hoy=registros.filter(r=>new Date(r.timestamp).toDateString()===new Date().toDateString());
  return (
    <div style={{paddingTop:20,display:"flex",flexDirection:"column",gap:16}}>
      <div><p style={{color:"#9ca3af",fontSize:14,margin:0}}>Bienvenido,</p><h2 style={{color:"#fff",fontSize:22,fontWeight:800,margin:0}}>{usuario.nombre}</h2></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[{label:"Equipos",val:equipos.length,color:"#3b82f6",icon:Ic.mach},{label:"Hoy",val:hoy.length,color:"#10b981",icon:Ic.check},{label:"Alertas",val:urgentes.length,color:urgentes.length?"#ef4444":"#6b7280",icon:Ic.alert}]
          .map(({label,val,color,icon})=>(
          <Card key={label} style={{textAlign:"center",padding:"14px 8px"}}>
            <div style={{color,display:"flex",justifyContent:"center",marginBottom:4}}>{icon}</div>
            <p style={{color:"#fff",fontWeight:800,fontSize:22,margin:0}}>{val}</p>
            <p style={{color:"#6b7280",fontSize:11,margin:0}}>{label}</p>
          </Card>
        ))}
      </div>
      {urgentes.length>0&&(
        <div style={{background:"#1c0505",borderRadius:16,padding:14,border:"1px solid #7f1d1d"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{color:"#f87171"}}>{Ic.alert}</span>
            <p style={{color:"#f87171",fontWeight:700,fontSize:13,margin:0}}>Servicios próximos / urgentes</p>
          </div>
          {urgentes.map(e=>{const p=nextService(e.horometro);const a=alertLevel(p.en);return(
            <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid #450a0a"}}>
              <div><p style={{color:"#fff",fontSize:13,fontWeight:600,margin:0}}>{e.nombre}</p><p style={{color:"#9ca3af",fontSize:11,margin:0}}>{e.marca} {e.modelo} · Serv.{p.intervalo}hrs</p></div>
              <span style={{color:a.color,fontSize:11,fontWeight:800,background:"#0b1120",padding:"3px 8px",borderRadius:8}}>{p.en} hrs</span>
            </div>
          );})}
        </div>
      )}
      <button onClick={onNuevo} style={{width:"100%",borderRadius:18,padding:"18px 20px",display:"flex",alignItems:"center",gap:14,background:"linear-gradient(135deg,#f59e0b,#fbbf24)",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:44,height:44,borderRadius:12,background:"rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#111",flexShrink:0}}>{Ic.wrench}</div>
        <div><p style={{color:"#111",fontWeight:800,fontSize:16,margin:0}}>Registrar Servicio</p><p style={{color:"#78350f",fontSize:12,margin:0}}>Nuevo mantenimiento por horas</p></div>
      </button>
      <Card>
        <p style={{color:"#d1d5db",fontWeight:700,fontSize:13,marginBottom:12}}>Estado de Flota</p>
        {equipos.length===0&&<p style={{color:"#4b5563",fontSize:13,textAlign:"center",padding:"16px 0"}}>Sin equipos registrados</p>}
        {equipos.map((e,i)=>{const p=nextService(e.horometro);const a=p?alertLevel(p.en):null;return(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderTop:i>0?"1px solid #1f2937":"none"}}>
            <div><p style={{color:"#fff",fontSize:13,fontWeight:600,margin:0}}>{e.nombre}</p><p style={{color:"#6b7280",fontSize:11,margin:0}}>{e.marca} {e.modelo} · {e.horometro.toLocaleString()} hrs</p></div>
            {a&&p&&<div style={{textAlign:"right"}}><p style={{color:a.color,fontSize:11,fontWeight:800,margin:0}}>{a.label}</p><p style={{color:"#4b5563",fontSize:10,margin:0}}>Serv.{p.intervalo}h en {p.en}h</p></div>}
          </div>
        );})}
      </Card>
    </div>
  );
}

function SelEquipo({equipos,onSel,onBack}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Header title="Selecciona Equipo" onBack={onBack}/>
      {equipos.length===0&&<Card style={{textAlign:"center",padding:32}}><p style={{color:"#6b7280"}}>Sin equipos. El supervisor puede añadirlos en Configuración.</p></Card>}
      {equipos.map(e=>{const p=nextService(e.horometro);const a=p?alertLevel(p.en):null;return(
        <button key={e.id} onClick={()=>onSel(e)} style={{width:"100%",borderRadius:16,padding:16,textAlign:"left",background:"#111827",border:"1px solid #1f2937",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><p style={{color:"#fff",fontWeight:700,fontSize:14,margin:0}}>{e.nombre}</p><p style={{color:"#6b7280",fontSize:12,margin:0}}>{e.marca} {e.modelo} · {e.horometro.toLocaleString()} hrs</p></div>
          {a&&p&&<span style={{color:a.color,fontSize:11,fontWeight:700,background:"#0b1120",padding:"3px 8px",borderRadius:8,flexShrink:0}}>{p.en}h</span>}
        </button>
      );})}
    </div>
  );
}

function SelPlan({equipo,onSel,onBack}) {
  const prox=nextService(equipo.horometro);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Header title="Tipo de Servicio" sub={`${equipo.nombre} · ${equipo.horometro.toLocaleString()} hrs`} onBack={onBack}/>
      {Object.entries(PLANES).map(([hrs,plan])=>{const esP=prox&&prox.intervalo===parseInt(hrs);return(
        <button key={hrs} onClick={()=>onSel(parseInt(hrs))} style={{width:"100%",borderRadius:16,padding:16,textAlign:"left",background:"#111827",border:`2px solid ${esP?plan.color:"#1f2937"}`,cursor:"pointer",position:"relative"}}>
          {esP&&<span style={{position:"absolute",top:10,right:12,fontSize:10,fontWeight:800,color:"#fff",background:plan.color,padding:"2px 8px",borderRadius:20}}>RECOMENDADO</span>}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:plan.color+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:plan.color,fontWeight:900,fontSize:parseInt(hrs)>=1000?12:14}}>{parseInt(hrs)>=1000?(parseInt(hrs)/1000)+"K":hrs}</span>
            </div>
            <div><p style={{color:"#fff",fontWeight:700,fontSize:14,margin:0}}>Servicio {plan.label}</p><p style={{color:"#6b7280",fontSize:12,margin:0}}>{plan.tareas.length} tareas a realizar</p></div>
          </div>
        </button>
      );})}
    </div>
  );
}

function FormServ({equipo,plan,marcadas,setMarcadas,obs,setObs,hrInput,setHrInput,onBack,onSubmit,savedOk,usuario}) {
  const pd=PLANES[plan];
  const comp=Object.values(marcadas).filter(Boolean).length;
  const pct=Math.round((comp/pd.tareas.length)*100);
  if(savedOk) return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{width:36,height:36}}><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <p style={{color:"#fff",fontWeight:800,fontSize:20}}>¡Guardado!</p>
      <p style={{color:"#6b7280",fontSize:13}}>{comp}/{pd.tareas.length} tareas completadas</p>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Header title={`Servicio ${pd.label}`} sub={`${equipo.nombre} · ${equipo.marca} ${equipo.modelo}`} onBack={onBack}/>
      <Card><p style={{color:"#d1d5db",fontSize:13,fontWeight:600,marginBottom:8}}>Horómetro actual (hrs)</p>
        <input type="number" value={hrInput} onChange={e=>setHrInput(e.target.value)} style={{width:"100%",borderRadius:10,padding:"12px 14px",background:"#1f2937",border:"1px solid #374151",color:"#fff",fontSize:20,fontWeight:700,fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}/>
      </Card>
      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <p style={{color:"#d1d5db",fontSize:13,fontWeight:600,margin:0}}>Progreso</p>
          <p style={{color:pd.color,fontSize:13,fontWeight:800,margin:0}}>{comp}/{pd.tareas.length} · {pct}%</p>
        </div>
        <div style={{height:8,borderRadius:8,background:"#1f2937"}}><div style={{height:8,borderRadius:8,background:pd.color,width:`${pct}%`,transition:"width 0.3s"}}/></div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {pd.tareas.map((t,i)=>{const ok=marcadas[i];return(
          <button key={i} onClick={()=>setMarcadas(p=>({...p,[i]:!p[i]}))} style={{width:"100%",borderRadius:14,padding:"13px 14px",textAlign:"left",display:"flex",alignItems:"center",gap:12,background:ok?"#052e16":"#111827",border:`1px solid ${ok?"#14532d":"#1f2937"}`,cursor:"pointer"}}>
            <div style={{width:24,height:24,borderRadius:8,background:ok?"#10b981":"#1f2937",border:ok?"none":"2px solid #374151",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ok&&<span style={{color:"#fff"}}>{Ic.check}</span>}</div>
            <p style={{color:ok?"#6ee7b7":"#d1d5db",fontSize:13,margin:0,textDecoration:ok?"line-through":"none"}}>{t}</p>
          </button>
        );})}
      </div>
      <Card><p style={{color:"#d1d5db",fontSize:13,fontWeight:600,marginBottom:8}}>Observaciones</p>
        <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3} placeholder="Anomalías, piezas cambiadas, próximas acciones..."
          style={{width:"100%",borderRadius:10,padding:"10px 12px",background:"#1f2937",border:"1px solid #374151",color:"#d1d5db",fontSize:13,outline:"none",resize:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
      </Card>
      <div style={{background:"#1f2937",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:"#6b7280"}}>{Ic.users}</span>
        <p style={{color:"#9ca3af",fontSize:13,margin:0}}>Técnico: <span style={{color:"#fff",fontWeight:600}}>{usuario.nombre}</span></p>
      </div>
      <Btn onClick={onSubmit} disabled={comp===0}>{comp===0?"Marca al menos una tarea":`Guardar Servicio (${comp}/${pd.tareas.length} tareas)`}</Btn>
    </div>
  );
}

function Historial({registros,onBack}) {
  const [q,setQ]=useState("");
  const f=registros.filter(r=>r.equipoNombre?.toLowerCase().includes(q.toLowerCase())||r.tecnico?.toLowerCase().includes(q.toLowerCase())||r.marca?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Header title="Historial" sub={`${registros.length} registros totales`} onBack={onBack}/>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar equipo, técnico o marca..."
        style={{borderRadius:12,padding:"12px 14px",background:"#111827",border:"1px solid #1f2937",color:"#fff",fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif"}}/>
      {f.length===0?<Card style={{textAlign:"center",padding:40}}><p style={{color:"#4b5563"}}>Sin registros{q?" para esa búsqueda":" aún"}</p></Card>
        :f.map(r=>{const plan=PLANES[r.plan];const pct=Math.round((r.completadas/r.totalTareas)*100);return(
        <Card key={r.id}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div><p style={{color:"#fff",fontWeight:700,fontSize:13,margin:0}}>{r.equipoNombre}</p><p style={{color:"#6b7280",fontSize:11,margin:0}}>{r.fecha}</p></div>
            <span style={{fontSize:11,fontWeight:800,color:"#fff",background:plan.color,padding:"3px 10px",borderRadius:20,alignSelf:"flex-start"}}>{plan.label}</span>
          </div>
          <div style={{height:6,borderRadius:6,background:"#1f2937",marginBottom:8}}><div style={{height:6,borderRadius:6,background:plan.color,width:`${pct}%`}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280"}}>
            <span>{r.completadas}/{r.totalTareas} tareas · {r.horometro?.toLocaleString()} hrs</span><span>{r.tecnico}</span>
          </div>
          {r.observaciones&&<p style={{color:"#6b7280",fontSize:11,marginTop:8,paddingTop:8,borderTop:"1px solid #1f2937"}}>📝 {r.observaciones}</p>}
        </Card>
      );})}
    </div>
  );
}

function Reportes({registros,equipos,onBack}) {
  const tC=registros.reduce((s,r)=>s+r.completadas,0);
  const tP=registros.reduce((s,r)=>s+r.totalTareas,0);
  const cum=tP>0?Math.round((tC/tP)*100):0;
  const pp=Object.entries(PLANES).map(([hrs,plan])=>({...plan,hrs,count:registros.filter(r=>r.plan===parseInt(hrs)).length}));
  const mx=Math.max(...pp.map(p=>p.count),1);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Header title="Reportes de Flota" onBack={onBack}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[{label:"Total Servicios",val:registros.length,color:"#3b82f6"},{label:"Cumplimiento",val:`${cum}%`,color:"#10b981"},{label:"Tareas Ejecutadas",val:tC,color:"#f59e0b"},{label:"Equipos",val:equipos.length,color:"#7c3aed"}]
          .map(({label,val,color})=><Card key={label}><p style={{color,fontSize:26,fontWeight:800,margin:0}}>{val}</p><p style={{color:"#6b7280",fontSize:11,margin:0}}>{label}</p></Card>)}
      </div>
      <Card>
        <p style={{color:"#d1d5db",fontWeight:700,fontSize:13,marginBottom:14}}>Servicios por Intervalo</p>
        {pp.map(({label,color,count,hrs})=>(
          <div key={hrs} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#9ca3af",fontSize:12}}>{label}</span><span style={{color:"#fff",fontSize:12,fontWeight:700}}>{count}</span></div>
            <div style={{height:8,borderRadius:8,background:"#1f2937"}}><div style={{height:8,borderRadius:8,background:color,width:`${(count/mx)*100}%`,transition:"width 0.4s"}}/></div>
          </div>
        ))}
      </Card>
      <Card>
        <p style={{color:"#d1d5db",fontWeight:700,fontSize:13,marginBottom:12}}>Estado por Equipo</p>
        {equipos.length===0&&<p style={{color:"#4b5563",fontSize:13,textAlign:"center",padding:"12px 0"}}>Sin equipos</p>}
        {equipos.map((e,i)=>{const p=nextService(e.horometro);const a=p?alertLevel(p.en):null;const cnt=registros.filter(r=>r.equipoId===e.id).length;return(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderTop:i>0?"1px solid #1f2937":"none"}}>
            <div><p style={{color:"#fff",fontSize:13,fontWeight:600,margin:0}}>{e.nombre}</p><p style={{color:"#6b7280",fontSize:11,margin:0}}>{e.horometro.toLocaleString()} hrs · {cnt} servicios</p></div>
            {a&&p&&<div style={{textAlign:"right"}}><p style={{color:a.color,fontSize:11,fontWeight:800,margin:0}}>{a.label}</p><p style={{color:"#4b5563",fontSize:10,margin:0}}>{p.en}h para serv.{p.intervalo}</p></div>}
          </div>
        );})}
      </Card>
    </div>
  );
}

function Config({equipos,usuarios,saveEq,saveUs,onBack}) {
  const [tab,setTab]=useState("equipos");
  const [eF,setEF]=useState({nombre:"",marca:"",modelo:"",horometro:""});
  const [eId,setEId]=useState(null); const [eErr,setEErr]=useState("");
  const [uF,setUF]=useState({nombre:"",rol:"operario",pin:""});
  const [uId,setUId]=useState(null); const [uErr,setUErr]=useState("");
  const rE=()=>{setEF({nombre:"",marca:"",modelo:"",horometro:""});setEId(null);setEErr("");};
  const rU=()=>{setUF({nombre:"",rol:"operario",pin:""});setUId(null);setUErr("");};
  const gE=()=>{
    if(!eF.nombre.trim()) return setEErr("El nombre es requerido");
    if(!eF.horometro||isNaN(parseInt(eF.horometro))) return setEErr("Horómetro inválido");
    if(eId) saveEq(equipos.map(e=>e.id===eId?{...e,...eF,horometro:parseInt(eF.horometro)}:e));
    else saveEq([...equipos,{id:uid(),...eF,horometro:parseInt(eF.horometro)}]);
    rE();
  };
  const gU=()=>{
    if(!uF.nombre.trim()) return setUErr("El nombre es requerido");
    if(!uF.pin.trim()||uF.pin.length<4) return setUErr("PIN de al menos 4 dígitos");
    if(!uId&&usuarios.find(u=>u.pin===uF.pin)) return setUErr("PIN ya existe");
    if(uId) saveUs(usuarios.map(u=>u.id===uId?{...u,...uF}:u));
    else saveUs([...usuarios,{id:"u"+Date.now(),...uF}]);
    rU();
  };
  const inp={width:"100%",borderRadius:10,padding:"11px 12px",background:"#1f2937",border:"1px solid #374151",color:"#fff",fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"};
  const lbl={color:"#9ca3af",fontSize:12,marginBottom:4,display:"block"};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Header title="Configuración" sub="Solo supervisores" onBack={onBack}/>
      <div style={{display:"flex",gap:8,background:"#111827",borderRadius:14,padding:4}}>
        {[{k:"equipos",label:"Equipos",icon:Ic.mach},{k:"usuarios",label:"Usuarios",icon:Ic.users}].map(({k,label,icon})=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",cursor:"pointer",background:tab===k?"#f59e0b":"transparent",color:tab===k?"#111":"#6b7280",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'Outfit',sans-serif"}}>
            {icon}{label}
          </button>
        ))}
      </div>
      {tab==="equipos"&&<>
        <Card>
          <p style={{color:"#d1d5db",fontWeight:700,fontSize:13,marginBottom:12}}>{eId?"✏️ Editar":"➕ Nuevo"} Equipo</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><label style={lbl}>Nombre *</label><input value={eF.nombre} onChange={e=>setEF(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Excavadora #3" style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Marca</label><input value={eF.marca} onChange={e=>setEF(p=>({...p,marca:e.target.value}))} placeholder="Ej: Volvo" style={inp}/></div>
              <div><label style={lbl}>Modelo</label><input value={eF.modelo} onChange={e=>setEF(p=>({...p,modelo:e.target.value}))} placeholder="Ej: EC220" style={inp}/></div>
            </div>
            <div><label style={lbl}>Horómetro (hrs) *</label><input type="number" value={eF.horometro} onChange={e=>setEF(p=>({...p,horometro:e.target.value}))} placeholder="Ej: 1500" style={inp}/></div>
            {eErr&&<p style={{color:"#f87171",fontSize:12}}>{eErr}</p>}
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={gE} style={{flex:2}}>{eId?"Actualizar":"Agregar Equipo"}</Btn>
              {eId&&<Btn onClick={rE} color="#1f2937" textColor="#9ca3af" style={{flex:1}}>Cancelar</Btn>}
            </div>
          </div>
        </Card>
        <p style={{color:"#6b7280",fontSize:12,fontWeight:600}}>{equipos.length} EQUIPOS</p>
        {equipos.map(e=>(
          <Card key={e.id} style={{padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><p style={{color:"#fff",fontWeight:600,fontSize:13,margin:0}}>{e.nombre}</p><p style={{color:"#6b7280",fontSize:11,margin:0}}>{e.marca} {e.modelo} · {e.horometro.toLocaleString()} hrs</p></div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEF({nombre:e.nombre,marca:e.marca,modelo:e.modelo,horometro:String(e.horometro)});setEId(e.id);}} style={{padding:"7px",borderRadius:8,background:"#1f2937",border:"none",color:"#60a5fa",cursor:"pointer",display:"flex"}}>{Ic.edit}</button>
                <button onClick={()=>saveEq(equipos.filter(eq=>eq.id!==e.id))} style={{padding:"7px",borderRadius:8,background:"#1f2937",border:"none",color:"#f87171",cursor:"pointer",display:"flex"}}>{Ic.trash}</button>
              </div>
            </div>
          </Card>
        ))}
      </>}
      {tab==="usuarios"&&<>
        <Card>
          <p style={{color:"#d1d5db",fontWeight:700,fontSize:13,marginBottom:12}}>{uId?"✏️ Editar":"➕ Nuevo"} Usuario</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><label style={lbl}>Nombre *</label><input value={uF.nombre} onChange={e=>setUF(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Carlos Ramírez" style={inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Rol</label>
                <select value={uF.rol} onChange={e=>setUF(p=>({...p,rol:e.target.value}))} style={inp}>
                  <option value="operario">Operario</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div><label style={lbl}>PIN (mín. 4 dígitos) *</label><input type="password" inputMode="numeric" value={uF.pin} onChange={e=>setUF(p=>({...p,pin:e.target.value}))} placeholder="••••" style={inp}/></div>
            </div>
            {uErr&&<p style={{color:"#f87171",fontSize:12}}>{uErr}</p>}
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={gU} style={{flex:2}}>{uId?"Actualizar":"Agregar Usuario"}</Btn>
              {uId&&<Btn onClick={rU} color="#1f2937" textColor="#9ca3af" style={{flex:1}}>Cancelar</Btn>}
            </div>
          </div>
        </Card>
        <p style={{color:"#6b7280",fontSize:12,fontWeight:600}}>{usuarios.length} USUARIOS</p>
        {usuarios.map(u=>(
          <Card key={u.id} style={{padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><p style={{color:"#fff",fontWeight:600,fontSize:13,margin:0}}>{u.nombre}</p>
                <p style={{color:"#6b7280",fontSize:11,margin:0}}><span style={{color:u.rol==="supervisor"?"#f59e0b":"#60a5fa",fontWeight:700}}>{u.rol}</span> · PIN: {"•".repeat(u.pin.length)}</p>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setUF({nombre:u.nombre,rol:u.rol,pin:u.pin});setUId(u.id);}} style={{padding:"7px",borderRadius:8,background:"#1f2937",border:"none",color:"#60a5fa",cursor:"pointer",display:"flex"}}>{Ic.edit}</button>
                <button onClick={()=>saveUs(usuarios.filter(us=>us.id!==u.id))} style={{padding:"7px",borderRadius:8,background:"#1f2937",border:"none",color:"#f87171",cursor:"pointer",display:"flex"}}>{Ic.trash}</button>
              </div>
            </div>
          </Card>
        ))}
      </>}
    </div>
  );
}

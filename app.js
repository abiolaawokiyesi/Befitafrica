/* ============================================================
   BefitAfrica (BFA) — Community Fitness App
   Zero-build React (createElement). Pairs with data.js.
   ============================================================ */
const {useState,useEffect,useRef,useCallback}=React;
const h=React.createElement;
const LOGO="bfa-logo.png"; // shipped alongside index.html

let REMEMBERED=loadRemembered();

/* ---------- Theme (brand: yellow #FFE000 + black) ---------- */
const mkT=(d)=>({bg:d?"#090909":"#F2F2ED",surf:d?"#111":"#FFF",surf2:d?"#1A1A1A":"#F0F0EB",surf3:d?"#222":"#E6E6E0",border:d?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",border2:d?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.13)",text:d?"#FFF":"#0A0A0A",text2:d?"rgba(255,255,255,0.5)":"rgba(0,0,0,0.48)",text3:d?"rgba(255,255,255,0.22)":"rgba(0,0,0,0.22)",Y:"#FFE000",Yd:d?"rgba(255,224,0,0.11)":"rgba(255,224,0,0.2)",Yt:d?"#FFE000":"#7A6A00",ok:d?"#00CC66":"#007A3D",warn:"#FF6B00",err:d?"#FF4D4D":"#CC0000",info:d?"#4DA6FF":"#0060D1",purple:d?"#B57BFF":"#6B21A8",pink:"#FF6B9D"});

/* ---------- Small helpers ---------- */
function statusCol(s,t){return{active:t.ok,ambassador:t.Y,volunteer:t.info,"hub-supervisor":t.warn,new:t.text2,member:t.ok,admin:t.warn}[s]||t.text2;}
function statusLbl(s){return{active:"Active",ambassador:"Ambassador",volunteer:"Volunteer","hub-supervisor":"Hub Supervisor",new:"New Member",member:"Member",admin:"Admin"}[s]||s;}
function initials(name){return (name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"BFA";}
function isMobile(){return typeof window!=="undefined"&&window.innerWidth<=760;}
function useViewport(){const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);useEffect(()=>{const f=()=>setW(window.innerWidth);window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f);},[]);return{w,mobile:w<=760,tablet:w>760&&w<=1024};}
/* Haversine distance in km between two {lat,lng} */
function haversineKm(a,b){const R=6371,toRad=x=>x*Math.PI/180;const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(s));}

/* ---------- Icon system (inline SVG, replaces emojis) ---------- */
const ICON_PATHS={
  dashboard:"M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  run:"M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z",
  walk:"M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C15 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7",
  cycle:"M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.8 4.3l-2.4 2.4 3.7 3.7V21h2v-7.5l-2.4-2.4 2.4-2.4c.4.4.9.7 1.5.7H17V8h-2.5c-.3 0-.6-.2-.8-.4l-1.9-2c-.4-.4-.9-.6-1.4-.6s-1 .2-1.4.6L6.7 8.1c-.4.4-.6.9-.6 1.4s.2 1 .6 1.4L11 14M5 20a4 4 0 100-8 4 4 0 000 8zm14 0a4 4 0 100-8 4 4 0 000 8z",
  heart:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  clock:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  community:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  chat:"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z",
  trophy:"M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
  calendar:"M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",
  book:"M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  members:"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  building:"M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  chart:"M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z",
  settings:"M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  fire:"M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z",
  steps:"M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM17 12c-.7 0-1.4.2-2 .5l-1.5-3C13 8.5 12.3 8 11.5 8c-.3 0-.6.1-.9.2L6 10v4.5h2v-3l1.8-.7L7 22h2.1l1.8-6.3 2.1 2V22h2v-7l-2.1-2 .6-3M19 14a4 4 0 100 8 4 4 0 000-8z",
  pin:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z",
  bolt:"M7 2v11h3v9l7-12h-4l4-8z",
  signal:"M2 22h20V2z",
  warn:"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  check:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  play:"M8 5v14l11-7z",
  pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  stop:"M6 6h12v12H6z",
  water:"M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z",
  hiit:"M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z",
  swim:"M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.14-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.14-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.14-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.14 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.61.36 1.16.36.56 0 .78-.14 1.15-.36.46-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.61.36 1.16.36s.78-.14 1.15-.36c.46-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.61.36 1.16.36v2zM8.67 12c.56 0 .78-.14 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.14 1.15-.36.12-.07.26-.15.41-.23L8.32 7.43c-.18.31-.43.6-.83.83-.18.11-.31.25-.31.49 0 .26.18.43.49.6l.7.41c.13.06.21.13.31.24z",
  treadmill:"M19 3a2 2 0 100 4 2 2 0 000-4zM7 8l4 2 5 2v8h2v-9.5l-4.5-2L11 6.5 8 8z",
  hike:"M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM18 21v-9l-2-1.5V7l4 3v11h-2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3",
  signout:"M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  edit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trash:"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  key:"M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
  crown:"M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z",
  star:"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  mail:"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  info:"M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  search:"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  globe:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 015.08 16zm2.95-8H5.08a7.99 7.99 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z",
  gear:"M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
};
function Icon({name,size=18,color="currentColor",style={}}){const d=ICON_PATHS[name];if(!d)return null;return h("svg",{width:size,height:size,viewBox:"0 0 24 24",fill:color,style:{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style},"aria-hidden":"true"},h("path",{d}));}
const ACT_ICON={Run:"run",Walk:"walk",Jog:"run",Treadmill:"treadmill",Cycling:"cycle",Hike:"hike",HIIT:"hiit",Swim:"swim"};

/* ---------- Reusable components ---------- */
function Logo({size=40,withText=false,t,sub}){return h("div",{style:{display:"flex",alignItems:"center",gap:10}},h("img",{src:LOGO,alt:"BefitAfrica",style:{width:size,height:size,objectFit:"contain",borderRadius:8}}),withText&&h("div",null,h("p",{style:{color:(t?t.text:"#fff"),fontSize:size*0.34,fontWeight:900,margin:0,letterSpacing:-0.5,lineHeight:1.05,whiteSpace:"nowrap"}},"BefitAfrica"),sub&&h("p",{style:{color:(t?t.text2:"rgba(255,255,255,0.5)"),fontSize:size*0.2,margin:0,letterSpacing:0.5}},sub)));}
function Pill({color,bg,children,small}){return h("span",{style:{background:bg||`${color}20`,color,padding:small?"2px 7px":"3px 10px",borderRadius:20,fontSize:small?9:10,fontWeight:700,whiteSpace:"nowrap"}},children);}
function Av({init,size=36,t,color}){return h("div",{style:{width:size,height:size,borderRadius:"50%",background:color||t.Yd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:900,color:color?"#080808":t.Yt,flexShrink:0}},init);}
function Inp({label,type="text",val,set,ph,t,rows,req}){const[f,sf]=useState(false);const s={width:"100%",background:t.surf2,border:`1.5px solid ${f?t.Y:t.border2}`,borderRadius:10,padding:"12px 14px",fontSize:14,color:t.text,outline:"none",transition:"border-color 0.2s",resize:rows?"vertical":"none"};return h("div",{style:{marginBottom:13}},label&&h("label",{style:{display:"block",color:t.text2,fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}},label,req&&h("span",{style:{color:t.err}}," *")),rows?h("textarea",{value:val,onChange:e=>set(e.target.value),placeholder:ph,rows,onFocus:()=>sf(true),onBlur:()=>sf(false),style:s}):h("input",{type,value:val,onChange:e=>set(e.target.value),placeholder:ph,onFocus:()=>sf(true),onBlur:()=>sf(false),style:s}));}
function Sel({label,val,set,opts,t,req}){return h("div",{style:{marginBottom:13}},label&&h("label",{style:{display:"block",color:t.text2,fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}},label,req&&h("span",{style:{color:t.err}}," *")),h("select",{value:val,onChange:e=>set(e.target.value),style:{width:"100%",background:t.surf2,border:`1.5px solid ${t.border2}`,borderRadius:10,padding:"12px 14px",fontSize:14,color:t.text,outline:"none",appearance:"none",WebkitAppearance:"none"}},opts.map(o=>h("option",{key:o,value:o,style:{background:t.surf,color:t.text}},o||"Select..."))));}
/* Searchable select for long lists (countries, LGAs) */
function SearchSelect({label,val,set,opts,t,ph,req}){const[open,setOpen]=useState(false);const[q,setQ]=useState("");const ref=useRef(null);useEffect(()=>{const f=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",f);return()=>document.removeEventListener("mousedown",f);},[]);const filt=opts.filter(o=>o.toLowerCase().includes(q.toLowerCase())).slice(0,80);return h("div",{ref,style:{marginBottom:13,position:"relative"}},label&&h("label",{style:{display:"block",color:t.text2,fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}},label,req&&h("span",{style:{color:t.err}}," *")),h("div",{onClick:()=>setOpen(o=>!o),style:{width:"100%",background:t.surf2,border:`1.5px solid ${open?t.Y:t.border2}`,borderRadius:10,padding:"12px 14px",fontSize:14,color:val?t.text:t.text3,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}},h("span",{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},val||ph||"Select..."),h("span",{style:{color:t.text3,fontSize:11}},"▾")),open&&h("div",{style:{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:t.surf,border:`1px solid ${t.border2}`,borderRadius:10,marginTop:4,boxShadow:"0 12px 40px rgba(0,0,0,0.4)",overflow:"hidden"}},h("input",{autoFocus:true,value:q,onChange:e=>setQ(e.target.value),placeholder:"Type to search...",style:{width:"100%",background:t.surf2,border:"none",borderBottom:`1px solid ${t.border}`,padding:"11px 14px",fontSize:13,color:t.text,outline:"none"}}),h("div",{style:{maxHeight:240,overflowY:"auto"}},filt.length?filt.map(o=>h("div",{key:o,onClick:()=>{set(o);setOpen(false);setQ("");},style:{padding:"10px 14px",fontSize:13,color:val===o?t.Yt:t.text,background:val===o?t.Yd:"none",cursor:"pointer",fontWeight:val===o?700:400}},o)):h("div",{style:{padding:"14px",fontSize:13,color:t.text3,textAlign:"center"}},"No match"))));}
function Card({t,children,p="20px 22px",mb,style={}}){return h("div",{style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:14,padding:p,marginBottom:mb,...style}},children);}
function StatBox({t,val,label,sub,accent,color}){return h("div",{style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:13,padding:"16px 18px"}},h("p",{style:{color:t.text2,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",margin:"0 0 5px"}},label),h("p",{style:{color:color||(accent?t.Y:t.text),fontSize:24,fontWeight:900,margin:"0 0 3px",letterSpacing:-0.8}},val),sub&&h("p",{style:{color:t.ok,fontSize:11,margin:0,fontWeight:600}},sub));}
function Notif({n}){if(!n)return null;return h("div",{className:"su",style:{position:"fixed",top:20,right:20,zIndex:9999,background:n.t==="err"?"#FF4D4D":"#00CC66",color:"#fff",padding:"11px 18px",borderRadius:12,fontSize:13,fontWeight:700,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",maxWidth:320}},n.m);}
function Modal({t,title,onClose,children,wide}){return h("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"},onClick:e=>{if(e.target===e.currentTarget)onClose();}},h("div",{className:"su",style:{background:t.surf,borderRadius:20,padding:"26px 26px",width:"100%",maxWidth:wide?640:460,margin:"auto"}},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}},h("h2",{style:{color:t.text,fontSize:18,fontWeight:900,margin:0}},title),h("button",{onClick:onClose,style:{background:"none",border:"none",color:t.text2,cursor:"pointer",fontSize:20}},"✕")),children));}

/* ---------- Splash ---------- */
function Splash(){return h("div",{style:{width:"100%",height:"100vh",background:"radial-gradient(ellipse at 50% 40%,#141414 0%,#090909 70%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:30}},h("div",{className:"splashWrap",style:{position:"relative",width:200,height:200,display:"flex",alignItems:"center",justifyContent:"center"}},
  /* outer rotating dashed ring */
  h("div",{style:{position:"absolute",inset:0,borderRadius:"50%",border:"2px dashed rgba(255,224,0,0.45)",animation:"spin 9s linear infinite"}}),
  /* pulsing glow ring */
  h("div",{style:{position:"absolute",inset:14,borderRadius:"50%",border:"2px solid rgba(255,224,0,0.5)",boxShadow:"0 0 40px rgba(255,224,0,0.25)",animation:"pulse 2s ease-in-out infinite"}}),
  /* second expanding ping ring */
  h("div",{style:{position:"absolute",inset:14,borderRadius:"50%",border:"2px solid rgba(255,224,0,0.4)",animation:"ping 2.4s ease-out infinite"}}),
  /* the logo, breathing in sync */
  h("img",{src:LOGO,alt:"BefitAfrica",style:{width:128,height:128,objectFit:"contain",animation:"breathe 2.6s ease-in-out infinite",filter:"drop-shadow(0 6px 24px rgba(0,0,0,0.6))"}})
),h("div",{className:"fd",style:{textAlign:"center"}},h("p",{style:{color:"#FFE000",fontSize:28,fontWeight:900,margin:0,letterSpacing:-0.5}},"BefitAfrica"),h("p",{style:{color:"rgba(255,255,255,0.9)",fontSize:15,fontWeight:700,margin:"8px 0 0"}},"Fit to Lead"),h("p",{style:{color:"rgba(255,255,255,0.35)",fontSize:10,letterSpacing:4,textTransform:"uppercase",margin:"8px 0 0"}},"Africa's No. 1 Fitness NGO")));}

/* ---------- Email verification screen ---------- */
function VerifyNotice({t,email,token,onVerified,onBack}){
  const[done,setDone]=useState(false);
  const cloud=(typeof bfaRegister==="function"); /* Supabase backend present */
  const verify=()=>{const p=loadPending();if(p[email]&&p[email].token===token){const u=p[email].member;u.verified=true;MEMBERS.push(u);persist();delete p[email];savePending(p);setDone(true);setTimeout(()=>onVerified(u),900);}};
  return h("div",{style:{width:"100%",minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},h("div",{className:"fd",style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:22,padding:"34px 30px",width:"100%",maxWidth:440,textAlign:"center"}},h("div",{style:{marginBottom:10,display:"flex",justifyContent:"center"}},h(Icon,{name:done?"check":"mail",size:46,color:done?t.ok:t.Yt})),h("h2",{style:{color:t.text,fontSize:21,fontWeight:900,margin:"0 0 8px"}},done?"Email verified!":"Verify your email"),h("p",{style:{color:t.text2,fontSize:13,lineHeight:1.7,margin:"0 0 8px"}},done?"Your BefitAfrica account is now active. Signing you in...":["We've sent a verification link to ",h("strong",{key:"e",style:{color:t.text}},email),". Click the link in that email to activate your account."]),!done&&h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}30`,borderRadius:12,padding:"14px 16px",margin:"16px 0",fontSize:12,color:t.Yt,lineHeight:1.6}},h("strong",null,"Didn't get the email? "),cloud?"Check your spam folder. Once you click the link in the email, come back and sign in.":"Check your spam folder, or tap below to confirm your address and activate your account."),(!done&&!cloud)&&h("button",{onClick:verify,style:{width:"100%",background:t.Y,border:"none",borderRadius:11,padding:"14px",fontSize:14,fontWeight:900,color:"#080808",cursor:"pointer"}},"Verify my email & activate account"),!done&&h("button",{onClick:onBack,style:{width:"100%",background:cloud?t.Y:"none",border:"none",borderRadius:cloud?11:0,padding:cloud?"14px":0,color:cloud?"#080808":t.text2,fontSize:cloud?14:12,fontWeight:cloud?900:400,cursor:"pointer",marginTop:14}},cloud?"Back to sign in":"\u2190 Back to sign in")));
}

/* ---------- Auth: Login / Register / Forgot ---------- */
function Auth({onLogin,onNeedVerify,dm,setDm,startMode}){
  const t=mkT(dm);const vp=useViewport();
  const[mode,setMode]=useState(startMode||"login");
  const[email,setEmail]=useState(REMEMBERED?REMEMBERED.email:"");
  const[pass,setPass]=useState(REMEMBERED?REMEMBERED.password:"");
  const[remember,setRemember]=useState(!!REMEMBERED);
  const[showP,setSP]=useState(false);const[err,setErr]=useState("");
  /* forgot */
  const[fEmail,setFE]=useState("");const[fSent,setFS]=useState(false);const[fNew,setFNew]=useState("");const[fStage,setFStage]=useState("request");
  const doLogin=async()=>{
    if(!email||!pass){setErr("Please fill in both fields");return;}
    setErr("");
    if(typeof bfaLogin==="function"){
      /* Cloud backend (Supabase) */
      setErr("Signing in\u2026");
      const r=await bfaLogin(email.trim(),pass);
      if(r.error){setErr(/confirm|verified|not.*confirm/i.test(r.error)?"Please verify your email before signing in (check your inbox).":r.error);return;}
      REMEMBERED=remember?{email:email.trim()}:null;saveRemembered(REMEMBERED);
      onLogin(r.user);setErr("");return;
    }
    /* Local fallback */
    const u=MEMBERS.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===pass);
    if(!u){setErr("Invalid email or password. Please try again.");return;}
    if(u.verified===false){setErr("Please verify your email before signing in.");return;}
    REMEMBERED=remember?{email:u.email,password:pass}:null;saveRemembered(REMEMBERED);saveSession(u);onLogin(u);setErr("");
  };
  /* Only Abiola (admin) may reset passwords from the backend; self-service reset still allowed for own account */
  const doReset=()=>{const u=MEMBERS.find(m=>m.email.toLowerCase()===fEmail.toLowerCase());if(!u){setErr("No account found with that email");return;}setFStage("set");setErr("");};
  const saveNewPass=()=>{if(fNew.length<6){setErr("Password must be at least 6 characters");return;}const u=MEMBERS.find(m=>m.email.toLowerCase()===fEmail.toLowerCase());if(u){u.password=fNew;persist();}setFS(true);setErr("");};
  const card={background:t.surf,border:`1px solid ${t.border}`,borderRadius:22,padding:vp.mobile?"28px 22px":"36px 40px",width:"100%",maxWidth:430};
  const wrap={width:"100%",minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",padding:18};
  const darkBtn=h("div",{style:{position:"absolute",top:16,right:16}},h("button",{onClick:()=>setDm(!dm),style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:20,padding:"6px 13px",color:t.text2,cursor:"pointer",fontSize:11}},dm?"Light":"Dark"));

  if(mode==="forgot")return h("div",{style:wrap},darkBtn,h("div",{className:"fd",style:card},h("button",{onClick:()=>{setMode("login");setFS(false);setErr("");setFStage("request");},style:{background:"none",border:"none",color:t.text2,cursor:"pointer",fontSize:12,padding:0,marginBottom:20}},"\u2190 Back to sign in"),h("h2",{style:{color:t.text,fontSize:24,fontWeight:900,margin:"0 0 8px"}},"Reset password"),fSent?h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}40`,borderRadius:12,padding:"22px",textAlign:"center"}},h("div",{style:{fontSize:34,marginBottom:8}},""),h("p",{style:{color:t.Yt,fontSize:14,fontWeight:700,margin:0}},"Password updated. You can now sign in.")):fStage==="request"?h("div",null,h("p",{style:{color:t.text2,fontSize:13,margin:"0 0 22px"}},"Enter your account email to reset your password."),h(Inp,{label:"Email Address",type:"email",val:fEmail,set:setFE,ph:"your@email.com",t}),err&&h("p",{style:{color:t.err,fontSize:12,margin:"4px 0 8px"}},err),h("button",{onClick:doReset,style:{width:"100%",background:t.Y,border:"none",borderRadius:11,padding:"13px",fontSize:14,fontWeight:900,color:"#080808",cursor:"pointer",marginTop:8}},"Continue")):h("div",null,h("p",{style:{color:t.text2,fontSize:13,margin:"0 0 22px"}},"Set a new password for ",h("strong",{style:{color:t.text}},fEmail)),h(Inp,{label:"New Password",type:"password",val:fNew,set:setFNew,ph:"At least 6 characters",t}),err&&h("p",{style:{color:t.err,fontSize:12,margin:"4px 0 8px"}},err),h("button",{onClick:saveNewPass,style:{width:"100%",background:t.Y,border:"none",borderRadius:11,padding:"13px",fontSize:14,fontWeight:900,color:"#080808",cursor:"pointer",marginTop:8}},"Update Password"))));

  if(mode==="register")return h(Registration,{t,dm,onNeedVerify,onBackToLogin:()=>setMode("login")});

  return h("div",{style:wrap},darkBtn,h("div",{className:"fd",style:card},
    h("div",{style:{display:"flex",justifyContent:"center",marginBottom:20}},h(Logo,{size:64,withText:true,t,sub:"Fit to Lead"})),
    h("h2",{style:{color:t.text,fontSize:22,fontWeight:900,margin:"0 0 4px",textAlign:"center"}},"Welcome back"),
    h("p",{style:{color:t.text2,fontSize:13,margin:"0 0 24px",textAlign:"center"}},"Sign in to your BefitAfrica community"),
    h(Inp,{label:"Email Address",type:"email",val:email,set:setEmail,ph:"your@email.com",t}),
    h("div",{style:{position:"relative"}},h(Inp,{label:"Password",type:showP?"text":"password",val:pass,set:setPass,ph:"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",t}),h("button",{onClick:()=>setSP(!showP),style:{position:"absolute",right:12,top:30,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:t.Yt}},showP?"HIDE":"SHOW")),
    err&&h("p",{style:{color:t.err,fontSize:12,margin:"2px 0 8px"}},err),
    h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"6px 0 4px"}},h("label",{style:{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}},h("div",{onClick:()=>setRemember(!remember),style:{width:18,height:18,borderRadius:5,border:`2px solid ${remember?t.Y:t.border2}`,background:remember?t.Y:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}},remember&&h("span",{style:{color:"#080808",fontSize:11,fontWeight:900}},"\u2713")),h("span",{style:{color:t.text,fontSize:12,fontWeight:500}},"Remember me")),h("button",{onClick:()=>{setMode("forgot");setErr("");},style:{background:"none",border:"none",color:t.Yt,cursor:"pointer",fontSize:12,padding:0,textDecoration:"underline"}},"Forgot password?")),
    h("button",{onClick:doLogin,style:{width:"100%",background:t.Y,border:"none",borderRadius:11,padding:"14px",fontSize:15,fontWeight:900,color:"#080808",cursor:"pointer",marginTop:14}},"Sign In \u2192"),
    h("div",{style:{display:"flex",alignItems:"center",gap:9,margin:"16px 0"}},h("div",{style:{flex:1,height:1,background:t.border2}}),h("span",{style:{color:t.text3,fontSize:11}},"NEW TO BEFITAFRICA?"),h("div",{style:{flex:1,height:1,background:t.border2}})),
    h("button",{onClick:()=>{setMode("register");setErr("");},style:{width:"100%",background:"none",border:`1.5px solid ${t.border2}`,borderRadius:11,padding:"13px",fontSize:13,fontWeight:700,color:t.text,cursor:"pointer"}},"Create your member account")
  ));
}

/* ---------- Registration (multi-step, with verification) ---------- */
function Registration({t,dm,onNeedVerify,onBackToLogin}){
  const vp=useViewport();
  const[step,setStep]=useState(0);const[agreed,setAgreed]=useState(false);const[err,setErr]=useState("");
  const[d,setD]=useState({name:"",gender:"",phone:"",email:"",password:"",occupation:"",occupationOther:"",country:"Nigeria",state:"",lga:"",address:"",hub:"",height:"",weight:"",bp_s:"",bp_d:"",hr:"",bloodSugar:"",waist:"",hip:"",stress:5,energy:5,happiness:5,goals:[]});
  const up=(k,v)=>setD(s=>({...s,[k]:v}));
  const toggle=(v)=>setD(s=>({...s,goals:s.goals.includes(v)?s.goals.filter(x=>x!==v):[...s.goals,v]}));
  const bmi=d.height&&d.weight?((parseFloat(d.weight)/(parseFloat(d.height)/100)**2)).toFixed(1):"\u2014";
  const lgaOpts=d.country==="Nigeria"&&d.state&&NIGERIA_STATES_LGAS[d.state]?NIGERIA_STATES_LGAS[d.state]:[];
  const stateOpts=d.country==="Nigeria"?Object.keys(NIGERIA_STATES_LGAS):[];
  const steps=["Account","Location & Work","Body Metrics","Goals & Wellness","Waiver"];
  const Slider=({label,val,set})=>h("div",{style:{marginBottom:16}},h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:6}},h("label",{style:{color:t.text2,fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase"}},label),h("span",{style:{color:t.Y,fontSize:16,fontWeight:900}},val+"/10")),h("input",{type:"range",min:1,max:10,value:val,onChange:e=>set(parseInt(e.target.value)),style:{width:"100%",accentColor:t.Y}}));
  const g2=vp.mobile?"1fr":"1fr 1fr";

  const validateStep=()=>{
    if(step===0){if(!d.name.trim())return "Full name is required";if(!d.email.trim()||!/^[^@]+@[^@]+\.[^@]+$/.test(d.email))return "A valid email is required";if(MEMBERS.find(m=>m.email.toLowerCase()===d.email.toLowerCase()))return "An account with this email already exists";if(d.password.length<6)return "Password must be at least 6 characters";}
    if(step===1){if(!d.occupation)return "Please select your occupation";if(d.occupation==="Other (specify)"&&!d.occupationOther.trim())return "Please specify your occupation";if(!d.country)return "Please select your country";if(d.country==="Nigeria"&&!d.state)return "Please select your state";if(d.country==="Nigeria"&&!d.lga)return "Please select your local government area";if(!d.address.trim())return "Please enter your address";if(!d.hub)return "Please select a BFA fitness hub";}
    return "";
  };
  const next=()=>{const e=validateStep();if(e){setErr(e);return;}setErr("");setStep(s=>s+1);};

  const submit=async()=>{
    if(!agreed){setErr("You must accept the participation agreement");return;}
    const occ=d.occupation==="Other (specify)"?d.occupationOther.trim():d.occupation;
    const member={email:d.email.trim(),password:d.password,name:d.name.trim(),role:"member",occupation:occ,country:d.country,state:d.state,lga:d.lga,address:d.address.trim(),hub:d.hub,avatar:initials(d.name),joined:new Date().toLocaleString("en-US",{month:"short",year:"numeric"}),status:"new",verified:false,streak:0,sessions:0,km:0,bmi:d.height&&d.weight?+bmi:0,bp:(d.bp_s&&d.bp_d)?d.bp_s+"/"+d.bp_d:"\u2014",hr:+d.hr||0,weight:+d.weight||0,height:+d.height||0,phone:d.phone,gender:d.gender,goals:d.goals,attendance:[]};
    if(typeof bfaRegister==="function"){
      /* Cloud backend (Supabase) — sends a real verification email */
      setErr("Creating your account\u2026");
      const r=await bfaRegister(member,d.password);
      if(r.error){setErr(r.error);return;}
      onNeedVerify(member.email,null);return;
    }
    /* Local fallback */
    member.id=nextMemberId();
    const token=makeToken();const p=loadPending();p[member.email]={token,member};savePending(p);
    onNeedVerify(member.email,token);
  };

  const content=[
    /* Step 0: Account */
    h("div",null,h("div",{style:{display:"grid",gridTemplateColumns:g2,gap:12}},h(Inp,{label:"Full Name",val:d.name,set:v=>up("name",v),ph:"Your full name",t,req:true}),h(Sel,{label:"Gender",val:d.gender,set:v=>up("gender",v),opts:["","Male","Female","Prefer not to say"],t})),h("div",{style:{display:"grid",gridTemplateColumns:g2,gap:12}},h(Inp,{label:"Email",type:"email",val:d.email,set:v=>up("email",v),ph:"your@email.com",t,req:true}),h(Inp,{label:"Phone",val:d.phone,set:v=>up("phone",v),ph:"+234...",t})),h(Inp,{label:"Create Password",type:"password",val:d.password,set:v=>up("password",v),ph:"At least 6 characters",t,req:true}),h("p",{style:{color:t.text2,fontSize:11,lineHeight:1.6,margin:"4px 0 0"}},"You'll verify this email before your account is activated.")),
    /* Step 1: Location & Work */
    h("div",null,h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 14px",lineHeight:1.6}},"Your occupation and location help us place you in the right ",h("strong",{style:{color:t.Yt}},"BefitAfrica fitness hub"),"."),h(Sel,{label:"Occupation",val:d.occupation,set:v=>up("occupation",v),opts:["",...OCCUPATIONS],t,req:true}),d.occupation==="Other (specify)"&&h(Inp,{label:"Specify your occupation",val:d.occupationOther,set:v=>up("occupationOther",v),ph:"e.g. Tour Guide",t,req:true}),h(SearchSelect,{label:"Country",val:d.country,set:v=>{up("country",v);up("state","");up("lga","");},opts:COUNTRIES,t,ph:"Select country",req:true}),d.country==="Nigeria"?h("div",{style:{display:"grid",gridTemplateColumns:g2,gap:12}},h(SearchSelect,{label:"State",val:d.state,set:v=>{up("state",v);up("lga","");},opts:stateOpts,t,ph:"Select state",req:true}),h(SearchSelect,{label:"Local Government Area",val:d.lga,set:v=>up("lga",v),opts:lgaOpts,t,ph:d.state?"Select LGA":"Select state first",req:true})):h("div",{style:{display:"grid",gridTemplateColumns:g2,gap:12}},h(Inp,{label:"State / Province",val:d.state,set:v=>up("state",v),ph:"Your state",t}),h(Inp,{label:"City / District",val:d.lga,set:v=>up("lga",v),ph:"Your city",t})),h(Inp,{label:"Address",val:d.address,set:v=>up("address",v),ph:"Street / area — used to assign your nearest hub",t,rows:2,req:true}),h(Sel,{label:"Preferred BFA Fitness Hub",val:d.hub,set:v=>up("hub",v),opts:["",...HUBS_LIST],t,req:true})),
    /* Step 2: Body metrics */
    h("div",null,h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 16px"}},"Baseline metrics \u2014 tracked over time to measure your progress (optional but recommended)."),h("div",{style:{display:"grid",gridTemplateColumns:g2,gap:12}},h(Inp,{label:"Height (cm)",type:"number",val:d.height,set:v=>up("height",v),ph:"175",t}),h(Inp,{label:"Weight (kg)",type:"number",val:d.weight,set:v=>up("weight",v),ph:"75",t}),h(Inp,{label:"BP Systolic",type:"number",val:d.bp_s,set:v=>up("bp_s",v),ph:"120",t}),h(Inp,{label:"BP Diastolic",type:"number",val:d.bp_d,set:v=>up("bp_d",v),ph:"80",t}),h(Inp,{label:"Resting HR (bpm)",type:"number",val:d.hr,set:v=>up("hr",v),ph:"72",t}),h(Inp,{label:"Blood Sugar (mg/dL)",type:"number",val:d.bloodSugar,set:v=>up("bloodSugar",v),ph:"95",t})),h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}30`,borderRadius:11,padding:"14px 16px",textAlign:"center",marginTop:4}},h("p",{style:{color:t.text2,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,margin:"0 0 4px"}},"BMI (Auto-calculated)"),h("p",{style:{color:t.Y,fontSize:26,fontWeight:900,margin:0}},bmi))),
    /* Step 3: Goals & wellness */
    h("div",null,h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 6px"}},"Select all fitness goals that apply."),h("p",{style:{color:t.Yt,fontSize:11,fontWeight:700,margin:"0 0 12px"}},d.goals.length+" of "+FITNESS_GOALS.length+" selected"),h("div",{style:{display:"flex",flexWrap:"wrap",gap:7,maxHeight:170,overflowY:"auto",marginBottom:18}},FITNESS_GOALS.map(g=>h("button",{key:g,onClick:()=>toggle(g),style:{background:d.goals.includes(g)?t.Y:t.surf2,border:`1.5px solid ${d.goals.includes(g)?t.Y:t.border2}`,borderRadius:20,padding:"7px 13px",fontSize:11,fontWeight:d.goals.includes(g)?800:500,color:d.goals.includes(g)?"#080808":t.text,cursor:"pointer"}},(d.goals.includes(g)?"\u2713 ":"")+g))),h(Slider,{label:"Stress Level",val:d.stress,set:v=>up("stress",v)}),h(Slider,{label:"Energy Level",val:d.energy,set:v=>up("energy",v)}),h(Slider,{label:"Happiness / Well-being",val:d.happiness,set:v=>up("happiness",v)})),
    /* Step 4: Waiver */
    h("div",null,h("div",{style:{background:t.surf2,border:`1px solid ${t.border2}`,borderRadius:12,padding:"18px 20px",height:230,overflowY:"auto",marginBottom:18,fontSize:12,color:t.text2,lineHeight:1.7}},h("h3",{style:{color:t.text,fontSize:15,fontWeight:900,margin:"0 0 14px"}},"BefitAfrica Participation Agreement & Liability Waiver"),[["1. Voluntary Participation.","Participation in all BefitAfrica activities is entirely voluntary."],["2. Medical Clearance.","I confirm I am in adequate health and have disclosed my history truthfully."],["3. Assumption of Risk.","I understand fitness activities involve inherent risks and I assume them voluntarily."],["4. Release of Liability.","I release BefitAfrica, its volunteers and partners from liability arising from my participation."],["5. Emergency Authorization.","I authorize BefitAfrica to seek emergency treatment on my behalf if incapacitated."],["6. Photo & Media Consent.","I grant BefitAfrica permission to use photos/recordings for promotional materials."],["7. Health Data.","I consent to BefitAfrica using my health data to track impact. It will never be sold."],["8. Code of Conduct.","I agree to conduct myself respectfully at all BefitAfrica events."],["9. Program Changes.","BefitAfrica may modify programs at any time."],["10. Governing Law.","Governed by the laws of the Federal Republic of Nigeria."]].map(([ti,b])=>h("p",{key:ti,style:{margin:"0 0 10px"}},h("strong",{style:{color:t.text}},ti)," "+b))),h("label",{style:{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",padding:"14px 16px",background:agreed?t.Yd:"none",border:`1.5px solid ${agreed?t.Y:t.border2}`,borderRadius:12}},h("div",{onClick:()=>setAgreed(!agreed),style:{width:20,height:20,borderRadius:5,border:`2px solid ${agreed?t.Y:t.border2}`,background:agreed?t.Y:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:1}},agreed&&h("span",{style:{color:"#080808",fontSize:12,fontWeight:900}},"\u2713")),h("span",{style:{color:t.text,fontSize:13,lineHeight:1.6}},"I have read and agree to the BefitAfrica Participation Agreement and Liability Waiver.")))
  ];

  return h("div",{style:{width:"100%",minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px"}},h("div",{className:"fd",style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:22,padding:vp.mobile?"24px 20px":"30px 34px",width:"100%",maxWidth:600,maxHeight:"94vh",display:"flex",flexDirection:"column"}},
    h("div",{style:{flexShrink:0}},h("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:16}},h(Logo,{size:36,t}),h("div",null,h("p",{style:{color:t.text,fontSize:14,fontWeight:900,margin:0}},"Join BefitAfrica"),h("p",{style:{color:t.text2,fontSize:10,margin:0}},"Create your member account"))),h("div",{style:{display:"flex",gap:4,marginBottom:14}},steps.map((_,i)=>h("div",{key:i,style:{flex:1,height:3,borderRadius:4,background:i<=step?t.Y:t.surf3,transition:"background 0.4s"}}))),h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},h("h2",{style:{color:t.text,fontSize:18,fontWeight:900,margin:0}},steps[step]),h("span",{style:{color:t.text3,fontSize:11}},(step+1)+"/"+steps.length))),
    h("div",{style:{flex:1,overflowY:"auto",paddingRight:4}},content[step],err&&h("p",{style:{color:t.err,fontSize:12,margin:"6px 0 0",fontWeight:600}},err)),
    h("div",{style:{flexShrink:0,display:"flex",gap:10,marginTop:14,borderTop:`1px solid ${t.border}`,paddingTop:14}},h("button",{onClick:()=>{if(step===0){onBackToLogin();}else{setErr("");setStep(s=>s-1);}},style:{flex:1,background:"none",border:`1px solid ${t.border2}`,borderRadius:10,padding:"12px",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer"}},step===0?"\u2190 Sign in":"\u2190 Back"),step<steps.length-1?h("button",{onClick:next,style:{flex:2,background:t.Y,border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:900,color:"#080808",cursor:"pointer"}},"Continue \u2192"):h("button",{onClick:submit,style:{flex:2,background:agreed?t.Y:t.surf3,border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:900,color:agreed?"#080808":t.text2,cursor:agreed?"pointer":"not-allowed"}},"Create Account \u2192"))
  ));
}

/* ============================================================
   GPS ACTIVITY TRACKER — real Leaflet/OSM map + geolocation
   Live current-location marker (animated gendered avatar),
   accurate jitter-filtered haversine distance + step tracking.
   ============================================================ */

/* Build an animated runner/walker DivIcon (SVG) coloured by gender + activity */
function makeAvatarIcon(gender,actType,moving){
  if(typeof L==="undefined")return null;
  const female=(gender==="Female");
  const skin="#C68642",hair=female?"#1c130b":"#150f08",top=female?"#FF4D8F":"#1E7FE0",shorts=female?"#2A2A33":"#15151B",shoe="#FFE000";
  const walking=(actType==="Walk"||actType==="Hike");
  const animClass=moving?(walking?"bfaWalk":"bfaRun"):"bfaIdle";
  const lean=moving&&!walking?"rotate(8 22 30)":"rotate(0 22 30)";
  /* Realistic human runner: head, neck, leaning torso, jointed arms (upper+fore) and legs (thigh+shin), shoes. */
  const svg=`<div class="bfaAvatar ${animClass}" style="width:54px;height:62px;">
    <svg viewBox="0 0 44 56" width="54" height="62">
      <ellipse class="bfaShadow" cx="22" cy="53" rx="12" ry="3" fill="rgba(0,0,0,0.28)"/>
      <g transform="${lean}">
        <!-- LEGS (behind torso) -->
        <g class="bfaLegBack">
          <g class="bfaThighB"><rect x="20" y="32" width="5.6" height="12" rx="2.8" fill="${shorts}"/>
            <g class="bfaShinB"><rect x="21" y="42" width="4.6" height="11" rx="2.3" fill="${skin}"/>
              <ellipse class="bfaShoeB" cx="24" cy="53" rx="4.6" ry="2.4" fill="${shoe}"/></g></g>
        </g>
        <!-- ARMS (behind) -->
        <g class="bfaArmBack">
          <g class="bfaUpArmB"><rect x="20" y="17" width="4.4" height="9" rx="2.2" fill="${top}"/>
            <g class="bfaForeB"><rect x="20.5" y="24" width="3.8" height="8.5" rx="1.9" fill="${skin}"/></g></g>
        </g>
        <!-- TORSO -->
        <g class="bfaTorso">
          <path d="M17 17 Q22 14 27 17 L26 33 Q22 35 18 33 Z" fill="${top}"/>
          <rect x="18.5" y="17" width="7" height="3.2" rx="1.6" fill="rgba(255,255,255,0.25)"/>
        </g>
        <!-- HEAD + neck -->
        <g class="bfaHead">
          <rect x="20.4" y="12" width="3.2" height="5" fill="${skin}"/>
          <circle cx="22" cy="9" r="5" fill="${skin}"/>
          <path d="M17.2 8.5 Q17 2.5 22 2.2 Q27 2.5 26.8 8.5 Q26 5 22 4.6 Q18 5 17.2 8.5 Z" fill="${hair}"/>
          ${female?`<path d="M17.2 8 Q16.4 13 18 16 L19.4 15 Q18.2 11.5 18.6 8 Z" fill="${hair}"/><path d="M26.8 8 Q27.6 13 26 16 L24.6 15 Q25.8 11.5 25.4 8 Z" fill="${hair}"/>`:""}
        </g>
        <!-- LEGS (front) -->
        <g class="bfaLegFront">
          <g class="bfaThighF"><rect x="18.4" y="32" width="5.6" height="12" rx="2.8" fill="${shorts}"/>
            <g class="bfaShinF"><rect x="19" y="42" width="4.6" height="11" rx="2.3" fill="${skin}"/>
              <ellipse class="bfaShoeF" cx="20" cy="53" rx="4.6" ry="2.4" fill="${shoe}"/></g></g>
        </g>
        <!-- ARMS (front) -->
        <g class="bfaArmFront">
          <g class="bfaUpArmF"><rect x="19.6" y="17" width="4.4" height="9" rx="2.2" fill="${top}"/>
            <g class="bfaForeF"><rect x="19.8" y="24" width="3.8" height="8.5" rx="1.9" fill="${skin}"/></g></g>
        </g>
      </g>
    </svg>
  </div>`;
  return L.divIcon({html:svg,className:"bfaAvatarWrap",iconSize:[54,62],iconAnchor:[27,55]});
}

function LeafletMap({points,live,follow,height,gender,actType,moving,centerOn,geofence}){
  const elRef=useRef(null);const mapRef=useRef(null);const lineRef=useRef(null);const avatarRef=useRef(null);const accRef=useRef(null);const startRef=useRef(null);const fenceRef=useRef(null);const fenceCenterRef=useRef(null);
  /* init map once */
  useEffect(()=>{
    if(typeof L==="undefined"||!elRef.current)return;
    const c=centerOn||(points.length?points[points.length-1]:{lat:6.5847,lng:3.3897}); // default Alapere
    const map=L.map(elRef.current,{zoomControl:true,attributionControl:true,preferCanvas:false}).setView([c.lat,c.lng],16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"\u00a9 OpenStreetMap"}).addTo(map);
    mapRef.current=map;
    /* invalidateSize repeatedly to handle containers that size in after mount */
    const t1=setTimeout(()=>map.invalidateSize(),120);
    const t2=setTimeout(()=>map.invalidateSize(),400);
    const t3=setTimeout(()=>map.invalidateSize(),900);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);map.remove();mapRef.current=null;};
  },[]);
  /* geofence circle (for clock-in map) */
  useEffect(()=>{
    const map=mapRef.current;if(!map||typeof L==="undefined")return;
    if(geofence&&geofence.lat){
      if(fenceRef.current){fenceRef.current.setLatLng([geofence.lat,geofence.lng]).setRadius(geofence.radius);}
      else fenceRef.current=L.circle([geofence.lat,geofence.lng],{radius:geofence.radius,color:"#00CC66",weight:2,fillColor:"#00CC66",fillOpacity:0.12}).addTo(map);
      if(fenceCenterRef.current)fenceCenterRef.current.setLatLng([geofence.lat,geofence.lng]);
      else fenceCenterRef.current=L.marker([geofence.lat,geofence.lng],{icon:L.divIcon({html:'<div style="background:#00CC66;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #00CC66"></div>',className:"",iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map).bindPopup(geofence.label||"Hub");
    }
  },[geofence&&geofence.lat,geofence&&geofence.lng,geofence&&geofence.radius]);
  /* recenter on demand */
  useEffect(()=>{const map=mapRef.current;if(map&&centerOn&&centerOn.lat){map.setView([centerOn.lat,centerOn.lng],map.getZoom()||16,{animate:true});}},[centerOn&&centerOn.lat,centerOn&&centerOn.lng]);
  /* update route + avatar marker when points change */
  useEffect(()=>{
    const map=mapRef.current;if(!map||typeof L==="undefined")return;
    const latlngs=points.map(p=>[p.lat,p.lng]);
    if(latlngs.length){
      if(live){
        if(lineRef.current)lineRef.current.setLatLngs(latlngs);
        else lineRef.current=L.polyline(latlngs,{color:"#FFE000",weight:6,opacity:0.95,lineJoin:"round",lineCap:"round"}).addTo(map);
        if(!startRef.current)startRef.current=L.circleMarker(latlngs[0],{radius:7,color:"#fff",weight:2,fillColor:"#00CC66",fillOpacity:1}).addTo(map).bindPopup("Start");
      }
      const last=latlngs[latlngs.length-1];
      const lastPt=points[points.length-1];
      /* current-location avatar marker */
      const icon=makeAvatarIcon(gender,actType,moving);
      if(avatarRef.current){avatarRef.current.setLatLng(last);if(icon)avatarRef.current.setIcon(icon);}
      else if(icon)avatarRef.current=L.marker(last,{icon,interactive:false,zIndexOffset:1000}).addTo(map);
      /* accuracy circle */
      const acc=lastPt.acc;
      if(acc){if(accRef.current)accRef.current.setLatLng(last).setRadius(acc);else accRef.current=L.circle(last,{radius:acc,color:"#FFE000",weight:1,fillColor:"#FFE000",fillOpacity:0.08}).addTo(map);}
      if(follow)map.setView(last,map.getZoom(),{animate:true});
    }
  },[points,follow,moving,gender,actType,live]);
  return h("div",{ref:elRef,style:{width:"100%",height:height||"100%",borderRadius:14,overflow:"hidden",zIndex:1,background:"#0c1b2c"}});
}

function ActivityTracker({t,user,showNotif}){
  const vp=useViewport();
  const[actType,setAT]=useState("Run");
  const[recording,setRec]=useState(false);const[paused,setPaused]=useState(false);
  const[elapsed,setEL]=useState(0);const[distance,setDist]=useState(0);
  const[points,setPoints]=useState([]);
  const[steps,setSteps]=useState(0);
  const[gps,setGps]=useState({label:"GPS idle",ok:false,err:false,acc:null});
  const[bpm,setBpm]=useState(user.hr||72);
  const[supported,setSupported]=useState(true);
  const[acquiring,setAcquiring]=useState(false);
  const[idleLoc,setIdleLoc]=useState(null); // show user location on idle map
  const[moving,setMoving]=useState(false);
  const watchId=useRef(null);const tmr=useRef(null);const lastPt=useRef(null);const distRef=useRef(0);const stepRef=useRef(0);const pausedRef=useRef(false);const lastMoveT=useRef(0);
  const types=["Run","Walk","Jog","Treadmill","Cycling","Hike","HIIT","Swim"];
  const stride={"Run":0.95,"Walk":0.72,"Jog":0.85,"Treadmill":0.78,"Cycling":0,"Hike":0.70,"HIIT":0.65,"Swim":0};

  useEffect(()=>{if(!("geolocation" in navigator))setSupported(false);},[]);
  useEffect(()=>{pausedRef.current=paused;},[paused]);
  /* show the user's location on the idle map */
  useEffect(()=>{if(!("geolocation" in navigator))return;navigator.geolocation.getCurrentPosition(p=>{setIdleLoc({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy});},()=>{},{enableHighAccuracy:true,timeout:10000,maximumAge:30000});},[]);
  useEffect(()=>{if(recording&&!paused){tmr.current=setInterval(()=>{setEL(e=>e+1);setBpm(b=>Math.max(60,Math.min(185,b+(Math.random()>0.5?1:-1)+(actType==="HIIT"?2:0))));/* stop the running animation if no movement for 3s */ if(Date.now()-lastMoveT.current>3000)setMoving(false);},1000);}else clearInterval(tmr.current);return()=>clearInterval(tmr.current);},[recording,paused,actType]);

  const onPos=useCallback((pos)=>{
    const {latitude,longitude,accuracy,speed}=pos.coords;
    setGps({label:accuracy<=12?"GPS Strong":accuracy<=25?"GPS Good":accuracy<=45?"GPS Fair":"GPS Weak",ok:true,err:false,acc:accuracy});
    setAcquiring(false);
    if(pausedRef.current)return;
    const tNow=Date.now();
    /* drop unusable fixes entirely (don't even seed) above 45m, but keep one for map centering */
    if(accuracy>45){setPoints(p=>p.length?p:[{lat:latitude,lng:longitude,acc:accuracy,t:tNow}]);return;}
    const pt={lat:latitude,lng:longitude,acc:accuracy,t:tNow};
    if(lastPt.current){
      const dKm=haversineKm(lastPt.current,pt);const dM=dKm*1000;
      const dt=(tNow-lastPt.current.t)/1000; // seconds between fixes
      /* movement must clear the noise floor: bigger of (a fixed 4m) and (combined accuracy of the two points) */
      const noiseFloor=Math.max(4, (accuracy+(lastPt.current.acc||accuracy))*0.5);
      /* speed sanity: m/s implied by this move; cap by activity (sprinter ~10m/s, cyclist ~17m/s) */
      const maxSpeed=actType==="Cycling"?18:actType==="Run"||actType==="Jog"?9:actType==="Hike"?4:6;
      const impliedSpeed=dt>0?dM/dt:0;
      const accept = dM>noiseFloor && dM<300 && (dt<=0||impliedSpeed<=maxSpeed*1.6);
      if(accept){
        distRef.current+=dKm;setDist(+distRef.current.toFixed(4));
        if(stride[actType]>0){stepRef.current+=Math.max(1,Math.round(dM/stride[actType]));setSteps(stepRef.current);}
        setMoving(true);lastMoveT.current=tNow;
        lastPt.current=pt;                 // advance reference only on an accepted move
        setPoints(p=>[...p.slice(-1500),pt]);
      } else {
        /* rejected as noise: keep the more accurate of the two as the reference, don't add distance */
        if(accuracy < (lastPt.current.acc||accuracy)) lastPt.current=pt;
      }
    } else {
      lastPt.current=pt;
      setPoints(p=>[...p.slice(-1500),pt]);
    }
  },[actType]);
  const onErr=useCallback((e)=>{const msg=e.code===1?"Location permission denied":e.code===2?"Position unavailable":"GPS timeout";setGps({label:msg,ok:false,err:true,acc:null});setAcquiring(false);},[]);

  const beginWatch=()=>{watchId.current=navigator.geolocation.watchPosition(onPos,onErr,{enableHighAccuracy:true,maximumAge:0,timeout:20000});};
  const start=()=>{
    if(!supported){showNotif("This device/browser doesn't support GPS","err");return;}
    setEL(0);setDist(0);setPoints([]);setSteps(0);setMoving(false);
    distRef.current=0;stepRef.current=0;lastPt.current=null;
    setAcquiring(true);setGps({label:"Acquiring GPS...",ok:false,err:false,acc:null});
    /* get an immediate fix so the recording map is centered, THEN start watching */
    navigator.geolocation.getCurrentPosition(
      (pos)=>{const pt={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:pos.coords.accuracy,t:Date.now()};lastPt.current=pt;setPoints([pt]);setGps({label:"GPS locked",ok:true,err:false,acc:pos.coords.accuracy});setRec(true);setPaused(false);beginWatch();},
      (err)=>{/* still enter recording; watch may succeed shortly */ setRec(true);setPaused(false);beginWatch();onErr(err);},
      {enableHighAccuracy:true,timeout:12000,maximumAge:0}
    );
  };
  const finish=()=>{
    if(watchId.current!=null){navigator.geolocation.clearWatch(watchId.current);watchId.current=null;}
    setRec(false);setPaused(false);setMoving(false);
    if(distRef.current>0.02){
      const idx=MEMBERS.findIndex(m=>m.id===user.id);
      if(idx>-1){
        MEMBERS[idx].km=+((MEMBERS[idx].km||0)+distRef.current).toFixed(2);
        MEMBERS[idx].sessions=(MEMBERS[idx].sessions||0)+1;
        if(!MEMBERS[idx].hr)MEMBERS[idx].hr=Math.round(bpm);
        const mk=MEMBERS[idx].monthlyKm&&MEMBERS[idx].monthlyKm.length===12?MEMBERS[idx].monthlyKm.slice():new Array(12).fill(0);
        mk[new Date().getMonth()]=+(mk[new Date().getMonth()]+distRef.current).toFixed(2);MEMBERS[idx].monthlyKm=mk;
        /* persist the activity record */
        const rec={type:actType,km:+distRef.current.toFixed(2),steps:stepRef.current,durationSec:elapsed,date:new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}),ts:Date.now(),avgBpm:Math.round(bpm),route:points.map(p=>({lat:p.lat,lng:p.lng}))};
        MEMBERS[idx].activities=[...(MEMBERS[idx].activities||[]),rec];
        addActivity(user.id,rec);
        persist();
      }
      showNotif(actType+" saved \u00b7 "+distRef.current.toFixed(2)+"km in "+fmt(elapsed));
    } else showNotif("Activity too short to save","err");
    setEL(0);setDist(0);setPoints([]);setSteps(0);setBpm(user.hr||72);
  };
  useEffect(()=>()=>{if(watchId.current!=null)navigator.geolocation.clearWatch(watchId.current);},[]);

  const fmt=(s)=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pace=elapsed>0&&distance>0.01?(()=>{const sp=elapsed/distance;return String(Math.floor(sp/60)).padStart(2,"0")+":"+String(Math.round(sp%60)).padStart(2,"0");})():"--:--";
  const cals=Math.round(distance*65*(actType==="HIIT"?1.5:actType==="Cycling"?0.8:1));
  const bpmColor=bpm<100?t.ok:bpm<140?t.warn:t.err;

  const statusChip=h("div",{style:{position:"absolute",top:10,left:0,right:0,display:"flex",justifyContent:"center",zIndex:500,pointerEvents:"none"}},h("div",{style:{background:gps.ok?"rgba(0,140,70,0.92)":gps.err?"rgba(180,40,40,0.92)":"rgba(40,80,160,0.92)",borderRadius:20,padding:"6px 16px",display:"flex",alignItems:"center",gap:7}},h(Icon,{name:gps.ok?"signal":gps.err?"warn":"pin",size:13,color:"#fff"}),h("span",{style:{color:"#fff",fontSize:12,fontWeight:700}},gps.label),gps.acc&&h("span",{style:{color:"rgba(255,255,255,0.8)",fontSize:11}},"\u00b1"+Math.round(gps.acc)+"m")));

  if(recording)return h("div",{className:"fd",style:{maxWidth:540,margin:"0 auto"}},h("div",{style:{background:"#0a0a0a",borderRadius:18,overflow:"hidden",border:`1px solid ${t.border}`}},
    h("div",{style:{height:vp.mobile?320:380,position:"relative"}},h(LeafletMap,{points,live:true,follow:true,height:"100%",gender:user.gender,actType,moving}),statusChip,h("div",{style:{position:"absolute",bottom:10,left:12,zIndex:500,background:"rgba(0,0,0,0.6)",borderRadius:8,padding:"5px 11px",display:"flex",alignItems:"center",gap:6}},h("div",{style:{width:8,height:8,borderRadius:"50%",background:"#FF4D4D",animation:"pulse 1.2s infinite"}}),h("span",{style:{color:"#FFE000",fontSize:11,fontWeight:800}},"LIVE \u00b7 "+actType))),
    h("div",{style:{background:"#0a0a0a",padding:vp.mobile?"18px":"22px 24px"}},
      h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:18}},[["Time",fmt(elapsed)],["Distance",distance.toFixed(2),"km"],["Pace",pace,"/km"]].map(([l,v,u])=>h("div",{key:l,style:{textAlign:"center"}},h("p",{style:{color:"#fff",fontSize:vp.mobile?22:28,fontWeight:900,margin:"0 0 2px",letterSpacing:-1,fontVariantNumeric:"tabular-nums"}},v),h("p",{style:{color:"rgba(255,255,255,0.4)",fontSize:10,margin:0,textTransform:"uppercase",letterSpacing:1}},l+(u?" ("+u+")":""))))),
      h("div",{style:{display:"flex",justifyContent:"space-around",borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:14,marginBottom:18}},[["heart",Math.round(bpm),"bpm",bpmColor],["fire",cals,"kcal","#FF6B00"],["steps",steps,"steps","#4DA6FF"]].map(([ico,v,l,c])=>h("div",{key:l,style:{textAlign:"center"}},h("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:2}},h(Icon,{name:ico,size:15,color:c}),h("span",{style:{color:c,fontSize:16,fontWeight:900}},v)),h("p",{style:{color:"rgba(255,255,255,0.35)",fontSize:9,margin:0,textTransform:"uppercase"}},l)))),
      gps.err&&h("div",{style:{background:"rgba(180,40,40,0.18)",border:"1px solid rgba(255,80,80,0.4)",borderRadius:10,padding:"10px 14px",marginBottom:14}},h("p",{style:{color:"#FF8888",fontSize:12,margin:0,lineHeight:1.5}},gps.label+". Enable location access and ensure you're on HTTPS for accurate tracking.")),
      h("div",{style:{display:"flex",gap:14,alignItems:"center",justifyContent:"center"}},h("button",{onClick:()=>setPaused(p=>!p),style:{background:paused?"#FFE000":"rgba(255,255,255,0.12)",border:"none",borderRadius:50,width:60,height:60,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},h(Icon,{name:paused?"play":"pause",size:24,color:paused?"#080808":"#fff"})),h("button",{onClick:finish,style:{background:"#FF4D4D",border:"none",borderRadius:50,width:72,height:72,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},h(Icon,{name:"stop",size:28,color:"#fff"}))),
      h("p",{style:{color:"rgba(255,255,255,0.3)",fontSize:10,textAlign:"center",marginTop:12}},paused?"Paused \u2014 tap play to resume":"Tracking your real location \u00b7 tap stop to finish & save"))));

  return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:18}},
    h(Card,{t,p:"0",style:{overflow:"hidden"}},h("div",{style:{padding:vp.mobile?"18px":"20px 24px 16px"}},h("h3",{style:{color:t.text,fontSize:15,fontWeight:900,margin:"0 0 14px"}},"Start an Activity"),h("div",{style:{display:"flex",gap:7,flexWrap:"wrap"}},types.map(tp=>h("button",{key:tp,onClick:()=>setAT(tp),style:{display:"flex",alignItems:"center",gap:6,background:actType===tp?t.Y:t.surf3,border:"none",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:actType===tp?800:500,color:actType===tp?"#080808":t.text2,cursor:"pointer"}},h(Icon,{name:ACT_ICON[tp],size:14,color:actType===tp?"#080808":t.text2}),tp)))),
      h("div",{style:{height:vp.mobile?240:280,position:"relative"}},h(LeafletMap,{points:idleLoc?[idleLoc]:[],live:false,follow:false,height:"100%",gender:user.gender,actType,moving:false,centerOn:idleLoc}),statusChip,idleLoc&&h("div",{style:{position:"absolute",bottom:10,left:12,zIndex:500,background:"rgba(0,0,0,0.6)",borderRadius:8,padding:"5px 11px",display:"flex",alignItems:"center",gap:6}},h(Icon,{name:"pin",size:13,color:"#FFE000"}),h("span",{style:{color:"#fff",fontSize:11,fontWeight:700}},"Your location"))),
      h("div",{style:{padding:vp.mobile?"18px":"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}},h("div",null,h("p",{style:{color:t.text,fontSize:14,fontWeight:800,margin:"0 0 2px"}},actType),h("p",{style:{color:t.text2,fontSize:12,margin:0}},"Real-map GPS \u00b7 live distance, pace, heart rate, steps")),h("button",{onClick:start,disabled:acquiring,style:{background:t.Y,border:"none",borderRadius:50,minWidth:64,height:64,padding:"0 22px",cursor:acquiring?"wait":"pointer",boxShadow:`0 4px 20px ${t.Y}40`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}},acquiring?h("span",{style:{color:"#080808",fontSize:13,fontWeight:800}},"Locating\u2026"):h(Icon,{name:"play",size:26,color:"#080808"})))),
    !supported&&h(Card,{t},h("p",{style:{color:t.warn,fontSize:13,margin:0,lineHeight:1.6}},"Your browser doesn't expose the Geolocation API. GPS tracking needs a modern browser on an HTTPS connection (which your Vercel deployment provides).")),
    h(Card,{t,p:"18px"},h("h4",{style:{color:t.text,fontSize:13,fontWeight:800,margin:"0 0 12px"}},"Your Activity Stats"),[["Total Distance",(user.km||0)+"km"],["Sessions",user.sessions||0],["Best Streak",(user.streak||0)+"d"],["Resting HR",user.hr?user.hr+" bpm":"\u2014"]].map(([l,v])=>h("div",{key:l,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${t.border}`}},h("span",{style:{color:t.text2,fontSize:12}},l),h("span",{style:{color:t.Y,fontSize:13,fontWeight:800}},v)))),
    (getActivities(user.id).length>0)&&h(Card,{t,p:"18px"},h("h4",{style:{color:t.text,fontSize:13,fontWeight:800,margin:"0 0 12px"}},"Recent Activities"),getActivities(user.id).slice(-6).reverse().map((a,i)=>h("div",{key:i,style:{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${t.border}`}},h("div",{style:{width:34,height:34,borderRadius:9,background:t.Yd,display:"flex",alignItems:"center",justifyContent:"center"}},h(Icon,{name:ACT_ICON[a.type]||"run",size:17,color:t.Yt})),h("div",{style:{flex:1}},h("p",{style:{color:t.text,fontSize:13,fontWeight:700,margin:0}},a.type+" \u00b7 "+a.km+"km"),h("p",{style:{color:t.text2,fontSize:10,margin:0}},a.date+" \u00b7 "+Math.floor(a.durationSec/60)+" min \u00b7 "+a.steps+" steps")),h("span",{style:{color:t.Yt,fontSize:12,fontWeight:800}},a.km+"km"))))
  );
}

/* ============================================================
   ATTENDANCE — clock in / clock out at fitness programs
   ============================================================ */
const ATT_KEY="bfa_attendance_v1";
function loadAtt(){return _safeParse(localStorage.getItem(ATT_KEY),{open:{},log:[]});}
function saveAtt(a){try{localStorage.setItem(ATT_KEY,JSON.stringify(a));}catch(e){}}

function AttendanceView({t,user,showNotif}){
  const vp=useViewport();
  const[att,setAtt]=useState(loadAtt());
  const[program,setProgram]=useState("Morning Walk/Run");
  const[hub,setHub]=useState(user.hub||HUBS_LIST[0]);
  const[now,setNow]=useState(Date.now());
  const[loc,setLoc]=useState(null);       // member's live location
  const[locErr,setLocErr]=useState(null);
  const watchRef=useRef(null);
  useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i);},[]);
  /* live-track the member's location while on this screen for accurate geofencing */
  useEffect(()=>{
    if(!("geolocation" in navigator)){setLocErr("Geolocation not supported on this device");return;}
    watchRef.current=navigator.geolocation.watchPosition(
      p=>{setLoc({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy});setLocErr(null);},
      e=>{setLocErr(e.code===1?"Location permission denied \u2014 enable it to clock in":"Unable to get your location");},
      {enableHighAccuracy:true,maximumAge:2000,timeout:15000}
    );
    return()=>{if(watchRef.current!=null)navigator.geolocation.clearWatch(watchRef.current);};
  },[]);
  const PROGRAMS=["Morning Walk/Run","Saturday Mega Walk","HIIT Bootcamp","Aerobics Class","Strength Circuit","Yoga & Mobility","Community 5K","Hub Training Session"];
  const openKey=user.id;
  const open=att.open[openKey];
  const fmtClock=(ms)=>{const sec=Math.floor(ms/1000);return String(Math.floor(sec/3600)).padStart(2,"0")+":"+String(Math.floor((sec%3600)/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");};

  /* geofence: distance from selected hub */
  const hubC=HUB_COORDS[hub];
  const distKm=(loc&&hubC)?haversineKm(loc,hubC):null;
  const inRange=distKm!=null&&distKm<=GEOFENCE_KM;
  const distM=distKm!=null?Math.round(distKm*1000):null;

  const clockIn=()=>{
    if(!loc){showNotif("Waiting for your location\u2026","err");return;}
    if(!inRange){showNotif("You're "+distM+"m away \u2014 must be within "+(GEOFENCE_KM*1000)+"m of "+hub+" hub","err");return;}
    const a={...att,open:{...att.open,[openKey]:{program,hub,inAt:Date.now(),name:user.name}}};setAtt(a);saveAtt(a);showNotif("Clocked in to "+program+" at "+hub+" hub");
  };
  const clockOut=()=>{
    if(!open)return;
    const outHubC=HUB_COORDS[open.hub];
    const outDist=(loc&&outHubC)?haversineKm(loc,outHubC):null;
    if(outDist==null){showNotif("Waiting for your location\u2026","err");return;}
    if(outDist>GEOFENCE_KM){showNotif("You're "+Math.round(outDist*1000)+"m away \u2014 return to "+open.hub+" hub to clock out","err");return;}
    const dur=Date.now()-open.inAt;
    const rec={id:Date.now(),memberId:user.id,name:user.name,avatar:user.avatar,hub:open.hub,program:open.program,inAt:open.inAt,outAt:Date.now(),durationMs:dur,date:new Date(open.inAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})};
    const no={...att.open};delete no[openKey];
    const a={open:no,log:[rec,...att.log]};setAtt(a);saveAtt(a);
    const idx=MEMBERS.findIndex(m=>m.id===user.id);if(idx>-1){MEMBERS[idx].attendance=[...(MEMBERS[idx].attendance||[]),rec];persist();}
    showNotif("Clocked out \u2014 "+(dur/60000).toFixed(0)+" min logged");
  };

  const counts={};att.log.forEach(r=>{counts[r.memberId]=counts[r.memberId]||{name:r.name,avatar:r.avatar,hub:r.hub,count:0,mins:0};counts[r.memberId].count++;counts[r.memberId].mins+=Math.round(r.durationMs/60000);});
  const board=Object.values(counts).sort((a,b)=>b.count-a.count||b.mins-a.mins);
  const myCount=counts[user.id]?counts[user.id].count:0;
  const myMins=counts[user.id]?counts[user.id].mins:0;

  /* status banner about geofence */
  const fenceBanner=h("div",{style:{background:locErr?`${t.err}15`:inRange?`${t.ok}15`:t.Yd,border:`1px solid ${locErr?t.err:inRange?t.ok:t.Y}40`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}},h(Icon,{name:locErr?"warn":inRange?"check":"pin",size:18,color:locErr?t.err:inRange?t.ok:t.Yt}),h("div",{style:{flex:1}},h("p",{style:{color:t.text,fontSize:12,fontWeight:700,margin:0}},locErr?locErr:!loc?"Getting your location\u2026":inRange?("You're at "+(hub)+" hub \u2014 within range ("+distM+"m)"):("You're "+distM+"m from "+hub+" hub")),!locErr&&loc&&h("p",{style:{color:t.text2,fontSize:11,margin:"2px 0 0"}},inRange?"You can clock in/out here":"Move within "+(GEOFENCE_KM*1000)+"m of the hub to clock in/out")));

  return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:16}},
    h(Card,{t,style:{background:`linear-gradient(135deg,${t.Yd},${t.surf})`,border:`1px solid ${t.Y}30`}},h("div",{style:{display:"flex",alignItems:"center",gap:12}},h(Icon,{name:"clock",size:24,color:t.Yt}),h("div",null,h("h2",{style:{color:t.text,fontSize:17,fontWeight:900,margin:0}},"Attendance Clock"),h("p",{style:{color:t.text2,fontSize:12,margin:0}},"Clock in/out at your hub \u2014 location-verified within "+(GEOFENCE_KM*1000)+"m")))),
    /* hub map with geofence */
    h(Card,{t,p:"0",style:{overflow:"hidden"}},h("div",{style:{height:vp.mobile?240:280,position:"relative"}},h(LeafletMap,{points:loc?[loc]:[],live:false,follow:false,height:"100%",gender:user.gender,actType:"Walk",moving:false,centerOn:loc||hubC,geofence:hubC?{lat:hubC.lat,lng:hubC.lng,radius:GEOFENCE_KM*1000,label:hub+" Hub"}:null}),h("div",{style:{position:"absolute",top:10,left:0,right:0,display:"flex",justifyContent:"center",zIndex:500,pointerEvents:"none"}},h("div",{style:{background:"rgba(0,0,0,0.65)",borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:7}},h(Icon,{name:"building",size:13,color:"#FFE000"}),h("span",{style:{color:"#fff",fontSize:12,fontWeight:700}},hub+" Hub \u00b7 "+(GEOFENCE_KM*1000)+"m zone"))))),
    fenceBanner,
    open?h(Card,{t,style:{border:`1.5px solid ${t.Y}`}},h("div",{style:{textAlign:"center"}},h("div",{style:{display:"inline-flex",alignItems:"center",gap:8,background:t.Yd,borderRadius:20,padding:"5px 14px",marginBottom:12}},h("div",{style:{width:9,height:9,borderRadius:"50%",background:t.ok,animation:"pulse 1.2s infinite"}}),h("span",{style:{color:t.Yt,fontSize:11,fontWeight:800}},"CLOCKED IN")),h("p",{style:{color:t.text,fontSize:15,fontWeight:800,margin:"0 0 2px"}},open.program),h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 14px"}},open.hub+" Hub \u00b7 since "+new Date(open.inAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})),h("p",{style:{color:t.Y,fontSize:38,fontWeight:900,margin:"0 0 16px",letterSpacing:-1,fontVariantNumeric:"tabular-nums"}},fmtClock(now-open.inAt)),h("button",{onClick:clockOut,style:{background:t.err,border:"none",borderRadius:12,padding:"14px 40px",fontSize:15,fontWeight:900,color:"#fff",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}},h(Icon,{name:"stop",size:18,color:"#fff"}),"Clock Out"))):h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 14px"}},"Clock in to a program"),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"1fr 1fr",gap:12}},h(Sel,{label:"Program",val:program,set:setProgram,opts:PROGRAMS,t}),h(Sel,{label:"Hub",val:hub,set:setHub,opts:HUBS_LIST,t})),h("button",{onClick:clockIn,disabled:!inRange,style:{width:"100%",background:inRange?t.Y:t.surf3,border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:900,color:inRange?"#080808":t.text2,cursor:inRange?"pointer":"not-allowed",marginTop:6,display:"flex",alignItems:"center",justifyContent:"center",gap:8}},h(Icon,{name:"clock",size:18,color:inRange?"#080808":t.text2}),inRange?"Clock In":"Move closer to clock in")),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"repeat(3,1fr)",gap:12}},h(StatBox,{t,val:myCount,label:"My Attendances",accent:true}),h(StatBox,{t,val:myMins+"m",label:"My Active Minutes"}),h(StatBox,{t,val:att.log.length,label:"Total Check-ins"})),
    h(Card,{t},h("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14}},h(Icon,{name:"trophy",size:18,color:t.Yt}),h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:0}},"Most Active Members"),h("span",{style:{color:t.text2,fontSize:11,marginLeft:"auto"}},"by attendance")),board.length?board.slice(0,10).map((m,i)=>h("div",{key:m.name+i,style:{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:i<3?t.Yd:t.surf2,borderRadius:11,marginBottom:8}},i<3?h(Icon,{name:i===0?"crown":"trophy",size:18,color:i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32"}):h("span",{style:{fontSize:13,fontWeight:900,width:26,textAlign:"center",color:t.text2}},"#"+(i+1)),h(Av,{init:m.avatar,size:34,t}),h("div",{style:{flex:1}},h("p",{style:{color:t.text,fontSize:13,fontWeight:700,margin:0}},m.name),h("p",{style:{color:t.text2,fontSize:10,margin:0}},m.hub+" Hub \u00b7 "+m.mins+" mins")),h("span",{style:{color:t.Yt,fontSize:14,fontWeight:900}},m.count+"\u00d7"))):h("p",{style:{color:t.text2,fontSize:13,textAlign:"center",padding:"20px 0"}},"No attendance recorded yet. Be the first to clock in!")),
    att.log.length>0&&h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 12px"}},"Recent Check-ins"),att.log.slice(0,8).map(r=>h("div",{key:r.id,style:{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${t.border}`}},h(Av,{init:r.avatar,size:30,t}),h("div",{style:{flex:1}},h("p",{style:{color:t.text,fontSize:12,fontWeight:700,margin:0}},r.name+" \u00b7 "+r.program),h("p",{style:{color:t.text2,fontSize:10,margin:0}},r.hub+" Hub \u00b7 "+r.date)),h("span",{style:{color:t.ok,fontSize:11,fontWeight:700}},Math.round(r.durationMs/60000)+" min"))))
  );
}

/* ---------- Dashboard ---------- */
function DashMain({t,user,isAdmin,setNav}){
  const vp=useViewport();
  const monthly=(user.monthlyKm&&user.monthlyKm.length===12)?user.monthlyKm:new Array(12).fill(0);const maxA=Math.max(...monthly,1);const hasData=user.sessions>0;const[bpm,setBpm]=useState(user.hr||0);
  useEffect(()=>{if(!hasData)return;const i=setInterval(()=>setBpm(b=>Math.max(55,Math.min(95,(b||72)+(Math.random()>0.5?1:-1)))),1800);return()=>clearInterval(i);},[hasData]);
  const nowMonth=new Date().getMonth();
  return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:18}},
    h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}40`,borderRadius:16,padding:vp.mobile?"16px":"18px 22px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}},h(Av,{init:user.avatar,size:46,t}),h("div",{style:{flex:1,minWidth:160}},h("h2",{style:{color:t.text,fontSize:vp.mobile?16:18,fontWeight:900,margin:"0 0 4px"}},"Welcome"+(hasData?" back":"")+", "+user.name.split(" ")[0]+""),h("p",{style:{color:t.text2,fontSize:12,margin:0}},user.hub+" Hub \u00b7 "+statusLbl(user.status||user.role)+(user.streak?" \u00b7"+user.streak+" day streak":""))),h("button",{onClick:()=>setNav("activity"),style:{background:t.Y,border:"none",borderRadius:11,padding:"11px 18px",fontSize:13,fontWeight:900,color:"#080808",cursor:"pointer"}},"\u25b6 Start Activity")),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"repeat(4,1fr)",gap:12}},h("div",{style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:13,padding:"16px 18px",display:"flex",alignItems:"center",gap:12}},h("div",{className:hasData?"hb":"",style:{opacity:hasData?1:0.4,display:"flex"}},h(Icon,{name:"heart",size:24,color:t.err})),h("div",null,h("p",{style:{color:hasData?t.err:t.text2,fontSize:20,fontWeight:900,margin:"0 0 2px"}},hasData?Math.round(bpm)+" bpm":"\u2014"),h("p",{style:{color:t.text2,fontSize:10,margin:0}},"Heart Rate"))),h(StatBox,{t,val:user.km+"km",label:"Total Distance"}),h(StatBox,{t,val:user.sessions,label:"Sessions",accent:true}),h(StatBox,{t,val:user.bmi||"\u2014",label:"BMI"})),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"3fr 2fr",gap:16}},h(Card,{t},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:0}},"My Distance"),h("span",{style:{color:t.text2,fontSize:11}},"This year (km/month)")),hasData?h("div",{style:{display:"flex",alignItems:"flex-end",gap:5,height:90}},monthly.map((v,i)=>h("div",{key:i,style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,height:"100%"}},h("div",{style:{flex:1,width:"100%",display:"flex",alignItems:"flex-end"}},h("div",{style:{width:"100%",height:Math.round((v/maxA)*100)+"%",background:i===nowMonth?t.Y:t.surf3,borderRadius:"3px 3px 0 0",minHeight:4}})),h("span",{style:{color:t.text3,fontSize:8}},["J","F","M","A","M","J","J","A","S","O","N","D"][i])))):h("div",{style:{height:90,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}},h(Icon,{name:"run",size:26,color:t.text3}),h("p",{style:{color:t.text2,fontSize:12,margin:0,textAlign:"center"}},"Start your first activity to see your progress here"))),h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 14px"}},"Quick Actions"),[["run","Start Activity","activity"],["clock","Clock In/Out","attendance"],["heart","Health Check","health"],["chat","Community","community"]].map(([ico,l,nv])=>h("button",{key:l,onClick:()=>setNav(nv),style:{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:t.surf2,border:"none",borderRadius:10,padding:"11px 14px",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer",marginBottom:8}},h("span",{style:{display:"flex",alignItems:"center",gap:10}},h(Icon,{name:ico,size:16,color:t.Yt}),l),h("span",{style:{color:t.text3}},">")))))
  );
}

/* ---------- Health Dashboard ---------- */
function HealthDash({t,user,showNotif}){
  const vp=useViewport();
  const[log,setLog]=useState(getHealthLog(user.id));
  const[period,setPeriod]=useState("monthly");
  const[adding,setAdding]=useState(false);
  const[f,setF]=useState({weight:"",bp_s:"",bp_d:"",hr:"",steps:"",bloodSugar:"",waist:"",stress:5,energy:5,happiness:5});
  const upf=(k,v)=>setF(s=>({...s,[k]:v}));
  const hasLog=log.length>0;
  const latest=hasLog?log[log.length-1]:null;
  const first=hasLog?log[0]:null;
  const bmiOf=(w)=>user.height>0&&w>0?(w/(user.height/100)**2).toFixed(1):"\u2014";
  const saveEntry=()=>{
    if(!f.weight&&!f.bp_s&&!f.hr){showNotif("Enter at least one metric","err");return;}
    const entry={date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),month:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),weight:+f.weight||0,bp:(f.bp_s&&f.bp_d)?f.bp_s+"/"+f.bp_d:"\u2014",hr:+f.hr||0,steps:+f.steps||0,bloodSugar:+f.bloodSugar||0,waist:+f.waist||0,stress:+f.stress,energy:+f.energy,happiness:+f.happiness,km:user.km||0};
    addHealthLog(user.id,entry);
    const nl=getHealthLog(user.id);setLog(nl);
    // update member's headline metrics from latest entry
    const idx=MEMBERS.findIndex(m=>m.id===user.id);if(idx>-1){if(entry.weight)MEMBERS[idx].weight=entry.weight;if(entry.bp!=="\u2014")MEMBERS[idx].bp=entry.bp;if(entry.hr)MEMBERS[idx].hr=entry.hr;if(entry.weight&&user.height>0)MEMBERS[idx].bmi=+bmiOf(entry.weight);persist();}
    setAdding(false);setF({weight:"",bp_s:"",bp_d:"",hr:"",steps:"",bloodSugar:"",waist:"",stress:5,energy:5,happiness:5});
    showNotif("Health check logged");
  };
  /* BFA Impact Score from real activity */
  const actPts=Math.min(25,Math.round((user.sessions||0)*2.5));
  const attCount=(user.attendance||[]).length;const attPts=Math.min(20,attCount*2);
  const kmPts=Math.min(25,Math.round((user.km||0)));
  const logPts=Math.min(15,log.length*3);
  const streakPts=Math.min(15,(user.streak||0));
  const scoreAreas=[{area:"Physical Activity",score:actPts,max:25,color:t.ok},{area:"Attendance",score:attPts,max:20,color:t.Y},{area:"Distance Covered",score:kmPts,max:25,color:t.info},{area:"Health Tracking",score:logPts,max:15,color:t.warn},{area:"Consistency",score:streakPts,max:15,color:t.purple}];
  const totalScore=scoreAreas.reduce((a,s)=>a+s.score,0);
  const cat=totalScore>=90?"Fitness Champion":totalScore>=70?"Community Leader":totalScore>=40?"Active Member":totalScore>0?"Getting Started":"New Member";
  const metrics=[{label:"Weight",key:"weight",unit:"kg",icon:"chart",color:t.info},{label:"BMI",key:"bmi",unit:"",icon:"chart",color:t.Y},{label:"Heart Rate",key:"hr",unit:" bpm",icon:"heart",color:t.pink},{label:"Blood Pressure",key:"bp",unit:"",icon:"heart",color:t.err},{label:"Steps",key:"steps",unit:"",icon:"steps",color:t.ok},{label:"Blood Sugar",key:"bloodSugar",unit:"",icon:"water",color:t.pink},{label:"Waist",key:"waist",unit:"cm",icon:"chart",color:t.info},{label:"Stress",key:"stress",unit:"/10",icon:"bolt",color:t.warn},{label:"Energy",key:"energy",unit:"/10",icon:"bolt",color:t.Y},{label:"Happiness",key:"happiness",unit:"/10",icon:"star",color:t.purple}];
  const mval=(m)=>{if(!latest)return "\u2014";if(m.key==="bmi")return bmiOf(latest.weight);if(m.key==="bp")return latest.bp;const v=latest[m.key];return (v||v===0)&&v!==0?v+m.unit:"\u2014";};
  const addForm=h(Modal,{t,title:"Log a Health Check",onClose:()=>setAdding(false),wide:true},
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"repeat(3,1fr)",gap:10}},
      h(Inp,{label:"Weight (kg)",type:"number",val:f.weight,set:v=>upf("weight",v),ph:"e.g. 72",t}),
      h(Inp,{label:"BP Systolic",type:"number",val:f.bp_s,set:v=>upf("bp_s",v),ph:"120",t}),
      h(Inp,{label:"BP Diastolic",type:"number",val:f.bp_d,set:v=>upf("bp_d",v),ph:"80",t}),
      h(Inp,{label:"Resting HR",type:"number",val:f.hr,set:v=>upf("hr",v),ph:"72",t}),
      h(Inp,{label:"Daily Steps",type:"number",val:f.steps,set:v=>upf("steps",v),ph:"8000",t}),
      h(Inp,{label:"Blood Sugar",type:"number",val:f.bloodSugar,set:v=>upf("bloodSugar",v),ph:"95",t}),
      h(Inp,{label:"Waist (cm)",type:"number",val:f.waist,set:v=>upf("waist",v),ph:"85",t})),
    h("div",{style:{display:"flex",gap:10,marginTop:16}},h("button",{onClick:()=>setAdding(false),style:{flex:1,background:"none",border:`1px solid ${t.border2}`,borderRadius:11,padding:"12px",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer"}},"Cancel"),h("button",{onClick:saveEntry,style:{flex:2,background:t.Y,border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"Save Health Check")));
  if(!hasLog)return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:18}},
    h(Card,{t,style:{textAlign:"center",padding:"40px 24px"}},h("div",{style:{marginBottom:12,opacity:0.6,display:"flex",justifyContent:"center"}},h(Icon,{name:"heart",size:42,color:t.text3})),h("h3",{style:{color:t.text,fontSize:17,fontWeight:900,margin:"0 0 8px"}},"Start tracking your health"),h("p",{style:{color:t.text2,fontSize:13,lineHeight:1.7,margin:"0 0 20px",maxWidth:400,marginLeft:"auto",marginRight:"auto"}},"Log your weight, blood pressure, heart rate and more to watch your progress over time and build your BFA Impact Score."),h("button",{onClick:()=>setAdding(true),style:{background:t.Y,border:"none",borderRadius:11,padding:"13px 26px",fontSize:14,fontWeight:900,color:"#080808",cursor:"pointer"}},"+ Log your first health check")),
    h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 16px"}},"BFA Impact Score"),h("div",{style:{textAlign:"center",marginBottom:16}},h("p",{style:{color:t.Y,fontSize:44,fontWeight:900,margin:"0 0 4px"}},totalScore),h("p",{style:{color:t.text2,fontSize:11,margin:"0 0 6px"}},"out of 100"),h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}40`,borderRadius:20,padding:"4px 14px",display:"inline-block"}},h("span",{style:{color:t.Yt,fontSize:11,fontWeight:700}},cat))),scoreAreas.map(sa=>h("div",{key:sa.area,style:{marginBottom:12}},h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},h("span",{style:{color:t.text,fontSize:11,fontWeight:600}},sa.area),h("span",{style:{color:sa.color,fontSize:11,fontWeight:700}},sa.score+"/"+sa.max)),h("div",{style:{height:5,background:t.surf3,borderRadius:4}},h("div",{style:{height:"100%",width:Math.round((sa.score/sa.max)*100)+"%",background:sa.color,borderRadius:4,transition:"width .4s"}}))))),
    adding&&addForm);
  const delta=(first&&latest&&first.weight&&latest.weight)?(first.weight-latest.weight).toFixed(1):null;
  return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:18}},
    h("div",{style:{display:"flex",justifyContent:"flex-end"}},h("button",{onClick:()=>setAdding(true),style:{background:t.Y,border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"+ Log Health Check")),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"repeat(4,1fr)",gap:12}},[["BMI",bmiOf(latest.weight),user.height>0?"":"add height in Settings"],["Weight",latest.weight?latest.weight+"kg":"\u2014",delta&&delta>0?"\u2193 "+delta+"kg":""],["BP",latest.bp,""],["HR",latest.hr?latest.hr+"bpm":"\u2014",""]].map(([l,v,sub])=>h("div",{key:l,style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:13,padding:"16px"}},h("p",{style:{color:t.text2,fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",margin:"0 0 4px"}},l),h("p",{style:{color:t.Y,fontSize:22,fontWeight:900,margin:"0 0 3px"}},v),sub&&h("p",{style:{color:t.ok,fontSize:11,margin:0,fontWeight:600}},sub)))),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"2fr 1fr",gap:16}},h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 16px"}},"Health Log"),h("div",{style:{overflowX:"auto"}},h("table",{style:{width:"100%",borderCollapse:"collapse"}},h("thead",null,h("tr",null,["Date","Weight","BMI","BP","HR","Steps"].map(c=>h("th",{key:c,style:{color:t.text2,fontSize:9,fontWeight:700,textTransform:"uppercase",padding:"8px 10px",textAlign:"left",borderBottom:`1px solid ${t.border}`,whiteSpace:"nowrap"}},c)))),h("tbody",null,[...log].reverse().map((row,i)=>h("tr",{key:i,style:{borderBottom:`1px solid ${t.border}`}},[row.date,row.weight?row.weight+"kg":"\u2014",bmiOf(row.weight),row.bp,row.hr||"\u2014",row.steps?row.steps.toLocaleString():"\u2014"].map((v,j)=>h("td",{key:j,style:{padding:"8px 10px",color:j===0?t.text2:t.text,fontWeight:j===0?400:600,fontSize:11,whiteSpace:"nowrap"}},v)))))))),h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 16px"}},"BFA Impact Score"),h("div",{style:{textAlign:"center",marginBottom:16}},h("p",{style:{color:t.Y,fontSize:44,fontWeight:900,margin:"0 0 4px"}},totalScore),h("p",{style:{color:t.text2,fontSize:11,margin:"0 0 6px"}},"out of 100"),h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}40`,borderRadius:20,padding:"4px 14px",display:"inline-block"}},h("span",{style:{color:t.Yt,fontSize:11,fontWeight:700}},cat))),scoreAreas.map(sa=>h("div",{key:sa.area,style:{marginBottom:12}},h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},h("span",{style:{color:t.text,fontSize:11,fontWeight:600}},sa.area),h("span",{style:{color:sa.color,fontSize:11,fontWeight:700}},sa.score+"/"+sa.max)),h("div",{style:{height:5,background:t.surf3,borderRadius:4}},h("div",{style:{height:"100%",width:Math.round((sa.score/sa.max)*100)+"%",background:sa.color,borderRadius:4,transition:"width .4s"}})))))),
    h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 14px"}},"Latest Metrics"),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10}},metrics.map(m=>h("div",{key:m.label,style:{background:t.surf2,borderRadius:11,padding:"13px 12px",textAlign:"center"}},h("div",{style:{marginBottom:6}},h(Icon,{name:m.icon,size:20,color:m.color})),h("p",{style:{color:t.text2,fontSize:9,fontWeight:700,textTransform:"uppercase",margin:"0 0 5px"}},m.label),h("p",{style:{color:m.color,fontSize:15,fontWeight:900,margin:0}},mval(m)))))),
    adding&&addForm);
}

/* ---------- Community (chat) ---------- */
function Community({t,user,showNotif}){
  const vp=useViewport();
  const[channel,setChannel]=useState("general");
  const[msgs,setMsgs]=useState(getMessages());const[text,setText]=useState("");const chRef=useRef(null);
  const channels=[{id:"general",label:"General Hub",desc:"All BefitAfrica members"},{id:"interhub",label:"Inter-Hub",desc:"Cross-hub conversations"},{id:"intrahub",label:user.hub+" (Intra-Hub)",desc:"Just your "+user.hub+" hub"}];
  const send=()=>{if(!text.trim())return;const msg={user:user.name,avatar:user.avatar,hub:user.hub,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),text:text.trim()};const nm={...msgs,[channel]:[...(msgs[channel]||[]),msg]};setMsgs(nm);setMessages(nm);setText("");setTimeout(()=>{if(chRef.current)chRef.current.scrollTop=chRef.current.scrollHeight;},50);};
  useEffect(()=>{if(chRef.current)chRef.current.scrollTop=chRef.current.scrollHeight;},[channel]);
  const channelMsgs=msgs[channel]||[];
  const totalMsgs=Object.values(msgs).reduce((a,arr)=>a+arr.length,0);
  const totalKm=MEMBERS.reduce((a,m)=>a+(m.km||0),0);
  const chatBox=h(Card,{t,p:"0",style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:vp.mobile?420:0}},h("div",{style:{padding:"14px 20px",borderBottom:`1px solid ${t.border}`}},h("h3",{style:{color:t.text,fontSize:15,fontWeight:900,margin:"0 0 2px"}},channels.find(c=>c.id===channel).label),h("p",{style:{color:t.text2,fontSize:11,margin:0}},channels.find(c=>c.id===channel).desc)),h("div",{ref:chRef,style:{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14,minHeight:240}},channelMsgs.length?channelMsgs.map((m,i)=>{const mine=m.user===user.name;return h("div",{key:i,style:{display:"flex",gap:10,flexDirection:mine?"row-reverse":"row"}},h(Av,{init:m.avatar,size:34,t}),h("div",{style:{maxWidth:"72%"}},h("div",{style:{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexDirection:mine?"row-reverse":"row"}},h("span",{style:{color:t.text,fontSize:12,fontWeight:700}},mine?"You":m.user),channel!=="intrahub"&&h(Pill,{color:t.info,bg:`${t.info}18`,small:true},m.hub),h("span",{style:{color:t.text3,fontSize:9}},m.time)),h("div",{style:{background:mine?t.Y:t.surf2,borderRadius:mine?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"10px 14px"}},h("p",{style:{color:mine?"#080808":t.text,fontSize:13,lineHeight:1.5,margin:0}},m.text))));}):h("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,opacity:0.7}},h(Icon,{name:"chat",size:30,color:t.text3}),h("p",{style:{color:t.text2,fontSize:13,margin:0,textAlign:"center"}},"No messages yet. Start the conversation!"))),h("div",{style:{padding:"12px 16px",borderTop:`1px solid ${t.border}`,display:"flex",gap:10}},h("input",{value:text,onChange:e=>setText(e.target.value),onKeyDown:e=>{if(e.key==="Enter")send();},placeholder:"Type a message...",style:{flex:1,background:t.surf2,border:`1px solid ${t.border2}`,borderRadius:22,padding:"11px 18px",fontSize:13,color:t.text,outline:"none"}}),h("button",{onClick:send,style:{background:t.Y,border:"none",borderRadius:22,padding:"11px 20px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"Send")));
  if(vp.mobile)return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:12}},h("div",{style:{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}},channels.map(c=>h("button",{key:c.id,onClick:()=>setChannel(c.id),style:{whiteSpace:"nowrap",background:channel===c.id?t.Y:t.surf2,border:`1px solid ${channel===c.id?t.Y:t.border2}`,borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:channel===c.id?800:600,color:channel===c.id?"#080808":t.text,cursor:"pointer"}},c.label))),chatBox);
  return h("div",{className:"fd",style:{display:"flex",gap:16,height:"calc(100vh - 100px)"}},h("div",{style:{width:240,display:"flex",flexDirection:"column",gap:10}},h(Card,{t,p:"16px"},h("h4",{style:{color:t.text,fontSize:12,fontWeight:800,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:0.8}},"Channels"),channels.map(c=>h("button",{key:c.id,onClick:()=>setChannel(c.id),style:{width:"100%",textAlign:"left",background:channel===c.id?t.Yd:"none",border:channel===c.id?`1px solid ${t.Y}30`:"1px solid transparent",borderRadius:10,padding:"11px 13px",cursor:"pointer",marginBottom:6}},h("p",{style:{color:channel===c.id?t.Yt:t.text,fontSize:13,fontWeight:700,margin:"0 0 2px"}},c.label),h("p",{style:{color:t.text2,fontSize:10,margin:0,lineHeight:1.4}},c.desc)))),h(Card,{t,p:"16px"},h("h4",{style:{color:t.text,fontSize:12,fontWeight:800,margin:"0 0 12px"}},"Community Stats"),[["Members",MEMBERS.length],["Messages",totalMsgs],["Total KM",totalKm.toFixed(0)+"km"],["Hubs",HUBS_LIST.length]].map(([l,v])=>h("div",{key:l,style:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${t.border}`}},h("span",{style:{color:t.text2,fontSize:11}},l),h("span",{style:{color:t.text,fontSize:11,fontWeight:700}},v))))),chatBox);
}

/* ---------- Health Education Center ---------- */
function HealthCenter({t,showNotif}){
  const vp=useViewport();const[res,setRes]=useState(null);
  const topics=[{icon:"heart",title:"Heart Health",month:"February",desc:"Cardiovascular health and disease prevention",resources:["Article: 10 Heart-Healthy Habits","Video: Cardio Basics (12 min)","Infographic: Know Your BP Numbers","PDF: Heart Health Guide"]},{icon:"bolt",title:"Mental Wellness",month:"May",desc:"Stress relief and mental health through fitness",resources:["Article: Exercise & Mood","Video: 5-Min Meditation","Audio: Guided Breathing","PDF: Stress Management Toolkit"]},{icon:"water",title:"Nutrition",month:"August",desc:"Hydration and healthy African diets",resources:["Article: Eating for Energy","Video: Meal Prep 101","Infographic: Hydration Chart","PDF: African Nutrition Guide"]},{icon:"members",title:"Men's Health",month:"June",desc:"Prostate health and men's fitness",resources:["Article: Men's Health Screening","Video: Strength Training","PDF: Men's Wellness Guide"]},{icon:"heart",title:"Women's Wellness",month:"March",desc:"Women's health and fitness",resources:["Article: Hormones & Exercise","Video: Pre/Postnatal Fitness","PDF: Women's Health Guide"]},{icon:"water",title:"Diabetes Prevention",month:"November",desc:"Blood sugar and lifestyle management",resources:["Article: Understanding Blood Sugar","Video: Diabetes-Friendly Workouts","PDF: Prevention Handbook"]}];
  return h("div",{className:"fd"},h("div",{style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:14,padding:"22px 24px",marginBottom:20}},h("h2",{style:{color:t.text,fontSize:17,fontWeight:900,margin:"0 0 7px"}},"Health Education Center"),h("p",{style:{color:t.text2,fontSize:13,margin:0}},"Monthly themes, expert webinars and resources for the BefitAfrica community")),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"repeat(3,1fr)",gap:14}},topics.map(tp=>h("div",{key:tp.title,style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:14,padding:"20px 18px"}},h(Icon,{name:tp.icon,size:30,color:t.Yt}),h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"11px 0 4px"}},tp.title),h("p",{style:{color:t.Yt,fontSize:10,fontWeight:700,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:0.8}},tp.month+" Theme"),h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 13px",lineHeight:1.6}},tp.desc),h("button",{onClick:()=>setRes(tp),style:{background:t.Yd,border:"none",borderRadius:8,padding:"8px 13px",fontSize:11,fontWeight:700,color:t.Yt,cursor:"pointer"}},"View Resources \u2192")))),res&&h(Modal,{t,title:res.title,onClose:()=>setRes(null)},h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 16px"}},res.month+" Theme \u00b7 "+res.resources.length+" resources"),res.resources.map((r,i)=>h("button",{key:i,onClick:()=>showNotif("Opening: "+r),style:{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:t.surf2,border:`1px solid ${t.border}`,borderRadius:10,padding:"13px 16px",marginBottom:8,cursor:"pointer"}},h("span",{style:{color:t.text,fontSize:13,fontWeight:600}},r),h("span",{style:{color:t.Yt,fontSize:12,fontWeight:700}},"Open \u2192")))));
}

/* ---------- Challenges ---------- */
function ChallengesView({t,user,isAdmin,showNotif}){
  const vp=useViewport();const[ch,setCh]=useState(getChallenges());const[create,setCreate]=useState(false);
  const[form,setForm]=useState({name:"",duration:"",goal:"",icon:"trophy"});
  const myId=user.id;
  const join=(c)=>{const joined=(c.participants||[]).includes(myId);const np=joined?c.participants.filter(x=>x!==myId):[...(c.participants||[]),myId];const nc=ch.map(x=>x.id===c.id?{...x,participants:np}:x);setCh(nc);setChallenges(nc);showNotif(joined?"Left "+c.name:"Joined "+c.name+"!");};
  const saveCh=()=>{if(!form.name||!form.duration){showNotif("Name and duration required","err");return;}const nc=[{id:Date.now(),name:form.name,duration:form.duration,goal:form.goal,icon:form.icon,participants:[],created:Date.now()},...ch];setCh(nc);setChallenges(nc);showNotif("Challenge created");setCreate(false);setForm({name:"",duration:"",goal:"",icon:"trophy"});};
  const remove=(c)=>{const nc=ch.filter(x=>x.id!==c.id);setCh(nc);setChallenges(nc);showNotif("Challenge removed","err");};
  return h("div",{className:"fd"},
    isAdmin&&h("div",{style:{display:"flex",justifyContent:"flex-end",marginBottom:16}},h("button",{onClick:()=>setCreate(true),style:{background:t.Y,border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"+ Create Challenge")),
    ch.length?h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"repeat(2,1fr)",gap:16}},ch.map(c=>{const joined=(c.participants||[]).includes(myId);return h("div",{key:c.id,style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:14,padding:"22px"}},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}},h("div",null,h(Icon,{name:(ICON_PATHS[c.icon]?c.icon:"trophy"),size:30,color:t.Yt}),h("h3",{style:{color:t.text,fontSize:16,fontWeight:900,margin:"10px 0 4px"}},c.name),h("p",{style:{color:t.text2,fontSize:12,margin:0}},c.duration+" \u00b7 "+(c.participants||[]).length+" participants")),isAdmin&&h("button",{onClick:()=>remove(c),style:{background:"none",border:`1px solid ${t.err}40`,borderRadius:8,padding:"5px 9px",fontSize:11,color:t.err,cursor:"pointer"}},"")),c.goal&&h("p",{style:{color:t.text2,fontSize:12,margin:"0 0 14px",lineHeight:1.5}},c.goal),h("button",{onClick:()=>join(c),style:{width:"100%",background:joined?t.surf3:t.Y,border:"none",borderRadius:9,padding:"10px",fontSize:12,fontWeight:800,color:joined?t.text:"#080808",cursor:"pointer"}},joined?"\u2713 Joined":"Join Challenge"));})):h(Card,{t,style:{textAlign:"center",padding:"40px 24px"}},h("div",{style:{fontSize:42,marginBottom:12,opacity:0.6}},""),h("h3",{style:{color:t.text,fontSize:16,fontWeight:900,margin:"0 0 8px"}},"No challenges yet"),h("p",{style:{color:t.text2,fontSize:13,margin:0}},isAdmin?"Create the first community challenge to motivate members.":"Check back soon — challenges will appear here.")),
    create&&h(Modal,{t,title:"Create Challenge",onClose:()=>setCreate(false)},h(Inp,{label:"Challenge Name",val:form.name,set:v=>setForm({...form,name:v}),ph:"e.g. 10K Steps Daily",t,req:true}),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"1fr 1fr",gap:12}},h(Inp,{label:"Duration",val:form.duration,set:v=>setForm({...form,duration:v}),ph:"e.g. 30 days",t,req:true}),h(Sel,{label:"Icon",val:form.icon,set:v=>setForm({...form,icon:v}),opts:["trophy","steps","run","water","fire","heart"],t})),h(Inp,{label:"Goal / Description",val:form.goal,set:v=>setForm({...form,goal:v}),ph:"What members need to do",t,rows:2}),h("div",{style:{display:"flex",gap:10,marginTop:16}},h("button",{onClick:()=>setCreate(false),style:{flex:1,background:"none",border:`1px solid ${t.border2}`,borderRadius:11,padding:"12px",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer"}},"Cancel"),h("button",{onClick:saveCh,style:{flex:2,background:t.Y,border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"Create Challenge"))));
}

/* ---------- Events ---------- */
function EventsView({t,user,isAdmin,showNotif}){
  const vp=useViewport();const[events,setEv]=useState(getEvents());const[create,setCreate]=useState(false);const[form,setForm]=useState({name:"",date:"",time:"",hub:"All Hubs",type:"weekly"});
  const myId=user.id;
  const typeC={weekly:t.ok,festival:t.Y,webinar:t.info,launch:t.warn},typeI={weekly:"run",festival:"star",webinar:"chat",launch:"bolt"};
  const reg=(e)=>{const r=(e.registered||[]).includes(myId);const nr=r?e.registered.filter(x=>x!==myId):[...(e.registered||[]),myId];const ne=events.map(x=>x.id===e.id?{...x,registered:nr}:x);setEv(ne);setEvents(ne);showNotif(r?"Registration cancelled":"Registered for "+e.name+"!");};
  const saveEvent=()=>{if(!form.name||!form.date){showNotif("Event name and date required","err");return;}const ne=[{...form,id:Date.now(),registered:[]},...events];setEv(ne);setEvents(ne);showNotif("Event '"+form.name+"' created!");setCreate(false);setForm({name:"",date:"",time:"",hub:"All Hubs",type:"weekly"});};
  const remove=(e)=>{const ne=events.filter(x=>x.id!==e.id);setEv(ne);setEvents(ne);showNotif("Event removed","err");};
  return h("div",{className:"fd"},
    isAdmin&&h("div",{style:{display:"flex",justifyContent:"flex-end",marginBottom:18}},h("button",{onClick:()=>setCreate(true),style:{background:t.Y,border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"+ Create Event")),
    events.length?h("div",{style:{display:"flex",flexDirection:"column",gap:12}},events.map(e=>h("div",{key:e.id,style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:14,padding:vp.mobile?"16px":"20px 24px",display:"flex",alignItems:"center",gap:vp.mobile?12:18,flexWrap:"wrap"}},h("div",{style:{width:52,height:52,borderRadius:13,background:`${typeC[e.type]}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},h(Icon,{name:typeI[e.type],size:22,color:typeC[e.type]})),h("div",{style:{flex:1,minWidth:150}},h("div",{style:{display:"flex",alignItems:"center",gap:9,marginBottom:5,flexWrap:"wrap"}},h("h3",{style:{color:t.text,fontSize:15,fontWeight:900,margin:0}},e.name),h(Pill,{color:typeC[e.type],bg:`${typeC[e.type]}20`},e.type)),h("p",{style:{color:t.text2,fontSize:12,margin:0}},e.date+" \u00b7 "+e.time+" \u00b7 "+e.hub)),h("div",{style:{textAlign:"right",flexShrink:0}},h("p",{style:{color:t.text,fontSize:19,fontWeight:900,margin:"0 0 2px"}},(e.registered||[]).length),h("p",{style:{color:t.text2,fontSize:11,margin:"0 0 11px"}},"registered"),h("div",{style:{display:"flex",gap:6,justifyContent:"flex-end"}},h("button",{onClick:()=>reg(e),style:{background:(e.registered||[]).includes(myId)?t.surf3:t.Y,border:"none",borderRadius:8,padding:"7px 16px",fontSize:11,fontWeight:800,color:(e.registered||[]).includes(myId)?t.text:"#080808",cursor:"pointer"}},(e.registered||[]).includes(myId)?"\u2713 Registered":"Register"),isAdmin&&h("button",{onClick:()=>remove(e),style:{background:"none",border:`1px solid ${t.err}40`,borderRadius:8,padding:"7px 10px",fontSize:11,color:t.err,cursor:"pointer"}},"")))))):h(Card,{t,style:{textAlign:"center",padding:"40px 24px"}},h("div",{style:{marginBottom:12,opacity:0.6,display:"flex",justifyContent:"center"}},h(Icon,{name:"calendar",size:40,color:t.text3})),h("h3",{style:{color:t.text,fontSize:16,fontWeight:900,margin:"0 0 8px"}},"No events scheduled"),h("p",{style:{color:t.text2,fontSize:13,margin:0}},isAdmin?"Create your first event to bring the community together.":"Check back soon — upcoming events will appear here.")),
    create&&h(Modal,{t,title:"Create New Event",onClose:()=>setCreate(false)},h(Inp,{label:"Event Name",val:form.name,set:v=>setForm({...form,name:v}),ph:"e.g. Saturday Community Walk",t,req:true}),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"1fr 1fr",gap:12}},h(Inp,{label:"Date",val:form.date,set:v=>setForm({...form,date:v}),ph:"e.g. Jul 12, 2026",t,req:true}),h(Inp,{label:"Time",val:form.time,set:v=>setForm({...form,time:v}),ph:"e.g. 6:00 AM",t}),h(Sel,{label:"Hub",val:form.hub,set:v=>setForm({...form,hub:v}),opts:["All Hubs","Virtual",...HUBS_LIST],t}),h(Sel,{label:"Type",val:form.type,set:v=>setForm({...form,type:v}),opts:["weekly","festival","webinar","launch"],t})),h("div",{style:{display:"flex",gap:10,marginTop:18}},h("button",{onClick:()=>setCreate(false),style:{flex:1,background:"none",border:`1px solid ${t.border2}`,borderRadius:11,padding:"12px",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer"}},"Cancel"),h("button",{onClick:saveEvent,style:{flex:2,background:t.Y,border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"Create Event"))));
}

/* ---------- Members (ADMIN ONLY) ---------- */
function MembersView({t,showNotif}){
  const vp=useViewport();const[,force]=useState(0);const[sel,setSel]=useState(null);const[search,setSr]=useState("");const[modal,setModal]=useState(null);const[form,setForm]=useState(null);
  const filtered=MEMBERS.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.hub.toLowerCase().includes(search.toLowerCase())||(u.occupation||"").toLowerCase().includes(search.toLowerCase()));
  const blank={name:"",email:"",phone:"",gender:"Male",occupation:"",country:"Nigeria",state:"",lga:"",address:"",hub:HUBS_LIST[0],status:"new",weight:"",height:"",bp:"",hr:"",password:"",goals:[],verified:true};
  const openAdd=()=>{setForm({...blank});setModal("add");};const openEdit=(m)=>{setForm({...m});setModal("edit");setSel(null);};
  const save=()=>{if(!form.name||!form.email){showNotif("Name and email are required","err");return;}const cloud=(typeof bfaSaveMember==="function");if(modal==="add"&&MEMBERS.find(m=>m.email.toLowerCase()===form.email.toLowerCase())){showNotif("A member with this email already exists","err");return;}if(modal==="add"){if(cloud){showNotif("In multi-device mode, ask the member to register themselves \u2014 their account then needs their own email & password.","err");return;}const id=nextMemberId();const pw=(form.password&&form.password.length>=6)?form.password:"Bfa"+Math.random().toString(36).slice(2,8);MEMBERS.push({...form,id,role:"member",avatar:initials(form.name),joined:new Date().toLocaleString("en-US",{month:"short",year:"numeric"}),streak:0,sessions:0,km:0,bmi:form.height&&form.weight?+((form.weight/(form.height/100)**2).toFixed(1)):0,password:pw,attendance:[]});showNotif(form.name+" added \u00b7 password: "+pw);}else{const idx=MEMBERS.findIndex(m=>m.id===form.id);if(idx>-1){MEMBERS[idx]={...MEMBERS[idx],...form,bmi:form.height&&form.weight?+((form.weight/(form.height/100)**2).toFixed(1)):MEMBERS[idx].bmi};if(cloud)bfaSaveMember(MEMBERS[idx]);}showNotif(form.name+"'s biodata updated");}if(!cloud)persist();setModal(null);force(x=>x+1);};
  const remove=(m)=>{if(m.role==="admin"){showNotif("Cannot remove the administrator","err");return;}const idx=MEMBERS.findIndex(x=>x.id===m.id);if(idx>-1)MEMBERS.splice(idx,1);persist();showNotif(m.name+" removed","err");setSel(null);force(x=>x+1);};
  const resetPass=(m)=>{if(typeof bfaResetPassword==="function"){bfaResetPassword(m.email);showNotif("Password-reset email sent to "+m.email);return;}const pw="Bfa"+Math.random().toString(36).slice(2,8);m.password=pw;persist();showNotif("New password for "+m.name+": "+pw);};
  const toggleGoal=(g)=>setForm(f=>({...f,goals:(f.goals||[]).includes(g)?f.goals.filter(x=>x!==g):[...(f.goals||[]),g]}));
  const stateOpts=form&&form.country==="Nigeria"?Object.keys(NIGERIA_STATES_LGAS):[];
  const lgaOpts=form&&form.country==="Nigeria"&&form.state&&NIGERIA_STATES_LGAS[form.state]?NIGERIA_STATES_LGAS[form.state]:[];
  return h("div",{className:"fd"},h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}30`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}},h(Icon,{name:"crown",size:18,color:t.Yt}),h("span",{style:{color:t.Yt,fontSize:12,fontWeight:700}},"Administrator access \u2014 only Abiola can add, edit, remove members and reset passwords")),
    h("div",{style:{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}},h("div",{style:{display:"flex",alignItems:"center",gap:8,background:t.surf,border:`1px solid ${t.border}`,borderRadius:10,padding:"9px 14px",flex:1,minWidth:200}},h(Icon,{name:"search",size:16,color:t.text2}),h("input",{value:search,onChange:e=>setSr(e.target.value),placeholder:"Search members, hubs, occupations...",style:{background:"none",border:"none",outline:"none",color:t.text,fontSize:13,flex:1}})),h("button",{onClick:openAdd,style:{background:t.Y,border:"none",borderRadius:9,padding:"9px 18px",color:"#080808",cursor:"pointer",fontSize:12,fontWeight:800}},"+ Add Member")),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:13}},filtered.map(m=>h("div",{key:m.id,style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:13,padding:"18px"}},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}},h("div",{style:{display:"flex",gap:10}},h(Av,{init:m.avatar,size:38,t}),h("div",null,h("p",{style:{color:t.text,fontSize:13,fontWeight:800,margin:0}},m.name),h("p",{style:{color:t.text2,fontSize:11,margin:0}},(m.occupation||"\u2014")+" \u00b7 "+m.hub))),h(Pill,{color:statusCol(m.status,t),bg:`${statusCol(m.status,t)}20`},statusLbl(m.status))),h("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}},[["Sessions",m.sessions],["KM",m.km],["BMI",m.bmi]].map(([l,v])=>h("div",{key:l,style:{background:t.surf2,borderRadius:8,padding:"8px",textAlign:"center"}},h("p",{style:{color:t.text,fontSize:12,fontWeight:800,margin:"0 0 2px"}},v),h("p",{style:{color:t.text2,fontSize:9,margin:0}},l)))),h("div",{style:{display:"flex",gap:8}},h("button",{onClick:()=>setSel(m),style:{flex:1,background:t.surf2,border:`1px solid ${t.border2}`,borderRadius:8,padding:"8px",fontSize:11,fontWeight:600,color:t.text,cursor:"pointer"}},"View"),h("button",{onClick:()=>openEdit(m),style:{flex:1,background:t.Yd,border:"none",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,color:t.Yt,cursor:"pointer"}},"Edit"),h("button",{onClick:()=>remove(m),style:{background:"none",border:`1px solid ${t.err}40`,borderRadius:8,padding:"8px 11px",fontSize:11,fontWeight:600,color:t.err,cursor:"pointer"}},""))))),
    sel&&h("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:900,display:"flex",justifyContent:"flex-end"},onClick:e=>{if(e.target===e.currentTarget)setSel(null);}},h("div",{className:"sl",style:{width:vp.mobile?"100%":380,background:t.surf,height:"100%",overflowY:"auto",padding:26}},h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:20}},h("h2",{style:{color:t.text,fontSize:17,fontWeight:900,margin:0}},"Member Profile"),h("button",{onClick:()=>setSel(null),style:{background:"none",border:"none",color:t.text2,cursor:"pointer",fontSize:19}},"\u2715")),h("div",{style:{textAlign:"center",marginBottom:18}},h(Av,{init:sel.avatar,size:60,t}),h("h3",{style:{color:t.text,fontSize:16,fontWeight:900,margin:"10px 0 5px"}},sel.name),h(Pill,{color:statusCol(sel.status,t),bg:`${statusCol(sel.status,t)}20`},statusLbl(sel.status))),h("div",{style:{background:t.surf2,borderRadius:12,padding:"14px 16px",marginBottom:14}},[["Email",sel.email],["Phone",sel.phone||"\u2014"],["Occupation",sel.occupation||"\u2014"],["Country",sel.country||"\u2014"],["State",sel.state||"\u2014"],["LGA",sel.lga||"\u2014"],["Address",sel.address||"\u2014"],["Hub",sel.hub],["Joined",sel.joined],["Sessions",sel.sessions],["Distance",sel.km+"km"],["BMI",sel.bmi],["Verified",sel.verified===false?"No":"Yes"]].map(([l,v])=>h("div",{key:l,style:{display:"flex",justifyContent:"space-between",gap:12,padding:"6px 0",borderBottom:`1px solid ${t.border}`}},h("span",{style:{color:t.text2,fontSize:12,flexShrink:0}},l),h("span",{style:{color:t.text,fontSize:12,fontWeight:700,textAlign:"right"}},v)))),h("div",{style:{display:"flex",gap:10,marginBottom:10}},h("button",{onClick:()=>openEdit(sel),style:{flex:1,background:t.Y,border:"none",borderRadius:10,padding:"11px",fontSize:12,fontWeight:800,color:"#080808",cursor:"pointer"}},"Edit"),h("button",{onClick:()=>resetPass(sel),style:{flex:1,background:t.surf3,border:`1px solid ${t.border2}`,borderRadius:10,padding:"11px",fontSize:12,fontWeight:700,color:t.text,cursor:"pointer"}},"Reset Pass")),sel.role!=="admin"&&h("button",{onClick:()=>remove(sel),style:{width:"100%",background:"none",border:`1px solid ${t.err}40`,borderRadius:10,padding:"11px",fontSize:12,fontWeight:600,color:t.err,cursor:"pointer"}},"Remove Member"))),
    modal&&form&&h(Modal,{t,title:modal==="add"?"Add New Member":"Edit "+form.name,onClose:()=>setModal(null),wide:true},h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"1fr 1fr",gap:12}},h(Inp,{label:"Full Name",val:form.name,set:v=>setForm({...form,name:v}),ph:"Full name",t,req:true}),h(Inp,{label:"Email",type:"email",val:form.email,set:v=>setForm({...form,email:v}),ph:"email",t,req:true}),h(Inp,{label:"Phone",val:form.phone,set:v=>setForm({...form,phone:v}),ph:"+234...",t}),h(Sel,{label:"Gender",val:form.gender,set:v=>setForm({...form,gender:v}),opts:["Male","Female","Prefer not to say"],t}),h(Sel,{label:"Occupation",val:form.occupation,set:v=>setForm({...form,occupation:v}),opts:["",...OCCUPATIONS],t}),h(Sel,{label:"Hub",val:form.hub,set:v=>setForm({...form,hub:v}),opts:HUBS_LIST,t})),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"1fr 1fr 1fr",gap:10}},h(SearchSelect,{label:"Country",val:form.country,set:v=>setForm({...form,country:v,state:"",lga:""}),opts:COUNTRIES,t,ph:"Country"}),form.country==="Nigeria"?h(SearchSelect,{label:"State",val:form.state,set:v=>setForm({...form,state:v,lga:""}),opts:stateOpts,t,ph:"State"}):h(Inp,{label:"State",val:form.state,set:v=>setForm({...form,state:v}),t}),form.country==="Nigeria"?h(SearchSelect,{label:"LGA",val:form.lga,set:v=>setForm({...form,lga:v}),opts:lgaOpts,t,ph:"LGA"}):h(Inp,{label:"City",val:form.lga,set:v=>setForm({...form,lga:v}),t})),h(Inp,{label:"Address",val:form.address,set:v=>setForm({...form,address:v}),ph:"Street / area",t}),h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:10}},h(Inp,{label:"Weight kg",type:"number",val:form.weight,set:v=>setForm({...form,weight:v}),ph:"75",t}),h(Inp,{label:"Height cm",type:"number",val:form.height,set:v=>setForm({...form,height:v}),ph:"175",t}),h(Inp,{label:"BP",val:form.bp,set:v=>setForm({...form,bp:v}),ph:"120/80",t}),h(Inp,{label:"HR",type:"number",val:form.hr,set:v=>setForm({...form,hr:v}),ph:"72",t})),h(Sel,{label:"Status",val:form.status,set:v=>setForm({...form,status:v}),opts:["new","active","ambassador","volunteer","hub-supervisor"],t}),modal==="add"&&h(Inp,{label:"Set Password (optional — auto-generated if blank)",val:form.password,set:v=>setForm({...form,password:v}),ph:"At least 6 characters",t}),h("div",{style:{display:"flex",gap:10,marginTop:16}},h("button",{onClick:()=>setModal(null),style:{flex:1,background:"none",border:`1px solid ${t.border2}`,borderRadius:11,padding:"12px",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer"}},"Cancel"),h("button",{onClick:save,style:{flex:2,background:t.Y,border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},modal==="add"?"Add Member":"Save Changes")))
  );
}

/* ---------- Hubs (ADMIN ONLY) ---------- */
function HubsView({t,showNotif}){
  const vp=useViewport();const[sel,setSel]=useState(null);
  const hubs=getHubs();
  const CAP=50;
  const hubData=hubs.map(hub=>{const members=MEMBERS.filter(m=>m.hub===hub.hubKey);const cnt=members.length;const sessions=members.reduce((a,m)=>a+(m.sessions||0),0);const sup=members.find(m=>m.status==="hub-supervisor");return {...hub,members:cnt,sessions,supervisorName:sup?sup.name:(hub.supervisor||"\u2014")};});
  const anyMembers=hubData.some(h=>h.members>0);
  return h("div",{className:"fd"},
    h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}30`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}},h(Icon,{name:"building",size:18,color:t.Yt}),h("span",{style:{color:t.Yt,fontSize:12,fontWeight:700}},"Hub member counts update automatically as people register into each hub")),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"repeat(2,1fr)",gap:13}},hubData.map(hub=>h("div",{key:hub.id,style:{background:t.surf,border:`1px solid ${t.border}`,borderRadius:13,padding:"18px 20px"}},h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:12}},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:0}},hub.name),h(Pill,{color:hub.members>0?t.ok:t.text2,bg:`${hub.members>0?t.ok:t.text2}20`},hub.members>0?"active":"awaiting members")),h("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}},[["Members",hub.members],["Sessions",hub.sessions],["Capacity",CAP]].map(([l,v])=>h("div",{key:l,style:{background:t.surf2,borderRadius:9,padding:"9px 8px",textAlign:"center"}},h("p",{style:{color:t.text,fontSize:15,fontWeight:900,margin:"0 0 2px"}},v),h("p",{style:{color:t.text2,fontSize:9,margin:0}},l)))),h("div",{style:{height:5,background:t.surf3,borderRadius:4,marginBottom:10}},h("div",{style:{height:"100%",width:Math.min(100,Math.round((hub.members/CAP)*100))+"%",background:hub.members>=45?t.err:t.Y,borderRadius:4}})),hub.members>=45&&h("p",{style:{color:t.err,fontSize:11,fontWeight:700,margin:"0 0 8px"}},"Approaching capacity \u2014 consider splitting"),h("p",{style:{color:t.text2,fontSize:11,margin:"0 0 11px"}},"Supervisor: ",h("span",{style:{color:t.text,fontWeight:700}},hub.supervisorName)),h("button",{onClick:()=>setSel(hub),style:{width:"100%",background:"none",border:`1px solid ${t.border2}`,borderRadius:9,padding:"8px",fontSize:11,fontWeight:600,color:t.text,cursor:"pointer"}},"View Details \u2192")))),
    !anyMembers&&h("p",{style:{color:t.text2,fontSize:12,textAlign:"center",marginTop:18}},"Hubs are ready. As members register and choose their hub, counts and activity will populate here."),
    sel&&h(Modal,{t,title:sel.name,onClose:()=>setSel(null)},h("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}},[["Members",sel.members],["Sessions",sel.sessions],["Capacity",sel.members+"/"+CAP]].map(([l,v])=>h("div",{key:l,style:{background:t.surf2,borderRadius:11,padding:"14px",textAlign:"center"}},h("p",{style:{color:t.Y,fontSize:18,fontWeight:900,margin:"0 0 3px"}},v),h("p",{style:{color:t.text2,fontSize:10,margin:0}},l)))),h("div",{style:{background:t.surf2,borderRadius:12,padding:"14px 16px",marginBottom:16}},[["Supervisor",sel.supervisorName],["Location",sel.location]].map(([l,v])=>h("div",{key:l,style:{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${t.border}`}},h("span",{style:{color:t.text2,fontSize:12}},l),h("span",{style:{color:t.text,fontSize:12,fontWeight:700}},v)))),h("p",{style:{color:t.text2,fontSize:12,margin:0,lineHeight:1.6}},"Members in this hub: ",h("strong",{style:{color:t.text}},MEMBERS.filter(m=>m.hub===sel.hubKey).map(m=>m.name).join(", ")||"none yet"))));
}

/* ---------- Analytics (ADMIN ONLY) ---------- */
function AnalyticsView({t,showNotif}){
  const vp=useViewport();const[report,setReport]=useState(false);
  const totalMembers=MEMBERS.length;
  const totalSessions=MEMBERS.reduce((a,m)=>a+(m.sessions||0),0);
  const totalKm=MEMBERS.reduce((a,m)=>a+(m.km||0),0);
  const verified=MEMBERS.filter(m=>m.verified!==false).length;
  const avgStreak=totalMembers?Math.round(MEMBERS.reduce((a,m)=>a+(m.streak||0),0)/totalMembers):0;
  const att=loadAtt();const totalCheckins=att.log.length;
  const events=getEvents().length,challenges=getChallenges().length;
  /* members per hub for the bar chart */
  const hubCounts=HUBS_LIST.map(hk=>({hub:hk,n:MEMBERS.filter(m=>m.hub===hk).length}));
  const maxHub=Math.max(...hubCounts.map(h=>h.n),1);
  const hasData=totalSessions>0||totalCheckins>0;
  return h("div",{className:"fd"},
    h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,gap:12,flexWrap:"wrap"}},h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"repeat(4,1fr)",gap:12,flex:1}},[[totalMembers,"Members"],[totalSessions,"Sessions"],[totalKm.toFixed(0)+"km","Total Distance"],[totalCheckins,"Check-ins"]].map(([v,l])=>h(StatBox,{key:l,t,val:v,label:l}))),h("button",{onClick:()=>setReport(true),style:{background:t.Y,border:"none",borderRadius:9,padding:"11px 18px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer",whiteSpace:"nowrap"}},"Summary Report")),
    h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"3fr 2fr",gap:16}},h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 16px"}},"Members by Hub"),h("div",{style:{display:"flex",alignItems:"flex-end",gap:6,height:120}},hubCounts.map((hc,i)=>h("div",{key:i,style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,height:"100%"}},h("div",{style:{flex:1,width:"100%",display:"flex",alignItems:"flex-end"}},h("div",{style:{width:"100%",height:Math.round((hc.n/maxHub)*100)+"%",background:hc.n>0?t.Y:t.surf3,borderRadius:"3px 3px 0 0",minHeight:4}})),h("span",{style:{color:t.text3,fontSize:8,writingMode:vp.mobile?"vertical-rl":"horizontal-tb"}},hc.hub.slice(0,vp.mobile?6:9)))))),h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 14px"}},"Community Snapshot"),[["Verified members",verified+"/"+totalMembers],["Avg streak",avgStreak+" days"],["Active events",events],["Active challenges",challenges],["Hubs",HUBS_LIST.length]].map(([l,v])=>h("div",{key:l,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${t.border}`}},h("span",{style:{color:t.text2,fontSize:12}},l),h("span",{style:{color:t.text,fontSize:12,fontWeight:700}},v))))),
    !hasData&&h("p",{style:{color:t.text2,fontSize:12,textAlign:"center",marginTop:18}},"Analytics will grow as members register, log activities and attend programs."),
    report&&h(Modal,{t,title:"Community Summary",onClose:()=>setReport(false),wide:true},h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr 1fr":"repeat(3,1fr)",gap:10,marginBottom:18}},[["Members",totalMembers],["Sessions",totalSessions],["Total KM",totalKm.toFixed(0)+"km"],["Check-ins",totalCheckins],["Events",events],["Challenges",challenges]].map(([l,v])=>h("div",{key:l,style:{background:t.surf2,borderRadius:11,padding:"14px",textAlign:"center"}},h("p",{style:{color:t.Y,fontSize:18,fontWeight:900,margin:"0 0 3px"}},v),h("p",{style:{color:t.text2,fontSize:10,margin:0}},l)))),h("button",{onClick:()=>{showNotif("Summary ready");setReport(false);},style:{width:"100%",background:t.Y,border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer"}},"Done")));
}

/* ---------- Settings ---------- */
function SettingsView({t,user,isAdmin,dm,setDm,showNotif,onSignOut}){
  const vp=useViewport();const[,force]=useState(0);
  const[profile,setProfile]=useState({name:user.name,email:user.email,phone:user.phone||"",hub:user.hub});
  const saveProfile=()=>{const idx=MEMBERS.findIndex(m=>m.id===user.id);if(idx>-1){MEMBERS[idx]={...MEMBERS[idx],...profile,avatar:initials(profile.name)};persist();}showNotif("Profile updated");};
  const clearRemembered=()=>{saveRemembered(null);REMEMBERED=null;showNotif("Saved login cleared");force(x=>x+1);};
  const Section=({title,children})=>h(Card,{t},h("h3",{style:{color:t.text,fontSize:14,fontWeight:900,margin:"0 0 16px"}},title),children);
  const Toggle=({on,set,label,desc})=>h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}},h("div",null,h("p",{style:{color:t.text,fontSize:13,fontWeight:600,margin:"0 0 2px"}},label),desc&&h("p",{style:{color:t.text2,fontSize:11,margin:0}},desc)),h("div",{onClick:set,style:{width:46,height:26,borderRadius:14,background:on?t.Y:t.surf3,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}},h("div",{style:{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?23:3,transition:"left 0.2s"}})));
  return h("div",{className:"fd",style:{display:"flex",flexDirection:"column",gap:16,maxWidth:640}},
    h(Section,{title:"Profile"},h("div",{style:{display:"grid",gridTemplateColumns:vp.mobile?"1fr":"1fr 1fr",gap:12}},h(Inp,{label:"Name",val:profile.name,set:v=>setProfile({...profile,name:v}),t}),h(Inp,{label:"Email",val:profile.email,set:v=>setProfile({...profile,email:v}),t}),h(Inp,{label:"Phone",val:profile.phone,set:v=>setProfile({...profile,phone:v}),t}),h(Sel,{label:"Hub",val:profile.hub,set:v=>setProfile({...profile,hub:v}),opts:HUBS_LIST,t})),h("button",{onClick:saveProfile,style:{background:t.Y,border:"none",borderRadius:10,padding:"11px 20px",fontSize:13,fontWeight:800,color:"#080808",cursor:"pointer",marginTop:6}},"Save Profile")),
    h(Section,{title:"Appearance"},h(Toggle,{on:dm,set:()=>setDm(!dm),label:"Dark Mode",desc:"Switch between light and dark themes"})),
    h(Section,{title:"Security"},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}},h("div",null,h("p",{style:{color:t.text,fontSize:13,fontWeight:600,margin:"0 0 2px"}},"Remembered Login"),h("p",{style:{color:t.text2,fontSize:11,margin:0}},REMEMBERED?"This device remembers your login":"Not saved on this device")),h("button",{onClick:clearRemembered,disabled:!REMEMBERED,style:{background:REMEMBERED?t.surf3:"none",border:`1px solid ${t.border2}`,borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:600,color:REMEMBERED?t.text:t.text3,cursor:REMEMBERED?"pointer":"not-allowed"}},"Clear"))),
    isAdmin&&h(Section,{title:"Administrator"},h("div",{style:{background:t.Yd,border:`1px solid ${t.Y}30`,borderRadius:11,padding:"14px 16px"}},h("p",{style:{color:t.Yt,fontSize:12,fontWeight:700,margin:"0 0 4px"}},"You have full backend access"),h("p",{style:{color:t.text2,fontSize:11,margin:0,lineHeight:1.6}},"As the administrator, you alone can manage members, hubs, analytics and reset member passwords. Member accounts cannot access these controls."))),
    h(Section,{title:"About BefitAfrica"},h("p",{style:{color:t.text2,fontSize:12,lineHeight:1.7,margin:0}},"BefitAfrica \u2014 Africa's No. 1 Fitness NGO. \u201cFit to Lead.\u201d Building healthier communities across Lagos and beyond through accessible, community-driven fitness. Version 1.0")),
    h("button",{onClick:onSignOut,style:{background:"none",border:`1px solid ${t.err}50`,borderRadius:11,padding:"13px",fontSize:13,fontWeight:700,color:t.err,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}},h(Icon,{name:"signout",size:16,color:t.err}),"Sign Out")
  );
}

/* ============================================================
   ROOT APP — session, nav, responsive shell
   ============================================================ */
function App(){
  const[screen,setScreen]=useState("splash"); // splash | auth | verify | app
  const[user,setUser]=useState(null);
  const[dm,setDm]=useState(true);
  const[nav,setNav]=useState("dashboard");
  const[notif,setNotif]=useState(null);
  const[collapsed,setCollapsed]=useState(false);
  const[mobileNavOpen,setMobileNavOpen]=useState(false);
  const[pendingVerify,setPendingVerify]=useState(null); // {email,token}
  const vp=useViewport();const t=mkT(dm);
  const showNotif=useCallback((m,ty)=>{setNotif({m,t:ty});setTimeout(()=>setNotif(null),3000);},[]);
  const isAdmin=user&&user.role==="admin";

  /* On mount: auto-login from saved session so users aren't re-prompted to register */
  useEffect(()=>{
    let cancelled=false;
    if(typeof bfaRestoreSession==="function"){
      /* Cloud backend: restore Supabase session (async) */
      const splashWait=new Promise(r=>setTimeout(r,1400));
      Promise.all([bfaRestoreSession().catch(()=>null),splashWait]).then(([u])=>{
        if(cancelled)return;
        if(u){setUser(u);setScreen("app");}else setScreen("auth");
      });
      return()=>{cancelled=true;};
    }
    /* Local fallback */
    const sess=loadSession();
    const timer=setTimeout(()=>{
      if(sess){const fresh=MEMBERS.find(m=>m.id===sess.id&&m.email===sess.email);if(fresh){setUser(fresh);setScreen("app");return;}}
      setScreen("auth");
    },1600);
    return()=>clearTimeout(timer);
  },[]);

  const onLogin=(u)=>{if(!u){showNotif("Signed in, but your member profile wasn't found. Please contact the admin.","err");return;}setUser(u);setScreen("app");setNav("dashboard");showNotif("Welcome back, "+((u.name||"there").split(" ")[0])+"!");};
  const onNeedVerify=(email,token)=>{setPendingVerify({email,token});setScreen("verify");};
  const onVerified=(u)=>{saveSession(u);setUser(u);setScreen("app");setNav("dashboard");showNotif("Account verified! Welcome to BefitAfrica");};
  const onSignOut=()=>{if(typeof bfaLogout==="function"){bfaLogout();}else{saveSession(null);}setUser(null);setScreen("auth");setNav("dashboard");setMobileNavOpen(false);};

  if(screen==="splash")return h(Splash);
  if(screen==="auth")return h(React.Fragment,null,h(Notif,{n:notif}),h(Auth,{onLogin,onNeedVerify,dm,setDm}));
  if(screen==="verify")return h(React.Fragment,null,h(Notif,{n:notif}),h(VerifyNotice,{t,email:pendingVerify.email,token:pendingVerify.token,onVerified,onBack:()=>setScreen("auth")}));

  /* nav items — admin-only items gated */
  const allNav=[{id:"dashboard",icon:"dashboard",label:"Dashboard"},{id:"activity",icon:"run",label:"Activity / GPS"},{id:"attendance",icon:"clock",label:"Attendance"},{id:"health",icon:"heart",label:"My Health"},{id:"community",icon:"chat",label:"Community"},{id:"challenges",icon:"trophy",label:"Challenges"},{id:"events",icon:"calendar",label:"Events"},{id:"healthcenter",icon:"book",label:"Health Center"},{id:"members",icon:"members",label:"Members",admin:true},{id:"hubs",icon:"building",label:"Hubs",admin:true},{id:"analytics",icon:"chart",label:"Analytics",admin:true},{id:"settings",icon:"gear",label:"Settings"}];
  const navItems=allNav.filter(n=>!n.admin||isAdmin);
  const titles={dashboard:"Dashboard",activity:"Activity & GPS Tracking",attendance:"Attendance Clock",health:"My Health",community:"Community",challenges:"Challenges",events:"Events",healthcenter:"Health Education",members:"Member Management",hubs:"Hub Management",analytics:"Analytics",settings:"Settings"};

  const goNav=(id)=>{setNav(id);setMobileNavOpen(false);};

  const views={
    dashboard:h(DashMain,{t,user,isAdmin,setNav:goNav}),
    activity:h(ActivityTracker,{t,user,showNotif}),
    attendance:h(AttendanceView,{t,user,showNotif}),
    health:h(HealthDash,{t,user,showNotif}),
    community:h(Community,{t,user,showNotif}),
    challenges:h(ChallengesView,{t,user,isAdmin,showNotif}),
    events:h(EventsView,{t,user,isAdmin,showNotif}),
    healthcenter:h(HealthCenter,{t,showNotif}),
    members:isAdmin?h(MembersView,{t,showNotif}):null,
    hubs:isAdmin?h(HubsView,{t,showNotif}):null,
    analytics:isAdmin?h(AnalyticsView,{t,showNotif}):null,
    settings:h(SettingsView,{t,user,isAdmin,dm,setDm,showNotif,onSignOut})
  };

  /* ----- Mobile shell: top bar + bottom nav ----- */
  if(vp.mobile){
    const bottomItems=navItems.slice(0,4);
    return h("div",{style:{minHeight:"100vh",background:t.bg,paddingBottom:70}},
      h(Notif,{n:notif}),
      h("div",{style:{position:"sticky",top:0,zIndex:80,background:t.surf,borderBottom:`1px solid ${t.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}},h(Logo,{size:34,withText:true,t}),h("div",{style:{display:"flex",alignItems:"center",gap:10}},h("button",{onClick:()=>setDm(!dm),style:{background:t.surf2,border:`1px solid ${t.border}`,borderRadius:18,width:34,height:34,cursor:"pointer",fontSize:14}},dm?"☀":"☾"),h("button",{onClick:()=>setMobileNavOpen(true),style:{background:t.surf2,border:`1px solid ${t.border}`,borderRadius:18,width:34,height:34,cursor:"pointer",fontSize:15,color:t.text}},"\u2630"))),
      h("div",{style:{padding:"18px 16px"}},h("h1",{style:{color:t.text,fontSize:21,fontWeight:900,margin:"0 0 16px"}},titles[nav]),views[nav]),
      /* bottom nav */
      h("div",{style:{position:"fixed",bottom:0,left:0,right:0,zIndex:80,background:t.surf,borderTop:`1px solid ${t.border}`,display:"flex",justifyContent:"space-around",padding:"8px 4px"}},bottomItems.concat([{id:"__more",icon:"members",label:"More"}]).map(it=>h("button",{key:it.id,onClick:()=>it.id==="__more"?setMobileNavOpen(true):goNav(it.id),style:{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 8px",flex:1}},h("div",{style:{opacity:nav===it.id?1:0.55}},h(Icon,{name:it.icon,size:20,color:nav===it.id?t.Yt:t.text2})),h("span",{style:{fontSize:9,fontWeight:nav===it.id?800:500,color:nav===it.id?t.Yt:t.text2}},it.label)))),
      /* full nav drawer */
      mobileNavOpen&&h("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200},onClick:e=>{if(e.target===e.currentTarget)setMobileNavOpen(false);}},h("div",{className:"sl",style:{position:"absolute",right:0,top:0,bottom:0,width:260,background:t.surf,padding:"20px 16px",overflowY:"auto"}},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}},h(Logo,{size:32,withText:true,t}),h("button",{onClick:()=>setMobileNavOpen(false),style:{background:"none",border:"none",color:t.text2,fontSize:20,cursor:"pointer"}},"\u2715")),h("div",{style:{display:"flex",alignItems:"center",gap:10,padding:"12px",background:t.surf2,borderRadius:12,marginBottom:14}},h(Av,{init:user.avatar,size:38,t}),h("div",null,h("p",{style:{color:t.text,fontSize:13,fontWeight:800,margin:0}},user.name),h("p",{style:{color:t.text2,fontSize:10,margin:0}},isAdmin?"Administrator":statusLbl(user.status||"member")))),navItems.map(it=>h("button",{key:it.id,onClick:()=>goNav(it.id),style:{width:"100%",display:"flex",alignItems:"center",gap:12,background:nav===it.id?t.Yd:"none",border:"none",borderRadius:10,padding:"12px 14px",cursor:"pointer",marginBottom:4}},h(Icon,{name:it.icon,size:18,color:nav===it.id?t.Yt:t.text}),h("span",{style:{color:nav===it.id?t.Yt:t.text,fontSize:14,fontWeight:nav===it.id?800:500}},it.label),it.admin&&h(Icon,{name:"crown",size:11,color:t.Yt,style:{marginLeft:"auto"}}))),h("button",{onClick:onSignOut,style:{width:"100%",display:"flex",alignItems:"center",gap:12,background:"none",border:`1px solid ${t.err}40`,borderRadius:10,padding:"12px 14px",cursor:"pointer",marginTop:10,color:t.err,fontSize:14,fontWeight:600}},h(Icon,{name:"signout",size:16,color:t.err}),"Sign Out")))
    );
  }

  /* ----- Desktop shell: sidebar + topbar ----- */
  const sbW=collapsed?68:236;
  return h("div",{style:{minHeight:"100vh",background:t.bg,display:"flex"}},
    h(Notif,{n:notif}),
    /* Sidebar */
    h("div",{style:{width:sbW,background:t.surf,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,transition:"width 0.2s",zIndex:50}},
      h("div",{style:{padding:collapsed?"18px 0":"18px 20px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between"}},collapsed?h("img",{src:LOGO,style:{width:34,height:34,objectFit:"contain"}}):h(Logo,{size:36,withText:true,t,sub:"Fit to Lead"}),!collapsed&&h("button",{onClick:()=>setCollapsed(true),style:{background:"none",border:"none",color:t.text2,cursor:"pointer",fontSize:15}},"\u00ab")),
      collapsed&&h("button",{onClick:()=>setCollapsed(false),style:{background:"none",border:"none",color:t.text2,cursor:"pointer",fontSize:15,padding:"10px 0"}},"\u00bb"),
      h("div",{style:{flex:1,overflowY:"auto",padding:"12px 10px"}},navItems.map(it=>h("button",{key:it.id,onClick:()=>setNav(it.id),title:it.label,style:{width:"100%",display:"flex",alignItems:"center",gap:13,background:nav===it.id?t.Yd:"none",border:"none",borderRadius:10,padding:collapsed?"12px 0":"11px 14px",cursor:"pointer",marginBottom:3,justifyContent:collapsed?"center":"flex-start",position:"relative"}},h(Icon,{name:it.icon,size:18,color:nav===it.id?t.Yt:t.text}),!collapsed&&h("span",{style:{color:nav===it.id?t.Yt:t.text,fontSize:13.5,fontWeight:nav===it.id?800:500}},it.label),!collapsed&&it.admin&&h(Icon,{name:"crown",size:11,color:t.Yt,style:{marginLeft:"auto"}}),nav===it.id&&h("div",{style:{position:"absolute",left:0,top:8,bottom:8,width:3,background:t.Y,borderRadius:3}})))),
      h("div",{style:{padding:collapsed?"12px 0":"12px 14px",borderTop:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:10,justifyContent:collapsed?"center":"flex-start"}},h(Av,{init:user.avatar,size:36,t}),!collapsed&&h("div",{style:{flex:1,minWidth:0}},h("p",{style:{color:t.text,fontSize:12.5,fontWeight:800,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},user.name),h("p",{style:{color:t.text2,fontSize:10,margin:0}},isAdmin?"Admin":statusLbl(user.status||"member"))),!collapsed&&h("button",{onClick:onSignOut,title:"Sign out",style:{background:"none",border:"none",color:t.text2,cursor:"pointer",display:"flex",alignItems:"center"}},h(Icon,{name:"signout",size:16,color:t.text2})))
    ),
    /* Main */
    h("div",{style:{flex:1,marginLeft:sbW,transition:"margin-left 0.2s"}},
      h("div",{style:{position:"sticky",top:0,zIndex:40,background:t.surf+"F2",backdropFilter:"blur(8px)",borderBottom:`1px solid ${t.border}`,padding:"15px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}},h("div",null,h("h1",{style:{color:t.text,fontSize:19,fontWeight:900,margin:0}},titles[nav]),h("p",{style:{color:t.text2,fontSize:11,margin:"2px 0 0"}},new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}))),h("div",{style:{display:"flex",alignItems:"center",gap:12}},h("button",{onClick:()=>setDm(!dm),style:{background:t.surf2,border:`1px solid ${t.border}`,borderRadius:20,padding:"8px 14px",color:t.text2,cursor:"pointer",fontSize:12}},dm?"Light":"Dark"),isAdmin&&h(Pill,{color:t.Yt,bg:t.Yd},"Admin"))),
      h("div",{style:{padding:"24px 28px",maxWidth:1240,margin:"0 auto"}},views[nav])
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));

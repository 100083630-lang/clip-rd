"use client";
import { useState, useRef } from "react";

const IMAGES = [
  "/evidence1.jpg",
  "/evidence2.jpg",
  "/evidence3.jpg",
  "/evidence4.jpg",
];

export default function EvidenceGallery() {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollL = useRef(0);

  return (
    <>
      <section className="py-16 px-6 bg-[#0a0a0f]">
        <h2 className="text-3xl font-bold text-white mb-2">Pruebas reales, pagos verificados</h2>
        <p className="text-gray-400 mb-6">Arrastra para ver. Click para ampliar.</p>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto cursor-grab active:cursor-grabbing pb-4"
          onMouseDown={(e)=>{
            isDown.current=true;
            startX.current=e.pageX - (scrollRef.current?.offsetLeft||0);
            scrollL.current=scrollRef.current?.scrollLeft||0;
          }}
          onMouseMove={(e)=>{
            if(!isDown.current) return;
            const x=e.pageX - (scrollRef.current?.offsetLeft||0);
            const walk=(x-startX.current)*2;
            if(scrollRef.current) scrollRef.current.scrollLeft=scrollL.current-walk;
          }}
          onMouseUp={()=>isDown.current=false}
          onMouseLeave={()=>isDown.current=false}
        >
          {IMAGES.map((src,i)=>(
            <img key={i} src={src} alt={`evidencia ${i}`} onClick={()=>{setSelected(src); setZoom(1);}} className="min-w-[300px] h-[220px] object-cover rounded-2xl border border-white/10 cursor-pointer hover:scale-[1.02] transition" draggable={false} />
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} className="relative">
            <img src={selected} className="max-h-[90vh] max-w-[90vw] object-contain" style={{transform:`scale(${zoom})`}} onWheel={(e)=>setZoom(z=>Math.min(3,Math.max(1,z+e.deltaY*-0.001)))} />
            <button onClick={()=>setSelected(null)} className="absolute top-4 right-4 bg-white text-black w-10 h-10 rounded-full font-bold">X</button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              <button onClick={()=>setZoom(z=>Math.max(1,z-0.2))} className="bg-white/20 px-4 py-2 rounded-full text-white">-</button>
              <button onClick={()=>setZoom(1)} className="bg-white/20 px-4 py-2 rounded-full text-white">{Math.round(zoom*100)}%</button>
              <button onClick={()=>setZoom(z=>Math.min(3,z+0.2))} className="bg-white/20 px-4 py-2 rounded-full text-white">+</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

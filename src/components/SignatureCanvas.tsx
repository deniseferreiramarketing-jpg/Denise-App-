import React, { useRef, useState, useEffect } from "react";
import { Check, RotateCcw, PenTool } from "lucide-react";

interface SignatureCanvasProps {
  onSave: (base64: string) => void;
  savedSignature?: string;
  placeholderText?: string;
}

export default function SignatureCanvas({ onSave, savedSignature, placeholderText = "Assine aqui utilizando o dedo ou mouse" }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(savedSignature || null);

  useEffect(() => {
    if (savedSignature) {
      setTempSignature(savedSignature);
      setHasSigned(true);
    }
  }, [savedSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tempSignature) return;

    // Adjust for HighDPI screens
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1b242c"; // Deep charcoal slate matching Denise's theme
    ctx.lineWidth = 2.5;
  }, [tempSignature]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if it's a touch event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling when signing on mobile
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const base64 = canvas.toDataURL("image/png");
    setTempSignature(base64);
    onSave(base64);
  };

  const clearCanvas = () => {
    setTempSignature(null);
    setHasSigned(false);
    onSave("");
    
    // Clear in the next cycle when canvas is rendered again
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 50);
  };

  return (
    <div id="signature-block" class="w-full flex flex-col gap-2">
      <div class="relative w-full h-40 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden flex items-center justify-center">
        {tempSignature ? (
          <div class="relative w-full h-full flex items-center justify-center p-2 bg-stone-50">
            <img 
              id="signature-img"
              src={tempSignature} 
              alt="Assinatura" 
              class="max-h-full max-w-full object-contain pointer-events-none" 
            />
            <div class="absolute top-2 right-2 flex gap-1">
              <span class="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                <Check class="w-3.5 h-3.5" /> Registrada
              </span>
            </div>
          </div>
        ) : (
          <canvas
            id="signature-pad"
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            class="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
          />
        )}

        {!hasSigned && !tempSignature && (
          <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-xs text-stone-400 gap-1 bg-stone-50/50">
            <PenTool class="w-4 h-4 text-stone-300 animate-pulse" />
            <p>{placeholderText}</p>
          </div>
        )}
      </div>

      <div class="flex justify-between items-center px-1">
        <p class="text-xxs text-stone-400 italic">Preenchimento com assinatura digital criptográfica integrada.</p>
        <button
          id="btn-clear-signature"
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium py-1 px-3.5 rounded-md hover:bg-rose-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refazer assinatura
        </button>
      </div>
    </div>
  );
}

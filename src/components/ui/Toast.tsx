import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Text } from "./Text";

interface ToastProps {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
  durationMs?: number;
}

export function Toast({ message, onUndo, onClose, durationMs = 5000 }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for animation
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, handleClose]);

  return (
    <div 
      className={`fixed bottom-safe-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-background px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
        isClosing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
      role="alert"
    >
      <Text className="text-sm font-medium !text-inherit">{message}</Text>
      
      {onUndo && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            onUndo();
            handleClose();
          }}
          className="h-7 px-2 text-background/70 hover:text-background hover:bg-background/20"
        >
          Undo
        </Button>
      )}

      <button 
        onClick={handleClose}
        className="p-1 rounded-md opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

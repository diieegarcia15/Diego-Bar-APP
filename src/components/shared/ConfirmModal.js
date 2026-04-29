'use client';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'delete' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative glass-card bg-dark-800 border border-white/10 p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl ${type === 'delete' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
          {type === 'delete' ? '🗑️' : '⚠️'}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tight text-white">{title}</h3>
          <p className="text-sm text-gray-400">{message}</p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-4 font-black rounded-2xl transition-all shadow-lg text-xs uppercase tracking-widest ${type === 'delete' ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-yellow-500 text-dark-900 hover:bg-yellow-600 shadow-yellow-500/20'}`}
          >
            {type === 'delete' ? 'CONFIRMAR ELIMINACIÓN' : 'CONFIRMAR ACCIÓN'}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}

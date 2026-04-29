'use client';

export default function StatusBadge({ status }) {
  const styles = {
    recibido: 'bg-green-500/20 text-green-400 border-green-500/30',
    en_preparacion: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    listo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    entregado: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels = {
    recibido: 'RECIBIDO',
    en_preparacion: 'PREPARANDO',
    listo: 'LISTO',
    entregado: 'ENTREGADO',
  };

  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${styles[status] || styles.recibido}`}>
      {labels[status] || status}
    </span>
  );
}


import React from 'react';

interface QRCodeGeneratorProps {
  value: string;
  routeName: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, routeName }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`;

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-4">QR Code da Linha</h3>
      <div className="bg-slate-50 p-4 rounded-xl mb-4">
        <img src={qrUrl} alt={`QR Code for ${routeName}`} className="w-48 h-48" />
      </div>
      <p className="text-sm text-slate-500 text-center">
        Compartilhe este código para que usuários possam rastrear a linha <span className="font-semibold text-blue-600">{routeName}</span> instantaneamente.
      </p>
      <button 
        onClick={() => window.print()}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Imprimir QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;

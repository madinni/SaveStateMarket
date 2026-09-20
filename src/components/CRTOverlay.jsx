import React from 'react';

export default function CRTOverlay() {
  return (
    <>
      <div className="fixed inset-0 scanlines z-50 pointer-events-none"></div>
      <div className="fixed top-0 -left-10 w-80 h-80 bg-neon-pink/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-24 -right-10 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
    </>
  );
}
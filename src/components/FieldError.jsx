import React from "react";

export default function FieldError({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-1 text-[10px] font-bold text-neon-pink">
      ⚠ {error.message}
    </p>
  );
}

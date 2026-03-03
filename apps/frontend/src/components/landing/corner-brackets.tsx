'use client';

export default function CornerBrackets() {
  return (
    <>
      <div className="fixed w-7 h-7 z-[300] pointer-events-none top-5 left-5 border-t-2 border-l-2 border-yellow" />
      <div className="fixed w-7 h-7 z-[300] pointer-events-none top-5 right-5 border-t-2 border-r-2 border-yellow" />
      <div className="fixed w-7 h-7 z-[300] pointer-events-none bottom-5 left-5 border-b-2 border-l-2 border-yellow" />
      <div className="fixed w-7 h-7 z-[300] pointer-events-none bottom-5 right-5 border-b-2 border-r-2 border-yellow" />
    </>
  );
}

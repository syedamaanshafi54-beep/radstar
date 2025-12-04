'use client';

import Image from 'next/image';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <Image
        src="/Preloader-Lite.gif"
        alt="Loading..."
        width={80}
        height={80}
        className="w-20 h-20"
        unoptimized
      />
    </div>
  );
}

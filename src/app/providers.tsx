"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig 
        value={{
          fetcher: (url: string) => fetch(url).then(res => res.json()),
          revalidateOnFocus: false,
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
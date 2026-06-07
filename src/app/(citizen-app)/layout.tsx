import { CitizenPwaLayer } from "@/components/citizen/CitizenPwaLayer";

export default function CitizenAppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CitizenPwaLayer />
    </>
  );
}

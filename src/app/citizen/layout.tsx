import { CitizenPwaLayer } from "@/components/citizen/CitizenPwaLayer";

export default function CitizenRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CitizenPwaLayer />
    </>
  );
}

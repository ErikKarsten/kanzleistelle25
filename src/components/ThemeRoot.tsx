import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";

/** Bereiche, die immer hell bleiben (interne Dashboards) */
export const isLightOnlyPath = (path: string) =>
  /^\/(admin|admin-|dashboard|bewerber-dashboard)/.test(path);

/** Hell/Dunkel für die öffentliche Website – Auswahl wird im Browser gespeichert */
const ThemeRoot = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="k24-theme"
      forcedTheme={isLightOnlyPath(pathname) ? "light" : undefined}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};

export default ThemeRoot;

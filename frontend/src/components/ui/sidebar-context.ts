/**
 * Shares sidebar open state and responsive behavior through a hook that requires SidebarProvider.
 */
import * as React from "react";

// Define SidebarContextProps so callers and implementations agree on the required data shape.
export type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

// Use null as the missing-provider sentinel; the companion hook reports incorrect usage.
export const SidebarContext = React.createContext<SidebarContextProps | null>(
  null,
);

// Read sidebar state inside its provider rather than duplicating drawer state in a page.
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

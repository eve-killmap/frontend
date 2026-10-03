import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { WelcomeModal } from "@/components/common/welcome-modal";
import { ApiHealthNotice } from "@/components/common/api-health-notice";
import { LiveKillConnection } from "@/components/common/live-kill-connection";
import { CommandPalette } from "@/components/common/command-palette";
import { GlobalCommands } from "@/components/common/global-commands";
import { setNavigateTo } from "@/lib/navigation-functions";
import "./globals.css";

function NavigationBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigateTo((path) => navigate(path));
    return () => setNavigateTo(null);
  }, [navigate]);
  return null;
}

export default function RootLayout() {
  return (
    <>
      <NavigationBridge />
      <GlobalCommands />
      <LiveKillConnection />
      <div className="mobile-block">
        <div className="mobile-block-content">
          <h1>Desktop Only</h1>
          <p>
            EVE Killmap was built for desktop computers with WebGL capabilities.
          </p>
          <p>Visit on a computer for the full experience.</p>
        </div>
      </div>
      <div className="app-content">
        <Outlet />
      </div>
      <WelcomeModal />
      <ApiHealthNotice />
      <CommandPalette />
    </>
  );
}

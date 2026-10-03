import { createContext, RefObject } from "react";
import { OrbitControls } from "three-stdlib";

export const ControlsContext = createContext<{
  controlsRef: RefObject<OrbitControls | null>;
  animateTo: (position: [number, number, number]) => void;
} | null>(null);

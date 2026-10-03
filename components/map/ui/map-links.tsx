import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/common/app-link";

interface MapLink {
  icon: string;
  alt: string;
  link: string;
  text: string;
}

const MAP_LINKS = {
  "new-eden": {
    icon: "/icons/epic_arc_32.png",
    alt: "New Eden",
    link: "/",
    text: "New Eden Map",
  },
  anoikis: {
    icon: "/icons/wormholes_32.png",
    alt: "Anoikis",
    link: "/anoikis",
    text: "Anoikis Map",
  },
  "abyssal-deadspace": {
    icon: "/icons/abyssal_filament_32.png",
    alt: "Abyssal Deadspace",
    link: "/abyssal-deadspace",
    text: "Abyssal Deadspace Map",
  },
  tutorials: {
    icon: "/icons/enforcer_agent_32.png",
    alt: "Tutorials",
    link: "/tutorials",
    text: "Tutorial System Map",
  },
} as Record<string, MapLink>;

interface MapLinksProps {
  mapType: string;
}

export function MapLinks({ mapType }: MapLinksProps) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(MAP_LINKS)
        .filter(([key]) => key !== mapType)
        .map(([key, link]) => (
          <Button
            key={key}
            asChild
            variant="outline"
            size="lg"
            className="group btn-glass"
          >
            <AppLink to={link.link}>
              <img
                className="opacity-70 group-hover:opacity-100 transition-opacity w-6 h-6"
                src={link.icon}
                alt={link.alt}
                loading="eager"
              />
              {link.text}
            </AppLink>
          </Button>
        ))}
    </div>
  );
}

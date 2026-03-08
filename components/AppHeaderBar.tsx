"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  findings: "Funde",
  new: "Neuer Fund",
  map: "Karte",
  "image-gallery": "Foto-Gallerie",
  tags: "Tags",
  categories: "Kategorien",
  settings: "Einstellungen",
};

function useFindingName(id: string | null) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/findings/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.finding?.name) setName(data.finding.name);
      })
      .catch(() => {});
  }, [id]);
  return name;
}

function isUUID(segment: string): boolean {
  return /^[0-9a-f]{8}-/.test(segment);
}

export function AppHeaderBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).filter((s) => s !== "dashboard");

  // Find UUID segment that appears after "findings" for name resolution
  const allSegments = pathname.split("/").filter(Boolean);
  const findingsIndex = allSegments.indexOf("findings");
  const dynamicId =
    findingsIndex >= 0 && findingsIndex + 1 < allSegments.length
      ? allSegments[findingsIndex + 1]
      : null;
  const resolvedFindingId =
    dynamicId && !SEGMENT_LABELS[dynamicId] ? dynamicId : null;
  const findingName = useFindingName(resolvedFindingId);

  function getLabel(segment: string): string {
    if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
    if (isUUID(segment) || (resolvedFindingId === segment)) {
      if (findingName) return findingName;
      return segment.substring(0, 8) + "...";
    }
    // Capitalize unknown segments
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  function getHref(index: number): string {
    return "/dashboard/" + segments.slice(0, index + 1).join("/");
  }

  return (
    <div className="flex h-[60px] w-full shrink-0 items-center bg-black px-6 z-50">
      <nav className="flex items-center gap-2 text-2xl md:text-3xl lg:text-4xl font-bold">
        <Link href="/dashboard" className="text-white hover:text-gray-300 transition-colors">
          Detektor Hub
        </Link>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label = getLabel(segment);
          return (
            <span key={index} className="flex items-center gap-2">
              <span className="text-gray-500">&gt;</span>
              {isLast ? (
                <span className="text-white">{label}</span>
              ) : (
                <Link
                  href={getHref(index)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

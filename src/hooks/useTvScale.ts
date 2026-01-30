import { useState, useEffect, useMemo } from "react";

export type TvPhotoSize = "sm" | "md" | "lg";

interface TvScaleResult {
  /** Multiplier for sizes (0.8-2.0) */
  scale: number;
  /** Photo size variant for WrestlerImage */
  photoSize: TvPhotoSize;
  /** Current viewport dimensions */
  dimensions: { width: number; height: number };
  /** True if 1440p+ resolution */
  isLargeScreen: boolean;
  /** Responsive grid gap class */
  gridGapClass: string;
  /** Responsive column spans */
  mainColSpan: string;
  sideColSpan: string;
  /** Computed optimal cell size in pixels */
  cellSize: number;
}

export function useTvScale(): TvScaleResult {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  }));

  useEffect(() => {
    const update = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Calculate scale based on BOTH width and height
  const scale = useMemo(() => {
    const widthScale = (() => {
      if (dimensions.width >= 3840) return 2.0;      // 4K
      if (dimensions.width >= 2560) return 1.5;      // 1440p
      if (dimensions.width >= 1920) return 1.25;     // 1080p+
      if (dimensions.width >= 1600) return 1.0;      // Standard
      return 0.85;                                    // Smaller screens
    })();
    
    const heightScale = (() => {
      if (dimensions.height >= 2160) return 2.0;     // 4K height
      if (dimensions.height >= 1440) return 1.5;     // 1440p height
      if (dimensions.height >= 1080) return 1.25;    // 1080p height
      if (dimensions.height >= 900) return 1.0;      // Standard height
      return 0.85;                                    // Smaller screens
    })();
    
    // Use the smaller of the two to ensure content fits
    return Math.min(widthScale, heightScale);
  }, [dimensions.width, dimensions.height]);

  // Determine photo size variant
  const photoSize = useMemo((): TvPhotoSize => {
    if (scale >= 2.0) return "lg";
    if (scale >= 1.25) return "md";
    return "sm";
  }, [scale]);

  // Responsive grid gap
  const gridGapClass = useMemo(() => {
    if (scale >= 2.0) return "gap-3";
    if (scale >= 1.5) return "gap-2.5";
    return "gap-2";
  }, [scale]);

  // Calculate optimal cell size based on viewport
  const cellSize = useMemo(() => {
    // 10 columns + gaps (9 x gap) + padding (2 x 24px)
    const availableWidth = dimensions.width - 48; // 24px padding each side
    const gapSize = scale >= 2.0 ? 12 : scale >= 1.5 ? 10 : 8;
    const maxCellWidth = (availableWidth - (9 * gapSize)) / 10;
    
    // Also consider height (3 rows + winner section + predictions)
    const availableHeight = dimensions.height - 200; // Header + padding + ticker
    const maxCellHeight = (availableHeight - (2 * gapSize)) / 3 * 0.8; // 80% of row height
    
    return Math.min(maxCellWidth, maxCellHeight);
  }, [dimensions.width, dimensions.height, scale]);

  // Responsive layout columns
  const isLargeScreen = scale >= 1.25;
  const mainColSpan = isLargeScreen ? "col-span-10" : "col-span-9";
  const sideColSpan = isLargeScreen ? "col-span-2" : "col-span-3";

  return {
    scale,
    photoSize,
    dimensions,
    isLargeScreen,
    gridGapClass,
    mainColSpan,
    sideColSpan,
    cellSize,
  };
}

import { useLanguage } from '@/contexts/LanguageContext';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WeedDetection {
  type: string;
  location: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

interface BoundingBoxOverlayProps {
  weeds: WeedDetection[];
  containerWidth: number;
  containerHeight: number;
  originalWidth?: number;
  originalHeight?: number;
}

export function BoundingBoxOverlay({
  weeds,
  containerWidth,
  containerHeight,
  originalWidth = 1280,
  originalHeight = 720,
}: BoundingBoxOverlayProps) {
  const { t } = useLanguage();

  if (!weeds || weeds.length === 0) return null;

  // Calculate scale factors
  const scaleX = containerWidth / originalWidth;
  const scaleY = containerHeight / originalHeight;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {weeds.map((weed, index) => {
        if (!weed.boundingBox) return null;

        const { x, y, width, height } = weed.boundingBox;

        // Scale bounding box to container size
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;

        return (
          <div
            key={index}
            className="absolute animate-pulse-slow"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
          >
            {/* Bounding box */}
            <div
              className="absolute inset-0 border-4 border-red-500 rounded-sm"
              style={{
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239, 68, 68, 0.1)',
              }}
            />
            
            {/* Label */}
            <div
              className="absolute -top-8 left-0 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-t-md whitespace-nowrap"
              style={{
                minWidth: '80px',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              <span className="mr-2">🌿</span>
              {weed.type}
              <span className="ml-2 opacity-90">{weed.confidence}%</span>
            </div>

            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-red-400 rounded-tl-sm" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-red-400 rounded-tr-sm" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-red-400 rounded-bl-sm" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-red-400 rounded-br-sm" />
          </div>
        );
      })}

      {/* Detection count badge */}
      <div className="absolute top-3 left-3 px-3 py-2 bg-red-500/90 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg">
        <span className="text-lg">⚠️</span>
        <span>{weeds.length} {weeds.length === 1 ? 'Weed' : 'Weeds'} Detected</span>
      </div>
    </div>
  );
}

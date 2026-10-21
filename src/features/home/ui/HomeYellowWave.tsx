import { SwimDripWave } from '@/features/home/ui/SwimDripWave';
import { YELLOW_DRIP } from '@/features/home/ui/wave-paths';

type HomeYellowWaveProps = {
  className?: string;
};

/**
 * Figma yellow drip-wave band:
 * - Rectangle 3 (1:79) — categories
 * - Rectangle 5 (1:80) — reviews transition
 */
export function HomeYellowWave({ className = '' }: HomeYellowWaveProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative w-full max-h-[1225px] ${className}`}
      style={{ aspectRatio: '1507.5 / 1225' }}
    >
      <div className="absolute inset-0">
        <SwimDripWave spec={YELLOW_DRIP} />
      </div>
    </div>
  );
}

import { cn } from '../lib/utils'

/**
 * Clinical AI Confidence Meter
 * 
 * A horizontal progress bar displaying model confidence with percentage value.
 * Designed for healthcare screening dashboards with medical-tech aesthetics.
 * 
 * @param {number} confidence - Confidence score (0-1 or 0-100)
 * @param {string} label - Optional custom label (default: "Model Confidence")
 * @param {boolean} showDisclaimer - Show medical disclaimer (default: true)
 * @param {string} variant - Visual variant: 'clinical' | 'quantum' | 'classical' (default: 'clinical')
 * @param {string} size - Size variant: 'compact' | 'standard' (default: 'standard')
 * @param {string} className - Additional CSS classes
 */
export default function ConfidenceMeter({
  confidence,
  label = 'Model Confidence',
  showDisclaimer = true,
  variant = 'clinical',
  size = 'standard',
  className,
}) {
  // Normalize confidence to 0-1 range
  const normalized = confidence > 1 ? confidence / 100 : confidence
  const clamped = Math.max(0, Math.min(1, normalized))
  const percentage = Math.round(clamped * 100)

  // Variant-specific color tokens
  const variantStyles = {
    clinical: {
      track: 'bg-void/60',
      fill: 'bg-clinical-gradient',
      fillGlow: 'shadow-clinical-glow',
      text: 'text-ink',
      labelText: 'text-muted',
      percentageText: 'text-ink tabular',
    },
    quantum: {
      track: 'bg-void/60',
      fill: 'bg-quantum',
      fillGlow: 'shadow-quantum-glow',
      text: 'text-ink',
      labelText: 'text-muted',
      percentageText: 'text-quantum tabular',
    },
    classical: {
      track: 'bg-void/60',
      fill: 'bg-classical',
      fillGlow: 'shadow-classical-glow',
      text: 'text-ink',
      labelText: 'text-muted',
      percentageText: 'text-classical tabular',
    },
  }

  const v = variantStyles[variant] || variantStyles.clinical

  // Size variants
  const sizeStyles = {
    compact: {
      container: 'gap-2',
      label: 'text-fine-print',
      barHeight: 'h-2',
      radius: 'rounded-pill',
      percentage: 'text-fine-print',
      disclaimer: 'text-micro-legal',
      gap: 'gap-1.5',
    },
    standard: {
      container: 'gap-3',
      label: 'text-caption-strong',
      barHeight: 'h-3',
      radius: 'rounded-[10px]',
      percentage: 'text-caption tabular',
      disclaimer: 'text-fine-print',
      gap: 'gap-2',
    },
  }

  const s = sizeStyles[size] || sizeStyles.standard

  // Determine confidence tier for semantic coloring (optional enhancement)
  const getConfidenceTier = (value) => {
    if (value >= 0.9) return 'very-high'
    if (value >= 0.75) return 'high'
    if (value >= 0.6) return 'moderate'
    if (value >= 0.4) return 'low'
    return 'very-low'
  }

  const tier = getConfidenceTier(clamped)

  return (
    <div
      className={cn(
        'flex flex-col',
        s.container,
        s.gap,
        className
      )}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${percentage}%`}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className={cn(s.label, 'font-medium', v.labelText)}>
          {label}
        </span>
        <span 
          className={cn(
            s.percentage, 
            'font-mono font-variant-numeric tabular-nums',
            v.percentageText
          )}
          aria-hidden="true"
        >
          {percentage}%
        </span>
      </div>

      {/* Progress bar track */}
      <div className="relative w-full overflow-hidden" style={{ height: size === 'compact' ? '8px' : '12px' }}>
        <div
          className={cn(
            'absolute inset-0',
            v.track,
            s.radius
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            'absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out',
            s.radius,
            v.fill,
            v.fillGlow
          )}
          style={{ width: `${percentage}%` }}
          role="img"
          aria-label={`Confidence level: ${percentage} percent`}
        >
          {/* Subtle shine overlay for depth */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Medical disclaimer */}
      {showDisclaimer && (
        <p
          className={cn(
            s.disclaimer,
            'text-muted',
            'leading-tight'
          )}
        >
          Model confidence is not a medical diagnosis or clinical certainty.
        </p>
      )}
    </div>
  )
}
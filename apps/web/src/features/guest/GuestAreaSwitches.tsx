import { GUEST_AREA_LABELS, GUEST_AREAS_AVAILABLE, type GuestArea } from '@qawm/shared';
import { Switch } from '@/components/ui/switch';

/**
 * One switch per area that exists so far (BR-GUEST-02). Areas of later phases stay as they are in `value`,
 * so saving here never changes them.
 */
export function GuestAreaSwitches({
  value,
  onChange,
  disabled,
}: {
  value: GuestArea[];
  onChange: (areas: GuestArea[]) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Areas Guests can see" className="flex flex-col divide-y">
      {GUEST_AREAS_AVAILABLE.map((area) => (
        <Switch
          key={area}
          label={GUEST_AREA_LABELS[area]}
          checked={value.includes(area)}
          disabled={disabled}
          onChange={(on) =>
            onChange(on ? [...value, area] : value.filter((other) => other !== area))
          }
        />
      ))}
    </div>
  );
}

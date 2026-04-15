type SoftCharacterCounterProps = {
  value?: string;
  softMax: number;
  hardMax: number;
};

export function SoftCharacterCounter({
  value = '',
  softMax,
  hardMax,
}: SoftCharacterCounterProps) {
  const length = value.trim().length;

  let tone: 'ok' | 'warning' | 'danger' = 'ok';
  if (length > hardMax) tone = 'danger';
  else if (length > softMax) tone = 'warning';

  return (
    <p className={`soft-counter soft-counter--${tone}`}>
      {length}/{hardMax}
      {length > softMax && length <= hardMax ? ' — un peu long' : ''}
      {length > hardMax ? ' — à raccourcir' : ''}
    </p>
  );
}

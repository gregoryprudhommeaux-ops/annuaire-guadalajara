import { Link } from 'react-router-dom';

export type LinkToProfileProps = {
  memberId: string;
  label: string;
};

export function LinkToProfile({ memberId, label }: LinkToProfileProps) {
  const to = `/profil/${encodeURIComponent(memberId)}`;
  return (
    <div className="member-card__footer">
      <Link
        to={to}
        className="member-card__link"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {label}
      </Link>
    </div>
  );
}

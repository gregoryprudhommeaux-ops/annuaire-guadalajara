export type ProfileMatchBoxProps = {
  title: string;
  matchedNeeds: string[];
  reason: string;
};

export function ProfileMatchBox({ title, matchedNeeds, reason }: ProfileMatchBoxProps) {
  return (
    <div className="profile-matchbox mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <div className="min-w-0">
          <p className="profile-matchbox__title text-sm font-semibold text-emerald-800">{title}</p>
          <p className="profile-matchbox__reason mt-1 text-sm text-emerald-700">{reason}</p>

          <div className="profile-matchbox__chips mt-2 flex flex-wrap gap-2">
            {matchedNeeds.map((need, i) => (
              <span
                key={`${need}-${i}`}
                className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700"
              >
                {need}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

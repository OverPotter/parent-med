interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isVisible: boolean;
  onToggleVisibility?: () => void;
  autoComplete?: string;
  name?: string;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
      <path
        d="M2.75 12s3.5-6 9.25-6 9.25 6 9.25 6-3.5 6-9.25 6S2.75 12 2.75 12Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.85" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
      <path d="M3.5 4.5 20.5 19.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M10.6 5.2A10.4 10.4 0 0 1 12 5.1c5.75 0 9.25 6 9.25 6a17.7 17.7 0 0 1-3.48 4.08M6.96 8.08A17.16 17.16 0 0 0 2.75 12s3.5 6 9.25 6c1.5 0 2.85-.41 4.06-1.03"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 9.88A3 3 0 0 0 14.12 14.12"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuthPasswordField({
  label,
  value,
  onChange,
  placeholder,
  isVisible,
  onToggleVisibility,
  autoComplete,
  name,
}: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="soft-field-label">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`soft-input w-full px-4 ${onToggleVisibility ? "pr-12" : ""}`.trim()}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
            aria-label={isVisible ? "Скрыть пароль" : "Показать пароль"}
            title={isVisible ? "Скрыть пароль" : "Показать пароль"}
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </span>
    </label>
  );
}

interface RememberMeCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RememberMeCard({ checked, onChange }: RememberMeCardProps) {
  return (
    <label className="soft-panel flex items-start gap-3 rounded-[28px] px-4 py-4">
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span className="h-5 w-5 rounded-md border border-border/80 bg-background transition-colors peer-checked:border-primary peer-checked:bg-primary/15" />
        <span className="pointer-events-none absolute text-[11px] font-semibold text-primary opacity-0 transition-opacity peer-checked:opacity-100">
          ✓
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[0.96rem] font-bold tracking-[-0.025em] text-foreground">
          Запомнить меня
        </span>
        <span className="soft-field-hint mt-1">
          На этом устройстве вход сохранится дольше, но пароль мы не храним.
        </span>
      </span>
    </label>
  );
}

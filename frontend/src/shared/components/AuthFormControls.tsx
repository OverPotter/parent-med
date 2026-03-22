interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isVisible: boolean;
  autoComplete?: string;
  name?: string;
}

export function AuthPasswordField({
  label,
  value,
  onChange,
  placeholder,
  isVisible,
  autoComplete,
  name,
}: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <input
        name={name}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="soft-input w-full rounded-2xl px-4 py-3"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}

interface RememberMeCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RememberMeCard({ checked, onChange }: RememberMeCardProps) {
  return (
    <label className="soft-panel flex items-start gap-3 rounded-[22px] px-4 py-4">
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
        <span className="block text-sm font-medium text-foreground">Запомнить меня</span>
        <span className="mt-1 block text-xs leading-5 text-muted">
          На этом устройстве вход сохранится дольше, но пароль мы не храним.
        </span>
      </span>
    </label>
  );
}

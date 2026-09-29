import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const KENDALI =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-kecil text-ink min-h-11 placeholder:text-ink-muted focus:border-primary disabled:opacity-55 disabled:cursor-not-allowed";

const KENDALI_GALAT = "border-danger focus:border-danger";

function Bungkus({
  name,
  label,
  galat,
  petunjuk,
  wajib,
  children,
}: {
  name: string;
  label: string;
  galat?: string;
  petunjuk?: string;
  wajib?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-kecil font-semibold text-ink">
        {label}
        {wajib ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {galat ? (
        <p id={`${name}-galat`} className="mt-1.5 text-kecil font-medium text-danger">
          {galat}
        </p>
      ) : petunjuk ? (
        <p id={`${name}-petunjuk`} className="mt-1.5 text-kecil text-ink-muted">
          {petunjuk}
        </p>
      ) : null}
    </div>
  );
}

/** Atribut aksesibilitas yang sama untuk semua kendali: galat diumumkan sekali. */
function aturAria(name: string, galat?: string, petunjuk?: string) {
  return {
    "aria-invalid": galat ? true : undefined,
    "aria-describedby": galat ? `${name}-galat` : petunjuk ? `${name}-petunjuk` : undefined,
  } as const;
}

export interface KolomProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  galat?: string;
  petunjuk?: string;
}

export function Kolom({ label, name, galat, petunjuk, className = "", ...sisa }: KolomProps) {
  return (
    <Bungkus
      name={name}
      label={label}
      galat={galat}
      petunjuk={petunjuk}
      wajib={sisa.required}
    >
      <input
        {...sisa}
        {...aturAria(name, galat, petunjuk)}
        id={name}
        name={name}
        className={[KENDALI, galat ? KENDALI_GALAT : "", className].filter(Boolean).join(" ")}
      />
    </Bungkus>
  );
}

export interface PilihanOpsi {
  nilai: string | number;
  label: string;
}

export interface PilihanProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  opsi: PilihanOpsi[];
  galat?: string;
  petunjuk?: string;
  kosong?: string;
}

export function Pilihan({
  label,
  name,
  opsi,
  galat,
  petunjuk,
  kosong,
  className = "",
  ...sisa
}: PilihanProps) {
  return (
    <Bungkus
      name={name}
      label={label}
      galat={galat}
      petunjuk={petunjuk}
      wajib={sisa.required}
    >
      <select
        {...sisa}
        {...aturAria(name, galat, petunjuk)}
        id={name}
        name={name}
        className={[KENDALI, galat ? KENDALI_GALAT : "", className].filter(Boolean).join(" ")}
      >
        {kosong ? <option value="">{kosong}</option> : null}
        {opsi.map((item) => (
          <option key={item.nilai} value={item.nilai}>
            {item.label}
          </option>
        ))}
      </select>
    </Bungkus>
  );
}

export interface CatatanProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  galat?: string;
  petunjuk?: string;
}

export function Catatan({ label, name, galat, petunjuk, className = "", ...sisa }: CatatanProps) {
  return (
    <Bungkus
      name={name}
      label={label}
      galat={galat}
      petunjuk={petunjuk}
      wajib={sisa.required}
    >
      <textarea
        {...sisa}
        {...aturAria(name, galat, petunjuk)}
        id={name}
        name={name}
        rows={sisa.rows ?? 3}
        className={[KENDALI, "min-h-0", galat ? KENDALI_GALAT : "", className]
          .filter(Boolean)
          .join(" ")}
      />
    </Bungkus>
  );
}

/** Kotak centang dengan label sebaris, tetap target sentuh 44px. */
export function Centang({
  name,
  label,
  defaultChecked,
  checked,
  onChange,
  nilai = "on",
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (peristiwa: React.ChangeEvent<HTMLInputElement>) => void;
  nilai?: string;
}) {
  return (
    <label
      htmlFor={`${name}-${nilai}`}
      className="flex min-h-11 cursor-pointer items-center gap-2.5 text-kecil text-ink"
    >
      <input
        id={`${name}-${nilai}`}
        name={name}
        type="checkbox"
        value={nilai}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
        className="h-4.5 w-4.5 shrink-0 rounded-sm border border-line accent-primary"
      />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

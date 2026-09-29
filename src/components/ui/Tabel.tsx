import type { ReactNode } from "react";

/** Pembungkus tabel. Di layar sempit tabel digeser mendatar di dalam kotaknya,
 *  bukan membuat seluruh halaman geser. */
export function Tabel({ children, minWidth = "44rem" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-kecil" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function KepalaTabel({ kolom }: { kolom: { label: string; num?: boolean }[] }) {
  return (
    <thead>
      <tr className="border-b border-line text-left">
        {kolom.map((item) => (
          <th
            key={item.label}
            scope="col"
            className={`px-4 py-2.5 text-mini font-semibold uppercase tracking-wide text-ink-muted ${
              item.num ? "num text-right" : ""
            }`}
          >
            {item.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function BarisTabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tr className={className}>{children}</tr>;
}

export function SelTabel({
  children,
  num,
  className = "",
}: {
  children: ReactNode;
  num?: boolean;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 align-middle text-ink ${num ? "num text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}

"use client";

import React from "react";

/**
 * Komponen Ikon berbasis Ionicons (https://ionic.io/ionicons).
 * Menyediakan SVG bawaan berpresisi tinggi untuk ikon utama agar render
 * instan tanpa layout shift, sekaligus mendukung fallback fleksibel.
 */

interface IonIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number | string;
}

export function IonIcon({ name, className = "", size = "1.2em", ...props }: IonIconProps) {
  const norm = name.toLowerCase().replace(/_/g, "-");

  // Ikon-ikon utama Ionicons versi v7 (https://ionic.io/ionicons)
  switch (norm) {
    case "notifications":
    case "notifications-sharp":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 480a80.09 80.09 0 0073.3-48H182.7a80.09 80.09 0 0073.3 48zm144-192v-64a144 144 0 00-128-142.36V64a16 16 0 00-32 0v17.64A144 144 0 00112 224v64l-32 64v32h352v-32z" />
        </svg>
      );

    case "notifications-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M427.68 351.43C402 320 383.87 304 383.87 217.35 383.87 138 343.35 109.73 310 96c-4.43-1.82-8.6-6-9.95-10.55C294.71 65.22 277.4 48 256 48s-38.71 17.22-44 37.45c-1.35 4.6-5.52 8.73-10 10.55-33.35 13.73-73.87 41.95-73.87 121.35 0 86.6-18.12 102.6-43.81 134.08A27.5 27.5 0 00105.74 394h300.52a27.5 27.5 0 0021.42-42.57zM320 394a64 64 0 01-128 0" />
        </svg>
      );

    case "chevron-down":
    case "chevron-down-outline":
    case "expand-more":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="48"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M112 184l144 144 144-144" />
        </svg>
      );

    case "person":
    case "person-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96zM256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" />
        </svg>
      );

    case "person-circle":
    case "person-circle-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M258 480a224 224 0 10-2-448 224 224 0 002 448zM344 192a88 88 0 11-176 0 88 88 0 01176 0zM128 416c12.33-46.7 65.62-80 128-80s115.67 33.3 128 80" />
        </svg>
      );

    case "checkmark":
    case "checkmark-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="40"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M416 128L192 384l-96-96" />
        </svg>
      );

    case "checkmark-circle":
    case "checkmark-circle-outline":
    case "check-circle":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z" />
        </svg>
      );

    case "checkmark-done":
    case "checkmark-done-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284" />
        </svg>
      );

    case "trash":
    case "trash-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320M80 112h352M192 112V72h128v40M256 176v224M184 176l8 224M328 176l-8 224" />
        </svg>
      );

    case "close":
    case "close-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M368 368L144 144M368 144L144 368" />
        </svg>
      );

    case "settings":
    case "settings-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4z" />
          <path d="M416.39 256a160 160 0 00-1.8-24l42.4-33.2a10.2 10.2 0 002.4-13.1l-40-69.3a10.2 10.2 0 00-12.4-4.5l-50 20.1a162.7 162.7 0 00-41.6-24.1l-7.6-53.1A10.2 10.2 0 00297.8 44h-80a10.2 10.2 0 00-10.1 8.8l-7.6 53.1a162.7 162.7 0 00-41.6 24.1l-50-20.1a10.2 10.2 0 00-12.4 4.5l-40 69.3a10.2 10.2 0 002.4 13.1l42.4 33.2a160 160 0 00-1.8 24 160 160 0 001.8 24l-42.4 33.2a10.2 10.2 0 00-2.4 13.1l40 69.3a10.2 10.2 0 0012.4 4.5l50-20.1a162.7 162.7 0 0041.6 24.1l7.6 53.1a10.2 10.2 0 0010.1 8.8h80a10.2 10.2 0 0010.1-8.8l7.6-53.1a162.7 162.7 0 0041.6-24.1l50 20.1a10.2 10.2 0 0012.4-4.5l40-69.3a10.2 10.2 0 00-2.4-13.1l-42.4-33.2a160 160 0 001.8-24z" />
        </svg>
      );

    case "log-out":
    case "log-out-outline":
    case "logout":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M304 336v40a40 40 0 01-40 40H104a40 40 0 01-40-40V136a40 40 0 0140-40h160a40 40 0 0140 40v40M384 176l80 80-80 80M192 256h272" />
        </svg>
      );

    case "receipt":
    case "receipt-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M160 336h192M160 256h192M160 176h192" />
          <path d="M400 448l-48-32-48 32-48-32-48 32-48-32-48 32V80a16 16 0 0116-16h256a16 16 0 0116 16z" />
        </svg>
      );

    case "book":
    case "book-outline":
    case "menu-book":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 160c16-63.16 76.43-95.41 208-96a15.66 15.66 0 0116 16v288a16 16 0 01-16 16c-128 0-176 32-208 80-32-48-80-80-208-80a16 16 0 01-16-16V80a15.66 15.66 0 0116-16c131.57.59 192 32.84 208 96zM256 160v288" />
        </svg>
      );

    case "time":
    case "time-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64zM256 128v128h96" />
        </svg>
      );

    case "grid":
    case "grid-outline":
    case "dashboard":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <rect x="48" y="48" width="176" height="176" rx="20" ry="20" />
          <rect x="288" y="48" width="176" height="176" rx="20" ry="20" />
          <rect x="48" y="288" width="176" height="176" rx="20" ry="20" />
          <rect x="288" y="288" width="176" height="176" rx="20" ry="20" />
        </svg>
      );

    case "shirt":
    case "shirt-outline":
    case "orders":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M314.56 48a4 4 0 00-2.8 1.17l-55.76 55.65-55.76-55.65a4 4 0 00-2.8-1.17H128c-17.67 0-32 14.33-32 32v64a4 4 0 001.17 2.83L144 192v256a16 16 0 0016 16h192a16 16 0 0016-16V192l46.83-45.17a4 4 0 001.17-2.83V80c0-17.67-14.33-32-32-32z" />
        </svg>
      );

    case "hardware-chip":
    case "hardware-chip-outline":
    case "machines":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <rect x="80" y="80" width="352" height="352" rx="48" ry="48" />
          <rect x="144" y="144" width="224" height="224" rx="16" ry="16" />
          <path d="M256 80V32M256 480v-48M352 80V32M352 480v-48M160 80V32M160 480v-48M432 256h48M32 256h48M432 352h48M32 352h48M432 160h48M32 160h48" />
        </svg>
      );

    case "pricetag":
    case "pricetag-outline":
    case "services":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M435.25 48H312.35a14.44 14.44 0 00-10.2 4.24L56.49 297.89a36.42 36.42 0 000 51.48l106.14 106.14a36.42 36.42 0 0051.48 0l245.66-245.66a14.44 14.44 0 004.24-10.2V76.75A28.75 28.75 0 00435.25 48z" />
          <circle cx="384" cy="128" r="32" fill="currentColor" />
        </svg>
      );

    case "calendar":
    case "calendar-outline":
    case "shifts":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <rect x="48" y="80" width="416" height="384" rx="48" />
          <circle cx="296" cy="232" r="24" />
          <circle cx="376" cy="232" r="24" />
          <circle cx="296" cy="312" r="24" />
          <circle cx="376" cy="312" r="24" />
          <circle cx="136" cy="312" r="24" />
          <circle cx="216" cy="312" r="24" />
          <circle cx="136" cy="392" r="24" />
          <circle cx="216" cy="392" r="24" />
          <circle cx="296" cy="392" r="24" />
          <path d="M128 48v32M384 48v32M464 160H48" />
        </svg>
      );

    case "wallet":
    case "wallet-outline":
    case "finance":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <rect x="48" y="144" width="416" height="288" rx="48" ry="48" />
          <path d="M411.36 144v-30A47.78 47.78 0 00363.64 66h-240A47.78 47.78 0 0075.92 114v30" />
          <circle cx="368" cy="288" r="16" fill="currentColor" />
        </svg>
      );

    case "people":
    case "people-outline":
    case "employees":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M402 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30 66 72zM336 304c-65.25 0-131.47 36-143.73 104C190.8 419.14 195.44 427 204 427h264c8.58 0 13.22-7.86 11.73-19-12.26-68-78.48-104-143.73-104zM176 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30 66 72zM110 304c-65.25 0-131.47 36-143.73 104C-35.2 419.14-30.56 427-22 427h158c8.58 0 13.22-7.86 11.73-19-12.26-68-78.48-104-143.73-104z" />
        </svg>
      );

    case "add":
    case "add-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="40"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 112v288M400 256H112" />
        </svg>
      );

    case "menu":
    case "menu-outline":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="40"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M80 160h352M80 256h352M80 352h352" />
        </svg>
      );

    case "refresh":
    case "refresh-outline":
    case "autorenew":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="36"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M320 146s24.36-12-64-12a160 160 0 10160 160" />
          <path d="M256 58l64 88-64 88" />
        </svg>
      );

    case "information":
    case "information-outline":
    case "information-circle":
    case "information-circle-outline":
    case "info":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 80a176 176 0 10176 176A176 176 0 00256 80z" />
          <path d="M200 220h40v132h20" />
          <circle cx="248" cy="156" r="16" fill="currentColor" stroke="none" />
        </svg>
      );

    case "alert":
    case "alert-outline":
    case "alert-circle":
    case "alert-circle-outline":
    case "warning":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 80a176 176 0 10176 176A176 176 0 00256 80z" />
          <path d="M256 160v128" />
          <circle cx="256" cy="340" r="16" fill="currentColor" stroke="none" />
        </svg>
      );

    case "close-circle":
    case "close-circle-outline":
    case "error":
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="32"
          className={className}
          aria-hidden="true"
          {...props}
        >
          <path d="M256 80a176 176 0 10176 176A176 176 0 00256 80z" />
          <path d="M320 320L192 192M192 320l128-128" />
        </svg>
      );

    default:
      // Cegah kebocoran teks nama ikon jika nama tidak dikenali di Material Symbols
      if (norm.includes("-") || norm.includes("outline")) {
        return (
          <svg
            viewBox="0 0 512 512"
            width={size}
            height={size}
            fill="currentColor"
            className={className}
            aria-hidden="true"
            {...props}
          >
            <circle cx="256" cy="256" r="64" />
          </svg>
        );
      }
      return (
        <span
          aria-hidden="true"
          className={`material-symbols-outlined ${className}`}
          style={{ fontSize: typeof size === "number" ? `${size}px` : size }}
        >
          {name}
        </span>
      );
  }
}

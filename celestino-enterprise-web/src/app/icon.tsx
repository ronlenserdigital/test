import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Layered-shield mark. Recognizable at 16px because the stack reads as three bars. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0e13", borderRadius: 96 }}>
        <svg width="400" height="400" viewBox="0 0 32 32">
          <path d="M16 2.5 4.5 6.8v8.4c0 6.7 4.7 12.5 11.5 14.3 6.8-1.8 11.5-7.6 11.5-14.3V6.8L16 2.5Z" fill="#1a2430" stroke="#3d9bff" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9.5 12.2 16 9.6l6.5 2.6L16 14.8l-6.5-2.6Z" fill="#3d9bff" />
          <path d="m9.5 16.4 6.5 2.6 6.5-2.6" fill="none" stroke="#3d9bff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m9.5 20.6 6.5 2.6 6.5-2.6" fill="none" stroke="#3d9bff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}

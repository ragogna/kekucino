import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
        borderRadius: 40,
      }}
    >
      <div style={{ position: "relative", width: 118, height: 133, display: "flex" }}>
        <div style={{ position: "absolute", left: 7, top: 19, width: 40, height: 47, background: "white", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 7, top: 19, width: 40, height: 47, background: "white", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 31, top: 0, width: 56, height: 62, background: "white", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 14, top: 49, width: 90, height: 52, background: "white", borderRadius: 4 }} />
        <div style={{ position: "absolute", left: 5, top: 94, width: 108, height: 25, background: "white", borderRadius: 12 }} />
        <div style={{ position: "absolute", left: 5, top: 99, width: 108, height: 11, background: "#fbbf24", borderRadius: 6 }} />
      </div>
    </div>,
    { width: 180, height: 180 }
  );
}

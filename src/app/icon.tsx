import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
        borderRadius: 120,
      }}
    >
      <div style={{ position: "relative", width: 340, height: 380, display: "flex" }}>
        {/* Left puff */}
        <div style={{
          position: "absolute", left: 20, top: 55,
          width: 115, height: 135,
          background: "white", borderRadius: "50%",
        }} />
        {/* Right puff */}
        <div style={{
          position: "absolute", right: 20, top: 55,
          width: 115, height: 135,
          background: "white", borderRadius: "50%",
        }} />
        {/* Center puff (tallest) */}
        <div style={{
          position: "absolute", left: 90, top: 0,
          width: 160, height: 178,
          background: "white", borderRadius: "50%",
        }} />
        {/* Cylinder body */}
        <div style={{
          position: "absolute", left: 40, top: 140,
          width: 260, height: 148,
          background: "white", borderRadius: 10,
        }} />
        {/* Brim */}
        <div style={{
          position: "absolute", left: 15, top: 270,
          width: 310, height: 72,
          background: "white", borderRadius: 36,
        }} />
        {/* Amber band */}
        <div style={{
          position: "absolute", left: 15, top: 283,
          width: 310, height: 32,
          background: "#fbbf24", borderRadius: 16,
        }} />
        {/* Band dots */}
        <div style={{ position: "absolute", left: 90, top: 291, width: 14, height: 14, background: "rgba(255,255,255,0.7)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 163, top: 291, width: 14, height: 14, background: "rgba(255,255,255,0.7)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 236, top: 291, width: 14, height: 14, background: "rgba(255,255,255,0.7)", borderRadius: "50%" }} />
      </div>
    </div>,
    { width: 512, height: 512 }
  );
}

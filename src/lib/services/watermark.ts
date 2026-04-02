/**
 * Watermark Service
 * 
 * Adds a subtle watermark to exported PDFs for free-tier users.
 * For @react-pdf/renderer integration.
 */

export const WATERMARK_TEXT = "تم إنشاؤه بواسطة أكُوني — ترقّى إلى Pro لإزالة العلامة";

export const WATERMARK_STYLE = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%) rotate(-45deg)",
  fontSize: 28,
  color: "rgba(0, 0, 0, 0.06)",
  fontFamily: "Amiri",
  whiteSpace: "nowrap" as const,
  pointerEvents: "none" as const,
};

export const WATERMARK_PAGE_STYLE = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  zIndex: -1,
};

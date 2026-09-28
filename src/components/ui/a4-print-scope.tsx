// Keep the selected document in normal flow. Hiding only with visibility or
// fixing it to the viewport can leave blank pages or repeat it on every page.
export function A4PrintScope({ target }: {
  target: ".receipt-sheet-container" | ".id-card-print-stage" | "#id-card-element";
}) {
  return <style>{`
    @media print {
      @page { size: A4 portrait; margin: 10mm; }
      body:has(${target}) *:not(:has(${target})):not(${target}):not(${target} *) {
        display: none !important;
      }
      html:has(${target}), body:has(${target}), body *:has(${target}) {
        display: block !important;
        position: static !important;
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        min-width: 0 !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: visible !important;
        transform: none !important;
        box-shadow: none !important;
        background: white !important;
      }
      ${target} {
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
    }
  `}</style>;
}

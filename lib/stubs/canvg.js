// Stub for canvg — jsPDF's addSvgAsImage feature needs it, but we never call
// that method. This prevents webpack/Turbopack from failing to resolve the
// optional dynamic import inside jspdf.es.min.js.
const noop = () => Promise.resolve({ render: () => Promise.resolve() });
module.exports = { default: { fromString: noop }, fromString: noop };

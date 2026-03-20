// ─── Inject keyframes ────────────────────────────────────────────────────────
export const injectStyles = () => {
    if (typeof document === "undefined") return;
    if (document.getElementById("sdg-card-styles")) return;
    const style = document.createElement("style");
    style.id = "sdg-card-styles";
    style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes headerReveal {
      from { opacity: 0; transform: translateY(-16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes badgePop {
      0%   { transform: scale(0.8); opacity: 0; }
      60%  { transform: scale(1.1); }
      100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes yellowPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(253,250,0,0.5); }
      50%       { box-shadow: 0 0 0 8px rgba(253,250,0,0); }
    }

    /* Card entrance */
    .sdg-card {
      animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Image zoom on card hover */
    .sdg-card:hover .sdg-image {
      transform: scale(1.07);
    }

    /* Goal number reveal on hover */
    .sdg-number {
      opacity: 0;
      transform: translateY(12px) scale(0.85);
      transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
    }
    .sdg-card:hover .sdg-number {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    /* Overlay darkens on hover */
    .sdg-overlay {
      transition: opacity 0.35s ease;
      opacity: 0.55;
    }
    .sdg-card:hover .sdg-overlay {
      opacity: 0.75;
    }

    /* Image transition */
    .sdg-image {
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* Yellow badge pulse */
    .sdg-featured-badge {
      animation: badgePop 0.4s cubic-bezier(0.22,1,0.36,1) 0.6s both,
                 yellowPulse 2.8s ease-in-out 1.5s infinite;
    }

    /* Button shimmer */
    .sdg-btn-shimmer {
      position: relative;
      overflow: hidden;
    }
    .sdg-btn-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        110deg,
        transparent 20%,
        rgba(255,255,255,0.22) 40%,
        rgba(255,255,255,0.32) 50%,
        rgba(255,255,255,0.22) 60%,
        transparent 80%
      );
      background-size: 200% auto;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .sdg-btn-shimmer:hover::after {
      opacity: 1;
      animation: shimmer 0.85s linear forwards;
    }

    /* Header animation */
    .sdg-header {
      animation: headerReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Add Goal button yellow glow */
    .add-goal-btn:hover {
      box-shadow: 0 0 0 4px rgba(253,250,0,0.35);
    }
  `;
    document.head.appendChild(style);
};
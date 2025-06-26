"use client"

// Fallback confetti implementation using CSS animations
export function createFallbackConfetti() {
  const colors = ["#13AECE", "#F2C94C", "#27AE60", "#E74C3C", "#9B59B6"]

  for (let i = 0; i < 50; i++) {
    const confettiPiece = document.createElement("div")
    confettiPiece.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 1000;
      pointer-events: none;
      animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
      transform: rotate(${Math.random() * 360}deg);
    `

    document.body.appendChild(confettiPiece)

    // Remove after animation
    setTimeout(() => {
      if (confettiPiece.parentNode) {
        confettiPiece.parentNode.removeChild(confettiPiece)
      }
    }, 5000)
  }
}

// Add CSS animation if not already present
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        transform: translateY(-10px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
}

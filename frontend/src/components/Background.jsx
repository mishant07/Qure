// Background — the fixed animated video behind all UI.
// Rendered as the FIRST child of #root so page content paints above it in the
// SAME stacking context (.bg is z-index:-1). That is what lets the
// .adaptive-text / .adaptive-muted utilities mix-blend (difference) against
// the LIVE video pixels: each text element continuously inverts whatever is
// behind it — white on dark, black on light — at every scroll position.
const BG_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4'

export default function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src={BG_VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  )
}
// "The Journey of One Patient Vector" — 16-frame scroll story
// Frames generated via fallback AI image pipeline (runcomfy account out of credits
// on 2026-09-04; see frontend-plan.md §8 — regenerate finals via runcomfy when topped up)
export const STORY_ACTS = [
  {
    id: 1,
    label: "The data",
    text: "It starts with one patient.",
  },
  {
    id: 2,
    label: "Compression",
    text: "The clinical panel folds into four signals.",
  },
  {
    id: 3,
    label: "Encoding",
    text: "Four numbers become four qubits.",
  },
  {
    id: 4,
    label: "Computation",
    text: "The circuit runs — exact simulation.",
  },
  {
    id: 5,
    label: "Divergence",
    text: "Same vector. Two reconstructions.",
  },
  {
    id: 6,
    label: "Verdict",
    text: "One honest verdict.",
  },
]

const STYLE =
  "Cinematic macro photograph, museum-gallery minimalism, deep charcoal background, " +
  "a single source of deep blue light with subtle white rim light, shallow depth of field, " +
  "subject centered with safe margins, Apple product photography style, no text, no logos, no watermark."

const SUBJECTS = [
  "scattered clinical datapoints as small glowing nodes on a dark surface, one node ignites brighter",
  "a single patient record materializing as a translucent card of light",
  "hundreds of light points flowing into one luminous stream",
  "a stream of light funneling through a tall glass prism, many beams in, fewer beams out",
  "eight glowing spheres in a precise horizontal row above a dark reflective surface",
  "eight luminous spheres rising into a wireframe lattice sphere",
  "delicate threads of blue light connecting eight glowing nodes in a network",
  "an intricate glowing lattice circuit with concentric ripple waves of light",
  "vertical bars of blue light condensing out of drifting measurement particles",
  "a stream of light splitting into two parallel glass tracks",
  "two luminous reconstructions side by side, one a grid of medical chart lines, one an interference pattern",
  "two parallel light tracks reconverging into a single bright line",
  "a glowing semicircular gauge arc crystallizing above a dark surface",
  "three pillars of soft light rising from a dark floor",
  "a translucent interface wireframe materializing in dark space",
  "a final beauty shot of a glowing blue arc resting on a dark pedestal",
]

export const FRAMES = SUBJECTS.map((subject, i) => ({
  n: i + 1,
  act: STORY_ACTS[i < 2 ? 0 : i < 4 ? 1 : i < 7 ? 2 : i < 9 ? 3 : i < 12 ? 4 : 5],
  alt:
    [
      "Scattered clinical data points on a dark surface, one point lit bright blue",
      "A single patient record forming as a glowing translucent card",
      "Many light points flowing into one luminous stream",
      "Light funneling through a glass prism, many beams in, eight out",
      "Eight glowing spheres in a row",
      "Eight spheres rising into a rotating lattice sphere",
      "Threads of light connecting eight nodes",
      "A full circuit glowing with interference ripples",
      "Probability bars condensing from light",
      "A stream splitting into two parallel tracks",
      "A clinical chart and a quantum interference pattern side by side",
      "Two tracks reconverging into one line",
      "A risk gauge arc crystallizing",
      "Three pillars of light",
      "A product interface wireframe materializing",
      "A final hero shot with a blue accent",
    ][i],
  src: `/story/final/frame-${String(i + 1).padStart(2, "0")}.jpg`,
}))

export { STYLE, SUBJECTS }
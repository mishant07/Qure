// Visual verification — Landing (hero/story/benchmark), /detect E2E (fill →
// predict → verdict), console-error capture, mobile viewport.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT = '/tmp/shots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const errors = []
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

// — Landing —
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${OUT}/01-hero.png` })

await page.locator('#story').scrollIntoViewIfNeeded()
await page.evaluate(() => {
  const el = document.querySelector('#story')
  const total = el.offsetHeight - innerHeight
  window.scrollTo(0, el.offsetTop + total * 0.5) // mid-story
})
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/02-story-mid.png` })

await page.locator('#how').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/03-how.png` })

await page.locator('#benchmark').scrollIntoViewIfNeeded()
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/04-benchmark.png`, fullPage: false })
await page.evaluate(() => window.scrollBy(0, 700))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/05-benchmark-table.png` })
await page.screenshot({ path: `${OUT}/06-landing-full.png`, fullPage: true })

// — Detect E2E —
await page.goto(`${BASE}/detect`, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${OUT}/10-detect-empty.png` })

// breast cancer tab → accordion UI
await page.getByRole('tab', { name: 'BREAST' }).click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/11-detect-breast-accordion.png` })

// open "worst" group + fill typical values
await page.getByRole('button', { name: /Worst values/ }).click()
await page.getByRole('button', { name: /Fill typical values/ }).click()
await page.waitForTimeout(200)
await page.screenshot({ path: `${OUT}/12-detect-breast-filled.png` })

await page.getByRole('button', { name: 'Run prediction' }).click()
await page.waitForTimeout(4000) // inference + scroll-to-result
await page.screenshot({ path: `${OUT}/13-detect-result.png` })
await page.locator('#result').scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/14-result-panel.png` })

// heart dataset, exact typical patient
await page.getByRole('tab', { name: 'HEART', exact: true }).click()
await page.getByRole('button', { name: /Fill typical values/ }).click()
await page.getByRole('button', { name: 'Run prediction' }).click()
await page.waitForTimeout(3500)
await page.screenshot({ path: `${OUT}/15-result-heart.png` })

// — mobile —
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
const mp = await mob.newPage()
await mp.goto(BASE, { waitUntil: 'networkidle' })
await mp.screenshot({ path: `${OUT}/20-mobile-hero.png` })
await mp.goto(`${BASE}/detect`, { waitUntil: 'networkidle' })
await mp.screenshot({ path: `${OUT}/21-mobile-detect.png` })

console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')
await browser.close()
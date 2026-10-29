/**
 * Demo fixtures suffix their titles with "(demo)". Where a page already carries
 * a visible DemoTag, that suffix is dropped from the displayed heading so the
 * heading stays inside two lines; the label, not the parenthesis, does the
 * honest work.
 */
export function displayTitle(title: string): string {
  return title.replace(/\s*\(demo\)\s*$/i, "").trim();
}

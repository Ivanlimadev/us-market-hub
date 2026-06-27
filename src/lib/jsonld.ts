/**
 * Serializes data for embedding inside a `<script type="application/ld+json">`
 * tag. `JSON.stringify` alone does not escape `<`, so a field containing
 * `</script>` (e.g. an attacker-influenced blog title) could break out of the
 * script element and inject markup. The content is parsed as JSON data (not
 * executed as JS), so escaping `<`, `>` and `&` into their `\uXXXX` forms is
 * enough to make script-tag breakout impossible while keeping valid JSON.
 */
export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

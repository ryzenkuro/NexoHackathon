const ACTION_WORDS = ['stok', 'modal', 'konten', 'harga', 'kompetitor', 'risiko', 'review', 'bundling'];

function hasNumber(text) {
  return /\d/.test(text);
}

function countMatches(text, words) {
  const lower = text.toLowerCase();
  return words.reduce((count, word) => count + (lower.includes(word) ? 1 : 0), 0);
}

export function evaluateAiOutput(text, promptId) {
  const output = String(text || '');
  const checks = {
    hasOutput: output.trim().length > 40,
    hasNumbers: hasNumber(output),
    hasActionLanguage: countMatches(output, ACTION_WORDS) >= 2,
    hasRiskLanguage: /risiko|hindari|waspada|jenuh|kompetitor/i.test(output),
    conciseEnough: output.length <= 2600,
  };

  const score = Object.values(checks).filter(Boolean).length * 20;

  return {
    promptId,
    score,
    label: score >= 80 ? 'ready' : score >= 60 ? 'needs-review' : 'weak',
    checks,
  };
}

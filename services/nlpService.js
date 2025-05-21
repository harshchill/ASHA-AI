// services/nlpService.js
// NLP enrichment service. Stubs intent classification, entity extraction, and sentiment analysis.

import nlp from 'compromise';

// Analyze text and return intent, confidence, entities, and sentiment (stubbed)
export async function analyze(text) {
  // Intent classification (stub)
  let intent = 'unknown';
  let confidence = 0.5;
  if (/job|work|career/i.test(text)) {
    intent = 'searchJobs';
    confidence = 0.9;
  }

  // Entity extraction (stub)
  const doc = nlp(text);
  const people = doc.people().out('array');
  const organizations = doc.organizations().out('array');
  const entities = [
    ...people.map(name => ({ type: 'person', text: name, span: [text.indexOf(name), text.indexOf(name) + name.length] })),
    ...organizations.map(name => ({ type: 'organization', text: name, span: [text.indexOf(name), text.indexOf(name) + name.length] })),
  ];

  // Sentiment (stub)
  const sentiment = text.includes('good') ? 1 : text.includes('bad') ? -1 : 0;

  return {
    intent,
    confidence,
    entities,
    sentiment,
  };
} 
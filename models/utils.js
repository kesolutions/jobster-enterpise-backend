function removeStopWords(text) {
  const stopWords = ["a", "the", "and", "or", "in", "to"];
  return text.split(" ").filter(word => !stopWords.includes(word.toLowerCase())).join(" ");
}

module.exports = { removeStopWords };

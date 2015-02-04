module.exports = function randomInt (max, min) {
  min = min || 1;
  return Math.round(Math.random() * (max-min)) + min;
};
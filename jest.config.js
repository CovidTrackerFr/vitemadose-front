module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect", "jest-extended"],
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "<rootDir>/test-utils/styleMock.ts",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(testing-library__dom|@open-wc|lit-html|lit-element|pure-lit|lit-element-state-decoupler)/)"
  ],
};

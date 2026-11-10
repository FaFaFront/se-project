// Unit tests for the web app's pure logic (lib/, feature helpers); components are not rendered.
export default {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: false,
        tsconfig: { module: "CommonJS", moduleResolution: "Node10", isolatedModules: true },
      },
    ],
  },
};

export default {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // Compile only: `yarn workspace api check` is what type checks the source.
        diagnostics: false,
        tsconfig: { module: "CommonJS", moduleResolution: "Node10", isolatedModules: true },
      },
    ],
  },
};

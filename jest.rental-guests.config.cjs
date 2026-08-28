module.exports = {
  clearMocks: true,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/EditEmailsGuestFields.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
};

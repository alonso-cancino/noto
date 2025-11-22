export const listener = jest.fn();

export const listenerCtx = {
  get: () => ({
    markdownUpdated: jest.fn(),
  }),
};

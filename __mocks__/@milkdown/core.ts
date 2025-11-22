export const Editor = {
  make: () => ({
    config: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis(),
  }),
};

export const rootCtx = Symbol('rootCtx');
export const defaultValueCtx = Symbol('defaultValueCtx');
export const editorViewOptionsCtx = Symbol('editorViewOptionsCtx');

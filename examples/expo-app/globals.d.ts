declare namespace jest {
  function mock(moduleName: string, factory?: () => any): void;
  function fn<T extends (...args: any[]) => any>(implementation?: T): jest.Mock<T>;
}

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: any; 
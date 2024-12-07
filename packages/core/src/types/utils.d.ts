export type Async<T> = Promise<T> | T;

export type ExplicitPartial<T> = {
    [K in keyof Required<T>]: T[K];
};

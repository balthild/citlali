export type Async<T> = Promise<T> | T;

export type Getter<T> = () => T;
export type AsyncGetter<T> = () => Async<T>;

export type ExplicitPartial<T> = {
    [K in keyof Required<T>]: T[K];
};

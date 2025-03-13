import { Async } from '@citlali/utils';

export interface UserscriptOptions {
    name: string;
    namespace?: string;
    version: string;
    author: string;
    description?: string;
    match?: string[];
    grant?: string[];

    main: () => Async<void>;
}

export interface UserstyleOptions {
    name: string;
    namespace?: string;
    version: string;
    author: string;
    description?: string;
}

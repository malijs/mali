declare function compose<T>(middleware: Array<compose.Middleware<T>>): compose.ComposedMiddleware<T>;

declare namespace compose {
    type Middleware<T> = (context: T, next: () => Promise<any>) => any;
    type ComposedMiddleware<T> = (context: T, next?: () => Promise<any>) => Promise<void>;
}

export = compose;

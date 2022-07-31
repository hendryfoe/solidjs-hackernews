type URLSearchParamsArg = ConstructorParameters<typeof URLSearchParams>[0] | Record<string, any>;
type FetchInitRequest = RequestInit & { query?: URLSearchParamsArg };

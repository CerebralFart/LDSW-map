import {useMemo} from "react";
import {useCookie} from "./useCookie";

export function useParsedCookie<T = { [key: string]: any }>(
    name: string,
    serializer: (o: T) => string = JSON.stringify,
    deserializer: (v: string) => T = JSON.parse,
): [T, (value: T) => void] {
    const [value, setValue] = useCookie(name);

    return [
        useMemo(() => deserializer(value), [value, deserializer]),
        useMemo(() => (value: T) => setValue(serializer(value)), [serializer])
    ]
}
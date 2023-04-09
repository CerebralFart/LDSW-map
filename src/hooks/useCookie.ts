import {useEffect, useMemo, useState} from "react";
import Cookie from "@cerebralfart/cookies";

export function useCookie(name: string): [string, (value: string) => void] {
    const [value, setValue] = useState<string>(Cookie[name]);

    useEffect(() => setValue(Cookie[name]), [name]);

    return [
        value,
        (value: string) => {
            setValue(value);
            Cookie[name] = value;
        }
    ]
}
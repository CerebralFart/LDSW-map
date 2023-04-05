export function leftPad(value: string, pad: string, length: number): string {
    const diff = length - value.length;
    const prefix = pad.repeat(diff).substring(0, diff);
    return prefix + value;
}
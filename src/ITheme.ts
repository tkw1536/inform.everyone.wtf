interface ITheme {
    /* primary color (foreground) */
    p: string;

    /* secondary color (background) */
    s: string;

    /* border style */
    b: string;

    /* link color */
    l: string;
}

const black = '#000';
const white = '#fff';
const blue = '#00f';

export const LIGHT_THEME: ITheme = {
    p: black,
    s: white,
    b: black,
    l: blue,
}

export const DARK_THEME: ITheme = {
    p: white,
    s: black,
    b: white,
    l: blue,
}

export const BORDER_SIZE = '1px';
export const SMALL_SPACE = '5px';
export const LARGE_SPACE = '10px';
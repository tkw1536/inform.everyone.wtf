interface ITheme {
    /* foreground color */
    f: string;

    /* border style */
    bo: string;

    /* secondary color (background) */
    s: string;

    /* link color */
    l: string;
}

const black = '#000';
const white = '#fff';
const blue = '#00f';

export const LIGHT_THEME: ITheme = {
    f: black,
    s: white,
    bo: black,
    l: blue,
}

export const DARK_THEME: ITheme = {
    f: white,
    s: black,
    bo: white,
    l: blue,
}

export const BORDER_SIZE = '1px';
export const SMALL_SPACE = '5px';
export const LARGE_SPACE = '10px';
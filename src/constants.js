export const CARRIAGE_RETURN =    '\r';
export const NEWLINE =            '\n';
export const TAB =                '\t';
export const SPACE =              ' ';
export const BOM =                '\ufeff';
export const QUOTE =              '"';
export const DOUBLE_QUOTE =       QUOTE + QUOTE;

export const REGEX_BOOL_TRUE =    /^true$/i;
export const REGEX_BOOL_FALSE =   /^false$/i;
export const REGEX_NUMBER =       /^[+\-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:\d[eE][+\-]?\d+)?$/;
export const REGEX_QUOTE =        new RegExp(`[\\s${QUOTE}]`);

export const DEFUALT_DELIM =      ',';
export const DEFAULT_LINE_DELIM = CARRIAGE_RETURN + NEWLINE;
tokens
    Chr = "chr";
    Comments = "comments";
    Extend = "extend";
    Fragments = "fragments";
    Nested = "nested";
    To = "to";
    Tokens = "tokens";
    Whitespace = "whitespace";
    
    Backslash = "\";
    Bang = "!";
    Bar = "|";
    Equal = "=";
    LBracket = "[";
    LCurly = "{";
    LParen = "(";
    Minus = "-";
    Plus = "+";
    RBracket = "]";
    RCurly = "}";
    RParen = ")";
    Semicolon = ";";

    Identifier = alpha {alpha | digit};
    LiteralCharacter = chr(39) !chr(39) chr(39);
    LiteralInt = digit {digit};
    LiteralString = '"' {!'"'} '"';

comments
    "/*" to "*/" nested;
    "//" {!cr};

whitespace
    chr(0)-' ';

fragments
    digit = '0'-'9';
    alpha = 'a'-'z' + 'A'-'Z';
    cr = chr(10);


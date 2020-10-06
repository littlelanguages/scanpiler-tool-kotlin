tokens 
  Identifier = alpha {alpha};
  LiteralInt = digit {digit};

comments
  "//" {!cr};
  "/*" to "*/";
  "(*" to "*)" nested;

fragments
  alpha = 'a'-'z' + 'A'-'Z';
  digit = '0'-'9';
  cr = chr(10);
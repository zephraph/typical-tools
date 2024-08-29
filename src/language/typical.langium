grammar Typical

entry Schema:
	(imports+=Import | declarations+=Declaration)*;

Import:
	'import' path=PATH ('as' namespace=ID)?;

Declaration:
	(structs+=Struct | choices+=Choice);

Struct:
	'struct' name=ID '{' fields+=Field* '}';

Choice:
	'choice' name=ID '{' fields+=Field* '}';

Field:
	(Rule)? name=ID (':' type=Type)? '=' index=INDEX;

Rule:
	rule='asymmetric' | 'optional' | 'required';
	
Type:
	type='String' | 'Bool' | 'Bytes';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal PATH: /'[\w_\/\.-]*'/;
terminal INDEX returns number: /[0-9][\w_]*/;

hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /#[^\n\r]*/;

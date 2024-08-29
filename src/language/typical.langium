grammar Typical

entry Schema:
	(imports+=Import | declarations+=Declaration)*;

Import:
    'import' path=PATH ('as' alias=ID)?;

Declaration:
    variant=('struct' | 'choice') name=ID '{' 
        (fields+=Field | deleted+=Deleted )+
    '}';

Field:
    (Rule)? name=ID (':' Type)? '=' index=INDEX;

Deleted:
    'deleted' indexes+=INDEX*;

fragment Rule:
    rule=('asymmetric' | 'optional' | 'required');

fragment Type:
	type=('String' | 'Bool' | 'Bytes' | 'F64' | 'S64' | 'U64' | 'Unit' | ArrayType | CustomType | ImportedType);

ArrayType:
    '[' Type ']';

CustomType:
    ref=[Declaration:ID];

ImportedType:
    module=ID '.' type=ID;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal PATH: /'[\w_\/\.-]*'/;
terminal INDEX returns number: /[0-9][\w_]*/;

hidden terminal COMMENT: /#[^\n\r]*/;
hidden terminal WS: /\s+/;

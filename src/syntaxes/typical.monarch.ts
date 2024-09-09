// Monarch syntax highlighting for the typical language.
export default {
    keywords: [
        'Bool','Bytes','F64','S64','String','U64','Unit','as','asymmetric','choice','deleted','import','optional','required','struct'
    ],
    operators: [
        '.',':','='
    ],
    symbols: /\.|:|=|\[|\]|\{|\}/,

    tokenizer: {
        initial: [
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /'[\w_\/\.-]*'/, action: {"token":"PATH"} },
            { regex: /[0-9][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"number"} }} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /#[^\n\r]*/, action: {"token":"comment"} },
            { regex: /\s+/, action: {"token":"white"} },
        ],
        comment: [
        ],
    }
};

import * as esprima from 'esprima';
// var esprima = require('esprima');
import * as escodegen from 'escodegen';
// var escodegen = require('escodegen');

let codeToReturn;
let vars =[];
let args=[];
let ifPred;
const parseCode = (codeToParse, argus) => {
    args = [];
    makeArgsList(argus);
    let parsedProg = JSON.parse(JSON.stringify(esprima.parseScript(codeToParse , {loc: true, range: true})));
    vars = [];
    ifPred =[];
    parseProg(parsedProg);
    codeToReturn = escodegen.generate(parsedProg);
    var splitted = splitProg(codeToReturn);
    return splitted;
};
let leftEquationPool = [];
let rightEquationPool = [];

function parseProg(obj) {
    for(let i=0;i<obj.body.length;i++){
        let type =obj.body[i].type;
        pasre_by_type[type](obj.body[i]);
    }
    removeLines(obj);
}

function parseFunc(obj) {
    obj.params.map((element)=> vars.push(element.name));
    pasre_by_type[obj.body.type](obj.body);
}
function parseVarDec(obj) {
    let i;
    let init='';
    for(i=0; i<obj.declarations.length ;i++ ){
        if(obj.declarations[i].init!=null){
            init = parse_rightHS[obj.declarations[i].init.type](obj.declarations[i].init);
        }
        putEquation(obj.declarations[i].id.name, init);
    }
}
function parseExperStatement(obj) {
    // if(obj.expression.type === 'AssignmentExpression'){
    parseAssignExper(obj.expression);
    // }
}
function parseAssignExper(obj) {
    if(obj.left.type === 'Identifier'){
        var rval = parse_rightHS[obj.right.type](obj.right);
        putEquation(obj.left.name, rval);
        obj.right = esprima.parseScript(rval).body[0].expression;
    }
    else{//asuming there is only id and member//check if using same name for id and srrsy can fuck this
        putEquation( parse_rightHS[obj.left.type](obj.left), parse_rightHS[obj.right.type](obj.right));
    }
}
function praseWhileStatement(obj) {
    // table.push( new line_in_table(obj.loc.start.line, obj.type,'', parse_rightHS[obj.test.type](obj.test), ''));
    //replace the predicat according to the equation table
    replacePred(obj);
    let l = cloneArr(leftEquationPool);
    let r = cloneArr(rightEquationPool);
    pasre_by_type[obj.body.type](obj.body);
    leftEquationPool = l;
    rightEquationPool = r;
}
function parseReturnStatement(obj){
    //replace the statment according to the equation table
    let valOfArg = esprima.parseScript(parse_rightHS[obj.argument.type](obj.argument));
    obj.argument = valOfArg.body[0].expression;
}
function parseIfStatement(obj) {
    //replace the predicat according to the equation table
    var pred1 = replacePred(obj);
    ifPred.push(evalPred(pred1));
    let l = cloneArr(leftEquationPool);
    let r = cloneArr(rightEquationPool);
    pasre_by_type[obj.consequent.type](obj.consequent);
    leftEquationPool = l;
    rightEquationPool = r;
    if(obj.alternate != null){
        pasre_by_type[obj.alternate.type](obj.alternate);
    }
}
function parseBlockStatement(obj) {
    let i;
    for(i=0;i<obj.body.length;i++){
        pasre_by_type[obj.body[i].type](obj.body[i]);
    }
    removeLines(obj);
}
// function parseForStatement(obj) {
//     pasre_by_type[obj.body.type](obj.body);
// }
function parseLiteral(obj) {
    return obj.raw;
}
function parseId(obj) {
    var name = obj.name;
    let indexOfElement = leftEquationPool.lastIndexOf(name);
    if(indexOfElement != -1 && !vars.includes(name)){
        return rightEquationPool[indexOfElement];
    }
    else return name;
}

function parseBinaryExper(obj) {
    var left = parse_rightHS[obj.left.type](obj.left);
    var right = parse_rightHS[obj.right.type](obj.right);
    var op = obj.operator;
    op=='/' || op=='*'?left.length>1?left = '('+left+')':right.length>1?right = '('+right+')':true:true;
    return  left + ' ' + op + ' ' + right;
}
function parseUnaryExper(obj){
    return obj.operator + parse_rightHS[obj.argument.type](obj.argument);
}
function parseMemberExper(obj) {
    return parse_rightHS[obj.object.type](obj.object)+'['+parse_rightHS[obj.property.type](obj.property)+']';
}
function parseUpdate(obj) {
    let op = obj.operator;
    let arg = parse_rightHS[obj.argument.type](obj.argument);
    if(obj.prefix){
        return op + arg;
    }
    return arg + op;
}
function parseArr(obj) {
    var str ;
    str  = obj.elements.reduce((acc, element)=> acc + parse_rightHS[element.type](element) +', ','[');
    // str += parse_rightHS[obj.elements[0].type](obj.elements[0]) + '  ' ;
    str = str.substring(0,str.length-2)+']';
    return str;
}
const pasre_by_type = {
    'FunctionDeclaration' : parseFunc,
    'VariableDeclaration' : parseVarDec,
    'ExpressionStatement' : parseExperStatement,
    'WhileStatement' : praseWhileStatement,
    'ReturnStatement' : parseReturnStatement,
    'IfStatement' : parseIfStatement,
    'BlockStatement' : parseBlockStatement,
    // 'ForStatement' : parseForStatement,
    'AssignmentExpression' : parseAssignExper
};
const parse_rightHS = {
    'Literal' : parseLiteral,
    'Identifier' : parseId,
    'BinaryExpression' : parseBinaryExper,
    'UnaryExpression' : parseUnaryExper,
    'MemberExpression' : parseMemberExper,
    'UpdateExpression' : parseUpdate,
    'ArrayExpression' : parseArr
};

function putEquation(lval, rval) {
    leftEquationPool.push(lval);
    rightEquationPool.push(rval);
}
function replacePred(obj) {
    let pred = parse_rightHS[obj.test.type](obj.test);
    let valOfStatement = esprima.parseScript(pred);
    obj.test = valOfStatement.body[0].expression;
    return pred;
}
function removeLines(obj) {
    obj.body = obj.body.filter((element)=>(!(element.type === 'VariableDeclaration') && (!(element.type === 'ExpressionStatement')
    || (element.type === 'ExpressionStatement' && vars.indexOf(element.expression.left.name)!=-1 ))));//todo: not delete args of func
}
function evalPred(pred) {
    var code = '';
    for(let i=0; i<vars.length;i++){
        code += ' let '+vars[i]+' = '+args[i]+'; ';
    }
    for(let i=0;i<leftEquationPool.length;i++){
        var idx = leftEquationPool[i].indexOf('[');
        var v;
        if(idx!=-1){
            v = leftEquationPool[i].substring(0,idx);
        }
        else{v = leftEquationPool[i];}
        if(vars.includes(v)){
            code += (leftEquationPool[i] + ' = ' + rightEquationPool[i] + ';');
        }
    }
    code += pred +';';
    return eval(code);
}
function makeArgsList(argus){
    var idx = 1;
    argus = argus.trim();
    if(argus === '') {return '';}
    else if(argus.charAt(0)===','){
        return makeArgsList(argus.substr(idx));}
    else if(makeArgsListHelper(argus)!=-1){
        idx += makeArgsListHelper(argus);}
    else{
        var comaIdx = argus.indexOf(',');
        idx += comaIdx === -1? argus.length:comaIdx-1;}
    args.push(argus.substring(0,idx));
    argus = argus.substr(idx);
    makeArgsList(argus);
}
function makeArgsListHelper(argus){
    if(argus.charAt(0)==='['){
        return argus.indexOf(']');
    }
    else if(argus.charAt(0)==='\'')
    {
        return argus.indexOf('\'',1);
    }
    else if(argus.charAt(0)==='"'){
        return argus.indexOf('"',1);
    }
    else return -1;
}
function cloneArr(arr) {
    return arr.map((e)=>e);
}
function splitProg(parsedCode) {
    var s = parsedCode.split('\n');
    var inx = 0;
    for(let i =0; i<s.length;i++){
        if(s[i].includes('if')){
            ifPred[inx]? s[i]='<greenBack>'+s[i]+'</greenBack>':s[i]='<redBack>'+s[i]+'</redBack>';
            inx++;
        }
    }
    return s.reduce((str,acc)=>str+acc+'\n','');
}
// parseCode('let a = [1,2,3];', '');

// module.exports = {parseCode};
export {parseCode};
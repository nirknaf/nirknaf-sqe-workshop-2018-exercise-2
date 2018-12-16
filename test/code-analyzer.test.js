import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';


describe('The javascript parser', () => {
    it('is parsing the first function correctly with input=1,2,3', () => {
        assert.equal((parseCode('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' + '}\n', '1, 2, 3')), 'function foo(x, y, z) {\n' +
            '<redBack>    if (x + 1 + y < z) {</redBack>\n' +
            '        return x + y + z + 0 + 5;\n' +
            '<greenBack>    } else if (x + 1 + y < z * 2) {</greenBack>\n' +
            '        return x + y + z + 0 + x + 5;\n' +
            '    } else {\n' +
            '        return x + y + z + 0 + z + 5;\n' +
            '    }\n' + '}\n');});});
describe('The javascript parser', () => {
    it('is parsing the second function correctly with input=1,2,3', () => {
        assert.equal((parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    while (a < z) {\n' +
            '        c = a + b;\n' +
            '        z = c * 2;\n' +
            '    }\n' +
            '    \n' +
            '    return z;\n' +
            '}\n','1,2,3')), 'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + x + 1 + y) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}\n');});
});
describe('The javascript parser', () => {
    it('is parsing the first madeup function correctly with input=[10,20],\'nir\',"nir"', () => {
        assert.equal((parseCode('function check(x, y, z) {\n' +
            '    let a = x[0];\n' +
            '    if(y === \'nir\'){\n' +
            '        return z;\n' + '    }\n' +
            '    else if(y === "nir"){\n' +
            '        return y;\n' +
            '    }\n' +
            '    else if(a<5){\n' +
            '        return x;\n' +
            '    }\n' +
            '}','[10,20],\'nir\',"nir"')), 'function check(x, y, z) {\n' +
            '<greenBack>    if (y === \'nir\') {</greenBack>\n' +
            '        return z;\n' +
            '<greenBack>    } else if (y === \'nir\') {</greenBack>\n' +
            '        return y;\n' +
            '<redBack>    } else if (x[0] < 5) {</redBack>\n' +
            '        return x;\n' +
            '    }\n' +
            '}\n');});});
describe('The javascript parser', () => {
    it('is parsing the second madeup function correctly with input=[10,20], 2,"nir"', () => {
        assert.equal((parseCode('function check2(x,y,z) {\n' +
            '    let a;\n' +
            '    a = y *2;\n' +
            '    let  b = 2*a++;\n' +
            '    x[0] = ++a;\n' +
            '    b = [1,2];\n' +
            '    b = true;\n' +
            '    if(x[0]<10 & !b){\n' +
            '        return z;\n' +
            '    }\n' +
            '}','[10,20], 2,"nir"')), 'function check2(x, y, z) {\n' +
            '<redBack>    if (x[0] < 10 & !true) {</redBack>\n' +
            '        return z;\n' +
            '    }\n' +
            '}\n');});});
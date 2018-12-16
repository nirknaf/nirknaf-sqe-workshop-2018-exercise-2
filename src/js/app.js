import $ from 'jquery';
import {parseCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let argus = $('#codePlaceholder2').val();
        let parsedCode = parseCode(codeToParse, argus);
        $('#parsedCode').val(parsedCode);
        let code = document.getElementById('code');
        code.innerHTML=parsedCode;
    });
});

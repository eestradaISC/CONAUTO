/**
 *
 * @param {nlobjRecord} transactionRecord
 * @param {standardLines} standardLines
 * @param {customLines} customLines
 * @param {accountingbook} book
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var typeInvoice = transactionRecord.getFieldValue("custbody_tipo_transaccion_conauto");
    var account = transactionRecord.getFieldValue("account");
    var total = parseFloat(transactionRecord.getFieldValue('total'));
    var memo = transactionRecord.getFieldValue("memo");
    var entityId = transactionRecord.getFieldValue("entity");
    var typeInvoiceText = transactionRecord.getFieldText("custbody_tipo_transaccion_conauto");
    var preferencias = getPreferences();
    var accountPuente = parseInt(preferencias.getPreferences("CPPSC")) || 0;
    var accountCliente = parseInt(preferencias.getPreferences("CPPSI")) || 0;
    nlapiLogExecution("ERROR", "accountPuente", accountPuente);

    nlapiLogExecution("ERROR", "accountCliente", accountCliente)
    if (typeInvoice == '6' || typeInvoice == '10' || typeInvoice == '11') {
        //addlinePair(customLines, 490, 451, total,'Disminución de la cartera por la cobranza recibida por '+typeInvoiceText+' de la referencia '+getReference(transactionRecord));
    }
    if (account == accountPuente) {
        addlinePair(customLines, accountCliente, accountPuente, total, transactionRecord.getFieldValue("memo"), entityId);
    }
}

function getReference(transactionRecord) {
    var date = nlapiStringToDate(transactionRecord.getFieldValue('trandate'));
    var day = date.getDate() + "";
    day = day.length < 2 ? ('0' + day) : day;
    var month = (date.getMonth() + 1) + "";
    month = month.length < 2 ? ('0' + month) : month;
    var year = date.getFullYear();
    var referencia = 'RI' + day + month + year;
    return referencia;
}


function getPreferences() {
    var preferences = {};
    var results = nlapiSearchRecord("customrecord_config_conauto", null, null, [new nlobjSearchColumn("custrecord_conf_conauto_clave"),
    new nlobjSearchColumn("custrecord_conf_conauto_referencia"),
    new nlobjSearchColumn("custrecord_conf_conauto_valor")]) || [];
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var clave = result.getValue("custrecord_conf_conauto_clave") || '';
        var referencia = result.getValue("custrecord_conf_conauto_referencia") || '';
        var valor = result.getValue("custrecord_conf_conauto_valor") || '';
        preferences[clave] = preferences[clave] || {};
        preferences[clave][referencia] = valor;
    }
    return new PreferencesConauto(preferences);
    function PreferencesConauto(preferences) {
        this.preferences = preferences;
        this.getPreferences = function (clave, referencia) {
            clave = clave || '';
            referencia = referencia || '';
            nlapiLogExecution("ERROR", "clave", clave);
            nlapiLogExecution("ERROR", "referencia", referencia);
            nlapiLogExecution("ERROR", "preferences", JSON.stringify(this.preferences));
            var value = this.preferences[clave] || {};
            value = value[referencia] || '';
            return value;
        }
    }
}



/**
 *
 * @param {customLines} customLines
 * @param {number} accounddebit
 * @param {number} accountcredit
 * @param {number} amount
 * @param {string} _memo_adjust
 */
function addlinePair(customLines, accounddebit, accountcredit, amount, _memo_adjust, entityId) {
    if (accounddebit) {
        var newline = customLines.addNewLine();
        amount = Number(amount.toFixed(2));
        newline.setDebitAmount(amount);
        newline.setAccountId(accounddebit);
        newline.setMemo(_memo_adjust);
        // newline.setEntityId(entityId);
    }
    if (accountcredit) {
        var newLine2 = customLines.addNewLine();
        amount = Number(amount.toFixed(2));
        newLine2.setCreditAmount(amount);
        newLine2.setAccountId(accountcredit);
        newLine2.setMemo(_memo_adjust);
        // newLine2.setEntityId(entityId);

    }
    if (!accounddebit || !accountcredit) {
        nlapiLogExecution("ERROR", "Error en el balance" + _memo_adjust, JSON.stringify({
            amount: amount,
            account: accounddebit,
            account: accountcredit
        }));
    }
}
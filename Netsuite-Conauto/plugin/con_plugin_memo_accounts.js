/**
 *
 * @param {nlobjRecord} transactionRecord
 * @param {standardLines} standardLines
 * @param {customLines} customLines
 * @param {accountingbook} book
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {
        var account = transactionRecord.getFieldValue("account");
        var memo = transactionRecord.getFieldValue("memo");
        nlapiLogExecution('ERROR', 'CUENTA', account);
        nlapiLogExecution('ERROR', 'NOTA', memo);
        var totalLines = standardLines.getCount();
        nlapiLogExecution('ERROR', 'AUDIT', ' Total Lines: ' + totalLines);

        for (var i = 0; i < standardLines.getCount(); i++) {
            var currLine = standardLines.getLine(i);
            var entityId = currLine.getEntityId();
            nlapiLogExecution('ERROR', 'TYPEEE', entityId);
            recordObj = nlapiLoadRecord("cashsale", entityId);
            nlapiLogExecution('ERROR', 'CURRENT LINE', recordObj);
        }

        // for (var i = 1; i < accounts + 1; i++) {
        //     var accountAmount = transactionRecord.getLineItemValue('recmachcustrecord_svm_sub_concept_accounts_inv', 'custrecord_svm_sub_concept_accounts_amo', i);
        //     var accountId = transactionRecord.getLineItemValue('recmachcustrecord_svm_sub_concept_accounts_inv', 'custrecord_svm_sub_concept_accounts_rec', i);
        //     nlapiLogExecution('DEBUG', 'AUDIT', ' Amount: ' + accountAmount + ' Id: ' + accountId);
        //     var accountSearch = nlapiSearchRecord('customrecord_svm_concept_accounts', null,
        //         [
        //             ["internalid", "is", accountId]
        //         ],
        //         [
        //             new nlobjSearchColumn("custrecord_svm_concept_acc_nature"),
        //             new nlobjSearchColumn("custrecord_svm_concept_acc_accountid")
        //         ]);
        //     var nature = accountSearch[0].getValue('custrecord_svm_concept_acc_nature');
        //     nlapiLogExecution('DEBUG', 'AUDIT', ' Nature: ' + nature);
        //     var accountsId = accountSearch[0].getValue('custrecord_svm_concept_acc_accountid');
        //     accountsId = parseInt(accountsId);
        //     if (nature == 'DEBITO') {
        //         var debitLine = customLines.addNewLine();
        //         debitLine.setDebitAmount(accountAmount);
        //         debitLine.setAccountId(accountsId);
        //     }
        //     else if (nature == 'CREDITO') {
        //         var creditLine = customLines.addNewLine();
        //         creditLine.setCreditAmount(accountAmount);
        //         creditLine.setAccountId(accountsId);
        //     }
        // }
        nlapiLogExecution('DEBUG', 'AUDIT', ' Accounts: ' + accounts);
    } catch (e) {
        nlapiLogExecution('DEBUG', 'AUDIT', 'ERROR :' + e);
    }
}

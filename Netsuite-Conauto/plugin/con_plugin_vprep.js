/**
 *
 * @param {nlobjRecord} transactionRecord
 * @param {standardLines} standardLines
 * @param {customLines} customLines
 * @param {accountingbook} book
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {
        var lineas = transactionRecord.getLineItemCount("bill");
        nlapiLogExecution('ERROR', 'Lineas', lineas);
        // for (var i = 2; i < customLines.getCount(); i++) {
        //     // get the line
        //     var currLine = customLines.getLine(i);
        //     currLine.setDebitAmount(0);
        //     currLine.setCreditAmount(0);
        // } // NOTE: Only uncomment for remove custom lines and comment the next for
        for (var i = 1; i <= lineas; i++) {
            var internalid = transactionRecord.getLineItemValue("bill", "internalid", i);
            var isApply = transactionRecord.getLineItemValue("bill", "apply", i);
            nlapiLogExecution('ERROR', 'internalid', internalid);
            nlapiLogExecution('ERROR', 'isApply', isApply);
            if (isApply == "T") {
                var bill = nlapiLoadRecord("vendorbill", internalid);
                var tax = bill.getFieldValue("taxtotal")
                nlapiLogExecution('ERROR', 'taxtotal', tax);
                if (tax > 0) {
                    var debitLine = customLines.addNewLine();
                    debitLine.setDebitAmount(Math.abs(tax));
                    debitLine.setAccountId(2768); //NOTE: ID Account "1208-000-000-000 IVA PENDIENTE DE ACREDITAR"
                    var creditLine = customLines.addNewLine();
                    creditLine.setCreditAmount(Math.abs(tax));
                    creditLine.setAccountId(327); // NOTE: ID Account "Pagos anticipados"

                }
            }
        };
    } catch (e) {
        nlapiLogExecution('ERROR', 'AUDIT', 'ERROR :' + e);
    }
}

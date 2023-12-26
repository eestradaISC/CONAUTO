/**
 * Module Description...
 *
 * @copyright 2020 IMR
 * @author Gonzalo Rodriguez gonzalo.roriguez@imr.com.mx
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 * @NApiVersion 2.x
 * @NModuleScope SameAccount

 * @NScriptType UserEventScript
 */
define(["N/record","/SuiteScripts/Conauto_Preferences.js","IMR/IMRParse"],
    /**
     *
     * @param {record} record
     * @param {conautoPreferences} conautoPreferences
     * @param {IMRParse} IMRParse
     */
    function (record,conautoPreferences,IMRParse) {

        var exports = {};

        /**
         * <code>beforeLoad</code> event handler
         * for details.
         *
         * @gov XXX
         *
         * @param context
         *        {Object}
         * @param context.newRecord
         *        {record} The new record being loaded
         * @param context.type
         *        {UserEventType} The action type that triggered this event
         * @param context.form
         *        {form} The current UI form
         *
         * @return {void}
         *
         * @static
         * @function beforeLoad
         */
        function beforeLoad(context) {
            // TODO
        }

        /**
         * <code>beforeSubmit</code> event handle
         *
         * @gov XXX
         *
         * @param context
         *        {Object}
         * @param context.newRecord
         *        {record} The new record being submitted
         * @param context.oldRecord
         *        {record} The old record before it was modified
         * @param context.type
         *        {UserEventType} The action type that triggered this event
         *
         * @return {void}
         *
         * @static
         * @function beforeSubmit
         */
        function beforeSubmit(context) {
            // TODO
        }

        /**
         * <code>afterSubmit</code> event handler
         *
         * @gov XXX
         *
         * @param context
         *        {Object}
         *
         * @param context.newRecord
         *        {record} The new record being submitted
         * @param context.oldRecord
         *        {record} The old record before it was modified
         * @param context.type
         *        {UserEventType} The action type that triggered this event
         *
         * @return {void}
         *
         * @static
         * @function afterSubmit
         */
        function afterSubmit(context) {
            if(context.type == 'create' || context.type == 'edit' || context.type == 'xedit'){
                    var recordObj = record.load({
                            type:context.newRecord.type,
                            id:context.newRecord.id
                    });
                    var transaccion = recordObj.getValue({
                            fieldId:"custrecord_imr_intmo_transaccion"
                    });
                    if(!transaccion){
                            var importe = parseFloat(recordObj.getValue({
                                    fieldId:"custrecord_imr_intmo_monto_interes"
                            }))||0;
                            var fecha = recordObj.getValue({
                                    fieldId:"custrecord_imr_intmo_fecha"
                            })||new Date();
                            fecha = IMRParse.addDays(fecha,fecha.getDate()*-1);
                            var dateReversal = IMRParse.addDays(fecha,(fecha.getDate()-1)*-1);
                            dateReversal = IMRParse.addmonths(dateReversal,1);
                            var mesTexto = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre", ""];
                            importe = parseFloat(importe.toFixed(2));
                            var preferences = conautoPreferences.get();
                            var subsidiary  = preferences.getPreference({
                                    key:"SUBCONAUTO"
                            });
                            var cuentaDebito = preferences.getPreference({
                                    key:"PIM",
                                    reference:"debito"
                            });
                            var cuentaCredito = preferences.getPreference({
                                    key:"PIM",
                                    reference:"credito"
                            });
                            var nota = "Provision de intereses moratorios de clientes con adeudo en el mes "+mesTexto[fecha.getMonth()];
                            var diarioObj = record.create({
                                    type:record.Type.JOURNAL_ENTRY,
                                    isDynamic:true
                            });
                            diarioObj.setValue({
                                    fieldId:"subsidiary",
                                    value:subsidiary
                            });
                            diarioObj.setValue({
                                    fieldId:"memo",
                                    value:nota
                            });
                            diarioObj.setValue({
                                            fieldId:"reversaldefer",
                                            value:true
                                    });
                                    diarioObj.setValue({
                                            fieldId:"reversaldate",
                                            value:dateReversal
                                    });
                            diarioObj.setValue({
                                    fieldId:"currency",
                                    value:1
                            });
                            diarioObj.setValue({
                                    fieldId:"trandate",
                                    value:fecha
                            });
                            diarioObj.setValue({fieldId: "custbody_tipo_transaccion_conauto", value: 12});
                            diarioObj.setValue({fieldId: "custbody_imr_ref_interesesmoratorios", value: recordObj.id});
                            addLineJournal(diarioObj,cuentaDebito,true,importe.toFixed(2), {
                                    memo:nota,
                                    location: 6
                            });
                            addLineJournal(diarioObj,cuentaCredito,false,importe.toFixed(2), {
                                    memo:nota,
                                    location: 6
                            });
                            var diarioId = diarioObj.save({
                                    ignoreMandatoryFields:true
                            });
                            record.submitFields({
                                    type:context.newRecord.type,
                                    id:context.newRecord.id,
                                    values:{
                                            custrecord_imr_intmo_transaccion:diarioId
                                    }
                            })
                    }
            }
        }

            function addLineJournal(journal,account,isdebit,amount,data){
                    data = data||{};
                    journal.selectNewLine({
                            sublistId:"line"
                    });
                    journal.setCurrentSublistValue({
                            sublistId:"line",
                            fieldId:"account",
                            value:account
                    });
                    journal.setCurrentSublistValue({
                            sublistId:"line",
                            fieldId:isdebit?"debit":"credit",
                            value:parseFloat(amount).toFixed(2)
                    });
                    for(var field in data){
                            var value = data[field];
                            journal.setCurrentSublistValue({
                                    sublistId:"line",
                                    fieldId:field,
                                    value:value
                            });
                    }
                    journal.commitLine({
                            sublistId:"line"
                    });
            }

        exports.beforeLoad = beforeLoad;
        exports.beforeSubmit = beforeSubmit;
        exports.afterSubmit = afterSubmit;
        return exports;
    });

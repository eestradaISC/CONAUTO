/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 * @NScriptType UserEventScript
 */
define(["/SuiteScripts/Conauto_Preferences.js","N/record","IMR/IMRParse"],
    /**
     *
     * @param {conautoPreferences} conautoPreferences
     * @param {record} record
     * @param {IMRParse} IMRParse
     * @returns {{beforeSubmit: beforeSubmit, beforeLoad: beforeLoad, afterSubmit: afterSubmit}}
     */
    (conautoPreferences,record,IMRParse) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
                if (scriptContext.type == 'create' || scriptContext.type == 'edit' || scriptContext.type == 'xedit') {
                        let recordObj = record.load({
                                type:scriptContext.newRecord.type,
                                id:scriptContext.newRecord.id
                        })
                        let journalId =  recordObj.getValue({
                                fieldId:"custrecord_imr_polint_transaccion"
                        });
                        if(!journalId){
                                let preferences = conautoPreferences.get();
                                let date = recordObj.getValue({
                                        fieldId:"custrecord_imr_polint_fecha"
                                });
                                let dateReversal = IMRParse.addDays(date,(date.getDate()-1)*-1);
                                dateReversal = IMRParse.addmonths(dateReversal,1);
                                let total = parseFloat(recordObj.getValue({
                                        fieldId:"custrecord_imr_polint_total_pagar"
                                }));
                                let memo = "PROVISION CARTAS DE CREDITO DE CLIENTES INTEGRANTES POR ADJUDICAR";
                                let type = "17";
                                let debitoAccount = preferences.getPreference({
                                        key:"POLINT",
                                        reference:"debito"
                                });
                                let creditoAccount = preferences.getPreference({
                                        key:"POLINT",
                                        reference:"credito"
                                });
                                let journalObj = createRecordHeader(record.Type.JOURNAL_ENTRY,preferences,memo,type,1);
                                journalObj.setValue({
                                        fieldId:"trandate",
                                        value:date
                                });
                                journalObj.setValue({
                                        fieldId:"reversaldefer",
                                        value:true
                                });
                                journalObj.setValue({
                                        fieldId:"reversaldate",
                                        value:dateReversal
                                });
                                addLineJournal(journalObj,debitoAccount,true,total, {
                                  memo:memo
                                });
                                addLineJournal(journalObj,creditoAccount,false,total, {
                                   memo:memo
                                });
                                journalId =  journalObj.save({
                                        ignoreMandatoryFields:true
                                });
                                recordObj.setValue({
                                        fieldId:"custrecord_imr_polint_transaccion",
                                        value:journalId
                                });
                                recordObj.save({
                                        ignoreMandatoryFields:true
                                });
                        }
                }
        }

            const addLineJournal = (journal,account,isdebit,amount,data)=>{
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

            const createRecordHeader = (recordType,preferences,memo,type,typeTransaccion)=>{
                    let journalObj = record.create({
                            type:recordType,
                            isDynamic:true
                    });
                    var subsidiary  = preferences.getPreference({
                            key:"SUBCONAUTO"
                    });
                    journalObj.setValue({
                            fieldId:"subsidiary",
                            value:subsidiary
                    });
                    journalObj.setValue({
                            fieldId:"custbody_imr_tippolcon",
                            value:typeTransaccion||''
                    });
                    journalObj.setValue({
                            fieldId:"custbody_tipo_transaccion_conauto",
                            value:type
                    });
                    journalObj.setValue({
                            fieldId:"memo",
                            value:memo
                    });
                    journalObj.setValue({
                            fieldId:"currency",
                            value:1
                    });
                    return journalObj;
            }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 */
define(['N/record', "/SuiteScripts/Conauto_Preferences.js", "IMR/IMRSearch", "N/format", "IMR/IMRParse"],
        /**
         * @param{record} record
         * @param{conautoPreferences} conautoPreferences
         * @param{IMRSearch} search
         * @param{format} format
         */
        (record, conautoPreferences, search, format, IMRParse) => {
                var fieldIdTransaccion = "custrecord_imr_padj_diario";
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
                        if (scriptContext.type == 'delete') {
                                let transaccionId = scriptContext.oldRecord.getValue(fieldIdTransaccion);
                                if (transaccionId) {
                                        record.delete({
                                                type: record.Type.JOURNAL_ENTRY,
                                                id: transaccionId
                                        })
                                }
                        }
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
                        try {
                                if (["edit", "create", "xedit"].indexOf(scriptContext.type) != -1) {
                                        let recordObj = record.load({
                                                id: scriptContext.newRecord.id,
                                                type: scriptContext.newRecord.type
                                        })
                                        let journalId = recordObj.getValue(fieldIdTransaccion);
                                        if (!journalId) {
                                                createJournal(recordObj);
                                        }
                                }
                        } catch (e) {
                                log.error({
                                        title: "ERROR Poliza Adjudicados",
                                        details: e
                                })
                        }
                }

                /***
                 *
                 * @param {Record} recordObj
                 */
                const createJournal = (recordObj) => {
                        let fecha = recordObj.getValue("custrecord_imr_padj_fecha");
                        fecha = IMRParse.addDays(fecha, fecha.getDate() * -1);
                        let amount = recordObj.getValue("custrecord_imr_padj_monto") || 0;
                        if (amount > 0) {
                                var dateReversal = IMRParse.addDays(fecha, (fecha.getDate() - 1) * -1);
                                dateReversal = IMRParse.addmonths(dateReversal, 1);
                                let preferences = conautoPreferences.get();
                                var mesTexto = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", ""];
                                let memo = 'PROVISION CARTAS DE CREDITO DE CLIENTES ADJUDICATARIOS DEL MES ' + mesTexto[fecha.getMonth()];;
                                let type = '27';
                                let journalObj = createRecordHeader(record.Type.JOURNAL_ENTRY, preferences, memo, type);
                                journalObj.setValue({
                                        fieldId: "trandate",
                                        value: fecha
                                });
                                journalObj.setValue({
                                        fieldId: "custbody_imr_ref_poliza_adjudicados",
                                        value: recordObj.id
                                });
                                journalObj.setValue({
                                        fieldId: "reversaldefer",
                                        value: true
                                });
                                journalObj.setValue({
                                        fieldId: "reversaldate",
                                        value: dateReversal
                                });
                                let accountDebit = preferences.getPreference({
                                        key: "POLADJ",
                                        reference: "debito"
                                });
                                let accountCredit = preferences.getPreference({
                                        key: "POLADJ",
                                        reference: "credito"
                                });
                                setDataLine(journalObj, 'line', [
                                        { fieldId: "account", value: accountDebit },
                                        { fieldId: "debit", value: amount },
                                        { fieldId: "memo", value: memo }
                                ]);
                                setDataLine(journalObj, 'line', [
                                        { fieldId: "account", value: accountCredit },
                                        { fieldId: "credit", value: amount },
                                        { fieldId: "memo", value: memo }
                                ]);
                                let journalId = journalObj.save({
                                        ignoreMandatoryFields: true
                                });
                                recordObj.setValue({
                                        fieldId: "custrecord_imr_padj_diario",
                                        value: journalId
                                });
                                recordObj.save({
                                        ignoreMandatoryFields: true
                                })
                        }
                }


                /***
                 *
                 * @param {Record} transaccionObj
                 * @param {Array} values
                 * @param {String} sublistId
                 */
                const setDataLine = (transaccionObj, sublistId, values) => {
                        transaccionObj.selectNewLine({
                                sublistId: sublistId
                        });
                        for (let i = 0; i < values.length; i++) {
                                var field = values[i];
                                transaccionObj.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: field.fieldId,
                                        value: field.value
                                })
                        }
                        transaccionObj.commitLine({
                                sublistId: sublistId
                        });
                }
                const createRecordHeader = (recordType, preferences, memo, type) => {
                        let journalObj = record.create({
                                type: recordType,
                                isDynamic: true
                        });
                        var subsidiary = preferences.getPreference({
                                key: "SUBCONAUTO"
                        });
                        journalObj.setValue({
                                fieldId: "subsidiary",
                                value: subsidiary
                        });
                        journalObj.setValue({
                                fieldId: "custbody_tipo_transaccion_conauto",
                                value: type
                        });
                        journalObj.setValue({
                                fieldId: "memo",
                                value: memo
                        });
                        journalObj.setValue({
                                fieldId: "currency",
                                value: 1
                        });
                        return journalObj;
                }

                return { beforeLoad, beforeSubmit, afterSubmit }

        });

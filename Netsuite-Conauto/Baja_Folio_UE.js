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
define(["N/record", "IMR/IMRSearch", "/SuiteScripts/Conauto_Preferences.js"],
    /**
     *
     * @param {record} record
     * @param {IMRSearch} search
     * @param {conautoPreferences} conautoPreferences
     */
    function (record, search, conautoPreferences) {

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
            if (context.type == 'create' || context.type == 'edit') {
                var recordObj = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id,
                });
                crearDiario(recordObj);
            }
        }

        function crearDiario(recordObj) {
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_folio"
            });
            var transaccion = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_transaccion"
            });
            if (transaccion) {
                return;
            }
            var estatus = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_estatus"
            });
            var folioTexto = recordObj.getText({
                fieldId: "custrecord_imr_bafo_folio"
            });
            var integranteFolio = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_integrante_folio"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_grupo"
            });
            var grupoTexto = recordObj.getText({
                fieldId: "custrecord_imr_bafo_grupo"
            });
            var cliente = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_integrante"
            });
            var tipoPago = recordObj.getValue({
                fieldId: "custrecord_imr_bafo_tipo_pago"
            });
            var importePago = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_bafo_monto_pagar"
            }));
            var importePenalizacion = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_bafo_monto_pena"
            }));
            var preferencias = conautoPreferences.get();
            var cuentaAportacion = preferencias.getPreference({
                key: "BFRC",
                reference: "aportacion"
            });
            var cuentaBaja = preferencias.getPreference({
                key: "BFRC",
                reference: "baja"
            });
            var cuentaPenalizacion = '';
            var cuentaPorPagar = '';
            var tipoTexto = '';
            var estatusFolio = "";
            switch (estatus) {
                case "1":
                    cuentaPenalizacion = preferencias.getPreference({
                        key: "BFRC",
                        reference: "penalizacionCancelacion"
                    });
                    cuentaPorPagar = preferencias.getPreference({
                        key: "BFRC",
                        reference: "cancelacionPorPagar"
                    });
                    tipoTexto = "Cancelado";
                    estatusFolio = "1";
                    break;

                case "2":
                    cuentaPenalizacion = preferencias.getPreference({
                        key: "BFRC",
                        reference: "penalizacionRescicion"
                    });
                    cuentaPorPagar = preferencias.getPreference({
                        key: "BFRC",
                        reference: "recicionPorPagar"
                    });
                    tipoTexto = "Rescindido";
                    estatusFolio = "2";
                    break;
            }
            var subsidiary = preferencias.getPreference({
                key: "SUBCONAUTO"
            });
            var notaPenalizacion = "REGISTRO DE LA PENALIZACIÓN POR " + tipoTexto + " DEL FOLIO " + folioTexto + " - " + " Gpo " + grupoTexto + " - Int " + integranteFolio;
            var notaPago = "PROVISION BAJA POR " + tipoTexto + " DEL FOLIO " + folioTexto + " - " + " Gpo " + grupoTexto + " - Int " + integranteFolio;
            var dataUpdate = {};
            if (importePenalizacion) {
                var diarioPenalizacionObj = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
                diarioPenalizacionObj.setValue({
                    fieldId: "subsidiary",
                    value: subsidiary
                });
                diarioPenalizacionObj.setValue({
                    fieldId: "memo",
                    value: notaPenalizacion
                });
                diarioPenalizacionObj.setValue({
                    fieldId: "custbody_tipo_transaccion_conauto",
                    value: 19
                });
                diarioPenalizacionObj.setValue({
                    fieldId: "currency",
                    value: 1
                });
                diarioPenalizacionObj.setValue({
                    fieldId: "custbody_imr_ref_baja_folio",
                    value: recordObj.id
                });
                addLineJournal(diarioPenalizacionObj, cuentaAportacion, true, importePenalizacion.toFixed(2), {
                    entity: cliente,
                    memo: notaPenalizacion,
                    cseg_folio_conauto: folio,
                    cseg_grupo_conauto: grupo,
                    location: 6
                });
                addLineJournal(diarioPenalizacionObj, cuentaPenalizacion, false, importePenalizacion.toFixed(2), {
                    entity: cliente,
                    memo: notaPenalizacion,
                    cseg_folio_conauto: folio,
                    cseg_grupo_conauto: grupo,
                    location: 6
                });
                var idPenalizacionDiario = diarioPenalizacionObj.save({
                    ignoreMandatoryFields: true
                });
                dataUpdate["custrecord_imr_bafo_transaccion"] = idPenalizacionDiario;
            }
            if (importePago) {
                var diarioPagoObj = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
                diarioPagoObj.setValue({
                    fieldId: "subsidiary",
                    value: subsidiary
                });
                diarioPagoObj.setValue({
                    fieldId: "memo",
                    value: notaPago
                });
                diarioPagoObj.setValue({
                    fieldId: "custbody_tipo_transaccion_conauto",
                    value: 19
                });
                diarioPagoObj.setValue({
                    fieldId: "currency",
                    value: 1
                });
                diarioPagoObj.setValue({
                    fieldId: "custbody_imr_ref_baja_folio",
                    value: recordObj.id
                });
                addLineJournal(diarioPagoObj, cuentaBaja, true, importePago.toFixed(2), {
                    entity: cliente,
                    memo: notaPago,
                    cseg_folio_conauto: folio,
                    cseg_grupo_conauto: grupo,
                    location: 6
                });
                addLineJournal(diarioPagoObj, cuentaPorPagar, false, importePago.toFixed(2), {
                    entity: cliente,
                    memo: notaPago,
                    cseg_folio_conauto: folio,
                    cseg_grupo_conauto: grupo,
                    location: 6
                });
                var idPagoDiario = diarioPagoObj.save({
                    ignoreMandatoryFields: true
                });
                dataUpdate["custrecord_imr_bafo_transaccion_2"] = idPagoDiario;
            }
            if (folio) {
                record.submitFields({
                    type: "customrecord_cseg_folio_conauto",
                    id: folio,
                    values: {
                        custrecord_folio_subestatus: estatusFolio
                    }
                })
            }
            if (Object.getOwnPropertyNames(dataUpdate).length > 0) {
                record.submitFields({
                    type: recordObj.type,
                    id: recordObj.id,
                    values: dataUpdate
                })
            }
        }

        function addLineJournal(journal, account, isdebit, amount, data) {
            data = data || {};
            journal.selectNewLine({
                sublistId: "line"
            });
            journal.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: account
            });
            journal.setCurrentSublistValue({
                sublistId: "line",
                fieldId: isdebit ? "debit" : "credit",
                value: parseFloat(amount).toFixed(2)
            });
            for (var field in data) {
                var value = data[field];
                journal.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: field,
                    value: value
                });
            }
            journal.commitLine({
                sublistId: "line"
            });
        }

        exports.beforeLoad = beforeLoad;
        exports.beforeSubmit = beforeSubmit;
        exports.afterSubmit = afterSubmit;
        return exports;
    });

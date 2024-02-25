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
define(["N/record", "IMR/IMRSearch", "/SuiteScripts/Conauto_Preferences.js", "N/format"],
    /***
     *
     * @param {record} record
     * @param {IMRSearch} search
     * @param {conautoPreferences} conautoPreferences
     * @param {format} format
     */
    function (record, search, conautoPreferences, format) {

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
            if (context.type == 'delete') {
                var recordObj = record.load({
                    type: context.oldRecord.type,
                    id: context.oldRecord.id
                });
                var transaccion = recordObj.getValue({
                    fieldId: "custrecord_imr_solpa_transaccion",
                });
                if (transaccion) {
                    var data = search.lookupFieldsIMR({
                        id: transaccion,
                        type: search.main().Type.TRANSACTION,
                        columns: ["internalid", "recordtype"]
                    })
                    record.delete({
                        id: data.internalid.value,
                        type: data.recordtype.value
                    })
                }
            } else if (context.type == 'create' || context.type == 'edit' || context.type == 'xedit') {
                var folioText = context.newRecord.getValue({
                    fieldId: "custrecord_imr_solpa_folio_texto"
                })
                var folio = context.newRecord.getValue({
                    fieldId: "custrecord_imr_solpa_folio"
                });
                var claveBancaria = context.newRecord.getValue("custrecord_imr_ctaclabe_con") || '';
                var listBanxico = getListBanxico();
                var codeBanxico = getBanxicoCode(claveBancaria, listBanxico);
                context.newRecord.setValue({
                    fieldId: "custrecord_imr_solpa_banco",
                    value: codeBanxico || ''
                });
                if (folioText && !folio) {
                    var folio = recordFind("customrecord_cseg_folio_conauto", "anyof", "externalid", folioText);
                    if (folio) {
                        context.newRecord.setValue({
                            fieldId: "custrecord_imr_solpa_folio",
                            value: folio
                        })
                    }
                }
            }
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
            if (context.type == 'create' || context.type == 'edit' || context.type == 'xedit') {
                var recordObj = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });
                var type = recordObj.getValue({
                    fieldId: "custrecord_imr_solpa_tipo_mov"
                });
                var transaccion = recordObj.getValue({
                    fieldId: "custrecord_imr_solpa_transaccion"
                });
                var callbacks = {
                    "1": siniestroVida,
                    "2": siniestroAuto,
                    "3": pagoUnidad,
                    "4": pagoUnidadSiniestro,
                    "5": cancelacion,
                    "6": rescision,
                    "7": devolucionSaldoFavor,
                    "8": devolucionPrimeraCuota,
                };
                var callback = callbacks[type];
                if (callback && !transaccion) {
                    if (callback != "3") {
                        var transaccion = callback(recordObj);
                        if (transaccion) {
                            record.submitFields({
                                type: context.newRecord.type,
                                id: context.newRecord.id,
                                values: {
                                    custrecord_imr_solpa_transaccion: transaccion
                                }
                            })
                        }
                    }
                }
            }
        }


        function siniestroVida(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioTexto = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioColumnText = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio_texto"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var cuentaDebito = preferences.getPreference({
                key: "SPSV",
                reference: "debito"
            });
            var cuentaCredito = preferences.getPreference({
                key: "SPSV",
                reference: "credito"
            });
            var clienteId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: [rfc, nombre].join(" "),
                legalname: nombre,
                subsidiary: subsidiary,
                vatregnumber: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var diarioObj = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            diarioObj.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_tippolcon",
                value: 1
            });

            var memoText = "PROVISION DEVOLUCION DE SALDO A FAVOR DEL CLIENTE Folio" + folioTexto + " - GPO " + getGrpIntegrante(recordObj) + " POR SINIESTRO DE VIDA";
            diarioObj.setValue({
                fieldId: "memo",
                value: memoText
            });
            diarioObj.setValue({
                fieldId: "currency",
                value: 1
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            diarioObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            addLineJournal(diarioObj, cuentaDebito, true, importe.toFixed(2), {
                entity: clienteId,
                memo: memoText,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6,
                custcol_folio_texto_conauto: folioColumnText
            });
            addLineJournal(diarioObj, cuentaCredito, false, importe.toFixed(2), {
                entity: clienteId,
                memo: memoText,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6,
                custcol_folio_texto_conauto: folioColumnText
            });
            var diarioId = diarioObj.save({
                ignoreMandatoryFields: true
            });
            conautoPreferences.setFolioConauto(diarioId);
            return diarioId;
        }

        function siniestroAuto(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioTexto = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var cuentaDebito = preferences.getPreference({
                key: "SPSA",
                reference: "debito"
            });
            var cuentaCredito = preferences.getPreference({
                key: "SPSA",
                reference: "credito"
            });
            var clienteId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: [rfc, nombre].join(" "),
                legalname: nombre,
                subsidiary: subsidiary,
                vatregnumber: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var diarioObj = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            diarioObj.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_tippolcon",
                value: 1
            });
            var memoText = "DEVOLUCION DE SALDO A FAVOR DEL CLIENTE FOLIO " + folioTexto + " - GPO " + getGrpIntegrante(recordObj) + " POR SINIESTRO DE AUTO"
            diarioObj.setValue({
                fieldId: "memo",
                value: memoText
            });
            diarioObj.setValue({
                fieldId: "currency",
                value: 1
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            diarioObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            addLineJournal(diarioObj, cuentaDebito, true, importe.toFixed(2), {
                entity: clienteId,
                memo: memoText,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6,
                custcol_folio_texto_conauto: folioTexto
            });
            addLineJournal(diarioObj, cuentaCredito, false, importe.toFixed(2), {
                entity: clienteId,
                memo: memoText,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6,
                custcol_folio_texto_conauto: folioTexto
            });
            var diarioId = diarioObj.save({
                ignoreMandatoryFields: true
            });
            conautoPreferences.setFolioConauto(diarioId);
            return diarioId;
        }

        function pagoUnidad(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio_texto"
            });
            var folioId = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioTexto = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio_texto"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var cuentaGasto = preferences.getPreference({
                key: "SPUP",
                reference: "gasto"
            });
            var cuentaPorPagar = preferences.getPreference({
                key: "SPUP",
                reference: "porPagar"
            });
            var impuesto = preferences.getPreference({
                key: "SPUP",
                reference: "impuesto"
            });
            var dataImpuesto = search.lookupFieldsIMR({
                type: "salestaxitem",
                id: impuesto,
                columns: ["rate"]
            });
            var tasaImpuesto = parseFloat(dataImpuesto.rate.value) / 100;
            var importeGasto = parseFloat((importe / (1 + tasaImpuesto)).toFixed(2));
            var importeImpuesto = parseFloat((importe - importeGasto).toFixed(2));
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var proveedorId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: nombre,
                legalname: nombre,
                subsidiary: subsidiary,
                vatregnumber: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var nota = "Pago de unidad de adjudicados del Gpo-" + getGrpIntegrante(recordObj) + " No de Folio" + (folio ? (" " + folio) : "");
            var tranidnote = "PDU ADJ Gpo-" + getGrpIntegrante(recordObj) + " Folio: " + folio
            var facturaObj = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true
            });
            facturaObj.setValue({
                fieldId: "entity",
                value: proveedorId
            });
            log.error("PROVEEDOR", proveedorId)
            facturaObj.setValue({
                fieldId: "tranid",
                value: tranidnote
            });
            log.error("TRANID", tranidnote)
            facturaObj.setValue({
                fieldId: "custbody_imr_tippolcon",
                value: 3
            });
            facturaObj.setValue({
                fieldId: "approvalstatus",
                value: 2
            });
            facturaObj.setValue({
                fieldId: "memo",
                value: nota
            });
            log.error("NOTA", nota)
            facturaObj.setValue({
                fieldId: "account",
                value: cuentaPorPagar
            });
            log.error("CUENTA PAGAR", cuentaPorPagar)
            facturaObj.setValue({
                fieldId: "cseg_folio_conauto",
                value: folioId
            });
            log.error("FOLIO", folioId)
            facturaObj.setValue({
                fieldId: "cseg_grupo_conauto",
                value: grupo
            });
            log.error("GRUPO", grupo)
            facturaObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });

            facturaObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            facturaObj.setValue({
                fieldId: "location",
                value: 6
            });
            facturaObj.selectNewLine({
                sublistId: "expense"
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "account",
                value: cuentaGasto
            });
            log.error("CUENTA GASTO", cuentaGasto)
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "amount",
                value: importeGasto
            });
            log.error("IMPORTE GASTO", importeGasto)
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "taxcode",
                value: impuesto
            });
            log.error("IMPUESTO", impuesto)
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "memo",
                value: nota
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "location",
                value: 6
            });
            facturaObj.commitLine({
                sublistId: "expense"
            })
            var facturaId = facturaObj.save({
                ignoreMandatoryFields: true
            });
            conautoPreferences.setFolioConauto(facturaId);
            return facturaId;
        }

        function pagoUnidadSiniestro(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio_texto"
            });
            var folioId = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var grupoTexto = recordObj.getText({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var integrante = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_integrante"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var cuentaGasto = preferences.getPreference({
                key: "SPUPSA",
                reference: "gasto"
            });
            var cuentaPorPagar = preferences.getPreference({
                key: "SPUPSA",
                reference: "porPagar"
            });
            var impuesto = preferences.getPreference({
                key: "SPUPSA",
                reference: "impuesto"
            });
            var dataImpuesto = search.lookupFieldsIMR({
                type: "salestaxitem",
                id: impuesto,
                columns: ["rate"]
            });
            var tasaImpuesto = parseFloat(dataImpuesto.rate.value) / 100;
            var importeGasto = parseFloat((importe / (1 + tasaImpuesto)).toFixed(2));
            var importeImpuesto = parseFloat((importe - importeGasto).toFixed(2));
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var proveedorId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: nombre,
                legalname: nombre,
                subsidiary: subsidiary,
                vatregnumber: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var folioForMemo = folio ? (" Folio:" + folio) : "";
            var nota = "Pago de unidad de adjudicados por siniestro del grupo integrante" + grupoTexto + " - " + integrante + ", No. Folio " + folioForMemo + ", " + nombre;
            // var nota = "Provision por pago de unidad x siniestro de auto" + folioForMemo;
            var tranidnote = "Provision PDU x siniestro auto " + folioForMemo;
            var facturaObj = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true
            });
            facturaObj.setValue({
                fieldId: "entity",
                value: proveedorId
            });
            facturaObj.setValue({
                fieldId: "custbody_imr_tippolcon",
                value: 3
            });
            facturaObj.setValue({
                fieldId: "memo",
                value: nota
            });
            facturaObj.setValue({
                fieldId: "approvalstatus",
                value: 2
            });
            facturaObj.setValue({
                fieldId: "account",
                value: cuentaPorPagar
            });
            facturaObj.setValue({
                fieldId: "cseg_folio_conauto",
                value: folioId
            });
            facturaObj.setValue({
                fieldId: "cseg_grupo_conauto",
                value: grupo
            });
            facturaObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            facturaObj.setValue({
                fieldId: "location",
                value: 6
            });
            facturaObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            facturaObj.selectNewLine({
                sublistId: "expense"
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "account",
                value: cuentaGasto
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "amount",
                value: importeGasto
            });

            // Añadir aprobadores
            facturaObj.setValue({
                fieldId: "custbody_sig_aprobador_pedido",
                value: 2950
            });
            facturaObj.setValue({
                fieldId: "custbody_aprobador_pedido",
                value: 2950
            });
            //---------------------

            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "taxcode",
                value: impuesto
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "memo",
                value: nota
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "location",
                value: 6
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "department",
                value: 34
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "class",
                value: 6
            });
            facturaObj.setCurrentSublistValue({
                sublistId: "expense",
                fieldId: "customer",
                value: 131103
            });
            facturaObj.commitLine({
                sublistId: "expense"
            })
            var facturaId = facturaObj.save({
                ignoreMandatoryFields: true
            });
            conautoPreferences.setFolioConauto(facturaId);
            return facturaId;
        }

        function cancelacion(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioText = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var cuentaDebito = preferences.getPreference({
                key: "SPRC",
                reference: "debito"
            });
            var cuentaCredito = preferences.getPreference({
                key: "SPRC",
                reference: "credito"
            });
            var otroNombreId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: [rfc, nombre].join(" "),
                subsidiary: subsidiary,
                legalname: nombre,
                vatregnumber: rfc,
                custentity_imr_rfc_operacion: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var nota = "REEMBOLSO POR CANCELACION DE CONTRATO FOLIO " + folioText + " - GPO " + getGrpIntegrante(recordObj);
            var diarioObj = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            diarioObj.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });
            diarioObj.setValue({
                fieldId: "memo",
                value: nota
            });
            diarioObj.setValue({
                fieldId: "currency",
                value: 1
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            diarioObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            addLineJournal(diarioObj, cuentaDebito, true, importe.toFixed(2), {
                entity: otroNombreId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6
            });
            addLineJournal(diarioObj, cuentaCredito, false, importe.toFixed(2), {
                entity: otroNombreId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6
            });
            return diarioObj.save({
                ignoreMandatoryFields: true
            });
        }

        function rescision(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioText = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio"
            })
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var cuentaDebito = preferences.getPreference({
                key: "SPRR",
                reference: "debito"
            });
            var cuentaCredito = preferences.getPreference({
                key: "SPRR",
                reference: "credito"
            });
            var clienteId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: [rfc, nombre].join(" "),
                subsidiary: subsidiary,
                legalname: nombre,
                vatregnumber: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var nota = "REEMBOLSO POR RESCICION DE CONTRATO FOLIO " + folioText + " - GPO " + getGrpIntegrante(recordObj);
            var diarioObj = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            diarioObj.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });
            diarioObj.setValue({
                fieldId: "memo",
                value: nota
            });
            diarioObj.setValue({
                fieldId: "currency",
                value: 1
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            diarioObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            addLineJournal(diarioObj, cuentaDebito, true, importe.toFixed(2), {
                entity: clienteId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6
            });
            addLineJournal(diarioObj, cuentaCredito, false, importe.toFixed(2), {
                entity: clienteId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6
            });
            return diarioObj.save({
                ignoreMandatoryFields: true
            });
        }

        function devolucionSaldoFavor(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioText = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio"
            })
            var estado = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_estado_folio"
            });
            var subestado = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_subestado_folio"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var cuentaDebito = '';
            var cuentaCredito = '';
            if (estado == '4') {
                cuentaDebito = preferences.getPreference({
                    key: "SPSF",
                    reference: "debitoAP"
                });
                cuentaCredito = preferences.getPreference({
                    key: "SPSF",
                    reference: "creditoAP"
                });
            } else if (subestado == '3') {
                cuentaDebito = preferences.getPreference({
                    key: "SPSF",
                    reference: "debitoCL"
                });
                cuentaCredito = preferences.getPreference({
                    key: "SPSF",
                    reference: "creditoCL"
                });
            } else {
                cuentaDebito = preferences.getPreference({
                    key: "SPSF",
                    reference: "debitoDefault"
                });
                cuentaCredito = preferences.getPreference({
                    key: "SPSF",
                    reference: "creditoDefault"
                });
            }
            var clienteId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: [rfc, nombre].join(" "),
                subsidiary: subsidiary,
                legalname: nombre,
                vatregnumber: rfc,
                custentity_imr_rfc_operacion: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var nota = "Devolución Saldo a Favor Folio " + folioText + " - Gpo" + getGrpIntegrante(recordObj);
            var diarioObj = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            diarioObj.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });
            diarioObj.setValue({
                fieldId: "memo",
                value: nota
            });
            diarioObj.setValue({
                fieldId: "currency",
                value: 1
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            diarioObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            addLineJournal(diarioObj, cuentaDebito, true, importe.toFixed(2), {
                entity: clienteId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6
            });
            addLineJournal(diarioObj, cuentaCredito, false, importe.toFixed(2), {
                entity: clienteId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6
            });
            return diarioObj.save({
                ignoreMandatoryFields: true
            });
        }

        function devolucionPrimeraCuota(recordObj) {
            var rfc = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_rfc_ben"
            });
            var referencia = recordObj.getValue({
                fieldId: "custrecord_imr_referenciacon"
            });
            var folio = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioText = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio"
            });
            var folioColumnText = recordObj.getText({
                fieldId: "custrecord_imr_solpa_folio_texto"
            });
            var grupo = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            var nombre = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_nom_ben"
            });
            var importe = parseFloat(recordObj.getValue({
                fieldId: "custrecord_imr_solpa_importe"
            }));
            var preferences = conautoPreferences.get();
            var subsidiary = preferences.getPreference({
                key: "SUBCONAUTO"
            });
            var cuentaDebito = preferences.getPreference({
                key: "CCNI"
            });
            var cuentaCredito = preferences.getPreference({
                key: "D1CP"
            });
            var clienteId = createUpdateEntity("custentity_imr_llave_integracion", [rfc, nombre].join("_"), 'vendor', {
                isperson: "F",
                companyname: [rfc, nombre].join(" "),
                subsidiary: subsidiary,
                legalname: nombre,
                vatregnumber: rfc,
                custentity_imr_rfc_operacion: rfc,
                custentity_imr_llave_integracion: [rfc, nombre].join("_")
            });
            var fecha = new Date();
            var dia = rellenarDatoFecha(fecha.getDate());
            var mes = rellenarDatoFecha(fecha.getMonth() + 1);
            var año = rellenarDatoFecha(fecha.getFullYear());
            var folioNota = [referencia, dia, mes, año];
            var nota = "Devolución De 1ra cuota de la cobranza recibida de la referencia " + referencia + " - Folio " + folioText;
            var diarioObj = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            diarioObj.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });
            diarioObj.setValue({
                fieldId: "memo",
                value: nota
            });
            diarioObj.setValue({
                fieldId: "currency",
                value: 1
            });
            diarioObj.setValue({
                fieldId: "custbody_imr_ref_sol_pago",
                value: recordObj.id
            });
            diarioObj.setValue({
                fieldId: "custbody_tipo_transaccion_conauto",
                value: 25
            });
            addLineJournal(diarioObj, cuentaDebito, true, importe.toFixed(2), {
                entity: clienteId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6,
                custcol_folio_texto_conauto: folioColumnText
            });
            addLineJournal(diarioObj, cuentaCredito, false, importe.toFixed(2), {
                entity: clienteId,
                memo: nota,
                cseg_folio_conauto: folio,
                cseg_grupo_conauto: grupo,
                location: 6,
                custcol_folio_texto_conauto: folioColumnText
            });

            const idJournal = diarioObj.save({ ignoreMandatoryFields: true });

            return idJournal;
        }

        function getGrpIntegrante(recordObj) {
            var integrante = recordObj.getValue({
                fieldId: "custrecord_imr_solpa_integrante"
            });
            var grupo = recordObj.getText({
                fieldId: "custrecord_imr_solpa_grupo"
            });
            return grupo + " - Int " + integrante
        }

        function rellenarDatoFecha(value) {
            if (util.isNumber(value)) {
                value = value.toFixed(0);
            }
            if (value.length < 2) {
                return '0' + value;
            } else {
                return value;
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

        function createUpdateEntity(field, value, entityType, dataFields) {
            var recordEntityId = recordFind(entityType, 'is', field, value);
            if (!recordEntityId) {
                var recordEntity = record.create({
                    type: entityType,
                    isDynamic: true
                });
                for (var fieldKey in dataFields) {
                    var value = dataFields[fieldKey];
                    recordEntity.setValue({
                        fieldId: fieldKey,
                        value: value
                    });
                }
                recordEntityId = recordEntity.save({
                    ignoreMandatoryFields: true
                });
            }
            return recordEntityId;
        }

        function recordFind(recordType, operator, field, value) {
            var id = null;
            log.error({ title: "recordFind", details: "recordType: " + recordType + " operator: " + operator + " field: " + field + " value: " + value })
            if (value) {
                var results = search.searchAllRecords({
                    type: recordType,
                    filters: [
                        search.createFilter({
                            name: field,
                            operator: operator,
                            values: [value]
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid"
                        })
                    ]
                });
                if (results.length > 0) {
                    id = results[0].getValue({
                        name: "internalid"
                    });
                }
            }
            return id;
        }

        function getBanxicoCode(clave, listBanxico) {
            var code = parseFloat((clave || '').substring(0, 3));
            return listBanxico[code];
        }
        function getListBanxico() {
            var banxicoList = {};
            search.searchAllRecords({
                id: "customsearch_lista_numero_banxico",
                data: banxicoList,
                callback: function (result, banxicoList) {
                    var number = parseFloat(result.getValue({
                        name: "formulanumeric"
                    }));
                    var id = result.id;
                    banxicoList[number] = id;
                }
            });
            return banxicoList;
        }

        exports.beforeLoad = beforeLoad;
        exports.beforeSubmit = beforeSubmit;
        exports.afterSubmit = afterSubmit;
        return exports;
    });

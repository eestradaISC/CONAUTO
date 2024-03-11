/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 */
define(['N/record', "/SuiteScripts/Conauto_Preferences.js", "IMR/IMRSearch", "N/format", "N/url", "N/https"],
    /**
     * @param{record} record
     * @param{conautoPreferences} conautoPreferences
     * @param{IMRSearch} search
     * @param{format} format
     * @param{url} url
     * @param{https} https
     */
    (record, conautoPreferences, search, format, url, https) => {
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
            try {
                if (["edit", "create"].indexOf(scriptContext.type) != -1) {
                    let bid = scriptContext.newRecord.getValue("custrecord_imr_pu_bid");
                    let vendor = scriptContext.newRecord.getValue("custrecord_imr_pu_proveedor");
                    if (bid && !vendor) {
                        let resultsVendors = search.searchAllRecords({
                            type: search.main().Type.VENDOR,
                            filters: [
                                search.createFilter({
                                    name: "externalid",
                                    operator: search.main().Operator.ANYOF,
                                    values: [bid]
                                })
                            ],
                            columns: [
                                search.createColumn({
                                    name: "internalid"
                                })
                            ]
                        });
                        if (resultsVendors.length > 0) {
                            vendor = resultsVendors[0].getValue({
                                name: "internalid"
                            });
                            scriptContext.newRecord.setValue({
                                fieldId: "custrecord_imr_pu_proveedor",
                                value: vendor
                            })
                        }
                    }
                } else if (scriptContext.type == 'delete') {
                    let vendorBillId = scriptContext.oldRecord.getValue("custrecord_imr_pu_transaccion");
                    if (vendorBillId) {
                        record.delete({
                            type: record.Type.VENDOR_BILL,
                            id: vendorBillId
                        })
                    }
                }
            } catch (e) {
                log.error({
                    title: "ERROR siniestro Vida",
                    details: e
                })
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
                    let vendorBillId = recordObj.getValue("custrecord_imr_pu_transaccion");
                    if (!vendorBillId) {
                        createVendorBill(recordObj);
                    }
                    let pago = recordObj.getValue("custrecord_imr_pu_pago_amortizacion");
                    let importeDiferencia = parseFloat(recordObj.getValue("custrecord_imr_pu_dif_cc_vf")) || 0;
                    if (!pago && importeDiferencia) {
                        /*var urlRecord = url.resolveScript({
                          scriptId:"customscript_imr_create_record_st",
                          deploymentId:"customdeploy_imr_create_record_st",
                          returnExternalUrl:true
                        });
                        https.post({
                          url:urlRecord,
                          headers:{
                            "Content-Type":'application/json'
                          },
                          body:JSON.stringify({
                            recordType:"customrecord_imr_pagos_amortizacion",
                            fieldTo:"custrecord_imr_pu_pago_amortizacion",
                            recordTypeTo:"customrecord_imr_pago_unidad",
                            recordIdTo:recordObj.id,
                            values:{
                              custrecord_imr_pa_folio_texto:recordObj.getText("custrecord_imr_pu_folio"),
                              custrecord_imr_pa_referencia:(recordObj.getValue("custrecord_imr_pu_referencia")||'').substring(0,2),
                              custrecord_imr_pa_referencia_completa:(recordObj.getValue("custrecord_imr_pu_referencia")||''),
                              custrecord_imr_pa_importe:importeDiferencia,
                              custrecord_imr_pa_folio:recordObj.getValue("custrecord_imr_pu_folio"),
                              custrecord_imr_pa_pago_virtual:true
                            }
                          })
                        });*/
                    }
                }
            } catch (e) {
                log.error({
                    title: "ERROR siniestro Vida",
                    details: e
                })
            }
        }
        /***
         *
         * @param {Record} recordObj
         */
        const createVendorBill = (recordObj) => {
            let importeFactura = parseFloat(recordObj.getValue("custrecord_imr_pu_factura"));
            let importeCartaCredito = parseFloat(recordObj.getValue("custrecord_imr_pu_carta_credito"));
            let importeTotal = parseFloat(recordObj.getValue("custrecord_imr_pu_total_pagar"))
            let importeDiferencia = parseFloat(recordObj.getValue("custrecord_imr_pu_dif_cc_vf"));
            let vendor = recordObj.getValue("custrecord_imr_pu_proveedor");
            let grupoText = recordObj.getText("custrecord_imr_pu_grupo");
            let grupo = recordObj.getValue("custrecord_imr_pu_grupo");
            let folio = recordObj.getValue("custrecord_imr_pu_folio");
            let folioText = recordObj.getText("custrecord_imr_pu_folio");
            let importeDefinitivo = (importeDiferencia > 0) ? importeCartaCredito : importeTotal;
            let integrante = recordObj.getText("custrecord_imr_pu_integrante");
            let numFactura = recordObj.getValue("custrecord_imr_pu_num_factura") || '';
            let memo = 'Provisión de Pago de unidad de adjudicados Folio ' + folioText + ' - Gpo ' + grupoText + ' - Int ' + integrante
            if (vendor && importeFactura) {
                let preferences = conautoPreferences.get();
                let subsidiary = preferences.getPreference({
                    key: "SUBCONAUTO"
                });
                let cuentaPorPagar = preferences.getPreference({
                    key: "PU",
                    reference: "porPagar"
                });
                let cuentaImporte = preferences.getPreference({
                    key: "PU",
                    reference: "autosAdjudicados"
                });
                let cuentaDiferencia = preferences.getPreference({
                    key: "PU",
                    reference: "diferencia"
                });
                let vendorBillObj = record.create({
                    type: record.Type.VENDOR_BILL,
                    isDynamic: true
                });
                vendorBillObj.setValue({
                    fieldId: "entity",
                    value: vendor,
                });
                vendorBillObj.setValue({
                    fieldId: "subsidiary",
                    value: subsidiary
                });
                vendorBillObj.setValue({
                    fieldId: "tranid",
                    value: "Provision PDU x siniestro auto Folio:1143004"
                });
                vendorBillObj.setValue({
                    fieldId: "approvalstatus",
                    value: 2
                });
                vendorBillObj.setValue({
                    fieldId: "custbody_imr_tippolcon",
                    value: 3
                });
                // Añadir aprobadores
                vendorBillObj.setValue({
                    fieldId: "custbody_sig_aprobador_pedido",
                    value: 2950
                });
                vendorBillObj.setValue({
                    fieldId: "custbody_aprobador_pedido",
                    value: 2950
                });
                //---------------------
                vendorBillObj.setValue({
                    fieldId: "memo",
                    value: memo,
                });
                vendorBillObj.setValue({
                    fieldId: "location",
                    value: 6,
                });
                vendorBillObj.setValue({
                    fieldId: "cseg_folio_conauto",
                    value: folio
                });
                vendorBillObj.setValue({
                    fieldId: "cseg_grupo_conauto",
                    value: grupo
                });
                vendorBillObj.setValue({ fieldId: "custbody_imr_ref_pagounidad", value: recordObj.id });
                vendorBillObj.setValue({
                    fieldId: "account",
                    value: cuentaPorPagar
                });
                setDataLine(vendorBillObj, 'expense', [
                    { fieldId: "account", value: cuentaImporte },
                    { fieldId: "amount", value: importeDefinitivo },
                    { fieldId: "taxcode", value: 5 },
                    { fieldId: "location", value: 6 },
                    { fieldId: "memo", value: memo },
                    { fieldId: "class", value: 26 }
                ]);
                if (importeDiferencia) {
                    setDataLine(vendorBillObj, 'expense', [
                        { fieldId: "account", value: cuentaDiferencia },
                        { fieldId: "amount", value: importeDiferencia * -1 },
                        { fieldId: "taxcode", value: 5 },
                        { fieldId: "location", value: 6 },
                        { fieldId: "memo", value: memo },
                        { fieldId: "class", value: 26 }
                    ]);
                }
                let vendorBillId = vendorBillObj.save({
                    ignoreMandatoryFields: true
                });
                conautoPreferences.setFolioConauto(vendorBillId);
                recordObj.setValue({
                    fieldId: "custrecord_imr_pu_transaccion",
                    value: vendorBillId
                })
                recordObj.save({
                    ignoreMandatoryFields: true
                });

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
        return { beforeLoad, beforeSubmit, afterSubmit }

    });
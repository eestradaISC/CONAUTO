/**
 * Module Description...
 *
 * @copyright 2020 IMR
 * @author Gonzalo Rodriguez gonzalo.roriguez@imr.com.mx
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 * @NApiVersion 2.1
 * @NModuleScope SameAccount

 * @NScriptType UserEventScript
 */
define(["IMR/IMRSearch", "N/record", "/SuiteScripts/Conauto_Preferences.js", 'N/https', 'N/url'],
    /**
     *
     * @param {IMRSearch} search
     * @param {record} record
     * @param {conautoPreferences} conautoPreferences
     */
    function (search, record, conautoPreferences, https, url) {

        let exports = {};
        let typesTransaccion = {
            "1": "6",
            "2": "9",
            "3": "10",
            "4": "11"
        };
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
            if (context.type == 'create' || context.type == 'edit' || context.type == 'xedit') {
                let newRecord = context.newRecord;
                let folioText = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_folio_texto",
                });
                let folioId = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_folio",
                });
                let importe = parseFloat(newRecord.getValue({
                    fieldId: "custrecord_imr_pa_importe",
                })) || 0;
                let aplicado = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_aplicado"
                });
                let grupoLiquidado = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_grupo_liquidado"
                });
                let amortizacionId = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_amortizacion"
                });
                let formaPago = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                }); //L.R.M.R 01/10/2021
                log.error('ERROR', 'Forma de pago: ' + formaPago);
                if (!folioId && folioText) {
                    folioId = recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", folioText);
                    newRecord.setValue({
                        fieldId: "custrecord_imr_pa_folio",
                        value: folioId
                    });
                }
                if (folioId && !amortizacionId) {
                    let amortizacionId = recordFind("customrecord_imr_amortizacionconauto_enc", 'anyof', "internalid", folioId, "custrecord_imr_amo_folios_permitidos");
                    newRecord.setValue({
                        fieldId: "custrecord_imr_pa_amortizacion",
                        value: amortizacionId
                    });
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

                let newRecord = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });

                let date = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_fecha",
                });
                let recerencia = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_referencia",
                }) || '';
                let amortizacionId = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_amortizacion"
                });
                let folioText = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_folio_texto",
                });
                let folioId = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_folio",
                });
                let grupoId = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_grupo",
                });
                let formaPago = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago",
                });
                let importe = parseFloat(newRecord.getValue({
                    fieldId: "custrecord_imr_pa_importe",
                })) || 0;
                let aplicado = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_aplicado"
                });
                let grupoLiquidado = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_grupo_liquidado"
                });
                let recerenciaCompleta = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let diarioNoIden = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_diario_no_iden"
                });
                let diarioCancelacion = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_diario_cancelacion"
                });
                let cliente = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                }) || '';
                let diarioIden = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_diario"
                });
                let esCancelado = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_cancelado"
                });
                let diarioReinstalacion = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_diario_reinstalacion"
                });
                let reinstalacion = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_reinstalacion"
                });
                let pagoVirtual = newRecord.getValue({
                    fieldId: "custrecord_imr_pa_pago_virtual"
                });

                let montosReparto = {
                    "gastos": parseFloat(newRecord.getValue({
                        fieldId: "custrecord_conauto_gastos"
                    })) + parseFloat(newRecord.getValue({
                        fieldId: "custrecord_conauto_iva"
                    })),
                    "seguroVida": parseFloat(newRecord.getValue({
                        fieldId: "custrecord_conauto_seguro_vida"
                    })),
                    "seguroAuto": parseFloat(newRecord.getValue({
                        fieldId: "custrecord_conauto_seguro_auto"
                    })),
                    "aportacion": parseFloat(newRecord.getValue({
                        fieldId: "custrecord_conauto_aportacion"
                    })),
                    "saldoFavor": 0 /*|| parseFloat((newRecord.getValue({
                        fieldId: "custrecord_conauto_iva"
                    })))*/
                }

                if (pagoVirtual) {
                    if (!aplicado) {
                        newRecord.setValue({
                            fieldId: "custrecord_imr_pa_aplicado",
                            value: true
                        });
                        newRecord.setValue({
                            fieldId: "custrecord_imr_pa_fecha_aplicacion",
                            value: new Date()
                        });
                        newRecord.save({
                            ignoreMandatoryFields: true
                        });
                    }
                } else {
                    if (!diarioCancelacion) {
                        if (folioId) {
                            if (!aplicado && importe && !diarioIden) {
                                let preferences = conautoPreferences.get();
                                if (grupoLiquidado) {
                                    let diarioId = crearDiarioLiquidacion(preferences, diarioNoIden, recerenciaCompleta, newRecord);
                                    newRecord.setValue({
                                        fieldId: "custrecord_imr_pa_diario",
                                        value: diarioId
                                    });
                                    newRecord.setValue({
                                        fieldId: "custrecord_imr_pa_aplicado",
                                        value: true
                                    });
                                    newRecord.save({
                                        ignoreMandatoryFields: true
                                    });
                                } else {
                                    let idDiario = crearDiarioIndetificado(preferences, montosReparto, diarioNoIden, recerencia, date, importe, formaPago, folioText, folioId, grupoId, cliente, recerenciaCompleta, newRecord);
                                    newRecord.setValue({
                                        fieldId: "custrecord_imr_pa_aplicado",
                                        value: true
                                    });
                                    newRecord.setValue({
                                        fieldId: "custrecord_imr_pa_fecha_aplicacion",
                                        value: new Date()
                                    });
                                    newRecord.setValue({
                                        fieldId: "custrecord_imr_pa_diario",
                                        value: idDiario
                                    });
                                    newRecord.save({
                                        ignoreMandatoryFields: true
                                    });
                                }
                            }
                        } else if (!diarioNoIden && !diarioIden) {
                            crearDiarioNoIden(newRecord)
                        }
                        if (esCancelado) {
                            crearDiarioCancelacionPago(context.newRecord.id);
                        }
                    }
                    let countLinePre = newRecord.getLineCount({
                        sublistId: "recmachcustrecord_imr_pre_pago"
                    });
                    if (esCancelado) {
                        newRecord = record.load({
                            type: context.newRecord.type,
                            id: context.newRecord.id,
                            isDynamic: true
                        });
                        let folio = newRecord.getValue({
                            fieldId: "custrecord_imr_pa_folio"
                        });
                        let estadoFolioCancelacion = newRecord.getValue({
                            fieldId: "custrecord_imr_estado_folio_cancelar",
                        }) || '';
                        if (!estadoFolioCancelacion) {
                            if (folio) {
                                estadoFolioCancelacion = search.lookupFieldsIMR({
                                    id: folio,
                                    type: "customrecord_cseg_folio_conauto",
                                    columns: ["custrecord_folio_estado"]
                                }).custrecord_folio_estado.value;
                            }
                            newRecord.setValue({
                                fieldId: "custrecord_imr_estado_folio_cancelar",
                                value: estadoFolioCancelacion
                            })
                        }
                        // for (let i = countLinePre - 1; i >= 0; i--) {
                        //     let tipoPrelacion = newRecord.getSublistValue({
                        //         sublistId: "recmachcustrecord_imr_pre_pago",
                        //         fieldId: "custrecord_imr_pre_tipo_prelacion",
                        //         line: i
                        //     });
                        //     if (tipoPrelacion == '1') {
                        //         newRecord.removeLine({
                        //             sublistId: "recmachcustrecord_imr_pre_pago",
                        //             line: i
                        //         })
                        //     }
                        // }

                        for (let i = 0; i < countLinePre; i++) {
                            let tipoPrelacion = newRecord.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: "custrecord_imr_pre_tipo_prelacion",
                                line: i
                            });
                            let lineAmortizacion = newRecord.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: "custrecord__imr_pre_line_amortizacion",
                                line: i
                            });
                            if (!tipoPrelacion) {
                                let gastos = parseFloat(newRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_gastos",
                                    line: i
                                })) * -1;
                                let iva = parseFloat(newRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_iva",
                                    line: i
                                })) * -1;
                                let seguroVida = parseFloat(newRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_seguro_vida",
                                    line: i
                                })) * -1;
                                let seguroAuto = parseFloat(newRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_seguro_auto",
                                    line: i
                                })) * -1;
                                let aportacion = parseFloat(newRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_aportacion",
                                    line: i
                                })) * -1;
                                let saldoFavor = parseFloat(newRecord.getSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_saldo_favor",
                                    line: i
                                })) * -1;
                                newRecord.selectNewLine({
                                    sublistId: "recmachcustrecord_imr_pre_pago"
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_gastos",
                                    value: gastos
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_iva",
                                    value: iva
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_seguro_vida",
                                    value: seguroVida
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_seguro_auto",
                                    value: seguroAuto
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_aportacion",
                                    value: aportacion
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_saldo_favor",
                                    value: saldoFavor
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord__imr_pre_line_amortizacion",
                                    value: lineAmortizacion
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_tipo_prelacion",
                                    value: "1"
                                });
                                newRecord.commitLine({
                                    sublistId: "recmachcustrecord_imr_pre_pago"
                                })
                            }
                        }
                        newRecord.save({
                            ignoreMandatoryFields: true,
                        });
                        newRecord = record.load({
                            type: context.newRecord.type,
                            id: context.newRecord.id
                        });
                    }
                    if (reinstalacion && !diarioReinstalacion) {
                        let preferences = conautoPreferences.get();
                        let idDiario = crearDiarioIndetificadoReinstalacion(preferences, montosReparto, diarioNoIden, recerencia, date, importe, formaPago, folioText, folioId, grupoId, cliente, recerenciaCompleta, newRecord);
                        newRecord.setValue({
                            fieldId: "custrecord_imr_pa_diario_reinstalacion",
                            value: idDiario
                        });
                        newRecord.save({
                            ignoreMandatoryFields: true
                        });
                    }
                    if (reinstalacion) {
                        newRecord = record.load({
                            type: context.newRecord.type,
                            id: context.newRecord.id,
                            isDynamic: true
                        });

                        for (let i = countLinePre - 1; i >= 0; i--) {
                            let tipoPrelacion = newRecord.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: "custrecord_imr_pre_tipo_prelacion",
                                line: i
                            });
                            if (tipoPrelacion == '2') {
                                newRecord.removeLine({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    line: i
                                })
                            }
                        }

                        for (let i = 0; i < countLinePre; i++) {
                            let tipoPrelacion = newRecord.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: "custrecord_imr_pre_tipo_prelacion",
                                line: i
                            });
                            let lineAmortizacion = newRecord.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: "custrecord__imr_pre_line_amortizacion",
                                line: i
                            });
                            let saldoFavor = parseFloat(newRecord.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: "custrecord_imr_pre_saldo_favor",
                                line: i
                            })) * -1;
                            if (!tipoPrelacion && saldoFavor != 0) {
                                newRecord.selectNewLine({
                                    sublistId: "recmachcustrecord_imr_pre_pago"
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_saldo_favor",
                                    value: saldoFavor
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord__imr_pre_line_amortizacion",
                                    value: lineAmortizacion
                                });
                                newRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_imr_pre_pago",
                                    fieldId: "custrecord_imr_pre_tipo_prelacion",
                                    value: "2"
                                });
                                newRecord.commitLine({
                                    sublistId: "recmachcustrecord_imr_pre_pago"
                                })
                            }
                        }
                        newRecord.save({
                            ignoreMandatoryFields: true,
                        });
                        newRecord = record.load({
                            type: context.newRecord.type,
                            id: context.newRecord.id
                        });
                    }
                    if (amortizacionId) {
                        let preferences = conautoPreferences.get();
                        // updatePrelacion(context.newRecord.id, amortizacionId);
                        createInvoice(context.newRecord.id, preferences);
                        createJournalSeguroAuto(context.newRecord.id, preferences);
                        createJournalCXP(context.newRecord.id, preferences);
                        createJournalcancelacionDevolucionCartera(context.newRecord.id, preferences);
                        createJournalCancelacionCXP(context.newRecord.id, preferences);
                        createJournalCancelacionSeguroAuto(context.newRecord.id, preferences);
                        createCreditMemo(context.newRecord.id, preferences);
                        createJournalCartera(context.newRecord.id, preferences, montosReparto);
                    }
                }
            }
        }


        function createJournalCartera(idPago, preferences, montosReparto) {
            try {
                log.error("createJournalCartera")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let reference = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                }) || '';
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let journalCartera = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_cartera"
                });
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha"
                });
                let total = 0;
                let countLine = pagoObj.getLineCount({
                    sublistId: "recmachcustrecord_imr_pre_pago"
                });
                let estadoFolio = pagoObj.getValue("custrecord_imr_pa_estado_folio");
                let integrante = pagoObj.getValue("custrecord_imr_pa_integrante");
                let reinstalacion = pagoObj.getValue("custrecord_imr_pa_reinstalacion");
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let grupoText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_grupo"
                });

                for (let concepto in montosReparto) {
                    total += montosReparto[concepto];
                }

                let mapClass = {
                    "gastos": "1",
                    "seguroVida": "2",
                    "seguroAuto": "3",
                    "aportacion": "4",
                    "saldoFavor": "5",
                }
                log.audit({
                    title: "Datos antes de entrar",
                    details: `journalCartera: ${journalCartera}    total: ${total}    estadoFolio: ${estadoFolio}`
                })
                if (!journalCartera && total != 0 && estadoFolio == '4') {
                    let diarioObj = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    });
                    let memo = "Disminución de la cartera por la cobranza recibida Grupo " + grupoText + " folio " + folioText + " - Int " + integrante + " de la referencia " + referenceCompleta;
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    diarioObj.setValue({
                        fieldId: "subsidiary",
                        value: subsidiary
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_imr_tippolcon",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "trandate",
                        value: new Date()
                    });
                    diarioObj.setValue({
                        fieldId: "currency",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: 5
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_imr_ref_pago_amortizacion",
                        value: idPago
                    });
                    let cuentaDebito = preferences.getPreference({
                        key: "PCP",
                        reference: "carteraDebito"
                    });
                    let cuentaCredito = preferences.getPreference({
                        key: "PCP",
                        reference: "carteraCredito"
                    });
                    for (let concepto in montosReparto) {
                        let monto = montosReparto[concepto];
                        if (monto == 0) continue;
                        addLineJournal(diarioObj, cuentaDebito, false, monto, {
                            memo: memo,
                            custcol_referencia_conauto: referenceCompleta,
                            custcol_metodo_pago_conauto: formaPago,
                            custcol_folio_texto_conauto: folioText,
                            cseg_folio_conauto: folioId,
                            cseg_grupo_conauto: grupoId,
                            entity: cliente,
                            class: mapClass[concepto]
                        });
                        addLineJournal(diarioObj, cuentaCredito, true, monto, {
                            memo: memo,
                            custcol_referencia_conauto: referenceCompleta,
                            custcol_metodo_pago_conauto: formaPago,
                            custcol_folio_texto_conauto: folioText,
                            cseg_folio_conauto: folioId,
                            cseg_grupo_conauto: grupoId,
                            entity: cliente,
                            class: mapClass[concepto]
                        });
                    }
                    let diarioId = diarioObj.save({
                        ignoreMandatoryFields: true
                    })
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_diario_cartera",
                        value: diarioId
                    });
                    pagoObj.save({
                        ignoreMandatoryFields: true
                    })
                }
            } catch (e) {
                log.error('createJournalCartera', 'Linea 513: ' + e);
            }
        }

        function createJournalcancelacionDevolucionCartera(idPago, preferences) {
            try {
                log.error("createJournalcancelacionDevolucionCartera")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let reference = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                }) || '';
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let journalCancelacionId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_can_cartera"
                });
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha"
                });
                let total = 0;
                let countLine = pagoObj.getLineCount({
                    sublistId: "recmachcustrecord_imr_pre_pago"
                });
                let estadoDeCancelacion = pagoObj.getValue("custrecord_imr_estado_folio_cancelar");
                let integrante = pagoObj.getValue("custrecord_imr_pa_integrante");
                let reinstalacion = pagoObj.getValue("custrecord_imr_pa_reinstalacion");
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let grupoText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_grupo"
                });

                let fields = ["custrecord_imr_pre_gastos", "custrecord_imr_pre_iva", "custrecord_imr_pre_seguro_vida", "custrecord_imr_pre_seguro_auto",
                    "custrecord_imr_pre_aportacion", "custrecord_imr_pre_saldo_favor"];
                let mapClass = {
                    "custrecord_imr_pre_gastos": "1",
                    "custrecord_imr_pre_iva": "1",
                    "custrecord_imr_pre_seguro_vida": "2",
                    "custrecord_imr_pre_seguro_auto": "3",
                    "custrecord_imr_pre_aportacion": "4",
                    "custrecord_imr_pre_saldo_favor": "5",
                }
                let countLinePrelacion = pagoObj.getLineCount({
                    sublistId: "recmachcustrecord_imr_pre_pago"
                });
                let lineObj = {};
                for (let i = 0; i < countLinePrelacion; i++) {
                    let tipoPrelacion = pagoObj.getSublistValue({
                        sublistId: "recmachcustrecord_imr_pre_pago",
                        fieldId: "custrecord_imr_pre_tipo_prelacion",
                        line: i
                    });
                    if (tipoPrelacion == '1') {
                        let totalLine = 0;
                        for (let j = 0; j < fields.length; j++) {
                            let amountField = parseFloat(pagoObj.getSublistValue({
                                sublistId: "recmachcustrecord_imr_pre_pago",
                                fieldId: fields[j],
                                line: i
                            })) || 0;
                            totalLine += amountField;
                            lineObj[fields[j]] = lineObj[fields[j]] || 0;
                            lineObj[fields[j]] += amountField;
                        }
                        total += totalLine;
                    }
                }
                log.error({
                    title: "createJournalcancelacionDevolucionCartera",
                    details: JSON.stringify({
                        journalCancelacionId: journalCancelacionId,
                        total: total,
                        estadoDeCancelacion: estadoDeCancelacion
                    })
                })
                if (!journalCancelacionId && total != 0 && estadoDeCancelacion == '4') {
                    let diarioObj = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    });
                    let memo = "Reversión cobro cartera por cheque devuelto del gto " + grupoText + " int " + integrante + " referencia " + referenceCompleta;
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    diarioObj.setValue({
                        fieldId: "subsidiary",
                        value: subsidiary
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_imr_tippolcon",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "trandate",
                        value: new Date()
                    });
                    diarioObj.setValue({
                        fieldId: "currency",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: 5
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_imr_ref_pago_amortizacion",
                        value: idPago
                    });
                    let cuentaDebito = preferences.getPreference({
                        key: "PCP",
                        reference: "carteraDebito"
                    });
                    let cuentaCredito = preferences.getPreference({
                        key: "PCP",
                        reference: "carteraCredito"
                    });
                    for (let i = 0; i < fields.length; i++) {
                        let field = fields[i];
                        let value = Math.abs(lineObj[field] || 0);
                        if (value && (field != 'Saldo a Favor' || field != 'SALDO A FAVOR')) {
                            addLineJournal(diarioObj, cuentaDebito, true, value.toFixed(2), {
                                memo: memo,
                                custcol_referencia_conauto: referenceCompleta,
                                custcol_metodo_pago_conauto: formaPago,
                                custcol_folio_texto_conauto: folioText,
                                cseg_folio_conauto: folioId,
                                cseg_grupo_conauto: grupoId,
                                entity: cliente,
                                class: mapClass[field]
                            });
                            addLineJournal(diarioObj, cuentaCredito, false, value.toFixed(2), {
                                memo: memo,
                                custcol_referencia_conauto: referenceCompleta,
                                custcol_metodo_pago_conauto: formaPago,
                                custcol_folio_texto_conauto: folioText,
                                cseg_folio_conauto: folioId,
                                cseg_grupo_conauto: grupoId,
                                entity: cliente,
                                class: mapClass[field]
                            });
                        }
                    }
                    let diarioId = diarioObj.save({
                        ignoreMandatoryFields: true
                    })
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_diario_can_cartera",
                        value: diarioId
                    });
                    pagoObj.save({
                        ignoreMandatoryFields: true
                    })
                }
            } catch (e) {
                log.error('createJournalcancelacionDevolucionCartera', 'Linea 700' + e);
            }
        }

        function createCreditMemo(idPago, preferences) {
            try {
                log.error("createCreditMemo")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let recerenciaCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let creditMemoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_nota_credito"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let grupoText = pagoObj.getText({ fieldId: "custrecord_imr_pa_grupo" });
                let integranteText = pagoObj.getValue({ fieldId: "custrecord_imr_pa_integrante" });

                let importe = 0;
                let iva = 0;
                let countLine = pagoObj.getLineCount({
                    sublistId: "recmachcustrecord_imr_pre_pago"
                });
                for (let i = 0; i < countLine; i++) {
                    let lineAmount = parseFloat(pagoObj.getSublistValue({
                        sublistId: "recmachcustrecord_imr_pre_pago",
                        fieldId: "custrecord_imr_pre_gastos",
                        line: i
                    })) || 0;
                    let lineTaxAmount = parseFloat(pagoObj.getSublistValue({
                        sublistId: "recmachcustrecord_imr_pre_pago",
                        fieldId: "custrecord_imr_pre_iva",
                        line: i
                    })) || 0;
                    if (lineAmount < 0) {
                        importe += lineAmount;
                    }
                    if (lineTaxAmount < 0) {
                        iva += lineTaxAmount;
                    }
                }
                if (!creditMemoId && (importe + iva) < 0) {
                    let typeTransaccion = typesTransaccion[tipoBoleta] || '';
                    let creditMemoObj = record.create({
                        type: record.Type.CREDIT_MEMO,
                        isDynamic: true
                    });
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let item = preferences.getPreference({
                        key: "ARTINADM"
                    });
                    let memo = "Cargo al proveedor por traslado del grupo xxxx integrante xxxx al grupo xxxx integrante xxxx de la referencia  " + recerenciaCompleta;
                    creditMemoObj.setValue({
                        fieldId: "entity",
                        value: cliente
                    });
                    creditMemoObj.setValue({
                        fieldId: "custbody_imr_tippolcon",
                        value: 5
                    });
                    creditMemoObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    creditMemoObj.setValue({
                        fieldId: "department",
                        value: 34
                    });
                    creditMemoObj.setValue({
                        fieldId: "class",
                        value: 6
                    });
                    creditMemoObj.setValue({
                        fieldId: "department",
                        value: 34
                    });
                    creditMemoObj.setValue({
                        fieldId: "cseg_folio_conauto",
                        value: folioId
                    });
                    creditMemoObj.setValue({
                        fieldId: "cseg_grupo_conauto",
                        value: grupoId
                    });
                    creditMemoObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: typeTransaccion
                    });
                    creditMemoObj.selectNewLine({
                        sublistId: "item"
                    })
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: item
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "description",
                        value: memo
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "cseg_grupo_conauto",
                        value: grupoId
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "cseg_folio_conauto",
                        value: folioId
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "price",
                        value: -1
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: 1
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        value: Math.abs(importe)
                    });
                    creditMemoObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "tax1amt",
                        value: Math.abs(iva)
                    });
                    creditMemoObj.commitLine({
                        sublistId: "item",
                    })
                    creditMemoId = creditMemoObj.save({
                        ignoreMandatoryFields: true
                    });
                    conautoPreferences.setFolioConauto(creditMemoId);
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_nota_credito",
                        value: creditMemoId
                    })
                    pagoObj.save({
                        ignoreMandatoryFields: true
                    })
                }
            } catch (e) {
                log.error('createCreditMemo', 'Linea 885: ' + e);
            }
        }

        function createJournalCancelacionSeguroAuto(idPago, preferences) {
            try {
                log.error("createJournalCancelacionSeguroAuto")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let reference = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                }) || '';
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let journalId = pagoObj.getValue({
                    fieldId: "custrecord__imr_pa_diario_seg_auto"
                });
                let journalCancelacionId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_can_segauto"
                });
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha"
                });
                let seguro = 0;
                let countLine = pagoObj.getLineCount({
                    sublistId: "recmachcustrecord_imr_pre_pago"
                });
                let reinstalacion = pagoObj.getValue("custrecord_imr_pa_reinstalacion");
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let grupoText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let integrante = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_integrante"
                });
                for (let i = 0; i < countLine; i++) {
                    let amountLine = pagoObj.getSublistValue({
                        sublistId: "recmachcustrecord_imr_pre_pago",
                        fieldId: "custrecord_imr_pre_seguro_auto",
                        line: i
                    });
                    if (amountLine < 0) {
                        seguro += amountLine;
                    }
                }
                if (!journalCancelacionId && journalId && seguro < 0) {
                    let typeTransaccion = typesTransaccion[tipoBoleta] || '';
                    let facturaObj = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    });
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let memo = "Reversion cobro cartera por cheque devuelto del Grupo " + grupoText + " - Int " + integrante + "  referencia " + referenceCompleta;
                    let diarioObj = record.create({
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
                    diarioObj.setValue({
                        fieldId: "trandate",
                        value: date
                    });
                    diarioObj.setValue({
                        fieldId: "currency",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: 5
                    });
                    let cuentaDebito = preferences.getPreference({
                        key: "CCP",
                        reference: 'seguroAutoAumento'
                    });
                    let accountCredit = preferences.getPreference({
                        key: "CCP",
                        reference: 'seguroAutoDisminucion'
                    });
                    addLineJournal(diarioObj, cuentaDebito, true, seguro.toFixed(2), {
                        memo: memo,
                        custcol_referencia_conauto: referenceCompleta,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    addLineJournal(diarioObj, accountCredit, false, seguro.toFixed(2), {
                        memo: memo,
                        custcol_referencia_conauto: referenceCompleta,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    journalId = diarioObj.save({
                        ignoreMandatoryFields: true,
                    });
                    conautoPreferences.setFolioConauto(journalId);
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_diario_can_segauto",
                        value: journalId
                    })
                    pagoObj.save({
                        ignoreMandatoryFields: true,
                    });
                }
            } catch (e) {
                log.error('createJournalCancelacionSeguroAuto', 'Linea 1053: ' + e);
            }
        }

        function createJournalCancelacionCXP(idPago, preferences) {
            try {
                log.error("createJournalCancelacionCXP")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let reference = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                }) || '';
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let journalCancelacionId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_can_cxp"
                });
                let journalId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_cxp"
                });
                let reinstalacion = pagoObj.getValue("custrecord_imr_pa_reinstalacion");
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha"
                });
                let seguro = 0;
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let grupoTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let integranteTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_integrante"
                });
                let gastosSinIVa = pagoObj.getValue({
                    fieldId: "custrecord_conauto_gastos"
                });
                let ivaGasto = pagoObj.getValue({
                    fieldId: "custrecord_conauto_iva"
                });
                let gastos = parseFloat((ivaGasto + gastosSinIVa).toFixed(2));
                let countLine = pagoObj.getLineCount({
                    sublistId: "recmachcustrecord_imr_pre_pago"
                });
                let trasladoContrato = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_taslado_contrato"
                });
                let memoTrasladoContrato = "";
                if (trasladoContrato) {
                    let dataTrasladoContato = search.lookupFieldsIMR({
                        type: "customrecord_imr_traspaso_contratos",
                        id: trasladoContrato,
                        columns: ["custrecord_imr_trascon_integrante", "custrecord_imr_trascon_grupo", "custrecord_imr_trascon_grupo_cancelacion", "custrecord_imr_trascon_integrante_cance"]
                    });
                    memoTrasladoContrato = " Traspaso del grupo " + dataTrasladoContato.custrecord_imr_trascon_grupo_cancelacion.text + " integrante " + dataTrasladoContato.custrecord_imr_trascon_integrante_cance.value + " al grupo " + dataTrasladoContato.custrecord_imr_trascon_grupo.text + "integrante " + dataTrasladoContato.custrecord_imr_trascon_integrante.value + "  de la regerencia " + referenceCompleta;
                } else {
                    memoTrasladoContrato = " grupo " + grupoTexto + " integrante " + integranteTexto + " de la regerencia " + referenceCompleta;
                }

                if (!journalCancelacionId && journalId && gastos < 0) {
                    let typeTransaccion = typesTransaccion[tipoBoleta] || '';
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let memo = "Cargo al proveedor por " + memoTrasladoContrato;

                    let diarioObj = record.create({
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
                    diarioObj.setValue({
                        fieldId: "trandate",
                        value: date
                    });
                    diarioObj.setValue({
                        fieldId: "currency",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: typeTransaccion
                    });
                    let cuentaDebito = preferences.getPreference({
                        key: "CCP",
                        reference: 'gastosPorPagar'
                    });
                    let accountCredit = preferences.getPreference({
                        key: "CCP",
                        reference: 'gastos'
                    });
                    addLineJournal(diarioObj, cuentaDebito, true, Math.abs(gastos).toFixed(2), {
                        memo: memo,
                        custcol_referencia_conauto: reference,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    addLineJournal(diarioObj, accountCredit, false, Math.abs(gastos).toFixed(2), {
                        memo: memo,
                        custcol_referencia_conauto: reference,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    journalId = diarioObj.save({
                        ignoreMandatoryFields: true,
                    });
                    conautoPreferences.setFolioConauto(journalId);
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_diario_can_cxp",
                        value: journalId
                    })
                    pagoObj.save({
                        ignoreMandatoryFields: true,
                    });
                }
            } catch (e) {
                log.error('createJournalCancelacionCXP', 'Linea 1203: ' + e);
            }
        }

        function crearDiarioIndetificadoReinstalacion(preferences, montosReparto, diarioNoIden, recerencia, date, importe, formaPago, folioText, folioId, grupoId, cliente, recerenciaCompleta, pagoObj) {
            try {
                log.error("crearDiarioIndetificadoReinstalacion")
                let cuentaCobranza = null;
                let folioObj = record.load({
                    type: "customrecord_cseg_folio_conauto",
                    id: folioId
                });
                let estado = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_estado_folio"
                });
                let subEstado = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_subestado_folio"
                });
                let integranteText = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_integrante"
                });
                let grupoText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                if (estado == '4') {
                    cuentaCobranza = preferences.getPreference({
                        key: "CCP",
                        reference: 'saldoFavorAP'
                    });
                } else if (subEstado == '3') {
                    cuentaCobranza = preferences.getPreference({
                        key: "CCP",
                        reference: 'saldoFavorLiq'
                    });
                } else {
                    cuentaCobranza = preferences.getPreference({
                        key: "CCP",
                        reference: 'saldoFavor'
                    });
                }
                let subsidiary = preferences.getPreference({
                    key: "SUBCONAUTO"
                });
                let memoJournal = "Reclasificación del registro de la cobranza por Reinstalacion de la referencia " + recerenciaCompleta + " " + grupoText + "-" + integranteText;
                let diarioObj = record.create({
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
                diarioObj.setValue({
                    fieldId: "trandate",
                    value: date
                });
                diarioObj.setValue({
                    fieldId: "currency",
                    value: 1
                });
                diarioObj.setValue({
                    fieldId: "memo",
                    value: memoJournal
                });
                diarioObj.setValue({
                    fieldId: "custbody_tipo_transaccion_conauto",
                    value: 5
                });
                addLineJournal(diarioObj, cuentaCobranza, true, importe.toFixed(2), {
                    memo: memoJournal,
                    custcol_referencia_conauto: recerenciaCompleta,
                    custcol_metodo_pago_conauto: formaPago,
                    custcol_folio_texto_conauto: folioText,
                    cseg_folio_conauto: folioId,
                    cseg_grupo_conauto: grupoId,
                    entity: cliente
                });

                for (let concepto in montosReparto) {
                    let importeConcepto = montosReparto[concepto] || 0;
                    if (importeConcepto == 0) {
                        continue;
                    }
                    let CuentaConcepto = preferences.getPreference({
                        key: "CCP",
                        reference: concepto
                    });
                    let classId = preferences.getPreference({
                        key: "CLSP",
                        reference: concepto
                    });
                    if (concepto == 'gastos') {
                        let cuentaIVA = preferences.getPreference({
                            key: "CCP",
                            reference: 'iva'
                        });
                        let importeGastoConIVA = montosReparto["gastos"];
                        addLineJournal(diarioObj, CuentaConcepto, false, (importeGastoConIVA).toFixed(2), {
                            memo: memoJournal,
                            custcol_referencia_conauto: recerenciaCompleta,
                            custcol_metodo_pago_conauto: formaPago,
                            custcol_folio_texto_conauto: folioText,
                            cseg_folio_conauto: folioId,
                            cseg_grupo_conauto: grupoId,
                            class: classId,
                            entity: cliente
                        });
                    } else {
                        addLineJournal(diarioObj, CuentaConcepto, false, importeConcepto.toFixed(2), {
                            memo: memoJournal,
                            custcol_referencia_conauto: recerenciaCompleta,
                            custcol_metodo_pago_conauto: formaPago,
                            custcol_folio_texto_conauto: folioText,
                            cseg_folio_conauto: folioId,
                            cseg_grupo_conauto: grupoId,
                            class: classId,
                            entity: cliente
                        });
                    }
                }
                let idDiario = diarioObj.save({
                    ignoreMandatoryFields: true
                });
                conautoPreferences.setFolioConauto(idDiario);
                return idDiario;
            } catch (e) {
                log.error('crearDiarioIndetificadoReinstalacion', 'Linea 1376: ' + e);
            }
        }

        function createJournalCXP(idPago, preferences) {
            try {
                log.error("createJournalCXP")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let reference = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                }) || '';
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let journalId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_cxp"
                });
                let gastosSinIVa = pagoObj.getValue({
                    fieldId: "custrecord_conauto_gastos"
                });
                let ivaGasto = pagoObj.getValue({
                    fieldId: "custrecord_conauto_iva"
                });
                let reinstalacion = pagoObj.getValue("custrecord_imr_pa_reinstalacion");
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha"
                });
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let gastos = parseFloat((ivaGasto + gastosSinIVa).toFixed(2));

                if ((["1", "2", "3", "4"].indexOf(tipoBoleta) != -1 || esPrimerPago || true) && !journalId && gastos > 0) {
                    let typeTransaccion = typesTransaccion[tipoBoleta] || '';
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let memo = "Cuenta por pagar a proveedores por cobranza recibida " + (tipoBoletaTexto ? ('por ' + tipoBoletaTexto) : '') + "" + (reinstalacion ? ' Reinstalación' : '') + " referencia " + referenceCompleta;

                    let diarioObj = record.create({
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
                    diarioObj.setValue({
                        fieldId: "trandate",
                        value: date
                    });
                    diarioObj.setValue({
                        fieldId: "currency",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: typeTransaccion
                    });
                    let cuentaDebito = preferences.getPreference({
                        key: "CCP",
                        reference: 'gastos'
                    });
                    let accountCredit = preferences.getPreference({
                        key: "CCP",
                        reference: 'gastosPorPagar'
                    });

                    addLineJournal(diarioObj, cuentaDebito, true, gastos, {
                        memo: memo,
                        custcol_referencia_conauto: reference,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    addLineJournal(diarioObj, accountCredit, false, gastos, {
                        memo: memo,
                        custcol_referencia_conauto: reference,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    journalId = diarioObj.save({
                        ignoreMandatoryFields: true,
                    });
                    conautoPreferences.setFolioConauto(journalId);
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_diario_cxp",
                        value: journalId
                    })
                    pagoObj.save({
                        ignoreMandatoryFields: true,
                    });
                }
            } catch (e) {
                log.error('createJournalCXP', 'Linea 1516: ' + e);
            }
        }

        function createJournalSeguroAuto(idPago, preferences) {
            try {
                log.error("createJournalSeguroAuto")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let reference = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                }) || '';
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let journalId = pagoObj.getValue({
                    fieldId: "custrecord__imr_pa_diario_seg_auto"
                });
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha"
                });
                let seguro = pagoObj.getValue({
                    fieldId: "custrecord_conauto_seguro_auto"
                });

                let reinstalacion = pagoObj.getValue("custrecord_imr_pa_reinstalacion");
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });

                if ((["1", "2", "4"].indexOf(tipoBoleta) != -1 || esPrimerPago || true) && !journalId && seguro > 0) {
                    let typeTransaccion = typesTransaccion[tipoBoleta] || '';
                    let facturaObj = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    });
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let memo = "DISMINUCION DE SEGURO AUTO POR APLICACIÓN DE LA COBRANZA DE LA REFERENCIA " + referenceCompleta + (reinstalacion ? ' POR REINSTALACIóN' : '')//+getReferenciaMemo(pagoObj);
                    let diarioObj = record.create({
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
                    diarioObj.setValue({
                        fieldId: "trandate",
                        value: date
                    });
                    diarioObj.setValue({
                        fieldId: "currency",
                        value: 1
                    });
                    diarioObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    diarioObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: 5
                    });
                    let cuentaDebito = preferences.getPreference({
                        key: "CCP",
                        reference: 'seguroAutoAumento'
                    });
                    let accountCredit = preferences.getPreference({
                        key: "CCP",
                        reference: 'seguroAutoDisminucion'
                    });

                    addLineJournal(diarioObj, cuentaDebito, true, seguro.toFixed(2), {
                        memo: memo,
                        custcol_referencia_conauto: referenceCompleta,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    addLineJournal(diarioObj, accountCredit, false, seguro.toFixed(2), {
                        memo: memo,
                        custcol_referencia_conauto: referenceCompleta,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente
                    });
                    journalId = diarioObj.save({
                        ignoreMandatoryFields: true,
                    });
                    conautoPreferences.setFolioConauto(journalId);
                    pagoObj.setValue({
                        fieldId: "custrecord__imr_pa_diario_seg_auto",
                        value: journalId
                    })
                    pagoObj.save({
                        ignoreMandatoryFields: true,
                    });
                }
            } catch (e) {
                log.error('createJournalSeguroAuto', 'Linea 1660: ' + e);
            }
        }

        function createInvoice(idPago, preferences) {
            try {
                log.error("createInvoice")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let esPrimerPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_rec_primer_pago"
                });
                let tipoBoleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let tipoBoletaTexto = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_tipo_boleta_interna"
                });
                let recerenciaCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante"
                });
                let folioText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio"
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let grupoText = pagoObj.getText({
                    fieldId: "custrecord_imr_pa_grupo"
                });
                let facturaId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_factura"
                });
                let formaPagoFe = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago"
                });
                let gastosSinIVa = pagoObj.getValue({
                    fieldId: "custrecord_conauto_gastos"
                });
                let ivaGasto = pagoObj.getValue({
                    fieldId: "custrecord_conauto_iva"
                });
                let formaPagoFetxt = "";
                if (formaPagoFe) {
                    formaPagoFetxt = search.lookupFieldsIMR({
                        type: "customrecord_fe_metodos_pago",
                        id: formaPagoFe,
                        columns: ["name"]
                    }).name.value
                }

                if (/*(["1","2","3","4"].indexOf(tipoBoleta)!=-1 || esPrimerPago ) &&*/ !facturaId && gastosSinIVa > 0) {
                    let typeTransaccion = typesTransaccion[tipoBoleta] || '';
                    let facturaObj = record.create({
                        type: record.Type.CASH_SALE,
                        isDynamic: true
                    });
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let item = preferences.getPreference({
                        key: "ARTINADM"
                    });
                    let memo = "Cobranza Recibida en Sistema de Comercialización " + folioText + " - " + grupoText + " de la referencia " + recerenciaCompleta;

                    facturaObj.setValue({
                        fieldId: "entity",
                        value: cliente
                    });
                    facturaObj.setValue({
                        fieldId: "custbody_imr_tippolcon",
                        value: 5
                    });
                    facturaObj.setValue({
                        fieldId: "undepfunds",
                        value: 'F'
                    });
                    facturaObj.setValue({
                        fieldId: "account",
                        value: 2646
                    });
                    facturaObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    facturaObj.setValue({
                        fieldId: "department",
                        value: 34
                    });
                    facturaObj.setValue({
                        fieldId: "class",
                        value: 6
                    });
                    facturaObj.setValue({
                        fieldId: "cseg_folio_conauto",
                        value: folioId
                    });
                    facturaObj.setValue({
                        fieldId: "cseg_grupo_conauto",
                        value: grupoId
                    });
                    facturaObj.setValue({
                        fieldId: "custbody_tipo_transaccion_conauto",
                        value: typeTransaccion
                    });
                    facturaObj.setValue({
                        fieldId: "custbody_fe_metodo_de_pago",
                        value: formaPagoFe
                    });
                    facturaObj.setValue({
                        fieldId: "custbody_fe_metodo_de_pago_txt",
                        value: formaPagoFetxt
                    });
                    log.error('ERROR', 'Metodo de pago: ' + formaPagoFe + ', Text: ' + formaPagoFetxt);
                    facturaObj.selectNewLine({
                        sublistId: "item"
                    })
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: item
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "description",
                        value: memo
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "price",
                        value: -1
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: 1
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        value: gastosSinIVa
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "tax1amt",
                        value: ivaGasto
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "cseg_folio_conauto",
                        value: folioId
                    });
                    facturaObj.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "cseg_grupo_conauto",
                        value: grupoId
                    });
                    facturaObj.commitLine({
                        sublistId: "item",
                    })
                    facturaId = facturaObj.save({
                        ignoreMandatoryFields: true
                    });
                    log.error('ERROR', 'facturaId: ' + facturaId);
                    conautoPreferences.setFolioConauto(facturaId);
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_factura",
                        value: facturaId
                    })
                    pagoObj.save({
                        ignoreMandatoryFields: true
                    })
                }
            } catch (e) {
                log.error('createInvoice', 'Linea 1798: ' + e);
            }
        }

        function crearDiarioCancelacionPago(idPago) {
            try {
                log.error("crearDiarioCancelacionPago")
                let pagoObj = record.load({
                    id: idPago,
                    type: "customrecord_imr_pagos_amortizacion"
                });
                let preferences = conautoPreferences.get();
                let referenceCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let diarioNoIden = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario_no_iden"
                });
                let trasladoContrato = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_taslado_contrato"
                });
                let dateRefund = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha_dev"
                }) || new Date();
                let diarioIden = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_diario"
                });
                let idDiarioRevesa = diarioIden ? diarioIden : diarioNoIden;
                if (idDiarioRevesa) {
                    let diarioObj = record.load({
                        type: record.Type.JOURNAL_ENTRY,
                        id: idDiarioRevesa
                    })
                    let diarioRevesaObj = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    });
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let grupoText = pagoObj.getText({
                        fieldId: "custrecord_imr_pa_grupo"
                    });
                    let integranteText = pagoObj.getValue({
                        fieldId: "custrecord_imr_pa_integrante"
                    });
                    let memo = "Diario de cancelación de pago grp " + grupoText + " int " + integranteText + " de la referencia " + referenceCompleta;
                    let accountTrasladoContrato = preferences.getPreference({
                        key: "TEC"
                    });
                    diarioRevesaObj.setValue({
                        fieldId: "subsidiary",
                        value: subsidiary
                    });
                    diarioRevesaObj.setValue({
                        fieldId: "trandate",
                        value: dateRefund
                    });
                    diarioRevesaObj.setValue({
                        fieldId: "memo",
                        value: memo
                    });
                    let countLine = diarioObj.getLineCount({
                        sublistId: "line"
                    });
                    for (let i = 0; i < countLine; i++) {
                        let account = diarioObj.getSublistValue({
                            sublistId: "line",
                            fieldId: "account",
                            line: i
                        });
                        let debit = parseFloat(diarioObj.getSublistValue({
                            sublistId: "line",
                            fieldId: "debit",
                            line: i
                        })) || 0;
                        let credit = parseFloat(diarioObj.getSublistValue({
                            sublistId: "line",
                            fieldId: "credit",
                            line: i
                        })) || 0;
                        let classId = diarioObj.getSublistValue({
                            sublistId: "line",
                            fieldId: "class",
                            line: i
                        });
                        let importe = credit - debit;
                        if (importe < 0 && trasladoContrato) {
                            account = accountTrasladoContrato;
                        }
                        addLineJournal(diarioRevesaObj, account, importe > 0, Math.abs(importe).toFixed(2), {
                            memo: memo,
                            custcol_referencia_conauto: diarioObj.getSublistValue({
                                sublistId: "line",
                                fieldId: "custcol_referencia_conauto",
                                line: i
                            }),
                            custcol_metodo_pago_conauto: diarioObj.getSublistValue({
                                sublistId: "line",
                                fieldId: "custcol_metodo_pago_conauto",
                                line: i
                            }),
                            custcol_folio_texto_conauto: diarioObj.getSublistValue({
                                sublistId: "line",
                                fieldId: "custcol_folio_texto_conauto",
                                line: i
                            }),
                            cseg_folio_conauto: diarioObj.getSublistValue({
                                sublistId: "line",
                                fieldId: "cseg_folio_conauto",
                                line: i
                            }),
                            cseg_grupo_conauto: diarioObj.getSublistValue({
                                sublistId: "line",
                                fieldId: "cseg_grupo_conauto",
                                line: i
                            }),
                            entity: diarioObj.getSublistValue({
                                sublistId: "line",
                                fieldId: "entity",
                                line: i
                            }),
                            class: classId
                        });
                    }
                    let idDiario = diarioRevesaObj.save({
                        ignoreMandatoryFields: true
                    });
                    pagoObj.setValue({
                        fieldId: "custrecord_imr_pa_diario_cancelacion",
                        value: idDiario
                    });
                    pagoObj.save({
                        ignoreMandatoryFields: true
                    });
                }
            } catch (e) {
                log.error('crearDiarioCancelacionPago', 'Linea 2026: ' + e);
            }
        }

        function crearDiarioIndetificado(preferences, montosReparto, diarioNoIden, recerencia, date, importe, formaPago, folioText, folioId, grupoId, cliente, recerenciaCompleta, newRecord) {
            try {
                let cuentaCobranza = null;
                if (diarioNoIden) {
                    cuentaCobranza = preferences.getPreference({
                        key: "CCNI"
                    });
                } else {
                    cuentaCobranza = preferences.getPreference({
                        key: "CB1P",
                        reference: recerencia
                    });
                }
                let folioObj = record.load({
                    type: "customrecord_cseg_folio_conauto",
                    id: folioId
                });
                let estado = folioObj.getValue({
                    fieldId: "custrecord_folio_estado"
                });
                let subEstado = folioObj.getValue({
                    fieldId: "custrecord_folio_subestatus"
                });
                let subsidiary = preferences.getPreference({
                    key: "SUBCONAUTO"
                });
                let diarioObj = record.create({
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
                diarioObj.setValue({
                    fieldId: "trandate",
                    value: date
                });
                diarioObj.setValue({
                    fieldId: "currency",
                    value: 1
                });
                diarioObj.setValue({
                    fieldId: "memo",
                    value: "identificacion de la cobranza Recibida de la referencia  " + recerenciaCompleta
                });
                diarioObj.setValue({
                    fieldId: "custbody_tipo_transaccion_conauto",
                    value: 5
                });
                diarioObj.setValue({ fieldId: "custbody_imr_ref_pagoamortizaciones", value: newRecord.id });
                log.error({
                    title: "importe",
                    details: importe
                })
                addLineJournal(diarioObj, cuentaCobranza, true, importe.toFixed(2), {
                    memo: "identificacion de la cobranza Recibida de la referencia  " + recerenciaCompleta,
                    custcol_referencia_conauto: recerenciaCompleta,
                    custcol_metodo_pago_conauto: formaPago,
                    custcol_folio_texto_conauto: folioText,
                    cseg_folio_conauto: folioId,
                    cseg_grupo_conauto: grupoId,
                    entity: cliente,
                    location: 6
                });
                for (let concepto in montosReparto) {
                    let importeConcepto = montosReparto[concepto] || 0;
                    if (importeConcepto == 0) {
                        log.audit("Entreees")
                        continue;
                    }
                    let CuentaConcepto = preferences.getPreference({
                        key: "CCP",
                        reference: concepto
                    });
                    if (concepto == 'saldoFavor') {
                        if (estado == '4') {
                            CuentaConcepto = preferences.getPreference({
                                key: "CCP",
                                reference: 'saldoFavorAP'
                            });
                        } else if (subEstado == '3') {
                            CuentaConcepto = preferences.getPreference({
                                key: "CCP",
                                reference: 'saldoFavorLiq'
                            });
                        }
                    }
                    let classId = preferences.getPreference({
                        key: "CLSP",
                        reference: concepto
                    });
                    if (concepto == 'gastos') {
                        let cuentaIVA = preferences.getPreference({
                            key: "CCP",
                            reference: 'iva'
                        });
                        ;
                        let importeGastoConIVA = montosReparto["gastos"];
                        addLineJournal(diarioObj, CuentaConcepto, false, (importeGastoConIVA).toFixed(2), {
                            memo: "identificacion de la cobranza Recibida de la referencia  " + recerenciaCompleta,
                            custcol_referencia_conauto: recerenciaCompleta,
                            custcol_metodo_pago_conauto: formaPago,
                            custcol_folio_texto_conauto: folioText,
                            cseg_folio_conauto: folioId,
                            cseg_grupo_conauto: grupoId,
                            class: classId,
                            entity: cliente,
                            location: 6
                        });
                    } else {
                        log.audit("PAGO", { "Concepto": concepto, "Monto": importeConcepto })
                        addLineJournal(diarioObj, CuentaConcepto, false, importeConcepto, {
                            memo: "identificacion de la cobranza Recibida de la referencia  " + recerenciaCompleta,
                            custcol_referencia_conauto: recerenciaCompleta,
                            custcol_metodo_pago_conauto: formaPago,
                            custcol_folio_texto_conauto: folioText,
                            cseg_folio_conauto: folioId,
                            cseg_grupo_conauto: grupoId,
                            class: classId,
                            entity: cliente,
                            location: 6
                        });
                    }
                }
                let idDiario = diarioObj.save({
                    ignoreMandatoryFields: true
                });
                conautoPreferences.setFolioConauto(idDiario);
                return idDiario;
            } catch (e) {
                log.error('crearDiarioIndetificado', 'Linea 2289: ' + e);
            }
        }

        function crearDiarioLiquidacion(preferences, diarioNoIden, recerenciaCompleta, pagoObj) {
            try {
                let cuentaCobranza = null;
                let importe = parseFloat(pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_importe",
                })) || 0;
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago",
                })
                let folioText = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio_texto",
                })
                let folioId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio",
                });
                let grupoId = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_grupo",
                })
                let cliente = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_cliente_integrante",
                })
                let cuentaLiquidar = preferences.getPreference({
                    key: "CLG"
                });
                if (diarioNoIden) {
                    cuentaCobranza = preferences.getPreference({
                        key: "CCNI"
                    });
                } else {
                    cuentaCobranza = preferences.getPreference({
                        key: "CB1P",
                        reference: recerencia
                    });
                }
                let subsidiary = preferences.getPreference({
                    key: "SUBCONAUTO"
                });
                let diarioObj = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
                diarioObj.setValue({
                    fieldId: "subsidiary",
                    value: subsidiary
                })
                diarioObj.setValue({
                    fieldId: "trandate",
                    value: pagoObj.getValue("custrecord_imr_pa_fecha")
                });
                diarioObj.setValue({
                    fieldId: "currency",
                    value: 1
                });
                diarioObj.setValue({
                    fieldId: "memo",
                    value: "Pago identificado"
                });
                diarioObj.setValue({
                    fieldId: "custbody_tipo_transaccion_conauto",
                    value: 5
                });
                addLineJournal(diarioObj, cuentaCobranza, true, importe.toFixed(2), {
                    memo: "Pago identificado de la referencia " + recerenciaCompleta,
                    custcol_referencia_conauto: recerenciaCompleta,
                    custcol_metodo_pago_conauto: formaPago,
                    custcol_folio_texto_conauto: folioText,
                    cseg_folio_conauto: folioId,
                    cseg_grupo_conauto: grupoId,
                    entity: cliente
                });
                addLineJournal(diarioObj, cuentaLiquidar, false, importe.toFixed(2), {
                    memo: "Pago identificado de la referencia " + recerenciaCompleta,
                    custcol_referencia_conauto: recerenciaCompleta,
                    custcol_metodo_pago_conauto: formaPago,
                    custcol_folio_texto_conauto: folioText,
                    cseg_folio_conauto: folioId,
                    cseg_grupo_conauto: grupoId,
                    entity: cliente
                })
                let diarioId = diarioObj.save({
                    ignoreMandatoryFields: true
                });
                return diarioId;
            } catch (e) {
                log.error('crearDiarioLiquidacion', 'Diario liquidación: linea 2441' + e);
            }
        }

        function crearDiarioNoIden(pagoObj) {
            try {
                let importe = parseFloat(pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_importe",
                })) || 0;
                let recerencia = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia",
                }) || '';
                let folioTexto = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_folio_texto",
                }) || '';
                let date = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_fecha",
                });
                let formaPago = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_forma_pago",
                });
                let recerenciaCompleta = pagoObj.getValue({
                    fieldId: "custrecord_imr_pa_referencia_completa"
                });
                let diarioObj = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
                let preferences = conautoPreferences.get();
                let subsidiary = preferences.getPreference({
                    key: "SUBCONAUTO"
                });
                diarioObj.setValue({
                    fieldId: "subsidiary",
                    value: subsidiary
                })
                diarioObj.setValue({
                    fieldId: "trandate",
                    value: date
                });
                diarioObj.setValue({
                    fieldId: "currency",
                    value: 1
                });
                diarioObj.setValue({
                    fieldId: "memo",
                    value: "Pago no identificado de la referencia " + recerenciaCompleta
                });
                diarioObj.setValue({
                    fieldId: "custbody_tipo_transaccion_conauto",
                    value: 4
                });
                let cuentaNoIden = preferences.getPreference({
                    key: "CCNI"
                });
                let cuentaCobranza = preferences.getPreference({
                    key: "CB1P",
                    reference: recerencia
                });
                addLineJournal(diarioObj, cuentaCobranza, true, importe.toFixed(2), {
                    memo: "Pago no identificado de la referencia " + recerenciaCompleta,
                    custcol_referencia_conauto: recerenciaCompleta,
                    custcol_metodo_pago_conauto: formaPago,
                    custcol_folio_texto_conauto: folioTexto
                });
                addLineJournal(diarioObj, cuentaNoIden, false, importe.toFixed(2), {
                    memo: "Pago no identificado de la referencia " + recerenciaCompleta,
                    custcol_referencia_conauto: recerenciaCompleta,
                    custcol_metodo_pago_conauto: formaPago,
                    custcol_folio_texto_conauto: folioTexto
                })
                let diarioId = diarioObj.save({
                    ignoreMandatoryFields: true
                });
                pagoObj.setValue({
                    fieldId: "custrecord_imr_pa_diario_no_iden",
                    value: diarioId
                });
                pagoObj.save({
                    ignoreMandatoryFields: true
                });
            } catch (e) {
                log.error('crearDiarioNoIden', 'Linea 2529: ' + e);
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
            for (let field in data) {
                let value = data[field];
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

        function recordFind(recordType, operator, field, value, join) {
            let id = null;
            let results = search.searchAllRecords({
                type: recordType,
                filters: [
                    search.createFilter({
                        name: field,
                        join: join || null,
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
            return id;
        }


        exports.beforeLoad = beforeLoad;
        exports.beforeSubmit = beforeSubmit;
        exports.afterSubmit = afterSubmit;
        return exports;
    });
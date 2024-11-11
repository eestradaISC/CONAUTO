/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 */
define(["N/record", "N/file", "N/runtime", "/SuiteScripts/Conauto_Preferences.js", "IMR/IMRSearch", "N/error", "/SuiteScripts/con_lib_service_netsuite.js", "N/search"],
    /**
     * @param {record} record
     * @param {runtime} runtime
     * @param {conautoPreferences} conautoPreferences
     * @param {IMRSearch} search
     * @param {error} error
     */
    (record, file, runtime, conautoPreferences, search, error, lib_conauto, search2) => {
        const LOG_SERVICE_CONAUTO = "customrecord_log_service_conauto"
        const RECORDS_PROCESSED = {
            "processed": 0
        }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            let scriptObj = runtime.getCurrentScript();
            let logId = scriptObj.getParameter({
                name: "custscript_log_service_id_mr"
            });
            var request = lib_conauto.getRequestLog(logId);
            log.audit("request", JSON.stringify(request));
            return { "values": request }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            var request = JSON.parse(mapContext.value);
            var tipooperacion = request.tipo
            var pagos = request.pagos || request.detalles;
            let scriptObj = runtime.getCurrentScript();
            let logId = scriptObj.getParameter({
                name: "custscript_log_service_id_mr"
            });

            for (let keyPago in pagos) {
                log.audit("map65", JSON.stringify({ key: keyPago, value: { tipo: tipooperacion, pagos: pagos[keyPago], logId: logId } }));
                mapContext.write({
                    key: keyPago,
                    value: {
                        logId: logId,
                        tipo: tipooperacion,
                        pagos: [pagos[keyPago]]
                    }
                });

            }
            log.audit("map", "end map");
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {I1erator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            let scriptObj = runtime.getCurrentScript();
            let logId = scriptObj.getParameter({
                name: "custscript_log_service_id_mr"
            });

            log.audit("reduce94", JSON.stringify(reduceContext));
            var key = reduceContext.key;
            var request = JSON.parse(reduceContext.values);
            request = request instanceof Array ? request[0] : request;
            log.audit("REQUEST VALID", request);
            var resultados = { transaccions: [], records: [], recordType: "" };
            try {
                var operations = {
                    'PrimerasCuotas': primerasCuotas,
                    'SolicitudPago': solicitudPago,
                    'AplicacionCobranza': aplicacionCobranza, // También esta identificación cobranza
                    'CobranzaIdentificada': cobranzaIdentificada,
                    'ProvisionCartera': provisionCartera, // CreacionCartera
                }

                log.audit("reduce138", JSON.stringify(request));
                var callback = operations[request.tipo];
                if (callback) {
                    resultados = callback(request) || [];
                    log.audit("reduce142", JSON.stringify(resultados));
                    reduceContext.write({ key: key, value: resultados });
                    RECORDS_PROCESSED.processed++;
                    log.audit({
                        title: "PROCESADOS ACTUALMENTE",
                        details: RECORDS_PROCESSED.processed
                    });
                    record.submitFields({
                        type: LOG_SERVICE_CONAUTO,
                        id: Number(logId),
                        values: {
                            custrecord_con_payments_processed: Number(RECORDS_PROCESSED.processed)
                        },
                    });

                } else {
                    throw error.create({
                        name: "NOT_SUPPORTED_OPERATION",
                        message: "No esta soportado la operación '" + request.tipo + "'"
                    });
                }

            } catch (e) {
                //createLog2(request.logId, data, e, '')
                handlerError(e);
            }
            log.audit("reduce55", "end reduce");
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            log.audit('summarize map', JSON.stringify(summaryContext.reduceSummary));
            let scriptObj = runtime.getCurrentScript();
            let logId = scriptObj.getParameter({
                name: "custscript_log_service_id_mr"
            });
            var totalRecordsUpdated = 0;
            var recordType = "";
            let resultados = {
                custrecord_log_serv_processed: true,
                custrecord_log_serv_recordtype: "",
                custrecord_log_serv_transactions: [],
                custrecord_log_serv_solpagos: [],
                custrecord_log_serv_record_ids: [],
                custrecord_log_serv_folio: []
            }
            summaryContext.output.iterator().each(function (key, value) {
                log.audit("SUMMARIZE iterator each key:" + key, JSON.stringify(value));
                value = JSON.parse(value);
                resultados.custrecord_log_serv_recordtype = value.recordType;
                resultados.custrecord_log_serv_transactions = resultados.custrecord_log_serv_transactions.concat(value.transactions);
                resultados.custrecord_log_serv_solpagos = resultados.custrecord_log_serv_solpagos.concat(value.solPagos);
                resultados.custrecord_log_serv_record_ids = resultados.custrecord_log_serv_record_ids.concat(value.records);
                resultados.custrecord_log_serv_folio = resultados.custrecord_log_serv_folio.concat(value.folios);
                //resultados.custrecord_log_serv_error = resultados.custrecord_log_serv_error.concat(value.errors);


                totalRecordsUpdated++;
                return true;
            });
            //TODO: Enviamos actualizacion
            try {
                record.submitFields({
                    type: LOG_SERVICE_CONAUTO,
                    id: logId,
                    values: resultados
                });
            } catch (e) {
                log.error('summarize', e);
                let fileObj = file.create({
                    name: 'registros' + new Date() + '.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: "ss",
                    description: 'Log ' + logId,
                    encoding: file.Encoding.UTF_8,
                    folder: 59
                });

                let fileId = fileObj.save();

                record.attach({
                    record: {
                        type: 'file',
                        id: fileId
                    },
                    to: {
                        type: "customrecord_log_conauto_request",
                        id: logId
                    }
                });

            }

        }

        /**
        * @param {Object} data
        * @param {String} data.tipo 
        * @param {String} data.idNotificacion 
        * @param {Array}  data.montoTotal 
        * @param {Array}  data.numerodeOperaciones
        * @param {Array}  data.pagos 
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        */
        function primerasCuotas(data, logId) {
            let recordType = 'transaction';
            let transactions = [];
            let payments = data.pagos || [];
            let folios = [];

            if (payments.length == 0) {
                throw error.create({
                    name: 'EMPTY_PAYMENT_LIST_FIRSTPAYMENT',
                    message: 'LA LISTA DE PAGOS NO PUEDE ESTAR VACÍA: NO SE ENCONTRARON PAGOS A REGISTRAR EN LA PETICIÓN'
                })
            }

            let preferences = conautoPreferences.get();
            let subsidiary = preferences.getPreference({ key: 'SUBCONAUTO' });

            if (!subsidiary) {
                throw error.create({
                    name: 'EMPTY_CONFG_SUBSIDIARY',
                    message: 'NO SE CONFIGURÓ LA SUBSIDIARIA DE OPERACIÓN. VAYA A CONFIGURADOR CONAUTO Y VÁLIDE LA INFORMACIÓN'
                })
            }

            let cuentaCobranzaNoIden = preferences.getPreference({
                key: 'CCNI'
            });

            if (!cuentaCobranzaNoIden) {
                throw error.create({
                    name: 'EMPTY_CONFG_CCNI',
                    message: 'NO SE CONFIGURÓ LA CUENTA DE COBRANZA NO IDENTIFICADA. VAYA A CONFIGURADOR CONAUTO Y VÁLIDE LA INFORMACIÓN'
                })
            }

            let mandatoryFields = ['folio', 'referencia', 'referenciaCompleta', 'fechaCobranza', 'fechaPago', 'monto', 'formaPago', 'numPago'];
            let errors = [];

            for (let i = 0; i < payments.length; i++) {
                let payment = payments[i];
                if (payment.folio) {
                    folios.push(payment.folio)
                }
                lib_conauto.checkMandatoryFields(payment, mandatoryFields, i + 1, logId, errors);
            }

            let primerosPagos = [];
            search.searchAllRecords({
                type: search.main().Type.TRANSACTION,
                filters: [
                    search.createFilter({
                        name: 'type',
                        operator: search.main().Operator.ANYOF,
                        values: 'Journal'
                    }),
                    search.createFilter({
                        name: 'externalid',
                        join: 'line.cseg_folio_conauto',
                        operator: search.main().Operator.ANYOF,
                        values: folios
                    })
                ],
                columns: [
                    search.createColumn({ name: 'line.cseg_folio_conauto', summary: search.main().Summary.GROUP }),
                    search.createColumn({ name: 'externalid', join: 'line.cseg_folio_conauto', summary: search.main().Summary.GROUP })
                ],
                data: primerosPagos,
                callback: function (result, primerosPagos) {
                    primerosPagos.push(result.getValue({ name: 'externalid', join: 'line.cseg_folio_conauto', summary: search.main().Summary.GROUP }));
                }
            });

            if (errors.length == 0) {
                for (let i = 0; i < payments.length; i++) {
                    let payment = payments[i];
                    if (payment.referencia) {
                        let account = preferences.getPreference({
                            key: 'CB1P',
                            reference: (payment.referencia || '').substring(0, 2)
                        });
                        if (!account) {
                            errors.push('REFERENCIA LÍNEA ' + i + ': \'' + payment.referencia + '\' NO VÁLIDA, SIN CUENTA');
                        } else {
                            payment.account = account;
                        }
                    }
                }
            }

            let foliosId = [];
            if (errors.length == 0) {
                let foliosText = [];
                for (const paymentData of payments) {
                    let folioText = paymentData.folio;
                    if (folioText && foliosText.indexOf(folioText) == -1) {
                        foliosText.push(folioText);
                    }
                }
                let dataFolios = {};
                search.searchAllRecords({
                    type: 'customrecord_cseg_folio_conauto',
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'externalid' })
                    ],
                    filters: [
                        search.createFilter({
                            name: 'externalid', //probar con name
                            operator: search.main().Operator.ANYOF,
                            values: foliosText
                        })
                    ],
                    data: dataFolios,
                    callback: function (result, dataFolios) {
                        let id = result.getValue({ name: 'internalid' });
                        let folio = result.getValue({ name: 'externalid' });
                        dataFolios[folio] = id;
                        foliosId.push(id);
                    }
                });

                let hashDate = {};
                for (const paymentData of payments) {
                    hashDate[paymentData.fechaCobranza] = hashDate[paymentData.fechaCobranza] || [];
                    hashDate[paymentData.fechaCobranza].push(paymentData);
                }

                for (let date in hashDate) {
                    let journal = record.create({
                        type: record.Type.JOURNAL_ENTRY,
                        isDynamic: true
                    });

                    journal.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiary
                    });
                    journal.setValue({
                        fieldId: 'custbody_imr_tippolcon',
                        value: 2
                    });
                    journal.setValue({
                        fieldId: 'currency',
                        value: 1
                    });

                    journal.setValue({
                        fieldId: 'custbody_tipo_transaccion_conauto',
                        value: 1
                    });
                    journal.setValue({
                        fieldId: 'trandate',
                        value: lib_conauto.stringToDateConauto(date)
                    });
                    let amountTotal = 0;
                    let countLinesJournal = 0;
                    let listPayments = hashDate[date];
                    for (const payment of listPayments) {
                        let folioText = payment.folio;
                        let folioId = dataFolios[folioText];
                        if (!folioId) {
                            let folioObj = record.create({
                                type: 'customrecord_cseg_folio_conauto',
                                isDynamic: true
                            });
                            folioObj.setValue({
                                fieldId: 'name',
                                value: folioText
                            });
                            folioObj.setValue({
                                fieldId: 'externalid',
                                value: folioText
                            });
                            folioObj.setValue({
                                fieldId: 'custrecord_folio_estado',
                                value: 1
                            });
                            folioId = folioObj.save({
                                ignoreMandatoryFields: true
                            });
                            foliosId.push(folioId);
                            dataFolios[folioText] = folioId;

                        }
                        if (primerosPagos.indexOf(payment.folio) != -1) {
                            //continue;
                        }
                        let amount = lib_conauto.parseFloatRound(payment.monto);
                        amountTotal += amount;
                        let memoJournal = `Cobranza PRIMERAS CUOTAS de la referencia ${payment.referenciaCompleta} Folio ${folioText}`
                        journal.setValue({
                            fieldId: 'memo',
                            value: memoJournal
                        });
                        journal.selectNewLine({
                            sublistId: 'line'
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: payment.account
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: amount
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: memoJournal
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_folio_texto_conauto',
                            value: payment.folio
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_referencia_conauto',
                            value: payment.referenciaCompleta
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_metodo_pago_conauto',
                            value: lib_conauto.getFormaPago(payment.formaPago)
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_imr_fecha_pago',
                            value: lib_conauto.stringToDateConauto(payment.fechaPago)
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_folio_conauto',
                            value: folioId
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: 6
                        });
                        journal.commitLine({
                            sublistId: 'line'
                        });
                        //
                        journal.selectNewLine({
                            sublistId: 'line'
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'account',
                            value: cuentaCobranzaNoIden
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            value: memoJournal
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: amount
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_folio_texto_conauto',
                            value: payment.folio
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_referencia_conauto',
                            value: payment.referenciaCompleta
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_metodo_pago_conauto',
                            value: payment.formaPago
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_imr_fecha_pago',
                            value: lib_conauto.stringToDateConauto(payment.fechaPago)
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_folio_conauto',
                            value: folioId
                        });
                        journal.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: 6
                        });
                        journal.commitLine({
                            sublistId: 'line'
                        });
                        countLinesJournal++;
                        if (countLinesJournal == 2500) {
                            countLinesJournal = 0;
                            transactions.push(journal.save({
                                ignoreMandatoryFields: true
                            }));
                            journal = record.create({
                                type: record.Type.JOURNAL_ENTRY,
                                isDynamic: true
                            });
                            journal.setValue({
                                fieldId: 'subsidiary',
                                value: subsidiary
                            });
                            journal.setValue({
                                fieldId: 'custbody_imr_tippolcon',
                                value: 2
                            });
                            journal.setValue({
                                fieldId: 'currency',
                                value: 1
                            });
                            journal.setValue({
                                fieldId: 'memo',
                                value: memoJournal
                            });
                            journal.setValue({
                                fieldId: 'custbody_tipo_transaccion_conauto',
                                value: 1
                            });
                            journal.setValue({
                                fieldId: 'trandate',
                                value: lib_conauto.stringToDateConauto(date)
                            });
                        }
                    }
                    if (countLinesJournal > 0) {
                        let journalId = journal.save({
                            ignoreMandatoryFields: true
                        });
                        transactions.push(journalId);
                    }


                }
            } else {
                throw error.create({
                    name: 'DATA_ERROR_FIRSTPAYMENT',
                    message: errors.join('\n')
                })
            }

            return {
                recordType: recordType,
                transactions: transactions,
                records: transactions,
                solPagos: [],
                folios: foliosId,
                errors: errors
            };
        }

        /***
        *
        * @param data
        * @param {String} data.tipo  tipo de request
        * @param {Object[]} data.detalles Lista de solicitudes de pagos
        * @param {String} data.detalles[].tipoMovimiento Id del tipo de movimiento
        * @param {Number} data.detalles[].monto monto del pago
        * @param {String} data.detalles[].folio folio
        * @param {String} data.detalles[].cuentaBancaria Identidicador de la cuenta
        * @param {Object} data.detalles[].beneficiario Objecto con el beneficiario
        * @param {Object} data.detalles[].beneficiario.rfc rfc del beneficiario
        * @param {Object} data.detalles[].beneficiario.nombre nombre del beneficiario
        * @param response
        * @param {Number} response.code
        * @param {Array} response.Info
        */
        function solicitudPago(data, logId) {
            let recordType = 'customrecord_imr_solicitud_pago';
            let transactions = [];
            let foliosId = [];
            let errors = [];
            for (let i = 0; i < data.pagos.length; i++) {
                let detalle = data.pagos[i];
                let recordObj = record.create({
                    type: 'customrecord_imr_solicitud_pago'
                });
                let fields = {
                    custrecord_imr_solpa_tipo_mov: detalle.tipoMovimiento,
                    custrecord_imr_solpa_importe: detalle.monto,
                    custrecord_imr_solpa_nom_ben: detalle.beneficiario.nombre,
                    custrecord_imr_solpa_rfc_ben: detalle.beneficiario.rfc,
                    custrecord_imr_solpa_folio_texto: detalle.folio,
                    custrecord_imr_solpa_banco_texto: detalle.banco || '',
                    custrecord_imr_solpa_ref_bancaria: detalle.cuentaBBVA || '',
                    custrecord_imr_solpa_rembolso: detalle.reembolso,
                    custrecord_imr_solpa_saldo_favor: detalle.saldoFavor,
                    custrecord_imr_referenciacon: detalle.referencia || '', //L.R.M.R. 02/08/2021 Se mapea el campo ya que no se tomaba.
                    //Layout
                    custrecord_imr_bbva_nc_tipo_lay: detalle.tipoPago || '',
                    custrecord_imr_bbva_nc_tip_cta: detalle.tipoCuenta || '',
                    custrecord_imr_bbva_nc_disponi: detalle.disponibilidad || '',
                    custrecord_imr_ctaclabe_con: detalle.cuentaClabe || '',
                    custrecord_imr_solpa_beneficiaro: detalle.beneficiario.nombre || '',
                    custrecord_imr_ref_numerica: detalle.referenciaNumerica || '',
                    custrecord_imr_conv_cie_con: detalle.convenioCIE || '',
                    custrecord_imr_concepto_con: detalle.concepto || '',
                    custrecord_imr_ref_cie: detalle.referenciaCIE || ''
                }
                for (let fieldsKey in fields) {
                    let value = fields[fieldsKey];
                    recordObj.setValue({
                        fieldId: fieldsKey,
                        value: value
                    })
                }
                transactions.push(recordObj.save({
                    ignoreMandatoryFields: true
                }));
                let validFolio = lib_conauto.recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', detalle.folio)
                if (validFolio) foliosId.push(validFolio);
            }
            return {
                recordType: recordType,
                transactions: [],
                records: transactions,
                solPagos: transactions,
                folios: foliosId,
                errors: errors
            };
        }

        /**
        *
        * @param {Object} data
        * @param {String} data.tipo  tipo de request
        * @param {Number} data.idNotificacion id de la cual proviene la petición
        * @param {Object[]} data.pagos  arreglo de pagos
        * @param {String} data.pagos[].referencia  referencia del pago
        * @param {String} data.pagos[].fechaCobranza  fecha del pago formato DD/MM/YYYY
        * @param {String} data.pagos[].fechaPago  fecha del pago formato DD/MM/YYYY
        * @param {String} data.pagos[].folio  folio conauto
        * @param {String} data.pagos[].status  status del cliente conauto
        * @param {Number} data.pagos[].monto  importe del pago
        * @param {String} data.pagos[].formaPago  forma de pago
        * @param {String} data.pagos[].numPago  número consecutivo del pago
        * @param {String} data.pagos[].grupo identificador del grupo
        * @param {String} data.pagos[].cliente ID del cliente
        * @param {Number} data.pagos[].aportacion Monto de la aportacion
        * @param {Number} data.pagos[].gastos Monto neto de los gastos
        * @param {Number} data.pagos[].iva IVA obtenido de los gastos
        * @param {Number} data.pagos[].seguro_auto Monto utilizado para el seguro de auto
        * @param {Number} data.pagos[].seguro_vida Monto utilizado para el seguro de vida
        * @param {Number} data.pagos[].total_pagar Suma de todos los montos excluyendo monto
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function aplicacionCobranza(data, logId) {
            log.debug("Data aplicacion cobranza", data);
            let records = [];
            let transactions = [];
            let folios = [];
            let errors = [];
            let foliosErroneos = [];
            let recordType = "customrecord_imr_pagos_amortizacion";

            let payments = data.pagos || [];
            if (payments.length == 0) {
                throw error.create({
                    name: "EMPTY_PAYMENT_LIST_FIRSTPAYMENT",
                    message: "La lista de pagos esta vacia"
                })
            }
            let mandatoryFields = ["referencia", "fechaCobranza", "fechaPago", "folio", "monto", "aportacion", "total_pagar", "formaPago", "numPago"];
            let line = 0;
            for (let payment of payments) {
                line++;
                lib_conauto.checkMandatoryFields(payment, mandatoryFields, line, errors);
                let numPagoExist = searchNumPago(payment.numPago);
                lib_conauto.existValue(payment.numPago, numPagoExist, errors);
                //Validación de información en folio
                if (payment.folio) {
                    if (payment.aportacion != 0 || payment.gastos != 0 || payment.iva != 0 || payment.seguro_auto != 0 || payment.seguro_vida != 0) {
                        lib_conauto.checkInfoFolio(payment.folio, errors, foliosErroneos)
                    }
                }
            }
            if (errors.length == 0) {
                let fields = [
                    {
                        type: "text",
                        field: "folio",
                        fieldRecord: "custrecord_imr_pa_folio_texto"
                    },
                    {
                        type: "number",
                        field: "monto",
                        fieldRecord: "custrecord_imr_pa_importe"
                    },
                    {
                        type: "number",
                        field: "aportacion",
                        fieldRecord: "custrecord_conauto_aportacion"
                    },
                    {
                        type: "number",
                        field: "gastos",
                        fieldRecord: "custrecord_conauto_gastos"
                    },
                    {
                        type: "number",
                        field: "iva",
                        fieldRecord: "custrecord_conauto_iva"
                    },
                    {
                        type: "number",
                        field: "saldo_favor",
                        fieldRecord: "custrecord_conauto_saldo_fav"
                    },
                    {
                        type: "number",
                        field: "saldo_liq",
                        fieldRecord: "custrecord_conauto_saldo_liq"
                    },
                    {
                        type: "number",
                        field: "seguro_auto",
                        fieldRecord: "custrecord_conauto_seguro_auto"
                    },
                    {
                        type: "number",
                        field: "seguro_vida",
                        fieldRecord: "custrecord_conauto_seguro_vida"
                    },
                    {
                        type: "number",
                        field: "total_pagar",
                        fieldRecord: "custrecord_conauto_total_pagar"
                    },
                    {
                        type: "text",
                        field: "formaPago",
                        fieldRecord: "custrecord_imr_pa_forma_pago",
                        callback: function (value) { return lib_conauto.getFormaPago(value) }
                    },
                    {
                        type: "date",
                        field: "fechaCobranza",
                        fieldRecord: "custrecord_imr_pa_fecha"
                    },
                    {
                        type: "date",
                        field: "fechaPago",
                        fieldRecord: "custrecord_imr_pa_fecha_pago"
                    },
                    {
                        type: "text",
                        field: "referenciaCompleta",
                        fieldRecord: "custrecord_imr_pa_referencia_completa"
                    },
                    {
                        type: "text",
                        field: "referencia",
                        fieldRecord: "custrecord_imr_pa_referencia",
                        callback: function (value) {
                            return (value || '').substring(0, 2)
                        }
                    },
                    {
                        type: "text",
                        field: "id",
                        fieldRecord: "externalid"
                    },
                    {
                        type: "text",
                        field: "numPago",
                        fieldRecord: "custrecord_conauto_num_payment_service"
                    },
                    {
                        type: "number",
                        field: "status",
                        fieldRecord: "custrecord_imr_pa_estado_folio"
                    }
                ]
                for (let payment of payments) {
                    let recordPagoObj = record.create({
                        type: recordType,
                        isDynamic: true
                    });
                    recordPagoObj.setValue({
                        fieldId: "custrecord_con_log_request2",
                        value: logId
                    })
                    if (!payment.status) fields.pop();
                    for (let field of fields) {
                        let fieldId = field.fieldRecord;
                        let value = payment[field.field];
                        if (field.callback) {
                            value = field.callback(value);
                        }
                        value = lib_conauto.getValueFormat(field.type, value);
                        recordPagoObj.setValue({
                            fieldId: fieldId,
                            value: value
                        });
                    }
                    try {
                        let recordPagoId = recordPagoObj.save({
                            ignoreMandatoryFields: true
                        });
                        records.push(recordPagoId);

                        let pagoAmortizacion = record.load({
                            type: recordType,
                            id: recordPagoId,
                            isDynamic: true
                        });
                        let folioId = pagoAmortizacion.getValue("custrecord_imr_pa_folio");
                        if (folioId) folios.push(folioId);
                        let FieldJournalEntries = ["custrecord_imr_pa_diario", "custrecord_imr_pa_diario_cancelacion", "custrecord_imr_pa_diario_reinstalacion",
                            "custrecord_imr_pa_diario_cxp", "custrecord_imr_pa_diario_can_cxp", "custrecord__imr_pa_diario_seg_auto",
                            "custrecord_imr_pa_factura", "custrecord_imr_pa_nota_credito", "custrecord_imr_pa_diario_cartera",
                            "custrecord_imr_pa_diario_no_iden", "custrecord_imr_pa_diario_can_segauto", "custrecord_imr_pa_diario_can_cartera", "custrecord_conauto_reclam_segu",
                            "custrecord_conauto_aplicacion_rj", "custrecord_conauto_idencobran_rj", "custrecord_conauto_fact_cob_rj"
                        ];
                        for (let fieldId of FieldJournalEntries) {
                            let transactionId = pagoAmortizacion.getValue(fieldId);
                            if (transactionId) transactions.push(transactionId);
                            if (fieldId == "custrecord_imr_pa_factura" && transactionId) {
                                let generateCFDI = record.load({
                                    type: record.Type.CASH_SALE,
                                    id: pagoAmortizacion.getValue(fieldId),
                                    isDynamic: true
                                });
                                generateCFDI.save();
                            }
                        }
                    } catch (e) {
                        errors.push(e.toString())
                    }
                }
            } else {
                let scriptObj = runtime.getCurrentScript();
                let logId = scriptObj.getParameter({
                    name: "custscript_log_service_id_mr"
                });
                record.submitFields({
                    type: LOG_SERVICE_CONAUTO,
                    id: Number(logId),
                    values: {
                        "custrecord_log_serv_folios_no_processed": [...new Set(foliosErroneos)]
                    }
                });
                throw error.create({
                    name: "DATA_ERROR_PAYMENTS",
                    message: errors.join("\n")
                })
            }

            return {
                recordType: recordType,
                transactions: transactions,
                records: records,
                solPagos: [],
                folios: folios,
                errors: errors
            };
        }

        /**
        *
        * @param {Object} data
        * @param {String} data.tipo  tipo de request
        * @param {Number} data.idNotificacion id de la cual proviene la petición
        * @param {Object[]} data.pagos  arreglo de pagos
        * @param {String} data.pagos[].fecha  fecha del pago formato DD/MM/YYYY
        * @param {Number} data.pagos[].status TODO: Por definir
        * @param {String} data.pagos[].folioContrato  folio conauto
        * @param {String} data.pagos[].grupo identificador del grupo
        * @param {Number} data.pagos[].integrante TODO: Por definiri
        * @param {Number} data.pagos[].total_pagar Suma de todos los montos
        * @param {Number} data.pagos[].cliente TODO: Por definir
        * @param {Number} data.pagos[].aportacion Monto de la aportacion
        * @param {Number} data.pagos[].gastos Monto neto de los gastos
        * @param {Number} data.pagos[].iva IVA obtenido de los gastos
        * @param {Number} data.pagos[].seguro_auto Monto utilizado para el seguro de auto
        * @param {Number} data.pagos[].seguro_vida Monto utilizado para el seguro de vida
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array} response.info
        */
        function provisionCartera(data, response) {
            let records = [];
            let transactions = [];
            let errors = [];
            let folios = [];
            let recordType = "transaction";

            let payments = data.pagos || [];
            if (payments.length == 0) {
                throw error.create({
                    name: "EMPTY_PAYMENT_LIST_FIRSTPAYMENT",
                    message: "La lista de pagos esta vacia"
                })
            }
            let mandatoryFields = ["fecha", "status", "folioContrato", "grupo", "integrante", "total_pagar", "cliente", "aportacion"];
            let line = 0;
            for (let payment of payments) {
                line++;
                lib_conauto.checkMandatoryFields(payment, mandatoryFields, line, errors);
            }
            if (errors.length == 0) {
                for (let payment of payments) {
                    let folio = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", payment.folioContrato);
                    if (!folio) continue;
                    record.submitFields({
                        type: 'customrecord_cseg_folio_conauto',
                        id: folio,
                        values: {
                            custrecord_folio_estado: payment.status
                        },
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });
                    folios.push(folio);
                    // FILL
                    payment["seguroAuto"] = payment.seguro_auto;
                    payment["seguroVida"] = payment.seguro_vida;
                    // ---
                    let preferences = conautoPreferences.get();
                    let grupo = payment.grupo;
                    let folioText = payment.folioContrato;
                    let clienteInfo = search.lookupFields({
                        id: folio,
                        type: 'customrecord_cseg_folio_conauto',
                        columns: ['custrecord_cliente_integrante', 'custrecord_imr_integrante_conauto', 'custrecord_grupo']
                    });
                    log.error("CLIENTE INFO", clienteInfo)
                    let cliente = clienteInfo.custrecord_cliente_integrante[0].value;
                    payment["integrante"] = clienteInfo.custrecord_imr_integrante_conauto;
                    let integrante = payment.integrante;
                    let grupoId = clienteInfo.custrecord_grupo[0].value;
                    let memo = `Creación de la provisión cartera No de Folio ${folioText} - Gpo ${grupo} - Int ${integrante}`;
                    let type = '16';
                    let journalObj = lib_conauto.createRecordHeader(record.Type.JOURNAL_ENTRY, preferences, memo, type);
                    let accountDebit = preferences.getPreference({
                        key: 'PCP',
                        reference: 'carteraDebito'
                    });
                    let accountCredit = preferences.getPreference({
                        key: 'PCP',
                        reference: 'carteraCredito'
                    });
                    let conceptos = ['aportacion', 'gastos', 'seguroVida', 'seguroAuto'];
                    for (const concepto of conceptos) {
                        let classId = preferences.getPreference({
                            key: 'CLSP',
                            reference: concepto
                        });
                        let amount = parseFloat((concepto != "gastos") ? payment[concepto] : payment[concepto] + payment['iva']);
                        log.error("PAYMENT:", payment)
                        log.error("DATO MONTO:", amount)
                        if (amount > 0) {
                            lib_conauto.setDataLine(journalObj, 'line', [
                                { fieldId: 'account', value: accountDebit },
                                { fieldId: 'debit', value: amount },
                                { fieldId: 'entity', value: cliente },
                                { fieldId: 'cseg_grupo_conauto', value: grupoId },
                                { fieldId: 'cseg_folio_conauto', value: folio },
                                { fieldId: 'custcol_folio_texto_conauto', value: folioText },
                                { fieldId: 'memo', value: memo },
                                { fieldId: 'class', value: classId },
                                { fieldId: 'location', value: 6 }
                            ]);
                            lib_conauto.setDataLine(journalObj, 'line', [
                                { fieldId: 'account', value: accountCredit },
                                { fieldId: 'credit', value: amount },
                                { fieldId: 'entity', value: cliente },
                                { fieldId: 'cseg_grupo_conauto', value: grupoId },
                                { fieldId: 'cseg_folio_conauto', value: folio },
                                { fieldId: 'custcol_folio_texto_conauto', value: folioText },
                                { fieldId: 'memo', value: memo },
                                { fieldId: 'class', value: classId },
                                { fieldId: 'location', value: 6 }
                            ]);
                        }

                    }
                    journalId = journalObj.save({
                        ignoreMandatoryFields: true
                    });
                    transactions.push(journalId);
                    let seguroAutoAmount = parseFloat(payment["seguroAuto"]);
                    let classSeguroAutoId = preferences.getPreference({
                        key: 'CLSP',
                        reference: 'seguroAuto'
                    });

                    if (seguroAutoAmount) {
                        let accountDebitSeguroAuto = preferences.getPreference({
                            key: 'CCP',
                            reference: 'seguroAutoDisminucion'
                        });
                        let accountCreditSeguroAuto = preferences.getPreference({
                            key: 'CCP',
                            reference: 'seguroAutoAumento'
                        });

                        let journalSeguroAuto = lib_conauto.createRecordHeader(record.Type.JOURNAL_ENTRY, preferences, memo, type);

                        lib_conauto.setDataLine(journalSeguroAuto, 'line', [
                            { fieldId: 'account', value: accountCreditSeguroAuto },
                            { fieldId: 'debit', value: seguroAutoAmount },
                            { fieldId: 'entity', value: cliente },
                            { fieldId: 'cseg_grupo_conauto', value: grupoId },
                            { fieldId: 'cseg_folio_conauto', value: folio },
                            { fieldId: 'custcol_folio_texto_conauto', value: folioText },
                            { fieldId: 'memo', value: memo },
                            { fieldId: 'class', value: classSeguroAutoId },
                            { fieldId: 'location', value: 6 }
                        ]);
                        lib_conauto.setDataLine(journalSeguroAuto, 'line', [
                            { fieldId: 'account', value: accountDebitSeguroAuto },
                            { fieldId: 'credit', value: seguroAutoAmount },
                            { fieldId: 'entity', value: cliente },
                            { fieldId: 'cseg_grupo_conauto', value: grupoId },
                            { fieldId: 'cseg_folio_conauto', value: folio },
                            { fieldId: 'custcol_folio_texto_conauto', value: folioText },
                            { fieldId: 'memo', value: memo },
                            { fieldId: 'class', value: classSeguroAutoId },
                            { fieldId: 'location', value: 6 }
                        ]);

                        let journalSeguroAutoId = journalSeguroAuto.save({
                            ignoreMandatoryFields: true
                        });
                        transactions.push(journalSeguroAutoId);
                    }

                };
            } else {
                throw error.create({
                    name: "DATA_ERROR_PAYMENTS",
                    message: errors.join("\n")
                })
            }
            return {
                recordType: recordType,
                transactions: transactions,
                records: records,
                solPagos: [],
                folios: folios,
                errors: errors
            };
        }

        /***
         * @param data
         * @param {String} data.tipo  tipo de request
         * @param {Object[]} data.detalles Lista de solicitudes de pagos
         * @param {String} data.detalles[].tipoMovimiento Id del tipo de movimiento
         * @param {Number} data.detalles[].monto monto del pago
         * @param {String} data.detalles[].folio folio
         * @param {String} data.detalles[].cuentaBancaria Identidicador de la cuenta
         * @param {Object} data.detalles[].beneficiario Objecto con el beneficiario
         * @param {Object} data.detalles[].beneficiario.rfc rfc del beneficiario
         * @param {Object} data.detalles[].beneficiario.nombre nombre del beneficiario
         * @param response
         * @param {Number} response.code
         * @param {Array} response.Info
         */
        function cobranzaIdentificada(data, logId) {
            let records = [];
            let errors = [];
            let transactions = [];
            let folios = [];
            let foliosErroneos = [];
            let recordType = "customrecord_imr_pagos_amortizacion";
            let payments = data.pagos || [];
            if (payments.length == 0) {
                throw error.create({
                    name: "EMPTY_PAYMENT_LIST_FIRSTPAYMENT",
                    message: "La lista de pagos esta vacia"
                })
            }
            let mandatoryFields = ["referenciaCompleta", "fechaCobranza", "fechaPago", "folioCorrecto", "folioIncorrecto", "monto", "aportacion", "gastos", "iva", "seguro_auto", "seguro_vida"];
            let pagosId = [];
            let dataPayments = {};
            for (let i = 0; i < payments.length; i++) {
                let payment = payments[i];
                lib_conauto.checkMandatoryFields(payment, mandatoryFields, i + 1, errors);
                lib_conauto.checkInfoFolio(payment.folio, errors, foliosErroneos);
                pagosId.push(payment.id);
                dataPayments[payment.id] = payment;
            }
            if (errors.length == 0) {
                let fields = [
                    {
                        type: "text",
                        field: "folioIncorrecto",
                        fieldRecord: "custrecord_imr_pa_folio_texto"
                    },
                    {
                        type: "number",
                        field: "monto",
                        fieldRecord: "custrecord_imr_pa_importe"
                    },
                    {
                        type: "number",
                        field: "aportacion",
                        fieldRecord: "custrecord_conauto_aportacion"
                    },
                    {
                        type: "number",
                        field: "gastos",
                        fieldRecord: "custrecord_conauto_gastos"
                    },
                    {
                        type: "number",
                        field: "iva",
                        fieldRecord: "custrecord_conauto_iva"
                    },
                    {
                        type: "number",
                        field: "seguro_auto",
                        fieldRecord: "custrecord_conauto_seguro_auto"
                    },
                    {
                        type: "number",
                        field: "seguro_vida",
                        fieldRecord: "custrecord_conauto_seguro_vida"
                    },
                    {
                        type: "number",
                        field: "saldo_favor",
                        fieldRecord: "custrecord_conauto_saldo_fav"
                    },
                    {
                        type: "number",
                        field: "saldo_liq",
                        fieldRecord: "custrecord_conauto_saldo_liq"
                    },
                    {
                        type: "number",
                        field: "total_pagar",
                        fieldRecord: "custrecord_conauto_total_pagar"
                    },
                    {
                        type: "text",
                        field: "formaPago",
                        fieldRecord: "custrecord_imr_pa_forma_pago",
                        callback: function (value) { return lib_conauto.getFormaPago(value) }
                    },
                    {
                        type: "date",
                        field: "fechaCobranza",
                        fieldRecord: "custrecord_imr_pa_fecha"
                    },
                    {
                        type: "date",
                        field: "fechaPago",
                        fieldRecord: "custrecord_imr_pa_fecha_pago"
                    },
                    {
                        type: "text",
                        field: "referenciaCompleta",
                        fieldRecord: "custrecord_imr_pa_referencia_completa"
                    },
                    {
                        type: "text",
                        field: "referencia",
                        fieldRecord: "custrecord_imr_pa_referencia",
                        callback: function (value) {
                            return (value || '').substring(0, 2)
                        }
                    },
                    {
                        type: "text",
                        field: "id",
                        fieldRecord: "externalid"
                    },
                    {
                        type: "text",
                        field: "numPago",
                        fieldRecord: "custrecord_conauto_num_payment_service"
                    }
                ]
                for (let payment of payments) {
                    let recordPagoObj = record.create({
                        type: recordType,
                        isDynamic: true
                    });
                    recordPagoObj.setValue({
                        fieldId: "custrecord_con_log_request2",
                        value: logId
                    })
                    recordPagoObj.setText({
                        fieldId: "custrecord_imr_pa_folio",
                        text: payment.folioCorrecto
                    })
                    recordPagoObj.setValue({
                        fieldId: "custrecord_imr_pa_rec_pago",
                        value: true
                    })
                    for (let field of fields) {
                        let fieldId = field.fieldRecord;
                        let value = payment[field.field];
                        if (field.callback) {
                            value = field.callback(value);
                        }
                        value = lib_conauto.getValueFormat(field.type, value);
                        recordPagoObj.setValue({
                            fieldId: fieldId,
                            value: value
                        });
                    }
                    try {
                        let recordPagoId = recordPagoObj.save({
                            ignoreMandatoryFields: true
                        });
                        records.push(recordPagoId);

                        let pagoAmortizacion = record.load({
                            type: recordType,
                            id: recordPagoId,
                            isDynamic: true
                        });
                        let folioId = pagoAmortizacion.getValue("custrecord_imr_pa_folio");
                        if (folioId) folios.push(folioId);
                        let FieldJournalEntries = ["custrecord_imr_pa_diario", "custrecord_imr_pa_diario_cancelacion", "custrecord_imr_pa_diario_reinstalacion",
                            "custrecord_imr_pa_diario_cxp", "custrecord_imr_pa_diario_can_cxp", "custrecord__imr_pa_diario_seg_auto",
                            "custrecord_imr_pa_factura", "custrecord_imr_pa_nota_credito", "custrecord_imr_pa_diario_cartera",
                            "custrecord_imr_pa_diario_no_iden", "custrecord_imr_pa_diario_can_segauto", "custrecord_imr_pa_diario_can_cartera", "custrecord_conauto_reclam_segu",
                            "custrecord_conauto_aplicacion_rj", "custrecord_conauto_idencobran_rj", "custrecord_conauto_fact_cob_rj"
                        ];
                        for (let fieldId of FieldJournalEntries) {
                            let transactionId = pagoAmortizacion.getValue(fieldId);
                            if (transactionId) transactions.push(transactionId);
                            if (fieldId == "custrecord_imr_pa_factura") {
                                let generateCFDI = record.load({
                                    type: record.Type.CASH_SALE,
                                    id: pagoAmortizacion.getValue(fieldId),
                                    isDynamic: true
                                });
                                generateCFDI.save();
                            }
                        }
                    } catch (e) {
                        errors.push(e.toString())
                    }
                }
            } else {
                let scriptObj = runtime.getCurrentScript();
                let logId = scriptObj.getParameter({
                    name: "custscript_log_service_id_mr"
                });
                record.submitFields({
                    type: LOG_SERVICE_CONAUTO,
                    id: Number(logId),
                    values: {
                        "custrecord_log_serv_folios_no_processed": [...new Set(foliosErroneos)]
                    }
                });
                throw error.create({
                    name: "DATA_ERROR_PAYMENTS",
                    message: errors.join("\n")
                })
            }
            return {
                recordType: recordType,
                transactions: transactions,
                records: records,
                solPagos: [],
                folios: folios,
                errors: errors
            };
        }

        /**
         * maneja el error
         * @param error
         * @return {{reduce: reduce, getInputData: (function(*): *)}}
         */
        function handlerError(e) {
            let scriptObj = runtime.getCurrentScript();
            let logId = scriptObj.getParameter({
                name: "custscript_log_service_id_mr"
            });
            if (logId) {
                log.error({
                    title: "ERROR",
                    details: "Log id: " + logId + " ERROR: " + e.message
                });
                if (logId) {
                    record.submitFields({
                        type: LOG_SERVICE_CONAUTO,
                        id: logId,
                        values: {
                            custrecord_log_serv_error: e.message
                        }
                    })
                }
            }
        }

        /**
         * 
         * @param numPago
         * @return {result}
         */
        function searchNumPago(numPago) {
            let result = false;
            var customrecord_imr_pagos_amortizacionSearchObj = search2.create({
                type: "customrecord_imr_pagos_amortizacion",
                filters:
                    [["custrecord_conauto_num_payment_service", "equalto", numPago]],
                columns:
                    [
                        search2.createColumn({ name: "internalid", label: "ID" }),
                    ]
            });
            var searchResultCount = customrecord_imr_pagos_amortizacionSearchObj.runPaged().count;
            log.debug("customrecord_imr_pagos_amortizacionSearchObj result count", searchResultCount);
            if (searchResultCount > 0) {
                result = true
            }
            return result;
        }

        return { getInputData, map, reduce, summarize }

    });
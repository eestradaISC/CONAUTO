/**
* @author Erick Estrada
* @Name con_lib_service_netsuite.js
* @description Script que contiene las funciones más usadas en los servicios de CONAUTO
* @NApiVersion 2.1
*/

define(["N/record", "N/file", "/SuiteScripts/Conauto_Preferences.js", "IMR/IMRSearch", "N/search", "N/error", "N/log"],
    /**
     * @param {record} record
     * @param {file} file
     * @param {conautoPreferences} conautoPreferences
     * @param {IMRSearch} search
     * @param {search} search_netsuite
     * @param {error} error
     * @param {log} log
     */
    (record, file, conautoPreferences, search, search_netsuite, error, log) => {
        const handler = {};

        handler.applyPaymentLine = (recordObj, line) => {
            let payments = 0;
            let fields = ['custrecord_imr_amo_det_aplapo', 'custrecord_imr_amo_aplgtos', 'custrecord_imr_amo_det_aplivagts', 'custrecord_imr_amo_det_aplsegvida', 'custrecord_imr_amo_det_aplsegaut',
                'custrecord_imr_amo_det_aplintpe', 'custrecord_imr_amo_det_montoapl'];
            for (let field of fields) {
                payments += parseFloat(recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_imr_amo_det_parent',
                    fieldId: field,
                    line: line
                })) || 0;
            };
            return payments > 0;
        }

        handler.addLineJournal = (journal, account, isdebit, amount, data) => {
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

        handler.getValueFormat = (type, value) => {
            switch (type) {
                case 'date':
                    value = handler.stringToDateConauto(value);
                    break;
                case 'number':
                    value = parseFloat(value) || 0;
                    break;
                default:
            }
            return value;
        }

        handler.checkMandatoryFields = (data, mandatoryFields, line, errors) => {
            for (let field of mandatoryFields) {
                let value = data[field];
                if (!(value || parseFloat(value) === 0 || util.isBoolean(value))) {
                    errors.push((line ? ('Linea ' + line + ': ') : '') + 'El campo ' + field + ' no debe de estar vacio');
                }
            }
        }

        handler.verificarValoresVacios = (objeto, errors, foliosErroneos) => {
            for (let clave in objeto) {
                if (objeto.hasOwnProperty(clave)) {
                    log.debug("objeto[clave]", objeto[clave]);
                    if (objeto[clave] === "") {
                        foliosErroneos.push(objeto["numFolio"] || "")
                        errors.push('EL SISTEMA ENCONTRÓ VALORES VACÍOS EN ' + clave + ' DEL FOLIO ' + objeto["numFolio"] || ' ' + ', ENVIAR ACTUALIZA CONTRATO PREVIAMENTE.');
                    }
                }
            }
        }

        handler.parseFloatRound = (value, decimals) => {
            return parseFloat((parseFloat(value) || 0).toFixed(decimals || 2));
        }

        handler.stringToDateConauto = (value) => {
            if (value) {
                let arrayDate = value.split('/');
                return new Date(arrayDate[2], arrayDate[1] - 1, arrayDate[0]);
            } else {
                return null;
            }
        }

        handler.recordFind = (recordType, operator, field, value) => {
            let id = null;
            if (value) {
                let results = search.searchAllRecords({
                    type: recordType,
                    filters: [
                        search_netsuite.createFilter({
                            name: field,
                            operator: operator,
                            values: [value]
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: 'internalid'
                        })
                    ]
                });
                if (results.length > 0) {
                    id = results[0].getValue({
                        name: 'internalid'
                    });
                }
            }
            return id;
        }

        handler.setOpcionalData = (recordObj, value, field) => {
            if (value || parseFloat(value) === 0) {
                recordObj.setValue({
                    fieldId: field,
                    value: value
                })
            }
        }

        handler.getCFDIs = () => {
            try {
                let cfdis = {};
                search.create({
                    type: "customrecord_uso_cfdi_fe_33",
                    filters:
                        [
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                label: "ID"
                            }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                }).run().each(function (result) {
                    cfdis[result.getValue("name")] = result.getValue("internalid")
                    return true;
                })
                return cfdis;
            } catch (err) {
                throw error.create({
                    name: 'CFDI NOT FOUNDS',
                    message: err
                });
            }
        }

        handler.setDataRecord = (maps, data, record) => {
            for (let dataField of maps) {
                if (Object.getOwnPropertyNames(data).indexOf(dataField.field) != -1) {
                    let value = data[dataField.field];
                    value = handler.getValueFormat(dataField.type, value);
                    record.setValue({
                        fieldId: dataField.fieldRecord,
                        value: value
                    })
                }
            }
        }

        handler.getFormaPago = (value) => {
            //log.error('getFormaPago',value)
            let values = { '12': '102', '13': '108', '14': '103', '15': '109', '17': '104', '23': '110', '24': '105', '25': '111', '26': '106', '27': '112', '28': '120', '29': '121', '30': '107', '31': '101', '99': '99', '01': '1', '02': '2', '03': '3', '04': '4', '05': '5', '06': '6', '08': '8', 'X': '100', '1': '1', '2': '2', '3': '3', '4': '4' };
            //return values[value.toString()]||null; //L.R.M.R. 06/05/2022 Se coloca a toString porque estaba eliminando el cero
            return values[value] || null;
        }

        handler.getRequestLog = (logId) => {
            let log = record.load({
                id: logId,
                type: 'customrecord_log_service_conauto'
            });
            let processed = log.getValue({
                fieldId: 'custrecord_log_serv_processed'
            });
            if (processed) {
                throw error.create({
                    name: 'LOG_PROCESSED',
                    message: 'EL LOG YA SE ENCUENTRA PROCESADO'
                });
            }
            let requestFileId = log.getValue({
                fieldId: 'custrecord_log_serv_request'
            });
            let request = file.load({
                id: requestFileId
            });
            return JSON.parse(request.getContents());
        }

        /***
        *
        * @param {Record} transaccionObj
        * @param {Array} values
        * @param {String} sublistId
        */
        handler.setDataLine = (transaccionObj, sublistId, values) => {
            transaccionObj.selectNewLine({
                sublistId: sublistId
            });
            for (let i = 0; i < values.length; i++) {
                let field = values[i];
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

        handler.createRecordHeader = (recordType, preferences, memo, type) => {
            let journalObj = record.create({
                type: recordType,
                isDynamic: true
            });
            let subsidiary = preferences.getPreference({
                key: 'SUBCONAUTO'
            });
            journalObj.setValue({
                fieldId: 'subsidiary',
                value: subsidiary
            });
            journalObj.setValue({
                fieldId: 'custbody_tipo_transaccion_conauto',
                value: type
            });
            journalObj.setValue({
                fieldId: 'memo',
                value: memo
            });
            journalObj.setValue({
                fieldId: 'currency',
                value: 1
            });
            return journalObj;
        }

        handler.createJournalCXP = (payment, preferences, transactions) => {
            try {
                log.error("createJournalCXP")
                let reference = payment.referencia;
                let cliente = payment.cliente;
                let date = handler.stringToDateConauto(payment.fecha);
                let formaPago = payment.formaPago == "0" ? "01" : payment.formaPago;
                let folioText = payment.folio;
                let referenceCompleta = payment.referencia;
                let folioId = payment.folioId;
                let grupoId = payment.grupoId;
                let gastos = parseFloat((payment.iva + payment.gastos).toFixed(2));

                if (gastos > 0) {
                    let subsidiary = preferences.getPreference({
                        key: "SUBCONAUTO"
                    });
                    let memo = `Cuenta por pagar a proveedores por cobranza recibida referencia ${referenceCompleta} - Folio ${folioText} - Gpo ${payment.grupo} - Int ${payment.integrante}`;

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
                    let cuentaDebito = preferences.getPreference({
                        key: "CCP",
                        reference: 'gastos'
                    });
                    let accountCredit = preferences.getPreference({
                        key: "CCP",
                        reference: 'gastosPorPagar'
                    });

                    let classId = preferences.getPreference({
                        key: 'CLSP',
                        reference: 'gastos'
                    });

                    handler.addLineJournal(diarioObj, cuentaDebito, true, gastos, {
                        memo: memo,
                        custcol_referencia_conauto: reference,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente,
                        class: classId,
                        location: 6
                    });
                    handler.addLineJournal(diarioObj, accountCredit, false, gastos, {
                        memo: memo,
                        custcol_referencia_conauto: reference,
                        custcol_metodo_pago_conauto: formaPago,
                        custcol_folio_texto_conauto: folioText,
                        cseg_folio_conauto: folioId,
                        cseg_grupo_conauto: grupoId,
                        entity: cliente,
                        class: classId,
                        location: 6
                    });
                    journalId = diarioObj.save({
                        ignoreMandatoryFields: true,
                    });
                    conautoPreferences.setFolioConauto(journalId);
                    transactions.push(journalId);
                }
            } catch (e) {
                log.error('createJournalCXP', e);
            }
        }

        handler.createInvoice = (payment, preferences, transactions) => {
            try {
                log.error("createInvoice")
                let fechaCobranza = handler.stringToDateConauto(payment.fecha)

                let referenciaCompleta = payment.referencia;
                let cliente = payment.cliente;
                let folioText = payment.folio;
                let folioId = payment.folioId;
                let grupoId = payment.grupoId;
                let grupoText = payment.grupo;
                let formaPagoFe = payment.formaPago == "0" ? "01" : payment.formaPago;
                let gastosSinIVa = payment.gastos;
                let ivaGasto = payment.iva;
                let formaPagoFetxt = "01";

                if (gastosSinIVa > 0) {
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
                    let memo = `Cobranza Recibida en Sistema de Comercialización de la referencia ${referenciaCompleta} - Folio ${folioText} - Gpo ${grupoText} - Int ${payment.integrante}`;

                    facturaObj.setValue({
                        fieldId: "entity",
                        value: cliente
                    });
                    facturaObj.setValue({
                        fieldId: "trandate",
                        value: fechaCobranza
                    })

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
                        fieldId: "custbody_fecha_de_timbrado",
                        value: new Date()
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
                        fieldId: "custcol_referencia_conauto",
                        value: referenciaCompleta
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
                    let facturaId = facturaObj.save({
                        ignoreMandatoryFields: true
                    });
                    log.error('ERROR', 'facturaId: ' + facturaId);
                    conautoPreferences.setFolioConauto(facturaId);
                    transactions.push(facturaId)
                }
            } catch (e) {
                log.error('createInvoice', 'Linea 1798: ' + e);
            }
        }

        return handler;
    });
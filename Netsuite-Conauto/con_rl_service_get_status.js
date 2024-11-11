/**
* @author Eric Raul Estrada Acosta 
* @Modificacion <>
* @Name con_rl_service_get_status.js
* @description Servicio de conexión entre Progress y Netsuite para obtener el estado de los LOGS
* @file <URL PENDIENTE>
* @NApiVersion 2.1
* @NScriptType Restlet
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
    'N/record',
    'N/file',
    'IMR/IMRSearch',
    '/SuiteScripts/Conauto_Preferences.js'
],
    function (
        record,
        file,
        search,
        conautoPreferences) {

        /**
        * @param request
        *        {String|Object} The request body as a String when
        *            <code>Content-Type</code> is <code>text/plain</code>; The
        *            request body as an Object when request
        *            <code>Content-Type</code> is <code>application/json</code>
        *
        * @return {String|Object} Returns a String when request
        *         <code>Content-Type</code> is <code>text/plain</code>;
        *         returns an Object when request <code>Content-Type</code> is
        *         <code>application/json</code>
        *
        * @static
        * @function post
        */
        function getRequest(request) {
            let response = { code: 300, info: [], data: {} };
            try {
                let data = request || {};

                let operations = {
                    'getStatusLOG': getStatusLOG
                }
                let callback = operations["getStatusLOG"];
                if (callback) {
                    try {
                        callback(data, response);
                    } catch (e) {
                        response.code = 400;
                        response.info.push('ERROR GET REQUEST: ' + e.toString());
                    }
                } else {
                    response = { code: 404, info: ['OPERACIÓN ' + data.tipo + ' INVÁLIDA'] };
                }
                successRequest(response);
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR GET REQUEST: ' + e.toString());
            }
            return JSON.stringify(response);
        }

        function getStatusLOG(data, response) {
            data.startDate = stringToDateConauto(data.startDate);
            data.endDate = stringToDateConauto(data.endDate);
            searchCollectionPerDay(data)
            let logData = record.load({
                id: Number(data.log),
                type: 'customrecord_log_service_conauto'
            });
            let processed = logData.getValue({
                fieldId: 'custrecord_log_serv_processed'
            });
            let type = logData.getValue({ fieldId: 'custrecord_log_serv_type' });
            let errorLog = logData.getValue({ fieldId: 'custrecord_log_serv_error' });
            let folios = logData.getText({ fieldId: 'custrecord_log_serv_folio' }) || [];
            let foliosNoProcessed = logData.getText({ fieldId: 'custrecord_log_serv_folios_no_processed' }) || [];
            let totalPayments = logData.getValue({ fieldId: 'custrecord_log_serv_length' });
            let paymentsProcessed = logData.getValue({ fieldId: 'custrecord_con_payments_processed' });
            response.data = {
                "type": type,
                "processed": processed,
                "error": errorLog,
                "folios": folios,
                "foliosNoProcessed": foliosNoProcessed,
                "totalPayments": totalPayments,
                "paymentsProcessed": paymentsProcessed,
            }
            return response;
        }

        function searchCollectionPerDay(data) {
            try {
                let collection = {}
                search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                    filters:
                        [
                            [["memo", "contains", "Cobranza PRIMERAS CUOTAS de la referencia%"], "OR", ["memo", "contains", "identificacion de la cobranza Recibida de la referencia %"], "OR", ["memo", "contains", "Disminución de la cartera por la cobranza recibida de la referencia %"], "OR", ["memo", "contains", "Cobranza Recibida en Sistema de Comercialización de la referencia %"], "OR", ["memo", "contains", "Cuenta por pagar a proveedores por cobranza%"], "OR", ["memo", "contains", "DISMINUCION DE SEGURO AUTO POR APLICACIÓN DE LA COBRANZA DE LA REFERENCIA%"], "OR", ["memo", "contains", "Pago identificado de la referencia %"]],
                            "AND",
                            ["account", "anyof", "2644", "453", "463", "467", "484", "485", "486", "490", "2014"],
                            "AND",
                            ["trandate", "within", data.startDate, data.endDate]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "account",
                                summary: "GROUP",
                                label: "Cuenta"
                            }),
                            search.createColumn({
                                name: "debitamount",
                                summary: "SUM",
                                label: "Importe (débito)"
                            }),
                            search.createColumn({
                                name: "creditamount",
                                summary: "SUM",
                                label: "Importe (crédito)"
                            })
                        ]
                }).run().each((result) => {
                    let account = result.getValue({
                        name: "account",
                        summary: "GROUP",
                        label: "Cuenta"
                    });
                    let amount = result.getValue({
                        name: "creditamount",
                        summary: "SUM",
                        label: "Importe (crédito)"
                    })
                    collection[account] = amount;
                });
                return collection;
            } catch (error) {
                log.error("Error find collection per day")
            }
        }

        function recordFind(recordType, operator, field, value) {
            let id = null;

            let results = search.searchAllRecords({
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
                        name: 'internalid'
                    })
                ]
            });
            if (results.length > 0) {
                id = results[0].getValue({
                    name: 'internalid'
                });
            }
            return id;
        }

        function getDateExternalid(value) {
            let date = stringToDateConauto(value);
            if (date) {
                return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
            } else {
                return "";
            }
        }

        function stringToDateConauto(value) {
            if (value) {
                let arrayDate = value.split("/");
                return new Date(arrayDate[2], arrayDate[1] - 1, arrayDate[0]);
            } else {
                return null;
            }
        }

        function handlerErrorLogRequest(e, logId) {
            if (logId) {
                log.error({
                    title: 'ERRORHANDLER',
                    details: 'LOG ID: ' + logId + ', ' + e
                });
                record.submitFields({
                    type: 'customrecord_log_service_conauto',
                    id: logId,
                    values: {
                        custrecord_log_serv_processed: true,
                        custrecord_log_serv_error: e
                    }
                })
            }
            return logId;
        }

        function successRequest(response) {
            if (response.code == 300) {
                response.code = 200;
                response.info.push('Petición Exitosa');
            }
        }

        return { get: getRequest }

    });
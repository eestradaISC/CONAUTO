/**
* @author Eric Raul Estrada Acosta 
* @Modificacion <>
* @Name con_rl_service_collection_per_day.js
* @description Servicio de conexión entre Progress y Netsuite que devuelve los montos recibidos en cuentas seleccionadas de NetSuite a Progress
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
        function postRequest(request) {
            let response = { code: 300, info: [], data: {} };
            try {
                let data = request || {};

                let operations = {
                    'cobranzaPorDia': getCollectionPerDay,
                    'cobranzaPorFolioPorConcepto': getCollectionPerFolio,
                    'estadosDeCuentaPorFolio': getFolioDetail,
                }
                let callback = operations[data.tipo];
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

        function getCollectionPerDay(data, response) {
            log.audit("data", data);
            response.data = searchCollectionPerDay(data, response);
        }

        function getCollectionPerFolio(data, response) {
            log.audit("data", data);
            response.data = searchCollectionPerFolio(data, response);
        }

        function getFolioDetail(data, response) {
            log.audit("data", data);
            response.data = [searchFolioDetail(data, response)];
        }

        function searchCollectionPerDay(data, response) {
            try {
                let collection = [];
                let references = getReferencesBetweenDates(data);
                references.pop()
                // references.push(["trandate", "within", data.fechaInicio, data.fechaFinal])

                search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                    filters:
                        [
                            [["memo", "contains", "Cobranza PRIMERAS CUOTAS de la referencia%"], "OR", ["memo", "contains", "identificacion de la cobranza Recibida de la referencia %"], "OR", ["memo", "contains", "Disminución de la cartera por la cobranza recibida de la referencia %"], "OR", ["memo", "contains", "Cobranza Recibida en Sistema de Comercialización de la referencia %"], "OR", ["memo", "contains", "Cuenta por pagar a proveedores por cobranza%"], "OR", ["memo", "contains", "DISMINUCION DE SEGURO AUTO POR APLICACIÓN DE LA COBRANZA DE LA REFERENCIA%"], "OR", ["memo", "contains", "Aplicación de Saldo a Estado de Cuenta de la referencia%"], "OR", ["memo", "contains", "Pago no identificado de la referencia%"], "OR", ["memo", "contains", "Devolución De 1ra cuota de la cobranza recibida de la referencia%"], "OR", ["memo", "contains", "Pago identificado de la referencia %"]], 
                            "AND",
                            ["account", "anyof", "2643", "2644", "453", "463", "467", "484", "485", "486", "490", "2014"],
                            "AND",
                            references
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
                    let account = result.getText({
                        name: "account",
                        summary: "GROUP",
                        label: "Cuenta"
                    });
                    let debitAmount = result.getValue({
                        name: "debitamount",
                        summary: "SUM",
                        label: "Importe (débito)"
                    });
                    let creditAmount = result.getValue({
                        name: "creditamount",
                        summary: "SUM",
                        label: "Importe (crédito)"
                    });
                    if (account.includes("PAGOS EN EXCESO")) {
                        let index = collection.findIndex(data => data.account.includes("PAGOS EN EXCESO"));
                        if (index == -1) {
                            collection.push({ "account": account, "credit": Number(creditAmount), "debit": Number(debitAmount) });    
                        } else {
                            collection[index].account = "9242-002-000-000 PAGOS EN EXCESO";
                            collection[index].credit = Number((collection[index].credit + Number(creditAmount)).toFixed(2));
                            collection[index].debit = Number((collection[index].debit + Number(debitAmount)).toFixed(2));
                        }
                    } else {
                        collection.push({ "account": account, "credit": Number(creditAmount), "debit": Number(debitAmount) });
                    }

                    return true;
                });
                return collection;
            } catch (error) {
                log.error("Error find collection per day", error);
                response.info.push(error.message);
            }
        }

        function searchCollectionPerFolio(data, response) {
            try {
                let collection = [];
                search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                    filters:
                        [
                            ["account", "anyof", "451"],
                            "AND",
                            ["trandate", "after", "29/12/2023"],
                            "AND",
                            ["memomain", "isnot", "VOID"],
                            "AND",
                            ["custcol_folio_texto_conauto", "startswith", data.folio]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "line.cseg_folio_conauto",
                                summary: "GROUP",
                                label: "Folio"
                            }),
                            search.createColumn({
                                name: "class",
                                summary: "GROUP",
                                label: "Clase"
                            }),
                            search.createColumn({
                                name: "entity",
                                summary: "MAX",
                                label: "Nombre"
                            }),
                            search.createColumn({
                                name: "account",
                                summary: "MIN",
                                label: "Cuenta"
                            }),
                            search.createColumn({
                                name: "line.cseg_grupo_conauto",
                                summary: "MAX",
                                label: "Grupo"
                            }),
                            search.createColumn({
                                name: "custcol_imr_conauto_integrante",
                                summary: "MAX",
                                label: "Integrante"
                            }),
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Importe"
                            }),
                            search.createColumn({
                                name: "memo",
                                summary: "MAX",
                                label: "Nota"
                            }),
                            search.createColumn({
                                name: "tranid",
                                summary: "MAX",
                                label: "Documento"
                            })
                        ]
                }).run().each((result) => {
                    let concept = result.getText({
                        name: "class",
                        summary: "GROUP",
                        label: "Clase"
                    });
                    let customer = result.getValue({
                        name: "entity",
                        summary: "MAX",
                        label: "Nombre"
                    });
                    let group = result.getValue({
                        name: "line.cseg_grupo_conauto",
                        summary: "MAX",
                        label: "Grupo"
                    });
                    let integrante = result.getValue({
                        name: "custcol_imr_conauto_integrante",
                        summary: "MAX",
                        label: "Integrante"
                    });
                    let amount = result.getValue({
                        name: "amount",
                        summary: "SUM",
                        label: "Importe"
                    });
                    collection.push({
                        "concept": concept,
                        "customer": customer,
                        "group": group,
                        "integrante": integrante,
                        "amount": Number(amount),
                    });
                    return true;
                });
                return collection;
            } catch (error) {
                log.error("Error find collection per folio", error);
                response.info.push(error.message);
            }
        }

        function searchFolioDetail(data, response) {
            try {
                let collection = {}
                search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
                    filters:
                        [
                            [["memo", "contains", "Cobranza PRIMERAS CUOTAS de la referencia%"], "OR", ["memo", "contains", "identificacion de la cobranza Recibida de la referencia %"], "OR", ["memo", "contains", "Disminución de la cartera por la cobranza recibida de la referencia %"], "OR", ["memo", "contains", "Cobranza Recibida en Sistema de Comercialización de la referencia %"], "OR", ["memo", "contains", "Cuenta por pagar a proveedores por cobranza%"], "OR", ["memo", "contains", "DISMINUCION DE SEGURO AUTO POR APLICACIÓN DE LA COBRANZA DE LA REFERENCIA%"], "OR", ["memo", "contains", "Pago no identificado de la referencia%"], "OR", ["memo", "contains", "Pago identificado de la referencia %"]],
                            "AND",
                            ["account", "anyof", "2644", "453", "463", "467", "484", "485", "486", "490", "2014"],
                            "AND",
                            ["trandate", "within", data.fechaInicio, data.fechaFin]
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
                    let account = result.getText({
                        name: "account",
                        summary: "GROUP",
                        label: "Cuenta"
                    });
                    let debitAmount = result.getValue({
                        name: "debitamount",
                        summary: "SUM",
                        label: "Importe (débito)"
                    });
                    let creditAmount = result.getValue({
                        name: "creditamount",
                        summary: "SUM",
                        label: "Importe (crédito)"
                    });
                    collection[account] = { "credit": Number(creditAmount), "debit": Number(debitAmount) };
                    return true;
                });
                return collection;
            } catch (error) {
                log.error("Error find collection per day", error);
                response.info.push(error.message);
            }
        }

        function getReferencesBetweenDates(data) {
            let references = [];
            let startDate = data.fechaInicio.split("/");
            let endDate = data.fechaFinal.split("/");

            startDate = new Date(`${startDate[1]}/${startDate[0]}/${startDate[2]}`);
            endDate = new Date(`${endDate[1]}/${endDate[0]}/${endDate[2]}`);
            do {
                const month = startDate.getUTCMonth() + 1; // months from 1-12
                const day = startDate.getUTCDate();
                const year = startDate.getUTCFullYear();
                const pMonth = month.toString().padStart(2, "0");
                const pDay = day.toString().padStart(2, "0");
                const newPaddedDate = `${pDay}${pMonth}${year}`;
                references.push(["custcol_referencia_conauto", "contains", `%${newPaddedDate}`], "OR");
                startDate.setDate(startDate.getDate() + 1)
            } while (Date.parse(startDate) <= Date.parse(endDate));

            return references;
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

        return { post: postRequest }

    });
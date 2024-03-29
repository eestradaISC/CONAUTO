/**
 * @author Ashanty Uh Canul ashanty.uh@99minutos.com
 * @Modificacion <>
 * @Name con_mr_delete_records.js
 * @description Map Reduce para generar la factura consolidada
 * @file <URL PENDIENTE>
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/file', 'N/runtime', 'N/search', 'N/error', 'N/format', 'N/email', 'N/https', 'N/transaction'],
    /**
    * @param {record} record
    * @param {file} file
    * @param {runtime} runtime
    * @param {error} error
    * @param {format} format
    * @param {email} email
    */
    (record, file, runtime, search, error, format, email, https, transacion) => {
        let total_eliminados = 0;

        let name_type = {
            "Venta en efectivo": "cashsale",
            "Factura de venta": "invoice",
            "Entrada de enajenación de activos fijos": "customtransaction_fam_disp_jrn",
            "Entrada de depreciación de activos fijos": "customtransaction_fam_depr_jrn",
            "Asiento": "journalentry",
            "Pago": "customerpayment"
        };

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
            let result = [];
            let searchResult;
            try {
                let scriptObj = runtime.getCurrentScript();
                let startData = scriptObj.getParameter({ name: 'custscript_con_inicio_borrado' });
                let endData = scriptObj.getParameter({ name: 'custscript_con_final_borrado' });
                let transObjSearch = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "Custom108", "Custom110", "Journal", "SysJrnl", "CustInvc", "CashSale", "CustPymt"],
                            "AND",
                            ["trandate", "within", "01/07/2023", "30/11/2023"],
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "ID interno"
                            }),
                            search.createColumn({
                                name: "type",
                                summary: "GROUP",
                                label: "Tipo"
                            })
                        ]
                });
                let searchResultCount = transObjSearch.runPaged().count;
                log.audit("Total de ", searchResultCount)
                if (searchResultCount > 0) {
                    searchResult = transObjSearch.run().getRange({
                        start: startData,
                        end: endData
                    });
                }
                for (const resultS of searchResult) {
                    let id = resultS.getValue({
                        name: "internalid",
                        summary: "GROUP",
                        label: "ID interno"
                    });
                    let typeTran = resultS.getText({
                        name: "type",
                        summary: "GROUP",
                        label: "Tipo"
                    });
                    result.push({ id: id, typeTran: name_type[typeTran] });
                }
                return { 'values': result }
            } catch (error) {
                log.error('ERROR', error);
            }
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
            let request = JSON.parse(mapContext.value);
            // log.audit('request - Map', JSON.stringify(request));
            try {
                for (let r in request) {
                    // log.audit('Map65 - ', JSON.stringify({ key: r, value: request[r] }));
                    mapContext.write({
                        key: r,
                        value: request[r]
                    });
                }
            } catch (error) {
                log.error('ERROR', error);
            }
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

            let request = JSON.parse(reduceContext.values);
            request = request instanceof Array ? request[0] : request;

            try {
                let recordToDelete = record.delete({
                    type: request.typeTran,
                    id: request.id,
                });
                total_eliminados++
                log.debug("Eliminado #", total_eliminados)
                log.debug("recordToDelete", recordToDelete)
            } catch (error) {
                log.audit('reduce55', error);
            }
        }


        return { getInputData, map, reduce }

    });
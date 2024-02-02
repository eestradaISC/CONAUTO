/**
* @author Erick Estrada
* @Name 
* @description Script para eliminación
* @NApiVersion 2.1
* @NScriptType ScheduledScript
*/
define(["N/search", "N/record", "N/runtime", "N/file"], function (search, record, runtime, file) {

    function execute(context) {
        let scriptObj = runtime.getCurrentScript();
        let startData = scriptObj.getParameter({ name: 'custscript_con_sc_rango_inicial' });
        let endData = scriptObj.getParameter({ name: 'custscript_con_sc_rango_final' });
        let logErrors = file.load({
            id: `/SuiteScripts/Netsuite-Conauto/lib/errores_delete/${scriptObj.deploymentId}.txt`
        });
        let invoiceSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["type", "anyof", "Journal"],
                    "AND",
                    ["mainline", "is", "T"], "AND",
                    ["datecreated", "within", "01/07/2022 12:00 am", "31/12/2022 11:59 pm"]

                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        label: "ID interno"
                    }),
                    search.createColumn({
                        name: "recordtype",
                        sort: search.Sort.DESC,
                        label: "Tipo de registro"
                    })
                ]
        });
        let searchResultCount = invoiceSearchObj.runPaged().count;
        logErrors.appendLine({
            value: `INICIO LOG --- Total: ${searchResultCount} | De ${startData} a ${endData} | Fecha: ${Date().toLocaleString("es-MX", { timeZone: "America/Chihuahua" })}`
        });
        log.debug("TOTAL REGISTROS ENCONTRADOS", searchResultCount);
        let searchResults = invoiceSearchObj.run().getRange({
            start: startData,
            end: endData// El número máximo de registros que deseas procesar a la vez
        });
        if (searchResultCount > 0) {
            let timeOut = new Date();
            let milliseconds = 60000;
            timeOut.setMilliseconds(timeOut.getMilliseconds() + milliseconds);
            while (new Date() < timeOut) {
            }
            try {
                for (const result of searchResults) {
                    try {
                        let recordId = result.getValue({
                            "name": "internalid",
                        });
                        let recordType = result.getValue({
                            "name": "recordtype"
                        });
                        // AGREGAR LA ACCIÓN DEL DELETE

                        record.delete({
                            type: recordType,
                            id: recordId,
                        });
                        log.debug(`TYPE: ${recordType} ID: ${recordId} DELETE`);
                    } catch (e) {
                        logErrors.appendLine({
                            value: `\n\t ${result.getValue({
                                "name": "recordtype"
                            })} Fallo de eliminación del registro ${result.getValue({
                                "name": "internalid",
                            })}: ${e.message}`
                        });
                    }
                }
            } catch (err) {
                log.error({
                    title: "ERROR",
                    details: err
                })
                logErrors.appendLine({
                    value: `\n\t ERROR: ${err.message}`
                });
            }
        } else {
            logErrors.appendLine({
                value: `\n\t No hay resultado en la búsqueda`
            });
        }
        logErrors.appendLine({
            value: `\nFINAL LOG\n\n`
        });
        logErrors.save();
    }

    return {
        execute: execute
    }
});
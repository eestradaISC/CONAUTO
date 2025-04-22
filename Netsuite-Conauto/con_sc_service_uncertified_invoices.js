/**
* @author Erick Raul Estrada Acosta eestradaa@conauto.com.mx
* @Modificacion <>
* @Name con_sc_service_netsuite_conauto.js
* @description Servicio que obtiene la informaicón de las facturas no timbradas y las envia a un servicio externo
* @NApiVersion 2.1
* @NScriptType ScheduledScript
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
    'N/https',
    'N/record',
    'N/runtime',
    '/SuiteScripts/Conauto_Preferences.js',
    'IMR/IMRSearch',
    'N/error',
    "/SuiteScripts/con_lib_service_netsuite.js"
], (https, record,
    runtime,
    conautoPreferences,
    search,
    error,
    lib_conauto) => {

    const execute = (context) => {
        let scriptObj = runtime.getCurrentScript();
        let logId = scriptObj.getParameter({
            name: 'custscript_log_con'
        });
        let result = [];
        let startData = 0;
        let endData = 1000;
        let searchResult;

        let cashsaleSearchObj = search.create({
            type: "cashsale",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }, { "name": "includeperiodendtransactions", "value": "F" }],
            filters:
                [
                    ["mainline", "is", "T"],
                    "AND",
                    ["custbody_fe_sf_mensaje_respuesta", "doesnotcontain", "Timbrado exitoso."],
                    "AND",
                    ["type", "anyof", "CashSale"],
                    "AND",
                    ["formulatext: CASE WHEN {custbody_imr_fe_cancelado} = 'T' AND {custbody_fe_sf_mensaje_respuesta} NOT LIKE '%Timbrado exitoso.%' THEN 'Cumple' ELSE 'No cumple' END", "is", "No cumple"]
                ],
            columns:
                [
                    search.createColumn({ name: "trandate", label: "Fecha" }),
                    search.createColumn({ name: "entity", label: "Nombre" }),
                    search.createColumn({ name: "custentity_razon_social", join: "customer", label: "Razón social" }),
                    search.createColumn({ name: "custentity_imr_rfc_operacion", join: "customer", label: "RFC operación" }),
                    search.createColumn({ name: "vatregnumber", join: "customer", label: "Número de impuesto" }),
                    search.createColumn({ name: "custentity_imr_fe40_regimenfiscal", join: "customer", label: "Regimen Fiscal" }),
                    search.createColumn({ name: "custentity_uso_cfdi", join: "customer", label: "Uso CFDI" }),
                    search.createColumn({ name: "isperson", join: "customer", label: "Es individual" }),
                    search.createColumn({ name: "cseg_folio_conauto", label: "Folio Conauto" }),
                    search.createColumn({ name: "currency", label: "Moneda" }),
                    search.createColumn({ name: "custbody_fe_sf_mensaje_respuesta", label: "Mensaje de Respuesta" }),
                    search.createColumn({ name: "internalid", label: "ID interno" }),
                    search.createColumn({ name: "zipcode", join: "customer", label: "Código postal de facturación" })
                ]
        });
        let searchResultCount = cashsaleSearchObj.runPaged().count;
        if (searchResultCount > 0) {
            searchResult = cashsaleSearchObj.run().getRange({
                start: startData,
                end: endData
            });
        }
        for (const resultS of searchResult) {
            let data = {
                "folio": resultS.getValue({ name: "cseg_folio_conauto" }),
                "error": resultS.getValue({ name: "custbody_fe_sf_mensaje_respuesta" }),
                "idFactura": resultS.id,
                "fecha": resultS.getValue({ name: "trandate" }),
                "idCliente": resultS.getValue({ name: "entity" }),
                "regimen": resultS.getValue({ name: "custentity_imr_fe40_regimenfiscal", join: "customer" }),
                "cp": resultS.getValue({ name: "zipcode", join: "customer" }),
                "usoCFDI": resultS.getValue({ name: "custentity_uso_cfdi", join: "customer" }),
                "nombre": resultS.getValue({ name: "custentity_razon_social", join: "customer" }),
                "esPersona": resultS.getValue({ name: "isperson", join: "customer" })
            }
            log.audit("DATA", data);
            // https.post({
            //     body: data,
            //     url: ,
            //     credentials: string[],
            //     headers: Object
            // })
        }
        if (logId) {
            record.submitFields({
                type: 'customrecord_log_service_conauto',
                id: logId,
                values: {
                    custrecord_log_serv_processed: true,
                }
            });
        }

    }

    return {
        execute: execute
    }
});

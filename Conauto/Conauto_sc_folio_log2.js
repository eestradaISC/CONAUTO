/**
* @author Ashanty Uh Canul
* @description Script para actualizar el historial de folios
* @NApiVersion 2.x
* @NScriptType ScheduledScript
*/
define(['N/search', 'N/record',"N/runtime","N/file"], function (search, record, runtime, file) {

    function execute(conext) {
        var customrecord_services_log_requestSearchObj = search.create({
            type: "customrecord_log_conauto_request",
            filters:
            [
                ["custrecord_log_reqconauto_success","is","T"], 
                "AND", 
                ["custrecord_log_reqconauto_type","is","TraspasosEntreContratos"], 
                "AND", 
                ["custrecord_temp","is","F"]
            ],
            columns:
            [
               search.createColumn({
                  name: "internalid",
                  label: "ID"
               }),
               search.createColumn({name: "custrecord_log_reqconauto_type", label: "Type"}),
               search.createColumn({name: "custrecord_log_reqconauto_request", label: "Request"}),
               search.createColumn({name: "custrecord_log_reqconauto_response", label: "Response"}),
               search.createColumn({name: "custrecord_log_reqconauto_success", label: "Success"}),
               search.createColumn({name: "custrecord_log_reqconauto_processed", label: "Processed"}),
               search.createColumn({name: "custrecord_log_reqconauto_transaccions", label: "Transaccións"}),
               search.createColumn({name: "custrecord_log_reqconauto_error", label: "Error"})
            ]
        });
        var searchResultCount = customrecord_services_log_requestSearchObj.runPaged().count;
        log.debug("TOTAL RECORDS ENCONTRADOS",searchResultCount);
        if (searchResultCount > 0) {
            customrecord_services_log_requestSearchObj.run().each(function (result) {
                try {
                    var id = result.getValue({
                        "name": "internalid"
                    });
                    var errorR = result.getValue({
                        "name": "custrecord_log_reqconauto_error"
                    });
                    var requestFile = getRequestLog(id);
                    //var pagosArray = requestFile.pagos;
                    var folio = (requestFile.folio).toString();
                    var logRecord = record.load({
                        id: id,
                        type: 'customrecord_log_conauto_request'
                    });
                    // logRecord.setText({
                    //     fieldId: 'custrecord_log_reqconauto_folio',
                    //     text: folio
                    // });
                    if(!errorR){
                        logRecord.setText({
                            fieldId: 'custrecord_log_reqconauto_error',
                            text: 'FOLIO INVÁLIDO, NO SE ENCUENTRA REGISTRADO: '+folio
                        });
                    }
                    logRecord.setValue({
                        fieldId: 'custrecord_temp',
                        value: true
                    });
                    logRecord.save({
                        ignoreMandatoryFields: true
                    });
                    log.debug("Record con id "+id+"OK");                
                } catch (error) {
                    log.debug("Fallo en el id "+id+" : ", error);
                }
                return true;
            });
        } else {
            log.error({ title: "ERROR", details: "NO SE ENCONTRARON RECORDS"})
        }
    }

    function getRequestLog(logId) {
        var log = record.load({
            id: logId,
            type: 'customrecord_log_conauto_request'
        });
        var requestFileId = log.getValue({
            fieldId: 'custrecord_log_reqconauto_request'
        });
        var request = file.load({
            id: requestFileId
        });
        return JSON.parse(request.getContents());
    }

    return {
        execute: execute
    }
});

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
      ["created","within","23/02/2023 12:00 am","23/03/2023 11:59 pm"],
      "AND",
      ["custrecord_log_reqconauto_type","contains","Quebranto"]

   ],
   columns:
   [
           search.createColumn({name: "internalid", label: "Id Notificacion"})
,
      search.createColumn({name: "custrecord_log_reqconauto_idnot", label: "Id Notificacion"})
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
                    var requestFile = getRequestLog(id);
                  log.debug("requestFile",requestFile);
                    //var pagosArray = requestFile.pagos;
                  if(requestFile.idNotificacion) {
                     	var idNotificacion = requestFile.idNotificacion;
                    	var logRecord = record.load({
                        	id: id,
                        	type: 'customrecord_log_conauto_request'
                    	});
                    logRecord.setValue({
                        fieldId: 'custrecord_log_reqconauto_idnot',
                        value: idNotificacion
                    });
                  
                   
                    // logRecord.setText({
                    //     fieldId: 'custrecord_log_reqconauto_folio',
                    //     text: folio
                    // });
                    //logRecord.setText({
                      //  fieldId: 'custrecord_log_reqconauto_error',
                        //text: 'FOLIO INVÁLIDO, NO SE ENCUENTRA REGISTRADO'
                    //});
                    logRecord.setValue({
                        fieldId: 'custrecord_temp',
                        value: true
                    });
                    logRecord.save();
                    log.debug("Record con id "+id+"OK idNotificacion"+idNotificacion);                

                  }
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

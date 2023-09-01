/**
 * @Name con_rl_service_netsuite_folios_journals.js
 * @author Ashanty Uh
 * @description Restlet to change folios of Journal Entrys
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define([
    "N/record",
    "N/error",
    "N/search",
  ], function (
    record, 
    error, 
    search) {
        function postRequest(request) {
            let response = {code: 300, info: []};
            try {
                let data = request || {};
                let operations = {
                    'PasteFolioJournal' : pasteFolioJournal,
                }
                let callback = operations[data.tipo];
                if (callback) {
                    try {
                        callback(data, response);
                    } catch (e) {
                        response.code = 400;
                        response.info.push('ERROR POST REQUEST: ' + e.toString());
                    }
                } else {
                    response = {code: 404, info: ['OPERACIÓN ' + data.tipo + ' INVÁLIDA']};
                }
                successRequest(response);
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR POST REQUEST: ' + e.toString());
            }
            return response;
        }


    function pasteFolioJournal(data, response) {
        let movimientos = data.movimientos;
        if(movimientos.length > 0){
            for (let x = 0; x < movimientos.length; x++) {
                let dataLine = movimientos[x];
                let document = dataLine.document.replace('DC', '');
                let importLine = dataLine.import;
                let folio = dataLine.folio;
                let dataJournal = extractJournalEntries(document);
                let journalentry = record.load({
                    type: record.Type.JOURNAL_ENTRY,
                    id: dataJournal[0].id,
                });
                let lines = journalentry.getLineCount({ sublistId: "line" });
                for (let i = 0; i < lines; i++) {
                    let debitImport = journalentry.getSublistValue({
                        sublistId: "line",
                        fieldId: "debit",
                        line: i,
                    });
                    let creditImport = journalentry.getSublistValue({
                        sublistId: "line",
                        fieldId: "credit",
                        line: i,
                    });
                    if (debitImport === importLine || creditImport === creditImport) {
                        journalentry.setSublistText({
                            sublistId: "line",
                            fieldId: "cseg_folio_conauto",
                            line: i,
                            text: folio,
                        });
                    }
                }
                journalentry.save();
            }
        } else {
            response.code = 400;
            response.info.push('NO SE ENCONTRARON MOVIMIENTOS A REGISTRAR EN LA PETICIÓN');
            handlerErrorLogRequest('NO SE ENCONTRARON MOVIMIENTOS A REGISTRAR EN LA PETICIÓN', logId);
        }
    }
  
  
    function extractJournalEntries(document) {
      try {
        var journalObj = search.create({
            type: search.Type.JOURNAL_ENTRY,
            filters: [
                ["type","anyof","Journal"], 
                "AND", 
                ["mainline","is","T"], 
                "AND", 
                ["number","equalto",document]
            ],
            columns: [
                search.createColumn({
                   name: "tranid",
                   summary: "GROUP",
                   label: "Número de documento"
                }),
                search.createColumn({
                   name: "internalid",
                   summary: "MAX",
                   label: "ID interno"
                }),
                search.createColumn({
                    name: "trandate",
                    summary: "GROUP",
                    label: "Fecha"
                }),
                search.createColumn({
                    name: "line.cseg_folio_conauto",
                    summary: "MAX",
                    label: "Folio"
                }),
                search.createColumn({
                    name: "custrecord_cliente_integrante",
                    join: "line.cseg_folio_conauto",
                    summary: "MAX",
                    label: "Cliente/Integrante"
                 })
            ],
            });
  
        let data = [];
  
        journalObj.run().each(function (result) {
          data.push({
            id: result.getValue({
              name: "internalid",
              summary: "MAX",
              label: "ID interno",
            }),
            document: result.getValue({
              name: "tranid",
              summary: "GROUP",
              label: "Número de documento",
            }),
            date: result.getValue({
              name: "trandate",
              summary: "GROUP",
              label: "Fecha",
            }),
            cliente: result.getValue({
                name: "custrecord_cliente_integrante",
                join: "line.cseg_folio_conauto",
                summary: "MAX",
                label: "Cliente/Integrante",
              }),
          });
          return true;
        });
        log.debug({
          title: "DATA",
          details: data,
        });
        return data;
      } catch (e) {
        log.error("ERROR EN LA EXTRACCION DE ENTRADAS DE DIARIO", e);
      }
    }

    function successRequest(response) {
        if (response.code == 300) {
            response.code = 200;
            response.info.push('Petición Exitosa');
        }
    }
  
    function sendError(name, message) {
      throw error.create({ name: name, message: message });
    }
  
    return { post: postRequest }
  });
  
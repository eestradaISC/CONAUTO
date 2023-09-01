/**
* @NApiVersion 2.x
* @NScriptType ScheduledScript
*/
define(['N/search', 'N/record',"N/runtime"], function (search, record, runtime) {
    var folios = [
        307683,
        240814,
        240815,
        303061,
        303062,
        303063,
        303064,
        303065,
        303066,
        303067,
        303068,
        240917,
        303052,
        303050
   ]

    function execute(conext) {
        var customrecord_cseg_folio_conautoSearchObj = search.create({
            type: "customrecord_cseg_folio_conauto",
            filters:
            [
                ["internalid","anyof",folios]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "ID interno"}),
                search.createColumn({name: "externalid", label: "ID externo"}),
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Nombre"
                }),
                search.createColumn({name: "custrecord_folio_sustitucion", label: "Folio sustitucion"}),
                search.createColumn({name: "custrecord_grupo", label: "Grupo"}),
                search.createColumn({name: "custrecord_folio_estado", label: "Estado"}),
                search.createColumn({name: "custrecord_folio_subestatus", label: "Subestado"})
            ]
        });
        var searchResultCount = customrecord_cseg_folio_conautoSearchObj.runPaged().count;
        log.debug("TOTAL FOLIOS ENCONTRADOS",searchResultCount);
        if (searchResultCount > 0) {
            customrecord_cseg_folio_conautoSearchObj.run().each(function (result) {
                try {
                    var internalId = result.getValue({
                        "name": "internalid"
                    });
                    var name = result.getValue({
                        "name": "name"
                    });
                    var folioRecord = record.submitFields({
                        type: 'customrecord_cseg_folio_conauto',
                        id: internalId,
                        values: {
                            'externalid': name
                        }
                    });
                    log.debug("Folio con id "+folioRecord+" actualizado : ", name);                
                } catch (error) {
                    log.error("Fallo de actualización con id "+folioRecord+" : ", error);
                    log.error(error.stack);
                }
                return true;
            });
        } else {
            log.error({ title: "ERROR", details: "NO SE ENCONTRARON FOLIOS"})
        }
    }

    return {
        execute: execute
    }
});

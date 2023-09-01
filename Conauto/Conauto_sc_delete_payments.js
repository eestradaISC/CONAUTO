/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record',"N/runtime"], function (search, record, runtime) {

    function execute(context) {
        var pagos = [
            349308,
            349407,
            349408,
            349309,
            349310,
            349409,
            349311,
            349410,
            349312,
            349411,
            349313,
            349412,
            349314,
            349413,
            349315,
            349414,
            349316,
            349415,
            349317,
            349416,
            349318,
            349417,
            349319,
            349418,
            349419,
            349320,
            349420,
            349321,
            349421,
            349322,
            349422,
            349323,
            349423,
            349324,
            349424,
            349325,
            349425,
            349326,
            349426,
            349327,
            349427,
            349328,
            349428,
            349329,
            349330,
            349429,
            349331,
            349430,
            349431,
            349332,
            349432,
            349333,
            349433,
            349334,
            349335,
            349434,
            349336,
            349435,
            349337,
            349436,
            349338,
            349437,
            349339,
            349438,
            349340,
            349439,
            349341,
            349342,
            349440,
            349343,
            349441,
            349344,
            349442,
            349345,
            349346,
            349347,
            349443,
            349348,
            349444,
            349349,
            349350,
            349445,
            349351,
            349446,
            349352,
            349447,
            349353,
            349448,
            349354,
            349449,
            349355,
            349356,
            349357,
            349458,
            349459,
            349460,
            349461,
            349462,
            349463,
            349464,
            349465,
            349466
        ]
        var customrecord_imr_pagos_amortizacionSearchObj = search.create({
            type: "customrecord_imr_pagos_amortizacion",
            filters:
            [
               ["internalid","anyof",pagos]
            ],
            columns:
            [
                search.createColumn({
                    name: "scriptid",
                    sort: search.Sort.ASC,
                    label: "ID de script"
                }),
                search.createColumn({name: "custrecord_imr_pa_grupo", label: "Grupo"}),
                search.createColumn({name: "custrecord_imr_pa_integrante", label: "Integrante"}),
                search.createColumn({name: "custrecord_imr_pa_folio", label: "Folio"}),
                search.createColumn({name: "custrecord_imr_pa_referencia_completa", label: "Referencia "}),
                search.createColumn({name: "custrecord_imr_pa_referencia", label: "Referencia banco"}),
                search.createColumn({name: "custrecord_imr_pa_fecha", label: "Fecha Cobranza"}),
                search.createColumn({name: "custrecord_imr_pa_importe", label: "Importe"}),
                search.createColumn({name: "custrecord_imr_pa_forma_pago", label: "Forma de pago"}),
                search.createColumn({name: "custrecord_imr_pa_diario", label: "Diario"}),
                search.createColumn({name: "custrecord_imr_pa_diario_cxp", label: "Diario CXP"}),
                search.createColumn({name: "custrecord_imr_pa_factura", label: "Factura"}),
                search.createColumn({name: "custrecord_imr_pa_diario_no_iden", label: "Diario no identificado"}),
                search.createColumn({name: "custrecord_imr_pa_aplicado", label: "Aplicado"}),
                search.createColumn({name: "custrecord_imr_pa_grupo_liquidado", label: "Grupo liquidado"}),
                search.createColumn({name: "custrecord_imr_pa_diario_cancelacion", label: "Diario cancelacion"}),
                search.createColumn({name: "custrecord__imr_pa_diario_seg_auto", label: "Diario Seguro Auto"}),
                search.createColumn({name: "custrecord_imr_pa_diario_cartera", label: "Dario de cartera"}),
                search.createColumn({name: "externalid", label: "ID externo"})
            ]
        });
        var searchResultCount = customrecord_imr_pagos_amortizacionSearchObj.runPaged().count;
        log.debug("TOTAL PAGOS ENCONTRADOS",searchResultCount);
        if (searchResultCount > 0) {
            customrecord_imr_pagos_amortizacionSearchObj.run().each(function (result) {
                try {
                    var payment = result.getValue({
                        "name": "internalid",
                    });
                    var diary = result.getValue({
                        "name": "custrecord_imr_pa_diario",
                    }) || 0;
                    var diarycxp = result.getValue({
                        "name": "custrecord_imr_pa_diario_cxp",
                    }) || 0;
                    var invoice = result.getValue({
                        "name": "custrecord_imr_pa_factura"
                    }) || 0;
                    var diaryNoIdentify = result.getValue({
                        "name": "custrecord_imr_pa_diario_no_iden",
                    }) || 0;
                    var diaryCancel = result.getValue({
                        "name": "custrecord_imr_pa_diario_cancelacion",
                    }) || 0;
                    var diarySeguro = result.getValue({
                        "name": "custrecord__imr_pa_diario_seg_auto",
                    }) || 0;
                    var diaryCartera = result.getValue({
                        "name": "custrecord_imr_pa_diario_cartera",
                    }) || 0;
                    try {
                        if(diary != 0) {
                            var diaryRecord = record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: diary,
                            });
                            log.debug({ title: "Diario eliminado", details: "<b>REGISTRO DIARY ELIMINADO-></b>" + diaryRecord + "<b>; CON ID-></b" +diary });
                        }
                        if(diarycxp != 0) {
                            var diarycxpRecord = record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: diarycxp,
                            });
                            log.debug({ title: "Diario eliminado",details: "<b>REGISTRO DIARYCXP ELIMINADO-></b>" + diarycxpRecord + "<b>; CON ID-></b" +diarycxp });
                        }
                        if(invoice != 0) {
                            var invoiceRecord = record.delete({
                                type: record.Type.CASH_SALE,
                                id: invoice,
                            });
                            log.debug({ title: "Factura eliminado",details: "<b>REGISTRO FACTURA ELIMINADO-></b>" + invoiceRecord + "<b>; CON ID-></b" +invoice });
                        }
                        if(diaryNoIdentify != 0) {
                            var diaryNoIdentifyRecord = record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: diaryNoIdentify,
                            });
                            log.debug({ title: "Diario eliminado",details: "<b>REGISTRO DIARIO NO IDENTIFICADO ELIMINADO-></b>" + diaryNoIdentifyRecord + "<b>; CON ID-></b" +diaryNoIdentify });
                        }
                        if(diaryCancel != 0) {
                            var diaryCancelRecord = record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: diaryCancel,
                            });
                            log.debug({ title: "Diario eliminado",details: "<b>REGISTRO DIARIO DE CANCELACIÓN ELIMINADO-></b>" + diaryCancelRecord + "<b>; CON ID-></b" +diaryCancel });
                        }
                        if(diarySeguro != 0) {
                            var diarySeguroRecord = record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: diarySeguro,
                            });
                            log.debug({ title: "Diario eliminado",details: "<b>REGISTRO DIARIO SEGURO ELIMINADO-></b>" + diarySeguroRecord + "<b>; CON ID-></b" +diarySeguro });
                        }
                        if(diaryCartera != 0) {
                            var diaryCarteraRecord = record.delete({
                                type: record.Type.JOURNAL_ENTRY,
                                id: diaryCartera,
                            });
                            log.debug({ title: "Diario eliminado",details: "<b>REGISTRO DIARIO CARTERA ELIMINADO-></b>" + diaryCarteraRecord + "<b>; CON ID-></b" +diaryCartera });
                        }
                    } catch (error) {
                        log.debug("Fallo de eliminacion : "+error);
                        log.error(error.stack);
                    }
                } catch (error) {
                    log.debug("Fallo de eliminacion : "+error);
                    log.error(error.stack);
                }
                return true;
            });
        } else {
            log.debug({ title: "ERROR", details: "No hay articulos en la busqueda"})
        }

    }

    

    return {
        execute: execute
    }
});

/**
* @author Ashanty Uh Canul ashanty.uh@99minutos.com
* @Name nm_sc_upd_uuid.js
* @description Script para la actualización de información de uuid de facturas
* @NApiVersion 2.x
* @NScriptType ScheduledScript
*/
define(['N/search', 'N/record',"N/runtime"], function (search, record, runtime) {

    function execute(conext) {
        var ids = [
            755978,
            769571,
            875274,
            910473,
            948862,
            953501,
            959497,
            959995,
            974829,
            997446,
            997452,
            997454,
            997455,
            997456,
            997458,
            997460,
            997461,
            997465,
            997466,
            997467,
            997468,
            997592,
            1004293,
            1004318,
            1006637,
            1006638,
            1006639,
            1006640,
            1006641,
            1015536,
            1052858,
            1061321,
            1061960,
            1062777,
            1062778,
            1062779,
            1062780,
            1062781,
            1062783,
            1062787,
            1062788,
            1062789,
            1062790,
            1062791,
            1062792,
            1062793,
            1062795,
            1062796,
            1064313,
            1064675,
            1065498,
            1068489,
            1069186,
            1070253,
            1074630,
            1074806,
            1074954,
            1074955,
            1074956,
            1074957,
            1076199,
            1076693,
            1077413,
            1077414,
            1077419,
            1077420,
            1081083,
            1081084,
            1083304,
            1086866,
            1092767,
            1102681,
            1106578,
            1108012,
            1108979,
            1109879,
            1110067,
            1110068,
            1110565,
            1113141,
            1113156,
            1113157,
            1115510,
            1115757,
            1116167,
            1116915,
            1117114,
            1117158,
            1117362,
            1117468,
            1117495,
            1117508,
            1117519,
            1117770,
            1117776,
            1117844,
            1118283,
            1118445,
            1118499,
            1118508,
            1118509,
            1118797,
            1118807,
            1118850,
            1118867,
            1119075,
            1119076,
            1119193,
            1119331,
            1119589,
            1119606,
            1119607,
            1122215,
            1124342,
            1124343,
            1124569,
            1124573,
            1124577,
            1124716,
            1124731,
            1124732,
            1124733,
            1124734,
            1124756,
            1124757,
            1124758,
            1124765,
            1124777,
            1124778,
            1124779,
            1124825,
            1124829,
            1124830,
            1124831,
            1124835,
            1124836,
            1124837,
            1124838,
            1124844,
            1124845,
            1124846,
            1124847,
            1124848,
            1124849,
            1124850,
            1124852,
            1124853,
            1125933,
            1125946,
            1126113,
            1126179,
            1126250,
            1126251,
            1126757,
            1126762,
            1126766,
            1126770,
            1126771,
            1126772,
            1126778,
            1126779,
            1127724,
            1127730,
            1127731,
            1127732,
            1127733,
            1127734,
            1127735,
            1127736,
            1128516,
            1128708,
            1128752,
            1128864,
            1130795,
            1131239,
            1132739,
            1132740,
            1133802,
            1134890,
            1134895,
            1134896,
            1135106,
            1135875,
            1137612,
            1137613,
            1137614,
            1139279,
            1139575,
            1139680,
            1139990,
            1141498,
            1141499,
            1141504,
            1144117,
            1144121,
            1144122,
            1144123,
            1144124,
            1146732,
            1146801,
            1146802,
            1146804,
            1146806,
            1146817,
            1146818,
            1146820,
            1149003,
            1150029,
            1158769,
            1159987,
            1161183,
            1161806,
            1161857,
            1164171,
            1164172,
            1171848,
            1171861,
            1171888,
            1171895,
            1172896,
            1174110,
            1174343,
            1176015,
            1176115,
            1176772,
            1177341,
            1179828,
            1179837,
            1181009,
            1181010,
            1184527,
            1184643,
            1184652,
            1184661,
            1184779,
            1184780,
            1185554
        ]
        var journalentrySearchObj = search.create({
            type: "journalentry",
            filters:
            [
               ["type","anyof","Journal"], 
               "AND", 
               ["internalid","is",ids], 
               "AND", 
               ["mainline","is","T"], 
               "AND", 
               ["memo","contains","Pago no identificado de la referencia"]
            ],
            columns:
            [
               search.createColumn({
                  name: "internalid",
                  summary: "GROUP",
                  label: "ID interno"
               }),
               search.createColumn({
                  name: "tranid",
                  summary: "MAX",
                  label: "Número de documento"
               }),
               search.createColumn({
                  name: "trandate",
                  summary: "MAX",
                  label: "Fecha"
               }),
               search.createColumn({
                  name: "line.cseg_folio_conauto",
                  summary: "MAX",
                  label: "Folio"
               }),
               search.createColumn({
                  name: "custcol_folio_texto_conauto",
                  summary: "MAX",
                  label: "Folio Texto"
               }),
               search.createColumn({
                  name: "memo",
                  summary: "MAX",
                  label: "Nota"
               })
            ]
         });
        var searchResultCount = journalentrySearchObj.runPaged().count;
        log.debug("journalentrySearchObj result count",searchResultCount);
        if (searchResultCount > 0) {
            journalentrySearchObj.run().each(function(result){
                try {
                    var id = result.getValue({
                        "name": "internalid",
                        "summary": "GROUP"
                    });
                    log.debug("id", id);
                    var objRecord = record.load({
                        type: record.Type.JOURNAL_ENTRY,
                        id: id,
                        isDynamic: false,
                    });
                    var lines = objRecord.getLineCount({ sublistId: 'line' });
                    for (var x = 0; x < lines; x++) {
                        var folioText = objRecord.getSublistText({
                            sublistId: 'line',
                            fieldId: 'custcol_folio_texto_conauto',
                            line: x
                        });

                        log.debug("folioText", folioText);
                        // var lineNum = objRecord.selectLine({
                        //     sublistId: 'line',
                        //     line: x
                        // });
                        // objRecord.setCurrentSublistValue({
                        //     sublistId: 'line',
                        //     fieldId: 'line.cseg_folio_conauto',
                        //     value: folioText,
                        //     ignoreFieldChange: true
                        // });
                        // objRecord.commitLine({
                        //     sublistId: 'line'
                        // });
                        objRecord.setSublistText({
                            sublistId: 'line',
                            fieldId: 'cseg_folio_conauto',
                            line: x,
                            text: folioText
                        });
                    }
                    objRecord.save();
                } catch (error) {
                    log.debug("Fallo de actualización : ",error);
                    log.error("error", error.stack);
                }
                return true;
            });
        }
    }

    return {
        execute: execute
    }
});
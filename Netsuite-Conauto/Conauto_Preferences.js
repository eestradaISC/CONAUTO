/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
 * @NModuleScope public
 */
define(["IMR/IMRSearch","N/record"],
    /***
     *
     * @param {IMRSearch} search
     * @param {record} record
     */
    function (search,record) {
        function conautoPreferences() {
            var self = this;
            self.get = function(){
                var data = {};
                search.searchAllRecords({
                    type:"customrecord_config_conauto",
                    columns:[
                        search.createColumn({
                            name:"custrecord_conf_conauto_clave"
                        }),
                        search.createColumn({
                            name:"custrecord_conf_conauto_referencia"
                        }),
                        search.createColumn({
                            name:"custrecord_conf_conauto_valor"
                        }),
                    ],
                    data:data,
                    callback:function(result,data){
                        var key = result.getValue({
                            name:"custrecord_conf_conauto_clave"
                        });
                        var reference = result.getValue({
                            name:"custrecord_conf_conauto_referencia"
                        })||'';
                        var value = result.getValue({
                            name:"custrecord_conf_conauto_valor"
                        });
                        data[key] = data[key]||{};
                        data[key][reference] = value;
                    }
                })
                return new preferences(data);
            }
            self.setFolioConauto = function(recordId){
                
                var dataTransaccion = search.lookupFieldsIMR({
                    type:search.main().Type.TRANSACTION,
                    id:recordId,
                    columns:["custbody_imr_tippolcon","subsidiary","recordtype"]
                });
                log.error({
                  title:"dataTransaccion",
                  details:JSON.stringify(dataTransaccion)
                })
                if(dataTransaccion.custbody_imr_tippolcon.value && dataTransaccion.subsidiary.value){
                    for(var i=0;i<5;i++){
                        var dataConf = search.searchAllRecords({
                            type:"customrecord_imr_conf_folio_conauto",
                            filters:[
                                search.createFilter({
                                    name:"custrecord_imr_conf_subsidiaria",
                                    operator:search.main().Operator.ANYOF,
                                    values:[dataTransaccion.subsidiary.value]
                                }),
                                search.createFilter({
                                    name:"custrecord_imr_conf_tipo_poliza",
                                    operator:search.main().Operator.ANYOF,
                                    values:[dataTransaccion.custbody_imr_tippolcon.value]
                                })
                            ],
                            columns:[
                                search.createColumn({name:"internalid"}),
                                search.createColumn({name:"custrecord_imr_conf_num_dig"}),
                                search.createColumn({name:"custrecord_imr_conf_indice"}),
                                search.createColumn({name:"custrecord_imr_conf_nomenclatura"}),
                            ]
                        });
                        log.error({
                          title:"dataConf",
                          details:dataConf.length
                        })
                        if(dataConf.length>0){
                            var idConf = dataConf[0].getValue({name:"internalid"});
                            var indice = parseFloat(dataConf[0].getValue({name:"custrecord_imr_conf_indice"}));
                            var numdigitos = parseFloat(dataConf[0].getValue({name:"custrecord_imr_conf_num_dig"}))||0;
                            var nomclatura = dataConf[0].getValue({name:"custrecord_imr_conf_nomenclatura"})||'';
                            log.error({
                              title:"datos",
                              details:"indice: "+indice+" numdigitos: "+numdigitos+" nomclatura"+nomclatura+" idConf:"+idConf
                            })
                            nomclatura = nomclatura.toUpperCase();
                            indice     = indice.toFixed(0);
                            var numdigitosFolio = numdigitos-indice.length;
                            numdigitosFolio = numdigitosFolio>0?numdigitosFolio:0;
                            var repeatZero = '';
                            for(var r=0;r<numdigitosFolio;r++){
                              repeatZero+= '0';
                            }
                            var folioTranConauto = nomclatura+repeatZero+indice;
                            log.error({
                              title:"numdigitosFolio",
                              details:numdigitosFolio
                            })
                            log.error({
                              title:"folioTranConauto",
                              details:folioTranConauto
                            })
                            record.submitFields({
                                type:dataTransaccion.recordtype.value,
                                id:recordId,
                                values:{
                                    tranid:folioTranConauto
                                }
                            });
                            var resultRepeat = search.searchAllRecords({
                                type:search.main().Type.TRANSACTION,
                                columns:[search.createColumn({
                                    name:"tranid",
                                    summary:search.main().Summary.GROUP
                                }),search.createColumn({
                                    name:"internalid",
                                    summary:search.main().Summary.COUNT
                                })],
                                filters:[
                                    search.createFilter({
                                        name:"mainline",
                                        operator:search.main().Operator.IS,
                                        values:["T"]
                                    }),
                                    search.createFilter({
                                        name:"tranid",
                                        operator:search.main().Operator.IS,
                                        values:[folioTranConauto]
                                    }),
                                ]
                            });
                            var count = resultRepeat.length>0?parseFloat(resultRepeat[0].getValue({
                                    name:"internalid",
                                    summary:search.main().Summary.COUNT
                                })):0;
                            log.error({
                              title:"count",
                              details:count
                            })
                            if(count<2){
                                record.submitFields({
                                    type:"customrecord_imr_conf_folio_conauto",
                                    id:idConf,
                                    values:{
                                        custrecord_imr_conf_indice:++indice
                                    }
                                });
                                break;
                            }
                        }else{
                            break;
                        }
                    }
                }
            }
            function preferences(data){
                this.data = data;
                /***
                 * @param {Object} options
                 * @param {String} options.key clave de la preferencia
                 * @param {String} options.reference en caso de tener varias configuraciones con la misma llave es necesario especificar la referencia
                 */
                this.getPreference = function(options){
                    var preference = null;
                    options.reference = options.reference||'';
                    var preferencesKey = (this.data||{})[options.key]||{};
                    preference  = preferencesKey[options.reference]||null;
                    return preference;
                }
            }

        }

        return new conautoPreferences();
    });

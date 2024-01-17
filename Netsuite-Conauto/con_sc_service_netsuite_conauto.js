/**
* @author Ashanty Uh Canul 
* @Modificacion <>
* @Name con_sc_service_netsuite_conauto.js
* @description Servicio de proceso entre Progress y Netsuite
* @file <URL PENDIENTE>
* @NApiVersion 2.1
* @NScriptType ScheduledScript
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
        'N/record',
        'N/runtime',
        '/SuiteScripts/Conauto_Preferences.js',
        'IMR/IMRSearch',
        'N/error',
        "/SuiteScripts/NetSuite-Conauto/lib/con_lib_service_netsuite.js"
],
        function (
                record,
                runtime,
                conautoPreferences,
                search,
                error,
                lib_conauto) {
                let exports = {};
                /**
         * <code>execute</code> event handler
         *
         * @gov XXX
         *
         * @param context
         *        {Object}
         * @param context.type
         *        {InvocationTypes} Enumeration that holds the string values for
         *            scheduled script execution contexts
         *
         * @return {void}
         *
         * @static
         * @function execute
         */
                function execute(context) {
                        let scriptObj = runtime.getCurrentScript();
                        let logId = scriptObj.getParameter({
                                name: 'custscript_log_service_id'
                        });
                        let resultados = {
                                recordType: '',
                                transactions: [],
                                records: [],
                                solPagos: [],
                                folios: [],
                                errors: []
                        };
                        try {
                                let request = lib_conauto.getRequestLog(logId);

                                let operations = {
                                        'ActualizaContrato': actualizaContrato,
                                        'InteresesMoratorios': interesesMoratorios,
                                        'PolizaIntegrantes': polizaIntegrantes,
                                        'ReservaPasivo': reservaPasivo, // Poliza de Adjudicados
                                        'Bajas': bajaFolio,
                                        'ModificacionBajas': modificacionBajas,
                                        'ComplementoBajas': complementoBajas,
                                        'CambiarEstatus': cambiarEstatus,
                                        'ReclasificacionPrimeraCuota': reclasificacionPrimeraCuota,
                                        'PagoUnidad': pagoUnidad,
                                }
                                let callback = operations[request.tipo];
                                log.debug('callback', callback);
                                if (callback) {
                                        resultados = callback(request, logId) || [];
                                        record.submitFields({
                                                type: 'customrecord_log_service_conauto',
                                                id: logId,
                                                values: {
                                                        custrecord_log_serv_processed: true,
                                                        custrecord_log_serv_recordtype: resultados.recordType,
                                                        custrecord_log_serv_transactions: resultados.transactions,
                                                        custrecord_log_serv_solpagos: resultados.solPagos,
                                                        custrecord_log_serv_record_ids: resultados.records.join(','),
                                                        custrecord_log_serv_folio: resultados.folios,
                                                        custrecord_log_serv_error: (resultados.errors || []).join('\n')
                                                }
                                        });
                                } else {
                                        throw error.create({
                                                name: 'NOT_SUPPORTED_OPERATION',
                                                message: 'OPERACIÓN INVÁLIDA: ' + request.tipo
                                        });
                                }
                        } catch (e) {
                                if (logId) {
                                        log.error({
                                                title: 'ERROR',
                                                details: 'Log id: ' + logId + ' ERROR: ' + e.toString()
                                        });
                                        record.submitFields({
                                                type: 'customrecord_log_service_conauto',
                                                id: logId,
                                                values: {
                                                        custrecord_log_serv_error: e.message.toString()
                                                }
                                        })
                                }
                        }
                }

                /**
                * @param {Object} data
                * @param {String} data.tipo 
                * @param {String} data.idNotificacion 
                * @param {String} data.tipo  tipo de request
                * @param {String} data.folio  folio a actualizar
                * @param {String} data.integrante  numero de integrante
                * @param {String} data.bid  Id de progress del proveedor
                * @param {String} data.distribuidora  nombre de la distribuidora del contrato
                * @param {String} data.catalogoAuto  nombre del catalogo del auto
                * @param {String} data.descripcionAuto  descripcion del catalogo del auto
                * @param {String} data.precio  precio del auto
                * @param {String} data.lista  numero de lista del auto
                * @param {String} data.fechaContrato  fecha del contrato
                * @param {String} data.uso  descripcion del uso
                * @param {String} data.rfcVendedor  rfc del Vendedor
                * @param {String} data.nombreVendedor  nombre del vendedor
                * @param {String} data.vendor vendedor
                * @param {String} data.fechaRecepcion  fecha de la recepcion
                * @param {String} data.beneficiario  beneficiario
                * @param {String} data.tipoPago  Tipo de pago
                * @param {String} data.pagoCon
                * @param {String} data.pagoBoleta pago de la boleta
                * @param {String} data.pda
                * @param {String} data.fechaPago fecha del pago
                * @param {String} data.estado  id del estado del folio
                * @param {String} data.subestado  id del subestado del folio
                * @param {String} data.fechaCesion  fecha de la cesion
                * @param {String} data.mesCesion  mes de la cesion
                * @param {Object} data.importe  
                * @param {Object} data.banco 
                * @param {Object} data.totalPagado 
                * @param {Object} data.cliente  datos del cliente
                * @param {boolean} data.cliente.esPersona  indica si es persona o empresa
                * @param {String} data.cliente.nombre  nombre del cliente
                * @param {String} data.cliente.apellidoPaterno apellido paterno del cliente en caso de ser persona
                * @param {String} data.cliente.apellidoMaterno apellido materno del cliente en caso de ser persona
                * @param {String} data.cliente.rfc rfc del cliente
                * @param {String} data.cliente.sexo sexo del cliente
                * @param {String} data.cliente.fechaNacimiento fecha de nacimiento
                * @param {String} data.cliente.curp curp del cliente
                * @param {String} data.cliente.estadoCivil estado civil del cliente
                * @param {String} data.cliente.telefono
                * @param {String} data.cliente.telefonoCasa
                * @param {String} data.cliente.celular
                * @param {String} data.cliente.correo
                * @param {String} data.cliente.rf-clave
                * @param {String} data.cliente.razon
                * @param {Object} data.cliente.direccion datos de la dirección
                * @param {Object} data.cliente.direccion.calle
                * @param {Object} data.cliente.direccion.numero
                * @param {Object} data.cliente.direccion.colonia
                * @param {Object} data.cliente.direccion.ciudad
                * @param {Object} data.cliente.direccion.estado
                * @param {Object} data.cliente.direccion.cp
                * @param {Object} data.cliente.direccion.municipio
                * @param {Object} data.grupo datos del grupo
                * @param {Object} data.grupo.id identificador del grupo llave unicia
                * @param {Object} data.grupo.nombre nombre para mostrar
                * @param {Object} data.grupo.tipo 
                * @param {Object} data.grupo.clavePlan
                * @param {Object} data.grupo.descripcionPlan
                * @param {Object} data.grupo.factorIntegrante
                * @param {Object} data.grupo.factorAdjudicado
                * @param {Object} data.grupo.plazo
                * @param {Object} data.grupo.inicioVigencia
                * @param {Object} data.grupo.finVigencia
                * @param {Object} data.grupo.clavePromocion
                * @param {Object} data.grupo.descripcionPromocion
                * @param {Object} response
                * @param {Number} response.code
                * @param {Array}  response.info
                */
                function actualizaContrato(data, response) {
                        let recordType = 'customrecord_cseg_folio_conauto';
                        let folioId = lib_conauto.recordFind(recordType, 'anyof', 'externalid', data.folio);
                        if (!folioId) {
                                folioId = lib_conauto.recordFind('customrecord_cseg_folio_conauto', 'is', 'name', data.folio);
                        }
                        if (folioId) {
                                let recordObj = record.load({
                                        type: recordType,
                                        id: folioId,
                                        isDynamic: true
                                });
                                if (recordObj.getValue('custrecord_folio_estado') == 1) {
                                        lib_conauto.setOpcionalData(recordObj, 2, 'custrecord_folio_estado'); // 2 Es el estado de Integrante
                                }
                                lib_conauto.setOpcionalData(recordObj, data.subestado, 'custrecord_folio_subestatus');
                                if (data.folioSustitucion) {
                                        data.folioSustitucion = lib_conauto.recordFind(recordType, 'anyof', 'externalid', data.folioSustitucion);
                                }
                                let mapsFieldsFolio = [
                                        {
                                                'field': 'folioSustitucion',
                                                'fieldRecord': 'custrecord_folio_sustitucion',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'bid',
                                                'fieldRecord': 'custrecord_imr_bid_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'distribuidora',
                                                'fieldRecord': 'custrecord_imr_distribuidora_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'catalogoAuto',
                                                'fieldRecord': 'custrecord_imr_catalogoauto_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'descripcionAuto',
                                                'fieldRecord': 'custrecord_imr_descripauto_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'precio',
                                                'fieldRecord': 'custrecord_imr_precio_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'lista',
                                                'fieldRecord': 'custrecord_imr_lista_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'fechaContrato',
                                                'fieldRecord': 'custrecord_imr_fechacontrato_conauto',
                                                'type': 'date'
                                        },
                                        {
                                                'field': 'uso',
                                                'fieldRecord': 'custrecordimr_uso_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'rfcVendedor',
                                                'fieldRecord': 'custrecord_imr_rfcvendedor_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'vendedor',
                                                'fieldRecord': 'custrecord_imr_nombrevende_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'fechaRecepcion',
                                                'fieldRecord': 'custrecord_imr_fecharecep_conauto',
                                                'type': 'date'
                                        },
                                        {
                                                'field': 'beneficiario',
                                                'fieldRecord': 'custrecord_imr_beneficiario_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'tipoPago',
                                                'fieldRecord': 'custrecord_imr_tipopago_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'pagoCon',
                                                'fieldRecord': 'custrecord_imr_pagocon_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'pagoBoleta',
                                                'fieldRecord': 'custrecord_imr_pagoconboleta_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'pda',
                                                'fieldRecord': 'custrecord_imr_pda_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'fechaPago',
                                                'fieldRecord': 'custrecord_imr_fechapagoinicialfolio_con',
                                                'type': 'date'
                                        },
                                        {
                                                'field': 'importe',
                                                'fieldRecord': 'custrecord_imr_importe_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'banco',
                                                'fieldRecord': 'custrecord_imr_banco_conauto',
                                                'type': 'text'
                                        },
                                        {
                                                'field': 'totalPagado',
                                                'fieldRecord': 'custrecord_imr_totalpagado_conauto',
                                                'type': 'number'
                                        },
                                        {
                                                'field': 'integrante',
                                                'fieldRecord': 'custrecord_imr_integrante_conauto',
                                                'type': 'text'
                                        }
                                ]
                                lib_conauto.setDataRecord(mapsFieldsFolio, data, recordObj);
                                if (data.cliente) {
                                        let customerId = lib_conauto.recordFind('customer', 'is', 'custentity_imr_rfc_operacion', data.cliente.rfc);
                                        let customerObj = null;
                                        let preferences = conautoPreferences.get();
                                        log.debug('customerId', customerId);
                                        if (customerId) {
                                                customerObj = record.load({
                                                        type: 'customer',
                                                        id: customerId,
                                                        isDynamic: true
                                                })
                                        } else {
                                                customerObj = record.create({
                                                        type: 'customer',
                                                        isDynamic: true
                                                });
                                                let subsidiary = preferences.getPreference({
                                                        key: 'SUBCONAUTO'
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'subsidiary',
                                                        value: subsidiary
                                                });
                                        }
                                        if (data.cliente.esPersona) {
                                                customerObj.setValue({
                                                        fieldId: 'isperson',
                                                        value: 'T'
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'firstname',
                                                        value: data.cliente.nombre
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'lastname',
                                                        value: (data.cliente.apellidoMaterno) ? `${data.cliente.apellidoPaterno} ${data.cliente.apellidoMaterno}` : data.cliente.apellidoPaterno
                                                });
                                        } else {
                                                customerObj.setValue({
                                                        fieldId: 'isperson',
                                                        value: 'F'
                                                });
                                                customerObj.setValue({
                                                        fieldId: 'companyname',
                                                        value: data.cliente.nombre
                                                });
                                        }
                                        let mapsFieldsClient = [
                                                {
                                                        'field': 'rfc',
                                                        'fieldRecord': 'custentity_imr_rfc_operacion',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'razon',
                                                        'fieldRecord': 'custentity_razon_social',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'rf-clave',
                                                        'fieldRecord': 'custentity_imr_fe40_regimenfiscal',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'usoCfdi',
                                                        'fieldRecord': 'custentity_uso_cfdi',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'tipo',
                                                        'fieldRecord': 'custentity_imr_tipocliente',
                                                        'type': 'boolean'
                                                },
                                                {
                                                        'field': 'sexo',
                                                        'fieldRecord': 'custentity_imr_sexoconauto',
                                                        'type': 'boolean'
                                                },
                                                {
                                                        'field': 'fechaNacimiento',
                                                        'fieldRecord': 'custentity_imr_fechanacconauto',
                                                        'type': 'date'
                                                },
                                                {
                                                        'field': 'curp',
                                                        'fieldRecord': 'custentity_imr_curpconauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'estadoCivil',
                                                        'fieldRecord': 'custentity_imr_edocivilconauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'telefono',
                                                        'fieldRecord': 'phone',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'telefonoCasa',
                                                        'fieldRecord': 'altphone',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'celular',
                                                        'fieldRecord': 'mobilephone',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'correo',
                                                        'fieldRecord': 'email',
                                                        'type': 'text'
                                                }
                                        ]
                                        let listCfdis = lib_conauto.getCFDIs();
                                        data.cliente.usoCfdi = listCfdis[data.cliente.usoCfdi];
                                        data.cliente.correo = data.cliente.correo.replace("Ñ", "L");
                                        lib_conauto.setDataRecord(mapsFieldsClient, data.cliente, customerObj);
                                        customerObj.setValue({
                                                fieldId: 'vatregnumber',
                                                value: data.cliente.rfc
                                        }); //L.R.M.R. 29/09/2021
                                        if (data.cliente.direccion) {
                                                let countLine = customerObj.getLineCount({
                                                        sublistId: 'addressbook'
                                                });
                                                log.error({
                                                        title: 'countLine',
                                                        details: countLine
                                                });
                                                if (countLine == 0) {
                                                        customerObj.selectNewLine({
                                                                sublistId: 'addressbook'
                                                        });
                                                } else {
                                                        customerObj.selectLine({
                                                                sublistId: 'addressbook',
                                                                line: 1
                                                        })
                                                }
                                                customerObj.setCurrentSublistValue({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'defaultshipping',
                                                        value: true
                                                });
                                                customerObj.setCurrentSublistValue({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'defaultbilling',
                                                        value: true
                                                });
                                                let addressObj = customerObj.getCurrentSublistSubrecord({
                                                        sublistId: 'addressbook',
                                                        fieldId: 'addressbookaddress'
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'country',
                                                        value: 'MX'
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'addr1',
                                                        value: data.cliente.direccion.calle
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'addr2',
                                                        value: data.cliente.direccion.colonia
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'addr3',
                                                        value: data.cliente.direccion.municipio || ''
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'state',
                                                        value: data.cliente.direccion.estado
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'city',
                                                        value: data.cliente.direccion.ciudad
                                                });
                                                addressObj.setValue({
                                                        fieldId: 'zip',
                                                        value: data.cliente.direccion.cp
                                                });
                                                customerObj.commitLine({
                                                        sublistId: 'addressbook'
                                                });
                                        }
                                        customerId = customerObj.save({
                                                ignoreMandatoryFields: true
                                        });
                                        recordObj.setValue({
                                                fieldId: 'custrecord_cliente_integrante',
                                                value: customerId
                                        });
                                }
                                if (data.grupo) {
                                        let grupoId = lib_conauto.recordFind('customrecord_cseg_grupo_conauto', 'anyof', 'externalid', data.grupo.id);
                                        if (grupoId === '' || grupoId === null) {
                                                grupoId = lib_conauto.recordFind('customrecord_cseg_grupo_conauto', 'is', 'name', data.grupo.nombre);
                                        }
                                        let grupoObj = null;
                                        log.debug('grupoId', grupoId);
                                        if (grupoId) {
                                                grupoObj = record.load({
                                                        type: 'customrecord_cseg_grupo_conauto',
                                                        id: grupoId,
                                                        isDynamic: true
                                                })
                                        } else {
                                                grupoObj = record.create({
                                                        type: 'customrecord_cseg_grupo_conauto',
                                                        isDynamic: true
                                                });
                                                grupoObj.setValue({
                                                        fieldId: 'externalid',
                                                        value: data.grupo.id
                                                });
                                        }
                                        let mapsFieldGrupo = [
                                                {
                                                        'field': 'nombre',
                                                        'fieldRecord': 'name',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'tipo',
                                                        'fieldRecord': 'custrecord_imr_tipoplan_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'clavePlan',
                                                        'fieldRecord': 'custrecord_imr_claveplan_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'descripcionPlan',
                                                        'fieldRecord': 'custrecord_imr_descipplan_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'factorIntegrante',
                                                        'fieldRecord': 'custrecord_imr_factorint_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'factorAdjudicado',
                                                        'fieldRecord': 'custrecord_imr_factoradju_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'plazo',
                                                        'fieldRecord': 'custrecord_imr_plazo_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'incioVigencia',
                                                        'fieldRecord': 'custrecord_imr_inivig_conauto',
                                                        'type': 'date'
                                                },
                                                {
                                                        'field': 'finVigencia',
                                                        'fieldRecord': 'custrecord_imr_finvig_conauto',
                                                        'type': 'date'
                                                },
                                                {
                                                        'field': 'clavePromocion',
                                                        'fieldRecord': 'custrecord_imr_clavepromo_conauto',
                                                        'type': 'text'
                                                },
                                                {
                                                        'field': 'descripcionPromocion',
                                                        'fieldRecord': 'custrecord_imr_descpromo_conauto',
                                                        'type': 'text'
                                                }
                                        ];
                                        lib_conauto.setDataRecord(mapsFieldGrupo, data.grupo, grupoObj);
                                        grupoId = grupoObj.save({
                                                ignoreMandatoryFields: true
                                        });
                                        recordObj.setValue({
                                                fieldId: 'custrecord_grupo',
                                                value: grupoId
                                        })
                                }
                                folioId = recordObj.save({
                                        ignoreMandatoryFields: true
                                });
                        }
                        return {
                                recordType: recordType,
                                transactions: [],
                                records: [folioId],
                                solPagos: [],
                                folios: [folioId]
                        };
                }

                /***
                *
                * @param {Object} data
                * @param {String} data.fecha fecha del calculo del interes
                * @param {Number} data.monto montot total del interes
                * @param {Number} logId
                */
                function interesesMoratorios(data, logId) {
                        let recordType = "customrecord_imr_intereses_moratorios";
                        let recordsId = [];
                        let recordObj = record.create({
                                type: recordType,
                                isDynamic: true
                        });
                        recordObj.setValue({
                                fieldId: "custrecord_imr_intmo_fecha",
                                value: lib_conauto.getValueFormat("date", data.fecha)
                        });
                        recordObj.setValue({
                                fieldId: "custrecord_imr_intmo_monto_interes",
                                value: lib_conauto.getValueFormat("number", data.monto)
                        });
                        recordObj.setValue({
                                fieldId: "custrecord_imr_logid_conauto20",
                                value: logId
                        })
                        recordsId.push(recordObj.save({
                                ignoreMandatoryFields: true
                        }));

                        let interesMoratorioData = record.load({
                                type: recordType,
                                id: recordsId[0],
                                isDynamic: true
                        })

                        return {
                                recordType: recordType,
                                transactions: [interesMoratorioData.getValue('custrecord_imr_intmo_transaccion')],
                                records: recordsId,
                                solPagos: [],
                                folios: []
                        }
                }

                /***
                 *
                 * @param {Object} data
                 * @param {Number} data.totalPagado monto de pago
                 * @param {String} data.fecha fecha de contabilización
                 */
                function polizaIntegrantes(data, response) {
                        let recordType = "customrecord_imr_poliza_integrantes";
                        let recordsId = [];
                        let mapsReclasificacionPago = [
                                {
                                        type: "text",
                                        field: "totalPagado",
                                        fieldRecord: "custrecord_imr_polint_total_pagar"
                                },
                                {
                                        type: "date",
                                        field: "fecha",
                                        fieldRecord: "custrecord_imr_polint_fecha"
                                }
                        ];
                        let recordObj = record.create({
                                type: recordType,
                                isDynamic: true
                        });


                        lib_conauto.setDataRecord(mapsReclasificacionPago, data, recordObj);
                        recordsId.push(recordObj.save({
                                ignoreMandatoryFields: true
                        }))
                        let polizaIntegrantesData = record.load({
                                type: recordType,
                                id: recordsId[0],
                                isDynamic: true
                        });
                        return {
                                recordType: recordType,
                                transactions: [polizaIntegrantesData.getValue('custrecord_imr_polint_transaccion')],
                                records: recordsId,
                                solPagos: [],
                                folios: []
                        };
                }

                function reservaPasivo(data, logId) {
                        const recordType = "customrecord_imr_poliza_adjudicados";
                        let recordsId = [];
                        let mapsReinstalacionClientes = [
                                {
                                        type: "number",
                                        field: "monto",
                                        fieldRecord: "custrecord_imr_padj_monto"
                                }, {
                                        type: "date",
                                        field: "fecha",
                                        fieldRecord: "custrecord_imr_padj_fecha"
                                }
                        ];
                        const recordObj = record.create({ type: recordType, isDynamic: true });
                        lib_conauto.setDataRecord(mapsReinstalacionClientes, data, recordObj);
                        recordsId.push(recordObj.save({ ignoreMandatoryFields: true }));

                        let reservaPasivoData = record.load({
                                type: recordType,
                                id: recordsId[0],
                                isDynamic: true
                        })

                        return {
                                recordType: recordType,
                                transactions: [reservaPasivoData.getValue('custrecord_imr_padj_diario')],
                                records: recordsId,
                                solPagos: [],
                                folios: []
                        };
                }

                function bajaFolio(data, logId) {
                        let recordType = "customrecord_imr_baja_folio";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];

                        let folioId = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                        if (folioId) {
                                folios.push(folioId);
                                data.folioId = folioId;
                                let recordObj = record.create({
                                        type: recordType,
                                        isDynamic: true
                                });
                                let fields = [
                                        {
                                                type: "text",
                                                field: "folioId",
                                                fieldRecord: "custrecord_imr_bafo_folio"
                                        },
                                        {
                                                type: "text",
                                                field: "estatus",
                                                fieldRecord: "custrecord_imr_bafo_estatus"
                                        },
                                        {
                                                type: "text",
                                                field: "tipoPago",
                                                fieldRecord: "custrecord_imr_bafo_tipo_pago"
                                        },
                                        {
                                                type: "text",
                                                field: "mes",
                                                fieldRecord: "custrecord_imr_bafo_mes"
                                        },
                                        {
                                                type: "number",
                                                field: "montoPenalizacion",
                                                fieldRecord: "custrecord_imr_bafo_monto_pena"
                                        },
                                        {
                                                type: "number",
                                                field: "montoPagar",
                                                fieldRecord: "custrecord_imr_bafo_monto_pagar"
                                        }
                                ];
                                for (let field of fields) {
                                        let value = data[field.field]
                                        recordObj.setValue({
                                                fieldId: field.fieldRecord,
                                                value: value
                                        });
                                };

                                recordsId.push(recordObj.save({
                                        ignoreMandatoryFields: true
                                }));

                                let bajaFolio = record.load({
                                        type: recordType,
                                        id: recordsId[0],
                                        isDynamic: true
                                })

                                transactions.push(bajaFolio.getValue("custrecord_imr_bafo_transaccion"))
                                transactions.push(bajaFolio.getValue("custrecord_imr_bafo_transaccion_2"))
                        } else {
                                throw error.create({
                                        name: "FOLIO_NOT_FOUND",
                                        message: "NO se encontro el folio: " + data.folio
                                })
                        }


                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }

                function modificacionBajas(data) {
                        const recordType = "customrecord_imr_modificacion_bajas";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];

                        let folioId = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                        if (folioId) {
                                folios.push(folioId);
                                data.folio = folioId;
                                let mapsReinstalacionClientes = [
                                        {
                                                type: "text",
                                                field: "folio",
                                                fieldRecord: "custrecord_imr_modbaja_folio"
                                        }, {
                                                type: "number",
                                                field: "saldoADevolver",
                                                fieldRecord: "custrecord_imr_modbaja_saldoadevolver"
                                        }, {
                                                type: "number",
                                                field: "penalizacion",
                                                fieldRecord: "custrecord_imr_modbaja_penalizacion"
                                        },
                                        {
                                                type: "text",
                                                field: "estado",
                                                fieldRecord: "custrecord_imr_modbaja_estatus_folio"
                                        }
                                ];
                                const recordObj = record.create({ type: recordType, isDynamic: true });
                                lib_conauto.setDataRecord(mapsReinstalacionClientes, data, recordObj);
                                recordsId.push(recordObj.save({ ignoreMandatoryFields: true }))

                                let modificacionFolio = record.load({
                                        type: recordType,
                                        id: recordsId[0],
                                        isDynamic: true
                                })

                                let FieldJournalEntries = ["custrecord_imr_modbaja_diario_rescinbaja", "custrecord_imr_modbaja_diario_rescaplica", "custrecord_imr_modbaja_diario_cancbaja"]
                                for (let fieldId of FieldJournalEntries) {
                                        transactions.push(modificacionFolio.getValue(fieldId))
                                }

                        } else {
                                throw error.create({ name: "FOLIO_NOT_FOUND", message: "NO se encontro el folio: " + data.folio })
                        }

                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }

                function complementoBajas(data) {
                        const recordType = "customrecord_imr_complemento_bajas";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];


                        let folioId = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);

                        if (folioId) {
                                folios.push(folioId);
                                data.folio = folioId;
                                let mapsReinstalacionClientes = [
                                        {
                                                type: "text",
                                                field: "folio",
                                                fieldRecord: "custrecord_imr_compbajas_folio"
                                        }, {
                                                type: "number",
                                                field: "saldoADevolver",
                                                fieldRecord: "custrecord_imr_compbajas_saldoadevolver"
                                        }, {
                                                type: "number",
                                                field: "penalizacion",
                                                fieldRecord: "custrecord_imr_compbajas_penalizacion"
                                        }, {
                                                type: "number",
                                                field: "originalPenalizacion",
                                                fieldRecord: "custrecord_imr_compbajas_pena_origen"
                                        }, {
                                                type: "number",
                                                field: "originalSaldoADevolver",
                                                fieldRecord: "custrecord_imr_compbajas_saldadev_origen"
                                        }, {
                                                type: "text",
                                                field: "tipoComplemento",
                                                fieldRecord: "custrecord_imr_tipo_complemento_bajas"
                                        }
                                ];
                                const recordObj = record.create({ type: recordType, isDynamic: true });
                                lib_conauto.setDataRecord(mapsReinstalacionClientes, data, recordObj);
                                recordsId.push(recordObj.save({ ignoreMandatoryFields: true }))

                                let complementosFolio = record.load({
                                        type: recordType,
                                        id: recordsId[0],
                                        isDynamic: true
                                })

                                let FieldJournalEntries = ["custrecord_imr_compbajas_diario_can_comp", "custrecord_imr_compbajas_diario_prov", "custrecord_imr_compbajas_diario_prov_pag"]
                                for (let fieldId of FieldJournalEntries) {
                                        transactions.push(complementosFolio.getValue(fieldId))
                                }

                        } else {
                                throw error.create({ name: "FOLIO_NOT_FOUND", message: "NO se encontro el folio: " + data.folio })
                        }
                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }



                /**
                *
                * @param {Object} data
                * @param {String} data.tipo  tipo de request
                * @param {Number} data.idNotificacion id de la cual proviene la petición
                * @param {String} data.folio  folio al cual se cambiara el estatus
                * @param {Number} data.estatus nuevo estatus
                * @param {String} data.subestatus  nuevo subestado del folio
                * @param {Object} response
                * @param {Number} response.code
                * @param {Array} response.info
                */
                function cambiarEstatus(data) {
                        const recordType = "customrecord_cseg_folio_conauto";
                        let recordsId = [];
                        let transactions = [];
                        let folios = [];


                        let folioId = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                        if (folioId) {
                                folios.push(folioId);
                                data.folio = folioId;
                                let mapsFolio = [
                                        {
                                                type: "number",
                                                field: "estatus",
                                                fieldRecord: "custrecord_folio_estado"
                                        }
                                ];

                                if (data?.subestatus || data?.subestatus == "") mapsFolio.push({
                                        type: "text",
                                        field: "subestatus",
                                        fieldRecord: "custrecord_folio_subestatus"
                                })

                                const recordObj = record.load({ type: recordType, id: folioId, isDynamic: true });
                                lib_conauto.setDataRecord(mapsFolio, data, recordObj);
                                recordsId.push(recordObj.save({ ignoreMandatoryFields: true }))
                        } else {
                                throw error.create({ name: "FOLIO_NOT_FOUND", message: "NO se encontro el folio: " + data.folio })
                        }
                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios
                        };
                }

                /**
                *
                * @param {Object} data
                * @param {String} data.tipo  tipo de request
                * @param {Number} data.idNotificacion id de la cual proviene la petición
                * @param {Object[]}  data.pagos  pagos a registrar
                * @param {String} data.pagos.folio  folio al cual se registrara el pago
                * @param {String} data.pagos.referencia  referencia del pago
                * @param {Date}   data.pagos.fecha  fecha de cobranza, fecha en que se esta ejecutando el proceso
                * @param {Array}  data.pagos.monto  monto
                * @param {String} data.pagos.grupo  grupo del cliente
                * @param {String} data.pagos.cliente  cliente
                * @param {String} data.pagos.formaPago  forma del pago
                * @param {Number} data.pagos.importe  importe total
                * @param {Number} data.pagos.totalPagado  total pagado
                * @param {Number} data.pagos.aportacion  reclasificación aportación
                * @param {Number} data.pagos.gastos  reclasificación gastos
                * @param {Number} data.pagos.iva  reclasificación iva
                * @param {Number} data.pagos.seguro_auto  reclasificación seguro de auto
                * @param {Number} data.pagos.seguro_vida  reclasificación seguro de vida
                * @param {Object} response
                * @param {Number} response.code
                * @param {Array}  response.info
                */
                function reclasificacionPrimeraCuota(data, response) {
                        let records = [];
                        let transactions = [];
                        let errors = [];
                        let folios = [];
                        let recordType = "transaction";

                        let payments = data.pagos || [];
                        if (payments.length == 0) {
                                throw error.create({
                                        name: "EMPTY_PAYMENT_LIST_FIRSTPAYMENT",
                                        message: "La lista de pagos esta vacia"
                                })
                        }
                        let mandatoryFields = ["fecha", "referencia", "folio", "grupo", "totalPagado", "cliente", "aportacion"];
                        let line = 0;
                        for (let payment of payments) {
                                line++;
                                lib_conauto.checkMandatoryFields(payment, mandatoryFields, line, errors);
                        }
                        if (errors.length == 0) {
                                for (let payment of payments) {
                                        log.error("ENTRA PAYMENT", payment)
                                        let folio = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", payment.folio);
                                        log.error("ENTRA PAYMENT", folio)
                                        if (!folio) continue;
                                        folios.push(folio);
                                        payment["folioId"] = folio;
                                        // FILL DATA
                                        let folioText = payment.folio;
                                        let referencia = payment.referencia;
                                        let formaPago = payment.formaPago == "0" ? "01" : payment.formaPago;
                                        let grupoId = lib_conauto.recordFind("customrecord_cseg_grupo_conauto", 'anyof', "externalid", payment.grupo);
                                        if (!grupoId) {
                                                errors.push(`El grupo del pago con la referencia ${referencia} y folio ${folioText} no existe, verifica el grupo ${payment.grupo}`)
                                                continue;
                                        };
                                        payment["grupoId"] = grupoId;
                                        let clienteInfo = search.lookupFields({
                                                id: folio,
                                                type: 'customrecord_cseg_folio_conauto',
                                                columns: ['custrecord_cliente_integrante', 'custrecord_imr_integrante_conauto']
                                        });
                                        log.error("CLIENTE INFO", clienteInfo)
                                        let cliente = clienteInfo.custrecord_cliente_integrante[0].value;
                                        payment["integrante"] = clienteInfo.custrecord_imr_integrante_conauto;
                                        payment.cliente = cliente;
                                        let montosReparto = {
                                                "gastos": parseFloat(payment.gastos) + parseFloat(payment.iva),
                                                "seguroVida": parseFloat(payment.seguro_vida),
                                                "seguroAuto": parseFloat(payment.seguro_auto),
                                                "aportacion": parseFloat(payment.aportacion)
                                        }
                                        let memo = `Identificacion de la cobranza Recibida de la referencia ${referencia} - Folio ${folioText} - Gpo ${payment.grupo} - Int${payment.integrante}`;
                                        // ----------------
                                        log.error("LLENA DATOS", montosReparto)
                                        let preferences = conautoPreferences.get();
                                        let cuentaCobranzaNoIden = preferences.getPreference({
                                                key: "CCNI"
                                        });
                                        let subsidiary = preferences.getPreference({
                                                key: "SUBCONAUTO"
                                        });
                                        let diarioObj = record.create({
                                                type: record.Type.JOURNAL_ENTRY,
                                                isDynamic: true
                                        });
                                        diarioObj.setValue({
                                                fieldId: "subsidiary",
                                                value: subsidiary
                                        });
                                        diarioObj.setValue({
                                                fieldId: "custbody_imr_tippolcon",
                                                value: 1
                                        });
                                        diarioObj.setValue({
                                                fieldId: "trandate",
                                                value: lib_conauto.stringToDateConauto(payment.fecha)
                                        });
                                        diarioObj.setValue({
                                                fieldId: "currency",
                                                value: 1
                                        });
                                        diarioObj.setValue({
                                                fieldId: "memo",
                                                value: memo
                                        });
                                        diarioObj.setValue({
                                                fieldId: "custbody_tipo_transaccion_conauto",
                                                value: 5
                                        });
                                        lib_conauto.addLineJournal(diarioObj, cuentaCobranzaNoIden, true, payment.importe.toFixed(2), {
                                                memo: memo,
                                                custcol_referencia_conauto: referencia,
                                                custcol_metodo_pago_conauto: formaPago,
                                                custcol_folio_texto_conauto: folioText,
                                                cseg_folio_conauto: folio,
                                                cseg_grupo_conauto: grupoId,
                                                entity: cliente,
                                                location: 6
                                        });
                                        log.error("EMPIEZA LA RECLASIFICACION")
                                        for (let concepto in montosReparto) {
                                                let importeConcepto = montosReparto[concepto] || 0;
                                                if (importeConcepto == 0) {
                                                        continue;
                                                }
                                                let CuentaConcepto = preferences.getPreference({
                                                        key: "CCP",
                                                        reference: concepto
                                                });
                                                let classId = preferences.getPreference({
                                                        key: "CLSP",
                                                        reference: concepto
                                                });
                                                if (concepto == 'gastos') {
                                                        let cuentaIVA = preferences.getPreference({
                                                                key: "CCP",
                                                                reference: 'iva'
                                                        });
                                                        lib_conauto.createJournalCXP(payment, preferences, transactions);
                                                        let importeGastoConIVA = montosReparto["gastos"];
                                                        lib_conauto.addLineJournal(diarioObj, CuentaConcepto, false, (importeGastoConIVA).toFixed(2), {
                                                                memo: memo,
                                                                custcol_referencia_conauto: referencia,
                                                                custcol_metodo_pago_conauto: formaPago,
                                                                custcol_folio_texto_conauto: folioText,
                                                                cseg_folio_conauto: folio,
                                                                cseg_grupo_conauto: grupoId,
                                                                class: classId,
                                                                entity: cliente,
                                                                location: 6
                                                        });
                                                } else {
                                                        log.audit("PAGO", { "Concepto": concepto, "Monto": importeConcepto })
                                                        lib_conauto.addLineJournal(diarioObj, CuentaConcepto, false, importeConcepto, {
                                                                memo: memo,
                                                                custcol_referencia_conauto: referencia,
                                                                custcol_metodo_pago_conauto: formaPago,
                                                                custcol_folio_texto_conauto: folioText,
                                                                cseg_folio_conauto: folio,
                                                                cseg_grupo_conauto: grupoId,
                                                                class: classId,
                                                                entity: cliente,
                                                                location: 6
                                                        });
                                                }
                                        }
                                        let idDiario = diarioObj.save({
                                                ignoreMandatoryFields: true
                                        });
                                        record.submitFields({
                                                type: 'customrecord_cseg_folio_conauto',
                                                id: folio,
                                                values: {
                                                        custrecord_rec_primer_pago: idDiario
                                                },
                                                options: {
                                                        ignoreMandatoryFields: true
                                                }
                                        });
                                        lib_conauto.createInvoice(payment, preferences, transactions)
                                        transactions.push(idDiario);
                                        conautoPreferences.setFolioConauto(idDiario);
                                }
                        } else {
                                log.error("DATA ERROR MMMM")
                                throw error.create({
                                        name: "DATA_ERROR_PAYMENTS",
                                        message: errors.join("\n")
                                })
                        }
                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: records,
                                solPagos: [],
                                folios: folios,
                                errors: errors
                        };
                }

                /***
                 *
                 * @param {Object} data
                 * @param {String} data.folio folio que afectara la boleta interna
                 * @param {String} data.folioFactura folio de la factura
                 * @param {Number} data.factura importe de la factura
                 * @param {Number} data.cartaCredito importe de carta de credito
                 * @param {Number} data.diferenciaCCVF diferencia
                 * @param {String} data.bid numero de proveedor
                 * @param {String} data.vehiculoEnt numero de vehiculo
                 * @param {Number} data.totalPagar importe a pagar
                 */
                function pagoUnidad(data) {
                        let recordType = "customrecord_imr_pago_unidad";
                        let recordsId = [];
                        let folios = [];
                        let transactions = [];
                        let folioId = "";
                        let errors = [];
                        try {
                                folioId = lib_conauto.recordFind("customrecord_cseg_folio_conauto", 'anyof', "externalid", data.folio);
                        } catch (e) {
                        }
                        if (folioId) {
                                folios.push(folioId)
                                data.folio = folioId;
                                let mapsFieldsSiniestroAuto = [
                                        {
                                                type: "text",
                                                field: "folio",
                                                fieldRecord: "custrecord_imr_pu_folio"
                                        },
                                        {
                                                type: "text",
                                                field: "folioFactura",
                                                fieldRecord: "custrecord_imr_pu_num_factura"
                                        },
                                        {
                                                type: "number",
                                                field: "factura",
                                                fieldRecord: "custrecord_imr_pu_factura"
                                        },
                                        {
                                                type: "number",
                                                field: "cartaCredito",
                                                fieldRecord: "custrecord_imr_pu_carta_credito"
                                        },
                                        {
                                                type: "number",
                                                field: "diferenciaCCVF",
                                                fieldRecord: "custrecord_imr_pu_dif_cc_vf"
                                        },
                                        {
                                                type: "text",
                                                field: "bid",
                                                fieldRecord: "custrecord_imr_pu_bid"
                                        },
                                        {
                                                type: "text",
                                                field: "vehiculoEnt",
                                                fieldRecord: "custrecord_imr_pu_vehiculo_ent"
                                        },
                                        {
                                                type: "text",
                                                field: "totalPagar",
                                                fieldRecord: "custrecord_imr_pu_total_pagar"
                                        },
                                        {
                                                type: "text",
                                                field: "descripcionVehEnt",
                                                fieldRecord: "custrecord_imr_pu_desc_vehiculo"
                                        },
                                        {
                                                type: "text",
                                                field: "domiciliado",
                                                fieldRecord: "custrecord_imr_pu_domiciliado"
                                        },
                                        {
                                                type: "text",
                                                field: "marcaVehiculo",
                                                fieldRecord: "custrecord_imr_pu_marca_vehiculo"
                                        },
                                        {
                                                type: "text",
                                                field: "linea",
                                                fieldRecord: "custrecord_imr_pu_linea"
                                        },
                                        {
                                                type: "text",
                                                field: "añoModelo",
                                                fieldRecord: "custrecord_imr_pu_ano_modelo"
                                        },
                                        {
                                                type: "text",
                                                field: "referencia",
                                                fieldRecord: "custrecord_imr_pu_referencia"
                                        }
                                ];
                                let recordObj = record.create({
                                        type: recordType,
                                        isDynamic: true
                                });
                                lib_conauto.setDataRecord(mapsFieldsSiniestroAuto, data, recordObj);
                                let pagoUnidadId = recordObj.save({
                                        ignoreMandatoryFields: true
                                })
                                record.submitFields({
                                        type: 'customrecord_cseg_folio_conauto',
                                        id: folioId,
                                        values: {
                                                custrecord_folio_estado: 4
                                        },
                                        options: {
                                                ignoreMandatoryFields: true
                                        }
                                });
                                recordsId.push(pagoUnidadId);
                                let pagoUnidadObj = record.load({
                                        type: recordType,
                                        id: pagoUnidadId,
                                        isDynamic: true
                                });

                                transactions.push(pagoUnidadObj.getValue("custrecord_imr_pu_transaccion"));
                        } else {
                                throw error.create({
                                        name: "FOLIO_NOT_FOUND",
                                        message: "NO se encontro el folio: " + data.folio
                                })
                        }
                        return {
                                recordType: recordType,
                                transactions: transactions,
                                records: recordsId,
                                solPagos: [],
                                folios: folios,
                                errors: errors
                        };
                }

                exports.execute = execute;
                return exports;
        });
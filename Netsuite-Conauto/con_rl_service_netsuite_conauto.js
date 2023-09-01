/**
* @author Ashanty Uh Canul 
* @Modificacion <>
* @Name con_rl_service_netsuite_conauto.js
* @description Servicio de conexión entre Progress y Netsuite
* @file <URL PENDIENTE>
* @NApiVersion 2.1
* @NScriptType Restlet
* @NAmdConfig /SuiteScripts/IMR_Modules_Libs_Config.json
*/
define([
    'N/record',
    'N/file',
    'IMR/IMRSearch',
    '/SuiteScripts/Conauto_Preferences.js',
    //'N/task', 
    //'SuiteScripts/scripts/Netsuite-Conauto/library/con_.js', 
    //'SuiteScripts/scripts/Netsuite-Conauto/library/con_.js',
    //'SuiteScripts/scripts/Netsuite-Conauto/library/con_.js'
],
    function (
        record,
        file,
        search,
        conautoPreferences,
        //task, 
        https) {

        /**
        * @param request
        *        {String|Object} The request body as a String when
        *            <code>Content-Type</code> is <code>text/plain</code>; The
        *            request body as an Object when request
        *            <code>Content-Type</code> is <code>application/json</code>
        *
        * @return {String|Object} Returns a String when request
        *         <code>Content-Type</code> is <code>text/plain</code>;
        *         returns an Object when request <code>Content-Type</code> is
        *         <code>application/json</code>
        *
        * @static
        * @function post
        */
        function postRequest(request) {
            let response = { code: 300, info: [] };
            try {
                let data = request || {};
                let operations = {
                    'PrimerasCuotasASH': primerasCuotas,
                    'SolicitudPago': solicitudPago,
                    'PolizaIntegrantes': polizaIntegrantes,
                    'ActualizaContrato': actualizaContrato,
                    'PagoUnidad': pagoUnidad,
                    'InteresesMoratorios': interesesMoratorios,
                    //'AplicacionCobranzaASH' : AplicacionCobranza,
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
                    response = { code: 404, info: ['OPERACIÓN ' + data.tipo + ' INVÁLIDA'] };
                }
                successRequest(response);
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR POST REQUEST: ' + e.toString());
            }
            return response;
        }

        /**
        * @param {Object} data
        * @param {String} data.tipo 
        * @param {String} data.idNotificacion 
        * @param {Array}  data.montoTotal 
        * @param {Array}  data.numerodeOperaciones
        * @param {Array}  data.pagos 
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        * 
        * 
        */
        function primerasCuotas(data, response) {
            let logId = null;
            let pagosInfo = data.pagos || [];
            logId = createLog(data, response);
            response.logId = logId;
            if (pagosInfo.length > 0) {
                //code
            } else {
                response.code = 400;
                response.info.push('NO SE ENCONTRARON PAGOS A REGISTRAR EN LA PETICIÓN');
                handlerErrorLogRequest('NO SE ENCONTRARON PAGOS A REGISTRAR EN LA PETICIÓN', logId);
            }
        }

        /**
        * @param {Object} data
        * @param {String} data.tipo 
        * @param {String} data.idNotificacion 
        * @param {Array}  data.detalles 
        * @param {Object} response
        * @param {Number} response.code
        * @param {Array}  response.info
        * 
        * 
        */
        function solicitudPago(data, response) {
            let logId = null;
            let detalles = data.detalles || [];
            logId = createLog(data, response);
            response.logId = logId;
            if (detalles.length > 0) {
                for (let i = 0; i < detalles.length; i++) {
                    let detalle = detalles[i];
                    let mandatoryFields = ['tipoMovimiento', 'monto', 'cuentaBancaria', 'beneficiario'];
                    checkMandatoryFields(detalle, mandatoryFields, response, i + 1);
                    if (detalle.banco && ['1', '18', '19', '20', '21', '22', '23', '24', '5', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '6', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '7', '2', '8', '9', '10', '11', '12', '13', '14', '3', '15', '54', '55', '56', '57', '58', '59', '60', '61', '62', '16', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '17', '4', '84', '85', '86'].indexOf(detalle.banco) == -1) {
                        response.code = 400;
                        response.info.push('ID DE BANCO NO VÁLIDO: ' + detalle.banco + ' - LÍNEA:' + i);
                    }
                    if (!util.isObject(detalle.beneficiario)) {
                        response.code = 400;
                        response.info.push('LA ESTRUCTURA DEL NODO BENEFICIARIO ESTA INCORRECTA - LÍNEA: ' + (i + 1));
                    } else if (detalle.beneficiario) {
                        let mandatoryFieldsBeneficiario = ['rfc', 'nombre'];
                        checkMandatoryFields(detalle.beneficiario, mandatoryFieldsBeneficiario, response, i + 1);
                    }
                }
            } else {
                response.code = 400;
                response.info.push('NO SE ENCONTRARON DETALLES EN LA PETICIÓN');
                handlerErrorLogRequest('NO SE ENCONTRARON DETALLES EN LA PETICIÓN', logId);
            }
        }

        /***
        * @param {Object} data
        * @param {Number} data.totalPagado monto de pago
        * @param {String} data.fecha fecha de contabilización
        * @param response
        * @param {Number} response.code
        * @param {Array} response.Info
        */
        function polizaIntegrantes(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (data.idNotificacion.length > 0) {
                let mandatoryFields = ['totalPagado', 'fecha',];
                checkMandatoryFields(data, mandatoryFields, response);
                checkMandatoryFieldsDate(data, ['fecha'], response);
            } else {
                response.code = 400;
                response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
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
        * 
        * 
        */
        function actualizaContrato(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            try {
                if (data.idNotificacion.length > 0) {
                    let folioId = recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', data.folio);
                    if (folioId) {
                        if (data.pagoCon && ['1', '2'].indexOf(data.pagoCon + '') == -1) {
                            response.code = 400;
                            response.info.push('ID DE pagoCon NO VÁLIDO: ' + data.pagoCon);
                        }
                        if (data.estado && ['1', '2', '3', '4'].indexOf(data.estado + '') == -1) {
                            response.code = 400;
                            response.info.push('ID DE estatus NO VÁLIDO: ' + data.estado);
                        }
                        if (data.subestado && ['1', '2', '3', '4', '5', '6', '7', '8', ''].indexOf(data.subestado + '') == -1) {
                            response.code = 400;
                            response.info.push('ID DE sub estatus NO VÁLIDO: ' + data.subestado);
                        }
                        checkMandatoryFieldsDate(data, ['fechaContrato', 'fechaRecepcion'], response);
                        if (data.cliente && !util.isObject(data.cliente)) {
                            response.code = 400;
                            response.info.push('ESTRUCTURA NODO cliente INCORRECTA');
                        } else if (data.cliente) {
                            let mandatoryFieldsCliente = ['nombre', 'rfc'];
                            if (data.cliente.esPersona) {
                                mandatoryFieldsCliente.push('apellidoPaterno');
                                mandatoryFieldsCliente.push('apellidoMaterno');
                            }
                            checkMandatoryFieldsDate(data.cliente, ['fechaNacimiento'], response);
                            checkMandatoryFields(data.cliente, mandatoryFieldsCliente, response);
                            if (Object.getOwnPropertyNames(data.cliente).indexOf('esPersona') != -1 && !util.isBoolean(data.cliente.esPersona)) {
                                response.code = 400;
                                response.info.push('CAMPO esPersona NO ES VALOR BOOLEANO');
                            }
                            if (Object.getOwnPropertyNames(data.cliente).indexOf('sexo') != -1 && !util.isBoolean(data.cliente.sexo)) {
                                response.code = 400;
                                response.info.push('CAMPO sexo NO ES VALOR BOOLEANO');
                            }
                            if (data.cliente.direccion && !util.isObject(data.cliente.direccion)) {
                                response.code = 400;
                                response.info.push('ESTRUCTURA NODO direccion INCORRECTA');
                            } else if (data.cliente.direccion) {
                                let mandatoryFieldsDireccion = ['calle', 'colonia', 'estado', 'cp'];
                                checkMandatoryFields(data.cliente.direccion, mandatoryFieldsDireccion, response);
                            }
                        }
                        if (data.grupo && !util.isObject(data.grupo)) {
                            response.code = 400;
                            response.info.push('ESTRUCTURA NODO grupo INCORRECTA');
                        } else if (data.grupo) {
                            let mandatoryFieldsGrupo = ['id', 'nombre'];
                            checkMandatoryFields(data.grupo, mandatoryFieldsGrupo, response);
                            checkMandatoryFieldsDate(data.grupo, ['finVigencia'], response);
                        }
                    } else {
                        folioId = recordFind('customrecord_cseg_folio_conauto', 'is', 'name', data.folio);
                        if (folioId) {
                            if (data.pagoCon && ['1', '2'].indexOf(data.pagoCon + '') == -1) {
                                response.code = 400;
                                response.info.push('ID DE pagoCon NO VÁLIDO: ' + data.pagoCon);
                            }
                            if (data.estado && ['1', '2', '3', '4'].indexOf(data.estado + '') == -1) {
                                response.code = 400;
                                response.info.push('ID DE estatus NO VÁLIDO: ' + data.estado);
                            }
                            if (data.subestado && ['1', '2', '3', '4', '5', '6', '7', '8', ''].indexOf(data.subestado + '') == -1) {
                                response.code = 400;
                                response.info.push('ID DE sub estatus NO VÁLIDO: ' + data.subestado);
                            }
                            checkMandatoryFieldsDate(data, ['fechaContrato', 'fechaRecepcion'], response);
                            if (data.cliente && !util.isObject(data.cliente)) {
                                response.code = 400;
                                response.info.push('ESTRUCTURA NODO cliente INCORRECTA');
                            } else if (data.cliente) {
                                let mandatoryFieldsCliente = ['nombre', 'rfc'];
                                if (data.cliente.esPersona) {
                                    mandatoryFieldsCliente.push('apellidoPaterno');
                                    mandatoryFieldsCliente.push('apellidoMaterno');
                                }
                                checkMandatoryFieldsDate(data.cliente, ['fechaNacimiento'], response);
                                checkMandatoryFields(data.cliente, mandatoryFieldsCliente, response);
                                if (Object.getOwnPropertyNames(data.cliente).indexOf('esPersona') != -1 && !util.isBoolean(data.cliente.esPersona)) {
                                    response.code = 400;
                                    response.info.push('CAMPO esPersona NO ES VALOR BOOLEANO');
                                }
                                if (Object.getOwnPropertyNames(data.cliente).indexOf('sexo') != -1 && !util.isBoolean(data.cliente.sexo)) {
                                    response.code = 400;
                                    response.info.push('CAMPO sexo NO ES VALOR BOOLEANO');
                                }
                                if (data.cliente.direccion && !util.isObject(data.cliente.direccion)) {
                                    response.code = 400;
                                    response.info.push('ESTRUCTURA NODO direccion INCORRECTA');
                                } else if (data.cliente.direccion) {
                                    let mandatoryFieldsDireccion = ['calle', 'colonia', 'estado', 'cp'];
                                    checkMandatoryFields(data.cliente.direccion, mandatoryFieldsDireccion, response);
                                }
                            }
                            if (data.grupo && !util.isObject(data.grupo)) {
                                response.code = 400;
                                response.info.push('ESTRUCTURA NODO grupo INCORRECTA');
                            } else if (data.grupo) {
                                let mandatoryFieldsGrupo = ['id', 'nombre'];
                                checkMandatoryFields(data.grupo, mandatoryFieldsGrupo, response);
                                checkMandatoryFieldsDate(data.grupo, ['finVigencia'], response);
                            }
                        } else {
                            response.code = 400;
                            response.info.push('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID O NAME, VERIFICA EL REGISTRO DEL FOLIO');
                            handlerErrorLogRequest('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID, VERIFICA EL REGISTRO DEL FOLIO', logId);
                        }
                    }
                } else {
                    response.code = 400;
                    response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                    handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }
        }

        function pagoUnidad(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            let folioId = '';
            try {
                if (data.idNotificacion.length > 0) {
                    folioId = recordFind('customrecord_cseg_folio_conauto', 'anyof', 'externalid', data.folio);
                    if (folioId) {
                        let mandatoryFields = ['folio', 'folioFactura', 'factura', 'cartaCredito', 'diferenciaCCVF', 'bid', 'vehiculoEnt', 'totalPagar'];
                        checkMandatoryFields(data, mandatoryFields, response);
                    } else {
                        response.code = 400;
                        response.info.push('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID O NAME, VERIFICA EL REGISTRO DEL FOLIO');
                        handlerErrorLogRequest('EL FOLIO: ' + data.folio + ' NO SE ENCUENTRA CON ESE EXTERNAL ID, VERIFICA EL REGISTRO DEL FOLIO', logId);
                    }
                } else {
                    response.code = 400;
                    response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                    handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
                }
            } catch (e) {
                response.code = 400;
                response.info.push(e);
                handlerErrorLogRequest(e, logId);
            }

        }

        function interesesMoratorios(data, response) {
            let logId = null;
            logId = createLog(data, response);
            response.logId = logId;
            if (data.idNotificacion.length > 0) {
                let mandatoryFields = ["idNotificacion", "tipo", "fecha", "monto",];
                checkMandatoryFields(data, mandatoryFields, response);
                checkMandatoryFieldsDate(data, ["fecha"], response);
            }
            else {
                response.code = 400;
                response.info.push('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN');
                handlerErrorLogRequest('NO SE ENCONTRÓ VALOR PARA ID NOTIFICACIÓN', logId);
            }

        }

        function createLog(data, response) {
            let logId = null;
            try {
                //Creación del log
                let logRecord = record.create({
                    type: 'customrecord_log_service_conauto'
                });
                //Tipo de Operación
                if (data.tipo) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_type',
                        value: data.tipo
                    });
                }
                //Id Notificación
                if (data.idNotificacion) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_idnot',
                        value: data.idNotificacion
                    });
                }
                //Numero de Pagos recibidos
                if (data.pagos && data.pagos.length > 0) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_length',
                        value: data.pagos.length
                    });
                }
                //Recibido en Netsuite
                logRecord.setValue({
                    fieldId: 'custrecord_log_serv_success',
                    value: true
                });
                //Solicitud
                const dateNow = new Date().getTime();
                let requestFile = file.create({
                    name: 'REQ_' + dateNow + '.json',
                    contents: JSON.stringify(data),
                    fileType: file.Type.JSON,
                    folder: 12362
                });
                let requestFileId = requestFile.save();
                //Respuesta
                let responseFile = file.create({
                    name: 'RES_' + dateNow + '.json',
                    contents: JSON.stringify(response),
                    fileType: file.Type.JSON,
                    folder: 12363
                });
                let responseFileId = responseFile.save();
                if (requestFileId && responseFileId) {
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_request',
                        value: requestFileId
                    });
                    logRecord.setValue({
                        fieldId: 'custrecord_log_serv_response',
                        value: responseFileId
                    });
                }
                //Guardar Log
                logId = logRecord.save();
            } catch (e) {
                response.code = 500;
                response.info.push('ERROR CREATE LOG REQUEST: ' + e.message.toString());
                handlerErrorLogRequest('ERROR CREATE LOG REQUEST: ' + e.message.toString(), logId);
            }
            return logId;
        }

        function checkMandatoryFields(data, mandatoryFields, response, line) {
            for (let i = 0; i < mandatoryFields.length; i++) {
                let field = mandatoryFields[i];
                let value = data[field];
                if (!(value || parseFloat(value) === 0 || util.isBoolean(value))) {
                    response.code = 302;
                    response.info.push((line ? ('LÍNEA ' + line + ': ') : '') + 'EL CAMPO ' + field + ' NO DEBE ESTAR VACÍO');
                }
            }
        }

        function checkMandatoryFieldsDate(data, mandatoryFields, response, line) {
            for (let i = 0; i < mandatoryFields.length; i++) {
                let field = mandatoryFields[i];
                let value = data[field] || '';
                log.debug('value', value);
                if (!validarFecha(value) && value) {
                    response.code = 310;
                    response.info.push((line ? ('LÍNEA ' + line + ': ') : '') + 'EL CAMPO ' + field + ' NO TIENE UN FORMATO DE FECHA VÁLIDO: DD/MM/YYYY');
                }
            }
        }

        function validarFecha(fecha) {
            // Utilizamos una expresión regular para verificar el formato DD/MM/YYYY
            let patronFecha = /^\d{2}\/\d{2}\/\d{4}$/;
            let estado = true;

            if (patronFecha.test(fecha)) {
                // Verificamos que el día, mes y año sean válidos
                let dia = parseInt(fecha.substring(0, 2), 10);
                let mes = parseInt(fecha.substring(3, 5), 10);
                let anio = parseInt(fecha.substring(6), 10);

                if (mes < 1 || mes > 12) {
                    estado = false;
                }

                let diasPorMes = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

                if (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0)) {
                    diasPorMes[2] = 29; // Si es año bisiesto, febrero tiene 29 días
                }

                if (dia < 1 || dia > diasPorMes[mes]) {
                    estado = false;
                }

                estado = true;
            } else {
                estado = false;
            }

            return estado;
        }

        function recordFind(recordType, operator, field, value) {
            let id = null;
            let results = search.searchAllRecords({
                type: recordType,
                filters: [
                    search.createFilter({
                        name: field,
                        operator: operator,
                        values: [value]
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'internalid'
                    })
                ]
            });
            if (results.length > 0) {
                id = results[0].getValue({
                    name: 'internalid'
                });
            }
            return id;
        }

        function handlerErrorLogRequest(e, logId) {
            if (logId) {
                log.error({
                    title: 'ERRORHANDLER',
                    details: 'LOG ID: ' + logId + ', ' + e
                });
                record.submitFields({
                    type: 'customrecord_log_service_conauto',
                    id: logId,
                    values: {
                        custrecord_log_serv_processed: true,
                        custrecord_log_serv_error: e
                    }
                })
            }
            return logId;
        }

        function successRequest(response) {
            if (response.code == 300) {
                response.code = 200;
                response.info.push('Petición Exitosa');
            }
        }

        return { post: postRequest }

    });